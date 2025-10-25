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
  testMatch: ["**/__tests__/**/*.(ts|tsx)"],
  collectCoverageFrom: [
    "src/components/layout/**/*.{ts,tsx}",
    "src/components/auth/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
  ],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "json"],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
