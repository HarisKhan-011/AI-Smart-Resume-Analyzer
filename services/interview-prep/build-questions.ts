import type { InterviewDifficulty, InterviewQuestion } from "@/types/interview-prep"
import type { Resume } from "@/types/resume"
import type { Job } from "@/types/job"
import type { ExtractedResumeSections } from "@/services/resume-improve/extract-resume-sections"

function unique(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values) {
    const trimmed = value.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(trimmed)
  }
  return result
}

function skillOnResume(skill: string, haystack: string): boolean {
  const needle = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  if (!needle) return false
  return new RegExp(`(?:^|[^a-z0-9+.#])${needle}(?:$|[^a-z0-9+.#])`, "i").test(haystack)
}

function bulletLines(text: string): string[] {
  return unique(
    text
      .split(/\r?\n/)
      .map((line) => line.replace(/^[-*•●]\s*/, "").trim())
      .filter((line) => line.length > 8 && !/^(summary|experience|projects|skills)\b/i.test(line))
  )
}

function createRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 4294967296
  }
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function sample<T>(items: T[], count: number, rng: () => number): T[] {
  if (count <= 0 || items.length === 0) return []
  return shuffle(items, rng).slice(0, Math.min(count, items.length))
}

function pickOne<T>(items: T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)] as T
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9+.#]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 28) || "item"
  )
}

type PromptOption = {
  difficulty: InterviewDifficulty
  prompt: string
}

function technicalOptions(skill: string, project: string): PromptOption[] {
  const projectHint =
    project && skillOnResume(skill, project)
      ? ` If it appears in this resume project, ground your answer there: ${project.slice(0, 80)}.`
      : " If it only appears in your skills list, say that honestly."
  return [
    {
      difficulty: "easy",
      prompt: `What is ${skill}, and how does it show up on your resume?`,
    },
    {
      difficulty: "easy",
      prompt: `How would you explain ${skill} to an interviewer using only what is already written on your resume?`,
    },
    {
      difficulty: "medium",
      prompt: `Walk through a task from your resume that used ${skill}. Do not add tools that are not listed.`,
    },
    {
      difficulty: "medium",
      prompt: `What was difficult about using ${skill} in work already on your resume, and how did you handle it?`,
    },
    {
      difficulty: "hard",
      prompt: `Describe a concrete problem you solved with ${skill} using only work already on your resume.${projectHint}`,
    },
    {
      difficulty: "hard",
      prompt: `If an interviewer asked you to go deeper on ${skill}, which resume example would you use, and why? Stay within listed work.`,
    },
  ]
}

function behavioralOptions(label: string): PromptOption[] {
  return [
    {
      difficulty: "easy",
      prompt: `Walk me through a typical responsibility you had as ${label}, using only that role.`,
    },
    {
      difficulty: "medium",
      prompt: `Tell me about a challenge you faced as ${label}. Use only that role, and do not invent other employers or titles.`,
    },
    {
      difficulty: "medium",
      prompt: `Describe a decision you made as ${label}. Stick to what that role on your resume can support.`,
    },
    {
      difficulty: "hard",
      prompt: `Tell me about something that did not go as planned as ${label}. Do not invent other employers or titles.`,
    },
    {
      difficulty: "hard",
      prompt: `What did you learn as ${label} that you can back up from the resume, without adding extra experience?`,
    },
  ]
}

export function buildGroundedInterviewQuestions(input: {
  resume: Pick<Resume, "id" | "skills" | "experience">
  sections: ExtractedResumeSections
  job?: Pick<Job, "title" | "company" | "requiredSkills"> | null
  seed?: number
}): InterviewQuestion[] {
  const seed = input.seed ?? Date.now()
  const rng = createRng(seed)
  const skills = unique(input.resume.skills ?? [])
  const roles = (input.resume.experience ?? []).filter((item) => item.position || item.company)
  const haystack = `${input.sections.summary}\n${input.sections.experience}\n${input.sections.projects}\n${input.sections.skills}\n${skills.join(" ")}`
  const projects = bulletLines(input.sections.projects)
  const experienceLines = bulletLines(input.sections.experience)
  const questions: InterviewQuestion[] = []

  const selectedSkills = sample(skills, Math.min(3, Math.max(skills.length, 0)), rng)
  selectedSkills.forEach((skill, index) => {
    const project = projects[index % Math.max(projects.length, 1)] ?? ""
    const option = pickOne(technicalOptions(skill, project), rng)
    questions.push({
      id: `technical-${slug(skill)}-${index}-${seed}`,
      category: "technical",
      difficulty: option.difficulty,
      focus: skill,
      prompt: option.prompt,
    })
  })

  if (questions.filter((item) => item.category === "technical").length === 0) {
    const snippet = experienceLines[0] ?? projects[0] ?? ""
    questions.push({
      id: `technical-none-${seed}`,
      category: "technical",
      difficulty: "easy",
      focus: "resume skills",
      prompt: snippet
        ? `Your resume does not list extracted skills yet. Which technical topic in this text are you prepared to discuss, without adding tools that are not written there: "${snippet.slice(0, 120)}"?`
        : "Your resume does not list extracted skills yet. Which technical topic on the resume text are you prepared to discuss, without adding tools that are not written there?",
    })
  }

  const selectedRoles = sample(roles, Math.min(2, roles.length), rng)
  selectedRoles.forEach((role, index) => {
    const label = [role.position, role.company].filter(Boolean).join(" at ")
    const option = pickOne(behavioralOptions(label), rng)
    questions.push({
      id: `behavioral-${slug(label)}-${index}-${seed}`,
      category: "behavioral",
      difficulty: option.difficulty,
      focus: label,
      prompt: option.prompt,
    })
  })

  if (questions.filter((item) => item.category === "behavioral").length === 0) {
    const snippet = experienceLines[0] ?? ""
    questions.push({
      id: `behavioral-none-${seed}`,
      category: "behavioral",
      difficulty: "medium",
      focus: "experience",
      prompt: snippet
        ? `Using this experience text from your resume — "${snippet.slice(0, 120)}" — tell me about a problem you actually worked on. Do not add jobs that are not listed.`
        : "Tell me about a problem you solved in the experience written on your resume. If no experience section is present, say that honestly.",
    })
  }

  const extraHr: InterviewQuestion[] = [
    {
      id: `hr-story-${seed}`,
      category: "hr",
      difficulty: "easy",
      focus: "career story",
      prompt:
        "Walk me through the career story on your resume. Only use roles, employers, and skills that are already listed.",
    },
    {
      id: `hr-intro-${seed}`,
      category: "hr",
      difficulty: "easy",
      focus: "self introduction",
      prompt:
        "Give a 60-second introduction using only the roles, skills, and projects already on your resume.",
    },
  ]

  const project = sample(projects, 1, rng)[0]
  if (project) {
    extraHr.push({
      id: `hr-project-${slug(project)}-${seed}`,
      category: "hr",
      difficulty: "medium",
      focus: project.slice(0, 80),
      prompt: `Which part of this resume project are you most ready to discuss: "${project.slice(0, 100)}"? Stay within what is written.`,
    })
  } else {
    extraHr.push({
      id: `hr-section-${seed}`,
      category: "hr",
      difficulty: "medium",
      focus: "resume projects",
      prompt:
        "Which role or section on your resume are you most prepared to discuss, and why? Do not add experience that is not listed.",
    })
  }

  if (input.job) {
    const overlapping = (input.job.requiredSkills ?? []).filter((skill) => skillOnResume(skill, haystack))
    const missing = (input.job.requiredSkills ?? []).filter((skill) => !skillOnResume(skill, haystack))
    const fitOptions = overlapping.length
      ? [
          `This opening is ${input.job.title} at ${input.job.company}. Using only overlapping skills already on your resume (${overlapping.slice(0, 5).join(", ")}), why are you a fit?`,
          `This opening is ${input.job.title} at ${input.job.company}. Which overlapping resume skill (${overlapping.slice(0, 5).join(", ")}) would you discuss first, and why?`,
        ]
      : [
          `This opening is ${input.job.title} at ${input.job.company}. Using only experience already on your resume, how would you describe your fit without inventing skills?`,
          `This opening is ${input.job.title} at ${input.job.company}. How would you introduce your resume experience for this role without adding skills?`,
        ]
    questions.push({
      id: `hr-fit-${slug(input.job.title)}-${seed}`,
      category: "hr",
      difficulty: "medium",
      focus: `${input.job.title} at ${input.job.company}`,
      prompt: pickOne(fitOptions, rng),
    })
    const gapSkill = sample(missing, 1, rng)[0]
    if (gapSkill) {
      const gapOptions = [
        `This job lists ${gapSkill}, which is not on your resume. How would you discuss that gap honestly, without claiming you already have that skill?`,
        `This job lists ${gapSkill}, which is not on your resume. What related experience on your resume would you talk about instead, without claiming ${gapSkill}?`,
      ]
      questions.push({
        id: `hr-gap-${slug(gapSkill)}-${seed}`,
        category: "hr",
        difficulty: "hard",
        focus: gapSkill,
        prompt: pickOne(gapOptions, rng),
      })
    }
  } else if (skills.length) {
    const skill = pickOne(skills, rng)
    extraHr.push({
      id: `hr-strength-${slug(skill)}-${seed}`,
      category: "hr",
      difficulty: "medium",
      focus: skill,
      prompt: `Which listed strength would you lead with in an interview, and how does ${skill} on your resume support that? Do not add skills.`,
    })
  }

  questions.push(...sample(extraHr, 1, rng))
  return questions.slice(0, 9)
}
