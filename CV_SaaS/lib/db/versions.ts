import { randomUUID } from "crypto";
import type { Document, DocumentVersion } from "./types";

/** Belge başına tutulan sürüm sayısı üst sınırı */
export const MAX_VERSIONS = 20;

/**
 * Belgenin mevcut durumunu anlık görüntü olarak sürüm geçmişine ekler.
 * Son sürümle birebir aynıysa ekleme yapmaz; sınırı aşınca eski sürümleri düşürür.
 */
export function snapshotVersion(doc: Document): DocumentVersion[] {
  const versions = doc.versions ?? [];
  const last = versions[versions.length - 1];
  const sameAsLast =
    last &&
    last.title === doc.title &&
    JSON.stringify(last.cvData) === JSON.stringify(doc.cvData);
  if (sameAsLast) return versions;
  versions.push({
    id: randomUUID(),
    title: doc.title,
    cvData: doc.cvData,
    createdAt: new Date().toISOString(),
  });
  return versions.slice(-MAX_VERSIONS);
}
