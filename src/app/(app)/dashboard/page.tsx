import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUser } from "@/lib/auth/session";

export default async function DashboardPage() {
  const user = await getUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang kembali di KasJemaat.
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Sesi aktif</CardTitle>
          <CardDescription>Anda masuk sebagai</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-medium">{user?.email}</p>
        </CardContent>
      </Card>
    </div>
  );
}
