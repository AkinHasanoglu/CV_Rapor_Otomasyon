import { json } from "@/lib/api";
import { processPendingRows } from "@/lib/b2b/job-processor";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Vercel Cron tetikleyicisi (vercel.json -> her dakika).
 * B2B toplu işlerin sunucusuz worker'ıdır; her çağrı küçük bir partiyi işler.
 * CRON_SECRET tanımlıysa istek üst bilgisinde taşınmalıdır.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = request.headers.get("x-cron-secret");
    if (provided !== secret) {
      return json({ error: "Yetkisiz" }, 401);
    }
  }

  try {
    const result = await processPendingRows();
    return json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/process-jobs]", err);
    return json({ ok: false, error: String(err) }, 500);
  }
}
