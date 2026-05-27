"""
Auth Routes - Unified Authentication + Customer Ticket Issuance.

Two distinct token types live here:
  - STAFF JWT: issued at /api/auth/login.
  - CUSTOMER TICKET: issued only by authenticated staff for table sessions.
"""

from datetime import datetime, timedelta
from typing import Callable, List

from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from passlib.exc import UnknownHashError
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings
from app.database import get_database
from app.models.user import PasswordChange, SignupRequest, UserLogin
from app.util import utcnow

router = APIRouter(prefix="/api/auth", tags=["Auth"])
security = HTTPBearer(auto_error=False)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
limiter = Limiter(key_func=get_remote_address)

VALID_ROLES = {"admin", "manager", "kitchen", "server", "cleaner", "staff"}
SIGNUP_ROLES = {"kitchen", "server", "cleaner", "manager", "staff"}

AUD_STAFF = "staff"
AUD_CUSTOMER = "customer"
CUSTOMER_TICKET_TTL = timedelta(hours=4)

# --- Staff token helpers ---

def create_access_token(data: dict) -> str:
    """Mint a staff JWT."""
    to_encode = data.copy()
    now = utcnow()
    to_encode["iat"] = int(now.timestamp())
    to_encode["exp"] = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode["aud"] = AUD_STAFF
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> dict:
    """Decode a STAFF JWT."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            audience=AUD_STAFF,
        )
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    
    if not payload.get("sub") or payload.get("role") not in VALID_ROLES:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token payload")
    return payload

async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    """Resolve the authenticated staff user."""
    token = credentials.credentials if credentials else None
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing Authorization header")
    payload = decode_token(token)
    db = get_database()
    user = await db.users.find_one({"username": payload["sub"]})
    
    if not user:
        # Fallback check for legacy admin collection if needed
        user = await db.admins.find_one({"username": payload["sub"]})
        
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account no longer exists")
    if not user.get("is_active", True):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is deactivated")

    return {
        "username": user["username"],
        "role": user["role"],
        "full_name": user.get("full_name"),
        "_id": str(user["_id"]),
    }

def require_roles(*allowed_roles: str) -> Callable:
    """Enforce Role Based Access Control."""
    allowed = set(allowed_roles)
    async def _dep(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in allowed:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient permissions")
        return user
    return _dep

# --- Customer Ticket helpers ---

def create_customer_ticket(table_number: int, session_id: str) -> str:
    """Mint a short-lived customer ticket."""
    now = utcnow()
    claims = {
        "sub": f"table:{table_number}",
        "table_number": int(table_number),
        "session_id": session_id,
        "iat": int(now.timestamp()),
        "exp": now + CUSTOMER_TICKET_TTL,
        "aud": AUD_CUSTOMER,
    }
    return jwt.encode(claims, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

# --- Timing-flat helper ---

_DUMMY_HASH = pwd_context.hash("dummy_password")

def _flat_time_miss(submitted_password: str) -> None:
    """Flatten timing to prevent user enumeration."""
    try:
        pwd_context.dummy_verify()
    except Exception:
        pwd_context.verify(submitted_password, _DUMMY_HASH)

# --- Endpoints ---

@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, credentials: UserLogin, response: Response):
    """Authenticate a staff member."""
    db = get_database()
    user = await db.users.find_one({"username": credentials.username})
    
    if not user:
        user = await db.admins.find_one({"username": credentials.username})

    if not user:
        _flat_time_miss(credentials.password)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")

    try:
        verified = pwd_context.verify(credentials.password, user.get("password_hash", ""))
    except (UnknownHashError, ValueError):
        verified = False

    if not verified:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")

    if not user.get("is_active", True):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account deactivated")

    token = create_access_token({"sub": user["username"], "role": user["role"]})
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=settings.is_production,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user["role"],
        "full_name": user.get("full_name"),
        "username": user["username"],
    }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current profile."""
    db = get_database()
    user = await db.users.find_one({"username": current_user["username"]})
    if not user:
        user = await db.admins.find_one({"username": current_user["username"]})
    
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    return {
        "_id": str(user["_id"]),
        "username": user["username"],
        "full_name": user["full_name"],
        "role": user["role"],
        "is_active": user.get("is_active", True)
    }

@router.post("/signup", status_code=201)
@limiter.limit("5/minute")
async def signup(request: Request, body: SignupRequest):
    """Public signup awaiting approval."""
    if body.role not in SIGNUP_ROLES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid role")

    db = get_database()
    if await db.users.find_one({"username": body.username}):
        raise HTTPException(status.HTTP_409_CONFLICT, "Username exists")

    approval_doc = {
        "kind": "signup",
        "status": "pending",
        "username": body.username,
        "full_name": body.full_name,
        "role": body.role,
        "password_hash": pwd_context.hash(body.password),
        "created_at": utcnow(),
    }
    await db.approvals.insert_one(approval_doc)
    return {"message": "Signup submitted for approval"}

@router.post("/change-password")
async def change_password(body: PasswordChange, current_user: dict = Depends(get_current_user)):
    """Change user password."""
    db = get_database()
    user = await db.users.find_one({"username": current_user["username"]})
    if not user:
        user = await db.admins.find_one({"username": current_user["username"]})
    
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Current password incorrect")

    try:
        verified = pwd_context.verify(body.current_password, user["password_hash"])
    except (UnknownHashError, ValueError):
        verified = False

    if not verified:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Current password incorrect")

    col = "users" if await db.users.find_one({"username": current_user["username"]}) else "admins"
    await db[col].update_one(
        {"username": current_user["username"]},
        {"$set": {
            "password_hash": pwd_context.hash(body.new_password),
            "updated_at": utcnow()
        }}
    )
    return {"message": "Password updated"}

@router.post("/logout")
async def logout(response: Response):
    """Clear the auth cookie (client still should discard its token)."""
    response.delete_cookie("access_token", path="/")
    return {"message": "Logged out"}

# --- Customer Ticket Verification (Required by Orders) ---

def verify_customer_ticket(token: str) -> dict:
    """Verify a CUSTOMER TICKET (issued for a table session)."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            audience=AUD_CUSTOMER,
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid or expired customer ticket"
        )

def require_customer_ticket(
    x_customer_ticket: str = Header(None, alias="X-Customer-Ticket")
) -> dict:
    """
    FastAPI Dependency to ensure a request comes from a valid table QR session.
    Used primarily in POST /api/orders.
    """
    if not x_customer_ticket:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Customer-Ticket header"
        )
    return verify_customer_ticket(x_customer_ticket)

def verify_customer_ticket_optional(
    x_customer_ticket: str = Header(None, alias="X-Customer-Ticket")
) -> dict | None:
    """Optional version of the customer ticket dependency."""
    if not x_customer_ticket:
        return None
    try:
        return verify_customer_ticket(x_customer_ticket)
    except HTTPException:
        return None