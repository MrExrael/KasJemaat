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

export default async function KasMingguanPage() {
  // Hanya Bendahara yang boleh membuka halaman ini.
  await requireRouteAccess("kas-mingguan");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold">Kas Mingguan</h1>
        <RoleGate action="weekly.manage">
          <Button>
            <Plus className="size-4" />
            Tambah Rekap
          </Button>
        </RoleGate>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Segera hadir</CardTitle>
          <CardDescription>
            Rekap kas mingguan dikerjakan pada fase berikutnya.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
