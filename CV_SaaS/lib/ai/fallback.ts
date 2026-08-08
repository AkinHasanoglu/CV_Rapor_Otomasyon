/**
 * Offline fallback motoru: AI API anahtarı tanımlı olmadığında devreye girer.
 * Taslak metni kural tabanlı ayrıştırır, dili profesyonelleştirir ve
 * gereken boş bölümlere placeholder enjekte eder. Böylece uygulama
 * hiçbir harici servise bağımlı olmadan uçtan uca çalışabilir.
 */
import type { CVCandidate } from "@/lib/cv/types";
import { emptyCandidate } from "@/lib/cv/types";

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/;
const PHONE_RE = /(\+?\d[\d\s().-]{8,}\d)/;
const LINKEDIN_RE = /linkedin\.com\/[\w-]+/i;

export function detectLanguage(text: string): "tr" | "en" {
  const trWords = /\b(ve|ile|için|olarak|deneyim|eğitim|beceri|tecrübe|proje)\b/i;
  return trWords.test(text) ? "tr" : "en";
}

export function capitalize(text: string): string {
  // Sadece kelime başlarını büyütür; metnin geri kalanına dokunmaz.
  // (Türkçe "İ" -> "i\u0307" lowercasing sorununu önler)
  return text.replace(/(^|[\s.,;:'"()\-/|])[a-zçğıöşü]/g, (m) => m.toUpperCase());
}

export function professionalizeText(text: string): string {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return "";
  const joined = lines.join(" ");
  const cleaned = joined
    .replace(/\s{2,}/g, " ")
    .replace(/(\w)\.\.+/g, "$1.")
    .replace(/\s([.,;:!?])/g, "$1");
  return capitalize(cleaned);
}

function parseSection(text: string): { header: string; body: string }[] {
  const sectionHeaders =
    /(deneyim|iş deneyimi|eğitim|beceriler|yetenekler|projeler|sertifikalar|diller|referanslar|özet|profil|hakkımda|experience|education|skills|projects|certifications|languages|references|summary|about)/i;
  const lines = text.split(/\n/);
  const sections: { header: string; body: string }[] = [];
  let current: { header: string; body: string } | null = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (sectionHeaders.test(trimmed) && trimmed.length < 60) {
      current = { header: trimmed, body: "" };
      sections.push(current);
    } else if (current) {
      current.body += `${trimmed}\n`;
    }
  }
  return sections;
}

export function parseDraft(text: string): Partial<CVCandidate> {
  const result: Partial<CVCandidate> = {};
  const sections = parseSection(text);

  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  // Ad: ilk satır veya "Ad Soyad:" kalıbı
  const nameLine =
    lines.find((l) => /^(ad|name|isim|adı|soyad)\s*[:\-]/i.test(l)) ??
    lines.find((l) => l.length < 60 && !EMAIL_RE.test(l) && !PHONE_RE.test(l));
  if (nameLine) {
    result.fullName = capitalize(nameLine.replace(/^(ad|name|isim)\s*[:\-]\s*/i, ""));
  }

  const email = text.match(EMAIL_RE);
  if (email) result.email = email[0];
  const phone = text.match(PHONE_RE);
  if (phone) result.phone = phone[0].trim();
  const linkedin = text.match(LINKEDIN_RE);
  if (linkedin) result.linkedin = `https://www.${linkedin[0]}`;

  const summarySection = sections.find((s) =>
    /(profil|özet|hakkımda|summary|profile)/i.test(s.header)
  );
  if (summarySection) result.summary = professionalizeText(summarySection.body);

  const expSection = sections.find((s) => /(deneyim|experience)/i.test(s.header));
  if (expSection) {
    const entries = expSection.body
      .split(/\n{2,}|\n(?=[A-ZÇĞİÖŞÜ][\wğüşöçıİĞÜŞÖÇ]\w*\s*(?:-\s*|–\s*|,|$))/)
      .filter((b) => b.trim().length > 10);
    result.experience = entries.map((e) => {
      const roleCompany = e
        .split(/\n/)
        .find((l) => l.includes("|") || l.includes("-") || l.includes("–"));
      const [role = "", company = ""] = roleCompany
        ? roleCompany.split(/\s*[|\-–]\s*/)
        : [e.split(/\n/)[0] ?? "", ""];
      return {
        role: capitalize(role.trim()),
        company: capitalize(company.trim()),
        location: "",
        startDate: "",
        endDate: "",
        description: professionalizeText(e),
        achievements: [],
      };
    });
  }

  const eduSection = sections.find((s) => /(eğitim|education)/i.test(s.header));
  if (eduSection) {
    result.education = eduSection.body
      .split(/\n{2,}/)
      .filter((b) => b.trim().length > 5)
      .map((e) => ({
        degree: capitalize(e.trim()),
        institution: "",
        startDate: "",
        endDate: "",
      }));
  }

  const skillSection = sections.find((s) => /(beceri|yetenek|skills)/i.test(s.header));
  if (skillSection) {
    result.skills = skillSection.body
      .split(/[,\n;•]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1)
      .slice(0, 20);
  }

  const projectSection = sections.find((s) => /(proje|projects)/i.test(s.header));
  if (projectSection) {
    result.projects = projectSection.body
      .split(/\n{2,}/)
      .filter((b) => b.trim().length > 5)
      .map((p) => ({
        name: capitalize(p.split(/\n/)[0]?.trim() ?? "Proje"),
        description: professionalizeText(p),
        technologies: [],
      }));
  }

  const langSection = sections.find((s) => /(dil|languages)/i.test(s.header));
  if (langSection) {
    result.languages = langSection.body
      .split(/[,\n;]/)
      .map((l) => l.trim())
      .filter((l) => l.length > 1);
  }

  return result;
}

export function fromForm(input: Partial<CVCandidate>): Partial<CVCandidate> {
  const out: Partial<CVCandidate> = {
    fullName: input.fullName ? capitalize(input.fullName) : "",
    title: input.title ? capitalize(input.title) : "",
    email: input.email ?? "",
    phone: input.phone ?? "",
    location: input.location ?? "",
    linkedin: input.linkedin ?? "",
    website: input.website ?? "",
    summary: input.summary ? professionalizeText(input.summary) : "",
    skills: input.skills?.map((s) => capitalize(s)).filter(Boolean) ?? [],
    experience: (input.experience ?? []).map((e) => ({
      role: capitalize(e.role ?? ""),
      company: capitalize(e.company ?? ""),
      location: e.location ?? "",
      startDate: e.startDate ?? "",
      endDate: e.endDate ?? "",
      description: e.description ? professionalizeText(e.description) : "",
      achievements: e.achievements?.filter(Boolean) ?? [],
    })),
    education: (input.education ?? []).map((e) => ({
      degree: capitalize(e.degree ?? ""),
      institution: capitalize(e.institution ?? ""),
      startDate: e.startDate ?? "",
      endDate: e.endDate ?? "",
      gpa: e.gpa,
    })),
    projects: (input.projects ?? []).map((p) => ({
      name: capitalize(p.name ?? ""),
      description: p.description ? professionalizeText(p.description) : "",
      link: p.link,
      technologies: p.technologies ?? [],
    })),
    certifications: input.certifications?.filter(Boolean) ?? [],
    languages: input.languages?.filter(Boolean) ?? [],
    references: input.references?.filter(Boolean) ?? [],
  };
  return out;
}

export function mergeNotes(candidate: Partial<CVCandidate>, notes: string): void {
  const trimmed = notes?.trim();
  if (!trimmed) return;
  const current = candidate.summary ?? "";
  candidate.summary = professionalizeText(`${current}\n${trimmed}`);
}

/** Şablon gerektirip boş kalan bölümlere placeholder enjekte eder */
export function injectPlaceholders(candidate: Partial<CVCandidate>): CVCandidate {
  const out: CVCandidate = {
    ...emptyCandidate(),
    ...candidate,
    placeholders: [],
  };
  const ph = (label: string) => `${"{{"}${label}${"}}"}`;

  const missing: { check: boolean; name: string; content: string }[] = [
    {
      check: !out.summary,
      name: "Profesyonel Özet",
      content: ph("buraya 2-3 cümlelik profesyonel özetinizi yazın"),
    },
    {
      check: out.experience.length === 0,
      name: "İş Deneyimi",
      content: ph("buraya ilk iş deneyiminizi ekleyin"),
    },
    {
      check: out.education.length === 0,
      name: "Eğitim",
      content: ph("buraya eğitim bilgilerinizi ekleyin"),
    },
    {
      check: out.projects.length === 0,
      name: "Projeler",
      content: ph("buraya öne çıkan projelerinizi ekleyin"),
    },
    {
      check: out.references.length === 0,
      name: "Referanslar",
      content: ph("referanslarınız istek üzerine iletilecektir"),
    },
  ];

  for (const m of missing) {
    if (!m.check) continue;
    out.placeholders.push(m.name);
    if (m.name === "Profesyonel Özet") out.summary = m.content;
    else if (m.name === "İş Deneyimi") {
      out.experience = [
        {
          role: ph("Pozisyon"),
          company: ph("Şirket"),
          location: ph("Şehir"),
          startDate: ph("Başlangıç"),
          endDate: ph("Bitiş"),
          description: m.content,
          achievements: [],
        },
      ];
    } else if (m.name === "Eğitim") {
      out.education = [
        {
          degree: ph("Bölüm / Derece"),
          institution: ph("Üniversite"),
          startDate: ph("Başlangıç"),
          endDate: ph("Bitiş"),
        },
      ];
    } else if (m.name === "Projeler") {
      out.projects = [
        { name: ph("Proje adı"), description: m.content, technologies: [] },
      ];
    } else {
      out.references = [m.content];
    }
  }
  return out;
}
