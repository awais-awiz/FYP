"""
User / Staff Models
Covers all roles: admin, manager, kitchen, server, cleaner
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ─── Auth & Creation ──────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(..., description="admin | manager | kitchen | server | cleaner | staff")
    email: Optional[str] = None
    phone: Optional[str] = None


class UserLogin(BaseModel):
    username: str
    password: str


class SignupRequest(BaseModel):
    """
    Public signup — submits an approval request, not a user.
    Approval row is materialized into `users` only when an admin approves it.
    """
    full_name: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = None
    username: str = Field(..., min_length=3, max_length=50)
    phone: Optional[str] = None
    password: str = Field(..., min_length=6, max_length=128)
    role: str = Field(..., description="kitchen | server | cleaner | manager | staff")


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


# ─── Update ───────────────────────────────────────────────────────────────

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


# ─── Response ─────────────────────────────────────────────────────────────

class UserProfile(BaseModel):
    """Safe user profile (no password hash)."""
    id: str = Field(..., alias="_id")
    username: str
    full_name: str
    role: str
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True
    created_at: datetime

    class Config:
        populate_by_name = True