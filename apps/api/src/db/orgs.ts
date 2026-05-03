import { count, eq, inArray } from 'drizzle-orm'
import { db } from '@canarygate/database/client'
import { orgs, orgMembers, projects } from '@canarygate/database/schema'
import type { FastifyBaseLogger } from 'fastify'

export async function listOrgsForUser(userId: string, log?: FastifyBaseLogger) {
  try {
    const memberships = await db.query.orgMembers.findMany({
      where: eq(orgMembers.userId, userId),
      with: { org: true }
    })

    if (memberships.length === 0) {
      return []
    }

    const orgIds = memberships.map((m) => m.orgId)

    const [memberCounts, projectCounts] = await Promise.all([
      db
        .select({ orgId: orgMembers.orgId, total: count() })
        .from(orgMembers)
        .where(inArray(orgMembers.orgId, orgIds))
        .groupBy(orgMembers.orgId),
      db
        .select({ orgId: projects.orgId, total: count() })
        .from(projects)
        .where(inArray(projects.orgId, orgIds))
        .groupBy(projects.orgId)
    ])

    return memberships.map((m) => ({
      ...m.org,
      role: m.role,
      memberCount: memberCounts.find((c) => c.orgId === m.orgId)?.total ?? 0,
      projectCount: projectCounts.find((c) => c.orgId === m.orgId)?.total ?? 0
    }))
  } catch (error) {
    log?.error(
      { err: error, scope: 'db.orgs.listOrgsForUser', userId },
      'Failed in db.orgs.listOrgsForUser'
    )
    throw error
  }
}

export async function getOrgBySlug(slug: string, log?: FastifyBaseLogger) {
  try {
    return (
      (await db.query.orgs.findFirst({ where: eq(orgs.slug, slug) })) ?? null
    )
  } catch (error) {
    log?.error(
      { err: error, scope: 'db.orgs.getOrgBySlug', slug },
      'Failed in db.orgs.getOrgBySlug'
    )
    throw error
  }
}

export async function getOrgById(orgId: string, log?: FastifyBaseLogger) {
  try {
    const org = await db.query.orgs.findFirst({ where: eq(orgs.id, orgId) })

    if (!org) {
      return null
    }

    const [memberResult, projectResult] = await Promise.all([
      db
        .select({ total: count() })
        .from(orgMembers)
        .where(eq(orgMembers.orgId, orgId)),
      db
        .select({ total: count() })
        .from(projects)
        .where(eq(projects.orgId, orgId))
    ])

    return {
      ...org,
      memberCount: memberResult[0]?.total ?? 0,
      projectCount: projectResult[0]?.total ?? 0
    }
  } catch (error) {
    log?.error(
      { err: error, scope: 'db.orgs.getOrgById', orgId },
      'Failed in db.orgs.getOrgById'
    )
    throw error
  }
}

export async function createOrg(
  data: { name: string; slug: string },
  userId: string,
  log?: FastifyBaseLogger
) {
  try {
    const orgId = crypto.randomUUID()
    const [org] = await db
      .insert(orgs)
      .values({ id: orgId, name: data.name, slug: data.slug })
      .returning()
    await db.insert(orgMembers).values({
      id: crypto.randomUUID(),
      orgId,
      userId,
      role: 'OWNER'
    })
    return org
  } catch (error) {
    log?.error(
      { err: error, scope: 'db.orgs.createOrg', userId, slug: data.slug },
      'Failed in db.orgs.createOrg'
    )
    throw error
  }
}

export async function updateOrg(
  orgId: string,
  data: { name: string; slug: string },
  log?: FastifyBaseLogger
) {
  try {
    const [updated] = await db
      .update(orgs)
      .set({ name: data.name, slug: data.slug, updatedAt: new Date() })
      .where(eq(orgs.id, orgId))
      .returning()
    return updated ?? null
  } catch (error) {
    log?.error(
      { err: error, scope: 'db.orgs.updateOrg', orgId, slug: data.slug },
      'Failed in db.orgs.updateOrg'
    )
    throw error
  }
}

export async function deleteOrg(orgId: string, log?: FastifyBaseLogger) {
  try {
    const result = await db.delete(orgs).where(eq(orgs.id, orgId)).returning()
    return result.length > 0
  } catch (error) {
    log?.error(
      { err: error, scope: 'db.orgs.deleteOrg', orgId },
      'Failed in db.orgs.deleteOrg'
    )
    throw error
  }
}
