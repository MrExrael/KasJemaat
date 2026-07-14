import type { Profile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type {
  TransactionRow,
  TxStatus,
  TxType,
} from "@/lib/validators/transaction";

export const PAGE_SIZE = 10;

export type RefItem = { id: string; name: string; is_active: boolean };

export type TransactionsData = {
  rows: TransactionRow[];
  totalCount: number;
  totalAmount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  departments: RefItem[];
  cashTypes: RefItem[];
  /** Signed URL bukti per transaksi id (bucket privat, kadaluarsa ~1 jam). */
  proofUrls: Record<string, string>;
  /** Nama pemverifikasi per transaksi id (untuk jejak status). */
  verifierNames: Record<string, string>;
};

export type TransactionFilters = {
  from?: string;
  to?: string;
  departmentId?: string;
  status?: string;
  page: number;
};

/**
 * Ambil data transaksi untuk satu `type` (income/expense) dengan filter,
 * pagination server-side, dan total jumlah (atas seluruh hasil filter).
 *
 * Petugas: filter departemen dikunci ke dept-nya. RLS tetap penjaga akhir —
 * petugas hanya bisa SELECT baris department_id = current_department().
 */
export async function getTransactionsData(
  type: TxType,
  profile: Profile,
  filters: TransactionFilters,
): Promise<TransactionsData> {
  const supabase = await createClient();

  const [{ data: depts }, { data: cash }] = await Promise.all([
    supabase.from("departments").select("id, name, is_active").order("name"),
    supabase.from("cash_types").select("id, name, is_active").order("name"),
  ]);

  const departments: RefItem[] = depts ?? [];
  const cashTypes: RefItem[] = cash ?? [];

  // Departemen efektif: petugas terkunci ke dept-nya; staff/gembala pakai filter
  // (divalidasi terhadap daftar dept yang ada agar tidak error uuid).
  const requestedDept =
    profile.role === "petugas"
      ? (profile.department_id ?? undefined)
      : filters.departmentId;
  const departmentId =
    requestedDept && departments.some((d) => d.id === requestedDept)
      ? requestedDept
      : undefined;

  const statusFilter =
    filters.status &&
    (["draft", "verified", "approved"] as const).includes(
      filters.status as TxStatus,
    )
      ? (filters.status as TxStatus)
      : undefined;

  const page = Math.max(1, filters.page);
  const fromIdx = (page - 1) * PAGE_SIZE;
  const toIdx = fromIdx + PAGE_SIZE - 1;

  let rowsQuery = supabase
    .from("transactions")
    .select(
      "id, date, department_id, cash_type_id, type, amount, category, description, proof_url, status, created_by, verified_by, verified_at",
      { count: "exact" },
    )
    .eq("type", type);
  if (filters.from) rowsQuery = rowsQuery.gte("date", filters.from);
  if (filters.to) rowsQuery = rowsQuery.lte("date", filters.to);
  if (departmentId) rowsQuery = rowsQuery.eq("department_id", departmentId);
  if (statusFilter) rowsQuery = rowsQuery.eq("status", statusFilter);

  const { data: rows, count } = await rowsQuery
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(fromIdx, toIdx);

  // Total jumlah atas seluruh hasil filter (bukan hanya halaman ini).
  let sumQuery = supabase.from("transactions").select("amount").eq("type", type);
  if (filters.from) sumQuery = sumQuery.gte("date", filters.from);
  if (filters.to) sumQuery = sumQuery.lte("date", filters.to);
  if (departmentId) sumQuery = sumQuery.eq("department_id", departmentId);
  if (statusFilter) sumQuery = sumQuery.eq("status", statusFilter);
  const { data: sumRows } = await sumQuery;
  const totalAmount = (sumRows ?? []).reduce((acc, r) => acc + (r.amount ?? 0), 0);

  const rowsData = rows ?? [];
  const totalCount = count ?? 0;

  // Signed URL untuk baca bukti (server-side; storage policy mengotorisasi).
  const proofUrls: Record<string, string> = {};
  const withProof = rowsData.filter((r) => r.proof_url);
  if (withProof.length > 0) {
    const { data: signed } = await supabase.storage
      .from("bukti")
      .createSignedUrls(
        withProof.map((r) => r.proof_url as string),
        3600,
      );
    signed?.forEach((s, i) => {
      if (s.signedUrl) proofUrls[withProof[i].id] = s.signedUrl;
    });
  }

  // Nama pemverifikasi (jejak "Diverifikasi oleh ..."). Tunduk RLS profiles:
  // staff/gembala lihat semua; petugas bisa kosong → UI fallback ke tanggal.
  const verifierNames: Record<string, string> = {};
  const verifierIds = [
    ...new Set(
      rowsData.map((r) => r.verified_by).filter((x): x is string => Boolean(x)),
    ),
  ];
  if (verifierIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", verifierIds);
    profs?.forEach((p) => {
      if (p.full_name) verifierNames[p.id] = p.full_name;
    });
  }

  return {
    rows: rowsData,
    totalCount,
    totalAmount,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    departments,
    cashTypes,
    proofUrls,
    verifierNames,
  };
}
