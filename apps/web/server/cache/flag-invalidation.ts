const projectFlagVersions = new Map<string, number>()

export function getProjectFlagVersion(projectId: string): number {
  return projectFlagVersions.get(projectId) ?? 0
}

export function invalidateProjectFlags(projectId: string): void {
  projectFlagVersions.set(projectId, getProjectFlagVersion(projectId) + 1)
}
