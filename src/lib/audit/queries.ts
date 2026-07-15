import { createClient } from "@/lib/supabase/server";

export const AUDIT_PAGE_SIZE = 20;

export const AUDIT_ENTITIES = [
  "transaction",
  "department",
  "weekly_report",
  "user",
] as const;

export type AuditRow = {
  id: string;
  created_at: string;
  action: string;
  entity: string;
  entity_id: string | null;
  meta: unknown;
  userId: string | null;
  userName: string;
};

export type AuditFilters = {
  from?: string;
  to?: string;
  user?: string;
  entity?: string;
  page: number;
};

export type AuditData = {
  rows: AuditRow[];
  totalCount: number;
  page: number;
  totalPages: number;
  users: { id: string; name: string }[];
};

/** Log bersifat read-only (tak ada policy UPDATE/DELETE di DB — immutable). */
export async function getAuditData(filters: AuditFilters): Promise<AuditData> {
  const supabase = await createClient();

  const page = Math.max(1, filters.page);
  const fromIdx = (page - 1) * AUDIT_PAGE_SIZE;

  let q = supabase
    .from("audit_log")
    .select("id, created_at, action, entity, entity_id, meta, user_id", {
      count: "exact",
    });

  if (filters.from) q = q.gte("created_at", `${filters.from}T00:00:00`);
  if (filters.to) q = q.lte("created_at", `${filters.to}T23:59:59`);
  if (filters.user) q = q.eq("user_id", filters.user);
  if (
    filters.entity &&
    (AUDIT_ENTITIES as readonly string[]).includes(filters.entity)
  ) {
    q = q.eq("entity", filters.entity);
  }

  const [{ data: rows, count }, { data: profs }] = await Promise.all([
    q
      .order("created_at", { ascending: false })
      .range(fromIdx, fromIdx + AUDIT_PAGE_SIZE - 1),
    // Butuh migrasi 0005 agar gembala/bendahara juga bisa membaca nama.
    supabase.from("profiles").select("id, full_name").order("full_name"),
  ]);

  const nameById = new Map(
    (profs ?? []).map((p) => [p.id, p.full_name ?? "(tanpa nama)"]),
  );

  const totalCount = count ?? 0;
  return {
    rows: (rows ?? []).map((r) => ({
      id: r.id,
      created_at: r.created_at,
      action: r.action,
      entity: r.entity,
      entity_id: r.entity_id,
      meta: r.meta,
      userId: r.user_id,
      userName: r.user_id
        ? (nameById.get(r.user_id) ?? "(pengguna dihapus)")
        : "—",
    })),
    totalCount,
    page,
    totalPages: Math.max(1, Math.ceil(totalCount / AUDIT_PAGE_SIZE)),
    users: (profs ?? []).map((p) => ({
      id: p.id,
      name: p.full_name ?? "(tanpa nama)",
    })),
  };
}
