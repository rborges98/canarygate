import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{ orgSlug: string; projectSlug: string }>
}

export default async function ProjectPage({ params }: Props) {
  const { orgSlug, projectSlug } = await params
  redirect(`/orgs/${orgSlug}/projects/${projectSlug}/flags`)
}
