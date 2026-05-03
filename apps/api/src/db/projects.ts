import { and, count, eq, inArray } from 'drizzle-orm'
import { db } from '@canarygate/database/client'
import { projects, flags, projectMembers } from '@canarygate/database/schema'
import type { FastifyBaseLogger } from 'fastify'

function generateApiKey() {
  return `cg_live_${crypto.randomUUID().replace(/-/g, '')}`
}

export async function listProjectsByOrg(
  orgId: string,
  orgMemberId?: string,
  log?: FastifyBaseLogger
) {
  try {
    let projs
    let adminProjectIds = new Set<string>()

    if (orgMemberId) {
      const accessRows = await db.query.projectMembers.findMany({
        where: eq(projectMembers.orgMemberId, orgMemberId),
        columns: { projectId: true, role: true }
      })
      const accessibleIds = accessRows.map((r) => r.projectId)
      if (accessibleIds.length === 0) {
        return []
      }

      adminProjectIds = new Set(
        accessRows
          .filter((row) => row.role === 'ADMIN')
          .map((row) => row.projectId)
      )

      projs = await db.query.projects.findMany({
        where: and(
          eq(projects.orgId, orgId),
          inArray(projects.id, accessibleIds)
        )
      })

      projs = projs.filter((project) => {
        return project.active || adminProjectIds.has(project.id)
      })
    } else {
      projs = await db.query.projects.findMany({
        where: eq(projects.orgId, orgId)
      })
    }

    if (projs.length === 0) {
      return []
    }

    const projectIds = projs.map((p) => p.id)
    const flagCounts = await db
      .select({ projectId: flags.projectId, total: count() })
      .from(flags)
      .where(inArray(flags.projectId, projectIds))
      .groupBy(flags.projectId)

    return projs.map((p) => ({
      ...p,
      flagCount: flagCounts.find((f) => f.projectId === p.id)?.total ?? 0
    }))
  } catch (error) {
    log?.error(
      { err: error, scope: 'db.projects.listProjectsByOrg', orgId, orgMemberId },
      'Failed in db.projects.listProjectsByOrg'
    )
    throw error
  }
}

export async function getProjectBySlug(
  orgId: string,
  slug: string,
  log?: FastifyBaseLogger
) {
  try {
    return (
      (await db.query.projects.findFirst({
        where: and(eq(projects.orgId, orgId), eq(projects.slug, slug))
      })) ?? null
    )
  } catch (error) {
    log?.error(
      { err: error, scope: 'db.projects.getProjectBySlug', orgId, slug },
      'Failed in db.projects.getProjectBySlug'
    )
    throw error
  }
}

export async function getProjectBySlugForOrgMember(
  orgId: string,
  slug: string,
  orgMemberId: string,
  log?: FastifyBaseLogger
) {
  try {
    const project = await getProjectBySlug(orgId, slug, log)
    if (!project) {
      return null
    }

    const projectMembership = await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.orgMemberId, orgMemberId),
        eq(projectMembers.projectId, project.id)
      ),
      columns: { role: true }
    })

    if (!projectMembership) {
      return null
    }

    if (!project.active && projectMembership.role !== 'ADMIN') {
      return null
    }

    return {
      ...project,
      projectRole: projectMembership.role as 'ADMIN' | 'MEMBER'
    }
  } catch (error) {
    log?.error(
      {
        err: error,
        scope: 'db.projects.getProjectBySlugForOrgMember',
        orgId,
        slug,
        orgMemberId
      },
      'Failed in db.projects.getProjectBySlugForOrgMember'
    )
    throw error
  }
}

export async function getProjectById(
  orgId: string,
  projectId: string,
  log?: FastifyBaseLogger
) {
  try {
    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.orgId, orgId))
    })

    if (!project) {
      return null
    }

    const [flagResult] = await db
      .select({ total: count() })
      .from(flags)
      .where(eq(flags.projectId, projectId))
    return { ...project, flagCount: flagResult?.total ?? 0 }
  } catch (error) {
    log?.error(
      { err: error, scope: 'db.projects.getProjectById', orgId, projectId },
      'Failed in db.projects.getProjectById'
    )
    throw error
  }
}

export async function createProject(
  orgId: string,
  data: { name: string; slug: string },
  log?: FastifyBaseLogger
) {
  try {
    const [project] = await db
      .insert(projects)
      .values({
        id: crypto.randomUUID(),
        orgId,
        name: data.name,
        slug: data.slug,
        apiKey: generateApiKey(),
        active: true
      })
      .returning()
    return { ...project, flagCount: 0 }
  } catch (error) {
    log?.error(
      {
        err: error,
        scope: 'db.projects.createProject',
        orgId,
        slug: data.slug
      },
      'Failed in db.projects.createProject'
    )
    throw error
  }
}

export async function updateProject(
  orgId: string,
  projectId: string,
  data: { name: string; slug: string },
  log?: FastifyBaseLogger
) {
  try {
    const [updated] = await db
      .update(projects)
      .set({ name: data.name, slug: data.slug, updatedAt: new Date() })
      .where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)))
      .returning()
    return updated ?? null
  } catch (error) {
    log?.error(
      {
        err: error,
        scope: 'db.projects.updateProject',
        orgId,
        projectId,
        slug: data.slug
      },
      'Failed in db.projects.updateProject'
    )
    throw error
  }
}

export async function deleteProject(
  orgId: string,
  projectId: string,
  log?: FastifyBaseLogger
) {
  try {
    const result = await db
      .delete(projects)
      .where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)))
      .returning()
    return result.length > 0
  } catch (error) {
    log?.error(
      { err: error, scope: 'db.projects.deleteProject', orgId, projectId },
      'Failed in db.projects.deleteProject'
    )
    throw error
  }
}

export async function toggleProject(
  orgId: string,
  projectId: string,
  log?: FastifyBaseLogger
) {
  try {
    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.orgId, orgId))
    })

    if (!project) {
      return null
    }

    const [updated] = await db
      .update(projects)
      .set({ active: !project.active, updatedAt: new Date() })
      .where(eq(projects.id, projectId))
      .returning()
    return updated ?? null
  } catch (error) {
    log?.error(
      { err: error, scope: 'db.projects.toggleProject', orgId, projectId },
      'Failed in db.projects.toggleProject'
    )
    throw error
  }
}

export async function getApiKey(
  orgId: string,
  projectId: string,
  log?: FastifyBaseLogger
) {
  try {
    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.orgId, orgId)),
      columns: { apiKey: true }
    })
    return project?.apiKey ?? null
  } catch (error) {
    log?.error(
      { err: error, scope: 'db.projects.getApiKey', orgId, projectId },
      'Failed in db.projects.getApiKey'
    )
    throw error
  }
}

export async function regenerateApiKey(
  orgId: string,
  projectId: string,
  log?: FastifyBaseLogger
) {
  try {
    const newKey = generateApiKey()
    const [updated] = await db
      .update(projects)
      .set({ apiKey: newKey, updatedAt: new Date() })
      .where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)))
      .returning()
    return updated ? newKey : null
  } catch (error) {
    log?.error(
      {
        err: error,
        scope: 'db.projects.regenerateApiKey',
        orgId,
        projectId
      },
      'Failed in db.projects.regenerateApiKey'
    )
    throw error
  }
}

export async function getWebhook(
  orgId: string,
  projectId: string,
  log?: FastifyBaseLogger
) {
  try {
    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.orgId, orgId)),
      columns: { webhookUrl: true }
    })
    return project !== undefined ? project.webhookUrl : undefined
  } catch (error) {
    log?.error(
      { err: error, scope: 'db.projects.getWebhook', orgId, projectId },
      'Failed in db.projects.getWebhook'
    )
    throw error
  }
}

export async function updateWebhook(
  orgId: string,
  projectId: string,
  webhookUrl: string | null,
  log?: FastifyBaseLogger
) {
  try {
    const [updated] = await db
      .update(projects)
      .set({ webhookUrl, updatedAt: new Date() })
      .where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)))
      .returning()
    return updated ?? null
  } catch (error) {
    log?.error(
      {
        err: error,
        scope: 'db.projects.updateWebhook',
        orgId,
        projectId,
        webhookConfigured: webhookUrl !== null
      },
      'Failed in db.projects.updateWebhook'
    )
    throw error
  }
}
