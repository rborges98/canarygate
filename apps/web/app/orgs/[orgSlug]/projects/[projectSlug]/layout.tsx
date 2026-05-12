import { TabNav } from '@/components/tab-nav'
import { getOrgBySlugOrName } from '@/server/orgs/queries'
import { getProjectBySlug } from '@/server/projects/queries'
import { notFound } from 'next/navigation'

type Props = {
  children: React.ReactNode
  params: Promise<{ orgSlug: string; projectSlug: string }>
}

export default async function ProjectLayout({ children, params }: Props) {
  const { orgSlug, projectSlug } = await params
  const org = await getOrgBySlugOrName(orgSlug)
  if (!org) {
    notFound()
  }

  const project = await getProjectBySlug(org.id, projectSlug)
  if (!project) {
    notFound()
  }

  const tabs = [
    {
      label: 'Flags',
      href: `/orgs/${orgSlug}/projects/${projectSlug}/flags`
    },
    {
      label: 'Members',
      href: `/orgs/${orgSlug}/projects/${projectSlug}/members`
    },
    {
      label: 'Settings',
      href: `/orgs/${orgSlug}/projects/${projectSlug}/settings`
    }
  ]

  if (project.projectRole === 'ADMIN') {
    tabs.splice(1, 0, {
      label: 'History',
      href: `/orgs/${orgSlug}/projects/${projectSlug}/history`
    })
  }

  return (
    <>
      <TabNav tabs={tabs} />
      {children}
    </>
  )
}
