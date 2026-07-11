import { Plus } from "lucide-react";

import { RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PemasukanPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold">Pemasukan</h1>
        {/* Tombol input disembunyikan bagi peran tanpa hak (mis. Gembala). */}
        <RoleGate action="transactions.input">
          <Button>
            <Plus className="size-4" />
            Tambah Pemasukan
          </Button>
        </RoleGate>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Segera hadir</CardTitle>
          <CardDescription>
            Daftar & pencatatan pemasukan dikerjakan pada fase berikutnya.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
