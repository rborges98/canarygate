import { and, eq } from 'drizzle-orm'
import { db } from '@canarygate/database/client'
import { orgMembers, projects } from '@canarygate/database/schema'

export async function getOrgMemberByUserId(orgId: string, userId: string) {
  return db.query.orgMembers.findFirst({
    where: and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId))
  })
}

export async function getProjectInOrg(orgId: string, projectId: string) {
  return db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.orgId, orgId)),
    columns: { id: true, active: true }
  })
}
