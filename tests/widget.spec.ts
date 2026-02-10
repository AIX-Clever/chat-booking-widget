import { test, expect } from '@playwright/test';

test.describe('Chat Widget', () => {
    test('should load and allow opening the chat window', async ({ page }) => {
        page.on('console', msg => console.log(`[Widget Console] ${msg.type()}: ${msg.text()}`));
        page.on('pageerror', err => console.error(`[Widget Error] ${err.message}`));
        await page.goto('/');

        // 1. Verify launcher is visible
        const launcher = page.locator('#chat-agent-widget-launcher');
        await expect(launcher).toBeVisible({ timeout: 10000 });

        // 2. Click launcher
        await launcher.click();

        // 3. Verify chat window opens
        const chatWindow = page.locator('#chat-agent-widget-window');
        await expect(chatWindow).toBeVisible();

        // 4. Verify welcome message
        const welcomeMsg = page.getByText(/Hola/i); // Matches "Hola", "Hola Lucía", etc.
        await expect(welcomeMsg.first()).toBeVisible();
    });
});
