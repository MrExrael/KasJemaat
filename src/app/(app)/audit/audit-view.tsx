"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AuditData } from "@/lib/audit/queries";
import { formatTanggal } from "@/lib/format";

const FIELD =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

const ACTION_LABEL: Record<string, string> = {
  create: "Tambah",
  update: "Ubah",
  delete: "Hapus",
  verify: "Verifikasi",
  approve: "Sahkan",
  revert: "Buka kunci",
  proof_set: "Unggah bukti",
  proof_remove: "Hapus bukti",
  activate: "Aktifkan",
  deactivate: "Nonaktifkan",
  role_change: "Ubah peran",
};

const ENTITY_LABEL: Record<string, string> = {
  transaction: "Transaksi",
  department: "Departemen",
  weekly_report: "Kas Mingguan",
  user: "Pengguna",
};

function metaText(meta: unknown): string {
  if (!meta || typeof meta !== "object") return "—";
  const entries = Object.entries(meta as Record<string, unknown>);
  if (entries.length === 0) return "—";
  return entries.map(([k, v]) => `${k}: ${String(v)}`).join(", ");
}

type Filters = { from?: string; to?: string; user?: string; entity?: string };

export function AuditView({
  data,
  filters,
}: {
  data: AuditData;
  filters: Filters;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [from, setFrom] = useState(filters.from ?? "");
  const [to, setTo] = useState(filters.to ?? "");
  const [user, setUser] = useState(filters.user ?? "");
  const [entity, setEntity] = useState(filters.entity ?? "");

  function hrefFor(f: Filters & { page: number }): string {
    const sp = new URLSearchParams();
    if (f.from) sp.set("from", f.from);
    if (f.to) sp.set("to", f.to);
    if (f.user) sp.set("user", f.user);
    if (f.entity) sp.set("entity", f.entity);
    if (f.page > 1) sp.set("page", String(f.page));
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function apply() {
    router.push(
      hrefFor({
        from: from || undefined,
        to: to || undefined,
        user: user || undefined,
        entity: entity || undefined,
        page: 1,
      }),
    );
  }

  function reset() {
    setFrom("");
    setTo("");
    setUser("");
    setEntity("");
    router.push(pathname);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="a-from">
            Dari tanggal
          </label>
          <input
            id="a-from"
            type="date"
            className={FIELD}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="a-to">
            Sampai tanggal
          </label>
          <input
            id="a-to"
            type="date"
            className={FIELD}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="a-user">
            Pengguna
          </label>
          <select
            id="a-user"
            className={FIELD}
            value={user}
            onChange={(e) => setUser(e.target.value)}
          >
            <option value="">Semua pengguna</option>
            {data.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="a-entity">
            Entitas
          </label>
          <select
            id="a-entity"
            className={FIELD}
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
          >
            <option value="">Semua entitas</option>
            {Object.entries(ENTITY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <Button variant="secondary" onClick={apply}>
          Terapkan
        </Button>
        <Button variant="ghost" onClick={reset}>
          Reset
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Waktu</TableHead>
              <TableHead>Pengguna</TableHead>
              <TableHead>Aksi</TableHead>
              <TableHead>Entitas</TableHead>
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  Belum ada catatan audit untuk filter ini.
                </TableCell>
              </TableRow>
            ) : (
              data.rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatTanggal(r.created_at, "d MMM yyyy, HH:mm")}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {r.userName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {ACTION_LABEL[r.action] ?? r.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {ENTITY_LABEL[r.entity] ?? r.entity}
                  </TableCell>
                  <TableCell className="max-w-80 truncate text-muted-foreground">
                    {metaText(r.meta)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
        <span>
          Halaman {data.page} dari {data.totalPages} • {data.totalCount} catatan
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={data.page <= 1}
            onClick={() => router.push(hrefFor({ ...filters, page: data.page - 1 }))}
          >
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={data.page >= data.totalPages}
            onClick={() => router.push(hrefFor({ ...filters, page: data.page + 1 }))}
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  );
}
