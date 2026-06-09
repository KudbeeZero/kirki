/**
 * Tests compile through ts-jest to CommonJS (production build stays NodeNext
 * ESM via tsconfig). The moduleNameMapper strips the `.js` extension that
 * NodeNext-style relative imports carry, so they resolve to the `.ts` sources.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
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
