import type { CareerChatContext, ChatMessage } from "@/types/chat"
import { IRRELEVANT_CHAT_REPLY, isCareerAssistantTopic } from "@/services/chat/career-topic"

type CareerIntent =
  | "ats"
  | "improve"
  | "skills"
  | "matches"
  | "industry"
  | "applications"
  | "interview"
  | "roadmap"
  | "experience"
  | "education"
  | "overview"

function jobLabel(title: string | null | undefined, company: string | null | undefined): string {
  if (title && company) return `${title} at ${company}`
  if (title) return title
  if (company) return company
  return "a saved job"
}

function listItems(values: string[], limit = 6): string {
  const unique = [...new Set(values.filter(Boolean))].slice(0, limit)
  if (unique.length === 0) return ""
  if (unique.length === 1) return unique[0]
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`
  return `${unique.slice(0, -1).join(", ")}, and ${unique[unique.length - 1]}`
}

function missingDataBlock(context: CareerChatContext): string {
  if (context.missingDataNotes.length === 0) return ""
  return `\n\nMissing from your account: ${context.missingDataNotes.join(" ")}`
}

function atsAdvice(context: CareerChatContext): string {
  const resume = context.resume
  if (!resume) {
    return "I do not have a resume in your account yet. Upload a PDF or DOCX under My Resumes, then ask again."
  }
  if (resume.atsAnalysisStatus !== "completed" || resume.atsScore == null) {
    return `I found ${resume.fileName}, but ATS analysis has not completed. Open that resume and run analysis, then ask again.`
  }

  const lines = [
    `Your ATS-oriented score for ${resume.fileName} is ${resume.atsScore}/100. This is a rule-based parser and readability check, not a full commercial ATS simulation.`,
  ]
  if (resume.atsStrengths.length) {
    lines.push(`Strengths: ${resume.atsStrengths.slice(0, 3).join(" ")}`)
  }
  if (resume.atsIssues.length) {
    lines.push(`Issues: ${resume.atsIssues.slice(0, 3).join(" ")}`)
  }
  if (resume.atsSuggestions.length) {
    lines.push(`Next steps: ${resume.atsSuggestions.slice(0, 3).join(" ")}`)
  }
  return lines.join("\n\n")
}

function improveAdvice(context: CareerChatContext): string {
  const resume = context.resume
  if (!resume) {
    return "I do not have a resume to improve yet. Upload a PDF or DOCX under My Resumes, then ask how to strengthen it."
  }

  const lines = [`Here is how to improve ${resume.fileName} from the data already in ResumeAI:`]
  if (resume.atsScore != null) {
    lines.push(`Current ATS-oriented score: ${resume.atsScore}/100.`)
  }
  if (resume.atsIssues.length) {
    lines.push(`Fix these issues first: ${resume.atsIssues.slice(0, 4).join(" ")}`)
  }
  if (resume.atsSuggestions.length) {
    lines.push(`Concrete edits: ${resume.atsSuggestions.slice(0, 4).join(" ")}`)
  }
  if (context.skillGaps.missingSkills.length) {
    lines.push(
      `Add or evidence these skills from your saved job matches: ${listItems(context.skillGaps.missingSkills, 6)}.`
    )
  }
  if (resume.experience.length === 0) {
    lines.push("Experience is missing or unlabeled. Add role titles, company names, and result-based bullets.")
  }
  lines.push("Open Resume Improve for rewrite help, or Skill Gap if you want a learning list next.")
  return lines.join("\n\n")
}

function skillAdvice(context: CareerChatContext): string {
  const skills = context.resume?.skills ?? []
  const missing = context.skillGaps.missingSkills
  const suggestions = context.skillGaps.learningSuggestions

  if (skills.length === 0 && missing.length === 0) {
    return "I do not have extracted skills or skill-gap data yet. Upload a resume and run Job Match or Skill Gap, then ask again."
  }

  const lines: string[] = []
  if (skills.length) {
    lines.push(`Skills on your resume: ${listItems(skills, 8)}.`)
  }
  if (missing.length) {
    lines.push(`Missing skills from your saved role matches: ${listItems(missing, 8)}.`)
  }
  if (suggestions.length) {
    lines.push(
      `In-app learning suggestions: ${suggestions
        .slice(0, 4)
        .map((item) => `${item.skill} — ${item.suggestion}`)
        .join(" ")}`
    )
  }
  return lines.join("\n\n")
}

function matchAdvice(context: CareerChatContext): string {
  if (context.jobMatches.length === 0) {
    return "I do not have job match results yet. Analyze a job description in Job Match, then ask again."
  }

  const top = context.jobMatches[0]
  const lines = [
    `Your strongest saved match is ${jobLabel(top.jobTitle, top.company)} at ${top.overallScore}/100 (${top.skillScore}/100 skill score).`,
  ]
  if (top.matchedSkills.length) {
    lines.push(`You already match: ${listItems(top.matchedSkills)}.`)
  }
  if (top.missingSkills.length) {
    lines.push(`That match is missing: ${listItems(top.missingSkills)}.`)
  }
  if (context.jobMatches.length > 1) {
    const rest = context.jobMatches
      .slice(1, 3)
      .map((item) => `${jobLabel(item.jobTitle, item.company)} (${item.overallScore}/100)`)
    lines.push(`Other saved matches: ${rest.join("; ")}.`)
  }
  return lines.join("\n\n")
}

function applicationAdvice(context: CareerChatContext): string {
  if (context.applications.length === 0) {
    return "This product does not track job applications. Use Job Match to compare your resume with a target role instead of browsing or saving listings."
  }

  const byStatus = new Map<string, number>()
  for (const item of context.applications) {
    byStatus.set(item.status, (byStatus.get(item.status) ?? 0) + 1)
  }
  const counts = [...byStatus.entries()].map(([status, count]) => `${count} ${status}`).join(", ")
  const lines = [`You are tracking ${context.applications.length} application${context.applications.length === 1 ? "" : "s"} (${counts}).`]

  const interview = context.applications.filter((item) => item.status === "interview" || item.status === "offered")
  const applied = context.applications.filter((item) => item.status === "applied")
  const saved = context.applications.filter((item) => item.status === "saved")

  if (interview.length) {
    lines.push(
      `Prioritize interviews or offers: ${interview.map((item) => jobLabel(item.jobTitle, item.company)).join("; ")}.`
    )
  } else if (applied.length) {
    lines.push(
      `Follow up on applied roles: ${applied
        .slice(0, 3)
        .map((item) => jobLabel(item.jobTitle, item.company))
        .join("; ")}.`
    )
  } else if (saved.length) {
    lines.push(
      `You have saved jobs that are not applied yet: ${saved
        .slice(0, 3)
        .map((item) => jobLabel(item.jobTitle, item.company))
        .join("; ")}. Apply to the strongest match, or remove roles you will not pursue.`
    )
  }

  const withNotes = context.applications.find((item) => item.notes)
  if (withNotes) {
    lines.push(`Your note on ${jobLabel(withNotes.jobTitle, withNotes.company)}: ${withNotes.notes}`)
  }

  return lines.join("\n\n")
}

function industryAdvice(): string {
  return "Open Industry Insights to see how skills already on your resume map to a target industry. Outlook and salary bands there are a curated baseline, not live job-board data."
}

function interviewAdvice(context: CareerChatContext): string {
  const skills = context.resume?.skills ?? []
  const top = context.jobMatches[0]
  const lines = [
    "I can prep you only from your stored resume and job-match data — not from invented interview scripts.",
  ]

  if (top) {
    lines.push(
      `Focus practice on ${jobLabel(top.jobTitle, top.company)}. Be ready to walk through projects that show ${listItems(top.matchedSkills.length ? top.matchedSkills : skills, 5) || "your listed skills"}.`
    )
    if (top.missingSkills.length) {
      lines.push(
        `Expect questions around gaps: ${listItems(top.missingSkills)}. Prepare a short plan for how you are learning each one.`
      )
    }
  } else if (skills.length) {
    lines.push(
      `No job match is saved yet. Practice stories around ${listItems(skills, 6)}, then run Job Match with a target role so prep can be role-specific.`
    )
  } else {
    lines.push("Upload a resume and run Job Match, then ask again for interview prep tied to a real role.")
  }

  if (context.resume?.experience.length) {
    const roles = context.resume.experience
      .slice(0, 3)
      .map((item) => jobLabel(item.position, item.company))
    lines.push(`Use these roles as STAR stories: ${roles.join("; ")}.`)
  }

  lines.push("Open Interview Prep in the app for structured practice on the same data.")
  return lines.join("\n\n")
}

function roadmapAdvice(context: CareerChatContext): string {
  const skills = context.resume?.skills ?? []
  const missing = context.skillGaps.missingSkills
  const top = context.jobMatches[0]
  const lines: string[] = []

  if (!context.resume) {
    return "I need a resume before I can sketch a career roadmap. Upload one under My Resumes, then ask again."
  }

  if (top) {
    lines.push(
      `Nearest target from your saved matches: ${jobLabel(top.jobTitle, top.company)} (${top.overallScore}/100).`
    )
  } else {
    lines.push("No job match is saved yet, so this roadmap is based on skills already on your resume.")
  }

  if (skills.length) {
    lines.push(`Foundation you already have: ${listItems(skills, 8)}.`)
  }
  if (missing.length) {
    lines.push(`Learn next to close saved-role gaps: ${listItems(missing, 8)}.`)
  } else {
    lines.push("Run Job Match or Skill Gap to generate a skill sequence for a target role.")
  }

  const suggestions = context.skillGaps.learningSuggestions.slice(0, 3)
  if (suggestions.length) {
    lines.push(
      `Suggested order: ${suggestions.map((item, index) => `${index + 1}. ${item.skill} — ${item.suggestion}`).join(" ")}`
    )
  }

  lines.push("Open Career Roadmap for the full path view. I will not invent titles or salaries that are not in your data.")
  return lines.join("\n\n")
}

function experienceAdvice(context: CareerChatContext): string {
  const experience = context.resume?.experience ?? []
  if (!context.resume) {
    return "I do not have a resume yet, so I cannot list your work history. Upload a CV under My Resumes."
  }
  if (experience.length === 0) {
    return `I could not extract labeled experience from ${context.resume.fileName}. Add company, title, dates, and result-based bullets, then re-analyze.`
  }
  const roles = experience.map((item) => jobLabel(item.position, item.company))
  return `Experience on ${context.resume.fileName}: ${roles.join("; ")}.\n\nAsk how to improve those bullets if you want ATS-oriented edits.`
}

function educationAdvice(context: CareerChatContext): string {
  const education = context.resume?.education ?? []
  if (!context.resume) {
    return "I do not have a resume yet, so I cannot list your education. Upload a CV under My Resumes."
  }
  if (education.length === 0) {
    return `I could not extract labeled education from ${context.resume.fileName}. Add degree, field, and institution on their own lines, then re-analyze.`
  }
  const items = education.map((item) => {
    const title = [item.degree, item.field].filter(Boolean).join(" in ")
    return item.institution ? `${title || "Program"} at ${item.institution}` : title || "Education entry"
  })
  return `Education on ${context.resume.fileName}: ${items.join("; ")}.`
}

function overviewAdvice(context: CareerChatContext): string {
  const parts = [
    "I can answer in your own words — resume quality, improvements, skills to learn, interviews, job matches, or a career roadmap.",
    atsAdvice(context),
    skillAdvice(context),
    matchAdvice(context),
  ]
  return parts.join("\n\n")
}

export function detectCareerIntent(
  question: string,
  history: Array<Pick<ChatMessage, "role" | "content">> = []
): CareerIntent {
  const text = question.toLowerCase()

  if (/application|applied|offer|saved job/.test(text) && !/interview prep|prepare for interview/.test(text)) {
    return "applications"
  }
  if (/ats|parser|readable|resume score/.test(text)) return "ats"
  if (/interview|prep for|hiring manager/.test(text)) return "interview"
  if (/roadmap|career path|next role|grow into|promotion/.test(text)) return "roadmap"
  if (/industry|outlook|salary|market/.test(text)) return "industry"
  if (/work history|experience|previous (job|role)|companies I/.test(text)) return "experience"
  if (/education|degree|university|college|certification/.test(text)) return "education"
  if (/improve|better|fix|rewrite|optimize|bullet|stronger|next step|what should i (change|add|fix)|how can (i|we) (improve|fix)/.test(text)) {
    return "improve"
  }
  if (/skill|learn|gap/.test(text)) return "skills"
  if (/match|recommend|job/.test(text)) return "matches"

  const previousUser = [...history].reverse().find((item) => item.role === "user")
  if (previousUser) {
    const previous = detectCareerIntent(previousUser.content, [])
    if (previous !== "overview") return previous
  }

  return "overview"
}

function answerForIntent(context: CareerChatContext, intent: CareerIntent): string {
  switch (intent) {
    case "ats":
      return atsAdvice(context)
    case "improve":
      return improveAdvice(context)
    case "skills":
      return skillAdvice(context)
    case "matches":
      return matchAdvice(context)
    case "industry":
      return industryAdvice()
    case "applications":
      return applicationAdvice(context)
    case "interview":
      return interviewAdvice(context)
    case "roadmap":
      return roadmapAdvice(context)
    case "experience":
      return experienceAdvice(context)
    case "education":
      return educationAdvice(context)
    default:
      return overviewAdvice(context)
  }
}

/**
 * Deterministic career answers from the user's stored ResumeAI data.
 * Used when no LLM API key is configured. Never invents jobs, scores, or skills.
 */
export function adviseFromCareerContext(
  context: CareerChatContext,
  question: string,
  history: Array<Pick<ChatMessage, "role" | "content">> = []
): string {
  if (!isCareerAssistantTopic(question, history)) {
    return IRRELEVANT_CHAT_REPLY
  }

  const intent = detectCareerIntent(question, history)
  return `${answerForIntent(context, intent)}${missingDataBlock(context)}`.trim()
}
