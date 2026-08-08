import Link from "next/link";
import { getCurrentUser } from "@/lib/api";
import { getStore } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CvListPage() {
  const user = (await getCurrentUser())!;
  const docs = await getStore().listDocuments(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900">CV&apos;lerim</h1>
        <Link href="/dashboard/cv/new">
          <Button>+ Yeni CV</Button>
        </Link>
      </div>

      {docs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p className="text-lg font-bold text-slate-700">Henüz CV&apos;niz yok</p>
          <p className="mt-1 text-sm text-slate-500">
            Taslağınızı yükleyerek veya formu doldurarak ilk CV&apos;nizi oluşturun.
          </p>
          <Link href="/dashboard/cv/new" className="mt-4 inline-block">
            <Button size="lg">İlk CV&apos;ni Oluştur</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((d) => (
            <Link
              key={d.id}
              href={`/dashboard/cv/${d.id}`}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-brand hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
                  📄
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {d.source === "draft" ? "Taslaktan" : "Formdan"}
                </span>
              </div>
              <p className="mt-4 font-bold text-slate-900 group-hover:text-brand">{d.title}</p>
              <p className="mt-1 text-xs text-slate-500">{formatDate(d.createdAt)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
