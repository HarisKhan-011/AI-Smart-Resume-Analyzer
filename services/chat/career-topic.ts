const CAREER_TOPIC =
  /\b(resume|cv|curriculum|ats|career|careers|job|jobs|role|roles|skill|skills|interview|roadmap|cover\s*letter|linkedin|portfolio|hiring|application|applications|salary|promotion|experience|education|degree|certification|gap|match|matching|analyze|analysis|improve|rewrite|bullet|bullets|summary|objective|occupation|profession|recruit|recruiter|candidate|employment|position|internship|vacancy|work\s*history|career\s*path|learning|industry|insights?|market|outlook|keyword|keywords|section|headline|profile|weakness|strength|optimize|parser|readability|github|certifications?)\b/i

const CAREER_INTENT =
  /^(how (can|do|should|would|could)|what (should|can|do|are|is)|which |help me |can you |please |tell me |give me |suggest |improve |fix |rewrite )/i

const OFF_TOPIC =
  /\b(weather|recipe|cook|cooking|sports?|football|cricket|movie|film|song|poem|joke|riddle|homework|politics|president|crypto|bitcoin|stock|dating|girlfriend|boyfriend|minecraft|capital of|who won|write a story|translate this|2\s*\+\s*2)\b/i

const FOLLOW_UP =
  /^(what about|and\b|also\b|how\b|why\b|more\b|explain|continue|that\b|those\b|it\b|the second|the first|then\b|so\b|can we|can you|please|improve|fix|what next|next steps?)/i

const CHIT_CHAT =
  /^(lol+|lmao|rofl|haha+|hehe+|ok+|okay|k+|yes|yep|no|nope|hmm+|huh+|test|hi+|hello|hey|yo|thanks?|thank you|thx|bro|nice|cool|wow|idk|wtf|sup)[\s!.?]*$/i

export const IRRELEVANT_CHAT_REPLY =
  "I can't answer any irrelevant questions. Ask me about your resume, career, jobs, CV, industry insights, or career roadmap."

export function isCareerAssistantTopic(
  question: string,
  history: Array<{ role: string; content: string }> = []
): boolean {
  const text = question.trim().toLowerCase()
  if (!text) return false
  if (CHIT_CHAT.test(text)) return false
  if (OFF_TOPIC.test(text) && !CAREER_TOPIC.test(text)) return false
  if (CAREER_TOPIC.test(text)) return true
  if (
    CAREER_INTENT.test(text) &&
    /improve|fix|better|prep|learn|advice|suggest|resume|cv|career|job|skill|interview|roadmap/.test(text)
  ) {
    return true
  }

  const hasAssistantTurn = history.some((item) => item.role === "assistant")
  if (hasAssistantTurn && text.length < 160 && (FOLLOW_UP.test(text) || text.endsWith("?"))) {
    return true
  }
  return false
}
