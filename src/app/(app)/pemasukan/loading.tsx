import { TransactionsSkeleton } from "@/components/transactions/transactions-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-44" />
      <TransactionsSkeleton />
    </div>
  );
}
