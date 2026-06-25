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
        
        # -> Open the AI Assistant chat by clicking the 'Open AI Assistant' button so the chat panel becomes visible.
        # Open AI Assistant button
        elem = page.get_by_role('button', name='Open AI Assistant', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Send message' button in the chat panel without typing anything to confirm the UI prevents submitting an empty message or shows a validation state.
        # Send message button
        elem = page.get_by_role('button', name='Send message', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify an empty message validation state is shown
        # Assert: The Send message button is disabled when the input is empty.
        await expect(page.locator("xpath=/html/body/div[1]/div/div/div/div/div/div[3]/button").nth(0)).to_have_attribute("disabled", "", timeout=15000), "The Send message button is disabled when the input is empty."
        # Assert: The chat input is empty (no message entered).
        await expect(page.locator("xpath=/html/body/div[1]/div/div/div/div/div/div[3]/textarea").nth(0)).to_have_value("", timeout=15000), "The chat input is empty (no message entered)."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    