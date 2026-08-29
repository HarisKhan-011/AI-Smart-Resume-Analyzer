import type { Job } from "@/types/job"

/** Demo data for UI development only — not real user data */
export const mockDemoJobs: Pick<
  Job,
  "id" | "title" | "company" | "location" | "skills" | "postedAt"
>[] = [
  {
    id: "demo-1",
    title: "Frontend Developer",
    company: "Demo Corp",
    location: "Remote",
    skills: ["React", "TypeScript", "Next.js"],
    postedAt: new Date("2026-01-15"),
  },
  {
    id: "demo-2",
    title: "Full Stack Engineer",
    company: "Sample Inc",
    location: "New York, NY",
    skills: ["Node.js", "MongoDB", "React"],
    postedAt: new Date("2026-01-10"),
  },
]

export const mockDemoResume = {
  id: "demo-resume",
  fileName: "demo-resume.pdf",
  uploadedAt: new Date("2026-01-20"),
  score: null as number | null,
  status: "pending" as const,
}
