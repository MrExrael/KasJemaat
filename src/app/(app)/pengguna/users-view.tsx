"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, UserCheck, UserX } from "lucide-react";
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
import { ROLE_LABEL } from "@/lib/auth/permissions";
import type { UsersData } from "@/lib/users/queries";
import type { UserRow } from "@/lib/validators/user";
import { cn } from "@/lib/utils";
import { setUserActive } from "./actions";
import { UserFormDialog } from "./user-form-dialog";

export function UsersView({
  data,
  currentUserId,
}: {
  data: UsersData;
  currentUserId: string;
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [target, setTarget] = useState<UserRow | null>(null);
  const [pending, setPending] = useState(false);

  const deptName = useMemo(() => {
    const map = new Map(data.departments.map((d) => [d.id, d.name]));
    return (id: string | null) => (id ? (map.get(id) ?? "—") : "—");
  }, [data.departments]);

  function openEdit(row: UserRow) {
    setEditing(row);
    setFormOpen(true);
  }

  async function handleToggleActive() {
    if (!target) return;
    setPending(true);
    try {
      const res = await setUserActive(target.id, !target.is_active);
      if (res.ok) {
        toast.success(
          target.is_active ? "Pengguna dinonaktifkan." : "Pengguna diaktifkan.",
        );
        setTarget(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Peran</TableHead>
              <TableHead>Departemen</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  Belum ada pengguna.
                </TableCell>
              </TableRow>
            ) : (
              data.rows.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="whitespace-nowrap">
                      {u.full_name ?? "(tanpa nama)"}
                      {isSelf && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (Anda)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-muted-foreground">
                      {u.email ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="secondary">{ROLE_LABEL[u.role]}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {deptName(u.department_id)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-transparent",
                          u.is_active
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {u.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(u)}
                          aria-label="Edit"
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setTarget(u)}
                          disabled={isSelf && u.is_active}
                          aria-label={
                            u.is_active ? "Nonaktifkan" : "Aktifkan"
                          }
                          title={
                            isSelf && u.is_active
                              ? "Tidak bisa menonaktifkan akun sendiri"
                              : u.is_active
                                ? "Nonaktifkan"
                                : "Aktifkan"
                          }
                        >
                          {u.is_active ? (
                            <UserX className="size-4 text-destructive" />
                          ) : (
                            <UserCheck className="size-4 text-green-600 dark:text-green-400" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        departments={data.departments}
        currentUserId={currentUserId}
        onSaved={() => router.refresh()}
      />

      <Dialog
        open={target !== null}
        onOpenChange={(o) => {
          if (!o) setTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {target?.is_active ? "Nonaktifkan pengguna?" : "Aktifkan pengguna?"}
            </DialogTitle>
            <DialogDescription>
              {target?.is_active
                ? `${target?.full_name ?? "Pengguna"} akan langsung kehilangan akses ke aplikasi pada permintaan berikutnya.`
                : `${target?.full_name ?? "Pengguna"} akan dapat masuk kembali.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTarget(null)}
              disabled={pending}
            >
              Batal
            </Button>
            <Button
              variant={target?.is_active ? "destructive" : "default"}
              onClick={handleToggleActive}
              disabled={pending}
            >
              {pending
                ? "Memproses…"
                : target?.is_active
                  ? "Nonaktifkan"
                  : "Aktifkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
