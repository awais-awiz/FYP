from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class AdminCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=1)
    role: str = Field("admin")  # admin, kitchen_staff


class AdminLogin(BaseModel):
    username: str
    password: str


class AdminResponse(BaseModel):
    id: str = Field(..., alias="_id")
    username: str
    full_name: str
    role: str
    created_at: datetime

    class Config:
        populate_by_name = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str


class DashboardStats(BaseModel):
    total_orders_today: int = 0
    active_orders: int = 0
    completed_orders_today: int = 0
    total_revenue_today: float = 0.0
    total_menu_items: int = 0
    average_rating: float = 0.0
    active_tables: int = 0
