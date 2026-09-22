"use client"

import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"

export function IndustryResumeSwitcher({
  resumes,
  currentId,
}: {
  resumes: Array<{ id: string; fileName: string }>
  currentId: string
}) {
  const router = useRouter()

  if (resumes.length < 2) return null

  return (
    <div className="space-y-2 sm:min-w-[16rem]">
      <Label htmlFor="industry-resume">Resume</Label>
      <select
        id="industry-resume"
        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={currentId}
        onChange={(event) => {
          router.push(`/industry-insights?resumeId=${encodeURIComponent(event.target.value)}`)
        }}
      >
        {resumes.map((resume) => (
          <option key={resume.id} value={resume.id}>
            {resume.fileName}
          </option>
        ))}
      </select>
    </div>
  )
}
