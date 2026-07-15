import { z } from "zod";

import type { Database } from "@/types/database";

export const userSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(1, "Nama wajib diisi.")
      .max(100, "Nama maksimal 100 karakter."),
    role: z.enum(["gembala", "sekretaris", "bendahara", "petugas"], {
      error: "Peran wajib dipilih.",
    }),
    department_id: z
      .union([z.uuid("Departemen tidak valid."), z.literal("")])
      .transform((v) => (v === "" ? null : v)),
  })
  // Petugas tanpa departemen tidak akan melihat data apa pun (RLS memfilter
  // berdasarkan current_department()) — cegah sejak validasi.
  .refine((d) => d.role !== "petugas" || d.department_id !== null, {
    message: "Petugas wajib memiliki departemen.",
    path: ["department_id"],
  });

/** Nilai mentah dari form (sebelum divalidasi). */
export type UserFormValues = {
  full_name: string;
  role: Database["public"]["Enums"]["user_role"];
  department_id: string;
};

export type UserRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "email" | "role" | "department_id" | "is_active"
>;

export type ActionResult = { ok: true } | { ok: false; error: string };
