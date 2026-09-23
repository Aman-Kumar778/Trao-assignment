/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    "^@traq/shared$": "<rootDir>/../shared/src/index.ts",
    "^@test-fixtures/(.*)$": "<rootDir>/test-fixtures/$1"
  }
};
