"""
Stripe Payment Models
"""
from pydantic import BaseModel, Field
from typing import Optional


class StripePaymentCreate(BaseModel):
    """Request to create a Stripe PaymentIntent."""
    order_id: str = Field(..., description="Internal order ID (e.g. ORD-XXX-YYYY)")
    amount: float = Field(..., gt=0, description="Amount in dollars (will be converted to cents)")
    currency: str = Field("usd", description="3-letter ISO currency code")
    table_number: Optional[int] = None
    description: Optional[str] = None


class StripePaymentResponse(BaseModel):
    """Response from creating a PaymentIntent."""
    payment_intent_id: str
    client_secret: str
    amount: float
    currency: str
    status: str
    order_id: str
    qr_code_base64: Optional[str] = None   # Base64 PNG of QR code
    payment_url: Optional[str] = None       # Stripe checkout URL


class StripeWebhookEvent(BaseModel):
    """Stripe webhook event payload (raw body processing)."""
    type: str
    data: dict
