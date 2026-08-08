import PDFDocument from "pdfkit";
import path from "path";
import { normalizeCandidate, type CVCandidate } from "./types";

const FONT_DIR = path.join(process.cwd(), "lib", "fonts");
const FONT_REGULAR = path.join(FONT_DIR, "DejaVuSans.ttf");
const FONT_BOLD = path.join(FONT_DIR, "DejaVuSans-Bold.ttf");

const ACCENT = "#1a56db";
const DARK = "#1f2937";
const GRAY = "#4b5563";

interface DocOptions {
  title?: string;
  hideContact?: boolean;
}

/**
 * Profesyonel CV şablonu -> PDF (pdfkit). Türkçe karakter desteği için
 * DejaVuSans fontları gömülüdür. (pdfkit çıktıyı asenkron stream eder;
 * buffer, stream "end" olayında tamamlanır.)
 */
export async function renderPdf(
  candidate: CVCandidate,
  options: DocOptions = {}
): Promise<Buffer> {
  candidate = normalizeCandidate(candidate);
  const doc = new PDFDocument({ margin: 48, size: "A4" });
  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.registerFont("DejaVu", FONT_REGULAR);
  doc.registerFont("DejaVuBold", FONT_BOLD);

  const regular = "DejaVu";
  const bold = "DejaVuBold";

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  const sectionTitle = (title: string) => {
    doc.moveDown(0.4);
    doc.fillColor(ACCENT).font(bold).fontSize(13).text(title.toUpperCase(), {
      characterSpacing: 0.5,
    });
    doc
      .moveTo(doc.page.margins.left, doc.y + 3)
      .lineTo(doc.page.margins.left + pageWidth, doc.y + 3)
      .lineWidth(1.2)
      .strokeColor(ACCENT)
      .stroke();
    doc.moveDown(0.6);
  };

  const bullet = (text: string, indent = 0) => {
    const left = doc.page.margins.left + 12 + indent;
    doc
      .fillColor(ACCENT)
      .font(bold)
      .fontSize(7)
      .text("•", left, doc.y + 3.5);
    doc
      .fillColor(DARK)
      .font(regular)
      .fontSize(10)
      .text(text, left + 8, doc.y, {
        width: pageWidth - 20 - indent,
        lineGap: 2,
      });
    doc.moveDown(0.2);
  };

  const entryHeader = (main: string, sub: string, right: string) => {
    doc.fillColor(DARK).font(bold).fontSize(10.5).text(main, {
      width: pageWidth,
      continued: true,
    });
    if (right) {
      doc.fillColor(GRAY).font(regular).fontSize(9.5).text(right, {
        align: "right",
      });
    } else {
      doc.moveDown(0.1);
    }
    if (sub) {
      doc.fillColor(ACCENT).font(bold).fontSize(9.5).text(sub, { width: pageWidth });
    }
  };

  // ── Başlık ─────────────────────────────────────────────
  const name = candidate.fullName || "Ad Soyad";
  doc.fillColor(DARK).font(bold).fontSize(24).text(name);
  if (candidate.title) {
    doc.fillColor(ACCENT).font(bold).fontSize(13).text(candidate.title);
  }
  doc.moveDown(0.25);

  const contactParts: string[] = [];
  if (!options.hideContact) {
    if (candidate.email) contactParts.push(candidate.email);
    if (candidate.phone) contactParts.push(candidate.phone);
    if (candidate.location) contactParts.push(candidate.location);
    if (candidate.linkedin) contactParts.push(candidate.linkedin);
    if (candidate.website) contactParts.push(candidate.website);
  }
  if (contactParts.length > 0) {
    doc
      .fillColor(GRAY)
      .font(regular)
      .fontSize(9)
      .text(contactParts.join("  |  "), { width: pageWidth });
  }

  doc.moveTo(doc.page.margins.left, doc.y + 6)
    .lineTo(doc.page.margins.left + pageWidth, doc.y + 6)
    .lineWidth(2)
    .strokeColor(ACCENT)
    .stroke();
  doc.moveDown(0.3);

  // ── Özet ───────────────────────────────────────────────
  if (candidate.summary) {
    sectionTitle("Profesyonel Özet");
    doc.fillColor(DARK).font(regular).fontSize(10).text(candidate.summary, {
      width: pageWidth,
      lineGap: 2,
    });
  }

  // ── Deneyim ────────────────────────────────────────────
  if (candidate.experience.length > 0) {
    sectionTitle("İş Deneyimi");
    for (const exp of candidate.experience) {
      entryHeader(
        exp.role,
        exp.company || exp.location,
        exp.startDate && exp.endDate ? `${exp.startDate} – ${exp.endDate}` : ""
      );
      if (exp.description && !/^\{/.test(exp.description)) {
        doc
          .fillColor(GRAY)
          .font(regular)
          .fontSize(9.5)
          .text(exp.description, { width: pageWidth, lineGap: 2 });
      }
      for (const a of exp.achievements) bullet(a);
      doc.moveDown(0.35);
    }
  }

  // ── Eğitim ─────────────────────────────────────────────
  if (candidate.education.length > 0) {
    sectionTitle("Eğitim");
    for (const edu of candidate.education) {
      entryHeader(
        edu.degree,
        edu.institution,
        edu.startDate && edu.endDate ? `${edu.startDate} – ${edu.endDate}` : ""
      );
      if (edu.gpa) bullet(`Not ortalaması: ${edu.gpa}`);
      doc.moveDown(0.3);
    }
  }

  // ── Projeler ───────────────────────────────────────────
  if (candidate.projects.length > 0) {
    sectionTitle("Projeler");
    for (const p of candidate.projects) {
      const tech = p.technologies.length > 0 ? ` (${p.technologies.join(", ")})` : "";
      entryHeader(p.name, tech, p.link ?? "");
      if (p.description) {
        doc
          .fillColor(GRAY)
          .font(regular)
          .fontSize(9.5)
          .text(p.description, { width: pageWidth, lineGap: 2 });
      }
      doc.moveDown(0.3);
    }
  }

  // ── Yetenekler ─────────────────────────────────────────
  if (candidate.skills.length > 0) {
    sectionTitle("Yetenekler");
    const mid = Math.ceil(candidate.skills.length / 2);
    const col1 = candidate.skills.slice(0, mid);
    const col2 = candidate.skills.slice(mid);
    col1.forEach((s, i) => {
      const startY = doc.y;
      doc.fillColor(DARK).font(regular).fontSize(10).text(s, {
        width: pageWidth / 2 - 10,
      });
      if (col2[i]) {
        doc.fillColor(DARK).font(regular).fontSize(10).text(col2[i], doc.page.margins.left + pageWidth / 2, startY, {
          width: pageWidth / 2 - 10,
        });
      }
    });
  }

  // ── Sertifikalar & Diller ──────────────────────────────
  if (candidate.certifications.length > 0) {
    sectionTitle("Sertifikalar");
    candidate.certifications.forEach((c) => bullet(c));
  }
  if (candidate.languages.length > 0) {
    sectionTitle("Diller");
    doc
      .fillColor(DARK)
      .font(regular)
      .fontSize(10)
      .text(candidate.languages.join("  •  "), { width: pageWidth });
  }

  // ── Referanslar ────────────────────────────────────────
  if (candidate.references.length > 0) {
    sectionTitle("Referanslar");
    candidate.references.forEach((r) => bullet(r));
  }

  doc.end();
  return done;
}
