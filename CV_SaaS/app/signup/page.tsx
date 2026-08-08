"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Alert } from "@/components/ui/modal";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const body = {
      fullName: form.get("fullName"),
      email: form.get("email"),
      password: form.get("password"),
      role: form.get("role"),
    };

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Kayıt başarısız.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-black text-slate-900">Hesap Oluştur</h1>
      <p className="mt-2 text-sm text-slate-500">
        Ücretsiz hesabınızla hemen CV oluşturmaya başlayın.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <Field label="Ad Soyad">
          <Input name="fullName" required placeholder="Adınız soyadınız" />
        </Field>
        <Field label="E-posta">
          <Input name="email" type="email" required placeholder="ornek@mail.com" />
        </Field>
        <Field label="Şifre" hint="en az 8 karakter">
          <Input name="password" type="password" required minLength={8} placeholder="••••••••" />
        </Field>
        <Field label="Hesap Tipi">
          <Select name="role" defaultValue="b2c">
            <option value="b2c">Bireysel — CV oluşturup indirmek istiyorum</option>
            <option value="b2b">Kurumsal — Excel ile toplu aday işlemek istiyorum</option>
          </Select>
        </Field>
        {error && <Alert tone="error">{error}</Alert>}
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Kayıt Ol
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Zaten hesabınız var mı?{" "}
        <Link href="/signin" className="font-bold text-brand hover:underline">
          Giriş yapın
        </Link>
      </p>
    </div>
  );
}
