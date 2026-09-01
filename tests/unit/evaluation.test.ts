import { describe, expect, it } from "@jest/globals"
import { extractSkills } from "@/services/nlp/skill-extractor"
import { calculateMatch } from "@/services/matching/match-service"
import { combineSkillAndSemanticScores } from "@/services/matching/score"
import goldSet from "@/data/evaluation/skill-extraction-gold.json"

type GoldSample = {
  id: string
  text: string
  goldSkills: string[]
}

function prf(predicted: string[], gold: string[]) {
  const predictedSet = new Set(predicted.map((item) => item.toLowerCase()))
  const goldSetNames = new Set(gold.map((item) => item.toLowerCase()))
  let truePositives = 0
  for (const skill of predictedSet) {
    if (goldSetNames.has(skill)) truePositives += 1
  }
  const precision = predictedSet.size ? truePositives / predictedSet.size : 0
  const recall = goldSetNames.size ? truePositives / goldSetNames.size : 0
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0
  return { precision, recall, f1, truePositives, predicted: predictedSet.size, gold: goldSetNames.size }
}

describe("in-house skill extraction evaluation set", () => {
  it("computes micro-averaged precision, recall, and F1 against gold labels", () => {
    const samples = goldSet as GoldSample[]
    let truePositives = 0
    let predictedCount = 0
    let goldCount = 0

    for (const sample of samples) {
      const predicted = extractSkills(sample.text).map((skill) => skill.name)
      const metrics = prf(predicted, sample.goldSkills)
      truePositives += metrics.truePositives
      predictedCount += metrics.predicted
      goldCount += metrics.gold
    }

    const precision = predictedCount ? truePositives / predictedCount : 0
    const recall = goldCount ? truePositives / goldCount : 0
    const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0

    expect(samples.length).toBeGreaterThanOrEqual(4)
    expect(precision).toBeGreaterThan(0)
    expect(recall).toBeGreaterThan(0)
    expect(f1).toBeGreaterThan(0)
  })
})

describe("matching score comparison on labeled pairs", () => {
  it("reports keyword coverage and combined overall for the same pairs", () => {
    const pairs = [
      {
        resumeSkills: ["JavaScript", "React", "Node.js", "MongoDB"],
        requiredSkills: ["JavaScript", "React", "Node.js", "MongoDB", "AWS", "Docker"],
        semanticScore: 80,
      },
      {
        resumeSkills: ["Python", "Django"],
        requiredSkills: ["Java", "Spring"],
        semanticScore: 20,
      },
    ]

    const rows = pairs.map((pair) => {
      const keyword = calculateMatch({
        resumeSkills: pair.resumeSkills,
        requiredSkills: pair.requiredSkills,
      })
      const combined = combineSkillAndSemanticScores(keyword.skillScore, pair.semanticScore, true)
      return {
        keywordSkillScore: keyword.skillScore,
        semanticScore: pair.semanticScore,
        overall: combined.overallScore,
      }
    })

    expect(rows[0]?.keywordSkillScore).toBe(67)
    expect(rows[0]?.overall).toBe(72)
    expect(rows[1]?.keywordSkillScore).toBe(0)
    expect(rows[1]?.overall).toBe(8)
  })
})
