"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

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
import { APP_VERSION, CHANGELOG } from "@/lib/changelog";

const STORAGE_KEY = "kasjemaat:last-seen-version";

export function WhatsNew() {
  const [open, setOpen] = useState(false);

  // Muncul OTOMATIS sekali saja setiap kali versi berubah (atau kunjungan pertama).
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== APP_VERSION) {
        setOpen(true);
      }
    } catch {
      // localStorage tak tersedia — abaikan.
    }
  }, []);

  function markSeen() {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, APP_VERSION);
    } catch {
      // abaikan
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        title="Catatan pembaruan"
      >
        v{APP_VERSION}
      </button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) markSeen();
          else setOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4" /> Yang Baru
            </DialogTitle>
            <DialogDescription>
              Pembaruan terbaru aplikasi KasJemaat.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            {CHANGELOG.map((entry) => (
              <div key={entry.version} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      entry.version === APP_VERSION ? "default" : "secondary"
                    }
                  >
                    v{entry.version}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {entry.date}
                  </span>
                </div>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {entry.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button onClick={markSeen}>Mengerti</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
