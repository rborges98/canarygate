import Link from 'next/link'
import { ProjectCard } from '@/components/org/project-card'
import { getProjects } from '@/server/projects/queries'
import { getOrgBySlug } from '@/server/orgs/queries'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ orgSlug: string }>
}

export default async function OrgProjectsPage({ params }: Props) {
  const { orgSlug } = await params
  const org = await getOrgBySlug(orgSlug)
  if (!org) notFound()

  const projects = await getProjects(org.id)

  return (
    <div className="px-4 py-4 sm:px-8 sm:py-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-cg-neutral-400 font-mono text-[12px]">
          {projects.length} projects
        </p>
        <Link
          href={`/orgs/${orgSlug}/projects/new`}
          className="bg-cg-indigo-300 hover:bg-cg-indigo-400 w-full rounded-lg px-4 py-2 text-center text-[12px] font-semibold text-white transition-colors sm:w-fit"
        >
          + New project
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.projectId} orgSlug={orgSlug} {...project} />
        ))}
      </div>
    </div>
  )
}
