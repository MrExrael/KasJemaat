import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PenggunaPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Pengguna</h1>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Segera hadir</CardTitle>
          <CardDescription>
            Pengelolaan pengguna &amp; peran dikerjakan pada fase berikutnya.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
