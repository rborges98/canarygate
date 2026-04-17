import { notFound } from 'next/navigation'
import { getInvite } from '@/server/invites/queries'
import { InviteActions } from '@/components/invite-actions'

interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const invite = await getInvite(token)
  if (!invite) notFound()

  return (
    <div className="grad-border-inner flex flex-col items-center p-6 text-center md:p-8">
      <div className="bg-cg-indigo-800 border-cg-indigo-600 mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border text-2xl">
        🎟
      </div>
      <h2 className="mb-1 text-[20px] font-bold text-white">
        You&apos;ve been invited
      </h2>
      <p className="text-cg-neutral-300 mb-1 text-[12px]">to join</p>
      <p className="mb-2 text-[18px] font-bold text-white">{invite.orgName}</p>
      <span className="bg-cg-indigo-950 text-cg-indigo-100 border-cg-indigo-600 mb-7 rounded-full border px-2.5 py-1 font-mono text-[10px]">
        {invite.orgRole}
      </span>
      {invite.projectName && (
        <p className="text-cg-neutral-400 mb-4 text-[11px]">
          Project: <span className="text-white">{invite.projectName}</span>
          {invite.projectRole && (
            <span className="text-cg-neutral-500 ml-1">
              ({invite.projectRole})
            </span>
          )}
        </p>
      )}
      <InviteActions token={token} />
    </div>
  )
}
