import asyncio
import os
from dotenv import load_dotenv
import httpx

load_dotenv("backend/.env")

async def test_heygen(url):
    api_key = os.getenv("HEYGEN_API_KEY")
    headers = {"X-Api-Key": api_key}
    json_data = {
        "text": "Hello world",
        "voice_id": "1bd001e7e50f421d891986aad5158bc8",
    }
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, headers=headers, json=json_data)
        print(url, ":", resp.status_code, resp.text[:100])

async def main():
    await test_heygen("https://api.heygen.com/v1/tts")
    await test_heygen("https://api.heygen.com/v2/tts")
    # try auth with Bearer
    api_key = os.getenv("HEYGEN_API_KEY")
    headers = {"Authorization": f"Bearer {api_key}"}
    async with httpx.AsyncClient() as client:
        resp = await client.post("https://api.heygen.com/v1/tts", headers=headers, json={"text":"hi"})
        print("Bearer v1/tts :", resp.status_code, resp.text[:100])

asyncio.run(main())
