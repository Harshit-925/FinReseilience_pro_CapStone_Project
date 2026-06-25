import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:3000")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Click the 'Open AI Assistant' button (the chat bubble in the bottom-right) to open the assistant chat panel and verify the chat input appears.
        # Open AI Assistant button
        elem = page.get_by_role('button', name='Open AI Assistant', exact=True)
        await elem.click(timeout=10000)
        
        # -> Type a finance question into the 'Ask a question about your finances...' field and click the Send button to submit it.
        # Ask a question about your finances... text area
        elem = page.get_by_placeholder('Ask a question about your finances...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("I have \u20b960,000 monthly income, \u20b935,000 monthly expenses, and \u20b92,00,000 credit card debt at 18% APR. If I can free up \u20b920,000/month, should I prioritize paying down the credit card or investing instead? Please advise.")
        
        # -> Type a finance question into the 'Ask a question about your finances...' field and click the Send button to submit it.
        # Send message button
        elem = page.get_by_role('button', name='Send message', exact=True)
        await elem.click(timeout=10000)
        
        # -> Type a finance question into the 'Ask a question about your finances...' field and click the Send button to submit it.
        # Ask a question about your finances... text area
        elem = page.get_by_placeholder('Ask a question about your finances...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("As a follow-up: if paying down the credit card is recommended, what order should debts be paid in and roughly how long will it take with \u20b920,000 extra monthly?")
        
        # -> Type a finance question into the 'Ask a question about your finances...' field and click the Send button to submit it.
        # Send message button
        elem = page.get_by_role('button', name='Send message', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the chat conversation shows assistant responses
        # Assert: The assistant reply 'I ran your analysis using the financial engine. Please refer to the Analysis tab for the complete results with exact figures.' is visible in the chat conversation.
        await expect(page.locator("xpath=/html/body/div[1]").nth(0)).to_contain_text("I ran your analysis using the financial engine. Please refer to the Analysis tab for the complete results with exact figures.", timeout=15000), "The assistant reply 'I ran your analysis using the financial engine. Please refer to the Analysis tab for the complete results with exact figures.' is visible in the chat conversation."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    