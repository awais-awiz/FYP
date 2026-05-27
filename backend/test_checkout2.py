import asyncio
import httpx

async def test_checkout():
    url = "https://sandbox.api.getsafepay.com/order/v1/init"
    payload = {
        "client": "sec_dba6e2fb-5ec7-45f8-9443-431ec7d13ded",
        "amount": 500.0,
        "currency": "PKR",
        "environment": "sandbox"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload)
        token = response.json().get("data", {}).get("token")
        
        # Test 1
        url1 = f"https://getsafepay.com/checkout/pay?env=sandbox&tracker={token}&source=custom"
        print("URL1:", url1)
        r1 = await client.get(url1, follow_redirects=True)
        print("URL1 Status:", r1.status_code)
        
        # Test 2
        url2 = f"https://sandbox.api.getsafepay.com/components?env=sandbox&tracker={token}&source=custom"
        print("URL2:", url2)
        r2 = await client.get(url2, follow_redirects=True)
        print("URL2 Status:", r2.status_code)

asyncio.run(test_checkout())
