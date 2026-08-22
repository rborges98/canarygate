import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema/index'

type Schema = typeof schema
type DB = NodePgDatabase<Schema>

let _db: DB | null = null

export function getDb(): DB {
  if (!_db) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
      statement_timeout: 5_000,
      query_timeout: 5_000
    })
    _db = drizzle(pool, { schema })
  }
  return _db
}

// Lazy proxy — só conecta quando usado
export const db = new Proxy({} as DB, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop]
  }
})
