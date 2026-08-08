"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Alert } from "@/components/ui/modal";

export default function ContactPage() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          message: form.get("message"),
        }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gönderilemedi.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 sm:px-6">
        <Alert tone="success">
          Mesajınız alındı! En geç 1 iş günü içinde size dönüş yapacağız.
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-black text-slate-900">İletişim</h1>
      <p className="mt-3 text-slate-500">
        Sorularınız, kurumsal faturalama talepleri ve demo istekleri için bize
        yazın.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <Field label="Ad Soyad">
          <Input name="name" required placeholder="Adınız soyadınız" />
        </Field>
        <Field label="E-posta">
          <Input name="email" type="email" required placeholder="ornek@mail.com" />
        </Field>
        <Field label="Mesajınız">
          <Textarea name="message" required placeholder="Mesajınız..." className="min-h-36" />
        </Field>
        {error && <Alert tone="error">{error}</Alert>}
        <Button type="submit" loading={sending} className="w-full" size="lg">
          Gönder
        </Button>
      </form>
    </div>
  );
}
