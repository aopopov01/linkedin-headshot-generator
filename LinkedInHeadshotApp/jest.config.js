module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/src/test-utils/setupTests.js'],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-navigation|@react-navigation|react-native-.*|@bam.tech/react-native-image-resizer|react-native-fs|react-native-image-picker|react-native-purchases)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test-utils/**',
    '!src/**/__tests__/**',
    '!src/**/index.js',
  ],
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  testEnvironment: 'jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@assets/(.*)$': '<rootDir>/assets/$1',
    '^@test-utils/(.*)$': '<rootDir>/src/test-utils/$1',
  },
  testTimeout: 10000,
  maxWorkers: '50%',
};
