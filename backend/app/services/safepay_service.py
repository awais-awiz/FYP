import hashlib
import hmac
import httpx
from typing import Dict, Any

from app.config import settings

SAFEPAY_API_BASE = (
    "https://sandbox.api.getsafepay.com" 
    if settings.SAFEPAY_ENVIRONMENT == "sandbox" 
    else "https://api.getsafepay.com"
)

async def init_safepay_payment(amount_pkr: float, order_id: str) -> Dict[str, Any]:
    """
    Initializes a Safepay order (Tracker) and returns the checkout URL.
    """
    url = f"{SAFEPAY_API_BASE}/order/v1/init"
    payload = {
        "client": settings.SAFEPAY_API_KEY,
        "amount": amount_pkr,
        "currency": "PKR",
        "environment": settings.SAFEPAY_ENVIRONMENT,
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        
        token = data.get("data", {}).get("token")
        if not token:
            raise ValueError("Safepay failed to return a tracker token.")
            
        # The checkout page URL that we will encode into a QR code
        # You can adjust redirect_url and cancel_url to point back to your actual frontend domain
        checkout_url = (
            f"{SAFEPAY_API_BASE}/checkout?env={settings.SAFEPAY_ENVIRONMENT}"
            f"&beacon={token}&source=custom&order_id={order_id}"
            f"&redirect_url={settings.FRONTEND_URL}/success&cancel_url={settings.FRONTEND_URL}/checkout"
        )
        
        return {
            "tracker": token,
            "checkout_url": checkout_url
        }

def verify_safepay_webhook(payload: bytes, signature: str) -> bool:
    """
    Verifies the webhook signature from Safepay.
    """
    if not settings.SAFEPAY_WEBHOOK_SECRET:
        # If no secret is set, we skip verification (for dev testing only)
        return True
        
    expected_mac = hmac.new(
        settings.SAFEPAY_WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha512
    ).hexdigest()
    
    return hmac.compare_digest(expected_mac, signature)
