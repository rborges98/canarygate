import { boolean, integer, pgTable, real, text, timestamp, unique } from 'drizzle-orm/pg-core'
import { flags } from './flags.ts'
import { environments } from './environments.ts'
import { scheduleActionEnum, everyUnitEnum } from './flags.ts'

export const flagEnvironments = pgTable(
  'flag_environments',
  {
    id:            text('id').primaryKey(),
    flagId:        text('flag_id').notNull().references(() => flags.id, { onDelete: 'cascade' }),
    environmentId: text('environment_id').notNull().references(() => environments.id, { onDelete: 'cascade' }),

    enabled:        boolean('enabled').notNull().default(false),
    rolloutPercent: real('rollout_percent').notNull().default(0),

    scheduleEnabled:        boolean('schedule_enabled').notNull().default(false),
    scheduleDate:           timestamp('schedule_date'),
    scheduleAction:         scheduleActionEnum('schedule_action').notNull().default('enable'),
    scheduleRolloutPercent: real('schedule_rollout_percent').notNull().default(0),

    autoRolloutEnabled:    boolean('auto_rollout_enabled').notNull().default(false),
    autoRolloutIncreaseBy: real('auto_rollout_increase_by').notNull().default(10),
    autoRolloutEveryValue: integer('auto_rollout_every_value').notNull().default(1),
    autoRolloutEveryUnit:  everyUnitEnum('auto_rollout_every_unit').notNull().default('hours'),
    autoRolloutUntilMax:   real('auto_rollout_until_max').notNull().default(100),
    autoRolloutNextAt:     timestamp('auto_rollout_next_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
  },
  (t) => [unique().on(t.flagId, t.environmentId)]
)

export type FlagEnvironment    = typeof flagEnvironments.$inferSelect
export type NewFlagEnvironment = typeof flagEnvironments.$inferInsert
