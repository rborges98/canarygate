import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { orgs } from './orgs.ts'

export const orgRoleEnum = pgEnum('org_role', ['OWNER', 'MEMBER'])

export const orgMembers = pgTable('org_members', {
  id:        text('id').primaryKey(),
  orgId:     text('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
  userId:    text('user_id').notNull(), // references better-auth user.id
  role:      orgRoleEnum('role').notNull().default('MEMBER'),
  joinedAt:  timestamp('joined_at').defaultNow().notNull(),
})

export type OrgMember = typeof orgMembers.$inferSelect
export type NewOrgMember = typeof orgMembers.$inferInsert
