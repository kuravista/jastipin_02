/**
 * Jest Configuration for Frontend
 * Configures testing for React components with Next.js
 */

module.exports = {
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/**/*.test.{ts,tsx}',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../../frontend/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['./setup.ts'],
  transform: {
    '^.+\\.(tsx|ts)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowJs: true,
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'frontend/**/*.{ts,tsx}',
    '!frontend/**/*.d.ts',
    '!frontend/**/index.ts',
    '!frontend/**/*.test.{ts,tsx}',
    '!frontend/node_modules/**',
    '!frontend/.next/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
}
