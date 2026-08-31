import { JobCardSkeleton } from "@/components/dashboard/skeletons"

export default function ApplicationsLoading() {
  return (
    <div className="space-y-4">
      <JobCardSkeleton />
      <JobCardSkeleton />
    </div>
  )
}
