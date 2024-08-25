/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  roots: ["<rootDir>/lib/tests"],
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest", {
      // diagnostics: {
      //   exclude: ['*envsub*'],
      // },
    }],
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  coverageReporters: ['text'],
};