import { JobCardSkeleton } from "@/components/dashboard/skeletons"

export default function JobsLoading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <JobCardSkeleton />
      <JobCardSkeleton />
    </div>
  )
}
