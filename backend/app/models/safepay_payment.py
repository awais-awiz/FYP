from pydantic import BaseModel
from typing import Optional

class SafepayPaymentCreate(BaseModel):
    order_id: str
    table_number: Optional[int] = None
    description: Optional[str] = "S.A.F.E Table Payment"
