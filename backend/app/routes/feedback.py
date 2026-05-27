from fastapi import APIRouter, HTTPException, Depends, status
from app.database import get_database
from app.models.feedback import FeedbackCreate
from app.services.grok_service import analyze_sentiment
from app.routes.auth import require_roles
from app.util import utcnow
import uuid

router = APIRouter(prefix="/api/feedback", tags=["Feedback"])

@router.post("", status_code=201)
async def submit_feedback(feedback: FeedbackCreate):
    """Submit customer feedback with AI sentiment analysis."""
    db = get_database()

    # Analyze sentiment using Groq AI
    try:
        sentiment = await analyze_sentiment(feedback.text)
    except Exception:
        # Fallback if AI service is down
        sentiment = "neutral"

    feedback_dict = {
        "feedback_id": f"FB-{uuid.uuid4().hex[:8].upper()}",
        "order_id": feedback.order_id,
        "table_number": feedback.table_number,
        "text": feedback.text,
        "rating": feedback.rating,
        "sentiment": sentiment,
        "created_at": utcnow(),
    }

    result = await db.feedback.insert_one(feedback_dict)
    feedback_dict["_id"] = str(result.inserted_id)

    return feedback_dict

@router.get("")
async def get_all_feedback(
    limit: int = 50, 
    skip: int = 0,
    _: dict = Depends(require_roles("admin", "manager"))
):
    """Get all feedback (admin/manager only)."""
    db = get_database()
    feedbacks = []
    cursor = db.feedback.find().sort("created_at", -1).skip(skip).limit(limit)
    async for fb in cursor:
        fb["_id"] = str(fb["_id"])
        feedbacks.append(fb)

    total = await db.feedback.count_documents({})
    return {"feedback": feedbacks, "total": total}

@router.get("/stats")
async def get_feedback_stats(
    _: dict = Depends(require_roles("admin", "manager"))
):
    """Get feedback statistics (admin dashboard)."""
    db = get_database()

    total = await db.feedback.count_documents({})
    if total == 0:
        return {
            "total": 0,
            "average_rating": 0,
            "sentiment_breakdown": {"positive": 0, "neutral": 0, "negative": 0},
        }

    # Calculate average rating
    pipeline = [{"$group": {"_id": None, "avg_rating": {"$avg": "$rating"}}}]
    result = await db.feedback.aggregate(pipeline).to_list(1)
    avg_rating = round(result[0]["avg_rating"], 2) if result else 0

    # Sentiment breakdown
    positive = await db.feedback.count_documents({"sentiment": "positive"})
    neutral = await db.feedback.count_documents({"sentiment": "neutral"})
    negative = await db.feedback.count_documents({"sentiment": "negative"})

    return {
        "total": total,
        "average_rating": avg_rating,
        "sentiment_breakdown": {
            "positive": positive,
            "neutral": neutral,
            "negative": negative,
        },
    }