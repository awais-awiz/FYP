"""
Voice Order Route — bound to a customer ticket.

The customer's ticket carries (table_number, session_id). Both come from
the ticket — never from the form body — so an attacker cannot place voice
orders on a table they don't occupy.
"""
from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.routes.auth import verify_customer_ticket
from app.services.grok_service import process_voice_order
from app.services.heygen_service import text_to_speech
from app.services.whisper_service import transcribe_audio
from app.websockets.kitchen import manager

router = APIRouter(prefix="/api/voice", tags=["Voice"])

_MAX_AUDIO_BYTES = 8 * 1024 * 1024
_MAX_TRANSCRIPT_LEN = 1000

@router.post("/order")
async def voice_order(
    customer_ticket: str = Form(...),
    audio: Optional[UploadFile] = File(None),
    transcript: Optional[str] = Form(None),
    language: str = Form("en"),
):
    """Place a voice order. Required: a valid customer_ticket form field."""
    # Security: Verify the ticket and extract the table/session info
    payload = verify_customer_ticket(customer_ticket)
    table_number: int = payload["table_number"]
    session_id: str = payload["session_id"]

    final_transcript = ""
    stt_error = None

    # ── Speech-to-text (when audio provided) ─────────────────────────────
    if audio and audio.filename:
        audio_bytes = await audio.read()
        if len(audio_bytes) > _MAX_AUDIO_BYTES:
            raise HTTPException(
                status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                f"Audio exceeds {_MAX_AUDIO_BYTES // (1024*1024)} MB",
            )
        
        if audio_bytes:
            stt_result = await transcribe_audio(audio_bytes, audio.filename)
            if stt_result.get("success"):
                final_transcript = stt_result.get("text", "")
            else:
                stt_error = stt_result.get("error")

    # Fallback to text transcript if audio STT failed or wasn't provided
    if not final_transcript and transcript:
        final_transcript = transcript

    if not final_transcript:
        detail = "No audio transcribed successfully"
        if stt_error:
            detail = f"{detail}. STT error: {stt_error}"
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail
        )

    # Sanitize input length
    final_transcript = final_transcript[:_MAX_TRANSCRIPT_LEN]

    # ── LLM order pipeline ──────────────────────────────────────────────
    groq_result = await process_voice_order(
        transcript=final_transcript,
        language=language,
        table_number=table_number,
        session_id=session_id,
    )

    # ── TTS Output (Best-effort — never fatal) ──────────────────────────
    try:
        tts_result = await text_to_speech(groq_result["response_text"], language=language)
    except Exception:
        tts_result = {"audio_base64": None, "use_browser_tts": True}

    # ── Kitchen Broadcast ───────────────────────────────────────────────
    if groq_result.get("order_placed") and groq_result.get("order_data"):
        await manager.broadcast_new_order(groq_result["order_data"])

    return {
        "success": groq_result.get("success", True),
        "transcript": final_transcript,
        "response_text": groq_result["response_text"],
        "order_placed": groq_result.get("order_placed", False),
        "order_id": groq_result.get("order_id"),
        "audio_base64": tts_result.get("audio_base64"),
        "audio_content_type": tts_result.get("content_type", "audio/mpeg"),
        "use_browser_tts": tts_result.get("use_browser_tts", True),
    }