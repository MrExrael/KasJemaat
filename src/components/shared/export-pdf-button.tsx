import { FileDown } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Tautan unduh PDF. Sengaja <a> biasa (bukan next/link) agar browser
 * menangani unduhan lewat Content-Disposition dari route handler.
 */
export function ExportPdfButton({
  variant,
  from,
  to,
  dept,
  label = "Ekspor PDF",
}: {
  variant: "range" | "weekly" | "monthly";
  from: string;
  to: string;
  dept?: string;
  label?: string;
}) {
  const sp = new URLSearchParams({ variant, from, to });
  if (dept) sp.set("dept", dept);

  return (
    <a
      href={`/api/export?${sp.toString()}`}
      className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
    >
      <FileDown className="size-4" />
      {label}
    </a>
  );
}
