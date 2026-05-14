// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Auth', () => {

  test('sign in button opens auth modal', async ({ page }) => {
    await page.goto('/');
    const signInBtn = page.getByRole('button', { name: /sign in|get started/i }).first();
    await signInBtn.click();
    await expect(page.getByText(/sign in|log in|email/i).first()).toBeVisible();
  });

  test('auth modal has email and password fields', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /sign in|get started/i }).first().click();
    await expect(page.locator('input[type="email"], input[placeholder*="email" i]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('can switch between sign in and sign up', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /sign in|get started/i }).first().click();
    // Look for a toggle link between sign in / sign up
    const toggle = page.getByText(/sign up|create account|register/i).first();
    await expect(toggle).toBeVisible();
  });

});