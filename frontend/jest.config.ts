export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['@testing-library/jest-dom'],
  moduleNameMapper: {
    '\\.(css|less|scss)$': '<rootDir>/__mocks__/styleMock.js',
  },
}
