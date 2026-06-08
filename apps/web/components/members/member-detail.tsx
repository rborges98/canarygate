'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { Member, ProjectAccess } from './types'
import { ProjectRow } from './project-row'
import { AddProjectRow } from './add-project-row'
import type { ProjectOption, ProjectFormState } from './project-access-form'
import {
  addProjectAccess,
  updateProjectAccess,
  removeProjectAccess
} from '@/server/members/actions'

type MemberDetailProps = {
  orgId: string
  member: Member
  availableProjects: ProjectOption[]
  onMakeOwner: () => void
  onRemoveFromOrg: () => void
}

export function MemberDetail({
  orgId,
  member,
  availableProjects,
  onMakeOwner,
  onRemoveFromOrg
}: MemberDetailProps) {
  const [projects, setProjects] = useState<ProjectAccess[]>(member.projects)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const startEdit = (project: ProjectAccess) => {
    setIsAdding(false)
    setEditingProjectId(project.projectId)
  }

  const saveEdit = async (data: ProjectFormState) => {
    const ok = await updateProjectAccess(
      orgId,
      member.id,
      data.selectedProjectId,
      data.isAdmin ? 'ADMIN' : 'MEMBER'
    )
    if (!ok) {
      toast.error('Failed to update project access')
      return
    }
    setProjects((prev) =>
      prev.map((p) =>
        p.projectId === data.selectedProjectId
          ? { ...p, role: data.isAdmin ? 'ADMIN' : 'MEMBER' }
          : p
      )
    )
    setEditingProjectId(null)
  }

  const removeProject = async (projectId: string) => {
    const ok = await removeProjectAccess(orgId, member.id, projectId)
    if (!ok) {
      toast.error('Failed to remove project access')
      return
    }
    setProjects((prev) => prev.filter((p) => p.projectId !== projectId))
  }

  const startAdd = () => {
    setEditingProjectId(null)
    setIsAdding(true)
  }

  const saveAdd = async (data: ProjectFormState) => {
    const ok = await addProjectAccess(orgId, member.id, {
      projectId: data.selectedProjectId,
      role: data.isAdmin ? 'ADMIN' : 'MEMBER'
    })
    if (!ok) {
      toast.error('Failed to add project access')
      return
    }
    setProjects((prev) => [
      ...prev,
      {
        projectId: data.selectedProjectId,
        name: data.selectedProjectId,
        role: data.isAdmin ? 'ADMIN' : 'MEMBER'
      }
    ])
    setIsAdding(false)
  }

  const unusedProjects = availableProjects.filter(
    (p) => !projects.map((x) => x.projectId).includes(p.projectId)
  )

  return (
    <div className="flex h-full flex-col gap-0">
      <div className="mb-6 flex items-center gap-4">
        <div className="bg-cg-bg-100 text-cg-neutral-400 flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-mono text-base font-bold">
          {member.initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-white">
            {member.email}
          </p>
        </div>
      </div>

      <div className="flex-1">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-cg-neutral-500 font-sans text-[10px] tracking-wider uppercase">
            Projects
            {projects.length > 0 && (
              <span className="text-cg-neutral-600 ml-1.5">
                ({projects.length})
              </span>
            )}
          </p>
        </div>

        <div className="mb-3 flex flex-col gap-1">
          {projects.length === 0 && !isAdding ? (
            <div className="border-cg-bg-100 rounded-lg border border-dashed px-4 py-5 text-center">
              <p className="text-cg-neutral-600 font-sans text-[11px]">
                No projects assigned
              </p>
              <p className="text-cg-neutral-700 mt-1 font-sans text-[10px]">
                Add a project to grant access
              </p>
            </div>
          ) : (
            projects.map((project) => (
              <ProjectRow
                key={project.projectId}
                project={project}
                availableProjects={availableProjects}
                isEditing={editingProjectId === project.projectId}
                editDefaultValues={{
                  selectedProjectId: project.projectId,
                  isAdmin: project.role === 'ADMIN'
                }}
                onEditStart={() => startEdit(project)}
                onEditSave={saveEdit}
                onEditCancel={() => setEditingProjectId(null)}
                onRemove={() => removeProject(project.projectId)}
              />
            ))
          )}

          {isAdding && (
            <AddProjectRow
              availableProjects={unusedProjects}
              defaultValues={{
                selectedProjectId: unusedProjects[0]?.projectId ?? '',
                isAdmin: false
              }}
              onSave={saveAdd}
              onCancel={() => setIsAdding(false)}
            />
          )}
        </div>

        {!isAdding && unusedProjects.length > 0 && (
          <button
            className="text-cg-indigo-100 font-sans text-[11px] transition-colors hover:text-white"
            onClick={startAdd}
          >
            + Add project
          </button>
        )}
      </div>

      <div className="border-cg-bg-100 mt-6 flex items-center border-t pt-4">
        <button
          className="text-cg-indigo-200 font-sans text-[11px] transition-colors hover:text-white"
          onClick={onMakeOwner}
        >
          Make owner
        </button>
        <button
          className="text-cg-red-100 ml-auto font-sans text-[11px] transition-colors hover:text-white"
          onClick={onRemoveFromOrg}
        >
          Remove from org
        </button>
      </div>
    </div>
  )
}
