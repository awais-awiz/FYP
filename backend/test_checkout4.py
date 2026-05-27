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
        r = await client.post(url, json=payload)
        token = r.json()["data"]["token"]
        
        # Test the sandbox checkout url
        url2 = f"https://sandbox.api.getsafepay.com/checkout/pay?env=sandbox&tracker={token}"
        r2 = await client.get(url2, follow_redirects=True)
        html = r2.text
        
        if "<title>" in html:
            title = html.split("<title>")[1].split("</title>")[0]
            print("Sandbox Checkout Title:", title)
            
        if "safepay" in html.lower():
            print("Safepay found in HTML")
            
        if "{" in html and "}" in html:
            # maybe it's returning JSON?
            print("It might be JSON response.")

asyncio.run(test())
