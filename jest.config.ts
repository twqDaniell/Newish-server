/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    collectCoverage: true,
    coverageDirectory: "coverage",
    coverageReporters: ["html", "text", "lcov"],
  };
  