import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { formatRupiah, formatTanggal } from "@/lib/format";

export type ReportMeta = {
  churchName: string;
  churchAddress: string;
  title: string;
  periodLabel: string;
  printedAt: string;
  printedBy: string;
  /** "Semua departemen" atau "Departemen: Pemuda" */
  scopeLabel: string;
  /** Dasar angka, mis. "Semua status" / "Hanya Terverifikasi & Disetujui" */
  basisLabel: string;
};

export type RangeRow = {
  date: string;
  departmentName: string;
  cashName: string;
  type: "income" | "expense";
  category: string | null;
  amount: number;
  statusLabel: string;
};

export type WeeklyRowPdf = {
  weekLabel: string;
  cashName: string;
  persembahan_mimbar: number;
  kolekte_ibadah: number;
  perpuluhan: number;
  persembahan_syukur: number;
  lainnya: number;
  total: number;
};

export type GroupRow = {
  name: string;
  income: number;
  expense: number;
  net: number;
};

export type ReportData =
  | {
      kind: "range";
      meta: ReportMeta;
      rows: RangeRow[];
      income: number;
      expense: number;
      saldo: number;
    }
  | {
      kind: "weekly";
      meta: ReportMeta;
      rows: WeeklyRowPdf[];
      total: number;
    }
  | {
      kind: "monthly";
      meta: ReportMeta;
      income: number;
      expense: number;
      saldo: number;
      perDept: GroupRow[];
      perCash: GroupRow[];
    };

const s = StyleSheet.create({
  page: { padding: 32, fontSize: 9, color: "#111827", fontFamily: "Helvetica" },
  kop: {
    borderBottomWidth: 2,
    borderBottomColor: "#111827",
    paddingBottom: 8,
    marginBottom: 12,
  },
  church: { fontSize: 15, fontFamily: "Helvetica-Bold" },
  address: { fontSize: 8, color: "#6b7280", marginTop: 2 },
  title: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 10 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 3 },
  meta: { fontSize: 8, color: "#4b5563" },
  section: { fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 14, marginBottom: 5 },
  thead: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingVertical: 4,
    paddingHorizontal: 3,
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 3,
    paddingHorizontal: 3,
  },
  th: { fontFamily: "Helvetica-Bold", fontSize: 8 },
  td: { fontSize: 8 },
  right: { textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#111827",
    paddingVertical: 5,
    paddingHorizontal: 3,
    marginTop: 2,
  },
  bold: { fontFamily: "Helvetica-Bold" },
  summaryBox: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 8,
  },
  cardLabel: { fontSize: 8, color: "#6b7280" },
  cardValue: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 3 },
  empty: { fontSize: 8, color: "#6b7280", paddingVertical: 10, textAlign: "center" },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 32,
    right: 32,
    fontSize: 7,
    color: "#9ca3af",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

function Kop({ meta }: { meta: ReportMeta }) {
  return (
    <View style={s.kop}>
      <Text style={s.church}>{meta.churchName}</Text>
      {meta.churchAddress ? (
        <Text style={s.address}>{meta.churchAddress}</Text>
      ) : null}
      <Text style={s.title}>{meta.title}</Text>
      <View style={s.metaRow}>
        <Text style={s.meta}>Periode: {meta.periodLabel}</Text>
        <Text style={s.meta}>Dicetak: {meta.printedAt}</Text>
      </View>
      <View style={s.metaRow}>
        <Text style={s.meta}>{meta.scopeLabel}</Text>
        <Text style={s.meta}>Pencetak: {meta.printedBy}</Text>
      </View>
      <View style={s.metaRow}>
        <Text style={s.meta}>Dasar angka: {meta.basisLabel}</Text>
      </View>
    </View>
  );
}

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text>Dokumen dihasilkan otomatis oleh KasJemaat.</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `Halaman ${pageNumber} dari ${totalPages}`
        }
      />
    </View>
  );
}

function Summary({
  income,
  expense,
  saldo,
}: {
  income: number;
  expense: number;
  saldo: number;
}) {
  return (
    <View style={s.summaryBox}>
      <View style={s.card}>
        <Text style={s.cardLabel}>Total Pemasukan</Text>
        <Text style={s.cardValue}>{formatRupiah(income)}</Text>
      </View>
      <View style={s.card}>
        <Text style={s.cardLabel}>Total Pengeluaran</Text>
        <Text style={s.cardValue}>{formatRupiah(expense)}</Text>
      </View>
      <View style={s.card}>
        <Text style={s.cardLabel}>Saldo</Text>
        <Text style={s.cardValue}>{formatRupiah(saldo)}</Text>
      </View>
    </View>
  );
}

function GroupTable({ title, rows }: { title: string; rows: GroupRow[] }) {
  return (
    <View>
      <Text style={s.section}>{title}</Text>
      <View style={s.thead}>
        <Text style={[s.th, { flex: 3 }]}>Nama</Text>
        <Text style={[s.th, s.right, { flex: 2 }]}>Pemasukan</Text>
        <Text style={[s.th, s.right, { flex: 2 }]}>Pengeluaran</Text>
        <Text style={[s.th, s.right, { flex: 2 }]}>Saldo</Text>
      </View>
      {rows.length === 0 ? (
        <Text style={s.empty}>Tidak ada data.</Text>
      ) : (
        rows.map((r) => (
          <View key={r.name} style={s.tr} wrap={false}>
            <Text style={[s.td, { flex: 3 }]}>{r.name}</Text>
            <Text style={[s.td, s.right, { flex: 2 }]}>
              {formatRupiah(r.income)}
            </Text>
            <Text style={[s.td, s.right, { flex: 2 }]}>
              {formatRupiah(r.expense)}
            </Text>
            <Text style={[s.td, s.right, s.bold, { flex: 2 }]}>
              {formatRupiah(r.net)}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

export function ReportDocument({ data }: { data: ReportData }) {
  return (
    <Document title={data.meta.title} author="KasJemaat">
      <Page size="A4" orientation={data.kind === "weekly" ? "landscape" : "portrait"} style={s.page}>
        <Kop meta={data.meta} />

        {data.kind === "range" && (
          <>
            <Summary
              income={data.income}
              expense={data.expense}
              saldo={data.saldo}
            />
            <Text style={s.section}>Rincian Transaksi</Text>
            <View style={s.thead} fixed>
              <Text style={[s.th, { flex: 2 }]}>Tanggal</Text>
              <Text style={[s.th, { flex: 3 }]}>Departemen</Text>
              <Text style={[s.th, { flex: 3 }]}>Jenis Kas</Text>
              <Text style={[s.th, { flex: 3 }]}>Kategori</Text>
              <Text style={[s.th, { flex: 2 }]}>Jenis</Text>
              <Text style={[s.th, { flex: 2 }]}>Status</Text>
              <Text style={[s.th, s.right, { flex: 3 }]}>Jumlah</Text>
            </View>
            {data.rows.length === 0 ? (
              <Text style={s.empty}>Tidak ada transaksi pada periode ini.</Text>
            ) : (
              data.rows.map((r, i) => (
                <View key={i} style={s.tr} wrap={false}>
                  <Text style={[s.td, { flex: 2 }]}>
                    {formatTanggal(r.date, "d MMM yyyy")}
                  </Text>
                  <Text style={[s.td, { flex: 3 }]}>{r.departmentName}</Text>
                  <Text style={[s.td, { flex: 3 }]}>{r.cashName}</Text>
                  <Text style={[s.td, { flex: 3 }]}>{r.category ?? "-"}</Text>
                  <Text style={[s.td, { flex: 2 }]}>
                    {r.type === "income" ? "Masuk" : "Keluar"}
                  </Text>
                  <Text style={[s.td, { flex: 2 }]}>{r.statusLabel}</Text>
                  <Text style={[s.td, s.right, { flex: 3 }]}>
                    {formatRupiah(r.amount)}
                  </Text>
                </View>
              ))
            )}
            <View style={s.totalRow}>
              <Text style={[s.td, s.bold, { flex: 12 }]}>
                Subtotal Pemasukan / Pengeluaran / Saldo
              </Text>
              <Text style={[s.td, s.bold, s.right, { flex: 8 }]}>
                {formatRupiah(data.income)} / {formatRupiah(data.expense)} /{" "}
                {formatRupiah(data.saldo)}
              </Text>
            </View>
          </>
        )}

        {data.kind === "weekly" && (
          <>
            <Text style={s.section}>Rekap Kas Mingguan</Text>
            <View style={s.thead} fixed>
              <Text style={[s.th, { flex: 3 }]}>Minggu</Text>
              <Text style={[s.th, { flex: 3 }]}>Jenis Kas</Text>
              <Text style={[s.th, s.right, { flex: 2.4 }]}>P. Mimbar</Text>
              <Text style={[s.th, s.right, { flex: 2.4 }]}>Kolekte</Text>
              <Text style={[s.th, s.right, { flex: 2.4 }]}>Perpuluhan</Text>
              <Text style={[s.th, s.right, { flex: 2.4 }]}>P. Syukur</Text>
              <Text style={[s.th, s.right, { flex: 2.4 }]}>Lainnya</Text>
              <Text style={[s.th, s.right, { flex: 2.6 }]}>Total</Text>
            </View>
            {data.rows.length === 0 ? (
              <Text style={s.empty}>Tidak ada rekap pada periode ini.</Text>
            ) : (
              data.rows.map((r, i) => (
                <View key={i} style={s.tr} wrap={false}>
                  <Text style={[s.td, { flex: 3 }]}>{r.weekLabel}</Text>
                  <Text style={[s.td, { flex: 3 }]}>{r.cashName}</Text>
                  <Text style={[s.td, s.right, { flex: 2.4 }]}>
                    {formatRupiah(r.persembahan_mimbar)}
                  </Text>
                  <Text style={[s.td, s.right, { flex: 2.4 }]}>
                    {formatRupiah(r.kolekte_ibadah)}
                  </Text>
                  <Text style={[s.td, s.right, { flex: 2.4 }]}>
                    {formatRupiah(r.perpuluhan)}
                  </Text>
                  <Text style={[s.td, s.right, { flex: 2.4 }]}>
                    {formatRupiah(r.persembahan_syukur)}
                  </Text>
                  <Text style={[s.td, s.right, { flex: 2.4 }]}>
                    {formatRupiah(r.lainnya)}
                  </Text>
                  <Text style={[s.td, s.right, s.bold, { flex: 2.6 }]}>
                    {formatRupiah(r.total)}
                  </Text>
                </View>
              ))
            )}
            <View style={s.totalRow}>
              <Text style={[s.td, s.bold, { flex: 18 }]}>Total keseluruhan</Text>
              <Text style={[s.td, s.bold, s.right, { flex: 2.6 }]}>
                {formatRupiah(data.total)}
              </Text>
            </View>
          </>
        )}

        {data.kind === "monthly" && (
          <>
            <Summary
              income={data.income}
              expense={data.expense}
              saldo={data.saldo}
            />
            <GroupTable title="Ringkasan per Departemen" rows={data.perDept} />
            <GroupTable title="Ringkasan per Jenis Kas" rows={data.perCash} />
          </>
        )}

        <Footer />
      </Page>
    </Document>
  );
}
