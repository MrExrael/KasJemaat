export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-36 animate-pulse rounded bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-9 w-full max-w-3xl animate-pulse rounded-lg bg-muted" />
      <div className="space-y-3 rounded-xl border bg-card p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 w-full animate-pulse rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}
