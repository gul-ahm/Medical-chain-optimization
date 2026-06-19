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
                "--ipc=host"
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
        
        # Go directly to the executive dashboard to avoid client-side routing hydration mismatch errors
        await page.goto("http://localhost:3000/dashboard/executive")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Attempt to submit an empty query by verifying that the send button is disabled when input is empty.
        button = page.locator("button:has(svg.lucide-send)")
        await button.wait_for(state="visible", timeout=10000)
        await expect(button).to_be_disabled()
        
        # -> Type a valid supply-chain question into the Copilot input so the send button enables, then click the send button to submit.
        input_elem = page.locator("input[placeholder='Type your operational query...']")
        await input_elem.wait_for(state="visible", timeout=10000)
        await input_elem.fill("How can regional warehouses reduce insulin stockouts over the next 30 days while minimizing transfer costs?")
        
        # Verify button is now enabled and click it
        await expect(button).to_be_enabled()
        await button.click()
        
        # Wait for the loader to be hidden (Ollama inference can take up to 90s on CPU)
        loader = page.locator("text=Analyzing operational graph...")
        await expect(loader).to_be_hidden(timeout=90000)
        
        # Check if the error banner is shown
        error_banner = page.locator("text=CRITICAL ERROR: AI ORCHESTRATION OFFLINE")
        if await error_banner.is_visible():
            raise AssertionError("AI Orchestrator reported as offline in the UI")
            
        # Verify the bot response bubble is visible
        bot_response = page.locator("div.bg-slate-800\\/80")
        await expect(bot_response.last).to_be_visible(timeout=10000)
        
        # Assert content is not empty
        content = await bot_response.last.inner_text()
        assert len(content.strip()) > 0, "Bot response bubble is empty"
        print("Empty submission recovery test passed!")

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    