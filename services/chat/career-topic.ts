const CAREER_TOPIC =
  /\b(resume|cv|curriculum|ats|career|careers|job|jobs|role|roles|skill|skills|interview|roadmap|cover\s*letter|linkedin|portfolio|hiring|application|applications|salary|promotion|experience|education|degree|certification|gap|match|matching|analyze|analysis|improve|rewrite|bullet|summary|objective|occupation|profession|recruit|recruiter|candidate|employment|position|internship|vacancy|work\s*history|career\s*path|learning|industry|insights?|market|outlook)\b/i

const OFF_TOPIC =
  /\b(weather|recipe|cook|cooking|sports?|football|cricket|movie|film|song|poem|joke|riddle|homework|politics|president|crypto|bitcoin|stock|dating|girlfriend|boyfriend|minecraft|capital of|who won|write a story|translate this|2\s*\+\s*2)\b/i

const FOLLOW_UP = /^(what about|and\b|also\b|how\b|why\b|more\b|explain|continue|that\b|those\b|it\b|the second|the first)/i

export const IRRELEVANT_CHAT_REPLY =
  "I can't answer any irrelevant questions. Ask me about your resume, career, jobs, CV, industry insights, or career roadmap."

export function isCareerAssistantTopic(
  question: string,
  history: Array<{ role: string; content: string }> = []
): boolean {
  const text = question.trim().toLowerCase()
  if (!text) return false
  if (OFF_TOPIC.test(text) && !CAREER_TOPIC.test(text)) return false
  if (CAREER_TOPIC.test(text)) return true
  if (FOLLOW_UP.test(text) && text.length < 120 && history.some((item) => item.role === "assistant")) {
    return true
  }
  return false
}
