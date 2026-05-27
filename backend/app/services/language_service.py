"""
Language Service — Multilingual Support
Supports: English (en), Urdu (ur), German (de)
Extendable to: French (fr), Spanish (es), Italian (it),
               Japanese (ja), Arabic (ar), Korean (ko), Russian (ru)
Uses Groq AI for translation/detection with rule-based fallback.
"""
from app.config import settings
import httpx
import re

# ─── Supported Languages ──────────────────────────────────────────────────

SUPPORTED_LANGUAGES = [
    {"code": "en", "name": "English",  "native_name": "English",    "is_available": True},
    {"code": "ur", "name": "Urdu",     "native_name": "اردو",       "is_available": True},
    {"code": "de", "name": "German",   "native_name": "Deutsch",    "is_available": True},
    {"code": "fr", "name": "French",   "native_name": "Français",   "is_available": False},
    {"code": "es", "name": "Spanish",  "native_name": "Español",    "is_available": False},
    {"code": "it", "name": "Italian",  "native_name": "Italiano",   "is_available": False},
    {"code": "ja", "name": "Japanese", "native_name": "日本語",      "is_available": False},
    {"code": "ar", "name": "Arabic",   "native_name": "العربية",    "is_available": False},
    {"code": "ko", "name": "Korean",   "native_name": "한국어",      "is_available": False},
    {"code": "ru", "name": "Russian",  "native_name": "Русский",    "is_available": False},
]

LANGUAGE_NAMES = {lang["code"]: lang["name"] for lang in SUPPORTED_LANGUAGES}


# ─── Groq Helper ──────────────────────────────────────────────────────────

async def _call_groq_raw(system_prompt: str, user_message: str) -> str:
    """Call Groq AI API. Returns empty string on failure."""
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
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user",   "content": user_message},
                    ],
                    "temperature": 0.1,
                    "max_tokens": 2000,
                },
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"⚠️ Groq API error (language service): {e}")
        return ""


# ─── Language Detection ───────────────────────────────────────────────────

# Simple rule-based Urdu detection (Unicode range for Urdu/Arabic script)
_URDU_PATTERN = re.compile(r'[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]')
# German-specific characters
_GERMAN_INDICATORS = ["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü", "ich", "und", "das", "ist", "ein"]


def _rule_based_detect(text: str) -> tuple[str, float]:
    """Simple rule-based language detection."""
    if _URDU_PATTERN.search(text):
        return "ur", 0.95

    lower = text.lower()
    german_score = sum(1 for w in _GERMAN_INDICATORS if w in lower)
    if german_score >= 2:
        return "de", 0.80

    return "en", 0.70


async def detect_language(text: str) -> dict:
    """
    Detect the language of the input text.
    Returns: {"detected_language": "en", "confidence": 0.9}
    """
    # Try rule-based first (fast path)
    code, confidence = _rule_based_detect(text)
    if confidence >= 0.9:
        return {"detected_language": code, "confidence": confidence}

    # Use Groq AI for better accuracy
    system_prompt = (
        "You are a language detection expert. "
        "Identify the language of the input text. "
        "Respond with ONLY the ISO 639-1 two-letter language code (e.g. en, ur, de, fr, es, it, ja, ar, ko, ru). "
        "No explanation, just the code."
    )
    result = await _call_groq_raw(system_prompt, text)
    if result:
        detected = result.strip().lower()[:2]
        if len(detected) == 2 and detected.isalpha():
            return {"detected_language": detected, "confidence": 0.90}

    return {"detected_language": code, "confidence": confidence}


# ─── Translation ──────────────────────────────────────────────────────────

async def translate_text(text: str, target_language: str, source_language: str = "auto") -> dict:
    """
    Translate text to the target language using Groq AI.
    Falls back to returning original text if translation fails.

    Returns:
        {
            "original_text": ...,
            "translated_text": ...,
            "source_language": ...,
            "target_language": ...,
            "success": True/False
        }
    """
    # Detect source language if not supplied
    if source_language == "auto" or not source_language:
        detected = await detect_language(text)
        source_language = detected["detected_language"]

    # No translation needed
    if source_language == target_language:
        return {
            "original_text": text,
            "translated_text": text,
            "source_language": source_language,
            "target_language": target_language,
            "success": True,
        }

    target_name = LANGUAGE_NAMES.get(target_language, target_language)
    source_name = LANGUAGE_NAMES.get(source_language, source_language)

    system_prompt = (
        f"You are a professional translator. "
        f"Translate the following text from {source_name} to {target_name}. "
        f"Return ONLY the translated text with no explanation, quotes, or extra formatting."
    )

    translated = await _call_groq_raw(system_prompt, text)

    if translated:
        return {
            "original_text": text,
            "translated_text": translated.strip(),
            "source_language": source_language,
            "target_language": target_language,
            "success": True,
        }

    # Fallback — return original
    return {
        "original_text": text,
        "translated_text": text,
        "source_language": source_language,
        "target_language": target_language,
        "success": False,
    }
