import { Skeleton } from "@/components/ui/skeleton"

export function PageLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-56 max-w-full" />
      <Skeleton className="h-4 w-96 max-w-full" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  )
}
