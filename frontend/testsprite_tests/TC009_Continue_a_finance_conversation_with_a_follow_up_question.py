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
        
        # -> Open the chat panel by clicking the 'Open AI Assistant' button in the bottom-right of the page so the message input field appears.
        # Open AI Assistant button
        elem = page.get_by_role('button', name='Open AI Assistant', exact=True)
        await elem.click(timeout=10000)
        
        # -> Type an initial finance question into the message field and click the 'Send message' button so the assistant receives the first message.
        # Ask a question about your finances... text area
        elem = page.get_by_placeholder('Ask a question about your finances...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("How can I reduce my monthly expenses and accelerate debt payoff?")
        
        # -> Type an initial finance question into the message field and click the 'Send message' button so the assistant receives the first message.
        # Send message button
        elem = page.get_by_role('button', name='Send message', exact=True)
        await elem.click(timeout=10000)
        
        # -> Type an initial finance question into the message field and click the 'Send message' button so the assistant receives the first message.
        # Ask a question about your finances... text area
        elem = page.get_by_placeholder('Ask a question about your finances...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("If I can free an extra \u20b95,000 per month, should I apply it to the highest-interest loan or split it across loans?")
        
        # -> Type an initial finance question into the message field and click the 'Send message' button so the assistant receives the first message.
        # Send message button
        elem = page.get_by_role('button', name='Send message', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the conversation thread shows the follow-up assistant response
        # Assert: The conversation shows the assistant reply 'I ran your analysis using the financial engine. Please refer to the Analysis tab for the complete results with exact figures.' after the follow-up question.
        await expect(page.locator("xpath=/html/body/div[1]").nth(0)).to_contain_text("I ran your analysis using the financial engine. Please refer to the Analysis tab for the complete results with exact figures.", timeout=15000), "The conversation shows the assistant reply 'I ran your analysis using the financial engine. Please refer to the Analysis tab for the complete results with exact figures.' after the follow-up question."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    