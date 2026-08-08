"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { CVCandidate } from "@/lib/cv/types";

type Scenario = "draft" | "form";

/** Senaryo A: Taslak yükleme paneli */
function DraftPanel() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Lütfen bir dosya seçin (PDF, DOCX veya TXT).");
      return;
    }
    setLoading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    form.append("notes", notes);
    form.append("title", title);
    try {
      const res = await fetch("/api/cv/from-draft", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "CV üretilemedi.");
      router.push(`/dashboard/cv/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="CV Taslağı" hint="PDF, DOCX veya TXT">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-brand">
          <span className="text-3xl">📄</span>
          {file ? (
            <span className="mt-2 text-sm font-bold text-slate-900">{file.name}</span>
          ) : (
            <>
              <span className="mt-2 text-sm font-bold text-slate-700">
                Dosya seçmek için tıklayın
              </span>
              <span className="text-xs text-slate-400">veya buraya sürükleyin</span>
            </>
          )}
          <input
            type="file"
            accept=".pdf,.docx,.doc,.txt,.md,.text"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </Field>

      <Field label="Ek Notlar / Talepler" hint="opsiyonel">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Örn: 2 yıllık staj deneyimimi ekle, İngilizce seviyemi C1 olarak güncelle, dilini daha güçlü hale getir..."
        />
      </Field>

      <Field label="CV Başlığı" hint="opsiyonel">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Örn: Frontend Developer CV"
        />
      </Field>

      {error && <Alert tone="error">{error}</Alert>}
      <Button type="submit" loading={loading} size="lg" className="w-full">
        AI ile CV&apos;mi Oluştur
      </Button>
    </form>
  );
}

const EXP_FIELDS = ["role", "company", "location", "startDate", "endDate", "description"] as const;
const EXP_LABELS: Record<string, string> = {
  role: "Pozisyon",
  company: "Şirket",
  location: "Şehir",
  startDate: "Başlangıç",
  endDate: "Bitiş",
  description: "Açıklama",
};

/** Senaryo B: Sıfırdan dinamik form */
function FormPanel() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Partial<CVCandidate>>({
    fullName: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    summary: "",
    skills: [],
    experience: [{ role: "", company: "", location: "", startDate: "", endDate: "", description: "", achievements: [] }],
    education: [{ degree: "", institution: "", startDate: "", endDate: "", gpa: "" }],
    projects: [{ name: "", description: "", link: "", technologies: [] }],
    certifications: [],
    languages: [],
  });

  const set = (key: keyof CVCandidate, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setExp = (i: number, key: string, value: string) => {
    const list = (form.experience ?? []).map((e, idx) =>
      idx === i ? ({ ...e, [key]: value } as typeof e) : e
    );
    set("experience", list);
  };
  const setEdu = (i: number, key: string, value: string) => {
    const list = (form.education ?? []).map((e, idx) =>
      idx === i ? ({ ...e, [key]: value } as typeof e) : e
    );
    set("education", list);
  };
  const setProject = (i: number, key: string, value: string) => {
    const list = (form.projects ?? []).map((p, idx) =>
      idx === i ? ({ ...p, [key]: value } as typeof p) : p
    );
    set("projects", list);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/cv/from-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, cv: form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "CV üretilemedi.");
      router.push(`/dashboard/cv/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Field label="CV Başlığı" hint="opsiyonel">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn: Yazılım Mühendisi CV" />
      </Field>

      <section className="rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-900">Kişisel Bilgiler</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Ad Soyad">
            <Input value={form.fullName ?? ""} onChange={(e) => set("fullName", e.target.value)} placeholder="Ad Soyad" />
          </Field>
          <Field label="Profesyonel Unvan">
            <Input value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="Örn: Backend Developer" />
          </Field>
          <Field label="E-posta">
            <Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} placeholder="ornek@mail.com" />
          </Field>
          <Field label="Telefon">
            <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="+90 ..." />
          </Field>
          <Field label="Şehir">
            <Input value={form.location ?? ""} onChange={(e) => set("location", e.target.value)} placeholder="İstanbul" />
          </Field>
          <Field label="LinkedIn">
            <Input value={form.linkedin ?? ""} onChange={(e) => set("linkedin", e.target.value)} placeholder="linkedin.com/in/..." />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Profesyonel Özet" hint="boş bırakabilirsiniz — AI sizin için bir başlangıç yazar">
            <Textarea value={form.summary ?? ""} onChange={(e) => set("summary", e.target.value)} placeholder="Kısa profesyonel özetiniz..." />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900">İş Deneyimi</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              set("experience", [
                ...(form.experience ?? []),
                { role: "", company: "", location: "", startDate: "", endDate: "", description: "", achievements: [] },
              ])
            }
          >
            + Ekle
          </Button>
        </div>
        <p className="mt-1 text-xs text-slate-400">İstediğiniz alanı boş bırakabilirsiniz.</p>
        <div className="mt-3 space-y-4">
          {(form.experience ?? []).map((exp, i) => (
            <div key={i} className="rounded-xl bg-slate-50 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {EXP_FIELDS.map((f) => (
                  <div key={f} className={f === "description" ? "sm:col-span-2" : ""}>
                    <Label>{EXP_LABELS[f]}</Label>
                    <Input
                      value={(exp as unknown as Record<string, string>)[f]}
                      onChange={(e) => setExp(i, f, e.target.value)}
                      placeholder={EXP_LABELS[f]}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Eğitim</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              set("education", [
                ...(form.education ?? []),
                { degree: "", institution: "", startDate: "", endDate: "", gpa: "" },
              ])
            }
          >
            + Ekle
          </Button>
        </div>
        <div className="mt-3 space-y-4">
          {(form.education ?? []).map((edu, i) => (
            <div key={i} className="rounded-xl bg-slate-50 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Bölüm / Derece">
                  <Input value={edu.degree} onChange={(e) => setEdu(i, "degree", e.target.value)} placeholder="Bilgisayar Mühendisliği" />
                </Field>
                <Field label="Kurum">
                  <Input value={edu.institution} onChange={(e) => setEdu(i, "institution", e.target.value)} placeholder="Üniversite" />
                </Field>
                <Field label="Başlangıç">
                  <Input value={edu.startDate} onChange={(e) => setEdu(i, "startDate", e.target.value)} placeholder="2020" />
                </Field>
                <Field label="Bitiş">
                  <Input value={edu.endDate} onChange={(e) => setEdu(i, "endDate", e.target.value)} placeholder="2024" />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Projeler</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              set("projects", [
                ...(form.projects ?? []),
                { name: "", description: "", link: "", technologies: [] },
              ])
            }
          >
            + Ekle
          </Button>
        </div>
        <div className="mt-3 space-y-4">
          {(form.projects ?? []).map((p, i) => (
            <div key={i} className="rounded-xl bg-slate-50 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Proje Adı">
                  <Input value={p.name} onChange={(e) => setProject(i, "name", e.target.value)} placeholder="Proje adı" />
                </Field>
                <Field label="Link" hint="opsiyonel">
                  <Input value={p.link ?? ""} onChange={(e) => setProject(i, "link", e.target.value)} placeholder="https://..." />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Açıklama">
                    <Textarea value={p.description} onChange={(e) => setProject(i, "description", e.target.value)} placeholder="Proje açıklaması..." />
                  </Field>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-900">Yetenekler & Diller</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Yetenekler" hint="virgülle ayırın">
            <Input value={(form.skills ?? []).join(", ")} onChange={(e) => set("skills", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} placeholder="React, TypeScript, SQL" />
          </Field>
          <Field label="Diller" hint="virgülle ayırın">
            <Input value={(form.languages ?? []).join(", ")} onChange={(e) => set("languages", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} placeholder="Türkçe, İngilizce" />
          </Field>
        </div>
      </section>

      {error && <Alert tone="error">{error}</Alert>}
      <Button type="submit" loading={loading} size="lg" className="w-full">
        AI ile CV&apos;mi Oluştur
      </Button>
    </form>
  );
}

export default function NewCvPage() {
  const [scenario, setScenario] = useState<Scenario>("draft");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Yeni CV Oluştur</h1>
        <p className="mt-1 text-sm text-slate-500">
          İki yöntemden birini seçin. Boş bırakılan zorunlu alanlar için AI size
          yer tutucular ekler.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
        {(
          [
            { id: "draft", label: "📄 Taslak Yükle", desc: "Mevcut CV'ni geliştir" },
            { id: "form", label: "✍️ Form ile", desc: "Sıfırdan başla" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setScenario(t.id)}
            className={cn(
              "rounded-xl px-4 py-3 text-left transition",
              scenario === t.id ? "bg-white shadow-sm" : "hover:bg-white/60"
            )}
          >
            <span className="block text-sm font-bold text-slate-900">{t.label}</span>
            <span className="block text-xs text-slate-500">{t.desc}</span>
          </button>
        ))}
      </div>

      {scenario === "draft" ? <DraftPanel /> : <FormPanel />}
    </div>
  );
}
