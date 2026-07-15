import type { Database } from "@/types/database";

/**
 * SATU SUMBER KEBENARAN hak akses UI (mirror "Matriks hak akses" di CLAUDE.md).
 * Catatan: ini lapisan UI (tampil/sembunyi). Kebenaran final tetap RLS Postgres.
 */

export type Role = Database["public"]["Enums"]["user_role"];

const ALL_ROLES: Role[] = ["gembala", "sekretaris", "bendahara", "petugas"];

export const ROLE_LABEL: Record<Role, string> = {
  gembala: "Gembala",
  sekretaris: "Sekretaris",
  bendahara: "Bendahara",
  petugas: "Petugas",
};

// ---------- Kapabilitas (aksi) ----------
export type Action =
  | "dashboard.view"
  | "reports.view"
  | "transactions.input"
  | "transactions.edit"
  | "transactions.delete"
  | "transactions.verify"
  | "weekly.manage"
  | "departments.read"
  | "departments.manage"
  | "users.manage"
  | "export.pdf"
  | "summary.send";

const MATRIX: Record<Action, Role[]> = {
  "dashboard.view": ALL_ROLES,
  "reports.view": ALL_ROLES,
  "transactions.input": ["sekretaris", "bendahara", "petugas"],
  "transactions.edit": ["sekretaris", "bendahara", "petugas"],
  "transactions.delete": ["sekretaris", "bendahara"],
  "transactions.verify": ["sekretaris", "bendahara"],
  "weekly.manage": ["bendahara"],
  "departments.read": ALL_ROLES,
  "departments.manage": ["sekretaris", "bendahara"],
  "users.manage": ["sekretaris"],
  "export.pdf": ALL_ROLES,
  "summary.send": ["gembala", "sekretaris", "bendahara"],
};

/** Apakah `role` boleh melakukan `action` (level kapabilitas). */
export function can(role: Role, action: Action): boolean {
  return MATRIX[action].includes(role);
}

// ---------- Aturan tingkat-baris transaksi (role + status + kepemilikan) ----------
// Mirror RLS transactions. Baris `approved` terkunci untuk semua.
type TxStatus = Database["public"]["Enums"]["tx_status"];

export function canEditTransaction(
  role: Role,
  opts: { status: TxStatus; isOwner: boolean },
): boolean {
  if (opts.status === "approved") return false;
  if (role === "sekretaris" || role === "bendahara") return true;
  if (role === "petugas") return opts.isOwner && opts.status === "draft";
  return false;
}

export function canDeleteTransaction(role: Role, status: TxStatus): boolean {
  if (status === "approved") return false;
  return role === "sekretaris" || role === "bendahara";
}

/** draft -> verified (sekretaris/bendahara). */
export function canVerifyTransaction(role: Role, status: TxStatus): boolean {
  return status === "draft" && (role === "sekretaris" || role === "bendahara");
}

/** verified -> approved (sekretaris/bendahara). */
export function canApproveTransaction(role: Role, status: TxStatus): boolean {
  return (
    status === "verified" && (role === "sekretaris" || role === "bendahara")
  );
}

/** verified/approved -> draft (buka kunci; hanya sekretaris). */
export function canRevertTransaction(role: Role, status: TxStatus): boolean {
  return (
    role === "sekretaris" && (status === "verified" || status === "approved")
  );
}

// ---------- Navigasi / route ----------
export type NavKey =
  | "dashboard"
  | "pemasukan"
  | "pengeluaran"
  | "kas-mingguan"
  | "departemen"
  | "pengguna"
  | "ekspor";

export type NavItem = { key: NavKey; href: string; label: string };

/** Urutan tampil kanonik. Visibilitas per peran difilter dari sini. */
export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard" },
  { key: "pemasukan", href: "/pemasukan", label: "Pemasukan" },
  { key: "pengeluaran", href: "/pengeluaran", label: "Pengeluaran" },
  { key: "kas-mingguan", href: "/kas-mingguan", label: "Kas Mingguan" },
  { key: "departemen", href: "/departemen", label: "Departemen" },
  { key: "pengguna", href: "/pengguna", label: "Pengguna" },
  { key: "ekspor", href: "/ekspor", label: "Ekspor" },
];

/** Menu per peran (Fase 2 item 3). */
const ROLE_NAV: Record<Role, NavKey[]> = {
  gembala: ["dashboard", "pemasukan", "pengeluaran", "departemen", "ekspor"],
  sekretaris: [
    "dashboard",
    "pemasukan",
    "pengeluaran",
    "departemen",
    "pengguna",
    "ekspor",
  ],
  bendahara: [
    "dashboard",
    "pemasukan",
    "pengeluaran",
    "kas-mingguan",
    "departemen",
    "ekspor",
  ],
  // Petugas boleh ekspor (CLAUDE.md: "Ekspor PDF: semua") — datanya otomatis
  // terbatas pada departemennya sendiri lewat RLS.
  petugas: ["dashboard", "pemasukan", "pengeluaran", "ekspor"],
};

export function navItemsForRole(role: Role): NavItem[] {
  const allowed = new Set(ROLE_NAV[role]);
  return NAV_ITEMS.filter((item) => allowed.has(item.key));
}

/** Dipakai guard route: apakah peran boleh membuka halaman `key`. */
export function canAccessRoute(role: Role, key: NavKey): boolean {
  return ROLE_NAV[role].includes(key);
}
