"use client";

import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Role } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/client";
import {
  createTransaction,
  setTransactionProof,
  updateTransaction,
} from "@/lib/transactions/actions";
import {
  BUKTI_BUCKET,
  compressImage,
  extForFile,
  proofPath,
  validateProofFile,
} from "@/lib/transactions/proof";
import type { RefItem } from "@/lib/transactions/queries";
import {
  transactionSchema,
  type TransactionRow,
  type TxType,
} from "@/lib/validators/transaction";

const FIELD_SELECT =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30";

function onlyDigits(s: string): string {
  return s.replace(/\D/g, "");
}
function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
function today(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: TxType;
  transaction: TransactionRow | null;
  departments: RefItem[];
  cashTypes: RefItem[];
  role: Role;
  userDepartmentId: string | null;
  onSaved: () => void;
};

export function TransactionFormDialog({
  open,
  onOpenChange,
  type,
  transaction,
  departments,
  cashTypes,
  role,
  userDepartmentId,
  onSaved,
}: Props) {
  const isEdit = transaction !== null;
  const lockDept = role === "petugas";

  const [date, setDate] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [cashTypeId, setCashTypeId] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amountDigits, setAmountDigits] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [removeProof, setRemoveProof] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate(transaction?.date ?? today());
    setDepartmentId(
      transaction?.department_id ?? (lockDept ? (userDepartmentId ?? "") : ""),
    );
    setCashTypeId(transaction?.cash_type_id ?? "");
    setCategory(transaction?.category ?? "");
    setDescription(transaction?.description ?? "");
    setAmountDigits(transaction ? String(transaction.amount) : "");
    setFile(null);
    setFileError(null);
    setRemoveProof(false);
    setErrors({});
  }, [open, transaction, lockDept, userDepartmentId]);

  const typeLabel = type === "income" ? "Pemasukan" : "Pengeluaran";

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setFile(null);
      return;
    }
    const err = validateProofFile(f);
    if (err) {
      setFileError(err);
      setFile(null);
      e.target.value = "";
      return;
    }
    setFileError(null);
    setFile(f);
    setRemoveProof(false);
  }

  /** Unggah/hapus bukti setelah transaksi tersimpan. Best-effort. */
  async function syncProof(txId: string, deptId: string): Promise<void> {
    const supabase = createClient();

    if (file) {
      const toUpload = await compressImage(file);
      const path = proofPath(deptId, txId, extForFile(toUpload));
      const { error: upErr } = await supabase.storage
        .from(BUKTI_BUCKET)
        .upload(path, toUpload, {
          upsert: true,
          contentType: toUpload.type,
        });
      if (upErr) {
        toast.error("Transaksi tersimpan, tetapi bukti gagal diunggah.");
        return;
      }
      const pr = await setTransactionProof(txId, type, path);
      if (!pr.ok) toast.error(pr.error);
      return;
    }

    if (isEdit && removeProof && transaction?.proof_url) {
      await supabase.storage.from(BUKTI_BUCKET).remove([transaction.proof_url]);
      await setTransactionProof(txId, type, null);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = {
      date,
      department_id: lockDept ? (userDepartmentId ?? "") : departmentId,
      cash_type_id: cashTypeId,
      category,
      description,
      amount: Number(amountDigits || "0"),
    };

    const parsed = transactionSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setPending(true);
    try {
      let txId: string;
      if (isEdit && transaction) {
        const res = await updateTransaction(transaction.id, type, values);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        txId = transaction.id;
      } else {
        const res = await createTransaction(type, values);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        txId = res.id;
      }

      await syncProof(txId, values.department_id);

      toast.success(isEdit ? "Transaksi diperbarui." : `${typeLabel} ditambahkan.`);
      onOpenChange(false);
      onSaved();
    } finally {
      setPending(false);
    }
  }

  const hasExistingProof = isEdit && Boolean(transaction?.proof_url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Edit ${typeLabel}` : `Tambah ${typeLabel}`}
          </DialogTitle>
          <DialogDescription>
            Nominal disimpan sebagai rupiah bulat.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="tx-date">Tanggal</Label>
              <Input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-invalid={Boolean(errors.date)}
              />
              {errors.date && (
                <p className="text-xs text-destructive">{errors.date}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-amount">Jumlah (Rp)</Label>
              <Input
                id="tx-amount"
                inputMode="numeric"
                placeholder="0"
                value={groupThousands(amountDigits)}
                onChange={(e) => setAmountDigits(onlyDigits(e.target.value))}
                aria-invalid={Boolean(errors.amount)}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-dept">Departemen</Label>
            <select
              id="tx-dept"
              className={FIELD_SELECT}
              value={lockDept ? (userDepartmentId ?? "") : departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              disabled={lockDept}
              aria-invalid={Boolean(errors.department_id)}
            >
              <option value="">— Pilih departemen —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {d.is_active ? "" : " (nonaktif)"}
                </option>
              ))}
            </select>
            {lockDept && (
              <p className="text-xs text-muted-foreground">
                Terkunci ke departemen Anda.
              </p>
            )}
            {errors.department_id && (
              <p className="text-xs text-destructive">{errors.department_id}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-cash">Jenis Kas</Label>
            <select
              id="tx-cash"
              className={FIELD_SELECT}
              value={cashTypeId}
              onChange={(e) => setCashTypeId(e.target.value)}
              aria-invalid={Boolean(errors.cash_type_id)}
            >
              <option value="">— Pilih jenis kas —</option>
              {cashTypes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.is_active ? "" : " (nonaktif)"}
                </option>
              ))}
            </select>
            {errors.cash_type_id && (
              <p className="text-xs text-destructive">{errors.cash_type_id}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-category">Kategori (opsional)</Label>
            <Input
              id="tx-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tx-desc">Keterangan (opsional)</Label>
            <Input
              id="tx-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Bukti */}
          <div className="space-y-2">
            <Label htmlFor="tx-proof">Bukti (opsional)</Label>
            {hasExistingProof && !file && !removeProof && (
              <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <span className="text-muted-foreground">
                  Bukti sudah terlampir.
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRemoveProof(true)}
                >
                  Hapus
                </Button>
              </div>
            )}
            {hasExistingProof && removeProof && !file && (
              <div className="flex items-center justify-between rounded-lg border border-dashed px-3 py-2 text-sm">
                <span className="text-destructive">Bukti akan dihapus.</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRemoveProof(false)}
                >
                  Batal
                </Button>
              </div>
            )}
            <input
              id="tx-proof"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-transparent file:px-3 file:py-1 file:text-sm hover:file:bg-muted"
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} • {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
            {fileError && (
              <p className="text-xs text-destructive">{fileError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              JPG/PNG/WEBP/PDF, maksimal 5MB.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
