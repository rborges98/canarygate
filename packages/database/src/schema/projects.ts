import { boolean, index, pgEnum, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core'
import { orgs } from './orgs'
import { orgMembers } from './members'

export const projectRoleEnum = pgEnum('project_role', ['ADMIN', 'MEMBER'])

export const projects = pgTable('projects', {
  id:         text('id').primaryKey(),
  orgId:      text('org_id').notNull().references(() => orgs.id, { onDelete: 'cascade' }),
  name:       text('name').notNull(),
  slug:       text('slug').notNull(),
  apiKey:        text('api_key').notNull().unique(),
  webhookUrl:    text('webhook_url'),
  webhookSecret: text('webhook_secret'),
  active:        boolean('active').notNull().default(true),
  createdAt:  timestamp('created_at').defaultNow().notNull(),
  updatedAt:  timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  unique('projects_org_id_slug_unique').on(t.orgId, t.slug)
])

export const projectMembers = pgTable('project_members', {
  id:          text('id').primaryKey(),
  projectId:   text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  orgMemberId: text('org_member_id').notNull().references(() => orgMembers.id, { onDelete: 'cascade' }),
  role:        projectRoleEnum('role').notNull().default('MEMBER'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('project_members_org_member_id_project_id_idx').on(t.orgMemberId, t.projectId)
])

export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type ProjectMember = typeof projectMembers.$inferSelect
export type NewProjectMember = typeof projectMembers.$inferInsert
