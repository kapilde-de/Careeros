// ════════════════════════════════════════════════════════════════════════
// Application Bot — auto-fills job applications with Playwright
// SAFETY: Always confirms before submission unless Autopilot enabled
// ════════════════════════════════════════════════════════════════════════

import { chromium } from "playwright";

export class ApplicationBot {
  constructor(config) {
    this.config = config;
    this.profile = config.applicationProfile; // Saved answers
    this.userCV = config.cv;
    this.userInfo = {
      firstName: config.firstName,
      lastName: config.lastName,
      email: config.email,
      phone: config.phone,
      location: config.location,
      linkedIn: config.linkedinURL,
      portfolio: config.portfolioURL,
    };
  }

  async apply(job) {
    if (!job.url) {
      throw new Error("No application URL");
    }

    const browser = await chromium.launch({
      headless: !this.config.showBrowser,
      args: ["--no-sandbox"],
    });

    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (compatible; CareerOS-Agent/1.0)",
    });

    const page = await context.newPage();

    try {
      console.log(`📝 Applying to ${job.title} at ${job.company}...`);
      await page.goto(job.url, { waitUntil: "networkidle", timeout: 20000 });

      // Detect ATS type
      const atsType = await this.detectATS(page, job.url);
      console.log(`   Detected ATS: ${atsType}`);

      switch (atsType) {
        case "greenhouse":
          await this.applyGreenhouse(page, job);
          break;
        case "lever":
          await this.applyLever(page, job);
          break;
        case "ashby":
          await this.applyAshby(page, job);
          break;
        case "workable":
          await this.applyWorkable(page, job);
          break;
        default:
          console.log("   ⚠ Unknown ATS — skipping auto-apply");
          return { status: "manual_required", job };
      }

      // SAFETY: Don't actually submit unless explicitly enabled
      if (this.config.actuallySubmit) {
        await page.click('button[type="submit"], input[type="submit"]', { timeout: 5000 });
        console.log("   ✅ Submitted!");
        return { status: "submitted", job };
      } else {
        console.log("   📋 Form filled — waiting for user to review and submit");
        return { status: "filled_pending_review", job, formData: await this.captureFormState(page) };
      }

    } catch (err) {
      console.error(`   ❌ Failed:`, err.message);
      return { status: "failed", job, error: err.message };
    } finally {
      if (this.config.actuallySubmit) {
        await browser.close();
      }
      // If review needed, leave browser open
    }
  }

  async detectATS(page, url) {
    if (url.includes("greenhouse.io") || url.includes("grnh.se")) return "greenhouse";
    if (url.includes("lever.co")) return "lever";
    if (url.includes("ashbyhq.com")) return "ashby";
    if (url.includes("workable.com")) return "workable";

    // Check page content
    const html = await page.content();
    if (html.includes("greenhouse")) return "greenhouse";
    if (html.includes("lever-jobs")) return "lever";
    if (html.includes("ashby")) return "ashby";

    return "unknown";
  }

  async applyGreenhouse(page, job) {
    // Greenhouse common form fields
    await this.tryFill(page, '#first_name, [name="first_name"]', this.userInfo.firstName);
    await this.tryFill(page, '#last_name, [name="last_name"]', this.userInfo.lastName);
    await this.tryFill(page, '#email, [name="email"]', this.userInfo.email);
    await this.tryFill(page, '#phone, [name="phone"]', this.userInfo.phone);

    // Resume upload
    if (this.config.cvFile) {
      await this.tryUpload(page, 'input[type="file"][name*="resume"], #resume', this.config.cvFile);
    }

    // Cover letter
    if (job.coverLetter) {
      await this.tryFill(page, '[name*="cover_letter"], textarea[id*="cover"]', job.coverLetter);
    }

    // LinkedIn
    await this.tryFill(page, '[name*="linkedin"], [id*="linkedin"]', this.userInfo.linkedIn);
  }

  async applyLever(page, job) {
    await this.tryFill(page, '[name="name"]', `${this.userInfo.firstName} ${this.userInfo.lastName}`);
    await this.tryFill(page, '[name="email"]', this.userInfo.email);
    await this.tryFill(page, '[name="phone"]', this.userInfo.phone);
    await this.tryFill(page, '[name="urls[LinkedIn]"]', this.userInfo.linkedIn);

    if (this.config.cvFile) {
      await this.tryUpload(page, 'input[type="file"][name="resume"]', this.config.cvFile);
    }
  }

  async applyAshby(page, job) {
    await this.tryFill(page, '[name="_systemfield_name"]', `${this.userInfo.firstName} ${this.userInfo.lastName}`);
    await this.tryFill(page, '[name="_systemfield_email"]', this.userInfo.email);
    await this.tryFill(page, '[name="_systemfield_phone"]', this.userInfo.phone);

    if (this.config.cvFile) {
      await this.tryUpload(page, 'input[type="file"][name*="resume"]', this.config.cvFile);
    }
  }

  async applyWorkable(page, job) {
    await this.tryFill(page, '#firstname, [name="firstname"]', this.userInfo.firstName);
    await this.tryFill(page, '#lastname, [name="lastname"]', this.userInfo.lastName);
    await this.tryFill(page, '#email, [name="email"]', this.userInfo.email);
    await this.tryFill(page, '#phone, [name="phone"]', this.userInfo.phone);

    if (this.config.cvFile) {
      await this.tryUpload(page, 'input[type="file"][name="resume"]', this.config.cvFile);
    }
  }

  async tryFill(page, selector, value) {
    if (!value) return;
    try {
      await page.fill(selector, value, { timeout: 2000 });
    } catch {
      // Field doesn't exist — skip
    }
  }

  async tryUpload(page, selector, filePath) {
    try {
      await page.setInputFiles(selector, filePath, { timeout: 3000 });
    } catch {
      // No upload field
    }
  }

  async captureFormState(page) {
    return await page.evaluate(() => {
      const inputs = document.querySelectorAll("input, textarea, select");
      const state = {};
      inputs.forEach(i => {
        if (i.name) state[i.name] = i.value;
      });
      return state;
    });
  }
}
