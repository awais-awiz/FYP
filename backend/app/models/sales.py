"""
Sales & Reporting Models
"""
from pydantic import BaseModel
from typing import List, Optional


class TopItem(BaseModel):
    name: str
    category: str
    total_sold: int
    total_revenue: float


class RevenuePoint(BaseModel):
    date: str   # YYYY-MM-DD
    revenue: float
    orders: int


class SalesSummaryResponse(BaseModel):
    period: str   # "today" | "week" | "month"
    total_orders: int
    total_revenue: float
    average_order_value: float
    completed_orders: int
    cancelled_orders: int
    average_rating: float
    top_category: Optional[str] = None


class TopItemsResponse(BaseModel):
    items: List[TopItem]
    total: int


class RevenueChartResponse(BaseModel):
    data: List[RevenuePoint]
    total_revenue: float
    total_orders: int
