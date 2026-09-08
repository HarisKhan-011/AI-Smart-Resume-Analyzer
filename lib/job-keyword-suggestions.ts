export const JOB_KEYWORD_SUGGESTIONS = [
  "software engineer",
  "software developer",
  "software",
  "software house",
  "software quality assurance",
  "senior software engineer",
  "associate software engineer",
  "full stack developer",
  "frontend developer",
  "backend developer",
  "web developer",
  "mobile app developer",
  "android developer",
  "ios developer",
  "react developer",
  "python developer",
  "java developer",
  "node.js developer",
  "mern stack developer",
  "php developer",
  "dotnet developer",
  "devops engineer",
  "data analyst",
  "data scientist",
  "machine learning engineer",
  "ai engineer",
  "qa engineer",
  "sqa engineer",
  "soc analyst",
  "cyber security",
  "network engineer",
  "it support",
  "system administrator",
  "product manager",
  "project manager",
  "business analyst",
  "ui ux designer",
  "graphic designer",
  "social media manager",
  "social media marketing",
  "social media",
  "social media manager remote",
  "digital marketing",
  "content writer",
  "hr manager",
  "accountant",
  "finance officer",
  "sales executive",
  "customer support",
  "internship",
  "software engineering internship",
]

export function suggestJobKeywords(query: string, limit = 10): string[] {
  const needle = query.trim().toLowerCase()
  if (needle.length < 1 || limit <= 0) return []

  const ranked: Array<{ keyword: string; score: number; index: number }> = []

  JOB_KEYWORD_SUGGESTIONS.forEach((keyword, index) => {
    const value = keyword.toLowerCase()
    let score = 0
    if (value.startsWith(needle)) score = 3
    else if (value.split(/\s+/).some((word) => word.startsWith(needle))) score = 2
    else if (value.includes(needle)) score = 1
    else return
    ranked.push({ keyword, score, index })
  })

  ranked.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score
    return left.index - right.index
  })

  return ranked.slice(0, limit).map((entry) => entry.keyword)
}
