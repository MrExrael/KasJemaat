import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRouteAccess } from "@/lib/auth/session";

export default async function EksporPage() {
  // Semua peran kecuali Petugas.
  await requireRouteAccess("ekspor");

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Ekspor</h1>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Segera hadir</CardTitle>
          <CardDescription>
            Ekspor laporan PDF dikerjakan pada fase berikutnya.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
