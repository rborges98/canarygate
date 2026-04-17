export interface ProjectAccess {
  projectId: string
  name: string
  role: 'ADMIN' | 'MEMBER'
}

export type Member = {
  id: string
  initial: string
  email: string
  isOwner: boolean
  projects: ProjectAccess[]
}
