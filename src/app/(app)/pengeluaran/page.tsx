import { redirect } from "next/navigation";

import { TransactionsView } from "@/components/transactions/transactions-view";
import { getCurrentProfile } from "@/lib/auth/session";
import { getTransactionsData } from "@/lib/transactions/queries";

type SearchParams = Promise<{
  from?: string;
  to?: string;
  dept?: string;
  page?: string;
}>;

export default async function PengeluaranPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const data = await getTransactionsData("expense", profile, {
    from: sp.from,
    to: sp.to,
    departmentId: sp.dept,
    page,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Pengeluaran</h1>
        <p className="text-muted-foreground">Catatan transaksi pengeluaran.</p>
      </div>
      <TransactionsView
        type="expense"
        role={profile.role}
        userId={profile.id}
        userDepartmentId={profile.department_id}
        data={data}
        filters={{ from: sp.from, to: sp.to, dept: sp.dept }}
      />
    </div>
  );
}
