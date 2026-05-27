"""
Chatbot Service — AI Personalization
Wraps Groq AI for multi-turn, context-aware restaurant conversations.
Persists chat history in MongoDB (collection: chat_sessions).
"""
import httpx
import json
from datetime import datetime
from app.config import settings
from app.database import get_database


# ─── Groq AI Helper ───────────────────────────────────────────────────────

async def _call_groq(messages: list) -> str:
    """Call Groq AI with a messages array (multi-turn)."""
    if not settings.GROQ_API_KEY:
        return ""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                settings.GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.GROQ_MODEL,
                    "messages": messages,
                    "temperature": 0.6,
                    "max_tokens": 600,
                },
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"⚠️ Groq API error (chatbot): {e}")
        return ""


# ─── Chat History ─────────────────────────────────────────────────────────

async def get_chat_history(session_id: str) -> list:
    """Retrieve chat messages for a session from MongoDB."""
    db = get_database()
    session = await db.chat_sessions.find_one({"session_id": session_id})
    if not session:
        return []
    return session.get("messages", [])


async def save_message(session_id: str, role: str, content: str):
    """Append a message to the session's chat history in MongoDB."""
    db = get_database()
    message = {
        "role": role,
        "content": content,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await db.chat_sessions.update_one(
        {"session_id": session_id},
        {
            "$push": {"messages": message},
            "$setOnInsert": {
                "session_id": session_id,
                "created_at": datetime.utcnow(),
            },
            "$set": {"updated_at": datetime.utcnow()},
        },
        upsert=True,
    )


# ─── Main Chat Function ───────────────────────────────────────────────────

async def process_chat_message(
    session_id: str,
    user_message: str,
    language: str = "en",
    table_number: int = None,
    context: str = None,
) -> dict:
    """
    Process a chat message through Groq AI with full conversation context.

    Steps:
    1. Load last 10 messages from MongoDB (for multi-turn memory)
    2. Build Groq messages array with system prompt + history + new message
    3. Call Groq AI
    4. Persist user + assistant messages to MongoDB
    5. Return structured response

    Returns:
        {
            "success": True,
            "session_id": "...",
            "response": "AI response",
            "language_detected": "en",
            "intent": "order|recommendation|question|greeting|other",
            "suggestions": [...]
        }
    """
    db = get_database()

    # Load last 10 messages for context
    history = await get_chat_history(session_id)
    recent_history = history[-10:]  # Keep last 10 messages

    # Fetch available menu for context
    menu_text = ""
    try:
        items = []
        cursor = db.menu_items.find({"is_available": True})
        async for item in cursor:
            items.append(f"- {item['name']} (Rs. {int(item['price'])}) — {item['category']}")
        if items:
            menu_text = "\n".join(items[:15])  # Top 15 items for brevity
    except Exception:
        menu_text = "Menu unavailable"

    lang_name = {
        "en": "English", "ur": "Urdu", "de": "German",
        "fr": "French", "es": "Spanish", "it": "Italian",
        "ja": "Japanese", "ar": "Arabic", "ko": "Korean", "ru": "Russian",
    }.get(language, "English")

    system_content = f"""You are SAGE — the Smart AI Guide for S.A.F.E Table (Smart AI Fusion Experience Dining).
You are a helpful, friendly, and knowledgeable restaurant AI assistant.

CURRENT MENU (top items):
{menu_text}

YOUR CAPABILITIES:
- Answer questions about the menu, ingredients, allergens, and preparation
- Provide personalized food recommendations based on preferences
- Help customers decide what to order
- Assist with order-related questions
- Provide multilingual support

LANGUAGE: Respond in {lang_name}. If the customer switches language, follow along.
{f'TABLE: Customer is at Table {table_number}.' if table_number else ''}
{f'CONTEXT: {context}' if context else ''}

RESPONSE STYLE:
- Be conversational, warm, and concise (2-3 sentences max per response)
- Use the customer's name if they introduce themselves
- Suggest menu items naturally when relevant
- Always end with a helpful follow-up question or offer

Respond in JSON:
{{
    "response": "Your friendly response here",
    "intent": "order|recommendation|question|greeting|other",
    "language_detected": "{language}",
    "suggestions": ["suggestion1", "suggestion2"]
}}"""

    # Build messages array for multi-turn
    messages = [{"role": "system", "content": system_content}]
    for msg in recent_history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": user_message})

    # Call Groq
    ai_response = await _call_groq(messages)

    # Parse response
    parsed = None
    if ai_response:
        try:
            clean = ai_response.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[1].rsplit("```", 1)[0]
            parsed = json.loads(clean)
        except (json.JSONDecodeError, KeyError):
            parsed = None

    if not parsed:
        # Fallback for when Groq is unavailable
        parsed = _fallback_response(user_message, language)

    # Persist messages
    await save_message(session_id, "user", user_message)
    await save_message(session_id, "assistant", parsed.get("response", ""))

    return {
        "success": True,
        "session_id": session_id,
        "response": parsed.get("response", "Hello! I'm SAGE, your AI dining assistant. How can I help you today?"),
        "language_detected": parsed.get("language_detected", language),
        "intent": parsed.get("intent", "other"),
        "suggestions": parsed.get("suggestions", []),
    }


def _fallback_response(message: str, language: str) -> dict:
    """Simple rule-based fallback when Groq is unavailable."""
    lower = message.lower()

    if any(w in lower for w in ["hello", "hi", "hey", "salam", "hallo", "namaste"]):
        response = "Welcome to S.A.F.E Table! I'm SAGE, your AI dining assistant. What would you like today?"
        intent = "greeting"
    elif any(w in lower for w in ["menu", "food", "eat", "hungry", "order", "recommend"]):
        response = "We have a wonderful selection! Popular choices include Wagyu Steak, Truffle Risotto, and Butter Chicken. Would you like more details on any of these?"
        intent = "recommendation"
    elif any(w in lower for w in ["allergen", "vegetarian", "vegan", "gluten", "dairy"]):
        response = "We take dietary requirements very seriously. We have vegetarian options like Truffle Risotto and Penne Arrabbiata. Please let me know your specific restrictions!"
        intent = "question"
    elif any(w in lower for w in ["help", "what", "how", "can you"]):
        response = "I can help you with menu recommendations, dietary info, and more. What would you like to know?"
        intent = "question"
    else:
        response = "I'm here to help make your dining experience amazing! Ask me about our menu, recommendations, or anything else."
        intent = "other"

    return {
        "response": response,
        "intent": intent,
        "language_detected": language,
        "suggestions": ["Show me the menu", "What's popular today?", "I have dietary restrictions"],
    }
