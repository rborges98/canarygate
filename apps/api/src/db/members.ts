import { and, eq } from 'drizzle-orm'
import { db } from '@canarygate/database/client'
import { orgMembers, projectMembers } from '@canarygate/database/schema'

export async function listMembers(orgId: string) {
  const members = await db.query.orgMembers.findMany({
    where: eq(orgMembers.orgId, orgId),
    with: {
      user: true,
      projectMembers: {
        with: { project: true }
      }
    }
  })

  return members.map((m) => ({
    id: m.id,
    userId: m.userId,
    name: m.user?.name ?? m.userId,
    email: m.user?.email ?? '',
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
    projects: m.projectMembers.map((pm) => ({
      projectId: pm.projectId,
      name: pm.project?.name ?? pm.projectId,
      role: pm.role
    }))
  }))
}

async function getOrgMemberByUserId(orgId: string, userId: string) {
  return db.query.orgMembers.findFirst({
    where: and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId))
  })
}

export async function removeMember(orgId: string, userId: string) {
  const member = await getOrgMemberByUserId(orgId, userId)
  if (!member) return false
  await db.delete(orgMembers).where(eq(orgMembers.id, member.id))
  return true
}

export async function makeOwner(orgId: string, userId: string) {
  const member = await getOrgMemberByUserId(orgId, userId)
  if (!member) return null
  const [updated] = await db
    .update(orgMembers)
    .set({ role: 'OWNER' })
    .where(eq(orgMembers.id, member.id))
    .returning()
  return updated ?? null
}

export async function getMemberProjectAccess(orgId: string, userId: string) {
  const member = await db.query.orgMembers.findFirst({
    where: and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId)),
    with: { projectMembers: { with: { project: true } } }
  })
  if (!member) return null
  return member.projectMembers.map((pm) => ({
    projectId: pm.projectId,
    name: pm.project?.name ?? pm.projectId,
    role: pm.role
  }))
}

export async function addProjectAccess(
  orgId: string,
  userId: string,
  data: { projectId: string; role: 'ADMIN' | 'MEMBER' }
) {
  const member = await getOrgMemberByUserId(orgId, userId)
  if (!member) return null
  await db.insert(projectMembers).values({
    id: crypto.randomUUID(),
    projectId: data.projectId,
    orgMemberId: member.id,
    role: data.role
  })
  return getMemberProjectAccess(orgId, userId)
}

export async function updateProjectAccess(
  orgId: string,
  userId: string,
  projectId: string,
  role: 'ADMIN' | 'MEMBER'
) {
  const member = await getOrgMemberByUserId(orgId, userId)
  if (!member) return null
  const [updated] = await db
    .update(projectMembers)
    .set({ role })
    .where(
      and(
        eq(projectMembers.orgMemberId, member.id),
        eq(projectMembers.projectId, projectId)
      )
    )
    .returning()
  return updated ?? null
}

export async function removeProjectAccess(
  orgId: string,
  userId: string,
  projectId: string
) {
  const member = await getOrgMemberByUserId(orgId, userId)
  if (!member) return false
  const result = await db
    .delete(projectMembers)
    .where(
      and(
        eq(projectMembers.orgMemberId, member.id),
        eq(projectMembers.projectId, projectId)
      )
    )
    .returning()
  return result.length > 0
}
