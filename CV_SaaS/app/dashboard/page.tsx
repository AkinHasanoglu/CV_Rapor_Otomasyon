import Link from "next/link";
import { getCurrentUser } from "@/lib/api";
import { getStore } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export default async function DashboardHome({
  searchParams,
}: PageProps<"/dashboard">) {
  const user = (await getCurrentUser())!;
  const store = getStore();
  const [docs, jobs] = await Promise.all([
    store.listDocuments(user.id),
    user.role === "b2b" ? store.listJobs(user.id) : Promise.resolve([]),
  ]);

  const sp = await searchParams;
  const upgrade = sp.upgrade;
  const simulated = sp.simulated;

  return (
    <div className="space-y-8">
      {(upgrade === "success" || simulated === "1") && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          {simulated === "1"
            ? "Ödeme simülasyonu tamamlandı — planınız etkinleştirildi. (Canlı ödeme için STRIPE_SECRET_KEY tanımlayın.)"
            : "Ödemeniz alındı, planınız etkinleştirildi. İyi kullanımlar!"}
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-brand to-blue-600 p-8 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black">Merhaba, {user.fullName.split(" ")[0]} 👋</h1>
          <p className="mt-1 text-blue-100">
            {user.role === "b2b"
              ? "Excel'deki adaylarınızı toplu işleyin veya kendi CV'nizi oluşturun."
              : "CV'nizi oluşturmak için aşağıdaki yöntemlerden birini seçin."}
          </p>
        </div>
        <Link href="/dashboard/cv/new">
          <Button className="bg-white text-brand hover:bg-blue-50" size="lg">
            + Yeni CV Oluştur
          </Button>
        </Link>
      </div>

      {docs.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900">Son CV&apos;lerin</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {docs.slice(0, 4).map((d) => (
              <Link
                key={d.id}
                href={`/dashboard/cv/${d.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand hover:shadow-sm"
              >
                <p className="font-bold text-slate-900">{d.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {d.source === "draft" ? "Taslaktan üretildi" : "Formdan üretildi"} ·{" "}
                  {formatDate(d.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {user.role === "b2b" && jobs.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900">Son Toplu İşler</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {jobs.slice(0, 4).map((j) => (
              <Link
                key={j.id}
                href={`/dashboard/b2b/jobs/${j.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand hover:shadow-sm"
              >
                <p className="font-bold text-slate-900">{j.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {j.totalRows} aday · {formatDate(j.createdAt)} ·{" "}
                  <span className="font-bold text-brand">{j.status}</span>
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {user.plan === "free" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm text-amber-800">
            <strong>Ücretsiz plandasınız.</strong> Tek CV oluşturabilirsiniz — sınırsız CV
            ve AI profesyonelleştirme için{" "}
            <Link href="/pricing" className="font-bold underline">
              Bireysel plana yükseltin
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
