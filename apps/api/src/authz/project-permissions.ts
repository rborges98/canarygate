export type OrgRole = 'OWNER' | 'MEMBER'

export type ProjectRole = 'ADMIN' | 'MEMBER'

export type FlagMutation =
  | 'create'
  | 'update'
  | 'delete'
  | 'toggle'
  | 'update-rollout'
  | 'add-environment'

export type PermissionRequirement = 'project-access' | 'project-admin'

const FLAG_PERMISSION_REQUIREMENT_BY_MUTATION: Record<
  FlagMutation,
  PermissionRequirement
> = {
  create: 'project-admin',
  update: 'project-access',
  delete: 'project-admin',
  toggle: 'project-access',
  'update-rollout': 'project-access',
  'add-environment': 'project-admin'
}

export function getFlagPermissionRequirement(
  mutation: FlagMutation
): PermissionRequirement {
  return FLAG_PERMISSION_REQUIREMENT_BY_MUTATION[mutation]
}

export function canPerformFlagMutation(
  mutation: FlagMutation,
  access: { orgRole: OrgRole; projectRole?: ProjectRole | null }
) {
  if (access.orgRole === 'OWNER') {
    return true
  }

  if (!access.projectRole) {
    return false
  }

  if (getFlagPermissionRequirement(mutation) === 'project-access') {
    return access.projectRole === 'ADMIN' || access.projectRole === 'MEMBER'
  }

  return access.projectRole === 'ADMIN'
}
