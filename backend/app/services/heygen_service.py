import base64
import io
import asyncio
from gtts import gTTS
from app.config import settings

def _generate_gtts_audio(text: str, lang: str = "en") -> dict:
    try:
        fp = io.BytesIO()
        tts = gTTS(text=text, lang=lang)
        tts.write_to_fp(fp)
        fp.seek(0)
        return {
            "audio_base64": base64.b64encode(fp.read()).decode(),
            "content_type": "audio/mpeg",
            "use_browser_tts": False,
        }
    except Exception as e:
        print(f"gTTS error: {e}")
        return {"audio_base64": None, "use_browser_tts": True}

async def text_to_speech(text: str, language: str = "en") -> dict:
    """Synthesize speech. Since HeyGen TTS endpoints are no longer public,
    this uses gTTS as a reliable, multilingual fallback."""
    if not isinstance(text, str) or not text.strip():
        return {"audio_base64": None, "use_browser_tts": True}
    
    # Map the language codes from the frontend to gTTS compatible codes if needed
    lang_map = {
        "en": "en", "ur": "ur", "de": "de", "es": "es", 
        "fr": "fr", "hi": "hi", "ko": "ko", "it": "it",
        "ar": "ar", "ru": "ru", "zh": "zh-CN", "ja": "ja"
    }
    tts_lang = lang_map.get(language, "en")
    
    return await asyncio.to_thread(_generate_gtts_audio, text[:1000], tts_lang)