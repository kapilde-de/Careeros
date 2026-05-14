// @ts-check
import { test, expect } from '@playwright/test';

const SAMPLE_JD = `Senior Product Manager at FinTech Corp
Requirements:
- 5+ years of product management experience
- Strong stakeholder management and cross-functional leadership
- Agile/Scrum methodology expertise
- Data-driven decision making with OKRs
- Roadmap ownership and prioritisation skills`;

const SAMPLE_CV = `Sarah Chen | sarah@email.com | London, UK

EXPERIENCE
Senior Product Manager — FinPay Ltd (2021-2024)
Led product strategy growing ARR from 2M to 8M
Managed roadmap across 3 product lines with 20 engineers
Delivered OKR-driven sprint cycles reducing time-to-market by 30%

Product Manager — MobileApp Co (2019-2021)
Grew mobile app from MVP to 500k users
Improved onboarding conversion by 28% via A/B testing

EDUCATION
BSc Computer Science — UCL (2019)

SKILLS
Product Strategy, Agile, Jira, OKRs, Stakeholder Management, SQL, Figma`;

// Dismiss cookie banner AND any modal (Privacy Policy etc.)
async function dismissModals(page) {
  // 1. Cookie banner
  try {
    await page.getByRole('button', { name: /essential only/i }).click({ timeout: 3000 });
  } catch {}

  // 2. Privacy Policy modal — click the × close button
  try {
    await page.locator('button').filter({ hasText: /^[×✕x✖]$/ }).first().click({ timeout: 3000 });
  } catch {}

  // 3. Fallback — press Escape to close any open modal
  try {
    const dialog = page.locator('[role="dialog"], [class*="modal"], [class*="overlay"]').first();
    if (await dialog.isVisible({ timeout: 1000 })) {
      await page.keyboard.press('Escape');
    }
  } catch {}
}

test.describe('CV Builder', () => {

  test('builder input panels are visible on scroll', async ({ page }) => {
    await page.goto('/');
    await dismissModals(page);
    await page.evaluate(() => window.scrollBy(0, 500));
    await expect(page.getByText('Job Description', { exact: true })).toBeVisible();
    await expect(page.getByText('Your CV / Background')).toBeVisible();
  });

  test('Generate button is visible', async ({ page }) => {
    await page.goto('/');
    await dismissModals(page);
    await expect(page.getByRole('button', { name: /Generate Tailored Resume/i })).toBeVisible();
  });

  test('resume format selector shows all 6 formats', async ({ page }) => {
    await page.goto('/');
    await dismissModals(page);
    await page.evaluate(() => window.scrollBy(0, 600));
    for (const format of ['Apex', 'Horizon', 'Pinnacle', 'Slate', 'Prism', 'Foundation']) {
      await expect(page.getByText(format).first()).toBeVisible();
    }
  });

  test('full generation flow — all score cards appear', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/');
    await dismissModals(page);
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.locator('textarea').first().fill(SAMPLE_JD);
    await page.locator('textarea').nth(1).fill(SAMPLE_CV);
    await page.getByRole('button', { name: /Generate Tailored Resume/i }).click();
    await expect(page.getByText(/Reading|Extracting|Mapping|Rewriting|Calculating|Finalising/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/interview probability/i).first()).toBeVisible({ timeout: 90000 });
    await expect(page.getByText(/ats score/i, { exact: false }).nth(1)).toBeVisible();
    await expect(page.getByText(/human appeal/i, { exact: false }).first()).toBeVisible();
    await expect(page.getByText(/rejection risk/i, { exact: false }).first()).toBeVisible();
    await expect(page.getByText(/salary intel/i, { exact: false }).first()).toBeVisible();
  });

  test('rejection section visible after generation', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/');
    await dismissModals(page);
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.locator('textarea').first().fill(SAMPLE_JD);
    await page.locator('textarea').nth(1).fill(SAMPLE_CV);
    await page.getByRole('button', { name: /Generate Tailored Resume/i }).click();
    await expect(page.getByText(/interview probability/i).first()).toBeVisible({ timeout: 90000 });
    await page.evaluate(() => window.scrollBy(0, 800));
    await expect(page.getByText(/why you'll get rejected/i).first()).toBeVisible();
    await expect(page.getByText(/how to fix it/i).first()).toBeVisible();
  });

  test('salary negotiation script is shown', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/');
    await dismissModals(page);
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.locator('textarea').first().fill(SAMPLE_JD);
    await page.locator('textarea').nth(1).fill(SAMPLE_CV);
    await page.getByRole('button', { name: /Generate Tailored Resume/i }).click();
    await expect(page.getByText(/interview probability/i).first()).toBeVisible({ timeout: 90000 });
    await page.evaluate(() => window.scrollBy(0, 1200));
    await expect(page.getByText('Your Salary Negotiation Script')).toBeVisible();
    await expect(page.getByText('READY TO USE')).toBeVisible();
  });

  test('gap analysis section visible', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/');
    await dismissModals(page);
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.locator('textarea').first().fill(SAMPLE_JD);
    await page.locator('textarea').nth(1).fill(SAMPLE_CV);
    await page.getByRole('button', { name: /Generate Tailored Resume/i }).click();
    await expect(page.getByText(/interview probability/i).first()).toBeVisible({ timeout: 90000 });
    await page.evaluate(() => window.scrollBy(0, 1800));
    await expect(page.getByText(/gap analysis/i).first()).toBeVisible();
    await expect(page.getByText(/strengths/i).first()).toBeVisible();
    await expect(page.getByText(/\bgaps\b/i).first()).toBeVisible();
    await expect(page.getByText(/transferable/i).first()).toBeVisible();
  });

  test('tailored CV preview and download button visible', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/');
    await dismissModals(page);
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.locator('textarea').first().fill(SAMPLE_JD);
    await page.locator('textarea').nth(1).fill(SAMPLE_CV);
    await page.getByRole('button', { name: /Generate Tailored Resume/i }).click();
    await expect(page.getByText(/interview probability/i).first()).toBeVisible({ timeout: 90000 });
    await page.evaluate(() => window.scrollBy(0, 2000));
    await expect(page.getByText(/your tailored resume/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Download/i }).first()).toBeVisible();
  });

});