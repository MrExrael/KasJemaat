export const APP_VERSION = "2.0.0";

export type ChangelogEntry = {
  version: string;
  date: string;
  items: string[];
};

/** Riwayat pembaruan, terbaru di atas. */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "2.0.0",
    date: "2026-07-14",
    items: [
      "Upload bukti transaksi (foto/PDF) dengan pratinjau aman lewat signed URL.",
      "Mode tampilan: Terang, Gelap, dan mengikuti perangkat.",
      "Notifikasi login (berhasil/gagal) yang lebih jelas.",
      "Catatan pembaruan (What's New) ini.",
    ],
  },
  {
    version: "1.3.0",
    date: "2026-07-13",
    items: [
      "Transaksi harian pemasukan & pengeluaran: tabel, filter tanggal & departemen, pagination, dan total.",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-07-12",
    items: ["Manajemen departemen (tambah/edit/hapus) dengan soft-delete."],
  },
  {
    version: "1.1.0",
    date: "2026-07-11",
    items: [
      "Hak akses berbasis peran (RBAC): menu & tombol menyesuaikan peran pengguna.",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-07-11",
    items: ["Rilis awal: login, dashboard, dan kerangka aplikasi."],
  },
];
