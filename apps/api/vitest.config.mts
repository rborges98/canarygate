import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'api',
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/**/*.test.ts'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
      },
      reporter: ['text', 'lcov'],
    },
    env: {
      NODE_ENV: 'test',
      BYPASS_AUTH: 'true',
    },
  },
  resolve: {
    conditions: ['node', 'import', 'require'],
  },
})
