// frontend/api/validate-license.js
// Validates CareerOS Agent license keys against Supabase

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { key } = req.body || {};
  if (!key) return res.status(400).json({ valid: false, message: "License key required" });

  try {
    const { data, error } = await supabase
      .from("agent_licenses")
      .select("*")
      .eq("license_key", key)
      .single();

    if (error || !data) return res.status(200).json({ valid: false, message: "License not found" });
    if (data.revoked) return res.status(200).json({ valid: false, message: "License revoked" });

    await supabase.from("agent_licenses").update({ last_validated: new Date().toISOString() }).eq("license_key", key);
    return res.status(200).json({ valid: true, tier: data.tier || "agent", email: data.email });
  } catch (err) {
    return res.status(500).json({ valid: false, message: err.message });
  }
}
