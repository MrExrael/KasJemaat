import { formatRupiah } from "@/lib/format";

export type SummaryInput = {
  churchName: string;
  periodLabel: string;
  /** mis. "Semua departemen" / "Departemen: Pemuda" */
  scopeLabel: string;
  income: number;
  expense: number;
  saldo: number;
  perCashType: { name: string; net: number }[];
  /** Sertakan catatan lampirkan PDF manual (Fase 9). */
  includePdfNote?: boolean;
};

export function buildSummarySubject(i: SummaryInput): string {
  return `Ringkasan Kas ${i.churchName} — ${i.periodLabel}`;
}

/**
 * Teks ringkasan DETERMINISTIK (tanpa AI). Format *tebal* dipahami WhatsApp
 * dan tetap terbaca sebagai teks biasa di email.
 */
export function buildSummaryText(i: SummaryInput): string {
  const lines: string[] = [];

  lines.push(`*Ringkasan Kas — ${i.churchName}*`);
  lines.push(`Periode: ${i.periodLabel}`);
  lines.push(i.scopeLabel);
  lines.push("");
  lines.push(`Total Pemasukan: ${formatRupiah(i.income)}`);
  lines.push(`Total Pengeluaran: ${formatRupiah(i.expense)}`);
  lines.push(`*Saldo: ${formatRupiah(i.saldo)}*`);

  const active = i.perCashType.filter((c) => c.net !== 0);
  if (active.length > 0) {
    lines.push("");
    lines.push("*Per Jenis Kas (saldo):*");
    for (const c of active) {
      lines.push(`• ${c.name}: ${formatRupiah(c.net)}`);
    }
  }

  lines.push("");
  lines.push("Dihitung dari transaksi terverifikasi & disetujui.");
  if (i.includePdfNote) {
    lines.push(
      "Laporan PDF lengkap dapat diunduh dari menu Ekspor lalu dilampirkan secara manual.",
    );
  }
  lines.push("");
  lines.push("— Dikirim dari KasJemaat");

  return lines.join("\n");
}

/** Tautan WhatsApp (tanpa nomor: user memilih kontak/grup sendiri). */
export function whatsappUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** Draft email. */
export function mailtoUrl(subject: string, body: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
