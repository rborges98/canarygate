import { relations } from 'drizzle-orm'
import { users } from './users.ts'
import { orgs } from './orgs.ts'
import { orgMembers } from './members.ts'
import { projects, projectMembers } from './projects.ts'
import { flags } from './flags.ts'
import { environments } from './environments.ts'
import { flagEnvironments } from './flag-environments.ts'
import { history } from './history.ts'
import { invites } from './invites.ts'

export const usersRelations = relations(users, ({ many }) => ({
  orgMembers: many(orgMembers)
}))

export const orgsRelations = relations(orgs, ({ many }) => ({
  members: many(orgMembers),
  projects: many(projects),
  invites: many(invites)
}))

export const orgMembersRelations = relations(orgMembers, ({ one, many }) => ({
  user: one(users, { fields: [orgMembers.userId], references: [users.id] }),
  org: one(orgs, { fields: [orgMembers.orgId], references: [orgs.id] }),
  projectMembers: many(projectMembers)
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  org: one(orgs, { fields: [projects.orgId], references: [orgs.id] }),
  projectMembers: many(projectMembers),
  flags: many(flags),
  environments: many(environments),
  history: many(history),
  invites: many(invites)
}))

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id]
  }),
  orgMember: one(orgMembers, {
    fields: [projectMembers.orgMemberId],
    references: [orgMembers.id]
  })
}))

export const flagsRelations = relations(flags, ({ one, many }) => ({
  project: one(projects, {
    fields: [flags.projectId],
    references: [projects.id]
  }),
  history: many(history),
  flagEnvironments: many(flagEnvironments)
}))

export const environmentsRelations = relations(
  environments,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [environments.projectId],
      references: [projects.id]
    }),
    flagEnvironments: many(flagEnvironments)
  })
)

export const flagEnvironmentsRelations = relations(
  flagEnvironments,
  ({ one }) => ({
    flag: one(flags, {
      fields: [flagEnvironments.flagId],
      references: [flags.id]
    }),
    environment: one(environments, {
      fields: [flagEnvironments.environmentId],
      references: [environments.id]
    })
  })
)

export const historyRelations = relations(history, ({ one }) => ({
  project: one(projects, {
    fields: [history.projectId],
    references: [projects.id]
  }),
  flag: one(flags, { fields: [history.flagId], references: [flags.id] }),
  environment: one(environments, {
    fields: [history.environmentId],
    references: [environments.id]
  })
}))

export const invitesRelations = relations(invites, ({ one }) => ({
  org: one(orgs, { fields: [invites.orgId], references: [orgs.id] }),
  project: one(projects, {
    fields: [invites.projectId],
    references: [projects.id]
  })
}))
