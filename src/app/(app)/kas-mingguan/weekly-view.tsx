"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRupiah } from "@/lib/format";
import { WEEKLY_FIELDS, type WeeklyRow } from "@/lib/validators/weekly";
import type { WeeklyData } from "@/lib/weekly/queries";
import { weekRangeLabel } from "@/lib/weekly/week";
import { deleteWeekly } from "./actions";
import { WeeklyFormDialog } from "./weekly-form-dialog";

export function WeeklyView({ data }: { data: WeeklyData }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WeeklyRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WeeklyRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const cashName = useMemo(() => {
    const map = new Map(data.cashTypes.map((c) => [c.id, c.name]));
    return (id: string) => map.get(id) ?? "—";
  }, [data.cashTypes]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(row: WeeklyRow) {
    setEditing(row);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deleteWeekly(deleteTarget.id);
      if (res.ok) {
        toast.success("Rekap dihapus.");
        setDeleteTarget(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Tambah Rekap
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Minggu</TableHead>
              <TableHead>Jenis Kas</TableHead>
              {WEEKLY_FIELDS.map((f) => (
                <TableHead key={f.key} className="text-right whitespace-nowrap">
                  {f.label}
                </TableHead>
              ))}
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Catatan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={WEEKLY_FIELDS.length + 5}
                  className="py-10 text-center text-muted-foreground"
                >
                  Belum ada rekap mingguan.
                </TableCell>
              </TableRow>
            ) : (
              data.rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap">
                    {weekRangeLabel(row.week_start_date)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {cashName(row.cash_type_id)}
                  </TableCell>
                  {WEEKLY_FIELDS.map((f) => (
                    <TableCell
                      key={f.key}
                      className="text-right whitespace-nowrap"
                    >
                      {formatRupiah(row[f.key])}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-semibold whitespace-nowrap">
                    {formatRupiah(row.total)}
                  </TableCell>
                  <TableCell className="max-w-40 truncate">
                    {row.notes ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(row)}
                        aria-label="Edit"
                        title="Edit"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(row)}
                        aria-label="Hapus"
                        title="Hapus"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {data.rows.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell
                  colSpan={WEEKLY_FIELDS.length + 2}
                  className="text-right font-medium"
                >
                  Total keseluruhan
                </TableCell>
                <TableCell className="text-right font-semibold whitespace-nowrap">
                  {formatRupiah(data.totalAll)}
                </TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      <WeeklyFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        report={editing}
        cashTypes={data.cashTypes}
        onSaved={() => router.refresh()}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus rekap?</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `Rekap ${weekRangeLabel(deleteTarget.week_start_date)} — ${cashName(deleteTarget.cash_type_id)} (${formatRupiah(deleteTarget.total)}) akan dihapus permanen.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Menghapus…" : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
