/**
 * Tests compile through ts-jest to CommonJS (production build stays NodeNext
 * ESM via tsconfig). The moduleNameMapper strips the `.js` extension that
 * NodeNext-style relative imports carry and resolves workspace packages to
 * their TS source so ts-jest compiles them to CJS.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@simcoin/types$': '<rootDir>/../../packages/types/src/index.ts',
    '^@simcoin/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'CommonJS',
          moduleResolution: 'node',
          isolatedModules: true,
          esModuleInterop: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          target: 'ES2022',
        },
      },
    ],
  },
};
