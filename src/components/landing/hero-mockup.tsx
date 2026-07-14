import { formatRupiah } from "@/lib/format";

const NAV = ["Dashboard", "Pemasukan", "Pengeluaran", "Kas Mingguan", "Departemen"];

const ROWS = [
  {
    date: "12 Jul 2026",
    dept: "Pemuda",
    cash: "Kas Operasional",
    amount: 1_500_000,
    status: "Disetujui",
    tone: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
  {
    date: "11 Jul 2026",
    dept: "Diakonia",
    cash: "Kas Diakonia",
    amount: 750_000,
    status: "Terverifikasi",
    tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    date: "10 Jul 2026",
    dept: "Musik & Ibadah",
    cash: "Kas Operasional",
    amount: 320_000,
    status: "Draft",
    tone: "bg-muted text-muted-foreground",
  },
  {
    date: "9 Jul 2026",
    dept: "Sekolah Minggu",
    cash: "Kas Misi",
    amount: 500_000,
    status: "Disetujui",
    tone: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
];

export function HeroMockup() {
  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-xl border bg-card shadow-2xl ring-1 ring-foreground/10"
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-red-400/70" />
        <span className="size-2.5 rounded-full bg-yellow-400/70" />
        <span className="size-2.5 rounded-full bg-green-400/70" />
        <span className="ml-3 truncate text-xs text-muted-foreground">
          kasjemaat — Pemasukan
        </span>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="hidden w-40 shrink-0 border-r bg-muted/20 p-3 sm:block">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
              K
            </span>
            <span className="text-sm font-semibold">KasJemaat</span>
          </div>
          <div className="space-y-1">
            {NAV.map((item, i) => (
              <div
                key={item}
                className={`rounded-md px-2 py-1.5 text-xs ${
                  i === 1
                    ? "bg-primary/10 font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div className="min-w-0 flex-1 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold">Pemasukan</div>
            <div className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
              + Tambah
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 border-b bg-muted/40 px-3 py-2 text-[11px] font-medium text-muted-foreground">
              <span>Tanggal</span>
              <span>Departemen</span>
              <span className="text-right">Jumlah</span>
              <span className="text-right">Status</span>
            </div>
            {ROWS.map((r) => (
              <div
                key={r.date + r.dept}
                className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-2 border-b px-3 py-2 text-[11px] last:border-0"
              >
                <span className="text-muted-foreground">{r.date}</span>
                <span className="truncate">{r.dept}</span>
                <span className="text-right font-medium whitespace-nowrap">
                  {formatRupiah(r.amount)}
                </span>
                <span className="flex justify-end">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${r.tone}`}
                  >
                    {r.status}
                  </span>
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-[11px]">
            <span className="text-muted-foreground">Total (hasil filter)</span>
            <span className="font-semibold">{formatRupiah(3_070_000)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
