import type { EmploymentType } from "@/types/job"

const EMPLOYMENT_ALIASES: Record<string, EmploymentType> = {
  "full-time": "full-time",
  full_time: "full-time",
  fulltime: "full-time",
  permanent: "full-time",
  "part-time": "part-time",
  part_time: "part-time",
  parttime: "part-time",
  contract: "contract",
  contractor: "contract",
  freelance: "freelance",
  internship: "internship",
  intern: "internship",
  temporary: "temporary",
  temp: "temporary",
}

export function mapEmploymentType(value?: string | null): EmploymentType {
  if (!value) return "full-time"
  const key = value.trim().toLowerCase().replace(/\s+/g, "-")
  return EMPLOYMENT_ALIASES[key] ?? EMPLOYMENT_ALIASES[key.replace(/-/g, "_")] ?? "full-time"
}

export function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
}

export function firstNonEmpty(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return ""
}

export function formatEmploymentType(value?: string | null): string {
  if (!value) return "Full-time"
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function jobSourceLabel(source?: string | null, sourceUrl?: string | null): string {
  if (source === "manual") return "Analyzed"
  const url = sourceUrl?.toLowerCase() ?? ""
  if (url.includes("remotive")) return "Remotive"
  if (url.includes("adzuna")) return "Adzuna"
  if (source === "api") return "Online"
  return source?.trim() ? source : "Online"
}
