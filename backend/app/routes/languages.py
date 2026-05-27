"""
Language / Multilingual Support Routes

Endpoints:
  GET  /api/languages              — list all supported languages
  POST /api/languages/detect       — detect language of input text
  POST /api/languages/translate    — translate text to target language

Supported languages (active): English (en), Urdu (ur), German (de)
Coming soon: French, Spanish, Italian, Japanese, Arabic, Korean, Russian

Example Request (translate):
  POST /api/languages/translate
  {"text": "Hello, I would like to order food.", "target_language": "ur"}

Example Response:
  {"original_text": "...", "translated_text": "...", "source_language": "en", "target_language": "ur", "success": true}
"""
from fastapi import APIRouter, HTTPException
from app.models.language import TranslationRequest, LanguageDetectRequest
from app.services.language_service import (
    detect_language,
    translate_text,
    SUPPORTED_LANGUAGES,
)

router = APIRouter(prefix="/api/languages", tags=["Languages"])


@router.get("")
async def list_languages():
    """
    List all supported languages with their codes and availability.
    Languages marked is_available=false are planned for future releases.
    """
    return {
        "languages": SUPPORTED_LANGUAGES,
        "active": [lang for lang in SUPPORTED_LANGUAGES if lang["is_available"]],
        "total": len(SUPPORTED_LANGUAGES),
    }


@router.post("/detect")
async def detect(request: LanguageDetectRequest):
    """
    Detect the language of the provided text.

    Example:
        POST /api/languages/detect
        {"text": "Mujhe ek pizza chahiye"}
        → {"detected_language": "ur", "confidence": 0.95}
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    result = await detect_language(request.text)
    return {
        "text": request.text,
        "detected_language": result["detected_language"],
        "confidence": result.get("confidence"),
        "success": True,
    }


@router.post("/translate")
async def translate(request: TranslationRequest):
    """
    Translate text from one language to another using Groq AI.

    Example:
        POST /api/languages/translate
        {"text": "Guten Abend!", "target_language": "en", "source_language": "de"}
        → {"translated_text": "Good evening!", ...}
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    result = await translate_text(
        text=request.text,
        target_language=request.target_language,
        source_language=request.source_language or "auto",
    )

    if not result["success"]:
        result["message"] = "Translation service unavailable. Returned original text."
    return result
