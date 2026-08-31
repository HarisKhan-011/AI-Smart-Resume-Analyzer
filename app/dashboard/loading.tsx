import { DashboardCardSkeleton, ResumeSkeleton } from "@/components/dashboard/skeletons"

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
      </div>
      <ResumeSkeleton />
    </div>
  )
}
