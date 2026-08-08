import { NextResponse } from "next/server";
import { buildSampleWorkbook } from "@/lib/b2b/excel";

export const dynamic = "force-dynamic";

/** Örnek Excel şablonunu indir */
export async function GET() {
  const buffer = buildSampleWorkbook();
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="cv_ornek_sablon.xlsx"',
    },
  });
}
