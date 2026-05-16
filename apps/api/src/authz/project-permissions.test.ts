import { describe, it, expect } from 'vitest'
import { getFlagPermissionRequirement, canPerformFlagMutation } from './project-permissions'

describe('getFlagPermissionRequirement', () => {
  it('returns project-admin for create', () => {
    expect(getFlagPermissionRequirement('create')).toBe('project-admin')
  })

  it('returns project-admin for delete', () => {
    expect(getFlagPermissionRequirement('delete')).toBe('project-admin')
  })

  it('returns project-admin for add-environment', () => {
    expect(getFlagPermissionRequirement('add-environment')).toBe('project-admin')
  })

  it('returns project-access for update', () => {
    expect(getFlagPermissionRequirement('update')).toBe('project-access')
  })

  it('returns project-access for toggle', () => {
    expect(getFlagPermissionRequirement('toggle')).toBe('project-access')
  })

  it('returns project-access for update-rollout', () => {
    expect(getFlagPermissionRequirement('update-rollout')).toBe('project-access')
  })
})

describe('canPerformFlagMutation', () => {
  describe('OWNER role', () => {
    it('can perform any mutation regardless of projectRole', () => {
      expect(canPerformFlagMutation('toggle', { orgRole: 'OWNER', projectRole: 'MEMBER' })).toBe(true)
      expect(canPerformFlagMutation('delete', { orgRole: 'OWNER', projectRole: 'MEMBER' })).toBe(true)
      expect(canPerformFlagMutation('create', { orgRole: 'OWNER', projectRole: 'ADMIN' })).toBe(true)
      expect(canPerformFlagMutation('update', { orgRole: 'OWNER', projectRole: null })).toBe(true)
    })

    it('can perform admin-only operations without projectRole', () => {
      expect(canPerformFlagMutation('delete', { orgRole: 'OWNER' })).toBe(true)
      expect(canPerformFlagMutation('create', { orgRole: 'OWNER' })).toBe(true)
      expect(canPerformFlagMutation('add-environment', { orgRole: 'OWNER' })).toBe(true)
    })
  })

  describe('MEMBER org role', () => {
    it('cannot perform mutation without projectRole', () => {
      expect(canPerformFlagMutation('toggle', { orgRole: 'MEMBER' })).toBe(false)
      expect(canPerformFlagMutation('delete', { orgRole: 'MEMBER', projectRole: null })).toBe(false)
      expect(canPerformFlagMutation('create', { orgRole: 'MEMBER', projectRole: undefined })).toBe(false)
    })

    it('project ADMIN can toggle (project-access required)', () => {
      expect(canPerformFlagMutation('toggle', { orgRole: 'MEMBER', projectRole: 'ADMIN' })).toBe(true)
    })

    it('project MEMBER can toggle (project-access required)', () => {
      expect(canPerformFlagMutation('toggle', { orgRole: 'MEMBER', projectRole: 'MEMBER' })).toBe(true)
    })

    it('project ADMIN can delete (project-admin required)', () => {
      expect(canPerformFlagMutation('delete', { orgRole: 'MEMBER', projectRole: 'ADMIN' })).toBe(true)
    })

    it('project MEMBER cannot delete (project-admin required)', () => {
      expect(canPerformFlagMutation('delete', { orgRole: 'MEMBER', projectRole: 'MEMBER' })).toBe(false)
    })

    it('project ADMIN can create (project-admin required)', () => {
      expect(canPerformFlagMutation('create', { orgRole: 'MEMBER', projectRole: 'ADMIN' })).toBe(true)
    })

    it('project MEMBER cannot create (project-admin required)', () => {
      expect(canPerformFlagMutation('create', { orgRole: 'MEMBER', projectRole: 'MEMBER' })).toBe(false)
    })

    it('project ADMIN can update (project-access required)', () => {
      expect(canPerformFlagMutation('update', { orgRole: 'MEMBER', projectRole: 'ADMIN' })).toBe(true)
    })

    it('project MEMBER can update (project-access required)', () => {
      expect(canPerformFlagMutation('update', { orgRole: 'MEMBER', projectRole: 'MEMBER' })).toBe(true)
    })
  })
})
