from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class FeedbackCreate(BaseModel):
    order_id: Optional[str] = None
    table_number: int = Field(..., ge=1)
    text: str = Field(..., min_length=1, max_length=2000)
    rating: int = Field(..., ge=1, le=5)


class FeedbackResponse(BaseModel):
    id: str = Field(..., alias="_id")
    feedback_id: str
    order_id: Optional[str] = None
    table_number: int
    text: str
    rating: int
    sentiment: Optional[str] = None  # positive, neutral, negative (set by AI)
    created_at: datetime

    class Config:
        populate_by_name = True
