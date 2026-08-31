import { MIN_EXTRACTED_TEXT_LENGTH } from "@/lib/resume/file-validation"

export function cleanExtractedText(raw: string): string {
  if (!raw) return ""

  let text = raw.replace(/\u0000/g, "")
  text = text.replace(/\r\n|\r/g, "\n")
  text = text.replace(/\u000c/g, "\n")
  text = text.replace(/\u00a0/g, " ")
  text = text.replace(/\(cid:\d+\)/gi, "")
  text = text.replace(/[\uFFFD]/g, "")

  const lines = text.split("\n").map((line) =>
    line.replace(/[ \t]+/g, " ").trimEnd()
  )

  const compacted: string[] = []
  let emptyRun = 0

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      emptyRun += 1
      if (emptyRun <= 1) compacted.push("")
      continue
    }
    emptyRun = 0
    compacted.push(trimmed)
  }

  return compacted.join("\n").trim()
}

export function isExtractedTextUsable(
  text: string,
  minLength = MIN_EXTRACTED_TEXT_LENGTH
): boolean {
  const letters = text.replace(/[^A-Za-z]/g, "")
  return text.trim().length >= minLength && letters.length >= 15
}
