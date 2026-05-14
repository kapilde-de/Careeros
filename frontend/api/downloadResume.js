import {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, BorderStyle, ShadingType,
  convertInchesToTwip
} from "docx";

const THEMES = {
  apex:       { accent:"1e3a5f", accentLight:"e8edf5", text:"1a1a2e", muted:"555577", nameSize:36, font:"Calibri" },
  horizon:    { accent:"0d4f4a", accentLight:"e6faf8", text:"111827", muted:"6b7280", nameSize:38, font:"Calibri" },
  pinnacle:   { accent:"1e3a8a", accentLight:"eff2ff", text:"0f172a", muted:"475569", nameSize:40, font:"Times New Roman" },
  slate:      { accent:"111827", accentLight:"f3f4f6", text:"111827", muted:"6b7280", nameSize:36, font:"Arial" },
  prism:      { accent:"7c3aed", accentLight:"f5f3ff", text:"1e1b4b", muted:"6b7280", nameSize:38, font:"Calibri" },
  foundation: { accent:"374151", accentLight:"f9fafb", text:"111827", muted:"9ca3af", nameSize:34, font:"Arial" },
  classic:    { accent:"1e3a5f", accentLight:"e8edf5", text:"1a1a2e", muted:"555577", nameSize:36, font:"Georgia" },
};

function toArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  return val.split(/\n|•/).map(s => s.trim()).filter(Boolean);
}

function buildClassic(r, t) {
  const children = [];
  children.push(new Paragraph({
    children: [new TextRun({ text: r.name || "", bold: true, size: t.nameSize, color: t.accent, font: t.font })],
    border: { bottom: { style: BorderStyle.THICK, size: 12, color: t.accent } },
    spacing: { after: 80 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: r.contact || "", size: 19, color: t.muted, font: t.font })],
    spacing: { after: 240 },
  }));
  const section = (title) => [
    new Paragraph({
      children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 22, color: t.accent, font: t.font })],
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: t.accent } },
      spacing: { before: 280, after: 100 },
    }),
  ];
  const bullet = (text) => new Paragraph({
    children: [new TextRun({ text: `▸  ${text}`, size: 20, font: t.font, color: t.text })],
    indent: { left: 360 },
    spacing: { after: 80 },
  });
  const line = (text, opts = {}) => new Paragraph({
    children: [new TextRun({ text, size: opts.size || 20, bold: opts.bold, italics: opts.italic, color: opts.color || t.text, font: t.font })],
    spacing: { after: opts.after || 60 },
  });
  children.push(...section("Professional Summary"));
  children.push(line(r.summary || "", { size: 20 }));
  children.push(...section("Core Skills"));
  children.push(line((r.skills || []).join("  •  "), { color: t.muted }));
  children.push(...section("Experience"));
  (r.experience || []).forEach(exp => {
    children.push(new Paragraph({
      children: [
        new TextRun({ text: exp.title || "", bold: true, size: 22, color: t.text, font: t.font }),
        new TextRun({ text: `  |  ${exp.company || ""}`, size: 20, color: t.muted, font: t.font }),
        new TextRun({ text: `  |  ${exp.period || ""}`, size: 19, italics: true, color: t.muted, font: t.font }),
      ],
      spacing: { before: 160, after: 80 },
    }));
    (exp.bullets || []).forEach(b => children.push(bullet(b)));
  });
  children.push(...section("Education"));
  toArray(r.education).forEach(e => children.push(line(e)));
  if (toArray(r.certifications).length > 0) {
    children.push(...section("Certifications"));
    toArray(r.certifications).forEach(c => children.push(bullet(c)));
  }
  return children;
}

function buildModern(r, t) {
  const children = [];
  children.push(new Paragraph({
    children: [new TextRun({ text: r.name || "", bold: true, size: t.nameSize, color: "FFFFFF", font: t.font })],
    shading: { type: ShadingType.SOLID, color: t.accent },
    spacing: { before: 0, after: 0 },
    indent: { left: 240 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: r.contact || "", size: 19, color: "FFFFFF", font: t.font })],
    shading: { type: ShadingType.SOLID, color: t.accent },
    spacing: { after: 0 },
    indent: { left: 240 },
  }));
  children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
  const section = (title) => [
    new Paragraph({
      children: [new TextRun({ text: `  ${title}  `, bold: true, size: 22, color: "FFFFFF", font: t.font })],
      shading: { type: ShadingType.SOLID, color: t.accent },
      spacing: { before: 240, after: 120 },
    }),
  ];
  const bullet = (text) => new Paragraph({
    children: [new TextRun({ text: `●  ${text}`, size: 20, font: t.font, color: t.text })],
    indent: { left: 400 },
    spacing: { after: 80 },
  });
  const line = (text, opts = {}) => new Paragraph({
    children: [new TextRun({ text, size: opts.size || 20, bold: opts.bold, italics: opts.italic, color: opts.color || t.text, font: t.font })],
    spacing: { after: opts.after || 60 },
  });
  children.push(...section("Professional Summary"));
  children.push(line(r.summary || ""));
  children.push(...section("Core Skills"));
  const mid = Math.ceil((r.skills || []).length / 2);
  const row1 = (r.skills || []).slice(0, mid).join("   •   ");
  const row2 = (r.skills || []).slice(mid).join("   •   ");
  if (row1) children.push(line(row1, { color: t.muted }));
  if (row2) children.push(line(row2, { color: t.muted }));
  children.push(...section("Experience"));
  (r.experience || []).forEach(exp => {
    children.push(new Paragraph({
      children: [new TextRun({ text: exp.title || "", bold: true, size: 23, color: t.accent, font: t.font })],
      spacing: { before: 180, after: 40 },
    }));
    children.push(new Paragraph({
      children: [
        new TextRun({ text: exp.company || "", bold: true, size: 20, color: t.text, font: t.font }),
        new TextRun({ text: `   ${exp.period || ""}`, size: 19, italics: true, color: t.muted, font: t.font }),
      ],
      spacing: { after: 80 },
    }));
    (exp.bullets || []).forEach(b => children.push(bullet(b)));
  });
  children.push(...section("Education"));
  toArray(r.education).forEach(e => children.push(line(e)));
  if (toArray(r.certifications).length > 0) {
    children.push(...section("Certifications"));
    toArray(r.certifications).forEach(c => children.push(bullet(c)));
  }
  return children;
}

function buildExecutive(r, t) {
  const children = [];
  children.push(new Paragraph({
    children: [new TextRun({ text: (r.name || "").toUpperCase(), bold: true, size: t.nameSize, color: t.accent, font: t.font })],
    alignment: AlignmentType.CENTER,
    border: {
      top: { style: BorderStyle.DOUBLE, size: 6, color: t.accent },
      bottom: { style: BorderStyle.DOUBLE, size: 6, color: t.accent },
    },
    spacing: { before: 80, after: 80 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: r.contact || "", size: 19, color: t.muted, font: t.font })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 320 },
  }));
  const section = (title) => [
    new Paragraph({
      children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 22, color: t.accent, font: t.font })],
      border: { bottom: { style: BorderStyle.DOUBLE, size: 4, color: t.accent } },
      spacing: { before: 300, after: 120 },
    }),
  ];
  const bullet = (text) => new Paragraph({
    children: [new TextRun({ text: `■  ${text}`, size: 20, font: t.font, color: t.text })],
    indent: { left: 440 },
    spacing: { after: 80 },
  });
  const line = (text, opts = {}) => new Paragraph({
    children: [new TextRun({ text, size: opts.size || 20, bold: opts.bold, italics: opts.italic, color: opts.color || t.text, font: t.font })],
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { after: opts.after || 60 },
  });
  children.push(...section("Executive Summary"));
  children.push(line(r.summary || ""));
  children.push(...section("Core Competencies"));
  children.push(line((r.skills || []).join("   |   "), { color: t.muted }));
  children.push(...section("Professional Experience"));
  (r.experience || []).forEach(exp => {
    children.push(new Paragraph({
      children: [
        new TextRun({ text: exp.title || "", bold: true, size: 22, color: t.text, font: t.font }),
        new TextRun({ text: `  —  ${exp.company || ""}`, size: 21, bold: true, color: t.accent, font: t.font }),
      ],
      spacing: { before: 200, after: 40 },
    }));
    children.push(line(exp.period || "", { italic: true, color: t.muted, after: 80 }));
    (exp.bullets || []).forEach(b => children.push(bullet(b)));
  });
  children.push(...section("Education & Qualifications"));
  toArray(r.education).forEach(e => children.push(line(e)));
  if (toArray(r.certifications).length > 0) {
    children.push(...section("Professional Certifications"));
    toArray(r.certifications).forEach(c => children.push(bullet(c)));
  }
  return children;
}

function buildMinimal(r, t) {
  const children = [];
  children.push(new Paragraph({
    children: [new TextRun({ text: r.name || "", bold: true, size: t.nameSize, color: t.text, font: t.font })],
    spacing: { after: 40 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: r.contact || "", size: 18, color: t.muted, font: t.font })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "e5e7eb" } },
    spacing: { after: 200 },
  }));
  const section = (title) => [
    new Paragraph({
      children: [new TextRun({ text: title.toUpperCase(), size: 18, bold: true, color: t.muted, font: t.font })],
      spacing: { before: 280, after: 100 },
    }),
    new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "e5e7eb" } },
      spacing: { after: 100 },
    }),
  ];
  const bullet = (text) => new Paragraph({
    children: [new TextRun({ text: `–  ${text}`, size: 20, font: t.font, color: t.text })],
    indent: { left: 320 },
    spacing: { after: 80 },
  });
  const line = (text, opts = {}) => new Paragraph({
    children: [new TextRun({ text, size: opts.size || 20, bold: opts.bold, italics: opts.italic, color: opts.color || t.text, font: t.font })],
    spacing: { after: opts.after || 60 },
  });
  children.push(...section("Summary"));
  children.push(line(r.summary || ""));
  children.push(...section("Skills"));
  children.push(line((r.skills || []).join("  ·  "), { color: t.muted }));
  children.push(...section("Experience"));
  (r.experience || []).forEach(exp => {
    children.push(new Paragraph({
      children: [
        new TextRun({ text: exp.title || "", bold: true, size: 21, color: t.text, font: t.font }),
        new TextRun({ text: `   ${exp.company || ""}`, size: 20, color: t.muted, font: t.font }),
        new TextRun({ text: `   ${exp.period || ""}`, size: 18, italics: true, color: t.muted, font: t.font }),
      ],
      spacing: { before: 160, after: 80 },
    }));
    (exp.bullets || []).forEach(b => children.push(bullet(b)));
  });
  children.push(...section("Education"));
  toArray(r.education).forEach(e => children.push(line(e)));
  if (toArray(r.certifications).length > 0) {
    children.push(...section("Certifications"));
    toArray(r.certifications).forEach(c => children.push(bullet(c)));
  }
  return children;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { resume, format = "classic" } = req.body;
    if (!resume) return res.status(400).json({ error: "Resume missing" });

    const t = THEMES[format] || THEMES.classic;
    let children;
    switch (format) {
      case "horizon":    children = buildModern(resume, t);    break;
      case "pinnacle":   children = buildExecutive(resume, t); break;
      case "foundation": children = buildMinimal(resume, t);   break;
      case "slate":      children = buildClassic(resume, { ...t, accent: "111827", accentLight: "f3f4f6" }); break;
      case "prism":      children = buildModern(resume, { ...t, accent: "7c3aed", accentLight: "f5f3ff" }); break;
      default:           children = buildClassic(resume, t);   break;
    }

    const doc = new Document({
      styles: {
        default: {
          document: { run: { font: t.font, size: 20, color: t.text } },
        },
      },
      sections: [{
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(0.9),
              right: convertInchesToTwip(0.9),
            },
          },
        },
        children,
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename=CareerOS_Resume_${format}.docx`);
    return res.send(buffer);
  } catch (err) {
    console.error("downloadResume error:", err);
    return res.status(500).json({ error: "Failed to generate Word document", details: err.message });
  }
}
