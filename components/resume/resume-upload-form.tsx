"use client"

import { useCallback, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2, FileUp, Loader2, Upload, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn, formatFileSize } from "@/lib/utils"
import { validateResumeFile } from "@/lib/validations"

type UploadedResume = {
  id: string
  fileName: string
  fileType: string
  analysisStatus: string
  createdAt: string
}

export function ResumeUploadForm() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploaded, setUploaded] = useState<UploadedResume | null>(null)

  const applyFile = useCallback((nextFile: File | null) => {
    setError(null)
    setUploaded(null)
    setProgress(0)
    if (!nextFile) {
      setFile(null)
      return
    }
    const result = validateResumeFile(nextFile)
    if (!result.isValid) {
      setFile(null)
      setError(result.errors[0] ?? "Invalid file.")
      return
    }
    setFile(nextFile)
  }, [])

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    applyFile(event.dataTransfer.files[0] ?? null)
  }

  async function handleUpload() {
    if (!file) return
    setIsUploading(true)
    setError(null)
    setProgress(8)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const resume = await new Promise<UploadedResume>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open("POST", "/api/resumes/upload")
        xhr.responseType = "json"
        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return
          setProgress(Math.min(80, Math.round((event.loaded / event.total) * 80)))
        }
        xhr.onload = () => {
          const body = xhr.response as { error?: string; resume?: UploadedResume } | null
          if (xhr.status >= 200 && xhr.status < 300 && body?.resume) {
            resolve(body.resume)
            return
          }
          reject(new Error(body?.error ?? "Unable to upload resume."))
        }
        xhr.onerror = () => reject(new Error("Unable to upload resume. Please try again."))
        xhr.send(formData)
      })

      setProgress(100)
      setUploaded(resume)
      setFile(null)
      if (inputRef.current) inputRef.current.value = ""
      router.refresh()
    } catch (uploadError) {
      setProgress(0)
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload resume.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Upload failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {uploaded && (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle>Resume uploaded</AlertTitle>
          <AlertDescription>
            <span className="block">
              {uploaded.fileName} ({uploaded.fileType.toUpperCase()}) was saved.
              {uploaded.analysisStatus === "completed"
                ? " Text extraction, skill detection, and ATS analysis finished automatically."
                : ` Analysis status: ${uploaded.analysisStatus}.`}
            </span>
            <Button asChild variant="link" className="h-auto px-0">
              <Link href={`/resume/${uploaded.id}`}>View ATS score and extracted text</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 bg-muted/20"
        )}
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Upload className="h-7 w-7 text-primary" aria-hidden="true" />
        </div>
        <p className="text-base font-medium">Drop your resume here</p>
        <p className="mt-1 text-sm text-muted-foreground">PDF or DOCX, up to 5MB</p>
        <input
          ref={inputRef}
          id="resume-file"
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          onChange={(event) => applyFile(event.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          <FileUp className="h-4 w-4" />
          Browse file
        </Button>
      </div>

      {file && (
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => applyFile(null)}
                disabled={isUploading}
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
                Remove
              </Button>
              <Button type="button" size="sm" onClick={handleUpload} disabled={isUploading}>
                {isUploading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {isUploading ? "Uploading..." : "Upload resume"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isUploading && (
        <div className="space-y-2">
          <Progress value={progress} aria-label="Upload progress" />
          <p className="text-sm text-muted-foreground">
            {progress < 80
              ? "Uploading file..."
              : "Extracting text, detecting skills, and running ATS analysis..."}
          </p>
        </div>
      )}
    </div>
  )
}
