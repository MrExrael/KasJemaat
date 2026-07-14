import { z } from "zod";

import type { Database } from "@/types/database";

export const transactionSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal wajib diisi."),
  department_id: z.uuid("Departemen wajib dipilih."),
  cash_type_id: z.uuid("Jenis kas wajib dipilih."),
  category: z
    .string()
    .trim()
    .max(100, "Kategori maksimal 100 karakter.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  description: z
    .string()
    .trim()
    .max(500, "Keterangan maksimal 500 karakter.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  amount: z
    .number("Jumlah wajib diisi.")
    .int("Jumlah harus bilangan bulat (rupiah).")
    .positive("Jumlah harus lebih dari 0."),
});

export type TxType = Database["public"]["Enums"]["tx_type"];
export type TxStatus = Database["public"]["Enums"]["tx_status"];

/** Nilai mentah dari form (sebelum divalidasi). */
export type TransactionFormValues = {
  date: string;
  department_id: string;
  cash_type_id: string;
  category: string;
  description: string;
  amount: number;
};

export type TransactionRow = Pick<
  Database["public"]["Tables"]["transactions"]["Row"],
  | "id"
  | "date"
  | "department_id"
  | "cash_type_id"
  | "type"
  | "amount"
  | "category"
  | "description"
  | "proof_url"
  | "status"
  | "created_by"
>;

export type ActionResult = { ok: true } | { ok: false; error: string };

export type CreateResult =
  | { ok: true; id: string }
  | { ok: false; error: string };
