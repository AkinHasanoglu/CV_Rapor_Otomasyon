import * as XLSX from "xlsx";

/** Kanonik alan adları (CV şemasına yakın) */
export const CANONICAL_KEYS = [
  "ad",
  "soyad",
  "full_name",
  "email",
  "telefon",
  "sehir",
  "unvan",
  "ozet",
  "yetenekler",
  "deneyim",
  "egitim",
  "projeler",
  "sertifikalar",
  "diller",
  "linkedin",
  "website",
] as const;

/** "Yüklenecek dosyada bulunması gereken veriler ve sütun başlıkları" kılavuzu */
export const COLUMN_GUIDE: { key: string; headers: string[]; required: boolean; description: string }[] = [
  { key: "ad", headers: ["Ad", "İsim", "First Name", "Name"], required: true, description: "Adayın adı" },
  { key: "soyad", headers: ["Soyad", "Last Name", "Surname"], required: true, description: "Adayın soyadı" },
  { key: "email", headers: ["E-posta", "Email", "Mail"], required: false, description: "İletişim e-postası (Taşeron sunumunda gizlenir)" },
  { key: "telefon", headers: ["Telefon", "Phone", "Tel"], required: false, description: "Telefon numarası (Taşeron sunumunda gizlenir)" },
  { key: "sehir", headers: ["Şehir", "City", "Lokasyon", "Location"], required: false, description: "Adayın konumu" },
  { key: "unvan", headers: ["Unvan", "Pozisyon", "Title", "Role"], required: true, description: "Mevcut iş unvanı / uzmanlık alanı" },
  { key: "ozet", headers: ["Özet", "Profil", "Summary", "About"], required: false, description: "1-3 cümlelik profesyonel özet" },
  { key: "yetenekler", headers: ["Yetenekler", "Beceriler", "Skills"], required: true, description: "Virgülle ayrılmış yetenekler (örn: React, Node.js, SQL)" },
  { key: "deneyim", headers: ["Deneyim", "İş Deneyimi", "Experience"], required: false, description: "Satır başına pozisyon | şirket | süre — açıklama ekleyebilirsiniz" },
  { key: "egitim", headers: ["Eğitim", "Education"], required: false, description: "Bölüm, okul ve mezuniyet yılı" },
  { key: "projeler", headers: ["Projeler", "Projects"], required: false, description: "Öne çıkan projeler (varsa)" },
  { key: "sertifikalar", headers: ["Sertifikalar", "Certifications"], required: false, description: "Virgülle ayrılmış sertifikalar" },
  { key: "diller", headers: ["Diller", "Languages"], required: false, description: "Virgülle ayrılmış diller" },
  { key: "linkedin", headers: ["LinkedIn", "LinkedIn URL"], required: false, description: "LinkedIn profili (Taşeron sunumunda gizlenir)" },
  { key: "website", headers: ["Website", "Portfolyo", "Web"], required: false, description: "Kişisel site / portfolyo" },
];

function normalizeHeader(header: string): string | null {
  const h = String(header).trim().toLowerCase().replace(/\s+/g, " ").replace(/[._-]/g, " ");
  for (const col of COLUMN_GUIDE) {
    if (col.headers.some((c) => c.toLowerCase() === h)) return col.key;
  }
  // yakın eşleşme: içerikte geçiyor mu
  for (const col of COLUMN_GUIDE) {
    if (col.headers.some((c) => h.includes(c.toLowerCase()))) return col.key;
  }
  return null;
}

export interface ParsedSheet {
  headers: string[];
  rows: Record<string, unknown>[];
  missingRequired: string[];
  warnings: string[];
}

/**
 * Excel (.xlsx) veya CSV dosyasını ayrıştırır, sütun başlıklarını
 * kanonik alanlara eşler ve gerekli alanları doğrular.
 */
export function parseExcel(buffer: Buffer): ParsedSheet {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error("Dosyada sayfa bulunamadı.");

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  if (rawRows.length === 0) throw new Error("Dosyada veri satırı bulunamadı.");

  const rawHeaders = Object.keys(rawRows[0]);
  const headerMap = new Map<string, string>();
  const unknown: string[] = [];
  for (const h of rawHeaders) {
    const key = normalizeHeader(h);
    if (key) headerMap.set(h, key);
    else unknown.push(h);
  }

  const rows: Record<string, unknown>[] = rawRows.map((raw) => {
    const out: Record<string, unknown> = {};
    for (const [h, key] of headerMap.entries()) {
      const value = String(raw[h] ?? "").trim();
      if (value) out[key] = value;
    }
    return out;
  });

  const missingRequired = COLUMN_GUIDE.filter((c) => c.required && !headerMap.has(c.headers[0]))
    .map((c) => c.headers[0])
    .filter((h, i, arr) => !arr.some((x, j) => x === h && j < i));

  return {
    headers: [...headerMap.values()],
    rows,
    missingRequired,
    warnings: unknown.length
      ? [`Tanınmayan sütunlar: ${unknown.join(", ")}`]
      : [],
  };
}

/** Örnek şablon Excel'i üretir */
export function buildSampleWorkbook(): Buffer {
  const aoa: (string | number | boolean)[][] = [
    COLUMN_GUIDE.map((c) => c.headers[0]),
    [
      "Ayşe",
      "Yılmaz",
      "ayse.yilmaz@ornek.com",
      "+90 532 000 00 00",
      "İstanbul",
      "Senior Frontend Developer",
      "5+ yıl deneyimli, React ve TypeScript uzmanı frontend geliştirici.",
      "React, TypeScript, Next.js, Node.js, SQL, Docker",
      "Senior Frontend Developer | XYZ Teknoloji | 2021 - 2025\nFrontend Developer | ABC Yazılım | 2018 - 2021",
      "Bilgisayar Mühendisliği | İstanbul Teknik Üniversitesi | 2018",
      "E-Ticaret Panel Yenileme - Sipariş yönetim modülü, 2x performans artışı",
      "AWS Certified Developer, PMP",
      "Türkçe (Ana dil), İngilizce (C1)",
      "linkedin.com/in/ayseyilmaz",
      "ayseyilmaz.dev",
    ],
    [
      "Mehmet",
      "Demir",
      "mehmet.demir@ornek.com",
      "+90 533 111 22 33",
      "Ankara",
      "Backend Developer",
      "Microservice mimarilerinde uzman backend geliştirici.",
      "Java, Spring Boot, PostgreSQL, Kafka, AWS",
      "Backend Developer | Finansal Teknolojiler A.Ş. | 2020 - 2025",
      "Yazılım Mühendisliği | Orta Doğu Teknik Üniversitesi | 2020",
      "",
      "Oracle Certified Professional",
      "Türkçe (Ana dil), İngilizce (B2)",
      "linkedin.com/in/mehmetdemir",
      "",
    ],
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = COLUMN_GUIDE.map((c) => ({
    wch: Math.max(...c.headers.map((h) => h.length), c.key.length, 20),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Adaylar");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
