import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { projects } from './projects.ts'

export const flagTypeEnum       = pgEnum('flag_type',       ['boolean', 'rollout'])
export const scheduleActionEnum = pgEnum('schedule_action', ['enable', 'disable', 'rollout'])
export const everyUnitEnum      = pgEnum('every_unit',      ['hours', 'days', 'weeks'])

export const flags = pgTable('flags', {
  id:          text('id').primaryKey(),
  projectId:   text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name:        text('name').notNull(),
  key:         text('key').notNull(),
  description: text('description').notNull().default(''),
  type:        flagTypeEnum('type').notNull().default('boolean'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull()
})

export type Flag    = typeof flags.$inferSelect
export type NewFlag = typeof flags.$inferInsert
