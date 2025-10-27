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
      statements: 50,
      branches: 43,
      functions: 50,
      lines: 50,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
