import asyncio
import httpx

async def test():
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
        
        url1 = f"https://getsafepay.com/checkout/pay?env=sandbox&tracker={token}&source=custom"
        r1 = await client.get(url1, follow_redirects=True)
        
        html = r1.text
        if "failed" in html.lower() or "error" in html.lower():
            print("Found error in HTML!")
            import re
            errors = re.findall(r'.{0,40}failed.{0,40}', html, re.IGNORECASE)
            for e in errors:
                print(">>", e.strip())
        else:
            print("No error found in HTML")

asyncio.run(test())
