"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CheckCircle2,
  FileText,
  LockOpen,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  canApproveTransaction,
  canDeleteTransaction,
  canEditTransaction,
  canRevertTransaction,
  canVerifyTransaction,
  type Role,
} from "@/lib/auth/permissions";
import {
  approveTransaction,
  deleteTransaction,
  revertTransaction,
  verifyTransaction,
} from "@/lib/transactions/actions";
import { isPdfPath } from "@/lib/transactions/proof";
import type { TransactionsData } from "@/lib/transactions/queries";
import { formatRupiah, formatTanggal } from "@/lib/format";
import type {
  TransactionRow,
  TxStatus,
  TxType,
} from "@/lib/validators/transaction";
import { cn } from "@/lib/utils";
import { TransactionFormDialog } from "./transaction-form-dialog";

const FIELD =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

const STATUS_STYLE: Record<TxStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  verified: {
    label: "Terverifikasi",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  approved: {
    label: "Disetujui",
    className: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
};

type Props = {
  type: TxType;
  role: Role;
  userId: string;
  userDepartmentId: string | null;
  data: TransactionsData;
  filters: { from?: string; to?: string; dept?: string; status?: string };
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
  const [statusFilter, setStatusFilter] = useState(filters.status ?? "");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TransactionRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState<{ url: string; pdf: boolean } | null>(
    null,
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [approveTarget, setApproveTarget] = useState<TransactionRow | null>(
    null,
  );
  const [approving, setApproving] = useState(false);
  const [revertTarget, setRevertTarget] = useState<TransactionRow | null>(null);
  const [revertReason, setRevertReason] = useState("");
  const [reverting, setReverting] = useState(false);

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
    status?: string;
    page: number;
  }): string {
    const sp = new URLSearchParams();
    if (f.from) sp.set("from", f.from);
    if (f.to) sp.set("to", f.to);
    if (f.dept) sp.set("dept", f.dept);
    if (f.status) sp.set("status", f.status);
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
        status: statusFilter || undefined,
        page: 1,
      }),
    );
  }

  function resetFilters() {
    setFromDate("");
    setToDate("");
    setDeptFilter("");
    setStatusFilter("");
    router.push(pathname);
  }

  function gotoPage(page: number) {
    router.push(
      hrefFor({
        from: filters.from,
        to: filters.to,
        dept: isPetugas ? undefined : filters.dept,
        status: filters.status,
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

  async function handleVerify(row: TransactionRow) {
    setBusyId(row.id);
    try {
      const res = await verifyTransaction(row.id, type);
      if (res.ok) {
        toast.success("Transaksi diverifikasi.");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleApprove() {
    if (!approveTarget) return;
    setApproving(true);
    try {
      const res = await approveTransaction(approveTarget.id, type);
      if (res.ok) {
        toast.success("Transaksi disahkan.");
        setApproveTarget(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setApproving(false);
    }
  }

  async function handleRevert() {
    if (!revertTarget) return;
    if (!revertReason.trim()) {
      toast.error("Alasan wajib diisi.");
      return;
    }
    setReverting(true);
    try {
      const res = await revertTransaction(revertTarget.id, type, revertReason);
      if (res.ok) {
        toast.success("Transaksi dibuka kembali ke draft.");
        setRevertTarget(null);
        setRevertReason("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setReverting(false);
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
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="f-status">
            Status
          </label>
          <select
            id="f-status"
            className={FIELD}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Semua status</option>
            <option value="draft">Draft</option>
            <option value="verified">Terverifikasi</option>
            <option value="approved">Disetujui</option>
          </select>
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
                const approvable = canApproveTransaction(role, row.status);
                const revertable = canRevertTransaction(role, row.status);
                const hasAction =
                  editable ||
                  deletable ||
                  verifiable ||
                  approvable ||
                  revertable;
                const proofSigned = row.proof_url
                  ? data.proofUrls[row.id]
                  : undefined;
                const proofIsPdf = row.proof_url
                  ? isPdfPath(row.proof_url)
                  : false;
                const st = STATUS_STYLE[row.status];
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
                    <TableCell>
                      {proofSigned ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPreview({ url: proofSigned, pdf: proofIsPdf })
                          }
                          className="flex size-9 items-center justify-center overflow-hidden rounded border bg-muted hover:ring-2 hover:ring-ring"
                          aria-label="Lihat bukti"
                        >
                          {proofIsPdf ? (
                            <FileText className="size-4 text-muted-foreground" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={proofSigned}
                              alt="Bukti"
                              className="size-9 object-cover"
                            />
                          )}
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("border-transparent", st.className)}
                      >
                        {st.label}
                      </Badge>
                      {row.status !== "draft" && row.verified_at && (
                        <span className="mt-1 block text-[11px] text-muted-foreground">
                          {data.verifierNames[row.id]
                            ? `oleh ${data.verifierNames[row.id]} • `
                            : ""}
                          {formatTanggal(row.verified_at, "d MMM yyyy")}
                        </span>
                      )}
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
                              title="Edit"
                            >
                              <Pencil className="size-4" />
                            </Button>
                          )}
                          {verifiable && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleVerify(row)}
                              disabled={busyId === row.id}
                              aria-label="Verifikasi"
                              title="Verifikasi"
                            >
                              <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-400" />
                            </Button>
                          )}
                          {approvable && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setApproveTarget(row)}
                              aria-label="Sahkan"
                              title="Sahkan"
                            >
                              <ShieldCheck className="size-4 text-green-600 dark:text-green-400" />
                            </Button>
                          )}
                          {revertable && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setRevertTarget(row)}
                              aria-label="Buka kunci"
                              title="Buka kunci"
                            >
                              <LockOpen className="size-4 text-amber-600 dark:text-amber-400" />
                            </Button>
                          )}
                          {deletable && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setDeleteTarget(row)}
                              aria-label="Hapus"
                              title="Hapus"
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          )}
                          {!hasAction && (
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

      {/* Konfirmasi hapus */}
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

      {/* Konfirmasi sahkan */}
      <Dialog
        open={approveTarget !== null}
        onOpenChange={(o) => {
          if (!o) setApproveTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sahkan transaksi?</DialogTitle>
            <DialogDescription>
              {approveTarget
                ? `Transaksi ${formatTanggal(approveTarget.date)} sebesar ${formatRupiah(approveTarget.amount)} akan disahkan dan TERKUNCI — tidak bisa diedit/dihapus lagi.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveTarget(null)}
              disabled={approving}
            >
              Batal
            </Button>
            <Button onClick={handleApprove} disabled={approving}>
              {approving ? "Memproses…" : "Sahkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Buka kunci (revert) */}
      <Dialog
        open={revertTarget !== null}
        onOpenChange={(o) => {
          if (!o) {
            setRevertTarget(null);
            setRevertReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buka kunci transaksi?</DialogTitle>
            <DialogDescription>
              Status akan kembali ke draft dan bisa diedit lagi. Tindakan ini
              dicatat pada log audit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="revert-reason">Alasan</Label>
            <Input
              id="revert-reason"
              value={revertReason}
              onChange={(e) => setRevertReason(e.target.value)}
              placeholder="mis. koreksi nominal"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRevertTarget(null);
                setRevertReason("");
              }}
              disabled={reverting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevert}
              disabled={reverting}
            >
              {reverting ? "Memproses…" : "Buka kunci"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview bukti */}
      <Dialog
        open={preview !== null}
        onOpenChange={(o) => {
          if (!o) setPreview(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bukti</DialogTitle>
            <DialogDescription>Pratinjau bukti transaksi.</DialogDescription>
          </DialogHeader>
          {preview && (
            <div className="space-y-3">
              {preview.pdf ? (
                <iframe
                  src={preview.url}
                  className="h-[70vh] w-full rounded border"
                  title="Bukti PDF"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.url}
                  alt="Bukti"
                  className="max-h-[70vh] w-full rounded border object-contain"
                />
              )}
              <a
                href={preview.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex text-sm text-primary underline-offset-4 hover:underline"
              >
                Buka di tab baru
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
