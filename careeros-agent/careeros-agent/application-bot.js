// ════════════════════════════════════════════════════════════════════════
// Application Bot — auto-fills and submits job applications
// Supports: Greenhouse, Lever, Ashby, Workable, Workday, SmartRecruiters
// ════════════════════════════════════════════════════════════════════════

import { chromium } from "playwright";
import path from "path";

export class ApplicationBot {
  constructor(config) {
    this.config = config;
    this.userInfo = {
      firstName: config.firstName,
      lastName: config.lastName,
      fullName: `${config.firstName} ${config.lastName}`,
      email: config.email,
      phone: config.phone,
      location: config.location,
      linkedin: config.linkedinURL || "",
      portfolio: config.portfolioURL || "",
    };
  }

  async apply(job) {
    if (!job.url) return { status: "failed", error: "No URL", job };

    const browser = await chromium.launch({
      headless: !this.config.showBrowser,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();

    try {
      console.log(`\n📝 Applying: ${job.title} at ${job.company}`);
      await page.goto(job.url, { waitUntil: "domcontentloaded", timeout: 25000 });
      await page.waitForTimeout(1500);

      const atsType = this.detectATS(job.url, await page.content());
      console.log(`   ATS: ${atsType}`);

      let result;
      switch (atsType) {
        case "greenhouse":   result = await this.applyGreenhouse(page, job); break;
        case "lever":        result = await this.applyLever(page, job); break;
        case "ashby":        result = await this.applyAshby(page, job); break;
        case "workable":     result = await this.applyWorkable(page, job); break;
        case "workday":      result = await this.applyWorkday(page, job); break;
        case "smartrecruiters": result = await this.applySmartRecruiters(page, job); break;
        case "recruitee":    result = await this.applyRecruitee(page, job); break;
        default:
          console.log("   ⚠ ATS not supported — flagging for manual apply");
          result = { status: "manual_required" };
      }

      if (result.status === "ready_to_submit") {
        if (this.config.actuallySubmit) {
          // Try common submit button selectors
          const submitted = await this.submitForm(page);
          result.status = submitted ? "submitted" : "filled_pending_review";
          console.log(submitted ? "   ✅ SUBMITTED!" : "   📋 Filled — submit manually");
        } else {
          result.status = "filled_pending_review";
          console.log("   📋 Form filled — auto-submit disabled. Enable in config.");
        }
      }

      return { ...result, job, title: job.title, company: job.company, url: job.url, matchScore: job.matchScore, location: job.location, salary: job.salary };

    } catch (err) {
      console.error(`   ❌ Failed: ${err.message}`);
      return { status: "failed", error: err.message, job, title: job.title, company: job.company, url: job.url };
    } finally {
      await browser.close();
    }
  }

  detectATS(url, html) {
    if (url.includes("greenhouse.io") || url.includes("grnh.se") || html.includes("greenhouse-job-board")) return "greenhouse";
    if (url.includes("lever.co") || html.includes("lever-jobs")) return "lever";
    if (url.includes("ashbyhq.com") || html.includes("ashby-job")) return "ashby";
    if (url.includes("workable.com") || html.includes("whr.tn")) return "workable";
    if (url.includes("myworkdayjobs.com") || url.includes("workday.com")) return "workday";
    if (url.includes("smartrecruiters.com") || html.includes("SmartRecruiters")) return "smartrecruiters";
    if (html.includes("recruitee.com") || url.includes("recruitee.com")) return "recruitee";
    return "unknown";
  }

  async applyGreenhouse(page, job) {
    await this.fill(page, '#first_name, [name="first_name"]', this.userInfo.firstName);
    await this.fill(page, '#last_name, [name="last_name"]', this.userInfo.lastName);
    await this.fill(page, '#email, [name="email"]', this.userInfo.email);
    await this.fill(page, '#phone, [name="phone"]', this.userInfo.phone);
    await this.fill(page, '[name*="linkedin"], [id*="linkedin"]', this.userInfo.linkedin);
    await this.fill(page, '[name*="website"], [id*="website"]', this.userInfo.portfolio);
    if (job.cvPath) await this.upload(page, '#resume, input[type="file"][name*="resume"], input[type="file"][name*="cv"]', job.cvPath);
    if (job.coverLetter?.letter) await this.fill(page, '[name*="cover"], textarea[id*="cover"], #cover_letter_text', job.coverLetter.letter);
    return { status: "ready_to_submit" };
  }

  async applyLever(page, job) {
    await this.fill(page, '[name="name"]', this.userInfo.fullName);
    await this.fill(page, '[name="email"]', this.userInfo.email);
    await this.fill(page, '[name="phone"]', this.userInfo.phone);
    await this.fill(page, '[name="org"]', "Open to opportunities");
    await this.fill(page, '[name="urls[LinkedIn]"]', this.userInfo.linkedin);
    await this.fill(page, '[name="urls[Portfolio]"]', this.userInfo.portfolio);
    if (job.cvPath) await this.upload(page, 'input[type="file"][name="resume"]', job.cvPath);
    if (job.coverLetter?.letter) await this.fill(page, '[name="comments"]', job.coverLetter.letter);
    return { status: "ready_to_submit" };
  }

  async applyAshby(page, job) {
    await this.fill(page, '[name="_systemfield_name"], [placeholder*="Name"]', this.userInfo.fullName);
    await this.fill(page, '[name="_systemfield_email"], [placeholder*="email"]', this.userInfo.email);
    await this.fill(page, '[name="_systemfield_phone"], [placeholder*="phone"]', this.userInfo.phone);
    await this.fill(page, '[name*="linkedin"]', this.userInfo.linkedin);
    if (job.cvPath) await this.upload(page, 'input[type="file"]', job.cvPath);
    return { status: "ready_to_submit" };
  }

  async applyWorkable(page, job) {
    // Click apply button if present
    await this.tryClick(page, '[data-ui="apply-button"], .apply-button, a[href*="apply"]');
    await page.waitForTimeout(1000);
    await this.fill(page, '#firstname, [name="firstname"], [name="first_name"]', this.userInfo.firstName);
    await this.fill(page, '#lastname, [name="lastname"], [name="last_name"]', this.userInfo.lastName);
    await this.fill(page, '#email, [name="email"]', this.userInfo.email);
    await this.fill(page, '#phone, [name="phone"]', this.userInfo.phone);
    if (job.cvPath) await this.upload(page, 'input[type="file"]', job.cvPath);
    if (job.coverLetter?.letter) await this.fill(page, '[name*="summary"], [name*="cover"], textarea', job.coverLetter.letter);
    return { status: "ready_to_submit" };
  }

  async applyWorkday(page, job) {
    // Click "Apply" button on Workday job page
    await this.tryClick(page, '[data-automation-id="applyButton"], [aria-label*="Apply"], button:has-text("Apply")');
    await page.waitForTimeout(2000);
    // Workday often requires account — flag for manual
    const requiresLogin = await page.$('[data-automation-id="signInBlock"], .wd-login');
    if (requiresLogin) {
      console.log("   ⚠ Workday requires account login — flagging for manual");
      return { status: "manual_required" };
    }
    await this.fill(page, '[data-automation-id="legalNameSection_firstName"]', this.userInfo.firstName);
    await this.fill(page, '[data-automation-id="legalNameSection_lastName"]', this.userInfo.lastName);
    await this.fill(page, '[data-automation-id="email"]', this.userInfo.email);
    await this.fill(page, '[data-automation-id="phone-number"]', this.userInfo.phone);
    if (job.cvPath) await this.upload(page, 'input[type="file"]', job.cvPath);
    return { status: "ready_to_submit" };
  }

  async applySmartRecruiters(page, job) {
    await this.tryClick(page, '[data-label="apply"], .js-apply-button, a[href*="apply"]');
    await page.waitForTimeout(1500);
    await this.fill(page, '[name="firstName"], [id*="firstName"]', this.userInfo.firstName);
    await this.fill(page, '[name="lastName"], [id*="lastName"]', this.userInfo.lastName);
    await this.fill(page, '[name="email"], [type="email"]', this.userInfo.email);
    await this.fill(page, '[name="phoneNumber"], [type="tel"]', this.userInfo.phone);
    if (job.cvPath) await this.upload(page, 'input[type="file"]', job.cvPath);
    return { status: "ready_to_submit" };
  }

  async applyRecruitee(page, job) {
    await this.tryClick(page, '.offer-apply-btn, [data-apply], a[href*="apply"]');
    await page.waitForTimeout(1500);
    await this.fill(page, '[name="name"], [name="full_name"]', this.userInfo.fullName);
    await this.fill(page, '[name="email"]', this.userInfo.email);
    await this.fill(page, '[name="phone"]', this.userInfo.phone);
    if (job.cvPath) await this.upload(page, 'input[type="file"]', job.cvPath);
    if (job.coverLetter?.letter) await this.fill(page, 'textarea[name*="cover"], textarea[name*="message"]', job.coverLetter.letter);
    return { status: "ready_to_submit" };
  }

  async submitForm(page) {
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Submit")',
      'button:has-text("Apply")',
      'button:has-text("Submit Application")',
      '[data-qa="submit-application"]',
      '[data-automation-id="submitButton"]',
    ];
    for (const sel of submitSelectors) {
      try {
        await page.click(sel, { timeout: 3000 });
        await page.waitForTimeout(2000);
        return true;
      } catch {}
    }
    return false;
  }

  async fill(page, selector, value) {
    if (!value) return;
    try {
      await page.fill(selector, String(value), { timeout: 3000 });
    } catch {}
  }

  async upload(page, selector, filePath) {
    try {
      await page.setInputFiles(selector, filePath, { timeout: 5000 });
    } catch {}
  }

  async tryClick(page, selector) {
    try {
      await page.click(selector, { timeout: 5000 });
    } catch {}
  }
}
