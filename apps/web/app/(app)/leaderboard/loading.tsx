import { Skeleton } from '@simcoin/ui';

export default function LeaderboardLoading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-20" />
      <Skeleton className="h-11 w-full rounded-full" />
      <div className="flex flex-col gap-1.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    </div>
  );
}
