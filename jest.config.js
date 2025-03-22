module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
    coverageThreshold: {
        global: {
            branches: 55,
            functions: 60,
            lines: 65,
            statements: 65
        }
    },
    testTimeout: 15000,
    maxWorkers: '50%',
    verbose: true
}; 