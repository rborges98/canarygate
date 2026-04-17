import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

// Tabela gerenciada pelo Better Auth — definida aqui para permitir joins via Drizzle
export const users = pgTable('user', {
  id:            text('id').primaryKey(),
  name:          text('name').notNull(),
  email:         text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image:         text('image'),
  createdAt:     timestamp('created_at').notNull(),
  updatedAt:     timestamp('updated_at').notNull(),
})

export type User    = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
