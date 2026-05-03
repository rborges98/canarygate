import { and, eq } from 'drizzle-orm'
import { db } from '@canarygate/database/client'
import {
  orgMembers,
  projectMembers
} from '@canarygate/database/schema'
import type { FastifyBaseLogger } from 'fastify'
import {
  getOrgMemberByUserId,
  getProjectInOrg
} from '../utils/access.ts'

export async function listMembers(orgId: string, log?: FastifyBaseLogger) {
  try {
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
  } catch (error) {
    log?.error(
      { err: error, scope: 'db.members.listMembers', orgId },
      'Failed in db.members.listMembers'
    )
    throw error
  }
}

export async function getMemberSummary(
  orgId: string,
  userId: string,
  log?: FastifyBaseLogger
) {
  try {
    const member = await db.query.orgMembers.findFirst({
      where: and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId)),
      with: { user: true }
    })

    if (!member) {
      return null
    }

    return {
      userId: member.userId,
      email: member.user?.email ?? '',
      role: member.role
    }
  } catch (error) {
    log?.error(
      { err: error, scope: 'db.members.getMemberSummary', orgId, userId },
      'Failed in db.members.getMemberSummary'
    )
    throw error
  }
}

export async function removeMember(
  orgId: string,
  userId: string,
  log?: FastifyBaseLogger
) {
  try {
    const member = await getOrgMemberByUserId(orgId, userId)
    if (!member) {
      return false
    }

    await db.delete(orgMembers).where(eq(orgMembers.id, member.id))
    return true
  } catch (error) {
    log?.error(
      { err: error, scope: 'db.members.removeMember', orgId, userId },
      'Failed in db.members.removeMember'
    )
    throw error
  }
}

export async function makeOwner(
  orgId: string,
  userId: string,
  log?: FastifyBaseLogger
) {
  try {
    const member = await getOrgMemberByUserId(orgId, userId)
    if (!member) {
      return null
    }

    const [updated] = await db
      .update(orgMembers)
      .set({ role: 'OWNER' })
      .where(eq(orgMembers.id, member.id))
      .returning()
    return updated ?? null
  } catch (error) {
    log?.error(
      { err: error, scope: 'db.members.makeOwner', orgId, userId },
      'Failed in db.members.makeOwner'
    )
    throw error
  }
}

export async function getMemberProjectAccess(
  orgId: string,
  userId: string,
  log?: FastifyBaseLogger
) {
  try {
    const member = await db.query.orgMembers.findFirst({
      where: and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId)),
      with: { projectMembers: { with: { project: true } } }
    })

    if (!member) {
      return null
    }

    return member.projectMembers.map((pm) => ({
      projectId: pm.projectId,
      name: pm.project?.name ?? pm.projectId,
      role: pm.role
    }))
  } catch (error) {
    log?.error(
      {
        err: error,
        scope: 'db.members.getMemberProjectAccess',
        orgId,
        userId
      },
      'Failed in db.members.getMemberProjectAccess'
    )
    throw error
  }
}

export async function addProjectAccess(
  orgId: string,
  userId: string,
  data: { projectId: string; role: 'ADMIN' | 'MEMBER' },
  log?: FastifyBaseLogger
) {
  try {
    const member = await getOrgMemberByUserId(orgId, userId)
    if (!member) {
      return null
    }

    const project = await getProjectInOrg(orgId, data.projectId)
    if (!project) {
      return null
    }

    await db.insert(projectMembers).values({
      id: crypto.randomUUID(),
      projectId: data.projectId,
      orgMemberId: member.id,
      role: data.role
    })
    return getMemberProjectAccess(orgId, userId, log)
  } catch (error) {
    log?.error(
      {
        err: error,
        scope: 'db.members.addProjectAccess',
        orgId,
        userId,
        projectId: data.projectId
      },
      'Failed in db.members.addProjectAccess'
    )
    throw error
  }
}

export async function updateProjectAccess(
  orgId: string,
  userId: string,
  projectId: string,
  role: 'ADMIN' | 'MEMBER',
  log?: FastifyBaseLogger
) {
  try {
    const member = await getOrgMemberByUserId(orgId, userId)
    if (!member) {
      return null
    }

    const project = await getProjectInOrg(orgId, projectId)
    if (!project) {
      return null
    }

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
  } catch (error) {
    log?.error(
      {
        err: error,
        scope: 'db.members.updateProjectAccess',
        orgId,
        userId,
        projectId
      },
      'Failed in db.members.updateProjectAccess'
    )
    throw error
  }
}

export async function removeProjectAccess(
  orgId: string,
  userId: string,
  projectId: string,
  log?: FastifyBaseLogger
) {
  try {
    const member = await getOrgMemberByUserId(orgId, userId)
    if (!member) {
      return false
    }

    const project = await getProjectInOrg(orgId, projectId)
    if (!project) {
      return false
    }

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
  } catch (error) {
    log?.error(
      {
        err: error,
        scope: 'db.members.removeProjectAccess',
        orgId,
        userId,
        projectId
      },
      'Failed in db.members.removeProjectAccess'
    )
    throw error
  }
}
