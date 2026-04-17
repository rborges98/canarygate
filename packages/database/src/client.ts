import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema/index.ts'

type Schema = typeof schema
type DB = NodePgDatabase<Schema>

let _db: DB | null = null

export function getDb(): DB {
  if (!_db) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
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
