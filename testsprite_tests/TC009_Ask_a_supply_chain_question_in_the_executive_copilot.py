import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        pw = await async_api.async_playwright().start()
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host"
            ],
        )
        context = await browser.new_context()
        context.set_default_timeout(15000)
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Log console messages and errors
        page.on("console", lambda msg: print(f"CONSOLE: {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))
        
        # -> navigate
        await page.goto("http://localhost:3000")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # Go directly to the executive dashboard to avoid client-side routing hydration mismatch errors
        print("Navigating to dashboard/executive...")
        await page.goto("http://localhost:3000/dashboard/executive")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        print("Navigating finished. URL:", page.url)
        
        # -> Fill the Executive Operational Copilot input (index 721) with a supply chain question and click the submit button (index 722) to send it.
        # text input placeholder="Type your operational query..."
        elem = page.locator("input[placeholder='Type your operational query...']")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Which warehouses are at highest risk of stockouts for insulin in the next 14 days, and what immediate rebalancing actions are recommended?")
        
        # -> Fill the Executive Operational Copilot input (index 721) with a supply chain question and click the submit button (index 722) to send it.
        # button
        elem = page.locator("button:has(svg.lucide-send)")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.click()
        
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
        print("Frontend test passed!")
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    