import { can } from "@/lib/auth/permissions";
import { requireRouteAccess } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { DepartmentRow } from "@/lib/validators/department";
import { DepartmentsView } from "./departments-view";

export default async function DepartemenPage() {
  // Gembala/Sekretaris/Bendahara boleh membuka (Petugas ditolak oleh guard).
  const profile = await requireRouteAccess("departemen");
  const canManage = can(profile.role, "departments.manage");

  const supabase = await createClient();
  const { data } = await supabase
    .from("departments")
    .select("id, name, code, pic_name, is_active")
    .order("name", { ascending: true });

  const departments: DepartmentRow[] = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Departemen</h1>
        <p className="text-muted-foreground">
          {canManage
            ? "Kelola daftar departemen gereja."
            : "Daftar departemen gereja (hanya lihat)."}
        </p>
      </div>

      <DepartmentsView departments={departments} canManage={canManage} />
    </div>
  );
}
