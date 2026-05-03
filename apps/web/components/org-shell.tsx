'use client'

import { useSelectedLayoutSegments } from 'next/navigation'
import { Nav } from '@/components/nav'
import { TabNav } from '@/components/tab-nav'

type OrgShellProps = {
  orgSlug: string
  orgName: string
  children: React.ReactNode
}

export function OrgShell({ orgSlug, orgName, children }: OrgShellProps) {
  // Called from [orgSlug]/layout — segments are relative to that level:
  // /orgs/acme/projects              → ['projects']
  // /orgs/acme/members               → ['members']
  // /orgs/acme/projects/web/flags    → ['projects', 'web', 'flags']
  const segments = useSelectedLayoutSegments().filter(
    (segment) => !(segment.startsWith('(') && segment.endsWith(')'))
  )

  const isProjectDepth =
    segments[0] === 'projects' && segments.length >= 2 && segments[1] !== 'new'
  const projectSlug = isProjectDepth ? segments[1] : null

  if (projectSlug) {
    return (
      <>
        <Nav
          org={{ label: orgName, orgSlug }}
          project={{ label: projectSlug, projectSlug }}
        />
        <div className="relative z-10 flex-1 overflow-y-auto">{children}</div>
      </>
    )
  }

  return (
    <>
      <Nav org={{ label: orgName, orgSlug }} />
      <TabNav
        tabs={[
          { label: 'Projects', href: `/orgs/${orgSlug}/projects` },
          { label: 'Members', href: `/orgs/${orgSlug}/members` },
          { label: 'Settings', href: `/orgs/${orgSlug}/settings` }
        ]}
      />
      <div className="relative z-10 flex-1 overflow-y-auto">{children}</div>
    </>
  )
}
