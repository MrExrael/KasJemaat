import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function KasMingguanPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Kas Mingguan</h1>
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
