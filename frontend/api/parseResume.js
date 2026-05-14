import formidable from "formidable";
import mammoth from "mammoth";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import fs from "fs";

// Disable Vercel's default body parser so formidable can handle it
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const form = formidable({ maxFileSize: 10 * 1024 * 1024 }); // 10MB limit

    const [, files] = await form.parse(req);
    const file = files.resume?.[0];

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const name = file.originalFilename?.toLowerCase() || "";
    const buffer = fs.readFileSync(file.filepath);

    let text = "";

    if (name.endsWith(".docx") || name.endsWith(".doc")) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (name.endsWith(".pdf")) {
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (name.endsWith(".txt") || name.endsWith(".md")) {
      text = buffer.toString("utf-8");
    } else {
      return res.status(400).json({ error: "Unsupported file format" });
    }

    // Cleanup temp file
    try { fs.unlinkSync(file.filepath); } catch {}

    return res.json({ success: true, text: text.trim() });
  } catch (err) {
    console.error("Parse Resume Error:", err);
    return res.status(500).json({ error: "Failed to parse resume", details: err.message });
  }
}
