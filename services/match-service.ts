import { isValidObjectId } from "mongoose"
import { dbConnect } from "@/lib/mongodb"
import { toStringId } from "@/lib/serialize"
import { Match, type MatchDocument } from "@/models/match"
import type { Match as MatchDTO } from "@/types/matching"

export type CreateMatchInput = {
  userId: string
  resumeId: string
  jobId: string
  overallScore: number
  skillScore: number
  experienceScore: number
  matchedSkills?: string[]
  missingSkills?: string[]
}

function toMatchDTO(match: MatchDocument): MatchDTO {
  return {
    id: toStringId(match._id),
    userId: toStringId(match.userId),
    resumeId: toStringId(match.resumeId),
    jobId: toStringId(match.jobId),
    overallScore: match.overallScore,
    skillScore: match.skillScore,
    experienceScore: match.experienceScore,
    matchedSkills: match.matchedSkills ?? [],
    missingSkills: match.missingSkills ?? [],
    createdAt: match.createdAt,
  }
}

export async function upsertMatch(input: CreateMatchInput): Promise<MatchDTO> {
  await dbConnect()
  const match = await Match.findOneAndUpdate(
    { userId: input.userId, jobId: input.jobId },
    {
      userId: input.userId,
      resumeId: input.resumeId,
      jobId: input.jobId,
      overallScore: input.overallScore,
      skillScore: input.skillScore,
      experienceScore: input.experienceScore,
      matchedSkills: input.matchedSkills ?? [],
      missingSkills: input.missingSkills ?? [],
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )

  if (!match) {
    throw new Error("Unable to save match result.")
  }

  return toMatchDTO(match)
}

export async function getMatchById(id: string): Promise<MatchDTO | null> {
  if (!isValidObjectId(id)) return null
  await dbConnect()
  const match = await Match.findById(id)
  return match ? toMatchDTO(match) : null
}

export async function getMatchByResumeAndJob(
  userId: string,
  resumeId: string,
  jobId: string
): Promise<MatchDTO | null> {
  if (!isValidObjectId(resumeId) || !isValidObjectId(jobId)) return null
  await dbConnect()
  const match = await Match.findOne({ userId, resumeId, jobId })
  return match ? toMatchDTO(match) : null
}

export async function listMatchesByUser(userId: string): Promise<MatchDTO[]> {
  await dbConnect()
  const matches = await Match.find({ userId }).sort({ overallScore: -1 })
  return matches.map(toMatchDTO)
}

export async function getMatchByUserAndJob(
  userId: string,
  jobId: string
): Promise<MatchDTO | null> {
  await dbConnect()
  const match = await Match.findOne({ userId, jobId })
  return match ? toMatchDTO(match) : null
}

export async function deleteMatch(id: string): Promise<boolean> {
  await dbConnect()
  const result = await Match.findByIdAndDelete(id)
  return Boolean(result)
}
