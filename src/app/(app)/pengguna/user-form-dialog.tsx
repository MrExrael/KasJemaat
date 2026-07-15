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
import { ROLE_LABEL, type Role } from "@/lib/auth/permissions";
import { userSchema, type UserRow } from "@/lib/validators/user";
import { updateUser } from "./actions";

const FIELD_SELECT =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30";

const ROLES: Role[] = ["gembala", "sekretaris", "bendahara", "petugas"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserRow | null;
  departments: { id: string; name: string }[];
  currentUserId: string;
  onSaved: () => void;
};

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  departments,
  currentUserId,
  onSaved,
}: Props) {
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("petugas");
  const [deptId, setDeptId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setFullName(user.full_name ?? "");
    setRole(user.role);
    setDeptId(user.department_id ?? "");
    setErrors({});
  }, [open, user]);

  const isSelf = user?.id === currentUserId;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    const values = { full_name: fullName, role, department_id: deptId };
    const parsed = userSchema.safeParse(values);
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
      const res = await updateUser(user.id, values);
      if (res.ok) {
        toast.success("Pengguna diperbarui.");
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Pengguna</DialogTitle>
          <DialogDescription>
            {user?.email ?? "—"} — ubah nama, peran, dan departemen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="u-name">Nama Lengkap</Label>
            <Input
              id="u-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              aria-invalid={Boolean(errors.full_name)}
            />
            {errors.full_name && (
              <p className="text-xs text-destructive">{errors.full_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="u-role">Peran</Label>
            <select
              id="u-role"
              className={FIELD_SELECT}
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              disabled={isSelf}
              aria-invalid={Boolean(errors.role)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
            {isSelf && (
              <p className="text-xs text-muted-foreground">
                Peran sendiri tidak bisa diubah dari sini (mencegah terkunci
                keluar).
              </p>
            )}
            {errors.role && (
              <p className="text-xs text-destructive">{errors.role}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="u-dept">Departemen</Label>
            <select
              id="u-dept"
              className={FIELD_SELECT}
              value={deptId}
              onChange={(e) => setDeptId(e.target.value)}
              aria-invalid={Boolean(errors.department_id)}
            >
              <option value="">— Tanpa departemen —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Wajib diisi untuk peran Petugas.
            </p>
            {errors.department_id && (
              <p className="text-xs text-destructive">{errors.department_id}</p>
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
