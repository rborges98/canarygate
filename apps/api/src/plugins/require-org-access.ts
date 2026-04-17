import type { FastifyRequest, FastifyReply } from 'fastify'
import { and, eq } from 'drizzle-orm'
import { db } from '@canarygate/database/client'
import { orgMembers } from '@canarygate/database/schema'

async function getOrgMembership(orgId: string, userId: string) {
  return db.query.orgMembers.findFirst({
    where: and(eq(orgMembers.orgId, orgId), eq(orgMembers.userId, userId))
  })
}

export async function requireOrgMember(
  request: FastifyRequest<{ Params: { orgId: string } }>,
  reply: FastifyReply
) {
  const { orgId } = request.params
  if (!orgId) return reply.status(400).send({ message: 'Missing orgId' })

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
  if (!orgId) return reply.status(400).send({ message: 'Missing orgId' })

  const membership = await getOrgMembership(orgId, request.userId)
  if (!membership) {
    return reply.status(403).send({ message: 'Forbidden' })
  }
  if (membership.role !== 'OWNER') {
    return reply.status(403).send({ message: 'Owner access required' })
  }
  request.orgRole = 'OWNER'
}
