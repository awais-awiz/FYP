import asyncio
import httpx

async def test():
    url = "https://sandbox.api.getsafepay.com/order/v1/init"
    payload = {
        "client": "sec_dba6e2fb-5ec7-45f8-9443-431ec7d13ded",
        "amount": 500.0,
        "currency": "PKR",
        "environment": "sandbox",
        "redirect_url": "http://localhost:5173/checkout/success",
        "cancel_url": "http://localhost:5173/checkout/cancel",
        "order_id": "test1"
    }
    async with httpx.AsyncClient() as client:
        r = await client.post(url, json=payload)
        print("Status:", r.status_code)
        print("Response:", r.text)

asyncio.run(test())
