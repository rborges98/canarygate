import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { projects } from './projects'

export const environments = pgTable('environments', {
  id:        text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name:      text('name').notNull(),
  slug:      text('slug').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export type Environment    = typeof environments.$inferSelect
export type NewEnvironment = typeof environments.$inferInsert
