import { Pool, PoolClient } from 'pg'
import bcrypt from 'bcryptjs'
import { withRetry, withTransaction, safeRelease } from './db-utils'
import { DatabaseError, ValidationError } from './errors'
import {
  User,
  MCLReport,
  ProblemReport,
  Discussion,
  LookupListValue,
  DatabaseHealth,
  PoolStats
} from './types'

export class DatabaseService {
  private static instance: DatabaseService
  private initialized = false
  private healthCache: DatabaseHealth | null = null
  private healthCacheExpiry = 0
  private readonly pool: Pool

  private constructor(pool: Pool) {
    this.pool = pool
    this.setupPoolListeners()
  }

  private setupPoolListeners(): void {
    this.pool.on('connect', () => {
      console.log('🔗 New database connection established')
    })

    this.pool.on('error', (err) => {
      console.error('💥 Database pool error:', err)
    })

    this.pool.on('remove', () => {
      console.log('🔌 Database connection removed from pool')
    })
  }

  public static getInstance(pool: Pool): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService(pool)
    }
    return DatabaseService.instance
  }

  /**
   * Get user by employee ID
   */
  async getUserById(empId: string): Promise<User | null> {
    return withRetry(
      async () => {
        const client = await this.pool.connect()
        try {
          const result = await client.query('SELECT * FROM users WHERE emp_id = $1', [empId])
          return result.rows[0] || null
        } finally {
          safeRelease(client)
        }
      },
      3,
      1000,
      'Get user by ID'
    )
  }

  /**
   * Authenticate user with employee ID and password
   */
  async authenticateUser(empId: string, password: string): Promise<User | null> {
    return withRetry(
      async () => {
        const client = await this.pool.connect()
        try {
          const result = await client.query(
            'SELECT * FROM users WHERE emp_id = $1 AND is_active = true',
            [empId]
          )

          if (result.rows.length === 0) {
            return null
          }

          const user = result.rows[0]
          const isValidPassword = await bcrypt.compare(password, user.password_hash)

          if (!isValidPassword) {
            return null
          }

          await client.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE emp_id = $1',
            [empId]
          )

          return user
        } finally {
          safeRelease(client)
        }
      },
      3,
      1000,
      'User authentication'
    )
  }

  /**
   * Get database health status
   */
  async getHealth(): Promise<DatabaseHealth> {
    const now = Date.now()
    if (this.healthCache && now < this.healthCacheExpiry) {
      return this.healthCache
    }

    return withRetry(
      async () => {
        const startTime = process.hrtime()
        const client = await this.pool.connect()

        try {
          await client.query('SELECT 1')
          const [seconds, nanoseconds] = process.hrtime(startTime)
          const responseTime = seconds * 1000 + nanoseconds / 1000000

          const poolStats: PoolStats = {
            totalCount: this.pool.totalCount,
            idleCount: this.pool.idleCount,
            waitingCount: this.pool.waitingCount
          }

          const health: DatabaseHealth = {
            status: 'healthy',
            responseTime,
            poolStats,
            lastCheck: new Date()
          }

          this.healthCache = health
          this.healthCacheExpiry = now + 60000 // Cache for 1 minute

          return health
        } catch (error) {
          return {
            status: 'unhealthy',
            responseTime: 0,
            poolStats: {
              totalCount: 0,
              idleCount: 0,
              waitingCount: 0
            },
            lastCheck: new Date(),
            errors: [error instanceof Error ? error.message : 'Unknown error']
          }
        } finally {
          safeRelease(client)
        }
      },
      3,
      1000,
      'Health check'
    )
  }

  /**
   * Create a new comment in a discussion
   */
  async createComment(discussionId: string, empId: string, content: string): Promise<Discussion> {
    return withRetry(
      async () => {
        const client = await this.pool.connect()
        try {
          return await withTransaction(client, async (trxClient) => {
            const result = await trxClient.query(
              `INSERT INTO discussions (discussion_id, emp_id, content)
               VALUES ($1, $2, $3)
               RETURNING *`,
              [discussionId, empId, content]
            )
            
            if (result.rows.length === 0) {
              throw new DatabaseError('Failed to create comment')
            }
            
            return result.rows[0]
          })
        } finally {
          safeRelease(client)
        }
      },
      3,
      1000,
      'Create comment'
    )
  }
}