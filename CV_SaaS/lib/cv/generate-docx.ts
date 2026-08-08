import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { normalizeCandidate, type CVCandidate } from "./types";

const ACCENT = "1A56DB";
const DARK = "1F2937";
const GRAY = "4B5563";

interface DocOptions {
  title?: string;
  hideContact?: boolean;
}

/**
 * Aynı CV şablonunu Microsoft Word (.docx) olarak üretir.
 */
export async function renderDocx(
  candidate: CVCandidate,
  options: DocOptions = {}
): Promise<Buffer> {
  candidate = normalizeCandidate(candidate);
  const children: Paragraph[] = [];

  const section = (title: string) => {
    children.push(
      new Paragraph({
        spacing: { before: 260, after: 80 },
        border: {
          bottom: { color: ACCENT, style: BorderStyle.SINGLE, size: 8, space: 4 },
        },
        children: [
          new TextRun({ text: title.toUpperCase(), bold: true, color: ACCENT, size: 26 }),
        ],
      })
    );
  };

  const body = (text: string, opts: { bold?: boolean; color?: string } = {}) => {
    children.push(
      new Paragraph({
        spacing: { after: 60, line: 300 },
        children: [
          new TextRun({
            text,
            bold: opts.bold,
            color: opts.color ?? DARK,
            size: 20,
          }),
        ],
      })
    );
  };

  const bullet = (text: string) => {
    children.push(
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 40, line: 280 },
        children: [new TextRun({ text, color: DARK, size: 20 })],
      })
    );
  };

  // ── Başlık ─────────────────────────────────────────────
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.LEFT,
      spacing: { after: 40 },
      children: [new TextRun({ text: candidate.fullName || "Ad Soyad", color: DARK })],
    })
  );
  if (candidate.title) {
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: candidate.title, bold: true, color: ACCENT, size: 28 })],
      })
    );
  }

  const contact: string[] = [];
  if (!options.hideContact) {
    if (candidate.email) contact.push(candidate.email);
    if (candidate.phone) contact.push(candidate.phone);
    if (candidate.location) contact.push(candidate.location);
    if (candidate.linkedin) contact.push(candidate.linkedin);
    if (candidate.website) contact.push(candidate.website);
  }
  if (contact.length > 0) {
    children.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: contact.join("  |  "),
            color: GRAY,
            size: 18,
          }),
        ],
      })
    );
  }

  // ── Özet ───────────────────────────────────────────────
  if (candidate.summary) {
    section("Profesyonel Özet");
    body(candidate.summary);
  }

  // ── Deneyim ────────────────────────────────────────────
  if (candidate.experience.length > 0) {
    section("İş Deneyimi");
    for (const exp of candidate.experience) {
      const dateRange = exp.startDate && exp.endDate ? `${exp.startDate} – ${exp.endDate}` : "";
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 20 },
          children: [
            new TextRun({ text: exp.role, bold: true, color: DARK, size: 21 }),
            new TextRun({ text: `\t${dateRange}`, color: GRAY, size: 18 }),
          ],
        })
      );
      if (exp.company || exp.location) {
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: [exp.company, exp.location].filter(Boolean).join(" · "),
                bold: true,
                color: ACCENT,
                size: 19,
              }),
            ],
          })
        );
      }
      if (exp.description && !/^\{/.test(exp.description)) body(exp.description);
      exp.achievements.forEach(bullet);
    }
  }

  // ── Eğitim ─────────────────────────────────────────────
  if (candidate.education.length > 0) {
    section("Eğitim");
    for (const edu of candidate.education) {
      const dateRange = edu.startDate && edu.endDate ? `${edu.startDate} – ${edu.endDate}` : "";
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 20 },
          children: [
            new TextRun({ text: edu.degree, bold: true, color: DARK, size: 21 }),
            new TextRun({ text: `\t${dateRange}`, color: GRAY, size: 18 }),
          ],
        })
      );
      if (edu.institution) body(edu.institution);
      if (edu.gpa) bullet(`Not ortalaması: ${edu.gpa}`);
    }
  }

  // ── Projeler ───────────────────────────────────────────
  if (candidate.projects.length > 0) {
    section("Projeler");
    for (const p of candidate.projects) {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 20 },
          children: [
            new TextRun({ text: p.name, bold: true, color: DARK, size: 21 }),
            new TextRun({
              text: p.technologies.length > 0 ? `  (${p.technologies.join(", ")})` : "",
              color: GRAY,
              size: 18,
            }),
          ],
        })
      );
      if (p.link) body(p.link);
      if (p.description) body(p.description);
    }
  }

  // ── Yetenekler ─────────────────────────────────────────
  if (candidate.skills.length > 0) {
    section("Yetenekler");
    body(candidate.skills.join("  •  "));
  }

  // ── Sertifikalar & Diller ──────────────────────────────
  if (candidate.certifications.length > 0) {
    section("Sertifikalar");
    candidate.certifications.forEach(bullet);
  }
  if (candidate.languages.length > 0) {
    section("Diller");
    body(candidate.languages.join("  •  "));
  }

  // ── Referanslar ────────────────────────────────────────
  if (candidate.references.length > 0) {
    section("Referanslar");
    candidate.references.forEach(bullet);
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 20, color: DARK },
          paragraph: { spacing: { line: 300 } },
        },
      },
    },
    sections: [
      {
        properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
