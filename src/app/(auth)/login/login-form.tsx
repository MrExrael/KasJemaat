"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  useEffect(() => {
    if (state?.error) {
      // Notif GAGAL tampil di halaman login.
      toast.error(state.error);
    } else if (state?.ok) {
      // Notif BERHASIL tampil di halaman login, tahan sebentar agar terlihat,
      // baru navigasi ke dashboard.
      toast.success("Berhasil masuk.");
      setRedirecting(true);
      const t = setTimeout(() => router.push("/dashboard"), 800);
      return () => clearTimeout(t);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
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
        disabled={isPending || redirecting}
      >
        {isPending ? "Memproses…" : redirecting ? "Mengalihkan…" : "Masuk"}
      </Button>
    </form>
  );
}
