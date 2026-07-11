import { can, type Action, type Role } from "@/lib/auth/permissions";
import { getCurrentProfile } from "@/lib/auth/session";

type RoleGateProps = {
  children: React.ReactNode;
  /** Izinkan hanya peran ini. */
  roles?: Role[];
  /** Izinkan hanya bila kapabilitas ini dimiliki. */
  action?: Action;
};

/**
 * Sembunyikan (BUKAN disable) elemen bagi user yang tak berhak.
 * Server Component async — pakai untuk membungkus tombol/aksi di halaman server.
 * Client Component sebaiknya menerima `role` via props lalu memakai `can()`.
 */
export async function RoleGate({ roles, action, children }: RoleGateProps) {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const roleOk = roles ? roles.includes(profile.role) : true;
  const actionOk = action ? can(profile.role, action) : true;
  if (!roleOk || !actionOk) return null;

  return <>{children}</>;
}
