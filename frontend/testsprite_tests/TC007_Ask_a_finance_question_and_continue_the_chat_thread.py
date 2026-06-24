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
        await page.goto("http://localhost:4173")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Click the 'Start Your Optimization' button to open the financial input / onboarding form or flow.
        # bolt Start Your Optimization button
        elem = page.get_by_role('button', name='bolt Start Your Optimization', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill '80000' into the Monthly Net Income field, fill '45000' into the Monthly Expenses field, then click the 'Add Debt' button to open debt entry controls.
        # 80,000 number field
        elem = page.locator('[id="income"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("80000")
        
        # -> Fill '80000' into the Monthly Net Income field, fill '45000' into the Monthly Expenses field, then click the 'Add Debt' button to open debt entry controls.
        # 45,000 number field
        elem = page.locator('[id="expenses"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("45000")
        
        # -> Fill '80000' into the Monthly Net Income field, fill '45000' into the Monthly Expenses field, then click the 'Add Debt' button to open debt entry controls.
        # add Add Debt button
        elem = page.get_by_role('button', name='add Add Debt', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the debt row fields by entering a balance into the 'Balance' field, APR into the 'APR %' field, and Min EMI into the 'Min EMI' field, then click the 'Add Investment' button to reveal tax investment inputs.
        # number field
        elem = page.locator('xpath=/html/body/div/div/main/div/div[2]/div/form/div[2]/div[4]/div[2]/div[2]/div/input')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("200000")
        
        # -> Fill the debt row fields by entering a balance into the 'Balance' field, APR into the 'APR %' field, and Min EMI into the 'Min EMI' field, then click the 'Add Investment' button to reveal tax investment inputs.
        # number field
        elem = page.locator('xpath=/html/body/div/div/main/div/div[2]/div/form/div[2]/div[4]/div[2]/div[2]/input[2]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("18")
        
        # -> Fill the debt row fields by entering a balance into the 'Balance' field, APR into the 'APR %' field, and Min EMI into the 'Min EMI' field, then click the 'Add Investment' button to reveal tax investment inputs.
        # number field
        elem = page.locator('xpath=/html/body/div/div/main/div/div[2]/div/form/div[2]/div[4]/div[2]/div[2]/div[2]/input')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("5000")
        
        # -> Fill the debt row fields by entering a balance into the 'Balance' field, APR into the 'APR %' field, and Min EMI into the 'Min EMI' field, then click the 'Add Investment' button to reveal tax investment inputs.
        # add Add Investment button
        elem = page.get_by_role('button', name='add Add Investment', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill '50,000' into the Amount field under 'Tax Investments' and click the 'Analyze & Optimize Capital' button to submit the financial snapshot for analysis.
        # number field
        elem = page.locator('xpath=/html/body/div/div/main/div/div[2]/div/form/div[2]/div[5]/div[2]/div[3]/div/input')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("50000")
        
        # -> Fill '50,000' into the Amount field under 'Tax Investments' and click the 'Analyze & Optimize Capital' button to submit the financial snapshot for analysis.
        # bolt Analyze & Optimize Capital button
        elem = page.get_by_role('button', name='bolt Analyze & Optimize Capital', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the financial assistant chat panel by clicking the 'AI Agent' button in the header.
        # smart_toy AI Agent button
        elem = page.get_by_role('button', name='smart_toy AI Agent', exact=True)
        await elem.click(timeout=10000)
        
        # -> Type a finance question into the 'Ask a question about your finances...' input and click the 'Send message' (paper plane) button to submit the initial question.
        # Ask a question about your finances... text area
        elem = page.get_by_placeholder('Ask a question about your finances...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Given my profile (monthly net income 80,000, monthly expenses 45,000, debt 200,000 at 18% APR, tax investments 50,000), what high-level steps should be taken to reduce my tax liability this year?")
        
        # -> Type a finance question into the 'Ask a question about your finances...' input and click the 'Send message' (paper plane) button to submit the initial question.
        # Send message button
        elem = page.get_by_role('button', name='Send message', exact=True)
        await elem.click(timeout=10000)
        
        # -> Type a follow-up finance question into the chat input asking for concrete tax-saving instruments and their implementation priority, then click the 'Send message' (paper plane) button to attempt to get an assistant response.
        # Ask a question about your finances... text area
        elem = page.get_by_placeholder('Ask a question about your finances...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Follow-up: Please suggest concrete tax-saving instruments or deductions applicable to my profile (India), and list them in priority order with brief rationale for each.")
        
        # -> Type a follow-up finance question into the chat input asking for concrete tax-saving instruments and their implementation priority, then click the 'Send message' (paper plane) button to attempt to get an assistant response.
        # Send message button
        elem = page.get_by_role('button', name='Send message', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the chat conversation shows assistant responses
        # Assert: Expected the assistant to reply with high-level steps to reduce your tax liability.
        await expect(page.locator("xpath=/html/body/div[1]/div/main/div/div[3]/div/div").nth(0)).to_contain_text("Here are the high-level steps to reduce your tax liability", timeout=15000), "Expected the assistant to reply with high-level steps to reduce your tax liability."
        # Assert: Expected the assistant to list tax-saving instruments in priority order.
        await expect(page.locator("xpath=/html/body/div[1]/div/main/div/div[3]/div/div").nth(0)).to_contain_text("Suggested tax-saving instruments in priority order", timeout=15000), "Expected the assistant to list tax-saving instruments in priority order."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    