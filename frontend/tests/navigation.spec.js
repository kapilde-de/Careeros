// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {

  test('homepage loads with correct title and hero text', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/CareerOS/);
    await expect(page.getByText('Get the interview.')).toBeVisible();
    await expect(page.getByText('Not the rejection.')).toBeVisible();
  });

  test('top nav shows all tabs', async ({ page }) => {
    await page.goto('/');
    for (const tab of ['Builder', 'Templates', 'Jobs', 'Interview', 'Dashboard', 'Plans']) {
      await expect(page.getByRole('button', { name: new RegExp(tab, 'i') })).toBeVisible();
    }
    await expect(page.getByText(/Agent/i).first()).toBeVisible();
  });

  test('hero feature tiles are all visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Beats the ATS filter')).toBeVisible();
    await expect(page.getByText('Flags your rejection risk')).toBeVisible();
    await expect(page.getByText('Negotiate your best salary')).toBeVisible();
    await expect(page.getByText('Tailored to every job description')).toBeVisible();
  });

  test('clicking Plans tab shows pricing tiers', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Plans/i }).click();
    await expect(page.getByText(/Free|Pro|Enterprise/i).first()).toBeVisible();
  });

  test('clicking Agent tab shows agent section', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Agent/i }).click();
    await expect(page.getByText(/agent|autonomous|job hunter|scan/i).first()).toBeVisible();
  });

});