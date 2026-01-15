import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200 dark:bg-slate-800", className)}
      {...props}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-3/4 mb-4"></div>
      <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-full"></div>
    </div>
  );
}

export function VehicleCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-gray-200 dark:bg-slate-800"></div>
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-3/4"></div>
        <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded w-1/2"></div>
        <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded w-full"></div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 bg-white dark:bg-slate-900 rounded-lg shadow-sm animate-pulse"></div>
      ))}
    </div>
  );
}

export { Skeleton }
