"use server";

import { revalidatePath } from "next/cache";

import { logAction } from "@/lib/audit/log";
import { createClient } from "@/lib/supabase/server";
import {
  weeklySchema,
  type ActionResult,
  type WeeklyFormValues,
} from "@/lib/validators/weekly";
import { mondayOf } from "@/lib/weekly/week";

const PATH = "/kas-mingguan";

function mapDbError(error: { code?: string; message?: string }): string {
  if (error.code === "23505") {
    return "Rekap untuk minggu & jenis kas ini sudah ada.";
  }
  if (error.code === "42501") {
    return "Anda tidak punya izin untuk aksi ini.";
  }
  return error.message || "Terjadi kesalahan. Coba lagi.";
}

/** Kolom nominal saja — `total` sengaja TIDAK dikirim (dihitung trigger DB). */
function amountsOf(d: ReturnType<typeof weeklySchema.parse>) {
  return {
    persembahan_mimbar: d.persembahan_mimbar,
    kolekte_ibadah: d.kolekte_ibadah,
    perpuluhan: d.perpuluhan,
    persembahan_syukur: d.persembahan_syukur,
    lainnya: d.lainnya,
    notes: d.notes,
  };
}

export async function createWeekly(
  raw: WeeklyFormValues,
): Promise<ActionResult> {
  const parsed = weeklySchema.safeParse(raw);
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

  const week = mondayOf(parsed.data.week_start_date);
  const { data, error } = await supabase
    .from("weekly_reports")
    .insert({
      // Normalisasi ke Senin di server = sumber kebenaran.
      week_start_date: week,
      cash_type_id: parsed.data.cash_type_id,
      ...amountsOf(parsed.data),
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: mapDbError(error) };

  await logAction(supabase, user.id, {
    action: "create",
    entity: "weekly_report",
    entity_id: data?.id ?? null,
    meta: { week_start_date: week },
  });

  revalidatePath(PATH);
  return { ok: true };
}

export async function updateWeekly(
  id: string,
  raw: WeeklyFormValues,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Data tidak valid." };

  const parsed = weeklySchema.safeParse(raw);
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

  const week = mondayOf(parsed.data.week_start_date);
  const { error } = await supabase
    .from("weekly_reports")
    .update({
      week_start_date: week,
      cash_type_id: parsed.data.cash_type_id,
      ...amountsOf(parsed.data),
    })
    .eq("id", id);
  if (error) return { ok: false, error: mapDbError(error) };

  await logAction(supabase, user.id, {
    action: "update",
    entity: "weekly_report",
    entity_id: id,
    meta: { week_start_date: week },
  });

  revalidatePath(PATH);
  return { ok: true };
}

export async function deleteWeekly(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Data tidak valid." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Silakan masuk lagi." };

  const { error } = await supabase.from("weekly_reports").delete().eq("id", id);
  if (error) return { ok: false, error: mapDbError(error) };

  await logAction(supabase, user.id, {
    action: "delete",
    entity: "weekly_report",
    entity_id: id,
  });

  revalidatePath(PATH);
  return { ok: true };
}
