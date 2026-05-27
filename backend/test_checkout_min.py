import asyncio
import httpx

async def test_checkout():
    url = "https://sandbox.api.getsafepay.com/order/v1/init"
    payload = {
        "client": "sec_dba6e2fb-5ec7-45f8-9443-431ec7d13ded",
        "amount": 5.0,
        "currency": "PKR",
        "environment": "sandbox"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload)
        print("Status:", response.status_code)
        print("Response:", response.text)

asyncio.run(test_checkout())
