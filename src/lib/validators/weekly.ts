import { z } from "zod";

import type { Database } from "@/types/database";

const rupiah = z
  .number("Nominal wajib diisi.")
  .int("Nominal harus bilangan bulat (rupiah).")
  .min(0, "Nominal tidak boleh negatif.");

export const weeklySchema = z.object({
  // Tanggal mana pun dalam minggu; server menormalkan ke Senin.
  week_start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Minggu wajib dipilih."),
  cash_type_id: z.uuid("Jenis kas wajib dipilih."),
  persembahan_mimbar: rupiah,
  kolekte_ibadah: rupiah,
  perpuluhan: rupiah,
  persembahan_syukur: rupiah,
  lainnya: rupiah,
  notes: z
    .string()
    .trim()
    .max(500, "Catatan maksimal 500 karakter.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

/** Kolom nominal — dipakai bersama oleh form & tabel. */
export const WEEKLY_FIELDS = [
  { key: "persembahan_mimbar", label: "Persembahan Mimbar" },
  { key: "kolekte_ibadah", label: "Kolekte Ibadah" },
  { key: "perpuluhan", label: "Perpuluhan" },
  { key: "persembahan_syukur", label: "Persembahan Syukur" },
  { key: "lainnya", label: "Lainnya" },
] as const;

export type WeeklyAmountKey = (typeof WEEKLY_FIELDS)[number]["key"];

/** Nilai mentah dari form (sebelum divalidasi). */
export type WeeklyFormValues = {
  week_start_date: string;
  cash_type_id: string;
  persembahan_mimbar: number;
  kolekte_ibadah: number;
  perpuluhan: number;
  persembahan_syukur: number;
  lainnya: number;
  notes: string;
};

export type WeeklyRow = Pick<
  Database["public"]["Tables"]["weekly_reports"]["Row"],
  | "id"
  | "week_start_date"
  | "cash_type_id"
  | "persembahan_mimbar"
  | "kolekte_ibadah"
  | "perpuluhan"
  | "persembahan_syukur"
  | "lainnya"
  | "total"
  | "notes"
>;

export type ActionResult = { ok: true } | { ok: false; error: string };
