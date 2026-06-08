'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { createProject } from '@/server/projects/actions'

function deriveSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

type Props = {
  orgId: string
  orgSlug: string
}

type FormValues = {
  name: string
  slug: string
}

export function CreateProjectForm({ orgId, orgSlug }: Props) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting }
  } = useForm<FormValues>({ defaultValues: { name: '', slug: '' } })
  const [slugTouched, setSlugTouched] = useState(false)

  const [watchedName, watchedSlug] = watch(['name', 'slug'])
  const displaySlug = slugTouched ? watchedSlug : deriveSlug(watchedName)

  async function onSubmit({ name }: FormValues) {
    const finalSlug = slugTouched ? watchedSlug : deriveSlug(name)
    const project = await createProject(orgId, {
      name: name.trim(),
      slug: finalSlug
    })
    if (project) {
      router.push(`/orgs/${orgSlug}/projects/${project.slug}/flags`)
    } else {
      toast.error('Failed to create project')
    }
  }

  return (
    <div className="flex items-start justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="border-cg-bg-100 bg-cg-white-300 rounded-2xl border p-8"
        >
          <h2 className="mb-1 text-[20px] font-bold text-white">
            Create project
          </h2>
          <p className="text-cg-neutral-300 mb-7 font-sans text-[12px]">
            Add a new project to your organization
          </p>

          <div className="mb-4">
            <label className="text-cg-neutral-400 mb-1.5 block font-sans text-[11px]">
              Project name
            </label>
            <input
              className="border-cg-bg-100 bg-cg-white-200 text-cg-neutral-100 placeholder:text-cg-neutral-400 focus:border-cg-indigo-300 w-full rounded-lg border px-3.5 py-2.5 text-[13px] transition-colors outline-none"
              placeholder="My App"
              autoFocus
              {...register('name', { required: true })}
            />
          </div>

          <div className="mb-7">
            <label className="text-cg-neutral-400 mb-1.5 block font-sans text-[11px]">
              Slug
            </label>
            <div className="border-cg-bg-100 bg-cg-white-200 focus-within:border-cg-indigo-300 flex items-center rounded-lg border transition-colors">
              <span className="text-cg-neutral-400 border-cg-bg-100 border-r px-3 py-2.5 font-mono text-[11px] whitespace-nowrap">
                {orgSlug}/
              </span>
              <input
                className="text-cg-neutral-100 placeholder:text-cg-neutral-500 min-w-0 flex-1 bg-transparent px-3 py-2.5 font-mono text-[12px] outline-none"
                value={displaySlug}
                placeholder="my-app"
                onChange={(e) => {
                  setSlugTouched(true)
                  setValue('slug', e.target.value)
                }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!watchedName.trim() || isSubmitting}
              className="bg-cg-indigo-300 hover:bg-cg-indigo-400 flex-1 rounded-lg py-2.5 text-[13px] font-semibold text-white transition-colors disabled:opacity-40"
            >
              {isSubmitting ? 'Creating...' : 'Create project'}
            </button>
            <Link
              href={`/orgs/${orgSlug}/projects`}
              className="border-cg-bg-100 hover:border-cg-neutral-600 text-cg-neutral-300 hover:text-cg-neutral-200 rounded-lg border px-5 py-2.5 text-[13px] font-medium transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
