import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

/**
 * Kullanıcının yüklediği CV taslağını (PDF / DOCX / TXT) düz metne çevirir.
 */
export async function extractTextFromDraft(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (ext === "pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text || "";
    } finally {
      await parser.destroy();
    }
  }

  if (ext === "docx" || ext === "doc") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }

  if (ext === "txt" || ext === "md" || ext === "text") {
    return buffer.toString("utf-8");
  }

  // Bilinmeyen: utf-8 olarak dene
  return buffer.toString("utf-8");
}

export function safeFileName(name: string): string {
  const cleaned = name
    .replace(/[^\w\sğüşıöçĞÜŞİÖÇ\-.]/g, "")
    .replace(/\s+/g, "_")
    .trim();
  return cleaned || "cv";
}
