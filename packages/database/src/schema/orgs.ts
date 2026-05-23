import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const orgs = pgTable('orgs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export type Org = typeof orgs.$inferSelect
export type NewOrg = typeof orgs.$inferInsert
