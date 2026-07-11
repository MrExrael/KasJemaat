import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PengeluaranPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Pengeluaran</h1>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Segera hadir</CardTitle>
          <CardDescription>
            Pencatatan transaksi pengeluaran dikerjakan pada fase berikutnya.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
