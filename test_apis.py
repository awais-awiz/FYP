import asyncio
import os
from dotenv import load_dotenv
import httpx
import base64

load_dotenv("backend/.env")

async def test_groq():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key: print("GROQ_API_KEY missing"); return
    
    # create dummy wav
    import wave
    with wave.open("test.wav", "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(44100)
        f.writeframes(b'\x00' * 44100)
    
    headers = {"Authorization": f"Bearer {api_key}"}
    files = {"file": ("test.wav", open("test.wav", "rb").read(), "audio/wav")}
    data = {"model": "whisper-large-v3"}
    
    async with httpx.AsyncClient() as client:
        resp = await client.post("https://api.groq.com/openai/v1/audio/transcriptions", headers=headers, data=data, files=files)
        print("Groq Response:", resp.status_code, resp.text)

async def test_heygen():
    api_key = os.getenv("HEYGEN_API_KEY")
    if not api_key: print("HEYGEN_API_KEY missing"); return
    
    headers = {"X-Api-Key": api_key}
    json_data = {
        "text": "Hello world",
        "voice_id": "1bd001e7e50f421d891986aad5158bc8",
        "output_format": "mp3"
    }
    
    async with httpx.AsyncClient() as client:
        resp = await client.post("https://api.heygen.com/v2/tts", headers=headers, json=json_data)
        print("Heygen Response:", resp.status_code, resp.text)

async def main():
    await test_groq()
    await test_heygen()

asyncio.run(main())
