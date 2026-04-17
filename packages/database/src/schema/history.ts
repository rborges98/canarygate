import { jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { projects } from './projects.ts'
import { flags } from './flags.ts'

export const flagActionEnum = pgEnum('flag_action', [
  'created',
  'updated',
  'toggled',
  'rollout_updated',
  'deleted'
])

export const history = pgTable('flag_history', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  flagId: text('flag_id').references(() => flags.id, { onDelete: 'set null' }),
  flagKey: text('flag_key').notNull(),
  flagName: text('flag_name').notNull(),
  action: flagActionEnum('action').notNull(),
  actorEmail: text('actor_email').notNull(),
  changes: jsonb('changes'),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export type HistoryEntry = typeof history.$inferSelect
export type NewHistoryEntry = typeof history.$inferInsert
