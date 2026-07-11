import { Plus } from "lucide-react";

import { RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRouteAccess } from "@/lib/auth/session";

export default async function DepartemenPage() {
  // Gembala/Sekretaris/Bendahara boleh membuka (Petugas ditolak).
  await requireRouteAccess("departemen");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold">Departemen</h1>
        {/* Hanya Sekretaris/Bendahara yang melihat tombol kelola. */}
        <RoleGate action="departments.manage">
          <Button>
            <Plus className="size-4" />
            Tambah Departemen
          </Button>
        </RoleGate>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Segera hadir</CardTitle>
          <CardDescription>
            Daftar & pengelolaan departemen dikerjakan pada fase berikutnya.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
