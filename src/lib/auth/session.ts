import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { canAccessRoute, type NavKey } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Profile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "role" | "department_id" | "is_active"
>;

/** User terautentikasi dari sesi Supabase (atau null). */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Profil user aktif, di-cache per request (React `cache`) sehingga dipanggil
 * berkali-kali (layout, header, RoleGate) tetap satu kali query.
 *
 * - Mengembalikan null bila belum login.
 * - Bila user ada tetapi profil tak ditemukan ATAU is_active = false,
 *   PAKSA LOGOUT via route /auth/signout (membersihkan cookie sesi),
 *   sehingga tidak terjadi loop redirect.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, department_id, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/auth/signout?reason=noprofile");
  if (!profile.is_active) redirect("/auth/signout?reason=inactive");

  return profile;
});

/**
 * Guard halaman terbatas. Panggil di awal Server Component halaman.
 * Redirect ke /login bila belum login, atau ke /dashboard?denied=1
 * (memicu toast "Akses ditolak") bila peran tak berhak.
 */
export async function requireRouteAccess(key: NavKey): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!canAccessRoute(profile.role, key)) redirect("/dashboard?denied=1");
  return profile;
}
