"use client";

import { Badge } from "@/components/ui/badge";
import { ROLE_LABEL, type Role } from "@/lib/auth/permissions";

export function AppHeader({
  fullName,
  role,
}: {
  fullName: string | null;
  role: Role;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-6">
      <div className="min-w-0" />
      <div className="flex items-center gap-3">
        <span className="truncate text-sm font-medium">
          {fullName ?? "Pengguna"}
        </span>
        <Badge variant="secondary">{ROLE_LABEL[role]}</Badge>
      </div>
    </header>
  );
}
