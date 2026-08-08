import AdmZip from "adm-zip";
import type { JobRow } from "@/lib/db/types";
import { renderDocx } from "@/lib/cv/generate-docx";
import { renderPdf } from "@/lib/cv/generate-pdf";
import { normalizeCandidate, type CVCandidate } from "@/lib/cv/types";

/**
 * Tamamlanan satırları ZIP arşivine derler. PDF/DOCX, saklanan CV
 * verisinden istek anında (deterministik) render edilir; böylece
 * üretim aşamasında AI çağrısı gerekmez.
 */
export async function buildZip(
  rows: JobRow[]
): Promise<Buffer> {
  const zip = new AdmZip();
  for (const row of rows) {
    const cv = normalizeCandidate(row.output?.cv as CVCandidate | null);
    const safeName = (row.filename ?? `aday_${row.rowIndex + 1}`)
      .replace(/[^\w\sğüşıöçĞÜŞİÖÇ\-]/g, "")
      .replace(/\s+/g, "_")
      .replace(/\.(pdf|docx)$/i, "");
    const pdf = await renderPdf(cv);
    const docx = await renderDocx(cv);
    zip.addFile(`${safeName}.pdf`, pdf);
    zip.addFile(`${safeName}.docx`, docx);
  }
  if (zip.getEntries().length === 0) {
    throw new Error("Arşivlenecek tamamlanmış dosya bulunamadı.");
  }
  return zip.toBuffer();
}
