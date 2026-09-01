import { NextResponse } from "next/server"
import { isDatabaseUnavailable } from "@/lib/mongodb"
import { matchOwnedResumeToJob, MatchingError } from "@/services/matching/run-match"
import { getMatchByResumeAndJob } from "@/services/match-service"
import { getOwnedResume } from "@/services/resume-service"
import { getAccessibleJob } from "@/services/job-service"
import { compareSkills } from "@/services/matching/compare-skills"
import type { Job } from "@/types/job"
import type { Resume } from "@/types/resume"

type ApiUser = {
  id: string
}

type MatchingHttpDependencies = {
  matchOwnedResumeToJob?: typeof matchOwnedResumeToJob
  getMatchByResumeAndJob?: typeof getMatchByResumeAndJob
  getOwnedResume?: (id: string, userId: string) => Promise<Resume | null>
  getOwnedJob?: (id: string, userId: string) => Promise<Job | null>
}

export async function handleCreateMatchRequest(
  user: ApiUser | null,
  input: { resumeId?: string; jobId?: string },
  deps: MatchingHttpDependencies = {}
) {
  if (!user) {
    return NextResponse.json({ error: "You must be signed in to check a match." }, { status: 401 })
  }

  const resumeId = input.resumeId?.trim() ?? ""
  const jobId = input.jobId?.trim() ?? ""
  if (!resumeId || !jobId) {
    return NextResponse.json(
      { error: "Resume and job are required." },
      { status: 400 }
    )
  }

  try {
    const run = deps.matchOwnedResumeToJob ?? matchOwnedResumeToJob
    const result = await run(user.id, resumeId, jobId)
    return NextResponse.json({
      match: result.match,
      overallScore: result.comparison.overallScore,
      skillScore: result.comparison.skillScore,
      semanticScore: result.comparison.semanticScore,
      semanticAvailable: result.semanticAvailable,
      matchedSkills: result.comparison.matchedSkills,
      missingSkills: result.comparison.missingSkills,
      preferredMatchedSkills: result.comparison.preferredMatchedSkills,
      preferredMissingSkills: result.comparison.preferredMissingSkills,
      resume: result.resume,
      job: result.job,
    })
  } catch (error) {
    return matchingErrorResponse(user.id, error)
  }
}

export async function handleGetMatchRequest(
  user: ApiUser | null,
  resumeId: string,
  jobId: string,
  deps: MatchingHttpDependencies = {}
) {
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
  }

  try {
    const loadResume = deps.getOwnedResume ?? getOwnedResume
    const loadJob = deps.getOwnedJob ?? getAccessibleJob
    const loadMatch = deps.getMatchByResumeAndJob ?? getMatchByResumeAndJob

    const resume = await loadResume(resumeId, user.id)
    if (!resume) {
      return NextResponse.json({ error: "Resume not found." }, { status: 404 })
    }

    const job = await loadJob(jobId, user.id)
    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 })
    }

    const match = await loadMatch(user.id, resumeId, jobId)
    if (!match) {
      return NextResponse.json({ error: "Match not found." }, { status: 404 })
    }

    const preferred = compareSkills(resume.skills, job.requiredSkills, job.preferredSkills)

    return NextResponse.json({
      match,
      overallScore: match.overallScore,
      skillScore: match.skillScore,
      semanticScore: match.semanticScore ?? 0,
      semanticAvailable: (match.semanticScore ?? 0) > 0 || match.overallScore !== match.skillScore,
      matchedSkills: match.matchedSkills,
      missingSkills: match.missingSkills,
      preferredMatchedSkills: preferred.preferredMatchedSkills,
      preferredMissingSkills: preferred.preferredMissingSkills,
      resume: {
        id: resume.id,
        fileName: resume.fileName,
        analysisStatus: resume.analysisStatus,
      },
      job: {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        requiredSkills: job.requiredSkills,
        preferredSkills: job.preferredSkills,
      },
    })
  } catch (error) {
    return matchingErrorResponse(user.id, error)
  }
}

function matchingErrorResponse(userId: string, error: unknown) {
  if (error instanceof MatchingError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
  }

  if (isDatabaseUnavailable(error)) {
    return NextResponse.json(
      { error: "Cannot complete matching because the database is unavailable." },
      { status: 503 }
    )
  }

  console.error("Matching failed", {
    userId,
    error: error instanceof Error ? error.message : "unknown",
  })
  return NextResponse.json({ error: "Unable to check match. Please try again." }, { status: 500 })
}
