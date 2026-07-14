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
import { Switch } from "@/components/ui/switch";
import {
  departmentSchema,
  type DepartmentRow,
} from "@/lib/validators/department";
import { createDepartment, updateDepartment } from "./actions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: DepartmentRow | null;
  /** Kode departemen lain (lowercase) untuk cek unik di sisi klien. */
  existingCodes: string[];
  onSaved: () => void;
};

export function DepartmentFormDialog({
  open,
  onOpenChange,
  department,
  existingCodes,
  onSaved,
}: Props) {
  const isEdit = department !== null;
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [pic, setPic] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(department?.name ?? "");
    setCode(department?.code ?? "");
    setPic(department?.pic_name ?? "");
    setIsActive(department?.is_active ?? true);
    setErrors({});
  }, [open, department]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = { name, code, pic_name: pic, is_active: isActive };

    const parsed = departmentSchema.safeParse(values);
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

    // Cek unik kode di klien (DB tetap punya UNIQUE sebagai penjaga akhir).
    if (existingCodes.includes(parsed.data.code.toLowerCase())) {
      setErrors({ code: "Kode departemen sudah digunakan." });
      return;
    }

    setErrors({});
    setPending(true);
    try {
      const res =
        isEdit && department
          ? await updateDepartment(department.id, values)
          : await createDepartment(values);

      if (res.ok) {
        toast.success(isEdit ? "Departemen diperbarui." : "Departemen ditambahkan.");
        onOpenChange(false);
        onSaved();
      } else {
        if (/kode/i.test(res.error)) setErrors({ code: res.error });
        toast.error(res.error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Departemen" : "Tambah Departemen"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Perbarui data departemen."
              : "Isi data departemen baru."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dept-name">Nama</Label>
            <Input
              id="dept-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(errors.name)}
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dept-code">Kode</Label>
            <Input
              id="dept-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              aria-invalid={Boolean(errors.code)}
            />
            {errors.code && (
              <p className="text-xs text-destructive">{errors.code}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dept-pic">Penanggung Jawab (opsional)</Label>
            <Input
              id="dept-pic"
              value={pic}
              onChange={(e) => setPic(e.target.value)}
              aria-invalid={Boolean(errors.pic_name)}
            />
            {errors.pic_name && (
              <p className="text-xs text-destructive">{errors.pic_name}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="dept-active"
              checked={isActive}
              onCheckedChange={(v) => setIsActive(v)}
            />
            <Label htmlFor="dept-active">Aktif</Label>
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
