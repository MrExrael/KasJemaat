import { Skeleton } from "@/components/ui/skeleton";

export function TransactionsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="space-y-2 rounded-xl border p-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    </div>
  );
}
