"use client";

import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validators/auth";

export function LoginForm() {
  const [pending, setPending] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = loginSchema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Input tidak valid.");
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (error) {
        if (error.message?.toLowerCase().includes("not confirmed")) {
          toast.error("Email belum dikonfirmasi. Hubungi admin.");
        } else {
          toast.error("Email atau kata sandi salah.");
        }
        setPending(false);
        return;
      }

      // Sukses: notif tampil DI halaman login (form tetap ter-mount karena
      // tidak ada Server Action yang me-redirect), tahan sebentar lalu masuk.
      toast.success("Berhasil masuk.");
      setRedirecting(true);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 900);
    } catch {
      toast.error("Gagal terhubung ke server. Periksa koneksi.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="nama@gereja.org"
          autoComplete="email"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Kata Sandi</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={pending || redirecting}
      >
        {redirecting ? "Mengalihkan…" : pending ? "Memproses…" : "Masuk"}
      </Button>
    </form>
  );
}
