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
        # Note: --single-process is removed as it causes browser crashes on Windows.
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget
        context.set_default_timeout(20000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Navigate to the platform root
        print("Navigating to http://localhost:3000...")
        await page.goto("http://localhost:3000")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # Navigate to the inventory module dashboard
        print("Navigating to http://localhost:3000/dashboard/inventory...")
        await page.goto("http://localhost:3000/dashboard/inventory")
        try:
            await page.wait_for_load_state("networkidle", timeout=8000)
        except Exception:
            pass
        
        # Assertions to verify live inventory status and warehouse utilization
        print("Verifying page title and headers...")
        title_locator = page.locator("text=Medicine Inventory Intelligence").first
        await expect(title_locator).to_be_visible(timeout=10000)
        
        print("Verifying key KPI cards...")
        # Verify that dynamic KPIs load (Clinical Available, Supply Stability, Quarantined/QA)
        await expect(page.locator("text=Clinical Available").first).to_be_visible(timeout=10000)
        await expect(page.locator("text=Supply Stability").first).to_be_visible(timeout=10000)
        await expect(page.locator("text=Quarantined/QA").first).to_be_visible(timeout=10000)
        
        print("Verifying global stock ledger...")
        ledger_title = page.locator("text=Global Clinical Stock Ledger").first
        await expect(ledger_title).to_be_visible(timeout=10000)
        
        # Verify that actual stock data is loaded into the ledger table from database (e.g. Metformin or Amoxicillin)
        print("Checking for live database-grounded products...")
        await expect(page.locator("text=Metformin").first).to_be_visible(timeout=15000)
        await expect(page.locator("text=Amoxicillin").first).to_be_visible(timeout=15000)
        
        # Verify the streaming connection is live
        print("Verifying live connection status indicator...")
        live_indicator = page.locator("span:has-text('Live')").first
        await expect(live_indicator).to_be_visible(timeout=10000)
        
        print("TC011 Frontend Playwright test completed successfully and verified!")
        await asyncio.sleep(2)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

if __name__ == "__main__":
    asyncio.run(run_test())