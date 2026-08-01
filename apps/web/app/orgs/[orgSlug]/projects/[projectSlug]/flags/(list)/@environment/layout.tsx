import { TabNav } from '@/components/ui/tab-nav'

type Props = {
  children: React.ReactNode
  params: Promise<{ orgSlug: string; projectSlug: string }>
}

export default async function EnvironmentLayout({ children, params }: Props) {
  const { orgSlug, projectSlug } = await params
  const base = `/orgs/${orgSlug}/projects/${projectSlug}/flags`

  return (
    <div>
      <TabNav
        prefetch
        tabs={[
          { label: 'Production', href: `${base}/production` },
          { label: 'Staging', href: `${base}/staging` },
          { label: 'Development', href: `${base}/development` }
        ]}
      />
      {children}
    </div>
  )
}
