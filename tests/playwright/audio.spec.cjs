// Playwright integration test for audio recording and playback
const { test, expect } = require('@playwright/test');

test.describe('Flashback Audio Recording', () => {
  test('should record and play three recordings without errors', async ({ page, context }) => {
    // Capture browser console logs
    page.on('console', msg => {
      console.log(`[browser] ${msg.type()}: ${msg.text()}`);
    });

    // Grant microphone permissions
    await context.grantPermissions(['microphone'], { origin: 'http://localhost:3000' });

    await page.goto('/');

    for (let i = 0; i < 3; i++) {
      // Wait for record button to be enabled
      let recordBtn;
      try {
        recordBtn = await page.waitForSelector('button[data-testid="record-btn"]:not([disabled])', { timeout: 30000 });
      } catch (e) {
        await page.screenshot({ path: `playwright-record-btn-error-${i}.png` });
        throw e;
      }
      await recordBtn.click();
      await page.waitForTimeout(2000); // Record for 2 seconds
      await recordBtn.click();
      // Wait for save notification to disappear
      await page.waitForTimeout(1000);
    }

    // Click the Browse tab to show recordings
    await page.click('button.nav-btn:not(.active):has-text("Browse")');

    // Wait for all three recordings to appear
    await page.waitForSelector('[data-testid="recording-item"]', { timeout: 30000 });
    const items = await page.$$('[data-testid="recording-item"]');
    expect(items.length).toBeGreaterThanOrEqual(3);

    // Play first recording, then start second before first finishes
    const playBtn1 = page.locator('[data-testid="recording-item"]').nth(0).locator('button.btn-primary');
    const playBtn2 = page.locator('[data-testid="recording-item"]').nth(1).locator('button.btn-primary');

    await playBtn1.click();
    await expect(playBtn1).toHaveText(/Playing/);
    // Start second recording while first is still playing
    await playBtn2.click();
    await expect(playBtn2).toHaveText(/Playing/);
    // First should stop playing
    await expect(playBtn1).toHaveText(/Play/);

    // Wait for second to finish
    await expect(playBtn2).toHaveText(/Play/);

    // Check for error notification
    const errorNotif = await page.$('[data-testid="notification-error"]');
    expect(errorNotif).toBeNull();
  });
});
