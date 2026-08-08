import { NextResponse } from "next/server";
import { requireUser, json, fail } from "@/lib/api";
import { getStore } from "@/lib/db";
import { parseExcel } from "@/lib/b2b/excel";

export const maxDuration = 60;

/** B2B: Excel yükle + toplu iş kuyruğu oluştur */
export async function POST(request: Request) {
  const userRes = await requireUser();
  if (userRes instanceof NextResponse) return userRes;

  if (userRes.role !== "b2b") {
    return fail("Bu özellik kurumsal (B2B) hesaplar içindir. Kayıt olurken 'Kurumsal' rolünü seçin.", 403);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const outputType = String(formData.get("outputType") ?? "professional");
    const title = String(formData.get("title") ?? "").trim() || "Toplu CV İşi";

    if (!(file instanceof File)) return fail("Lütfen bir Excel dosyası yükleyin.");
    if (!["xlsx", "xls", "csv"].includes(file.name.split(".").pop()?.toLowerCase() ?? "")) {
      return fail("Desteklenen formatlar: .xlsx, .xls, .csv");
    }
    if (!["professional", "resume", "project"].includes(outputType)) {
      return fail("Geçersiz çıktı tipi.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = parseExcel(buffer);

    if (parsed.missingRequired.length > 0) {
      return fail(
        `Dosyada zorunlu sütunlar eksik: ${parsed.missingRequired.join(", ")}. Örnek şablonu indirip uygun başlıkları kullanın.`,
        422
      );
    }
    if (parsed.rows.length > 1000) {
      return fail("Tek seferde en fazla 1.000 aday işlenebilir.");
    }

    const store = getStore();
    const job = await store.createJob({
      userId: userRes.id,
      title,
      outputType: outputType as "professional" | "resume" | "project",
      totalRows: parsed.rows.length,
    });

    await store.createJobRows(
      parsed.rows.map((row, i) => ({
        jobId: job.id,
        rowIndex: i,
        candidateName: String(row["ad"] ?? row["full_name"] ?? row["soyad"] ?? `Aday ${i + 1}`),
        data: row,
      }))
    );

    // Kuyruk oluşur oluşmaz hemen işlemeye başla (cron da sürecek)
    const { processPendingRows } = await import("@/lib/b2b/job-processor");
    await processPendingRows();

    const fresh = await store.getJob(userRes.id, job.id);
    return json({ id: job.id, job: fresh, warnings: parsed.warnings }, 201);
  } catch (err) {
    console.error("[b2b/jobs]", err);
    return fail("İş oluşturulurken bir hata oluştu.", 500);
  }
}

/** B2B: kullanıcının iş geçmişi */
export async function GET() {
  const userRes = await requireUser();
  if (userRes instanceof NextResponse) return userRes;

  const jobs = await getStore().listJobs(userRes.id);
  return json({ jobs });
}

export const dynamic = "force-dynamic";
