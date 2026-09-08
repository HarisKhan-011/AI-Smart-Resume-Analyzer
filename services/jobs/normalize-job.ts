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
  if (url.includes("skillzdunya")) return "Pakistan"
  if (url.includes("jobdataapi")) return "Pakistan"
  if (url.includes("remotive")) return "Remotive"
  if (url.includes("adzuna")) return "Adzuna"
  if (url.includes("jooble")) return "Jooble"
  if (url.includes("remoteok")) return "RemoteOK"
  if (source === "api") return "Online"
  return source?.trim() ? source : "Online"
}

export const DEFAULT_JOB_LOCATION = "Pakistan"

type PakistanCity = {
  name: string
  aliases: string[]
  ambiguous?: boolean
}

const PAKISTAN_CITIES: PakistanCity[] = [
  { name: "Lahore", aliases: ["lahore", "lhr"] },
  { name: "Karachi", aliases: ["karachi", "khi"] },
  { name: "Islamabad", aliases: ["islamabad", "isb"] },
  { name: "Rawalpindi", aliases: ["rawalpindi", "pindi"] },
  { name: "Faisalabad", aliases: ["faisalabad"] },
  { name: "Peshawar", aliases: ["peshawar"] },
  { name: "Multan", aliases: ["multan"] },
  { name: "Quetta", aliases: ["quetta"] },
  { name: "Hyderabad", aliases: ["hyderabad"], ambiguous: true },
  { name: "Sialkot", aliases: ["sialkot"] },
  { name: "Gujranwala", aliases: ["gujranwala"] },
  { name: "Bahawalpur", aliases: ["bahawalpur"] },
  { name: "Sargodha", aliases: ["sargodha"] },
  { name: "Sukkur", aliases: ["sukkur"] },
  { name: "Abbottabad", aliases: ["abbottabad"] },
  { name: "Mardan", aliases: ["mardan"] },
  { name: "Gujrat", aliases: ["gujrat"] },
  { name: "Sheikhupura", aliases: ["sheikhupura"] },
  { name: "Jhelum", aliases: ["jhelum"] },
  { name: "Sahiwal", aliases: ["sahiwal"] },
  { name: "Rahim Yar Khan", aliases: ["rahim yar khan"] },
  { name: "Dera Ghazi Khan", aliases: ["dera ghazi khan", "dg khan"] },
  { name: "Gilgit", aliases: ["gilgit"] },
  { name: "Muzaffarabad", aliases: ["muzaffarabad"] },
  { name: "Mirpur", aliases: ["mirpur"] },
  { name: "Wah Cantt", aliases: ["wah cantt"] },
  { name: "Taxila", aliases: ["taxila"] },
]

const PAKISTAN_COUNTRY_ALIASES = new Set(["pakistan", "pak", "pk"])
const IGNORED_LOCATION_TOKENS = new Set(["remote", "hybrid", "onsite", "on", "site", "wfh"])

function normalizeLocation(value: string): string {
  return value.toLowerCase().replace(/[._]/g, " ").replace(/,/g, " ").replace(/\s+/g, " ").trim()
}

function locationTokens(value: string): string[] {
  return normalizeLocation(value)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

function hasAlias(haystack: string, alias: string): boolean {
  const normalizedHaystack = normalizeLocation(haystack)
  const normalizedAlias = normalizeLocation(alias)
  if (!normalizedAlias) return false
  if (normalizedAlias.includes(" ")) return normalizedHaystack.includes(normalizedAlias)
  return locationTokens(normalizedHaystack).includes(normalizedAlias)
}

function mentionsPakistanCountry(location: string): boolean {
  return locationTokens(location).some((token) => PAKISTAN_COUNTRY_ALIASES.has(token))
}

function findPakistanCity(location: string): PakistanCity | null {
  const normalized = normalizeLocation(location)
  return PAKISTAN_CITIES.find((city) => city.aliases.some((alias) => hasAlias(normalized, alias))) ?? null
}

export function resolveJobSearchLocation(query?: string | null): string {
  const trimmed = query?.trim()
  return trimmed || DEFAULT_JOB_LOCATION
}

export function pakistanSearchCity(query?: string | null): string | undefined {
  return findPakistanCity(resolveJobSearchLocation(query))?.name
}

export function isPakistanJob(location: string): boolean {
  const city = findPakistanCity(location)
  if (city?.ambiguous) return mentionsPakistanCountry(location)
  if (city) return true
  return mentionsPakistanCountry(location)
}

function isCountryWidePakistanQuery(query: string): boolean {
  if (findPakistanCity(query)) return false
  const meaningful = locationTokens(query).filter((token) => !IGNORED_LOCATION_TOKENS.has(token))
  return meaningful.length === 0 || meaningful.every((token) => PAKISTAN_COUNTRY_ALIASES.has(token))
}

export function matchesJobLocation(jobLocation: string, query?: string | null): boolean {
  if (!isPakistanJob(jobLocation)) return false

  const needle = resolveJobSearchLocation(query)
  const requestedCity = findPakistanCity(needle)
  if (requestedCity) {
    return findPakistanCity(jobLocation)?.name === requestedCity.name
  }

  if (isCountryWidePakistanQuery(needle)) return true

  const haystack = normalizeLocation(jobLocation)
  const normalizedNeedle = normalizeLocation(needle)
  if (haystack.includes(normalizedNeedle)) return true

  const tokens = locationTokens(needle).filter(
    (token) =>
      token.length >= 3 && !PAKISTAN_COUNTRY_ALIASES.has(token) && !IGNORED_LOCATION_TOKENS.has(token)
  )
  return tokens.some((token) => haystack.includes(token))
}

const KEYWORD_STOPWORDS = new Set(["job", "jobs", "hiring", "the", "and", "for", "with"])
const SHORT_KEYWORDS = new Set(["ui", "ux", "qa", "hr", "it", "ai"])

const ROLE_TOKENS = new Set([
  "developer",
  "engineer",
  "programmer",
  "sde",
  "swe",
  "coder",
  "architect",
  "intern",
  "trainee",
  "designer",
])

const ROLE_EXPAND: Record<string, string[]> = {
  developer: ["developer", "engineer", "programmer", "sde", "swe", "intern", "trainee"],
  engineer: ["engineer", "developer", "programmer", "sde", "swe", "intern", "trainee"],
  programmer: ["programmer", "developer", "engineer"],
  sde: ["sde", "software", "engineer", "developer"],
  swe: ["swe", "software", "engineer", "developer"],
  coder: ["coder", "developer", "programmer"],
  architect: ["architect", "engineer"],
  intern: ["intern", "internship", "trainee", "developer", "engineer"],
  trainee: ["trainee", "intern", "developer", "engineer"],
  designer: ["designer", "design"],
}

const DOMAIN_EXPAND: Record<string, string[]> = {
  software: [
    "software",
    "fullstack",
    "full stack",
    "web",
    "backend",
    "frontend",
    "mobile",
    "application",
    "python",
    "java",
    "javascript",
    "react",
    "node",
    "php",
    "android",
    "ios",
    "mern",
    "nextjs",
    "angular",
    "vue",
    "laravel",
    "django",
    "golang",
    "kotlin",
    "flutter",
    "qa",
    "sqa",
    "quality",
  ],
  frontend: [
    "frontend",
    "front end",
    "react",
    "vue",
    "angular",
    "ui",
    "nextjs",
    "fullstack",
    "full stack",
    "web",
  ],
  backend: ["backend", "back end", "node", "django", "spring", "api", "java", "python"],
  fullstack: ["fullstack", "full stack", "software", "web", "frontend", "backend", "mern"],
  web: ["web", "frontend", "fullstack", "full stack", "javascript", "react"],
  mobile: ["mobile", "android", "ios", "flutter", "react native"],
  react: ["react", "frontend", "javascript", "nextjs"],
  python: ["python", "django", "backend"],
  java: ["java", "spring", "backend"],
  mern: ["mern", "react", "node", "fullstack", "full stack"],
  ui: ["ui", "ux", "graphic", "graphics", "figma", "visual", "interface"],
  ux: ["ux", "ui", "graphic", "graphics", "figma", "visual", "interface"],
  graphic: ["graphic", "graphics", "ui", "ux", "visual", "designer"],
}

function foldSearchText(value: string): string {
  return value.toLowerCase().replace(/[-_.]/g, " ").replace(/\s+/g, " ").trim()
}

function containsSearchTerm(haystack: string, term: string): boolean {
  const foldedHaystack = foldSearchText(haystack)
  const foldedTerm = foldSearchText(term)
  if (!foldedTerm) return false
  if (foldedHaystack.includes(foldedTerm)) return true
  return foldedHaystack.replace(/ /g, "").includes(foldedTerm.replace(/ /g, ""))
}

function keywordTokens(keyword: string): string[] {
  return foldSearchText(keyword)
    .split(" ")
    .filter(
      (token) =>
        !KEYWORD_STOPWORDS.has(token) && (token.length >= 3 || SHORT_KEYWORDS.has(token))
    )
}

export function jobKeywordScore(
  job: { title: string; company: string; requiredSkills?: string[] },
  query?: string | null
): number {
  const keyword = query?.trim().toLowerCase()
  if (!keyword) return 0
  if (containsSearchTerm(job.title, keyword)) return 3
  const tokens = keywordTokens(keyword)
  if (tokens.length > 0 && tokens.every((token) => containsSearchTerm(job.title, token))) return 2
  return 1
}

export function matchesJobKeyword(
  job: { title: string; company: string; description: string; requiredSkills?: string[] },
  query?: string | null
): boolean {
  const keyword = query?.trim().toLowerCase()
  if (!keyword) return true

  const alternatives = keyword.split(/[,;/|]+/).map((part) => part.trim()).filter(Boolean)
  if (alternatives.length > 1) {
    return alternatives.some((part) => matchesJobKeyword(job, part))
  }

  const headline = [job.title, job.company, ...(job.requiredSkills ?? [])].join(" ")
  if (containsSearchTerm(headline, keyword) || containsSearchTerm(job.title, keyword)) return true

  const tokens = keywordTokens(keyword)
  if (tokens.length === 0) return containsSearchTerm(headline, keyword.replace(/\s+/g, ""))

  const roleTokens = tokens.filter((token) => ROLE_TOKENS.has(token))
  const domainTokens = tokens.filter((token) => !ROLE_TOKENS.has(token))

  if (roleTokens.length > 0 && domainTokens.length > 0) {
    const roles = [...new Set(roleTokens.flatMap((token) => ROLE_EXPAND[token] ?? [token]))]
    const domains = [
      ...new Set(domainTokens.flatMap((token) => DOMAIN_EXPAND[token] ?? [token])),
    ]
    const hasRole = roles.some((role) => containsSearchTerm(headline, role))
    const hasDomain = domains.some((domain) => containsSearchTerm(headline, domain))
    return hasRole && hasDomain
  }

  return tokens.every((token) => containsSearchTerm(headline, token))
}

export type PostedWithin = "all" | "24h" | "week" | "month"

export const POSTED_WITHIN_OPTIONS: Array<{ value: PostedWithin; label: string }> = [
  { value: "month", label: "Past month" },
  { value: "week", label: "Past week" },
  { value: "24h", label: "Past 24 hours" },
]

const POSTED_WITHIN_MS: Record<Exclude<PostedWithin, "all">, number> = {
  "24h": 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
}

export function resolvePostedWithin(value?: string | null): PostedWithin {
  if (value === "24h" || value === "week" || value === "month") return value
  return "all"
}

export function matchesPostedWithin(
  postedDate?: Date | string | null,
  postedWithin?: string | null
): boolean {
  const window = resolvePostedWithin(postedWithin)
  if (window === "all") return true
  if (!postedDate) return false
  const posted = new Date(postedDate).getTime()
  if (Number.isNaN(posted)) return false
  const age = Date.now() - posted
  return age >= 0 && age <= POSTED_WITHIN_MS[window]
}

export function sortJobsByPostedDate<T extends { postedDate?: Date | string | null }>(jobs: T[]): T[] {
  return [...jobs].sort((left, right) => {
    const leftTime = left.postedDate ? new Date(left.postedDate).getTime() : 0
    const rightTime = right.postedDate ? new Date(right.postedDate).getTime() : 0
    const leftValue = Number.isNaN(leftTime) ? 0 : leftTime
    const rightValue = Number.isNaN(rightTime) ? 0 : rightTime
    return rightValue - leftValue
  })
}

export type JobSearchFilters = {
  keyword?: string | null
  location?: string | null
  jobType?: string | null
  postedWithin?: string | null
}

export function matchesJobSearch(
  job: {
    title: string
    company: string
    location: string
    description: string
    employmentType?: string
    requiredSkills?: string[]
    postedDate?: Date | string | null
  },
  filters: JobSearchFilters
): boolean {
  if (!matchesJobKeyword(job, filters.keyword)) return false
  if (!matchesJobLocation(job.location, filters.location)) return false
  const jobType = filters.jobType?.trim()
  if (jobType && jobType !== "all" && job.employmentType && job.employmentType !== jobType) {
    return false
  }
  if (!matchesPostedWithin(job.postedDate, filters.postedWithin)) return false
  return true
}

export function filterSearchJobs<T extends {
  title: string
  company: string
  location: string
  description: string
  employmentType?: string
  requiredSkills?: string[]
  postedDate?: Date | string | null
}>(jobs: T[], filters: JobSearchFilters): T[] {
  return jobs
    .filter((job) => matchesJobSearch(job, filters))
    .sort((left, right) => {
      const scoreDiff = jobKeywordScore(right, filters.keyword) - jobKeywordScore(left, filters.keyword)
      if (scoreDiff !== 0) return scoreDiff
      const leftTime = left.postedDate ? new Date(left.postedDate).getTime() : 0
      const rightTime = right.postedDate ? new Date(right.postedDate).getTime() : 0
      const leftValue = Number.isNaN(leftTime) ? 0 : leftTime
      const rightValue = Number.isNaN(rightTime) ? 0 : rightTime
      return rightValue - leftValue
    })
}
