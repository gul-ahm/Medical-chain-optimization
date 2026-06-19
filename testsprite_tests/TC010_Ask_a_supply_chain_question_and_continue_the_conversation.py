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
        page = await context.new_page()
        
        page.on("console", lambda msg: print(f"CONSOLE: {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))
        
        await page.goto("http://localhost:3000")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        print("Navigating to dashboard/executive...")
        await page.goto("http://localhost:3000/dashboard/executive")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        print("Navigating finished. URL:", page.url)
        
        # Locate input and button
        input_elem = page.locator("input[placeholder='Type your operational query...']")
        await input_elem.wait_for(state="visible", timeout=10000)
        
        button = page.locator("button:has(svg.lucide-send)")
        await button.wait_for(state="visible", timeout=10000)
        
        # Turn 1: Ask first question
        print("Submitting first question...")
        await input_elem.fill("Which warehouses are at highest risk of insulin stockouts in the next 14 days?")
        await button.click()
        
        # Wait for the loader to be hidden (Ollama CPU execution can take up to 90s)
        loader = page.locator("text=Analyzing operational graph...")
        await expect(loader).to_be_hidden(timeout=90000)
        
        # Check if error banner is shown
        error_banner = page.locator("text=CRITICAL ERROR: AI ORCHESTRATION OFFLINE")
        if await error_banner.is_visible():
            raise AssertionError("AI Orchestrator reported as offline in the UI during Turn 1")
            
        # Verify first bot response bubble is visible
        bot_responses = page.locator("div.bg-slate-800\\/80")
        await expect(bot_responses.first).to_be_visible(timeout=10000)
        
        # Turn 2: Ask follow-up question
        print("Submitting follow-up question...")
        await input_elem.fill("What is the primary cause for the risk at the highest risk warehouse?")
        await button.click()
        
        # Wait for loader again
        await expect(loader).to_be_hidden(timeout=90000)
        
        if await error_banner.is_visible():
            raise AssertionError("AI Orchestrator reported as offline in the UI during Turn 2")
            
        # Verify both bot response bubbles are visible
        await expect(bot_responses.nth(1)).to_be_visible(timeout=10000)
        
        # Assert content is not empty
        content1 = await bot_responses.first.inner_text()
        content2 = await bot_responses.nth(1).inner_text()
        assert len(content1.strip()) > 0, "Bot response bubble 1 is empty"
        assert len(content2.strip()) > 0, "Bot response bubble 2 is empty"
        print("Multi-turn conversation test passed!")
        
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())