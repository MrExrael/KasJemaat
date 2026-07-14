"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Terang", icon: Sun },
  { value: "system", label: "Sistem", icon: Monitor },
  { value: "dark", label: "Gelap", icon: Moon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const current = mounted ? (theme ?? "system") : undefined;

  return (
    <div
      className="inline-flex items-center rounded-lg border p-0.5"
      role="group"
      aria-label="Mode tampilan"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          aria-label={label}
          aria-pressed={current === value}
          title={label}
          className={cn(
            "flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground",
            current === value && "bg-muted text-foreground",
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}
