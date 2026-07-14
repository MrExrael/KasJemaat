"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  departmentSchema,
  type ActionResult,
  type DeleteResult,
  type DepartmentFormValues,
} from "@/lib/validators/department";

/**
 * Terjemahkan error Postgres/PostgREST ke pesan yang ramah.
 * Otorisasi tulis diandalkan pada RLS (departments_write = sekretaris/bendahara).
 */
function mapDbError(error: { code?: string; message?: string }): string {
  if (error.code === "23505") return "Kode departemen sudah digunakan.";
  if (error.code === "23503") return "Departemen masih dipakai data lain.";
  if (
    error.code === "42501" ||
    error.message?.toLowerCase().includes("row-level security")
  ) {
    return "Anda tidak punya izin untuk aksi ini.";
  }
  return "Gagal menyimpan. Coba lagi.";
}

export async function createDepartment(
  raw: DepartmentFormValues,
): Promise<ActionResult> {
  const parsed = departmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak valid." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("departments").insert({
    name: parsed.data.name,
    code: parsed.data.code,
    pic_name: parsed.data.pic_name,
    is_active: parsed.data.is_active,
  });
  if (error) return { ok: false, error: mapDbError(error) };

  revalidatePath("/departemen");
  return { ok: true };
}

export async function updateDepartment(
  id: string,
  raw: DepartmentFormValues,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Data tidak valid." };

  const parsed = departmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak valid." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("departments")
    .update({
      name: parsed.data.name,
      code: parsed.data.code,
      pic_name: parsed.data.pic_name,
      is_active: parsed.data.is_active,
    })
    .eq("id", id);
  if (error) return { ok: false, error: mapDbError(error) };

  revalidatePath("/departemen");
  return { ok: true };
}

/**
 * Hapus departemen. Jika sudah dipakai transaksi → JANGAN hard-delete,
 * cukup set is_active = false (soft delete).
 */
export async function deleteDepartment(id: string): Promise<DeleteResult> {
  if (!id) return { ok: false, error: "Data tidak valid." };

  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("department_id", id);
  if (countError) return { ok: false, error: mapDbError(countError) };

  if ((count ?? 0) > 0) {
    const { error } = await supabase
      .from("departments")
      .update({ is_active: false })
      .eq("id", id);
    if (error) return { ok: false, error: mapDbError(error) };

    revalidatePath("/departemen");
    return { ok: true, softDeleted: true };
  }

  const { error } = await supabase.from("departments").delete().eq("id", id);
  if (error) return { ok: false, error: mapDbError(error) };

  revalidatePath("/departemen");
  return { ok: true, softDeleted: false };
}
