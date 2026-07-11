import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROLE_LABEL } from "@/lib/auth/permissions";
import { getCurrentProfile } from "@/lib/auth/session";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null; // (app)/layout sudah menjamin, ini untuk type-safety

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang, {profile.full_name ?? "Pengguna"} —{" "}
          {ROLE_LABEL[profile.role]}.
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Ringkasan</CardTitle>
          <CardDescription>
            {profile.role === "petugas"
              ? "Data dibatasi pada departemen Anda."
              : "Anda dapat melihat seluruh data kas."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Ringkasan angka akan tampil di fase berikutnya.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
