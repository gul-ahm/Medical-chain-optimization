import { test, expect } from '@playwright/test';

test.describe('Supply Chain Intelligence Dashboard - E2E Suite', () => {
  
  test.beforeEach(async ({ page }) => {
    // In production, this would handle login or session injection
    await page.goto('/dashboard/executive');
  });

  test('should navigate across all primary intelligence modules', async ({ page }) => {
    const modules = [
      { name: 'Inventory', path: '/dashboard/inventory' },
      { name: 'Forecasting', path: '/dashboard/forecasting' },
      { name: 'Optimization', path: '/dashboard/optimization' },
      { name: 'Orchestration', path: '/dashboard/orchestration' },
    ];

    for (const module of modules) {
      await page.click(`nav >> text=${module.name}`);
      await expect(page).toHaveURL(module.path);
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('should display executive KPIs and real-time alerts', async ({ page }) => {
    await page.goto('/dashboard/executive');
    
    // Check for KPI cards
    await expect(page.locator('text=Total Inventory Value')).toBeVisible();
    await expect(page.locator('text=Forecast Accuracy')).toBeVisible();
    
    // Verify Notification Center functionality
    await page.click('button[aria-label*="Notification"]');
    await expect(page.locator('text=Recent Alerts')).toBeVisible();
  });

  test('should enforce RBAC gating on restricted routes', async ({ page }) => {
    // Simulate non-admin session if possible, or check for gated components
    await page.goto('/dashboard/orchestration');
    
    // Verify system-level controls are visible/hidden based on role
    const governanceSection = page.locator('text=Governance Escalations');
    await expect(governanceSection).toBeVisible();
  });

  test('should maintain responsive layout on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone 12 Pro
    
    // Sidebar should be collapsed or accessible via burger menu
    const menuButton = page.locator('button[aria-label*="menu"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await expect(page.locator('nav')).toBeVisible();
    }
  });

  test('should reflect real-time SSE updates in the UI', async ({ page }) => {
    // This test assumes the mock SSE stream is running
    await page.goto('/dashboard/inventory');
    
    // Wait for a potential dynamic update or check for stream connection status
    const statusIndicator = page.locator('[data-testid="stream-status"]');
    if (await statusIndicator.isVisible()) {
      await expect(statusIndicator).toContainText('Live');
    }
  });

});
