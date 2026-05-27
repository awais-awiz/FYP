"""
Stripe Payment Service.

Hardened: webhook verification fails closed (no plain-JSON fallback).
The simulated path is only reachable when STRIPE_SECRET_KEY is unset/placeholder
AND the caller is running with ENV != production (enforced in routes/stripe_payments).
"""
import base64
import io
import qrcode
import stripe
from app.config import settings

def _get_stripe_client():
    """Initialize Stripe with secret key from config."""
    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe

def _stripe_is_simulated() -> bool:
    """Check if we should run in mock/simulation mode."""
    return (
        not settings.STRIPE_SECRET_KEY
        or settings.STRIPE_SECRET_KEY.startswith("sk_test_placeholder")
    )

async def create_payment_intent(
    amount_dollars: float,
    currency: str,
    order_id: str,
    table_number: int | None = None,
    description: str | None = None,
) -> dict:
    """Create a Stripe PaymentIntent. Returns simulated payload if no key is found."""
    
    if _stripe_is_simulated():
        if settings.is_production:
            raise RuntimeError("Stripe is not configured; refusing simulated payment in production")
            
        simulated_id = f"pi_sim_{order_id.replace('-', '_').lower()}"
        payment_url = f"http://localhost:8000/api/stripe/simulate?order_id={order_id}&amount={amount_dollars}"
        qr_b64 = _generate_qr_base64(payment_url)
        return {
            "payment_intent_id": simulated_id,
            "client_secret": f"{simulated_id}_secret_simulated",
            "amount": amount_dollars,
            "currency": currency,
            "status": "requires_payment_method",
            "order_id": order_id,
            "qr_code_base64": qr_b64,
            "payment_url": payment_url,
            "simulated": True,
        }

    try:
        _get_stripe_client()
        amount_cents = int(round(amount_dollars * 100))
        intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency=currency.lower(),
            description=description or f"S.A.F.E Table Order {order_id}",
            metadata={
                "order_id": order_id,
                "table_number": str(table_number) if table_number else "",
            },
        )
        payment_url = f"https://checkout.stripe.com/pay/{intent['id']}"
        qr_b64 = _generate_qr_base64(payment_url)
        return {
            "payment_intent_id": intent["id"],
            "client_secret": intent["client_secret"],
            "amount": amount_dollars,
            "currency": currency,
            "status": intent["status"],
            "order_id": order_id,
            "qr_code_base64": qr_b64,
            "payment_url": payment_url,
            "simulated": False,
        }
    except stripe.error.StripeError as e:
        raise Exception(f"Stripe error: {str(e)}")

def verify_webhook(payload: bytes, sig_header: str) -> dict:
    """Verify a Stripe webhook signature. Fails closed."""
    secret = settings.STRIPE_WEBHOOK_SECRET
    if not secret or secret.startswith("whsec_placeholder"):
        raise ValueError("STRIPE_WEBHOOK_SECRET is not configured; refusing to process")

    try:
        _get_stripe_client()
        event = stripe.Webhook.construct_event(payload, sig_header, secret)
        return dict(event)
    except stripe.error.SignatureVerificationError:
        raise ValueError("Invalid Stripe webhook signature")

_MAX_QR_BYTES = 2048

def _generate_qr_base64(data: str) -> str:
    """Render data as a base64 PNG QR code."""
    if not isinstance(data, str):
        raise ValueError("QR data must be a string")
    encoded = data.encode("utf-8")
    if len(encoded) > _MAX_QR_BYTES:
        raise ValueError(f"QR data exceeds {_MAX_QR_BYTES} bytes")

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")