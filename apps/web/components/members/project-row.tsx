import { Badge } from '@/components/ui/badge'
import {
  ProjectAccessForm,
  type ProjectFormState,
  type ProjectOption
} from './project-access-form'
import type { ProjectAccess } from './types'

type ProjectRowProps = {
  project: ProjectAccess
  availableProjects: ProjectOption[]
  isEditing: boolean
  editDefaultValues: ProjectFormState
  onEditStart: () => void
  onEditSave: (data: ProjectFormState) => void
  onEditCancel: () => void
  onRemove: () => void
}

export function ProjectRow({
  project,
  availableProjects,
  isEditing,
  editDefaultValues,
  onEditStart,
  onEditSave,
  onEditCancel,
  onRemove
}: ProjectRowProps) {
  if (isEditing) {
    return (
      <ProjectAccessForm
        availableProjects={availableProjects}
        defaultValues={editDefaultValues}
        onConfirm={onEditSave}
        onCancel={onEditCancel}
        confirmLabel="Save"
      />
    )
  }

  return (
    <div className="hover:bg-cg-white-300 flex items-center gap-3 rounded-lg px-3 py-2 transition-colors">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="font-mono text-[12px] text-white">{project.name}</span>
        {project.role === 'ADMIN' && <Badge color="indigo">ADMIN</Badge>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button
          className="text-cg-indigo-100 font-sans text-[11px] transition-colors hover:text-white"
          onClick={onEditStart}
        >
          Edit
        </button>
        <button
          className="text-cg-red-100 font-sans text-[11px] transition-colors hover:text-white"
          onClick={onRemove}
        >
          Remove
        </button>
      </div>
    </div>
  )
}
