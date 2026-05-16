import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'sdk-js',
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
      },
      reporter: ['text', 'lcov'],
    },
    env: {
      NODE_ENV: 'test',
    },
  },
})
