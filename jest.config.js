const path = require('path');
const tsJest = require.resolve('ts-jest', {
  paths: [path.resolve(__dirname, '../api/node_modules')],
});

module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)sx?$': [
      tsJest,
      {
        isolatedModules: true,
        tsconfig: {
          jsx: 'react-jsx',
          module: 'commonjs',
          target: 'es2020',
          moduleResolution: 'node',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/\\.next/'],
  testRegex: 'src/.*\\.spec\\.(t|j)sx?$',
};
