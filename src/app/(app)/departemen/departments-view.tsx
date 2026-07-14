"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DepartmentRow } from "@/lib/validators/department";
import { deleteDepartment } from "./actions";
import { DepartmentFormDialog } from "./department-form-dialog";

export function DepartmentsView({
  departments,
  canManage,
}: {
  departments: DepartmentRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DepartmentRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const existingCodes = useMemo(
    () =>
      departments
        .filter((d) => d.id !== editing?.id)
        .map((d) => d.code.toLowerCase()),
    [departments, editing],
  );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(dept: DepartmentRow) {
    setEditing(dept);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deleteDepartment(deleteTarget.id);
      if (res.ok) {
        toast.success(
          res.softDeleted
            ? "Departemen dipakai transaksi — dinonaktifkan (soft delete)."
            : "Departemen dihapus.",
        );
        setDeleteTarget(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setDeleting(false);
    }
  }

  const colCount = canManage ? 5 : 4;

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Tambah Departemen
          </Button>
        </div>
      )}

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Kode</TableHead>
              <TableHead>Penanggung Jawab</TableHead>
              <TableHead>Status</TableHead>
              {canManage && <TableHead className="text-right">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={colCount}
                  className="py-8 text-center text-muted-foreground"
                >
                  Belum ada departemen.
                </TableCell>
              </TableRow>
            ) : (
              departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell>{dept.code}</TableCell>
                  <TableCell>{dept.pic_name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={dept.is_active ? "secondary" : "outline"}>
                      {dept.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(dept)}
                          aria-label={`Edit ${dept.name}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteTarget(dept)}
                          aria-label={`Hapus ${dept.name}`}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {canManage && (
        <DepartmentFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          department={editing}
          existingCodes={existingCodes}
          onSaved={() => router.refresh()}
        />
      )}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus departemen?</DialogTitle>
            <DialogDescription>
              {deleteTarget ? (
                <>
                  Departemen{" "}
                  <span className="font-medium text-foreground">
                    {deleteTarget.name}
                  </span>{" "}
                  akan dihapus. Jika sudah dipakai transaksi, departemen hanya
                  dinonaktifkan (soft delete).
                </>
              ) : null}
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
