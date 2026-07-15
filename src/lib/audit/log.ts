import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";

type Client = SupabaseClient<Database>;

export type AuditEntity =
  | "transaction"
  | "department"
  | "weekly_report"
  | "user";

export type AuditEntry = {
  action: string;
  entity: AuditEntity;
  entity_id?: string | null;
  meta?: Record<string, Json>;
};

/**
 * Catat aksi penting ke audit_log.
 *
 * BEST-EFFORT: kegagalan pencatatan TIDAK boleh menggagalkan mutasi yang sudah
 * berhasil (data lebih penting daripada log). Karena itu error ditelan.
 *
 * Catatan: transisi status transaksi (verify/approve/revert) dicatat langsung
 * oleh fungsi SECURITY DEFINER di migrasi 0004 — jangan dicatat dua kali.
 */
export async function logAction(
  supabase: Client,
  userId: string,
  entry: AuditEntry,
): Promise<void> {
  try {
    await supabase.from("audit_log").insert({
      user_id: userId,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entity_id ?? null,
      meta: entry.meta ?? null,
    });
  } catch {
    // sengaja diabaikan
  }
}
