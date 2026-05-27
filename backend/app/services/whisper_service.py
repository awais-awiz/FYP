"""
Speech-to-Text Service.
Uses AssemblyAI when configured, otherwise falls back to Groq Whisper.
"""
import asyncio
import mimetypes
import httpx
from app.config import settings


def _guess_content_type(filename: str) -> str:
    content_type, _ = mimetypes.guess_type(filename)
    return content_type or "application/octet-stream"


async def _transcribe_with_assemblyai(audio_bytes: bytes) -> dict:
    api_key = getattr(settings, "ASSEMBLYAI_API_KEY", "")
    if not api_key:
        return {"text": "", "success": False, "error": "Missing ASSEMBLYAI_API_KEY"}

    headers = {"authorization": api_key}
    async with httpx.AsyncClient(timeout=60.0) as client:
        ur = await client.post("https://api.assemblyai.com/v2/upload", headers=headers, data=audio_bytes)
        ur.raise_for_status()

        tr = await client.post(
            "https://api.assemblyai.com/v2/transcript",
            headers=headers,
            json={"audio_url": ur.json()["upload_url"]},
        )
        tr.raise_for_status()

        poll_ep = f"https://api.assemblyai.com/v2/transcript/{tr.json()['id']}"
        while True:
            pr = await client.get(poll_ep, headers=headers)
            pr.raise_for_status()
            data = pr.json()

            if data["status"] == "completed":
                return {
                    "text": data.get("text", ""),
                    "language": data.get("language_code", "en"),
                    "success": True,
                }
            if data["status"] == "error":
                raise Exception(data.get("error", "Transcription failed"))
            await asyncio.sleep(1)


async def _transcribe_with_groq(audio_bytes: bytes, filename: str) -> dict:
    if not settings.GROQ_API_KEY:
        return {"text": "", "success": False, "error": "Missing GROQ_API_KEY"}

    headers = {"Authorization": f"Bearer {settings.GROQ_API_KEY}"}
    files = {
        "file": (filename or "audio.ogg", audio_bytes, _guess_content_type(filename or "audio.ogg"))
    }
    data = {"model": settings.GROQ_WHISPER_MODEL}

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            headers=headers,
            data=data,
            files=files,
        )
        resp.raise_for_status()
        payload = resp.json()
        text = payload.get("text", "")
        return {
            "text": text,
            "language": payload.get("language", "en"),
            "success": bool(text),
        }


async def transcribe_audio(audio_bytes: bytes, filename: str = "audio.webm") -> dict:
    try:
        if getattr(settings, "ASSEMBLYAI_API_KEY", ""):
            return await _transcribe_with_assemblyai(audio_bytes)
        if getattr(settings, "GROQ_API_KEY", ""):
            return await _transcribe_with_groq(audio_bytes, filename)
        return {"text": "", "success": False, "error": "No STT key configured"}
    except Exception as e:
        return {"text": "", "success": False, "error": str(e)}
