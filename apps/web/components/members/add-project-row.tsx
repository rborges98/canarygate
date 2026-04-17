import {
  ProjectAccessForm,
  type ProjectFormState,
  type ProjectOption
} from './project-access-form'

type AddProjectRowProps = {
  availableProjects: ProjectOption[]
  defaultValues: ProjectFormState
  onSave: (data: ProjectFormState) => void
  onCancel: () => void
}

export function AddProjectRow({
  availableProjects,
  defaultValues,
  onSave,
  onCancel
}: AddProjectRowProps) {
  return (
    <ProjectAccessForm
      availableProjects={availableProjects}
      defaultValues={defaultValues}
      onConfirm={onSave}
      onCancel={onCancel}
      confirmLabel="Add"
      dashed
    />
  )
}
