import { ResumeSkeleton } from "@/components/dashboard/skeletons"

export default function ResumeLoading() {
  return (
    <div className="space-y-4">
      <ResumeSkeleton />
      <ResumeSkeleton />
      <ResumeSkeleton />
    </div>
  )
}
