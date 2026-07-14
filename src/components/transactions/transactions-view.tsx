"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  can,
  canDeleteTransaction,
  canEditTransaction,
  canVerifyTransaction,
  type Role,
} from "@/lib/auth/permissions";
import { deleteTransaction } from "@/lib/transactions/actions";
import type { TransactionsData } from "@/lib/transactions/queries";
import { formatRupiah, formatTanggal } from "@/lib/format";
import type {
  TransactionRow,
  TxStatus,
  TxType,
} from "@/lib/validators/transaction";
import { TransactionFormDialog } from "./transaction-form-dialog";

const FIELD =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

const STATUS: Record<
  TxStatus,
  { label: string; variant: "outline" | "secondary" | "default" }
> = {
  draft: { label: "Draft", variant: "outline" },
  verified: { label: "Terverifikasi", variant: "secondary" },
  approved: { label: "Disetujui", variant: "default" },
};

type Props = {
  type: TxType;
  role: Role;
  userId: string;
  userDepartmentId: string | null;
  data: TransactionsData;
  filters: { from?: string; to?: string; dept?: string };
};

export function TransactionsView({
  type,
  role,
  userId,
  userDepartmentId,
  data,
  filters,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [fromDate, setFromDate] = useState(filters.from ?? "");
  const [toDate, setToDate] = useState(filters.to ?? "");
  const [deptFilter, setDeptFilter] = useState(filters.dept ?? "");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TransactionRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const deptName = useMemo(() => {
    const map = new Map(data.departments.map((d) => [d.id, d.name]));
    return (id: string) => map.get(id) ?? "—";
  }, [data.departments]);

  const cashName = useMemo(() => {
    const map = new Map(data.cashTypes.map((c) => [c.id, c.name]));
    return (id: string) => map.get(id) ?? "—";
  }, [data.cashTypes]);

  const canInput = can(role, "transactions.input");
  const showActions =
    can(role, "transactions.edit") ||
    can(role, "transactions.delete") ||
    can(role, "transactions.verify");
  const colCount = 8 + (showActions ? 1 : 0);
  const isPetugas = role === "petugas";

  function hrefFor(f: {
    from?: string;
    to?: string;
    dept?: string;
    page: number;
  }): string {
    const sp = new URLSearchParams();
    if (f.from) sp.set("from", f.from);
    if (f.to) sp.set("to", f.to);
    if (f.dept) sp.set("dept", f.dept);
    if (f.page > 1) sp.set("page", String(f.page));
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function applyFilters() {
    router.push(
      hrefFor({
        from: fromDate || undefined,
        to: toDate || undefined,
        dept: isPetugas ? undefined : deptFilter || undefined,
        page: 1,
      }),
    );
  }

  function resetFilters() {
    setFromDate("");
    setToDate("");
    setDeptFilter("");
    router.push(pathname);
  }

  function gotoPage(page: number) {
    router.push(
      hrefFor({
        from: filters.from,
        to: filters.to,
        dept: isPetugas ? undefined : filters.dept,
        page,
      }),
    );
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(row: TransactionRow) {
    setEditing(row);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deleteTransaction(deleteTarget.id, type);
      if (res.ok) {
        toast.success("Transaksi dihapus.");
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
      {/* Filter + Tambah */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="f-from">
            Dari tanggal
          </label>
          <input
            id="f-from"
            type="date"
            className={FIELD}
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="f-to">
            Sampai tanggal
          </label>
          <input
            id="f-to"
            type="date"
            className={FIELD}
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="f-dept">
            Departemen
          </label>
          {isPetugas ? (
            <input
              id="f-dept"
              className={FIELD}
              value={deptName(userDepartmentId ?? "")}
              disabled
            />
          ) : (
            <select
              id="f-dept"
              className={FIELD}
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="">Semua departemen</option>
              {data.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {d.is_active ? "" : " (nonaktif)"}
                </option>
              ))}
            </select>
          )}
        </div>
        <Button variant="secondary" onClick={applyFilters}>
          Terapkan
        </Button>
        <Button variant="ghost" onClick={resetFilters}>
          Reset
        </Button>

        {canInput && (
          <Button className="ml-auto" onClick={openCreate}>
            <Plus className="size-4" />
            Tambah
          </Button>
        )}
      </div>

      {/* Tabel */}
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Departemen</TableHead>
              <TableHead>Jenis Kas</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
              <TableHead>Bukti</TableHead>
              <TableHead>Status</TableHead>
              {showActions && <TableHead className="text-right">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={colCount}
                  className="py-10 text-center text-muted-foreground"
                >
                  Belum ada transaksi.
                </TableCell>
              </TableRow>
            ) : (
              data.rows.map((row) => {
                const editable = canEditTransaction(role, {
                  status: row.status,
                  isOwner: row.created_by === userId,
                });
                const deletable = canDeleteTransaction(role, row.status);
                const verifiable = canVerifyTransaction(role, row.status);
                const s = STATUS[row.status];
                return (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatTanggal(row.date)}
                    </TableCell>
                    <TableCell>{deptName(row.department_id)}</TableCell>
                    <TableCell>{cashName(row.cash_type_id)}</TableCell>
                    <TableCell>{row.category ?? "—"}</TableCell>
                    <TableCell className="max-w-40 truncate">
                      {row.description ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap">
                      {formatRupiah(row.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">—</TableCell>
                    <TableCell>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </TableCell>
                    {showActions && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {editable && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEdit(row)}
                              aria-label="Edit"
                            >
                              <Pencil className="size-4" />
                            </Button>
                          )}
                          {verifiable && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                toast.info(
                                  "Verifikasi & persetujuan hadir di Fase 6.",
                                )
                              }
                              aria-label="Verifikasi"
                            >
                              <CheckCircle2 className="size-4" />
                            </Button>
                          )}
                          {deletable && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setDeleteTarget(row)}
                              aria-label="Hapus"
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          )}
                          {!editable && !verifiable && !deletable && (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
          {data.rows.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5} className="text-right font-medium">
                  Total (hasil filter)
                </TableCell>
                <TableCell className="text-right font-semibold whitespace-nowrap">
                  {formatRupiah(data.totalAmount)}
                </TableCell>
                <TableCell colSpan={showActions ? 3 : 2} />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
        <span>
          Halaman {data.page} dari {data.totalPages} • {data.totalCount}{" "}
          transaksi
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={data.page <= 1}
            onClick={() => gotoPage(data.page - 1)}
          >
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={data.page >= data.totalPages}
            onClick={() => gotoPage(data.page + 1)}
          >
            Berikutnya
          </Button>
        </div>
      </div>

      {canInput && (
        <TransactionFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          type={type}
          transaction={editing}
          departments={data.departments}
          cashTypes={data.cashTypes}
          role={role}
          userDepartmentId={userDepartmentId}
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
            <DialogTitle>Hapus transaksi?</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `Transaksi ${formatTanggal(deleteTarget.date)} sebesar ${formatRupiah(deleteTarget.amount)} akan dihapus permanen.`
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
