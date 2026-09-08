import type { ExtractedSkill } from "@/types/resume"

export const ATS_WEIGHTS = {
  contact: 0.1,
  sections: 0.2,
  keywords: 0.25,
  readability: 0.15,
  experience: 0.15,
  completeness: 0.15,
} as const

export type AtsCategoryKey = keyof typeof ATS_WEIGHTS

export type AtsBreakdown = Record<AtsCategoryKey, number>

export type AtsOverallStatus = "strong" | "good" | "needs-work" | "poor"

export type AtsAnalyzerInput = {
  text: string
  skills?: Array<string | Pick<ExtractedSkill, "name" | "category">>
}

export type AtsAnalyzerResult = {
  score: number
  overallStatus: AtsOverallStatus
  breakdown: AtsBreakdown
  issues: string[]
  suggestions: string[]
  strengths: string[]
}

const SECTION_HEADINGS: Array<{
  key: keyof AtsSectionPresence
  label: string
  pattern: RegExp
}> = [
  {
    key: "summary",
    label: "Summary",
    pattern: /^(professional\s+)?(summary|profile|objective|about(\s+me)?)\b/i,
  },
  {
    key: "experience",
    label: "Experience",
    pattern: /^(work(\s+experience|\s+history)?|experience|employment|professional\s+experience|career(\s+history)?)\b/i,
  },
  {
    key: "education",
    label: "Education",
    pattern: /^(education|academic(\s+background)?|qualifications)\b/i,
  },
  {
    key: "skills",
    label: "Skills",
    pattern: /^(skills|technical\s+skills|core\s+competenc(y|ies)|technologies)\b/i,
  },
  {
    key: "projects",
    label: "Projects",
    pattern: /^(projects|selected\s+projects|personal\s+projects|portfolio)\b/i,
  },
  {
    key: "certifications",
    label: "Certifications",
    pattern: /^(certifications?|certificates|licenses|licences)\b/i,
  },
]

type AtsSectionPresence = {
  summary: boolean
  experience: boolean
  education: boolean
  skills: boolean
  projects: boolean
  certifications: boolean
}

const ACTION_VERBS = [
  "achieved",
  "analyzed",
  "architected",
  "automated",
  "built",
  "collaborated",
  "coordinated",
  "created",
  "delivered",
  "deployed",
  "designed",
  "developed",
  "drove",
  "engineered",
  "established",
  "improved",
  "increased",
  "implemented",
  "launched",
  "led",
  "managed",
  "mentored",
  "migrated",
  "optimized",
  "owned",
  "reduced",
  "scaled",
  "shipped",
]

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
const LINKEDIN_PATTERN = /linkedin\.com\/(?:in|pub|company)\//i
const GITHUB_PATTERN = /github\.com\//i
const PORTFOLIO_HOST_PATTERN =
  /gitlab\.com|bitbucket\.org|behance\.net|dribbble\.com|portfolio|vercel\.app|netlify\.app|pages\.dev/i
const URL_PATTERN = /https?:\/\/[^\s)\]>]+/gi
const BULLET_PATTERN = /^\s*(?:[-*•●▪‣–—]|\d+[.)])\s+\S/gm
const METRIC_PATTERN =
  /\b\d+(?:\.\d+)?%|\b(?:usd|pkr|\$|€|£)\s?\d|\b\d{1,3}(?:,\d{3})+\b|\b\d+\+?\s*(?:users|customers|clients|people|members|engineers|years|months|apps|projects|tickets)\b/i

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function atsOverallStatus(score: number): AtsOverallStatus {
  if (score >= 80) return "strong"
  if (score >= 65) return "good"
  if (score >= 45) return "needs-work"
  return "poor"
}

export function atsScoreBand(score: number): "good" | "warning" | "poor" {
  if (score >= 80) return "good"
  if (score >= 60) return "warning"
  return "poor"
}

function skillEntries(
  skills: AtsAnalyzerInput["skills"]
): Array<{ name: string; category?: string }> {
  if (!skills?.length) return []
  return skills
    .map((skill) =>
      typeof skill === "string" ? { name: skill.trim() } : { name: skill.name.trim(), category: skill.category }
    )
    .filter((skill) => skill.name.length > 0)
}

function splitLines(text: string): string[] {
  return text.split(/\r?\n/).map((line) => line.trim())
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

function digitCount(value: string): number {
  return (value.match(/\d/g) ?? []).length
}

function detectName(text: string): boolean {
  const headingLabels = new Set(SECTION_HEADINGS.map((section) => section.label.toLowerCase()))
  const lines = splitLines(text).filter(Boolean).slice(0, 8)

  for (const line of lines) {
    if (line.includes("@") || /https?:\/\//i.test(line) || digitCount(line) > 0) continue
    if (line.length > 60) continue
    const normalized = line.replace(/[,|]/g, " ").replace(/\s+/g, " ").trim()
    if (headingLabels.has(normalized.toLowerCase())) continue
    const words = normalized.split(" ")
    if (words.length < 2 || words.length > 5) continue
    const looksLikeName = words.every(
      (word) => /^[A-Z][a-zA-Z'-]+$/.test(word) || /^[A-Z]\.$/.test(word)
    )
    if (looksLikeName) return true
  }

  return false
}

function detectPhone(text: string): boolean {
  const matches = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/g) ?? []
  return matches.some((match) => digitCount(match) >= 10 && digitCount(match) <= 15)
}

function detectPortfolio(text: string): boolean {
  if (GITHUB_PATTERN.test(text) || PORTFOLIO_HOST_PATTERN.test(text)) return true
  const urls = text.match(URL_PATTERN) ?? []
  return urls.some((url) => !/linkedin\.com|mailto:/i.test(url))
}

function detectSections(text: string): AtsSectionPresence {
  const presence: AtsSectionPresence = {
    summary: false,
    experience: false,
    education: false,
    skills: false,
    projects: false,
    certifications: false,
  }

  for (const line of splitLines(text)) {
    if (!line || line.length > 48) continue
    const heading = line.replace(/[:\-–—|]+$/g, "").replace(/^#+\s*/, "").trim()
    for (const section of SECTION_HEADINGS) {
      if (section.pattern.test(heading)) {
        presence[section.key] = true
      }
    }
  }

  return presence
}

function alphanumericRatio(text: string): number {
  if (!text) return 0
  const alphanumeric = (text.match(/[A-Za-z0-9]/g) ?? []).length
  return alphanumeric / text.length
}

function scoreContact(text: string): { score: number; found: Record<string, boolean> } {
  const found = {
    name: detectName(text),
    email: EMAIL_PATTERN.test(text),
    phone: detectPhone(text),
    linkedin: LINKEDIN_PATTERN.test(text),
    githubOrPortfolio: detectPortfolio(text),
  }

  const score =
    (found.name ? 15 : 0) +
    (found.email ? 25 : 0) +
    (found.phone ? 20 : 0) +
    (found.linkedin ? 20 : 0) +
    (found.githubOrPortfolio ? 20 : 0)

  return { score: clampScore(score), found }
}

function scoreSections(presence: AtsSectionPresence): { score: number; missing: string[] } {
  const missing = SECTION_HEADINGS.filter((section) => !presence[section.key]).map(
    (section) => section.label
  )
  const presentCount = SECTION_HEADINGS.length - missing.length
  return {
    score: clampScore((presentCount / SECTION_HEADINGS.length) * 100),
    missing,
  }
}

function scoreKeywords(skills: Array<{ name: string; category?: string }>): {
  score: number
  skillCount: number
  categoryCount: number
} {
  const skillCount = skills.length
  const categoryCount = new Set(skills.map((skill) => skill.category).filter(Boolean)).size

  let score = 10
  if (skillCount >= 15) score = 100
  else if (skillCount >= 10) score = 90
  else if (skillCount >= 6) score = 75
  else if (skillCount >= 3) score = 55
  else if (skillCount >= 1) score = 35

  if (categoryCount >= 3) score = Math.min(100, score + 5)

  return { score: clampScore(score), skillCount, categoryCount }
}

function scoreReadability(text: string): { score: number; flags: string[] } {
  const flags: string[] = []
  let score = 100
  const words = wordCount(text)
  const replacementChars = (text.match(/\uFFFD|�/g) ?? []).length
  const newlineCount = (text.match(/\n/g) ?? []).length
  const denseSpaces = (text.match(/ {4,}/g) ?? []).length
  const ratio = alphanumericRatio(text)

  if (text.trim().length < 200) {
    score -= 50
    flags.push("very-short")
  } else if (text.trim().length < 400) {
    score -= 20
    flags.push("short")
  }

  if (words < 80) {
    score -= 20
    flags.push("few-words")
  }

  if (replacementChars > 0) {
    score -= Math.min(30, 15 + replacementChars * 2)
    flags.push("garbled")
  }

  if (ratio < 0.45) {
    score -= 25
    flags.push("low-alphanumeric")
  }

  if (words > 120 && newlineCount < 4) {
    score -= 15
    flags.push("few-line-breaks")
  }

  if (denseSpaces >= 8) {
    score -= 10
    flags.push("table-like-spacing")
  }

  return { score: clampScore(score), flags }
}

function scoreExperience(text: string, hasExperienceSection: boolean): {
  score: number
  bullets: number
  actionVerbs: number
  metrics: number
} {
  const bullets = text.match(BULLET_PATTERN)?.length ?? 0
  const lower = text.toLowerCase()
  const actionVerbs = ACTION_VERBS.filter((verb) => new RegExp(`\\b${verb}\\b`, "i").test(lower)).length
  const metrics = text.match(new RegExp(METRIC_PATTERN.source, "gi"))?.length ?? 0

  let score = 0
  if (hasExperienceSection) score += 20
  score += Math.min(30, bullets * 6)
  score += Math.min(25, actionVerbs * 5)
  score += Math.min(25, metrics * 8)
  if (!hasExperienceSection && bullets === 0) {
    score = Math.min(score, 20)
  }

  return {
    score: clampScore(score),
    bullets,
    actionVerbs,
    metrics,
  }
}

function scoreCompleteness(options: {
  text: string
  contact: ReturnType<typeof scoreContact>["found"]
  sections: AtsSectionPresence
  skillCount: number
}): number {
  const words = wordCount(options.text)
  let score = 0

  if (options.contact.email && (options.contact.phone || options.contact.linkedin)) score += 20
  else if (options.contact.email || options.contact.phone) score += 10

  if (options.sections.experience) score += 20
  if (options.sections.education) score += 15
  if (options.sections.skills || options.skillCount > 0) score += 15
  if (options.sections.projects || options.sections.certifications) score += 10

  if (words >= 250 && words <= 900) score += 20
  else if (words >= 150 && words < 250) score += 10
  else if (words > 900 && words < 1500) score += 12
  else if (words >= 1500) score += 6

  return clampScore(score)
}

function weightedScore(breakdown: AtsBreakdown): number {
  return clampScore(
    breakdown.contact * ATS_WEIGHTS.contact +
      breakdown.sections * ATS_WEIGHTS.sections +
      breakdown.keywords * ATS_WEIGHTS.keywords +
      breakdown.readability * ATS_WEIGHTS.readability +
      breakdown.experience * ATS_WEIGHTS.experience +
      breakdown.completeness * ATS_WEIGHTS.completeness
  )
}

/**
 * Rule-based ATS-oriented parser, readability, and optimization analysis.
 * This does not simulate every commercial applicant tracking system.
 */
export function analyzeResumeForAts(input: AtsAnalyzerInput): AtsAnalyzerResult {
  const text = input.text ?? ""
  const skills = skillEntries(input.skills)
  const issues: string[] = []
  const suggestions: string[] = []
  const strengths: string[] = []

  const contact = scoreContact(text)
  const sections = detectSections(text)
  const sectionScore = scoreSections(sections)
  const keywords = scoreKeywords(skills)
  const readability = scoreReadability(text)
  const experience = scoreExperience(text, sections.experience)
  const completeness = scoreCompleteness({
    text,
    contact: contact.found,
    sections,
    skillCount: keywords.skillCount,
  })

  const breakdown: AtsBreakdown = {
    contact: contact.score,
    sections: sectionScore.score,
    keywords: keywords.score,
    readability: readability.score,
    experience: experience.score,
    completeness,
  }

  const score = weightedScore(breakdown)

  if (!contact.found.name) {
    issues.push("A clear candidate name was not detected near the top of the resume.")
    suggestions.push("Put your full name on the first line in plain text, not inside an image or header graphic.")
  } else {
    strengths.push("A candidate name is readable in the extracted text.")
  }

  if (!contact.found.email) {
    issues.push("No email address was found in the extracted text.")
    suggestions.push("Add a plain-text email address in the contact section so ATS parsers can store it.")
  }
  if (!contact.found.phone) {
    issues.push("No phone number was found.")
    suggestions.push("Include a phone number with country code in plain text, for example +1 555 555 0123.")
  }
  if (!contact.found.linkedin) {
    suggestions.push("Add a LinkedIn URL so recruiters and parsers can match your profile.")
  }
  if (!contact.found.githubOrPortfolio) {
    suggestions.push("Add a GitHub or portfolio URL if you have one; many ATS tools store it as a contact field.")
  }
  if (contact.score >= 80) {
    strengths.push("Contact details are present and ATS-readable.")
  }

  if (sectionScore.missing.length > 0) {
    issues.push(`Missing or unlabeled sections: ${sectionScore.missing.join(", ")}.`)
    suggestions.push(
      "Use standard headings such as Summary, Experience, Education, Skills, Projects, and Certifications on their own lines."
    )
  } else {
    strengths.push("Standard resume sections are labeled in a parser-friendly way.")
  }

  if (keywords.skillCount < 3) {
    issues.push("Few recognizable skills were extracted from the resume.")
    suggestions.push("List concrete tools and skills in a dedicated Skills section using common industry names.")
  } else if (keywords.skillCount >= 8) {
    strengths.push("Skill coverage is strong enough for keyword matching.")
  }

  if (readability.flags.includes("very-short") || readability.flags.includes("few-words")) {
    issues.push(
      "Very little text was extracted. Image-based, multi-column, or heavily designed PDFs often fail ATS parsing."
    )
    suggestions.push("Export a single-column, text-based PDF or DOCX and avoid putting key facts only in images.")
  }
  if (readability.flags.includes("garbled") || readability.flags.includes("low-alphanumeric")) {
    issues.push("Extracted text contains unusual or garbled characters, which is a common ATS parsing risk.")
    suggestions.push("Remove text boxes, icons used as bullets, and decorative fonts, then re-export the file.")
  }
  if (readability.flags.includes("few-line-breaks") || readability.flags.includes("table-like-spacing")) {
    issues.push("The layout looks compressed or table-like, which many ATS parsers read out of order.")
    suggestions.push("Avoid tables and text columns. Use simple headings and bullet lists instead.")
  }
  if (readability.score >= 80) {
    strengths.push("Extracted text looks clean enough for typical ATS parsing.")
  }

  if (experience.bullets < 3) {
    issues.push("Experience bullets are limited or missing.")
    suggestions.push("Describe work history as short bullet points that start with action verbs.")
  }
  if (experience.actionVerbs < 3) {
    suggestions.push("Start bullets with action verbs such as built, led, implemented, or improved.")
  }
  if (experience.metrics < 1) {
    suggestions.push("Add measurable results (percentages, counts, or time saved) to experience bullets.")
  }
  if (experience.score >= 80) {
    strengths.push("Experience bullets use action-oriented, scannable phrasing.")
  }

  const words = wordCount(text)
  if (words < 150) {
    issues.push("The resume is too short to look complete to most ATS workflows.")
    suggestions.push("Aim for about one page of substance: summary, 2+ roles, skills, and education.")
  } else if (words > 1500) {
    issues.push("The resume is very long, which can hurt both ATS ranking and recruiter review.")
    suggestions.push("Keep the resume focused, typically one to two pages of relevant content.")
  }
  if (completeness >= 80) {
    strengths.push("Core resume content looks complete.")
  }

  if (score >= 80) {
    strengths.unshift("Overall ATS-oriented score is in a strong range for parser and keyword checks.")
  }

  return {
    score,
    overallStatus: atsOverallStatus(score),
    breakdown,
    issues: Array.from(new Set(issues)),
    suggestions: Array.from(new Set(suggestions)),
    strengths: Array.from(new Set(strengths)),
  }
}
