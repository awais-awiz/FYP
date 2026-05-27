import asyncio
import httpx

async def test():
    # Let's try passing 'source': 'custom' or 'intent': 'CYBERSOURCE' during init?
    url = "https://sandbox.api.getsafepay.com/order/v1/init"
    payload = {
        "client": "sec_dba6e2fb-5ec7-45f8-9443-431ec7d13ded",
        "amount": 500.0,
        "currency": "PKR",
        "environment": "sandbox"
    }
    async with httpx.AsyncClient() as client:
        # standard payload
        r1 = await client.post(url, json=payload)
        t1 = r1.json().get("data", {}).get("token")
        
        # let's try getting the checkout page for t1
        # and checking what the redirect headers are
        checkout_url = f"https://sandbox.api.getsafepay.com/components?env=sandbox&beacon={t1}&source=custom&order_id=test1&redirect_url=http://localhost:5173/&cancel_url=http://localhost:5173/"
        r_checkout = await client.get(checkout_url, follow_redirects=False)
        print("Components Checkout Status:", r_checkout.status_code)
        print("Components Checkout Location:", r_checkout.headers.get("Location"))
        
        # what about getsafepay.com/checkout/pay ?
        url2 = f"https://getsafepay.com/checkout/pay?env=sandbox&tracker={t1}&source=custom&order_id=test1&redirect_url=http://localhost:5173/&cancel_url=http://localhost:5173/"
        r_pay = await client.get(url2, follow_redirects=False)
        print("Pay Checkout Status:", r_pay.status_code)
        print("Pay Checkout Location:", r_pay.headers.get("Location"))

asyncio.run(test())
