export const APP_VERSION = "2.7.0";

export type ChangelogEntry = {
  version: string;
  date: string;
  items: string[];
};

/**
 * Riwayat pembaruan, terbaru di atas.
 * KONVENSI: setiap menambah fitur baru, naikkan APP_VERSION (minor untuk fitur,
 * patch untuk perbaikan) DAN tambahkan entri di sini — dialog "Yang Baru" akan
 * muncul sekali otomatis untuk tiap pengguna saat versinya berubah.
 * Bump juga "version" di package.json agar seragam.
 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "2.7.0",
    date: "2026-07-15",
    items: [
      "Log Audit: halaman baru berisi jejak aksi penting — siapa melakukan apa dan kapan.",
      "Filter log berdasarkan tanggal, pengguna, dan jenis data.",
      "Pencatatan otomatis pada tambah/ubah/hapus transaksi, departemen, dan kas mingguan.",
    ],
  },
  {
    version: "2.6.0",
    date: "2026-07-15",
    items: [
      "Kirim Ringkasan: bagikan rekap kas periode terpilih lewat WhatsApp atau Email — teks dibuat otomatis.",
      "Tombol Salin Teks untuk menempel ringkasan ke mana saja.",
    ],
  },
  {
    version: "2.5.0",
    date: "2026-07-15",
    items: [
      "Ekspor PDF: laporan berkop untuk rentang tanggal, kas mingguan, dan bulanan.",
      "Tombol Ekspor PDF di halaman Pemasukan, Pengeluaran, Kas Mingguan, dan Dashboard — mengikuti filter yang sedang aktif.",
      "Halaman Ekspor sebagai pusat unduhan laporan.",
    ],
  },
  {
    version: "2.4.0",
    date: "2026-07-15",
    items: [
      "Dashboard baru: kartu Total Pemasukan, Total Pengeluaran, dan Saldo per periode.",
      "Grafik tren pemasukan vs pengeluaran, ringkasan per jenis kas, dan daftar transaksi terbaru.",
      "Filter periode: bulan berjalan, bulan lalu, 30 hari terakhir, atau rentang bebas.",
    ],
  },
  {
    version: "2.3.0",
    date: "2026-07-15",
    items: [
      "Kas Mingguan (Bendahara): rekap persembahan mingguan per jenis kas dengan total otomatis.",
      "Rekap ganda untuk minggu & jenis kas yang sama kini dicegah.",
    ],
  },
  {
    version: "2.2.0",
    date: "2026-07-15",
    items: [
      "Alur verifikasi & persetujuan transaksi: draft menjadi terverifikasi, lalu disetujui.",
      "Transaksi yang sudah disetujui terkunci; hanya Sekretaris yang dapat membukanya kembali disertai alasan, dan tercatat pada log audit.",
      "Filter status serta jejak pemverifikasi pada tabel transaksi.",
    ],
  },
  {
    version: "2.1.0",
    date: "2026-07-15",
    items: [
      "Halaman depan publik dengan ringkasan fitur dan tampilan aplikasi.",
      "Perbaikan notifikasi login: pesan berhasil maupun gagal kini muncul di halaman login.",
    ],
  },
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
