/**
 * Konfigurasi sederhana kop laporan. Ganti lewat env bila perlu
 * (NEXT_PUBLIC_CHURCH_NAME / NEXT_PUBLIC_CHURCH_ADDRESS) tanpa ubah kode.
 */
export const CHURCH_NAME =
  process.env.NEXT_PUBLIC_CHURCH_NAME?.trim() || "Gereja Jemaat";

export const CHURCH_ADDRESS =
  process.env.NEXT_PUBLIC_CHURCH_ADDRESS?.trim() || "";

export const APP_NAME = "KasJemaat";
