import { format } from "date-fns";
import { id } from "date-fns/locale";

/**
 * Format angka rupiah. Nominal selalu integer rupiah (tanpa desimal).
 * Contoh: 1500000 -> "Rp1.500.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format tanggal ke bahasa Indonesia.
 * Terima Date atau string ISO. Pola default: "d MMMM yyyy" (mis. "11 Juli 2026").
 */
export function formatTanggal(
  date: Date | string,
  pattern = "d MMMM yyyy",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, pattern, { locale: id });
}
