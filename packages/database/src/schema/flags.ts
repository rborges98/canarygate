import { boolean, integer, pgEnum, pgTable, real, text, timestamp } from 'drizzle-orm/pg-core'
import { projects } from './projects.ts'

export const flagTypeEnum = pgEnum('flag_type', ['boolean', 'rollout'])

export const flags = pgTable('flags', {
  id:             text('id').primaryKey(),
  projectId:      text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name:           text('name').notNull(),
  key:            text('key').notNull(),
  description:    text('description').notNull().default(''),
  type:           flagTypeEnum('type').notNull().default('boolean'),
  enabled:        boolean('enabled').notNull().default(false),
  rolloutPercent: real('rollout_percent').notNull().default(0),
  createdAt:      timestamp('created_at').defaultNow().notNull(),
  updatedAt:      timestamp('updated_at').defaultNow().notNull(),
})

export type Flag = typeof flags.$inferSelect
export type NewFlag = typeof flags.$inferInsert
