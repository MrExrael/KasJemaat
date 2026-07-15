import { renderToBuffer } from "@react-pdf/renderer";
import { type NextRequest, NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/auth/session";
import {
  buildMonthlyReport,
  buildRangeReport,
  buildWeeklyReport,
} from "@/lib/pdf/data";
import { ReportDocument } from "@/lib/pdf/report-document";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
type Variant = "range" | "weekly" | "monthly";

export async function GET(req: NextRequest) {
  // Data diambil dengan sesi user → RLS menegakkan scope (petugas = dept-nya).
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.redirect(new URL("/login", req.url));

  const sp = req.nextUrl.searchParams;
  const raw = sp.get("variant");
  const variant: Variant =
    raw === "weekly" || raw === "monthly" ? raw : "range";

  const fromRaw = sp.get("from") ?? "";
  const toRaw = sp.get("to") ?? "";
  if (!DATE_RE.test(fromRaw) || !DATE_RE.test(toRaw) || fromRaw > toRaw) {
    return NextResponse.json(
      { error: "Rentang tanggal tidak valid." },
      { status: 400 },
    );
  }

  const range = {
    from: fromRaw,
    to: toRaw,
    dept: sp.get("dept") || undefined,
  };

  const data =
    variant === "weekly"
      ? await buildWeeklyReport(profile, range)
      : variant === "monthly"
        ? await buildMonthlyReport(profile, range)
        : await buildRangeReport(profile, range);

  const buffer = await renderToBuffer(<ReportDocument data={data} />);

  const filename =
    variant === "monthly"
      ? `KasJemaat_Laporan-Bulanan_${range.from.slice(0, 7)}.pdf`
      : variant === "weekly"
        ? `KasJemaat_Laporan-Mingguan_${range.from}_${range.to}.pdf`
        : `KasJemaat_Laporan-Rentang_${range.from}_${range.to}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
