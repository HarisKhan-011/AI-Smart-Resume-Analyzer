import type { CareerChatContext } from "@/types/chat"

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
    lines.push(`Missing skills from your saved matches or recommendations: ${listItems(missing, 8)}.`)
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
  if (context.jobMatches.length === 0 && context.recommendedJobs.length === 0) {
    return "I do not have job match or recommendation results yet. Run Job Match or open Recommended Jobs, then ask again."
  }

  const lines: string[] = []
  if (context.jobMatches.length) {
    const top = context.jobMatches[0]
    lines.push(
      `Your strongest saved match is ${jobLabel(top.jobTitle, top.company)} at ${top.overallScore}/100 (${top.skillScore}/100 skill score).`
    )
    if (top.missingSkills.length) {
      lines.push(`That match is missing: ${listItems(top.missingSkills)}.`)
    }
  }
  if (context.recommendedJobs.length) {
    const top = context.recommendedJobs[0]
    lines.push(
      `Top recommendation: ${top.title} at ${top.company} (${top.overallScore}/100).`
    )
    if (top.missingSkills.length) {
      lines.push(`To improve that recommendation, add: ${listItems(top.missingSkills)}.`)
    }
  }
  return lines.join("\n\n")
}

function applicationAdvice(context: CareerChatContext): string {
  if (context.applications.length === 0) {
    return "You have no tracked applications yet. Open Applications, save or apply to a job, then I can advise from that list."
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

function overviewAdvice(context: CareerChatContext): string {
  const parts = [atsAdvice(context), skillAdvice(context), matchAdvice(context), applicationAdvice(context)]
  return `Here is what I can say from your ResumeAI data only:\n\n${parts.join("\n\n")}`
}

/**
 * Deterministic career answers from the user's stored ResumeAI data.
 * Used when no LLM API key is configured. Never invents jobs, scores, or skills.
 */
export function adviseFromCareerContext(context: CareerChatContext, question: string): string {
  const text = question.toLowerCase()
  let answer: string

  if (/ats|parser|readable|resume score/.test(text)) {
    answer = atsAdvice(context)
  } else if (/application|applied|interview|offer|saved job/.test(text)) {
    answer = applicationAdvice(context)
  } else if (/skill|learn|gap/.test(text)) {
    answer = skillAdvice(context)
  } else if (/match|recommend|job/.test(text)) {
    answer = matchAdvice(context)
  } else {
    answer = overviewAdvice(context)
  }

  return `${answer}${missingDataBlock(context)}`.trim()
}
