import { jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { projects } from './projects.ts'
import { flags } from './flags.ts'
import { environments } from './environments.ts'

export const flagActionEnum = pgEnum('flag_action', [
  'created',
  'updated',
  'toggled',
  'rollout_updated',
  'deleted'
])

export const auditResourceEnum = pgEnum('audit_resource', [
  'org',
  'member',
  'project',
  'project_member',
  'invite',
  'api_key',
  'webhook'
])

export const auditActionEnum = pgEnum('audit_action', [
  'created',
  'updated',
  'deleted',
  'accepted',
  'role_changed',
  'regenerated'
])

export const history = pgTable('flag_history', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  environmentId: text('environment_id').references(() => environments.id, {
    onDelete: 'set null'
  }),
  environmentSlug: text('environment_slug'),
  flagId: text('flag_id').references(() => flags.id, { onDelete: 'set null' }),
  flagKey: text('flag_key').notNull(),
  flagName: text('flag_name').notNull(),
  action: flagActionEnum('action').notNull(),
  actorEmail: text('actor_email').notNull(),
  changes: jsonb('changes'),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export const auditLog = pgTable('audit_log', {
  id: text('id').primaryKey(),
  orgId: text('org_id'),
  projectId: text('project_id'),
  resourceType: auditResourceEnum('resource_type').notNull(),
  resourceId: text('resource_id').notNull(),
  resourceName: text('resource_name'),
  action: auditActionEnum('action').notNull(),
  actorEmail: text('actor_email').notNull(),
  changes: jsonb('changes'),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export type HistoryEntry = typeof history.$inferSelect
export type NewHistoryEntry = typeof history.$inferInsert
export type AuditLogEntry = typeof auditLog.$inferSelect
export type NewAuditLogEntry = typeof auditLog.$inferInsert
