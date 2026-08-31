const nextJest = require("next/jest")

const createJestConfig = nextJest({
  dir: "./",
})

module.exports = createJestConfig({
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  moduleNameMapper: {
    "^pdf-parse$": "<rootDir>/tests/mocks/pdf-parse.ts",
  },
})
