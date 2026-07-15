"use server";

import { revalidatePath } from "next/cache";

import { logAction } from "@/lib/audit/log";
import { createClient } from "@/lib/supabase/server";
import {
  userSchema,
  type ActionResult,
  type UserFormValues,
} from "@/lib/validators/user";

const PATH = "/pengguna";

function mapDbError(error: { code?: string; message?: string }): string {
  if (
    error.code === "42501" ||
    error.message?.toLowerCase().includes("row-level security")
  ) {
    return "Hanya Sekretaris yang boleh mengelola pengguna.";
  }
  if (error.code === "23503") return "Departemen tidak valid.";
  return "Gagal menyimpan. Coba lagi.";
}

/** Ubah nama, peran, dan departemen pengguna. Otorisasi final: RLS profiles_update. */
export async function updateUser(
  id: string,
  raw: UserFormValues,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Data tidak valid." };

  const parsed = userSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Silakan masuk lagi." };

  // Cegah sekretaris mengunci dirinya sendiri keluar dari panel pengguna.
  if (id === user.id && parsed.data.role !== "sekretaris") {
    return {
      ok: false,
      error:
        "Anda tidak dapat menurunkan peran sendiri — minta sekretaris lain melakukannya.",
    };
  }

  const { data: before } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      role: parsed.data.role,
      department_id: parsed.data.department_id,
    })
    .eq("id", id);
  if (error) return { ok: false, error: mapDbError(error) };

  const roleChanged = Boolean(before && before.role !== parsed.data.role);
  await logAction(supabase, user.id, {
    action: roleChanged ? "role_change" : "update",
    entity: "user",
    entity_id: id,
    meta: roleChanged
      ? {
          name: parsed.data.full_name,
          from: before?.role ?? null,
          to: parsed.data.role,
        }
      : { name: parsed.data.full_name },
  });

  revalidatePath(PATH);
  return { ok: true };
}

/**
 * Aktif/nonaktifkan pengguna. Nonaktif langsung memblokir akses: getCurrentProfile()
 * memaksa logout saat request berikutnya bila is_active = false.
 */
export async function setUserActive(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Data tidak valid." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Silakan masuk lagi." };

  if (id === user.id && !active) {
    return { ok: false, error: "Anda tidak dapat menonaktifkan akun sendiri." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: active })
    .eq("id", id);
  if (error) return { ok: false, error: mapDbError(error) };

  await logAction(supabase, user.id, {
    action: active ? "activate" : "deactivate",
    entity: "user",
    entity_id: id,
  });

  revalidatePath(PATH);
  return { ok: true };
}
