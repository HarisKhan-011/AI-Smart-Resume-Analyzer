import { NextResponse } from "next/server"
import { ResumeUploadError } from "@/lib/resume/file-validation"
import { isDatabaseUnavailable } from "@/lib/mongodb"
import { processResumeUpload } from "@/services/resume-upload-service"
import {
  analyzeOwnedResume,
  ResumeAnalysisError,
} from "@/services/resume-analysis-service"
import {
  getOwnedResume,
  listResumesByUser,
  type ResumeSummary,
} from "@/services/resume-service"
import type { Resume as ResumeDTO } from "@/types/resume"

type ApiUser = {
  id: string
}

type ResumeHttpDependencies = {
  getOwnedResume?: (id: string, userId: string) => Promise<ResumeDTO | null>
  listResumesByUser?: (userId: string) => Promise<ResumeSummary[]>
}

export async function handleResumeUploadRequest(
  user: ApiUser | null,
  request: Request
) {
  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to upload a resume." },
      { status: 401 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A resume file is required." }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { result } = await processResumeUpload({
      userId: user.id,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      buffer,
    })

    return NextResponse.json(
      {
        resume: {
          id: result.id,
          fileName: result.fileName,
          fileType: result.fileType,
          analysisStatus: result.analysisStatus,
          createdAt: result.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ResumeUploadError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }

    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        { error: "Cannot save the resume because the database is unavailable." },
        { status: 503 }
      )
    }

    console.error("Resume upload failed", {
      userId: user.id,
      error: error instanceof Error ? error.message : "unknown",
    })
    return NextResponse.json({ error: "Unable to upload resume. Please try again." }, { status: 500 })
  }
}

export async function handleListResumesRequest(
  user: ApiUser | null,
  deps: ResumeHttpDependencies = {}
) {
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
  }

  try {
    const list = deps.listResumesByUser ?? listResumesByUser
    const resumes = await list(user.id)
    return NextResponse.json({ resumes })
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        { error: "Cannot load resumes because the database is unavailable." },
        { status: 503 }
      )
    }

    console.error("List resumes failed", {
      userId: user.id,
      error: error instanceof Error ? error.message : "unknown",
    })
    return NextResponse.json({ error: "Unable to load resumes." }, { status: 500 })
  }
}

export async function handleGetResumeRequest(
  user: ApiUser | null,
  id: string,
  deps: ResumeHttpDependencies = {}
) {
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
  }

  try {
    const load = deps.getOwnedResume ?? getOwnedResume
    const resume = await load(id, user.id)
    if (!resume) {
      return NextResponse.json({ error: "Resume not found." }, { status: 404 })
    }

    return NextResponse.json({ resume })
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        { error: "Cannot load this resume because the database is unavailable." },
        { status: 503 }
      )
    }

    console.error("Get resume failed", {
      userId: user.id,
      error: error instanceof Error ? error.message : "unknown",
    })
    return NextResponse.json({ error: "Unable to load resume." }, { status: 500 })
  }
}

export async function handleAnalyzeResumeRequest(
  user: ApiUser | null,
  id: string,
  analyze: typeof analyzeOwnedResume = analyzeOwnedResume
) {
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 })
  }

  try {
    const result = await analyze(id, user.id)
    return NextResponse.json({
      resume: {
        id: result.resume.id,
        fileName: result.resume.fileName,
        analysisStatus: result.resume.analysisStatus,
        skills: result.resume.skills,
      },
      skills: result.skills,
      skillCount: result.skillCount,
    })
  } catch (error) {
    if (error instanceof ResumeAnalysisError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      )
    }

    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        { error: "Cannot analyze this resume because the database is unavailable." },
        { status: 503 }
      )
    }

    console.error("Resume analysis failed", {
      userId: user.id,
      error: error instanceof Error ? error.message : "unknown",
    })
    return NextResponse.json({ error: "Unable to analyze resume. Please try again." }, { status: 500 })
  }
}
