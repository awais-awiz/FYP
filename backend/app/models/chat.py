"""
Chat / Chatbot Models
Used by the AI Personalization chatbot endpoint.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ChatRequest(BaseModel):
    """Incoming chat message from the customer."""
    session_id: str = Field(..., description="Unique session ID for this conversation")
    message: str = Field(..., min_length=1, max_length=2000)
    language: str = Field("en", description="Language code: en, ur, de, fr, es, it, ja, ar, ko, ru")
    table_number: Optional[int] = None
    context: Optional[str] = Field(None, description="Additional context (e.g. dietary preferences)")


class ChatMessage(BaseModel):
    """Single message in a chat history."""
    role: str = Field(..., description="user | assistant")
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ChatResponse(BaseModel):
    """Response from the AI chatbot."""
    success: bool = True
    session_id: str
    response: str
    language_detected: str = "en"
    intent: Optional[str] = None
    suggestions: Optional[List[str]] = None


class ChatHistoryResponse(BaseModel):
    """Full chat history for a session."""
    session_id: str
    messages: List[ChatMessage]
    total: int
