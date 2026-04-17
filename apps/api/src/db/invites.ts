import { eq } from 'drizzle-orm'
import { db } from '@canarygate/database/client'
import {
  invites,
  orgMembers,
  projectMembers
} from '@canarygate/database/schema'

export async function getInviteByToken(token: string) {
  return db.query.invites.findFirst({
    where: eq(invites.token, token),
    with: { org: true, project: true }
  })
}

export async function createInvite(
  orgId: string,
  data: {
    email: string
    orgRole: 'OWNER' | 'MEMBER'
    projectId?: string
    projectRole?: 'ADMIN' | 'MEMBER'
  }
) {
  const [invite] = await db
    .insert(invites)
    .values({
      id: crypto.randomUUID(),
      orgId,
      email: data.email,
      orgRole: data.orgRole,
      projectId: data.projectId ?? null,
      projectRole: data.projectRole ?? null,
      token: crypto.randomUUID(),
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })
    .returning()
  return invite
}

export async function acceptInvite(
  token: string,
  userId: string,
  userEmail: string
) {
  const invite = await db.query.invites.findFirst({
    where: eq(invites.token, token)
  })
  if (!invite || invite.status !== 'PENDING') return null
  if (new Date() > invite.expiresAt) return null
  if (invite.email.toLowerCase() !== userEmail.toLowerCase()) return null

  await db.transaction(async (tx) => {
    const memberId = crypto.randomUUID()
    await tx.insert(orgMembers).values({
      id: memberId,
      orgId: invite.orgId,
      userId,
      role: invite.orgRole as 'OWNER' | 'MEMBER'
    })
    if (invite.projectId && invite.projectRole) {
      await tx.insert(projectMembers).values({
        id: crypto.randomUUID(),
        projectId: invite.projectId,
        orgMemberId: memberId,
        role: invite.projectRole as 'ADMIN' | 'MEMBER'
      })
    }
    await tx
      .update(invites)
      .set({ status: 'ACCEPTED' })
      .where(eq(invites.id, invite.id))
  })

  return true
}

export async function declineInvite(token: string, userEmail: string) {
  const invite = await db.query.invites.findFirst({
    where: eq(invites.token, token)
  })
  if (!invite || invite.status !== 'PENDING') return null
  if (invite.email.toLowerCase() !== userEmail.toLowerCase()) return null
  await db
    .update(invites)
    .set({ status: 'DECLINED' })
    .where(eq(invites.id, invite.id))
  return true
}
