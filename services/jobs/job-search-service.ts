import { extractJobSkills } from "@/services/nlp/job-skill-extractor"
import { extractSkills } from "@/services/nlp/skill-extractor"
import { uniqueSkillNames } from "@/services/matching/normalize-skills"
import {
  createJobProvider,
  hasPrivateSectorJobApi,
  JobProviderError,
  type JobProvider,
  type JobSearchQuery,
  type ProviderJob,
} from "@/services/jobs/job-provider"
import {
  matchesJobSearch,
  matchesPostedWithin,
  pakistanSearchCity,
  resolveJobSearchLocation,
  resolvePostedWithin,
  sortJobsByPostedDate,
} from "@/services/jobs/normalize-job"
import {
  listAccessibleJobs,
  upsertJobBySource,
  type CreateJobInput,
} from "@/services/job-service"
import type { Job } from "@/types/job"

export type SearchAndStoreResult = {
  jobs: Job[]
  provider: string
  fetched: number
  warning?: string
}

function enrichListing(listing: ProviderJob): CreateJobInput {
  const fromDescription = extractJobSkills(listing.description)
  const fromTags = listing.requiredSkills.length
    ? extractSkills(listing.requiredSkills.join(" "))
    : []
  const requiredSkills = uniqueSkillNames([
    ...fromDescription.requiredSkills,
    ...fromTags.map((skill) => skill.name),
  ])
  const preferredSkills = uniqueSkillNames(fromDescription.preferredSkills).filter(
    (skill) => !requiredSkills.some((required) => required.toLowerCase() === skill.toLowerCase())
  )

  return {
    title: listing.title,
    company: listing.company,
    location: listing.location,
    description: listing.description,
    requiredSkills,
    preferredSkills,
    employmentType: listing.employmentType,
    source: listing.source,
    sourceUrl: listing.sourceUrl,
    postedDate: listing.postedDate,
    createdBy: null,
  }
}

function matchesStoredJob(job: Job, query: JobSearchQuery): boolean {
  return matchesJobSearch(job, query)
}

export async function searchStoredJobs(
  query: JobSearchQuery,
  userId?: string,
  list: typeof listAccessibleJobs = listAccessibleJobs
): Promise<Job[]> {
  const jobs = await list(userId ?? "000000000000000000000000")
  const resolvedQuery: JobSearchQuery = {
    ...query,
    location: resolveJobSearchLocation(query.location),
    postedWithin: resolvePostedWithin(query.postedWithin),
  }
  return sortJobsByPostedDate(jobs.filter((job) => matchesStoredJob(job, resolvedQuery))).slice(0, 40)
}

export async function searchAndStoreJobs(
  query: JobSearchQuery,
  provider: JobProvider = createJobProvider(),
  save: typeof upsertJobBySource = upsertJobBySource,
  loadStored: typeof searchStoredJobs = searchStoredJobs
): Promise<SearchAndStoreResult> {
  const resolvedQuery: JobSearchQuery = {
    ...query,
    location: resolveJobSearchLocation(query.location),
    postedWithin: resolvePostedWithin(query.postedWithin),
  }

  try {
    let listings = await provider.search(resolvedQuery)
    let locationRelaxed = false
    if (
      listings.length === 0 &&
      pakistanSearchCity(resolvedQuery.location) &&
      resolvedQuery.keyword?.trim()
    ) {
      listings = await provider.search({ ...resolvedQuery, location: "Pakistan" })
      locationRelaxed = listings.length > 0
    }
    const jobs = (
      await Promise.all(
        listings.map(async (listing) => {
          try {
            return await save(enrichListing(listing))
          } catch (error) {
            console.error("Failed to save job listing", {
              source: listing.source,
              sourceUrl: listing.sourceUrl,
              error: error instanceof Error ? error.message : "unknown",
            })
            return null
          }
        })
      )
    )
      .filter((job): job is Job => Boolean(job))

    const dated = sortJobsByPostedDate(
      jobs.filter((job) => matchesPostedWithin(job.postedDate, resolvedQuery.postedWithin))
    )
    const warnings: string[] = []
    if (locationRelaxed) {
      warnings.push("No matching jobs in that city. Showing Pakistan-wide results for this keyword.")
    }
    if (Boolean(resolvedQuery.keyword?.trim()) && dated.length < 8 && !hasPrivateSectorJobApi()) {
      warnings.push(
        "These listings come from Pakistan job boards, not Indeed. For more private-sector jobs, add a free Jooble API key from pk.jooble.org/api/about as JOOBLE_API_KEY in .env.local, then restart the app."
      )
    }

    return {
      jobs: dated,
      provider: provider.id,
      fetched: listings.length,
      warning: warnings.length > 0 ? warnings.join(" ") : undefined,
    }
  } catch (error) {
    const stored = await loadStored(resolvedQuery).catch(() => [] as Job[])
    if (stored.length > 0) {
      return {
        jobs: stored,
        provider: "saved",
        fetched: stored.length,
        warning: "Live job listings are temporarily unavailable. Showing saved jobs.",
      }
    }
    if (
      error instanceof JobProviderError &&
      (error.code === "RATE_LIMITED" || error.code === "PROVIDER_UNAVAILABLE")
    ) {
      return {
        jobs: [],
        provider: "jobdata",
        fetched: 0,
        warning: "Live listings are busy right now. Wait a few seconds and search again.",
      }
    }
    throw error
  }
}

export { JobProviderError }
