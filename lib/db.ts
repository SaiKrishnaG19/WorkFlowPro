// import { Pool } from "pg"

import { Pool } from 'pg'
import { dbConfig } from './db-config'
import { DatabaseService } from './database-service'

// Create the connection pool
export const pool = new Pool(dbConfig)

// Create and export the database service instance
export const db = DatabaseService.getInstance(pool)

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

// Handle process termination
process.on('SIGINT', async () => {
  console.log('Closing pool connections...')
  await pool.end()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Closing pool connections...')
  await pool.end()
  process.exit(0)
})
