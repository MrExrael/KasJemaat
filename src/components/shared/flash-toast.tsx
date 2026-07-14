"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const MESSAGES: Record<string, { type: "error" | "success"; text: string }> = {
  login: { type: "success", text: "Berhasil masuk." },
  denied: { type: "error", text: "Akses ditolak." },
  inactive: { type: "error", text: "Akun Anda dinonaktifkan. Hubungi admin." },
  noprofile: {
    type: "error",
    text: "Profil tidak ditemukan. Hubungi admin.",
  },
};

/**
 * Menampilkan toast satu kali berdasarkan query (?denied=1 atau ?error=...),
 * lalu membersihkan query dari URL. Bungkus dalam <Suspense> (useSearchParams).
 */
export function FlashToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const shown = useRef(false);

  useEffect(() => {
    const key = params.get("login")
      ? "login"
      : params.get("denied")
        ? "denied"
        : params.get("error");
    if (!key || shown.current) return;
    const msg = MESSAGES[key];
    if (!msg) return;

    shown.current = true;
    toast[msg.type](msg.text);
    router.replace(pathname);
  }, [params, router, pathname]);

  return null;
}
