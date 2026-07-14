"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validators/auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input tidak valid." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (error) {
      if (error.message?.toLowerCase().includes("not confirmed")) {
        return { error: "Email belum dikonfirmasi. Hubungi admin." };
      }
      return { error: "Email atau kata sandi salah." };
    }
  } catch {
    // Env salah/hilang, koneksi gagal, dsb. — jangan sampai senyap.
    return {
      error: "Gagal terhubung ke server. Periksa koneksi atau konfigurasi.",
    };
  }

  // redirect() melempar internal; HARUS di luar try/catch di atas.
  redirect("/dashboard?login=1");
}
