"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  FileDown,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth/actions";
import {
  navItemsForRole,
  type NavKey,
  type Role,
} from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";

const ICONS: Record<NavKey, ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  pemasukan: HandCoins,
  pengeluaran: Receipt,
  "kas-mingguan": Wallet,
  departemen: Building2,
  pengguna: Users,
  ekspor: FileDown,
};

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navItemsForRole(role);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <span className="font-heading text-lg font-semibold">KasJemaat</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {items.map(({ key, href, label }) => {
          const Icon = ICONS[key];
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={key}
              href={href}
              className={cn(
                buttonVariants({
                  variant: active ? "secondary" : "ghost",
                  size: "lg",
                }),
                "w-full justify-start gap-2",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="outline"
            size="lg"
            className="w-full justify-start gap-2"
          >
            <LogOut className="size-4" />
            Keluar
          </Button>
        </form>
      </div>
    </aside>
  );
}
