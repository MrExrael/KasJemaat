import { endOfMonth, format, startOfMonth } from "date-fns";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentProfile } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/dashboard/queries";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TxStatus } from "@/lib/validators/transaction";
import { PeriodFilter } from "./period-filter";
import { TrendChart } from "./trend-chart";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const STATUS_STYLE: Record<TxStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  verified: {
    label: "Terverifikasi",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  approved: {
    label: "Disetujui",
    className: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
};

type SearchParams = Promise<{ from?: string; to?: string }>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const profile = await getCurrentProfile();
  if (!profile) return null; // (app)/layout sudah menjamin; ini untuk type-safety

  const sp = await searchParams;
  const now = new Date();
  const defFrom = format(startOfMonth(now), "yyyy-MM-dd");
  const defTo = format(endOfMonth(now), "yyyy-MM-dd");
  let from = DATE_RE.test(sp.from ?? "") ? (sp.from as string) : defFrom;
  let to = DATE_RE.test(sp.to ?? "") ? (sp.to as string) : defTo;
  if (from > to) {
    from = defFrom;
    to = defTo;
  }

  const data = await getDashboardData(profile, { from, to });
  const periodLabel = `${formatTanggal(from)} – ${formatTanggal(to)}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          {profile.role === "petugas"
            ? "Ringkasan departemen Anda."
            : "Ringkasan seluruh kas jemaat."}{" "}
          Periode {periodLabel}.
        </p>
      </div>

      <PeriodFilter from={from} to={to} />

      {/* Kartu ringkasan */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Pemasukan</CardDescription>
            <CardTitle className="text-2xl">
              {formatRupiah(data.income)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Pengeluaran</CardDescription>
            <CardTitle className="text-2xl">
              {formatRupiah(data.expense)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Saldo</CardDescription>
            <CardTitle
              className={cn(
                "text-2xl",
                data.saldo < 0 && "text-destructive",
              )}
            >
              {formatRupiah(data.saldo)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Angka ringkasan & grafik hanya menghitung transaksi berstatus{" "}
        <span className="font-medium">Terverifikasi</span> dan{" "}
        <span className="font-medium">Disetujui</span> ({data.countedCount}{" "}
        transaksi) — draft belum diperiksa sehingga tidak dihitung.
      </p>

      {/* Grafik tren */}
      <Card>
        <CardHeader>
          <CardTitle>Tren Pemasukan vs Pengeluaran</CardTitle>
          <CardDescription>
            Agregasi per {data.granularity === "day" ? "hari" : "minggu"} pada
            periode terpilih.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TrendChart data={data.trend} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Per jenis kas */}
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan per Jenis Kas</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jenis Kas</TableHead>
                  <TableHead className="text-right">Masuk</TableHead>
                  <TableHead className="text-right">Keluar</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.perCashType.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Belum ada jenis kas.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.perCashType.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {formatRupiah(c.income)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {formatRupiah(c.expense)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-medium whitespace-nowrap",
                          c.net < 0 && "text-destructive",
                        )}
                      >
                        {formatRupiah(c.net)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Transaksi terbaru */}
        <Card>
          <CardHeader>
            <CardTitle>Transaksi Terbaru</CardTitle>
            <CardDescription>
              Termasuk draft, dalam periode terpilih.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Departemen</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Belum ada transaksi pada periode ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.recent.map((r) => {
                    const st = STATUS_STYLE[r.status];
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatTanggal(r.date, "d MMM yyyy")}
                        </TableCell>
                        <TableCell className="max-w-32 truncate">
                          {r.departmentName}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-medium whitespace-nowrap",
                            r.type === "expense" && "text-muted-foreground",
                          )}
                        >
                          {r.type === "expense" ? "−" : "+"}
                          {formatRupiah(r.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("border-transparent", st.className)}
                          >
                            {st.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
