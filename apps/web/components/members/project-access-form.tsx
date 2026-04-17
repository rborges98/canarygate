'use client'

import { useForm, Controller } from 'react-hook-form'
import { cn } from '@/shared/utils'
import { Select } from '@/components/ui/select'

export type ProjectOption = {
  projectId: string
  name: string
}

export type ProjectFormState = {
  selectedProjectId: string
  isAdmin: boolean
}

type ProjectAccessFormProps = {
  availableProjects: ProjectOption[]
  defaultValues: ProjectFormState
  onConfirm: (data: ProjectFormState) => void
  onCancel: () => void
  confirmLabel?: string
  dashed?: boolean
}

export function ProjectAccessForm({
  availableProjects,
  defaultValues,
  onConfirm,
  onCancel,
  confirmLabel = 'Save',
  dashed = false
}: ProjectAccessFormProps) {
  const { control, handleSubmit } = useForm<ProjectFormState>({ defaultValues })

  return (
    <form
      onSubmit={handleSubmit(onConfirm)}
      className={cn(
        'border-cg-indigo-700 bg-cg-indigo-950 flex items-center gap-3 rounded-lg border px-3 py-2.5',
        dashed && 'border-dashed'
      )}
    >
      <Controller
        name="selectedProjectId"
        control={control}
        render={({ field }) => (
          <Select
            autoFocus
            containerClassName="flex-1"
            className="border-cg-indigo-700 bg-cg-bg-200 text-cg-indigo-100 focus:border-cg-indigo-500 rounded-md px-2 py-1.5 font-mono text-[11px]"
            options={availableProjects.map((p) => ({
              value: p.projectId,
              label: p.name
            }))}
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
          />
        )}
      />

      <Controller
        name="isAdmin"
        control={control}
        render={({ field }) => (
          <label className="flex shrink-0 cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              className="accent-cg-indigo-300 h-3.5 w-3.5 cursor-pointer"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
            <span className="text-cg-neutral-400 font-mono text-[11px]">
              Admin
            </span>
          </label>
        )}
      />

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="submit"
          className="bg-cg-indigo-300 hover:bg-cg-indigo-400 rounded-md px-3 py-1 font-mono text-[11px] font-semibold text-white transition-colors"
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          className="text-cg-neutral-500 font-mono text-[11px] transition-colors hover:text-white"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
