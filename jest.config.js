/* eslint-disable */
// Jest configuration leveraging Next.js SWC transform via next/jest.
// This fixes JSX/TSX parsing issues encountered after removing Babel.
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["**/__tests__/**/*.(ts|tsx)", "**/?(*.)+(test|spec).(ts|tsx)"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/app/**", // exclude Next.js route files for now
  ],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "json"],
  coverageThreshold: {
    global: {
      // Raised thresholds after expanding test coverage across UI, upload, dummy components
      // Updated after provider + utility + mock-data tests; keep conservative buffer below current (~71/57/70/73)
      statements: 65,
      branches: 52,
      functions: 62,
      lines: 66,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
