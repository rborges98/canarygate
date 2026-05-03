export const uuidSchema = { type: 'string', format: 'uuid' } as const

export const nonEmptyStringSchema = {
  type: 'string',
  minLength: 1
} as const

export const nameSchema = {
  type: 'string',
  minLength: 1,
  maxLength: 100
} as const

export const slugSchema = {
  type: 'string',
  minLength: 1,
  maxLength: 50,
  pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$'
} as const

export const orgParamsSchema = {
  type: 'object',
  required: ['orgId'],
  properties: {
    orgId: uuidSchema
  }
} as const

export const slugParamsSchema = {
  type: 'object',
  required: ['slug'],
  properties: {
    slug: slugSchema
  }
} as const

export const orgSlugParamsSchema = {
  type: 'object',
  required: ['orgId', 'slug'],
  properties: {
    orgId: uuidSchema,
    slug: slugSchema
  }
} as const

export const orgProjectParamsSchema = {
  type: 'object',
  required: ['orgId', 'projectId'],
  properties: {
    orgId: uuidSchema,
    projectId: uuidSchema
  }
} as const

export const orgUserParamsSchema = {
  type: 'object',
  required: ['orgId', 'userId'],
  properties: {
    orgId: uuidSchema,
    userId: nonEmptyStringSchema
  }
} as const

export const orgUserProjectParamsSchema = {
  type: 'object',
  required: ['orgId', 'userId', 'projectId'],
  properties: {
    orgId: uuidSchema,
    userId: nonEmptyStringSchema,
    projectId: uuidSchema
  }
} as const

export const orgProjectFlagParamsSchema = {
  type: 'object',
  required: ['orgId', 'projectId', 'flagId'],
  properties: {
    orgId: uuidSchema,
    projectId: uuidSchema,
    flagId: uuidSchema
  }
} as const

export const environmentSlugQuerySchema = {
  type: 'object',
  properties: {
    environmentSlug: slugSchema
  }
} as const