import { describe, expect, it } from "@jest/globals"
import {
  preprocessResumeText,
  removeStopwords,
  tokenize,
} from "@/services/nlp/preprocess"

describe("NLP preprocessing", () => {
  it("lowercases text, strips extra punctuation, and normalizes whitespace", () => {
    const { normalized } = preprocessResumeText("  JavaScript,   Node.js!!\nPython.  ")
    expect(normalized).toBe("javascript node.js python.")
  })

  it("tokenizes and removes stopwords", () => {
    const tokens = removeStopwords(tokenize("Skills in the React and Node.js stack"))
    expect(tokens).toEqual(["skills", "react", "node.js", "stack"])
  })
})
