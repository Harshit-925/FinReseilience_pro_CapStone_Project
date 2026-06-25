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
        
        # -> Click the 'Start Your Optimization' button to open the financial input form.
        # bolt Start Your Optimization button
        elem = page.get_by_role('button', name='bolt Start Your Optimization', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Add Debt' button to create a debt entry so its amount and payoff details can be filled.
        # add Add Debt button
        elem = page.get_by_role('button', name='add Add Debt', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill 'Monthly Net Income' with 80000, 'Monthly Expenses' with 45000, set the debt 'Balance' to 100000 and 'APR' to 18%, then click the 'Add Investment' button to open tax/investment input fields.
        # 80,000 number field
        elem = page.locator('[id="income"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("80000")
        
        # -> Fill 'Monthly Net Income' with 80000, 'Monthly Expenses' with 45000, set the debt 'Balance' to 100000 and 'APR' to 18%, then click the 'Add Investment' button to open tax/investment input fields.
        # 45,000 number field
        elem = page.locator('[id="expenses"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("45000")
        
        # -> Fill 'Monthly Net Income' with 80000, 'Monthly Expenses' with 45000, set the debt 'Balance' to 100000 and 'APR' to 18%, then click the 'Add Investment' button to open tax/investment input fields.
        # number field
        elem = page.locator('xpath=/html/body/div/div/main/div/div[2]/div/form/div[2]/div[4]/div[2]/div[2]/div/input')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("100000")
        
        # -> Fill 'Monthly Net Income' with 80000, 'Monthly Expenses' with 45000, set the debt 'Balance' to 100000 and 'APR' to 18%, then click the 'Add Investment' button to open tax/investment input fields.
        # number field
        elem = page.locator('xpath=/html/body/div/div/main/div/div[2]/div/form/div[2]/div[4]/div[2]/div[2]/input[2]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("18")
        
        # -> Fill 'Monthly Net Income' with 80000, 'Monthly Expenses' with 45000, set the debt 'Balance' to 100000 and 'APR' to 18%, then click the 'Add Investment' button to open tax/investment input fields.
        # add Add Investment button
        elem = page.get_by_role('button', name='add Add Investment', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the 'Amount (₹)' field under Tax Investments with ₹50,000 and then click the 'Analyze & Optimize Capital' button to run the analysis.
        # number field
        elem = page.locator('xpath=/html/body/div/div/main/div/div[2]/div/form/div[2]/div[5]/div[2]/div[3]/div/input')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("50000")
        
        # -> Fill the 'Amount (₹)' field under Tax Investments with ₹50,000 and then click the 'Analyze & Optimize Capital' button to run the analysis.
        # bolt Analyze & Optimize Capital button
        elem = page.get_by_role('button', name='bolt Analyze & Optimize Capital', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fix the validation errors shown in the red error box by filling 'Your Age' (>=18), 'Parents' Age (Max)' (>=30), the debt 'Creditor' name, and the debt 'Min EMI' (greater than 0), then click the 'Analyze & Optimize Capital' button to resu...
        # 30 number field
        elem = page.locator('[id="age"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("30")
        
        # -> Fix the validation errors shown in the red error box by filling 'Your Age' (>=18), 'Parents' Age (Max)' (>=30), the debt 'Creditor' name, and the debt 'Min EMI' (greater than 0), then click the 'Analyze & Optimize Capital' button to resu...
        # 55 number field
        elem = page.locator('[id="page"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("55")
        
        # -> Fix the validation errors shown in the red error box by filling 'Your Age' (>=18), 'Parents' Age (Max)' (>=30), the debt 'Creditor' name, and the debt 'Min EMI' (greater than 0), then click the 'Analyze & Optimize Capital' button to resu...
        # e.g. HDFC CC text field
        elem = page.get_by_placeholder('e.g. HDFC CC', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("HDFC CC")
        
        # -> Fix the validation errors shown in the red error box by filling 'Your Age' (>=18), 'Parents' Age (Max)' (>=30), the debt 'Creditor' name, and the debt 'Min EMI' (greater than 0), then click the 'Analyze & Optimize Capital' button to resu...
        # number field
        elem = page.locator('xpath=/html/body/div/div/main/div/div[2]/div/form/div[2]/div[4]/div[2]/div[2]/div[2]/input')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("1000")
        
        # -> Fix the validation errors shown in the red error box by filling 'Your Age' (>=18), 'Parents' Age (Max)' (>=30), the debt 'Creditor' name, and the debt 'Min EMI' (greater than 0), then click the 'Analyze & Optimize Capital' button to resu...
        # bolt Analyze & Optimize Capital button
        elem = page.get_by_role('button', name='bolt Analyze & Optimize Capital', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify financial health gauges are displayed
        # Assert: Overall financial health score (e.g. '81.3 /100') is visible.
        await expect(page.locator("xpath=/html/body/div[1]/div/main/div/div[2]/div[2]/div/section[3]/div[2]/div[1]/p[1]/span").nth(0)).to_contain_text("/100", timeout=15000), "Overall financial health score (e.g. '81.3 /100') is visible."
        # Assert: FOIR metric '1.2' is visible.
        await expect(page.locator("xpath=/html/body/div[1]/div/main/div/div[2]/div[2]/div/section[3]/div[2]/div[2]/div[1]/div[1]/span[1]/span").nth(0)).to_contain_text("1.2", timeout=15000), "FOIR metric '1.2' is visible."
        # Assert: Savings Rate '43.8' is visible.
        await expect(page.locator("xpath=/html/body/div[1]/div/main/div/div[2]/div[2]/div/section[3]/div[2]/div[2]/div[2]/div[1]/span[1]/span").nth(0)).to_contain_text("43.8", timeout=15000), "Savings Rate '43.8' is visible."
        # Assert: Emergency Buffer '0.8 mo' is visible.
        await expect(page.locator("xpath=/html/body/div[1]/div/main/div/div[2]/div[2]/div/section[3]/div[2]/div[2]/div[3]/div[1]/span[1]/span").nth(0)).to_contain_text("0.8 mo", timeout=15000), "Emergency Buffer '0.8 mo' is visible."
        current_url = await page.evaluate("() => window.location.href")
        # Assert: page loaded with a URL (final outcome verified by the AI judge during the run)
        assert current_url, 'Page should have loaded with a URL'
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    