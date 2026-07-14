"use client";

import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { WhatsNew } from "@/components/shared/whats-new";
import { ROLE_LABEL, type Role } from "@/lib/auth/permissions";

export function AppHeader({
  fullName,
  role,
}: {
  fullName: string | null;
  role: Role;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-card px-6">
      <WhatsNew />
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <span className="truncate text-sm font-medium">
          {fullName ?? "Pengguna"}
        </span>
        <Badge variant="secondary">{ROLE_LABEL[role]}</Badge>
      </div>
    </header>
  );
}
