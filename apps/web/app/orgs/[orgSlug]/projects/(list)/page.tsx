import Link from 'next/link'
import { ProjectCard } from '@/components/org/project-card'
import { Pagination } from '@/components/ui/pagination'
import { getProjects } from '@/server/projects/queries'
import { getOrgBySlugOrName } from '@/server/orgs/queries'
import { getSessionOrRedirect } from '@/shared/auth'
import { notFound } from 'next/navigation'

type Props = {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function OrgProjectsPage({
  params,
  searchParams
}: Props) {
  const { orgSlug } = await params
  const query = await searchParams
  const page = Math.max(1, Math.floor(Number(query.page) || 1))
  await getSessionOrRedirect()
  const org = await getOrgBySlugOrName(orgSlug)
  if (!org) {
    notFound()
  }

  const { items: projects, total, page: currentPage, pageSize } =
    await getProjects(org.id, page)

  return (
    <div className="px-4 py-4 sm:px-8 sm:py-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-cg-neutral-400 font-mono text-[12px]">
          {total} projects
        </p>
        <Link
          href={`/orgs/${orgSlug}/projects/new`}
          className="bg-cg-indigo-300 hover:bg-cg-indigo-400 w-full rounded-lg px-4 py-2 text-center text-[12px] font-semibold text-white transition-colors sm:w-fit"
        >
          + New project
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center col-span-full">
            <p className="text-cg-neutral-200 font-sans text-[14px] font-semibold">No projects yet</p>
            <p className="text-cg-neutral-500 font-sans text-[12px] leading-relaxed max-w-xs">
              Projects organize your feature flags. Create your first project to get started.
            </p>
            <Link
              href={`/orgs/${orgSlug}/projects/new`}
              className="bg-cg-indigo-300 hover:bg-cg-indigo-400 mt-1 rounded-lg px-4 py-2 text-[12px] font-semibold text-white transition-colors"
            >
              + Create project
            </Link>
          </div>
        ) : (
          projects.map((project) => (
            <ProjectCard key={project.projectId} orgSlug={orgSlug} {...project} />
          ))
        )}
      </div>

      <Pagination
        page={currentPage}
        pageSize={pageSize}
        total={total}
        baseHref={`/orgs/${orgSlug}/projects`}
      />
    </div>
  )
}