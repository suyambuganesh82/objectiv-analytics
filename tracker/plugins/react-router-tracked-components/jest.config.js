/*
 * Copyright 2021-2022 Objectiv B.V.
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  reporters: ['jest-standard-reporter'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
  moduleNameMapper: {
    '@objectiv/plugin-(.*)': '<rootDir>/../../plugins/$1/src',
    '@objectiv/queue-(.*)': '<rootDir>/../../queues/$1/src',
    '@objectiv/transport-(.*)': '<rootDir>/../../transports/$1/src',
    '@objectiv/testing-tools': '<rootDir>../../core/testing-tools/src',
    '@objectiv/tracker-react-core': '<rootDir>../../core/react/src',
    '@objectiv/tracker-core': '<rootDir>../../core/tracker/src',
    '@objectiv/tracker-react': '<rootDir>../../trackers/react/src',
  },
  setupFilesAfterEnv: ['jest-extended/all'],
};
