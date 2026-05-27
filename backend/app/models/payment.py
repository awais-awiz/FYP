from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class PaymentMethod(str, Enum):
    QR = "qr"
    NFC = "nfc"
    CASH = "cash"


class PaymentStatusEnum(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentCreate(BaseModel):
    order_id: str
    amount: float = Field(..., gt=0)
    method: PaymentMethod = PaymentMethod.QR


class PaymentResponse(BaseModel):
    id: str = Field(..., alias="_id")
    payment_id: str
    order_id: str
    amount: float
    method: PaymentMethod
    status: PaymentStatusEnum = PaymentStatusEnum.PENDING
    qr_code_data: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        use_enum_values = True


class PaymentConfirm(BaseModel):
    payment_id: str
