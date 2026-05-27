from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum


class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY = "ready"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PaymentStatus(str, Enum):
    UNPAID = "unpaid"
    PAID = "paid"
    REFUNDED = "refunded"


class OrderItem(BaseModel):
    menu_item_id: str
    name: str
    price: float = Field(..., gt=0)
    quantity: int = Field(..., ge=1)
    special_instructions: Optional[str] = None


class OrderCreate(BaseModel):
    table_number: int = Field(..., ge=1)
    items: List[OrderItem] = Field(..., min_length=1)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderResponse(BaseModel):
    id: str = Field(..., alias="_id")
    order_id: str
    table_number: int
    items: List[OrderItem]
    total_price: float
    status: OrderStatus = OrderStatus.PENDING
    payment_status: PaymentStatus = PaymentStatus.UNPAID
    created_at: datetime
    updated_at: datetime
    estimated_ready_time: Optional[datetime] = None

    class Config:
        populate_by_name = True
        use_enum_values = True
