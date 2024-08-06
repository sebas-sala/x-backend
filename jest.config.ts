import type { Config } from 'jest';
const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testRegex: String.raw`.*\.spec\.ts$`,
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!dist/**',
    '!node_modules/**',
    '!tests/utils/**',
    '!src/main.ts',
    '!src/app.module.ts',
    '!src/**/*.entity.ts',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
};

export default config;
