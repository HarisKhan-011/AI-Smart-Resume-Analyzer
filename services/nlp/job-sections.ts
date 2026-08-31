export type JobDescriptionSections = {
  general: string
  required: string
  preferred: string
}

const REQUIRED_HEADING =
  /^(requirements|required skills|required qualifications|must[- ]have|minimum qualifications|qualifications|what you.?ll need|essential skills|key requirements|key skills)\b/i

const PREFERRED_HEADING =
  /^(preferred|preferred skills|preferred qualifications|nice to have|nice-to-have|bonus|plus|good to have|desired|optional)\b/i

const OTHER_HEADING =
  /^(responsibilities|about the role|about us|who we are|benefits|what you.?ll do|the role|overview|job description|description)\b/i

function isHeading(line: string, pattern: RegExp): boolean {
  const heading = line.replace(/^[#*\-\d.\s]+/, "").replace(/[:\s]+$/, "").trim()
  return pattern.test(heading)
}

function isPreferredLine(line: string): boolean {
  return /\b(preferred|nice to have|nice-to-have|bonus skills?|plus|good to have)\b/i.test(line)
}

export function splitJobDescription(text: string): JobDescriptionSections {
  const buckets: Record<keyof JobDescriptionSections, string[]> = {
    general: [],
    required: [],
    preferred: [],
  }

  let mode: keyof JobDescriptionSections = "general"

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue

    if (isHeading(line, REQUIRED_HEADING)) {
      mode = "required"
      continue
    }
    if (isHeading(line, PREFERRED_HEADING)) {
      mode = "preferred"
      continue
    }
    if (isHeading(line, OTHER_HEADING)) {
      mode = "general"
      continue
    }

    if (mode === "general" && isPreferredLine(line)) {
      buckets.preferred.push(line)
      continue
    }

    buckets[mode].push(line)
  }

  return {
    general: buckets.general.join("\n"),
    required: buckets.required.join("\n"),
    preferred: buckets.preferred.join("\n"),
  }
}
