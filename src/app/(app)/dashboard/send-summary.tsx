"use client";

import { useState } from "react";
import { Copy, Mail, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  buildSummarySubject,
  buildSummaryText,
  mailtoUrl,
  whatsappUrl,
  type SummaryInput,
} from "@/lib/summary/text";
import { cn } from "@/lib/utils";

export function SendSummary({ input }: { input: SummaryInput }) {
  const [open, setOpen] = useState(false);

  const text = buildSummaryText(input);
  const subject = buildSummarySubject(input);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Teks ringkasan disalin.");
    } catch {
      toast.error("Gagal menyalin. Silakan salin manual dari kotak teks.");
    }
  }

  return (
    <>
      <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <Send className="size-4" />
        Kirim Ringkasan
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Kirim Ringkasan</DialogTitle>
            <DialogDescription>
              Teks dibuat otomatis dari periode terpilih. Pilih tujuan, lalu
              kirim manual dari aplikasi tujuan.
            </DialogDescription>
          </DialogHeader>

          <textarea
            readOnly
            value={text}
            rows={14}
            aria-label="Teks ringkasan"
            className="w-full resize-none rounded-lg border bg-muted/30 p-3 font-mono text-xs text-foreground"
          />

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="gap-2" onClick={copy}>
              <Copy className="size-4" />
              Salin Teks
            </Button>
            <a
              href={mailtoUrl(subject, text)}
              className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
            >
              <Mail className="size-4" />
              Email
            </a>
            <a
              href={whatsappUrl(text)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants(), "gap-2")}
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
