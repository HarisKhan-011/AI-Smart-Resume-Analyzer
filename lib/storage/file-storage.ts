import { randomUUID } from "crypto"
import { sanitizeFileName } from "@/lib/resume/file-validation"

export interface StoredFileRef {
  key: string
  url: string
}

export interface SaveFileInput {
  buffer: Buffer
  userId: string
  fileName: string
  contentType: string
}

export interface FileStorage {
  save(input: SaveFileInput): Promise<StoredFileRef>
}

/**
 * Phase 5 stores extracted text in MongoDB only.
 * This adapter records a stable file key so S3/GCS can be added later
 * without changing resume documents.
 */
export class LocalMetadataStorage implements FileStorage {
  async save(input: SaveFileInput): Promise<StoredFileRef> {
    const safeName = sanitizeFileName(input.fileName)
    const key = `resumes/${input.userId}/${randomUUID()}/${safeName}`
    return {
      key,
      url: `local://${key}`,
    }
  }
}

export const resumeFileStorage: FileStorage = new LocalMetadataStorage()
