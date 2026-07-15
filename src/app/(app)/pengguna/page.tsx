import { Info } from "lucide-react";

import { getCurrentProfile, requireRouteAccess } from "@/lib/auth/session";
import { getUsersData } from "@/lib/users/queries";
import { UsersView } from "./users-view";

export default async function PenggunaPage() {
  // Hanya Sekretaris. RLS profiles_update penjaga akhir.
  await requireRouteAccess("pengguna");
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const data = await getUsersData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Pengguna</h1>
        <p className="text-muted-foreground">
          Kelola peran, departemen, dan status aktif pengguna.
        </p>
      </div>

      {/*
        Menambah akun BARU butuh Admin API Supabase (service_role key) yang
        sengaja tidak dipakai aplikasi ini. Jadi pembuatan akun dilakukan dari
        Supabase Dashboard, lalu perannya diatur di sini.
      */}
      <div className="flex gap-3 rounded-xl border bg-muted/30 p-4 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="space-y-1">
          <p className="font-medium">Menambah pengguna baru</p>
          <p className="text-muted-foreground">
            Buat akun di <span className="font-medium">Supabase Dashboard →
            Authentication → Users → Add user</span> (centang{" "}
            <span className="font-medium">Auto Confirm User</span>). Pengguna
            baru otomatis muncul di tabel ini dengan peran{" "}
            <span className="font-medium">Petugas</span> — lalu atur peran &amp;
            departemennya di sini.
          </p>
        </div>
      </div>

      <UsersView data={data} currentUserId={profile.id} />
    </div>
  );
}
