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
        data = response.json()
        token = data.get("data", {}).get("token")
        
        checkout_url = f"https://sandbox.getsafepay.com/checkout/pay?env=sandbox&tracker={token}&source=custom"
        print("Checkout URL:", checkout_url)
        
        # let's try a GET on the checkout URL
        r2 = await client.get(checkout_url, follow_redirects=True)
        if "Invalid" in r2.text or "Error" in r2.text:
            print("Found Error in HTML!")
            # just print a bit of it
            idx = r2.text.find("Error")
            if idx != -1:
                print(r2.text[max(0, idx-50):idx+200])
        else:
            print("No immediate error in HTML")

asyncio.run(test_checkout())
