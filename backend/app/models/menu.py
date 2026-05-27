from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from bson import ObjectId


class PyObjectId(str):
    """Custom type for MongoDB ObjectId serialization."""

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)


class MenuItemBase(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field("", max_length=1000)
    price: float = Field(..., gt=0)
    category: str = Field(..., min_length=1)
    image_url: Optional[str] = None
    model_3d_url: Optional[str] = None
    is_available: bool = True
    stock_quantity: int = Field(50, ge=0)
    allergens: List[str] = []
    prep_time_minutes: int = Field(15, ge=1)
    spice_level: Optional[int] = Field(None, ge=0, le=5)
    is_vegetarian: bool = False
    is_popular: bool = False


class MenuItemCreate(MenuItemBase):
    pass


class MenuItemUpdate(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    price: Optional[float] = Field(None, gt=0)
    category: Optional[str] = Field(None, min_length=1)
    image_url: Optional[str] = None
    model_3d_url: Optional[str] = None
    is_available: Optional[bool] = None
    stock_quantity: Optional[int] = Field(None, ge=0)
    allergens: Optional[List[str]] = None
    prep_time_minutes: Optional[int] = Field(None, ge=1)
    spice_level: Optional[int] = Field(None, ge=0, le=5)
    is_vegetarian: Optional[bool] = None
    is_popular: Optional[bool] = None


class MenuItemResponse(MenuItemBase):
    id: str = Field(..., alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    model_config = ConfigDict(
        populate_by_name=True,
        json_encoders={ObjectId: str},
        protected_namespaces=(),
    )
