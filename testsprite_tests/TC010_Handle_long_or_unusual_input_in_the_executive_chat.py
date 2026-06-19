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
        
        # Locate input and button
        input_elem = page.locator("input[placeholder='Type your operational query...']")
        await input_elem.wait_for(state="visible", timeout=10000)
        
        button = page.locator("button:has(svg.lucide-send)")
        await button.wait_for(state="visible", timeout=10000)
        
        # Submit long complex query with special characters
        long_query = (
            "Executive request: With a projected +250% regional surge in demand for INSULIN-REG over the next 8 weeks, "
            "given constrained cold-chain capacity and transit limits, propose a prioritized transfer and replenishment plan "
            "to avoid shortages while minimizing cost. Provide: 1) top 3 transfer moves (source, destination, qty, ETA) "
            "2) fallback suppliers with lead-times & reliability scores 3) contingency triggers & thresholds for emergency rebalancing. "
            "Constraints: Δtemp ≤ 2°C, transit ≤ 24h, budget uplift ≤ 15%. Include concise actionable steps and timeline. "
            "Special chars included: ~!@#$%^&*()_+|<>?:;%-\u2014"
        )
        
        print("Submitting long/complex query...")
        await input_elem.fill(long_query)
        await button.click()
        
        # Wait for the loader to be hidden (Ollama CPU execution can take up to 90s)
        loader = page.locator("text=Analyzing operational graph...")
        await expect(loader).to_be_hidden(timeout=90000)
        
        # Check if error banner is shown
        error_banner = page.locator("text=CRITICAL ERROR: AI ORCHESTRATION OFFLINE")
        if await error_banner.is_visible():
            raise AssertionError("AI Orchestrator reported as offline in the UI")
            
        # Verify bot response bubble is visible
        bot_response = page.locator("div.bg-slate-800\\/80")
        await expect(bot_response.last).to_be_visible(timeout=10000)
        
        # Assert content is not empty
        content = await bot_response.last.inner_text()
        assert len(content.strip()) > 0, "Bot response bubble is empty"
        print("Long input handling test passed!")
        
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())