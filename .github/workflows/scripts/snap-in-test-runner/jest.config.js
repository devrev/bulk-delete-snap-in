module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverage: true,
    coverageThreshold: {
        global: {
          branches: 60,
          functions: 80,
          lines: 80,
        },
      },
  };

