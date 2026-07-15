import { requireRouteAccess } from "@/lib/auth/session";
import { getAuditData } from "@/lib/audit/queries";
import { AuditView } from "./audit-view";

type SearchParams = Promise<{
  from?: string;
  to?: string;
  user?: string;
  entity?: string;
  page?: string;
}>;

export default async function AuditPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Gembala/Sekretaris/Bendahara. RLS audit_log_select penjaga akhir.
  await requireRouteAccess("audit");

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const data = await getAuditData({
    from: sp.from,
    to: sp.to,
    user: sp.user,
    entity: sp.entity,
    page,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Log Audit</h1>
        <p className="text-muted-foreground">
          Jejak aksi penting: siapa melakukan apa dan kapan. Hanya-baca dan tak
          bisa diubah.
        </p>
      </div>

      <AuditView
        data={data}
        filters={{
          from: sp.from,
          to: sp.to,
          user: sp.user,
          entity: sp.entity,
        }}
      />
    </div>
  );
}
