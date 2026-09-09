import { isValidObjectId } from "mongoose"
import { getOwnedResume } from "@/services/resume-service"
import { getAccessibleJob } from "@/services/job-service"
import { getMatchByResumeAndJob } from "@/services/match-service"
import { MatchingError } from "@/services/matching/run-match"
import { buildCareerRoadmap } from "@/services/career-roadmap/build-roadmap"
import type { CareerRoadmapResult } from "@/types/career-roadmap"

type CareerRoadmapDependencies = {
  getOwnedResume: typeof getOwnedResume
  getAccessibleJob: typeof getAccessibleJob
  getMatchByResumeAndJob: typeof getMatchByResumeAndJob
}

const defaultDependencies: CareerRoadmapDependencies = {
  getOwnedResume,
  getAccessibleJob,
  getMatchByResumeAndJob,
}

export async function generateCareerRoadmap(
  userId: string,
  resumeId: string,
  jobId: string,
  deps: CareerRoadmapDependencies = defaultDependencies
): Promise<CareerRoadmapResult> {
  if (!isValidObjectId(resumeId) || !isValidObjectId(jobId)) {
    throw new MatchingError("A valid resume and job are required.", 400, "INVALID_IDS")
  }

  const resume = await deps.getOwnedResume(resumeId, userId)
  if (!resume) {
    throw new MatchingError("Resume not found.", 404, "RESUME_NOT_FOUND")
  }

  const job = await deps.getAccessibleJob(jobId, userId)
  if (!job) {
    throw new MatchingError("Job not found.", 404, "JOB_NOT_FOUND")
  }

  if (!resume.skills.length) {
    throw new MatchingError(
      "This resume has no extracted skills. Analyze the resume first.",
      400,
      "RESUME_NOT_ANALYZED"
    )
  }

  const existingMatch = await deps.getMatchByResumeAndJob(userId, resume.id, job.id)
  return buildCareerRoadmap({
    resume,
    job,
    matchScore: existingMatch?.overallScore ?? null,
  })
}
