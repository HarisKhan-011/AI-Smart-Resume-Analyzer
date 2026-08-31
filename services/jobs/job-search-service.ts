import { extractJobSkills } from "@/services/nlp/job-skill-extractor"
import { extractSkills } from "@/services/nlp/skill-extractor"
import { uniqueSkillNames } from "@/services/matching/normalize-skills"
import {
  createJobProvider,
  JobProviderError,
  type JobProvider,
  type JobSearchQuery,
  type ProviderJob,
} from "@/services/jobs/job-provider"
import { upsertJobBySource, type CreateJobInput } from "@/services/job-service"
import type { Job } from "@/types/job"

export type SearchAndStoreResult = {
  jobs: Job[]
  provider: string
  fetched: number
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

export async function searchAndStoreJobs(
  query: JobSearchQuery,
  provider: JobProvider = createJobProvider(),
  save: typeof upsertJobBySource = upsertJobBySource
): Promise<SearchAndStoreResult> {
  const listings = await provider.search(query)
  const jobs: Job[] = []

  for (const listing of listings) {
    try {
      jobs.push(await save(enrichListing(listing)))
    } catch (error) {
      console.error("Failed to save job listing", {
        source: listing.source,
        sourceUrl: listing.sourceUrl,
        error: error instanceof Error ? error.message : "unknown",
      })
    }
  }

  return {
    jobs,
    provider: provider.id,
    fetched: listings.length,
  }
}

export { JobProviderError }
