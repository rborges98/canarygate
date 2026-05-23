import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { orgs } from './orgs'
import { projects } from './projects'

export const inviteStatusEnum = pgEnum('invite_status', ['PENDING', 'ACCEPTED', 'DECLINED'])

export const invites = pgTable('invites', {
  id:          text('id').primaryKey(),
  orgId:       text('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
  email:       text('email').notNull(),
  orgRole:     text('org_role').notNull().default('MEMBER'),
  projectId:   text('project_id').references(() => projects.id, { onDelete: 'set null' }),
  projectRole: text('project_role'),
  token:       text('token').notNull().unique(),
  status:      inviteStatusEnum('status').notNull().default('PENDING'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  expiresAt:   timestamp('expires_at').notNull(),
})

export type Invite = typeof invites.$inferSelect
export type NewInvite = typeof invites.$inferInsert
