/**
 * CV veri modeli — hem B2C hem B2B akışlarında, AI çıktısı ve şablon
 * motorları tarafından kullanılan tek ortak yapıdır.
 */

export interface ExperienceEntry {
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  achievements: string[];
}

export interface EducationEntry {
  degree: string;
  institution: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface ProjectEntry {
  name: string;
  description: string;
  link?: string;
  technologies: string[];
}

export interface CVCandidate {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  summary: string;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  certifications: string[];
  languages: string[];
  references: string[];
  /** Boş bırakılıp placeholder konulan bölümler (ör. "projects", "references") */
  placeholders: string[];
}

/** Yer tutucu marker'ları — kullanıcı bunları kolayca görüp düzenler */
export const PLACEHOLDER_OPEN = "{{";
export const PLACEHOLDER_CLOSE = "}}";

export function isPlaceholder(text: string): boolean {
  return text.includes(PLACEHOLDER_OPEN) && text.includes(PLACEHOLDER_CLOSE);
}

export function emptyCandidate(): CVCandidate {
  return {
    fullName: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    website: "",
    summary: "",
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    languages: [],
    references: [],
    placeholders: [],
  };
}

/** Eksik alanları varsayılanlarla doldurur (kısmi veriye dayanıklılık) */
export function normalizeCandidate(input: Partial<CVCandidate> | null | undefined): CVCandidate {
  const base = emptyCandidate();
  if (!input || typeof input !== "object") return base;
  return {
    ...base,
    ...input,
    skills: Array.isArray(input.skills) ? input.skills : [],
    experience: Array.isArray(input.experience) ? input.experience : [],
    education: Array.isArray(input.education) ? input.education : [],
    projects: Array.isArray(input.projects) ? input.projects : [],
    certifications: Array.isArray(input.certifications) ? input.certifications : [],
    languages: Array.isArray(input.languages) ? input.languages : [],
    references: Array.isArray(input.references) ? input.references : [],
    placeholders: Array.isArray(input.placeholders) ? input.placeholders : [],
  };
}
