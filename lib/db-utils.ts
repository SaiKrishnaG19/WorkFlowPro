import { PoolClient } from 'pg'
import { DatabaseError } from './errors'

/**
 * Retry utility with exponential backoff for database operations
 * @param operation - The database operation to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param baseDelay - Base delay in milliseconds between retries
 * @param operationName - Name of the operation for logging
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
  operationName = 'Database operation',
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation()
      if (attempt > 1) {
        console.log(`✅ ${operationName} succeeded on attempt ${attempt}`)
      }
      return result
    } catch (error) {
      lastError = error instanceof Error
        ? error
        : new DatabaseError('Unknown error occurred')

      console.warn(`⚠️ ${operationName} failed (attempt ${attempt}/${maxRetries}):`, error)

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
        console.log(`🔄 Retrying in ${Math.round(delay)}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  console.error(`❌ ${operationName} failed after ${maxRetries} attempts`)
  throw lastError || new DatabaseError('Operation failed after all retries')
}


/**
 * Database transaction wrapper
 * @param client - The database client to use for the transaction
 * @param operation - The operation to execute within the transaction
 */
export async function withTransaction<T>(
  client: PoolClient,
  operation: (client: PoolClient) => Promise<T>
): Promise<T> {
  if (!client) {
    throw new DatabaseError('Client is required for transaction')
  }

  try {
    await client.query('BEGIN')
    const result = await operation(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error instanceof Error ? error : new DatabaseError('Transaction failed')
  }
}

/**
 * Safely releases a database client back to the pool
 * @param client - The database client to release
 */
export function safeRelease(client: PoolClient | null): void {
  try {
    if (client) {
      client.release()
    }
  } catch (error) {
    console.error('Error releasing client:', error)
  }
}