import { NextResponse } from "next/server"
import { isDatabaseUnavailable } from "@/lib/mongodb"
import {
  analyzeJobDescription,
  JobAnalysisError,
  type AnalyzeJobInput,
} from "@/services/job-analysis-service"
import { getAccessibleJob, listJobsByUser } from "@/services/job-service"
import {
  JobProviderError,
  type JobSearchQuery,
} from "@/services/jobs/job-provider"
import { searchAndStoreJobs } from "@/services/jobs/job-search-service"
import { resolveJobSearchLocation, resolvePostedWithin } from "@/services/jobs/normalize-job"
import type { Job } from "@/types/job"

type ApiUser = {
  id: string
}

type JobHttpDependencies = {
  analyzeJobDescription?: typeof analyzeJobDescription
  getOwnedJob?: (id: string, userId: string) => Promise<Job | null>
  getAccessibleJob?: (id: string, userId: string) => Promise<Job | null>
  listJobsByUser?: (userId: string) => Promise<Job[]>
  searchAndStoreJobs?: typeof searchAndStoreJobs
}

export async function handleAnalyzeJobRequest(
  user: ApiUser | null,
  input: AnalyzeJobInput,
  deps: JobHttpDependencies = {}
) {
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to analyze a job." }, { status: 401 })
  }

  try {
    const analyze = deps.analyzeJobDescription ?? analyzeJobDescription
    const result = await analyze(input, user.id)
    return NextResponse.json(
      {
        job: result.job,
        requiredSkills: result.requiredSkills,
        preferredSkills: result.preferredSkills,
        detectedSkills: result.detectedSkills,
        technicalSkills: result.technicalSkills,
        toolSkills: result.toolSkills,
        alreadyExists: result.alreadyExists,
      },
      { status: result.alreadyExists ? 200 : 201 }
    )
  } catch (error) {
    if (error instanceof JobAnalysisError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      )
    }

    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        { error: "Cannot save the job because the database is unavailable." },
        { status: 503 }
      )
    }

    console.error("Job analysis failed", {
      userId: user.id,
      error: error instanceof Error ? error.message : "unknown",
    })
    return NextResponse.json({ error: "Unable to analyze job. Please try again." }, { status: 500 })
  }
}

export async function handleListJobsRequest(
  user: ApiUser | null,
  deps: JobHttpDependencies = {}
) {
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
  }

  try {
    const list = deps.listJobsByUser ?? listJobsByUser
    const jobs = await list(user.id)
    return NextResponse.json({ jobs })
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        { error: "Cannot load jobs because the database is unavailable." },
        { status: 503 }
      )
    }

    console.error("List jobs failed", {
      userId: user.id,
      error: error instanceof Error ? error.message : "unknown",
    })
    return NextResponse.json({ error: "Unable to load jobs." }, { status: 500 })
  }
}

export async function handleSearchJobsRequest(
  user: ApiUser | null,
  query: JobSearchQuery,
  deps: JobHttpDependencies = {}
) {
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to search jobs." }, { status: 401 })
  }

  try {
    const search = deps.searchAndStoreJobs ?? searchAndStoreJobs
    const result = await search({
      keyword: query.keyword?.trim().slice(0, 120),
      location: resolveJobSearchLocation(query.location).slice(0, 120),
      jobType: query.jobType?.trim().slice(0, 40),
      postedWithin: resolvePostedWithin(query.postedWithin),
    })

    return NextResponse.json({
      jobs: result.jobs,
      provider: result.provider,
      fetched: result.fetched,
      warning: result.warning ?? null,
    })
  } catch (error) {
    if (error instanceof JobProviderError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      )
    }

    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        { error: "Cannot save jobs because the database is unavailable." },
        { status: 503 }
      )
    }

    console.error("Job search failed", {
      userId: user.id,
      error: error instanceof Error ? error.message : "unknown",
    })
    return NextResponse.json({ error: "Unable to search jobs. Please try again." }, { status: 500 })
  }
}

export async function handleGetJobRequest(
  user: ApiUser | null,
  id: string,
  deps: JobHttpDependencies = {}
) {
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
  }

  try {
    const load = deps.getAccessibleJob ?? getAccessibleJob
    const job = await load(id, user.id)
    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 })
    }
    return NextResponse.json({ job })
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        { error: "Cannot load this job because the database is unavailable." },
        { status: 503 }
      )
    }

    console.error("Get job failed", {
      userId: user.id,
      error: error instanceof Error ? error.message : "unknown",
    })
    return NextResponse.json({ error: "Unable to load job." }, { status: 500 })
  }
}
