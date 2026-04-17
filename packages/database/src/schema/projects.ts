import { boolean, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { orgs } from './orgs.ts'
import { orgMembers } from './members.ts'

export const projectRoleEnum = pgEnum('project_role', ['ADMIN', 'MEMBER'])

export const projects = pgTable('projects', {
  id:         text('id').primaryKey(),
  orgId:      text('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
  name:       text('name').notNull(),
  slug:       text('slug').notNull(),
  apiKey:     text('api_key').notNull().unique(),
  webhookUrl: text('webhook_url'),
  active:     boolean('active').notNull().default(true),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
  updatedAt:  timestamp('updated_at').defaultNow().notNull(),
})

export const projectMembers = pgTable('project_members', {
  id:          text('id').primaryKey(),
  projectId:   text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  orgMemberId: text('org_member_id').notNull().references(() => orgMembers.id, { onDelete: 'cascade' }),
  role:        projectRoleEnum('role').notNull().default('MEMBER'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
})

export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type ProjectMember = typeof projectMembers.$inferSelect
export type NewProjectMember = typeof projectMembers.$inferInsert
