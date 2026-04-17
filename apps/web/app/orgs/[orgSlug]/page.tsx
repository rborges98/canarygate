import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{ orgSlug: string }>
}

export default async function OrgPage({ params }: Props) {
  const { orgSlug } = await params
  redirect(`/orgs/${orgSlug}/projects`)
}
