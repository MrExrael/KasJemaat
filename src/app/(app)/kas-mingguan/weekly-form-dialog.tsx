"use client";

import { type FormEvent, useEffect, useState } from "react";
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
import { formatRupiah } from "@/lib/format";
import {
  WEEKLY_FIELDS,
  weeklySchema,
  type WeeklyAmountKey,
  type WeeklyRow,
} from "@/lib/validators/weekly";
import type { RefItem } from "@/lib/weekly/queries";
import { mondayOf, todayStr, weekRangeLabel } from "@/lib/weekly/week";
import { createWeekly, updateWeekly } from "./actions";

const FIELD_SELECT =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30";

function onlyDigits(s: string): string {
  return s.replace(/\D/g, "");
}
function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

type Amounts = Record<WeeklyAmountKey, string>;

const EMPTY_AMOUNTS: Amounts = {
  persembahan_mimbar: "",
  kolekte_ibadah: "",
  perpuluhan: "",
  persembahan_syukur: "",
  lainnya: "",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: WeeklyRow | null;
  cashTypes: RefItem[];
  onSaved: () => void;
};

export function WeeklyFormDialog({
  open,
  onOpenChange,
  report,
  cashTypes,
  onSaved,
}: Props) {
  const isEdit = report !== null;

  const [weekDate, setWeekDate] = useState("");
  const [cashTypeId, setCashTypeId] = useState("");
  const [amounts, setAmounts] = useState<Amounts>(EMPTY_AMOUNTS);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setWeekDate(report?.week_start_date ?? todayStr());
    setCashTypeId(report?.cash_type_id ?? "");
    setAmounts(
      report
        ? {
            persembahan_mimbar: String(report.persembahan_mimbar),
            kolekte_ibadah: String(report.kolekte_ibadah),
            perpuluhan: String(report.perpuluhan),
            persembahan_syukur: String(report.persembahan_syukur),
            lainnya: String(report.lainnya),
          }
        : EMPTY_AMOUNTS,
    );
    setNotes(report?.notes ?? "");
    setErrors({});
  }, [open, report]);

  const liveTotal = WEEKLY_FIELDS.reduce(
    (acc, f) => acc + Number(amounts[f.key] || "0"),
    0,
  );
  const rangeLabel = weekDate ? weekRangeLabel(mondayOf(weekDate)) : "—";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = {
      week_start_date: weekDate,
      cash_type_id: cashTypeId,
      persembahan_mimbar: Number(amounts.persembahan_mimbar || "0"),
      kolekte_ibadah: Number(amounts.kolekte_ibadah || "0"),
      perpuluhan: Number(amounts.perpuluhan || "0"),
      persembahan_syukur: Number(amounts.persembahan_syukur || "0"),
      lainnya: Number(amounts.lainnya || "0"),
      notes,
    };

    const parsed = weeklySchema.safeParse(values);
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
      const res =
        isEdit && report
          ? await updateWeekly(report.id, values)
          : await createWeekly(values);
      if (res.ok) {
        toast.success(isEdit ? "Rekap diperbarui." : "Rekap ditambahkan.");
        onOpenChange(false);
        onSaved();
      } else {
        toast.error(res.error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Rekap" : "Tambah Rekap Mingguan"}</DialogTitle>
          <DialogDescription>
            Minggu Senin–Minggu. Total dihitung otomatis oleh sistem.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="w-date">Minggu</Label>
              <Input
                id="w-date"
                type="date"
                value={weekDate}
                onChange={(e) => setWeekDate(e.target.value)}
                aria-invalid={Boolean(errors.week_start_date)}
              />
              <p className="text-xs text-muted-foreground">
                Rentang: <span className="font-medium">{rangeLabel}</span>
              </p>
              {errors.week_start_date && (
                <p className="text-xs text-destructive">
                  {errors.week_start_date}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="w-cash">Jenis Kas</Label>
              <select
                id="w-cash"
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
          </div>

          <div className="space-y-3">
            {WEEKLY_FIELDS.map((f) => (
              <div key={f.key} className="space-y-2">
                <Label htmlFor={`w-${f.key}`}>{f.label} (Rp)</Label>
                <Input
                  id={`w-${f.key}`}
                  inputMode="numeric"
                  placeholder="0"
                  value={groupThousands(amounts[f.key])}
                  onChange={(e) =>
                    setAmounts((prev) => ({
                      ...prev,
                      [f.key]: onlyDigits(e.target.value),
                    }))
                  }
                  aria-invalid={Boolean(errors[f.key])}
                />
                {errors[f.key] && (
                  <p className="text-xs text-destructive">{errors[f.key]}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-semibold">{formatRupiah(liveTotal)}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="w-notes">Catatan (opsional)</Label>
            <Input
              id="w-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              aria-invalid={Boolean(errors.notes)}
            />
            {errors.notes && (
              <p className="text-xs text-destructive">{errors.notes}</p>
            )}
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
