"""
Task Models — for server and cleaner task management.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    assigned_to: str = Field(..., description="Username of the assigned staff member")
    role: str = Field(..., description="Target role: server | cleaner | kitchen")
    priority: TaskPriority = TaskPriority.MEDIUM
    table_number: Optional[int] = None
    due_time: Optional[str] = None


class TaskStatusUpdate(BaseModel):
    status: TaskStatus
    notes: Optional[str] = None


class TaskResponse(BaseModel):
    task_id: str
    title: str
    description: Optional[str] = None
    assigned_to: str
    role: str
    priority: str
    status: str
    table_number: Optional[int] = None
    due_time: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
