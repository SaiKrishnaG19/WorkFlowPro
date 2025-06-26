import { PoolConfig } from 'pg'

/**
 * Database configuration settings
 */
export const dbConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://wms:icVBnOJCJEdqHry9BF5CS9GoHbyd43sV@dpg-d19sqrjipnbc739f0kg0-a.oregon-postgres.render.com/workflowpro',
  ssl: { rejectUnauthorized: false },
  max: 30,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
}

/**
 * Database retry configuration
 */
export const retryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 5000
}

/**
 * Health check configuration
 */
export const healthConfig = {
  cacheTimeout: 60000, // 1 minute
  unhealthyResponseTime: 5000 // 5 seconds
}