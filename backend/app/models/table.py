from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TableSession(BaseModel):
    table_number: int = Field(..., ge=1, le=50)
    session_id: str
    is_active: bool = True
    language: str = "en"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None


class TableSessionCreate(BaseModel):
    table_number: int = Field(..., ge=1, le=50)
    language: str = "en"


class TableSessionResponse(TableSession):
    id: str = Field(..., alias="_id")

    class Config:
        populate_by_name = True
