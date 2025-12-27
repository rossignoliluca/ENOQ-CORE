/**
 * JEST CONFIGURATION FOR ENOQ TESTS
 *
 * Tests are organized in src/__tests__/
 * Each test file documents WHY it exists.
 *
 * RUN ALL: npm test
 * RUN ONE: npx jest <test-name>
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 30000, // 30s timeout for async tests
};
