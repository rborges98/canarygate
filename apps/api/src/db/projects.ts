import { and, count, eq, inArray } from 'drizzle-orm'
import { db } from '@canarygate/database/client'
import { projects, flags } from '@canarygate/database/schema'

function generateApiKey() {
  return `cg_live_${crypto.randomUUID().replace(/-/g, '')}`
}

export async function listProjectsByOrg(orgId: string) {
  const projs = await db.query.projects.findMany({
    where: eq(projects.orgId, orgId)
  })
  if (projs.length === 0) return []

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
}

export async function getProjectBySlug(orgId: string, slug: string) {
  return (
    (await db.query.projects.findFirst({
      where: and(eq(projects.orgId, orgId), eq(projects.slug, slug))
    })) ?? null
  )
}

export async function getProjectById(orgId: string, projectId: string) {
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.orgId, orgId))
  })
  if (!project) return null
  const [flagResult] = await db
    .select({ total: count() })
    .from(flags)
    .where(eq(flags.projectId, projectId))
  return { ...project, flagCount: flagResult?.total ?? 0 }
}

export async function createProject(
  orgId: string,
  data: { name: string; slug: string }
) {
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
}

export async function updateProject(
  orgId: string,
  projectId: string,
  data: { name: string; slug: string }
) {
  const [updated] = await db
    .update(projects)
    .set({ name: data.name, slug: data.slug, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)))
    .returning()
  return updated ?? null
}

export async function deleteProject(orgId: string, projectId: string) {
  const result = await db
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)))
    .returning()
  return result.length > 0
}

export async function toggleProject(orgId: string, projectId: string) {
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.orgId, orgId))
  })
  if (!project) return null
  const [updated] = await db
    .update(projects)
    .set({ active: !project.active, updatedAt: new Date() })
    .where(eq(projects.id, projectId))
    .returning()
  return updated ?? null
}

export async function getApiKey(orgId: string, projectId: string) {
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.orgId, orgId)),
    columns: { apiKey: true }
  })
  return project?.apiKey ?? null
}

export async function regenerateApiKey(orgId: string, projectId: string) {
  const newKey = generateApiKey()
  const [updated] = await db
    .update(projects)
    .set({ apiKey: newKey, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)))
    .returning()
  return updated ? newKey : null
}

export async function getWebhook(orgId: string, projectId: string) {
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), eq(projects.orgId, orgId)),
    columns: { webhookUrl: true }
  })
  return project !== undefined ? project.webhookUrl : undefined
}

export async function updateWebhook(
  orgId: string,
  projectId: string,
  webhookUrl: string | null
) {
  const [updated] = await db
    .update(projects)
    .set({ webhookUrl, updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)))
    .returning()
  return updated ?? null
}
