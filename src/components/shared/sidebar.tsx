"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

const menu = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pemasukan", label: "Pemasukan", icon: HandCoins },
  { href: "/pengeluaran", label: "Pengeluaran", icon: Receipt },
  { href: "/kas-mingguan", label: "Kas Mingguan", icon: Wallet },
  { href: "/departemen", label: "Departemen", icon: Building2 },
  { href: "/pengguna", label: "Pengguna", icon: Users },
] as const;

export function Sidebar({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <span className="font-heading text-lg font-semibold">KasJemaat</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {menu.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
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

      <div className="space-y-2 border-t p-3">
        {userEmail ? (
          <p
            className="truncate px-1 text-xs text-muted-foreground"
            title={userEmail}
          >
            {userEmail}
          </p>
        ) : null}
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
