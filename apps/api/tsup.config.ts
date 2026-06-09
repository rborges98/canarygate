import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  outDir: 'dist',
  clean: true,
  noExternal: [
    '@canarygate/database',
    '@canarygate/redis',
    '@canarygate/logger',
    '@canarygate/messaging-utils'
  ]
})
