import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Lock,
  Paperclip,
  Receipt,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { ThemeToggle } from "@/components/shared/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { APP_VERSION } from "@/lib/changelog";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Hak akses per peran",
    desc: "Gembala, Sekretaris, Bendahara, dan Petugas — tiap peran melihat & mengelola sesuai wewenangnya.",
  },
  {
    icon: Receipt,
    title: "Transaksi harian",
    desc: "Catat pemasukan & pengeluaran per departemen dengan kategori, filter tanggal, dan total.",
  },
  {
    icon: Paperclip,
    title: "Bukti digital",
    desc: "Unggah foto atau PDF nota/kuitansi. Disimpan privat, dibaca aman lewat tautan bertanda tangan.",
  },
  {
    icon: Wallet,
    title: "Kas mingguan",
    desc: "Rekap persembahan mingguan per jenis kas dengan total dihitung otomatis.",
  },
  {
    icon: FileText,
    title: "Laporan & ekspor",
    desc: "Ringkasan keuangan yang rapi dan siap diekspor ke PDF.",
  },
  {
    icon: Lock,
    title: "Aman by design",
    desc: "Keamanan ditegakkan di database (Row Level Security), bukan sekadar di tampilan.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="size-4" />
            </span>
            <span className="font-heading text-lg font-semibold">KasJemaat</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className={cn(buttonVariants({ size: "lg" }))}>
              Masuk
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(60% 45% at 50% 0%, color-mix(in oklch, var(--primary) 14%, transparent), transparent)",
            }}
          />
          <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:py-28">
            <span className="inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              Keuangan &amp; kas gereja
            </span>
            <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              Kelola kas gereja dengan rapi &amp; transparan
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground text-pretty">
              Pencatatan harian per departemen, rekap kas mingguan, bukti
              digital, dan alur persetujuan — semua dalam satu aplikasi.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                href="/login"
                className={cn(buttonVariants({ size: "lg" }), "gap-2")}
              >
                Masuk ke aplikasi
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border bg-card p-6 ring-1 ring-foreground/5 transition-shadow hover:shadow-sm"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-heading text-base font-semibold">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
          <span>© 2026 KasJemaat</span>
          <span>v{APP_VERSION}</span>
        </div>
      </footer>
    </div>
  );
}
