import { describe, it, expect } from 'vitest'
import {
  uuidSchema,
  slugSchema,
  nameSchema,
  nonEmptyStringSchema,
  orgParamsSchema,
  orgProjectParamsSchema,
  orgProjectFlagParamsSchema,
  environmentSlugQuerySchema,
} from './validation'

describe('validation schemas', () => {
  describe('uuidSchema', () => {
    it('has type string', () => {
      expect(uuidSchema.type).toBe('string')
    })

    it('has format uuid', () => {
      expect(uuidSchema.format).toBe('uuid')
    })
  })

  describe('nonEmptyStringSchema', () => {
    it('has type string', () => {
      expect(nonEmptyStringSchema.type).toBe('string')
    })

    it('has minLength 1', () => {
      expect(nonEmptyStringSchema.minLength).toBe(1)
    })
  })

  describe('slugSchema', () => {
    it('has type string', () => {
      expect(slugSchema.type).toBe('string')
    })

    it('has minLength 1 and maxLength 50', () => {
      expect(slugSchema.minLength).toBe(1)
      expect(slugSchema.maxLength).toBe(50)
    })

    it('has a pattern property', () => {
      expect(slugSchema.pattern).toBeDefined()
      expect(typeof slugSchema.pattern).toBe('string')
    })
  })

  describe('nameSchema', () => {
    it('has type string', () => {
      expect(nameSchema.type).toBe('string')
    })

    it('has minLength 1 and maxLength 100', () => {
      expect(nameSchema.minLength).toBe(1)
      expect(nameSchema.maxLength).toBe(100)
    })
  })

  describe('orgParamsSchema', () => {
    it('requires orgId', () => {
      expect(orgParamsSchema.required).toContain('orgId')
    })

    it('has orgId property', () => {
      expect(orgParamsSchema.properties.orgId).toBeDefined()
      expect(orgParamsSchema.properties.orgId).toEqual(uuidSchema)
    })
  })

  describe('orgProjectParamsSchema', () => {
    it('requires orgId and projectId', () => {
      expect(orgProjectParamsSchema.required).toContain('orgId')
      expect(orgProjectParamsSchema.required).toContain('projectId')
    })

    it('has orgId and projectId properties', () => {
      expect(orgProjectParamsSchema.properties.orgId).toEqual(uuidSchema)
      expect(orgProjectParamsSchema.properties.projectId).toEqual(uuidSchema)
    })
  })

  describe('orgProjectFlagParamsSchema', () => {
    it('requires orgId, projectId and flagId', () => {
      expect(orgProjectFlagParamsSchema.required).toContain('orgId')
      expect(orgProjectFlagParamsSchema.required).toContain('projectId')
      expect(orgProjectFlagParamsSchema.required).toContain('flagId')
    })

    it('has orgId, projectId and flagId properties', () => {
      expect(orgProjectFlagParamsSchema.properties.orgId).toEqual(uuidSchema)
      expect(orgProjectFlagParamsSchema.properties.projectId).toEqual(uuidSchema)
      expect(orgProjectFlagParamsSchema.properties.flagId).toEqual(uuidSchema)
    })
  })

  describe('environmentSlugQuerySchema', () => {
    it('has type object', () => {
      expect(environmentSlugQuerySchema.type).toBe('object')
    })

    it('has environmentSlug property matching slugSchema', () => {
      expect(environmentSlugQuerySchema.properties.environmentSlug).toEqual(slugSchema)
    })
  })
})
