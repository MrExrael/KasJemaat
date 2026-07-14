import { z } from "zod";

import type { Database } from "@/types/database";

export const departmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama wajib diisi.")
    .max(100, "Nama maksimal 100 karakter."),
  code: z
    .string()
    .trim()
    .min(1, "Kode wajib diisi.")
    .max(20, "Kode maksimal 20 karakter."),
  pic_name: z
    .string()
    .trim()
    .max(100, "Nama PIC maksimal 100 karakter.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  is_active: z.boolean(),
});

/** Bentuk data dari form (semua field terisi). */
export type DepartmentFormValues = {
  name: string;
  code: string;
  pic_name: string;
  is_active: boolean;
};

/** Baris departemen yang ditampilkan di tabel. */
export type DepartmentRow = Pick<
  Database["public"]["Tables"]["departments"]["Row"],
  "id" | "name" | "code" | "pic_name" | "is_active"
>;

export type ActionResult = { ok: true } | { ok: false; error: string };

export type DeleteResult =
  | { ok: true; softDeleted: boolean }
  | { ok: false; error: string };
