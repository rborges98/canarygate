import type { FastifyRequest, FastifyReply } from 'fastify'
import { and, eq } from 'drizzle-orm'
import { db } from '@canarygate/database/client'
import { projectMembers } from '@canarygate/database/schema'
import {
  getOrgMemberByUserId as getOrgMembership,
  getProjectInOrg
} from '../utils/access.ts'

export async function requireOrgMember(
  request: FastifyRequest<{ Params: { orgId: string } }>,
  reply: FastifyReply
) {
  const { orgId } = request.params
  if (!orgId) {
    return reply.status(400).send({ message: 'Missing orgId' })
  }

  const membership = await getOrgMembership(orgId, request.userId)
  if (!membership) {
    return reply.status(403).send({ message: 'Forbidden' })
  }

  request.orgRole = membership.role as 'OWNER' | 'MEMBER'
}

export async function requireOrgOwner(
  request: FastifyRequest<{ Params: { orgId: string } }>,
  reply: FastifyReply
) {
  const { orgId } = request.params
  if (!orgId) {
    return reply.status(400).send({ message: 'Missing orgId' })
  }

  const membership = await getOrgMembership(orgId, request.userId)
  if (!membership) {
    return reply.status(403).send({ message: 'Forbidden' })
  }

  if (membership.role !== 'OWNER') {
    return reply.status(403).send({ message: 'Owner access required' })
  }

  request.orgRole = 'OWNER'
}

async function getProjectMembership(orgMemberId: string, projectId: string) {
  return db.query.projectMembers.findFirst({
    where: and(
      eq(projectMembers.orgMemberId, orgMemberId),
      eq(projectMembers.projectId, projectId)
    )
  })
}

export async function requireProjectAccess(
  request: FastifyRequest<{ Params: { orgId: string; projectId: string } }>,
  reply: FastifyReply
) {
  const { orgId, projectId } = request.params
  if (!orgId) {
    return reply.status(400).send({ message: 'Missing orgId' })
  }

  if (!projectId) {
    return reply.status(400).send({ message: 'Missing projectId' })
  }

  const membership = await getOrgMembership(orgId, request.userId)
  if (!membership) {
    return reply.status(403).send({ message: 'Forbidden' })
  }

  request.orgRole = membership.role as 'OWNER' | 'MEMBER'

  const project = await getProjectInOrg(orgId, projectId)
  if (!project) {
    return reply.status(404).send({ message: 'Project not found' })
  }

  if (request.orgRole === 'OWNER') {
    request.projectRole = 'ADMIN'
    return
  }

  const projectMembership = await getProjectMembership(membership.id, projectId)
  if (!projectMembership) {
    return reply.status(403).send({ message: 'Forbidden' })
  }

  if (!project.active && projectMembership.role !== 'ADMIN') {
    return reply.status(404).send({ message: 'Project not found' })
  }

  request.projectRole = projectMembership.role as 'ADMIN' | 'MEMBER'
}

export async function requireProjectAdmin(
  request: FastifyRequest<{ Params: { orgId: string; projectId: string } }>,
  reply: FastifyReply
) {
  const { orgId, projectId } = request.params
  if (!orgId) {
    return reply.status(400).send({ message: 'Missing orgId' })
  }

  if (!projectId) {
    return reply.status(400).send({ message: 'Missing projectId' })
  }

  const membership = await getOrgMembership(orgId, request.userId)
  if (!membership) {
    return reply.status(403).send({ message: 'Forbidden' })
  }

  request.orgRole = membership.role as 'OWNER' | 'MEMBER'

  const project = await getProjectInOrg(orgId, projectId)
  if (!project) {
    return reply.status(404).send({ message: 'Project not found' })
  }

  if (request.orgRole === 'OWNER') {
    request.projectRole = 'ADMIN'
    return
  }

  const projectMembership = await getProjectMembership(membership.id, projectId)
  if (!projectMembership || projectMembership.role !== 'ADMIN') {
    return reply.status(403).send({ message: 'Project admin access required' })
  }

  request.projectRole = 'ADMIN'
}
