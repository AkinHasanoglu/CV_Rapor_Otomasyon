import { aiChat, detectProvider, extractJson } from "./providers";
import {
  fromForm,
  injectPlaceholders,
  mergeNotes,
  parseDraft,
  professionalizeText,
} from "./fallback";
import { b2bPrompt, draftPrompt, formPrompt, CV_SYSTEM_PROMPT } from "@/lib/cv/prompts";
import type { CVCandidate } from "@/lib/cv/types";

function parseCandidate(json: Record<string, unknown>): CVCandidate {
  const asString = (v: unknown): string => (typeof v === "string" ? v : String(v ?? ""));
  const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
  const asStrings = (v: unknown): string[] => asArray(v).map(asString);
  const candidate: CVCandidate = {
    fullName: asString(json.fullName ?? json.full_name),
    title: asString(json.title),
    email: asString(json.email),
    phone: asString(json.phone),
    location: asString(json.location),
    linkedin: asString(json.linkedin),
    website: asString(json.website),
    summary: asString(json.summary),
    skills: asStrings(json.skills),
    experience: asArray(json.experience).map((e) => {
      const x = e as Record<string, unknown>;
      return {
        role: asString(x.role),
        company: asString(x.company),
        location: asString(x.location),
        startDate: asString(x.startDate ?? x.start_date),
        endDate: asString(x.endDate ?? x.end_date),
        description: asString(x.description),
        achievements: asStrings(x.achievements),
      };
    }),
    education: asArray(json.education).map((e) => {
      const x = e as Record<string, unknown>;
      return {
        degree: asString(x.degree),
        institution: asString(x.institution),
        startDate: asString(x.startDate ?? x.start_date),
        endDate: asString(x.endDate ?? x.end_date),
        gpa: asString(x.gpa ?? ""),
      };
    }),
    projects: asArray(json.projects).map((p) => {
      const x = p as Record<string, unknown>;
      return {
        name: asString(x.name),
        description: asString(x.description),
        link: asString(x.link ?? ""),
        technologies: asStrings(x.technologies),
      };
    }),
    certifications: asStrings(json.certifications),
    languages: asStrings(json.languages),
    references: asStrings(json.references),
    placeholders: [],
  };
  return candidate;
}

/**
 * Senaryo A: Taslak dosya + ek notlardan CV üretimi.
 * AI varsa prompt zinciri çalışır; yoksa kural tabanlı motor kullanılır.
 */
export async function generateCVFromDraft(
  draftText: string,
  notes: string
): Promise<CVCandidate> {
  const provider = detectProvider();
  if (provider !== "fallback") {
    const raw = await aiChat(CV_SYSTEM_PROMPT, draftPrompt(draftText, notes));
    return injectPlaceholders(parseCandidate(extractJson(raw)));
  }
  const parsed = parseDraft(draftText);
  mergeNotes(parsed, notes);
  return injectPlaceholders(parsed);
}

/**
 * Senaryo B: Dinamik form verisinden CV üretimi.
 */
export async function generateCVFromForm(input: Partial<CVCandidate>): Promise<CVCandidate> {
  const provider = detectProvider();
  if (provider !== "fallback") {
    const raw = await aiChat(CV_SYSTEM_PROMPT, formPrompt(JSON.stringify(input)));
    return injectPlaceholders(parseCandidate(extractJson(raw)));
  }
  return injectPlaceholders(fromForm(input));
}

/**
 * B2B: Excel satırından aday CV'si üretimi (şablon tipine duyarlı).
 */
export async function generateCandidateFromRow(
  row: Record<string, unknown>,
  outputType: "professional" | "resume" | "project"
): Promise<CVCandidate> {
  const provider = detectProvider();
  if (provider !== "fallback") {
    const raw = await aiChat(CV_SYSTEM_PROMPT, b2bPrompt(JSON.stringify(row), outputType));
    return injectPlaceholders(parseCandidate(extractJson(raw)));
  }
  // Offline: satır sütunlarını CV şemasına eşle (kural tabanlı)
  const pick = (...keys: string[]): string => {
    for (const k of keys) {
      const v = row[k];
      if (v !== undefined && v !== null && String(v).trim()) return String(v).trim();
    }
    return "";
  };
  const asList = (key: string): string[] =>
    pick(key)
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

  const firstName = pick("ad", "isim", "first_name", "name");
  const lastName = pick("soyad", "last_name", "surname");
  const raw: Partial<CVCandidate> = {
    fullName: [firstName, lastName].filter(Boolean).join(" "),
    title: pick("unvan", "pozisyon", "title", "role"),
    email: pick("email", "e-posta", "mail"),
    phone: pick("telefon", "phone", "tel"),
    location: pick("şehir", "lokasyon", "location", "city"),
    linkedin: pick("linkedin", "linkedin_url"),
    website: pick("website", "web", "portfolyo"),
    summary: pick("özet", "profil", "summary", "about"),
    skills: asList("yetenekler"),
    experience: [],
    education: [],
    projects: [],
    certifications: asList("sertifikalar"),
    languages: asList("diller"),
  };

  if (raw.summary) raw.summary = professionalizeText(raw.summary);

  if (pick("deneyim", "experience", "iş_deneyimi")) {
    const expText = professionalizeText(pick("deneyim", "experience", "iş_deneyimi"));
    const lines = expText.split(/\n|•/).map((l) => l.trim()).filter(Boolean);
    raw.experience = lines.map((l) => ({
      role: l.split(/[|–-]/)[0]?.trim() ?? l,
      company: l.split(/[|–-]/)[1]?.trim() ?? "",
      location: "",
      startDate: "",
      endDate: "",
      description: l,
      achievements: [],
    }));
  }
  if (pick("eğitim", "education")) {
    const eduText = professionalizeText(pick("eğitim", "education"));
    raw.education = eduText.split(/[;•\n]/).filter(Boolean).map((l) => ({
      degree: l.trim(),
      institution: "",
      startDate: "",
      endDate: "",
    }));
  }
  if (pick("projeler", "projects")) {
    const projText = professionalizeText(pick("projeler", "projects"));
    raw.projects = projText.split(/[;•\n]/).filter(Boolean).map((l) => ({
      name: l.trim(),
      description: l.trim(),
      technologies: [],
    }));
  }

  const candidate = injectPlaceholders(fromForm(raw));

  // Taşeron sunumu: iletişim bilgilerini gizle
  if (outputType === "project") {
    candidate.email = "";
    candidate.phone = "";
    candidate.linkedin = "";
    candidate.website = "";
  }
  if (outputType === "resume") {
    candidate.experience = candidate.experience.slice(0, 2);
    candidate.skills = candidate.skills.slice(0, 8);
    candidate.projects = candidate.projects.slice(0, 2);
    candidate.certifications = candidate.certifications.slice(0, 3);
  }
  return candidate;
}
