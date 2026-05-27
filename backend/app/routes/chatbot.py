"""
Chatbot / AI Personalization Routes
Powers the AIPersonalizationPage.jsx and any chat-enabled portal.

Endpoints:
  POST /api/chatbot/chat                   — send message, get AI response
  GET  /api/chatbot/history/{session_id}   — get chat history
  DELETE /api/chatbot/history/{session_id} — clear chat history
  POST /api/chatbot/recommendations        — get personalized menu recommendations

Example Request (chat):
  POST /api/chatbot/chat
  {"session_id": "table-1-2025", "message": "What do you recommend?", "language": "en", "table_number": 1}

Example Response:
  {"success": true, "session_id": "table-1-2025", "response": "I'd recommend the Wagyu Steak!", "intent": "recommendation", "suggestions": [...]}
"""
from fastapi import APIRouter, HTTPException
from app.models.chat import ChatRequest
from app.services.chatbot_service import process_chat_message, get_chat_history
from app.services.grok_service import get_ai_recommendations
from app.database import get_database
from datetime import datetime

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])


@router.post("/chat")
async def chat(request: ChatRequest):
    """
    Send a message to the AI chatbot and get a response.
    Maintains conversation history per session_id.

    Supported languages: en, ur, de (and more via config)
    """
    try:
        result = await process_chat_message(
            session_id=request.session_id,
            user_message=request.message,
            language=request.language,
            table_number=request.table_number,
            context=request.context,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot error: {str(e)}")


@router.get("/history/{session_id}")
async def get_history(session_id: str, limit: int = 50):
    """
    Get the chat history for a session.

    Example: GET /api/chatbot/history/table-1-2025
    """
    messages = await get_chat_history(session_id)
    # Apply limit
    messages = messages[-limit:]
    return {
        "session_id": session_id,
        "messages": messages,
        "total": len(messages),
    }


@router.delete("/history/{session_id}")
async def clear_history(session_id: str):
    """Clear all chat messages for a session (e.g. when table session ends)."""
    db = get_database()
    await db.chat_sessions.delete_one({"session_id": session_id})
    return {"message": f"Chat history cleared for session '{session_id}'"}


@router.post("/recommendations")
async def get_recommendations(
    table_number: int,
    preferences: str = None,
):
    """
    Get AI-powered personalized menu recommendations.
    Uses order history + optional dietary preferences.

    Example:
        POST /api/chatbot/recommendations?table_number=1&preferences=vegetarian
    """
    db = get_database()

    # Gather order history for this table
    order_history = []
    cursor = db.orders.find({"table_number": table_number}).sort("created_at", -1).limit(10)
    async for order in cursor:
        for item in order.get("items", []):
            order_history.append(item.get("name", ""))

    # Get available menu
    menu_items = []
    cursor = db.menu_items.find({"is_available": True})
    async for item in cursor:
        menu_items.append({
            "name": item["name"],
            "price": item["price"],
            "category": item["category"],
            "description": item.get("description", ""),
            "is_vegetarian": item.get("is_vegetarian", False),
        })

    result = await get_ai_recommendations(
        menu_items=menu_items,
        order_history=order_history,
        preferences=preferences,
    )
    return result
