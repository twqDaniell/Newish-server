/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    collectCoverage: true,
    coverageDirectory: "coverage",
    coverageReporters: ["html", "text", "lcov"],
    collectCoverageFrom: [
      "src/**/*.{js,jsx,ts,tsx}", // Adjust this path to include `sustainability_controller.ts`
      "!src/tests/**", // Exclude test files
      "!**/node_modules/**", // Exclude node_modules
    ],
    coveragePathIgnorePatterns: [
      "/node_modules/",
      "/tests/",          // Exclude all test files
      "/utils/",          // Exclude utility files
      "/src/config/",     // Exclude configuration files
      "\\.d\\.ts$",       // Exclude TypeScript declaration files
      "/src/server.ts",   // Exclude server file
      "/src/app.ts",      // Exclude app file
    ],
  };
  