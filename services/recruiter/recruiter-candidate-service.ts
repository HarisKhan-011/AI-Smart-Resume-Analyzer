import { isValidObjectId } from "mongoose"
import { dbConnect } from "@/lib/mongodb"
import { toStringId } from "@/lib/serialize"
import { Application } from "@/models/application"
import { calculateMatch } from "@/services/matching/match-service"
import { getMatchByUserAndJob } from "@/services/match-service"
import { getResumeById, listResumesByUser } from "@/services/resume-service"
import { getUserById } from "@/services/user-service"
import { getOwnedPostedJob, listRecruiterJobs, RecruiterError } from "@/services/recruiter/recruiter-job-service"
import type { ApplicationStatus } from "@/types/application"
import type { Job } from "@/types/job"

const APPLICANT_STATUSES: ApplicationStatus[] = ["applied", "interview", "offered", "rejected"]

export type RecruiterApplicant = {
  applicationId: string
  candidateId: string
  candidateName: string
  resumeId: string | null
  resumeFileName: string | null
  jobId: string
  jobTitle: string
  status: ApplicationStatus
  matchScore: number
  matchedSkills: string[]
  missingSkills: string[]
  appliedAt: Date | null
}

export type RecruiterCandidateDetail = {
  id: string
  name: string
  email: string
  resumeFileName: string | null
  resumeSummary: string
  skills: string[]
  applications: RecruiterApplicant[]
}

function isApplicantStatus(status: ApplicationStatus): boolean {
  return APPLICANT_STATUSES.includes(status)
}

async function latestAnalyzedResume(userId: string) {
  const resumes = await listResumesByUser(userId)
  const analyzed = resumes.find((resume) => resume.skills.length > 0) ?? resumes[0] ?? null
  if (!analyzed) return null
  return getResumeById(analyzed.id)
}

async function scoreApplicant(userId: string, job: Job, resumeSkills: string[]) {
  const existing = await getMatchByUserAndJob(userId, job.id)
  if (existing) {
    return {
      matchScore: existing.overallScore,
      matchedSkills: existing.matchedSkills,
      missingSkills: existing.missingSkills,
    }
  }

  if (!resumeSkills.length || !job.requiredSkills.length) {
    return {
      matchScore: 0,
      matchedSkills: [] as string[],
      missingSkills: job.requiredSkills,
    }
  }

  const comparison = calculateMatch({
    resumeSkills,
    requiredSkills: job.requiredSkills,
    preferredSkills: job.preferredSkills,
  })

  return {
    matchScore: comparison.overallScore,
    matchedSkills: comparison.matchedSkills,
    missingSkills: comparison.missingSkills,
  }
}

export async function listRecruiterApplicants(
  recruiterId: string,
  jobId?: string
): Promise<RecruiterApplicant[]> {
  const jobs = jobId
    ? [await getOwnedPostedJob(jobId, recruiterId)].filter((job): job is Job => Boolean(job))
    : await listRecruiterJobs(recruiterId)

  if (jobId && jobs.length === 0) {
    throw new RecruiterError("Job not found.", 404, "NOT_FOUND")
  }
  if (jobs.length === 0) return []

  const jobById = new Map(jobs.map((job) => [job.id, job]))
  await dbConnect()
  const applications = await Application.find({
    jobId: { $in: jobs.map((job) => job.id) },
    status: { $in: APPLICANT_STATUSES },
  }).sort({ updatedAt: -1 })

  const applicants: RecruiterApplicant[] = []
  for (const application of applications) {
    const job = jobById.get(toStringId(application.jobId))
    if (!job) continue
    const candidate = await getUserById(toStringId(application.userId))
    if (!candidate || candidate.role !== "candidate") continue

    const resume = await latestAnalyzedResume(candidate.id)
    const score = await scoreApplicant(candidate.id, job, resume?.skills ?? [])

    applicants.push({
      applicationId: toStringId(application._id),
      candidateId: candidate.id,
      candidateName: candidate.name,
      resumeId: resume?.id ?? null,
      resumeFileName: resume?.fileName ?? null,
      jobId: job.id,
      jobTitle: job.title,
      status: application.status,
      matchScore: score.matchScore,
      matchedSkills: score.matchedSkills,
      missingSkills: score.missingSkills,
      appliedAt: application.appliedAt ?? null,
    })
  }

  return applicants.sort((a, b) => b.matchScore - a.matchScore)
}

export async function getRecruiterCandidateDetail(
  recruiterId: string,
  candidateId: string
): Promise<RecruiterCandidateDetail> {
  if (!isValidObjectId(candidateId)) {
    throw new RecruiterError("Candidate not found.", 404, "NOT_FOUND")
  }

  const applications = await listRecruiterApplicants(recruiterId)
  const related = applications.filter((item) => item.candidateId === candidateId)
  if (related.length === 0) {
    throw new RecruiterError("Candidate not found.", 404, "NOT_FOUND")
  }

  const candidate = await getUserById(candidateId)
  if (!candidate) {
    throw new RecruiterError("Candidate not found.", 404, "NOT_FOUND")
  }

  const resume = await latestAnalyzedResume(candidateId)
  const summarySource = resume?.extractedText?.replace(/\s+/g, " ").trim() ?? ""

  return {
    id: candidate.id,
    name: candidate.name,
    email: candidate.email,
    resumeFileName: resume?.fileName ?? null,
    resumeSummary: summarySource
      ? summarySource.slice(0, 400) + (summarySource.length > 400 ? "…" : "")
      : "No resume summary is available for this candidate.",
    skills: resume?.skills ?? [],
    applications: related,
  }
}

export async function rankApplicantsForJob(
  recruiterId: string,
  jobId: string
): Promise<{ job: Job; rankings: Array<RecruiterApplicant & { rank: number }> }> {
  const job = await getOwnedPostedJob(jobId, recruiterId)
  if (!job) {
    throw new RecruiterError("Job not found.", 404, "NOT_FOUND")
  }

  const applicants = await listRecruiterApplicants(recruiterId, jobId)
  return {
    job,
    rankings: applicants.map((item, index) => ({ ...item, rank: index + 1 })),
  }
}

export async function recruiterDashboardStats(recruiterId: string) {
  const jobs = await listRecruiterJobs(recruiterId)
  const applicants = await listRecruiterApplicants(recruiterId)
  const uniqueCandidates = new Set(applicants.map((item) => item.candidateId))
  const topCandidates = applicants
    .filter((item, index, all) => all.findIndex((row) => row.candidateId === item.candidateId) === index)
    .slice(0, 5)

  return {
    jobs,
    activeJobs: jobs.filter((job) => job.isActive !== false).length,
    totalJobs: jobs.length,
    totalCandidates: uniqueCandidates.size,
    totalApplications: applicants.length,
    topMatch: topCandidates[0]?.matchScore ?? null,
    topCandidates,
    recentJobs: jobs.slice(0, 5),
  }
}
