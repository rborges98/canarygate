import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'web',
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      include: ['server/**/*.ts', 'components/**/*.tsx', 'shared/**/*.ts'],
      exclude: ['**/*.test.{ts,tsx}', '**/node_modules/**'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60
      },
      reporter: ['text', 'lcov']
    },
    env: {
      NODE_ENV: 'test'
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.')
    }
  }
})
