import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  'apps/api/vitest.config.mts',
  'apps/web/vitest.config.mts',
  'apps/worker/vitest.config.mts',
  'sdks/js/vitest.config.mts',
  'packages/messaging-utils/vitest.config.mts'
])
