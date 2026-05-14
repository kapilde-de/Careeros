// frontend/api/gumroad-webhook.js
// Auto-creates license keys when Gumroad payment received
// Configure in Gumroad: Settings → Advanced → Resource Subscription URL

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || ""
);

function generateLicenseKey() {
  // Format: COSAI-XXXX-XXXX-XXXX-XXXX
  const random = () => crypto.randomBytes(2).toString("hex").toUpperCase();
  return `COSAI-${random()}-${random()}-${random()}-${random()}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { sale_id, email, price, currency, product_permalink } = req.body || {};

    // Only process the agent product
    if (!product_permalink?.includes("careeros-agent")) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    // Generate unique license key
    let licenseKey = generateLicenseKey();
    while (true) {
      const { data } = await supabase.from("agent_licenses").select("id").eq("license_key", licenseKey).single();
      if (!data) break;
      licenseKey = generateLicenseKey();
    }

    // Save to DB
    const { error } = await supabase.from("agent_licenses").insert({
      license_key: licenseKey,
      email,
      gumroad_sale_id: sale_id,
      amount_paid: parseInt(price) || 9900,
      currency: currency || "GBP",
      tier: "agent",
    });

    if (error) throw error;

    // Send email with license key (use SendGrid/Resend in production)
    console.log(`✓ License created: ${licenseKey} for ${email}`);

    // TODO: Send email with download link + license key

    return res.status(200).json({ ok: true, license_key: licenseKey });
  } catch (err) {
    console.error("Gumroad webhook error:", err);
    return res.status(500).json({ error: err.message });
  }
}
