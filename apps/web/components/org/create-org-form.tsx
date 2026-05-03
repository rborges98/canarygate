'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Nav } from '@/components/nav'
import { createOrg } from '@/server/orgs/actions'

function deriveSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

type FormValues = {
  name: string
  slug: string
}

export function CreateOrgForm() {
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
  const initial = watchedName.trim().charAt(0).toUpperCase() || '?'

  async function onSubmit({ name }: FormValues) {
    const finalSlug = slugTouched ? watchedSlug : deriveSlug(name)
    const org = await createOrg({ name: name.trim(), slug: finalSlug })
    if (org) {
      router.push(`/orgs/${org.id}/projects`)
    } else {
      toast.error('Failed to create organization')
    }
  }

  return (
    <div className="bg-cg-bg-400 relative flex min-h-screen flex-col overflow-hidden">
      <Nav />

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="border-cg-bg-100 bg-cg-white-300 rounded-2xl border p-8"
          >
            <h2 className="mb-1 text-[20px] font-bold text-white">
              Create organization
            </h2>
            <p className="text-cg-neutral-300 mb-7 font-sans text-[12px]">
              Set up a new workspace for your team
            </p>

            {/* Avatar */}
            <div className="mb-6 flex justify-center">
              <button className="border-cg-indigo-600 bg-cg-indigo-950 hover:border-cg-indigo-300 group relative flex h-16 w-16 items-center justify-center rounded-full border-2 transition-colors">
                <span className="text-cg-indigo-100 text-[22px] font-bold">
                  {initial}
                </span>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="font-sans text-[9px] text-white">
                    upload
                  </span>
                </div>
              </button>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="text-cg-neutral-400 mb-1.5 block font-sans text-[11px]">
                Organization name
              </label>
              <input
                className="border-cg-bg-100 bg-cg-white-200 text-cg-neutral-100 placeholder:text-cg-neutral-400 focus:border-cg-indigo-300 w-full rounded-lg border px-3.5 py-2.5 text-[13px] outline-none transition-colors"
                placeholder="Acme Inc."
                autoFocus
                {...register('name', { required: true })}
              />
            </div>

            {/* Slug */}
            <div className="mb-7">
              <label className="text-cg-neutral-400 mb-1.5 block font-sans text-[11px]">
                Slug
              </label>
              <div className="border-cg-bg-100 bg-cg-white-200 focus-within:border-cg-indigo-300 flex items-center rounded-lg border transition-colors">
                <span className="text-cg-neutral-400 border-cg-bg-100 whitespace-nowrap border-r px-3 py-2.5 font-mono text-[11px]">
                  canarygate.com/
                </span>
                <input
                  className="text-cg-neutral-100 placeholder:text-cg-neutral-500 min-w-0 flex-1 bg-transparent px-3 py-2.5 font-mono text-[12px] outline-none"
                  value={displaySlug}
                  placeholder="acme-inc"
                  onChange={(e) => {
                    setSlugTouched(true)
                    setValue('slug', e.target.value)
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!watchedName.trim() || isSubmitting}
                className="bg-cg-indigo-300 hover:bg-cg-indigo-400 flex-1 rounded-lg py-2.5 text-[13px] font-semibold text-white transition-colors disabled:opacity-40"
              >
                {isSubmitting ? 'Creating...' : 'Create organization'}
              </button>
              <Link
                href="/orgs"
                className="border-cg-bg-100 hover:border-cg-neutral-600 text-cg-neutral-300 hover:text-cg-neutral-200 rounded-lg border px-5 py-2.5 text-[13px] font-medium transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
