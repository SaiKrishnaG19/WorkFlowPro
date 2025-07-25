import { Pool, type PoolClient } from "pg"
import bcrypt from "bcryptjs"

// Database configuration
const DATABASE_URL =
  process.env.DATABASE_URL

// Connection pool with optimized settings
export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 50, // Maximum number of clients in the pool
  min: 2, // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
})

// Database interfaces
export interface User {
  emp_id: string
  name: string
  email: string
  password_hash: string
  role: "User" | "Manager" | "Admin"
  is_active: boolean
  created_at: Date
  updated_at: Date
  last_login?: Date
  password_change_required?: boolean
}

export interface MCLReport {
  id: string
  client_name_id: number
  user_id: string
  entry_at: Date
  exit_at: Date
  visit_type_id: number
  purpose_id: number
  shift_id: number
  remark: string
  status: "Pending Approval" | "Approved" | "Rejected"
  created_at: Date
  updated_at: Date
  approved_by?: string
  approved_at?: Date
  rejected_by?: string
  rejected_at?: Date
}

export interface ProblemReport {
  id: string
  client_name_id: number
  environment_id: number
  problem_statement: string
  received_at: Date
  rca?: string
  solution?: string
  attended_by_id: string
  status: "Open" | "In Progress" | "Closed"
  sla_hours: number
  user_id: string
  created_at: Date
  updated_at: Date
}

export interface Discussion {
  id: number
  title: string
  content: string
  report_type?: "MCL" | "Problem"
  report_id?: string
  user_id: string
  parent_post_id?: number
  attachment_url?: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface LookupListValue {
  id: number
  list_name: string
  value: string
  sort_order: number
  manager_id?: string
  created_at: Date
  updated_at: Date
}

export interface DatabaseHealth {
  status: "healthy" | "degraded" | "unhealthy"
  responseTime: number
  poolStats: {
    totalCount: number
    idleCount: number
    waitingCount: number
  }
  lastCheck: Date
  version?: string
  uptime?: string
  errors?: string[]
}

// Retry utility with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
  operationName = "Database operation",
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation()
      if (attempt > 1) {
        console.log(`✅ ${operationName} succeeded on attempt ${attempt}`)
      }
      return result
    } catch (error) {
      lastError = error as Error
      console.warn(`⚠️ ${operationName} failed (attempt ${attempt}/${maxRetries}):`, error)

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
        console.log(`🔄 Retrying in ${Math.round(delay)}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  console.error(`❌ ${operationName} failed after ${maxRetries} attempts`)
  throw lastError!
}

//Database transaction wrapper
export async function withTransaction<T>(
operation: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
    if (!client) {
    throw new Error('Client is required for transaction')
  }
  try {
    await client.query("BEGIN")
    const result = await operation(client)
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

export class DatabaseService {
  pool: any
  async getUserById(empId: string): Promise<User | null> {
    return withRetry(
      async () => {
        const client = await pool.connect()
        try {
          const result = await client.query("SELECT * FROM users WHERE emp_id = $1", [empId])
          return result.rows[0] || null
        } finally {
          client.release()
        }
      },
      3,
      1000,
      "Get user by ID"
    )
  }
  private static instance: DatabaseService
  private initialized = false
  private healthCache: DatabaseHealth | null = null
  private healthCacheExpiry = 0
  user: any

  private constructor() {
    // Set up pool event listeners for monitoring
    pool.on("connect", () => {
      console.log("🔗 New database connection established")
    })

    pool.on("error", (err) => {
      console.error("💥 Database pool error:", err)
    })

    pool.on("remove", () => {
      console.log("🔌 Database connection removed from pool")
    })
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  // Initialize database schema and seed data
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      console.log("🚀 Initializing database...")

      // Check if database is already initialized
      const client = await pool.connect()
      try {
        const result = await client.query(
          "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications')"
        )
        const tableExists = result.rows[0].exists

        if (!tableExists) {
          await this.createSchema()
          await this.seedDefaultData()
          console.log("✅ Database initialization completed successfully")
        } else {
          console.log("✅ Database already initialized, skipping...")
        }

        this.initialized = true
      } finally {
        client.release()
      }
    } catch (error) {
      console.error("❌ Database initialization failed:", error)
      throw error
    }
  }

  // Comprehensive health check
  async healthCheck(useCache = true): Promise<DatabaseHealth> {
    const now = Date.now()

    // Return cached result if still valid (30 seconds)
    if (useCache && this.healthCache && now < this.healthCacheExpiry) {
      return this.healthCache
    }

    const errors: string[] = []
    let status: "healthy" | "degraded" | "unhealthy" = "healthy"

    try {
      const startTime = Date.now()
      const client = await pool.connect()

      try {
        // Test basic connectivity
        const basicResult = await client.query("SELECT NOW() as timestamp, version() as version")
        const responseTime = Date.now() - startTime

        // Test table existence
        const tablesResult = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('users', 'mcl_reports', 'problem_reports', 'discussion_posts', 'lookup_list_values', 'notifications')
        `)

        const expectedTables = ["users", "mcl_reports", "problem_reports", "discussion_posts", "lookup_list_values", "notifications"]
        const existingTables = tablesResult.rows.map((row) => row.table_name)
        const missingTables = expectedTables.filter((table) => !existingTables.includes(table))

        if (missingTables.length > 0) {
          errors.push(`Missing tables: ${missingTables.join(", ")}`)
          status = "degraded"
        }

        // Test data integrity
        try {
          const userCount = await client.query("SELECT COUNT(*) as count FROM users")
          if (Number.parseInt(userCount.rows[0].count) === 0) {
            errors.push("No users found in database")
            status = "degraded"
          }
        } catch (error) {
          errors.push("Failed to query users table")
          status = "unhealthy"
        }

        // Performance check
        if (responseTime > 5000) {
          errors.push(`Slow response time: ${responseTime}ms`)
          status = status === "healthy" ? "degraded" : status
        }

        const health: DatabaseHealth = {
          status,
          responseTime,
          poolStats: {
            totalCount: pool.totalCount,
            idleCount: pool.idleCount,
            waitingCount: pool.waitingCount,
          },
          lastCheck: new Date(),
          version: basicResult.rows[0].version,
          uptime: this.calculateUptime(basicResult.rows[0].timestamp),
          errors: errors.length > 0 ? errors : undefined,
        }

        // Cache the result
        this.healthCache = health
        this.healthCacheExpiry = now + 30000 // 30 seconds

        return health
      } finally {
        client.release()
      }
    } catch (error) {
      const health: DatabaseHealth = {
        status: "unhealthy",
        responseTime: -1,
        poolStats: {
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount,
        },
        lastCheck: new Date(),
        errors: [error instanceof Error ? error.message : "Unknown error"],
      }

      this.healthCache = health
      this.healthCacheExpiry = now + 5000 // Cache errors for shorter time

      return health
    }
  }

  private calculateUptime(timestamp: Date): string {
    const now = new Date()
    const diff = now.getTime() - new Date(timestamp).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  // Create database schema
  private async createSchema(): Promise<void> {
    await withRetry(
      async () => {
        await withTransaction(async (client) => {
          // Create users table
          await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            emp_id VARCHAR(20) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL CHECK (role IN ('User', 'Manager', 'Admin')),
            is_active BOOLEAN DEFAULT true,
            password_change_required BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
          )
        `)

          // Create lookup_list_values table
          await client.query(`
          CREATE TABLE IF NOT EXISTS lookup_list_values (
            id SERIAL PRIMARY KEY,
            list_name VARCHAR(50) NOT NULL,
            value VARCHAR(100) NOT NULL,
            sort_order INTEGER NOT NULL,
            manager_id VARCHAR(20) REFERENCES users(emp_id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `)

          // Create mcl_reports table
          await client.query(`
          CREATE TABLE IF NOT EXISTS mcl_reports (
            id VARCHAR(20) PRIMARY KEY,
            client_name_id INTEGER REFERENCES lookup_list_values(id),
            user_id VARCHAR(20) REFERENCES users(emp_id),
            entry_at TIMESTAMP NOT NULL,
            exit_at TIMESTAMP NOT NULL,
            visit_type_id INTEGER REFERENCES lookup_list_values(id),
            purpose_id INTEGER REFERENCES lookup_list_values(id),
            shift_id INTEGER REFERENCES lookup_list_values(id),
            remark TEXT NOT NULL,
            status VARCHAR(20) DEFAULT 'Pending Approval' CHECK (status IN ('Pending Approval', 'Approved', 'Rejected')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            approved_by VARCHAR(20) REFERENCES users(emp_id),
            approved_at TIMESTAMP,
            rejected_by VARCHAR(20) REFERENCES users(emp_id),
            rejected_at TIMESTAMP
          )
        `)

          // Create problem_reports table
          await client.query(`
          CREATE TABLE IF NOT EXISTS problem_reports (
            id VARCHAR(20) PRIMARY KEY,
            client_name_id INTEGER REFERENCES lookup_list_values(id),
            environment_id INTEGER REFERENCES lookup_list_values(id),
            problem_statement TEXT NOT NULL,
            received_at TIMESTAMP NOT NULL,
            rca TEXT,
            solution TEXT,
            attended_by_id VARCHAR(20) REFERENCES users(emp_id),
            status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Closed')),
            sla_hours INTEGER NOT NULL,
            user_id VARCHAR(20) REFERENCES users(emp_id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `)

          // Create discussion_posts table
          await client.query(`
          CREATE TABLE IF NOT EXISTS discussion_posts (
            id SERIAL PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            content TEXT NOT NULL,
            report_type VARCHAR(20) CHECK (report_type IN ('MCL', 'Problem')),
            report_id VARCHAR(20),
            user_id VARCHAR(20) REFERENCES users(emp_id),
            parent_post_id INTEGER REFERENCES discussion_posts(id),
            attachment_url VARCHAR(500),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `)

          // Create export_logs table
          await client.query(`
          CREATE TABLE IF NOT EXISTS export_logs (
            id SERIAL PRIMARY KEY,
            manager_id VARCHAR(20) REFERENCES users(emp_id),
            report_type VARCHAR(20) NOT NULL,
            filters_json JSONB,
            exported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `)

          // Create notifications table
          await client.query(`
            CREATE TABLE IF NOT EXISTS notifications (
              id SERIAL PRIMARY KEY,
              user_id VARCHAR(20) REFERENCES users(emp_id),
              message TEXT NOT NULL,
              is_read BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `)

          // Create indexes for performance
          await client.query(`
          CREATE INDEX IF NOT EXISTS idx_mcl_reports_user_id ON mcl_reports(user_id);
          CREATE INDEX IF NOT EXISTS idx_mcl_reports_status ON mcl_reports(status);
          CREATE INDEX IF NOT EXISTS idx_mcl_reports_created_at ON mcl_reports(created_at);
          CREATE INDEX IF NOT EXISTS idx_problem_reports_user_id ON problem_reports(user_id);
          CREATE INDEX IF NOT EXISTS idx_problem_reports_status ON problem_reports(status);
          CREATE INDEX IF NOT EXISTS idx_problem_reports_created_at ON problem_reports(created_at);
          CREATE INDEX IF NOT EXISTS idx_discussion_posts_user_id ON discussion_posts(user_id);
          CREATE INDEX IF NOT EXISTS idx_discussion_posts_active ON discussion_posts(is_active);
          CREATE INDEX IF NOT EXISTS idx_lookup_list_values_list_name ON lookup_list_values(list_name);
          CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
          CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        `)

          // Create updated_at trigger function
          await client.query(`
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
              NEW.updated_at = CURRENT_TIMESTAMP;
              RETURN NEW;
          END;
          $$ language 'plpgsql';
        `)

          // Create triggers for updated_at
          await client.query(`
          DROP TRIGGER IF EXISTS update_users_updated_at ON users;
          CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
          
          DROP TRIGGER IF EXISTS update_mcl_reports_updated_at ON mcl_reports;
          CREATE TRIGGER update_mcl_reports_updated_at BEFORE UPDATE ON mcl_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
          
          DROP TRIGGER IF EXISTS update_problem_reports_updated_at ON problem_reports;
          CREATE TRIGGER update_problem_reports_updated_at BEFORE UPDATE ON problem_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
          
          DROP TRIGGER IF EXISTS update_discussion_posts_updated_at ON discussion_posts;
          CREATE TRIGGER update_discussion_posts_updated_at BEFORE UPDATE ON discussion_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
          
          DROP TRIGGER IF EXISTS update_lookup_list_values_updated_at ON lookup_list_values;
          CREATE TRIGGER update_lookup_list_values_updated_at BEFORE UPDATE ON lookup_list_values FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `)

          console.log("✅ Database schema created successfully")
        })
      },
      3,
      2000,
      "Schema creation",
    )
  }

  // Seed default data
  private async seedDefaultData(): Promise<void> {
    await withRetry(
      async () => {
        await withTransaction(async (client) => {
          // Check if data already exists
          const userCount = await client.query("SELECT COUNT(*) FROM users")
          if (Number.parseInt(userCount.rows[0].count) > 0) {
            console.log("✅ Database already seeded, skipping...")
            return
          }

          // Hash default passwords
          const adminPassword = await bcrypt.hash("admin123", 10)
          const managerPassword = await bcrypt.hash("manager123", 10)
          const userPassword = await bcrypt.hash("user123", 10)

          // Insert default users
          await client.query(
            `
          INSERT INTO users (emp_id, name, email, password_hash, role) VALUES
          ('EMP001', 'Carol Admin', 'carol.admin@company.com', $1, 'Admin'),
          ('EMP002', 'Bob Manager', 'bob.manager@company.com', $2, 'Manager'),
          ('EMP003', 'Alice User', 'alice.user@company.com', $3, 'User'),
          ('EMP004', 'David Support', 'david.support@company.com', $3, 'User'),
          ('EMP005', 'Emma Lead', 'emma.lead@company.com', $2, 'Manager'),
          ('EMP006', 'Sarah Tech', 'sarah.tech@company.com', $3, 'User'),
          ('EMP007', 'Mike Developer', 'mike.developer@company.com', $3, 'User'),
          ('EMP008', 'Lisa Analyst', 'lisa.analyst@company.com', $3, 'User')
        `,
            [adminPassword, managerPassword, userPassword],
          )

          // Insert lookup values
          await client.query(`
          INSERT INTO lookup_list_values (list_name, value, sort_order, manager_id) VALUES
          -- Clients
          ('clients', 'TechCorp Solutions', 1, 'EMP002'),
          ('clients', 'DataFlow Inc', 2, 'EMP002'),
          ('clients', 'CloudTech Ltd', 3, 'EMP002'),
          ('clients', 'InnovateSoft', 4, 'EMP002'),
          ('clients', 'SystemsPro', 5, 'EMP002'),
          
          -- Visit Types
          ('visit_types', 'On-site Support', 1, 'EMP002'),
          ('visit_types', 'Remote Support', 2, 'EMP002'),
          ('visit_types', 'Consultation', 3, 'EMP002'),
          ('visit_types', 'Installation', 4, 'EMP002'),
          ('visit_types', 'Maintenance', 5, 'EMP002'),
          
          -- Purposes
          ('purposes', 'System Maintenance', 1, 'EMP002'),
          ('purposes', 'Troubleshooting', 2, 'EMP002'),
          ('purposes', 'Installation', 3, 'EMP002'),
          ('purposes', 'Training', 4, 'EMP002'),
          ('purposes', 'Consultation', 5, 'EMP002'),
          ('purposes', 'Emergency Support', 6, 'EMP002'),
          
          -- Shifts
          ('shifts', 'Day Shift', 1, 'EMP002'),
          ('shifts', 'Evening Shift', 2, 'EMP002'),
          ('shifts', 'Night Shift', 3, 'EMP002'),
          ('shifts', 'Weekend', 4, 'EMP002'),
          
          -- Environments
          ('environments', 'Production', 1, 'EMP002'),
          ('environments', 'Staging', 2, 'EMP002'),
          ('environments', 'Development', 3, 'EMP002'),
          ('environments', 'Testing', 4, 'EMP002'),
          ('environments', 'UAT', 5, 'EMP002')
        `)

          // Insert sample MCL reports
          await client.query(`
          INSERT INTO mcl_reports (id, client_name_id, user_id, entry_at, exit_at, visit_type_id, purpose_id, shift_id, remark, status) VALUES
          ('MCL-2025-001', 1, 'EMP003', '2025-01-15 09:00:00', '2025-01-15 17:00:00', 6, 11, 17, 'Completed server maintenance and system updates successfully', 'Approved'),
          ('MCL-2025-002', 2, 'EMP003', '2025-01-14 14:00:00', '2025-01-14 22:00:00', 7, 12, 18, 'Resolved network connectivity issues and optimized performance', 'Pending Approval'),
          ('MCL-2025-003', 3, 'EMP004', '2025-01-13 10:00:00', '2025-01-13 15:00:00', 6, 13, 17, 'New software deployment completed with comprehensive testing', 'Approved')
        `)

          // Insert sample problem reports
          await client.query(`
          INSERT INTO problem_reports (id, client_name_id, environment_id, problem_statement, received_at, rca, solution, attended_by_id, status, sla_hours, user_id) VALUES
          ('PRB-2025-001', 1, 21, 'Database connection timeout errors occurring frequently during peak hours', '2025-01-15 10:30:00', 'Connection pool exhaustion due to high concurrent users', 'Increased connection pool size and optimized query performance', 'EMP003', 'Closed', 4, 'EMP003'),
          ('PRB-2025-002', 2, 22, 'Application crashes when processing large datasets', '2025-01-14 14:15:00', 'Memory leak in data processing module', 'Currently implementing memory management fixes and monitoring', 'EMP004', 'In Progress', 8, 'EMP004'),
          ('PRB-2025-003', 3, 21, 'Users unable to login to the system intermittently', '2025-01-13 09:00:00', '', '', 'EMP003', 'Open', 2, 'EMP003')
        `)

          // Insert sample discussions
          await client.query(`
          INSERT INTO discussion_posts (title, content, report_type, report_id, user_id, is_active) VALUES
          ('Database Performance Optimization', 'We are experiencing database performance issues during peak hours. The connection timeouts are affecting user experience. Looking for team input on optimization strategies.', 'Problem', 'PRB-2025-001', 'EMP003', true),
          ('MCL Report Documentation Standards', 'I wanted to start a discussion about standardizing our MCL report documentation. What information should we always include in the remarks section to improve clarity?', 'MCL', 'MCL-2025-001', 'EMP002', true),
          ('System Maintenance Best Practices', 'Following recent maintenance activities, let us discuss best practices for system maintenance to minimize downtime and improve efficiency.', null, null, 'EMP004', true)
        `)

          console.log("✅ Database seeded successfully")
        })
      },
      3,
      2000,
      "Data seeding",
    )
  }

  async executeSqlQuery(query: string): Promise<any> {
    if (!query.trim()) {
      throw new Error("Query cannot be empty")
    }

    try {
      const result = await pool.query(query)
      return result.rows
    } catch (error) {
      console.error("Error executing SQL query:", error)
      throw error
    }
  }

  // User authentication
  async authenticateUser(empId: string, password: string): Promise<User | null> {
    return withRetry(
      async () => {
        const client = await pool.connect()
        try {
          const result = await client.query("SELECT * FROM users WHERE emp_id = $1 AND is_active = true", [empId])

          if (result.rows.length === 0) {
            return null
          }

          const user = result.rows[0]
          const isValidPassword = await bcrypt.compare(password, user.password_hash)

          if (!isValidPassword) {
            return null
          }

          // Update last login
          await client.query("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE emp_id = $1", [empId])

          return user
        } finally {
          client.release()
        }
      },
      3,
      1000,
      "User authentication",
    )
  }

  // User management
  async getAllUsers(): Promise<User[]> {
    return withRetry(
      async () => {
        const client = await pool.connect()
        try {
          const result = await client.query("SELECT * FROM users ORDER BY created_at DESC")
          return result.rows
        } finally {
          client.release()
        }
      },
      3,
      1000,
      "Get all users",
    )
  }

  async getActiveUsers(): Promise<User[]> {
  return withRetry(
    async () => {
      const client = await pool.connect()
      try {
        const result = await client.query("SELECT * FROM users WHERE is_active = true ORDER BY name ASC")
        return result.rows
      } finally {
        client.release()
      }
    },
    3,
    1000,
    "Get active users",
  )
}

  async createUser(userData: Omit<User, "created_at" | "updated_at">): Promise<User> {
    return withRetry(
      async () => {
        return withTransaction(async (client) => {
          const hashedPassword = await bcrypt.hash(userData.password_hash, 10)

          const result = await client.query(
            `
          INSERT INTO users (emp_id, name, email, password_hash, role, is_active, password_change_required)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `,
            [
              userData.emp_id,
              userData.name,
              userData.email,
              hashedPassword,
              userData.role,
              userData.is_active,
              userData.password_change_required || false,
            ],
          )

          return result.rows[0]
        })
      },
      3,
      1000,
      "Create user",
    )
  }

  async updateUser(empId: string, userData: Partial<User>): Promise<void> {
    return withRetry(
      async () => {
        return withTransaction(async (client) => {
          const fields = Object.keys(userData)
            .filter((key) => key !== "emp_id")
            .map((key, index) => `${key} = $${index + 2}`)
            .join(", ")

          const values = Object.entries(userData)
            .filter(([key]) => key !== "emp_id")
            .map(([, value]) => value)

          if (fields.length === 0) return

          await client.query(`UPDATE users SET ${fields} WHERE emp_id = $1`, [empId, ...values])
        })
      },
      3,
      1000,
      "Update user",
    )
  }

  async deleteUser(empId: string): Promise<void> {
    return withRetry(
      async () => {
        return withTransaction(async (client) => {
          await client.query("DELETE FROM users WHERE emp_id = $1", [empId])
        })
      },
      3,
      1000,
      "Delete user",
    )
  }

  // MCL Reports
  async getMCLReports(userId?: string): Promise<any[]> {
    return withRetry(
      async () => {
        const client = await pool.connect()
        try {
          let query = `
          SELECT 
            m.*,
            c.value as client_name,
            vt.value as visit_type,
            p.value as purpose,
            s.value as shift,
            u.name as submitted_by
          FROM mcl_reports m
          LEFT JOIN lookup_list_values c ON m.client_name_id = c.id
          LEFT JOIN lookup_list_values vt ON m.visit_type_id = vt.id
          LEFT JOIN lookup_list_values p ON m.purpose_id = p.id
          LEFT JOIN lookup_list_values s ON m.shift_id = s.id
          LEFT JOIN users u ON m.user_id = u.emp_id
        `

          const params: any[] = []
          if (userId) {
            query += " WHERE m.user_id = $1"
            params.push(userId)
          }

          query += " ORDER BY m.created_at DESC"

          const result = await client.query(query, params)
          return result.rows
        } finally {
          client.release()
        }
      },
      3,
      1000,
      "Get MCL reports",
    )
  }

async getMCLReportsForManager(filters?: { dateFrom?: string; dateTo?: string; user?: string; month?: string }): Promise<any[]> {
  return withRetry(
    async () => {
      const client = await pool.connect()
      try {
        let query = `
          SELECT 
            m.*,
            c.value as client_name,
            vt.value as visit_type,
            p.value as purpose,
            s.value as shift,
            u.name as submitted_by
          FROM mcl_reports m
          LEFT JOIN lookup_list_values c ON m.client_name_id = c.id
          LEFT JOIN lookup_list_values vt ON m.visit_type_id = vt.id
          LEFT JOIN lookup_list_values p ON m.purpose_id = p.id
          LEFT JOIN lookup_list_values s ON m.shift_id = s.id
          LEFT JOIN users u ON m.user_id = u.emp_id
          WHERE 1=1
        `

        const params: any[] = []
        let paramIndex = 1

        if (filters?.dateFrom) {
          query += ` AND m.entry_at >= $${paramIndex++}`
          params.push(filters.dateFrom)
        }
        if (filters?.dateTo) {
          query += ` AND m.entry_at <= $${paramIndex++}`
          params.push(filters.dateTo)
        }
        if (filters?.user) {
          query += ` AND m.user_id = $${paramIndex++}`
          params.push(filters.user)
        }
        if (filters?.month) {
          // Assuming month is in "YYYY-MM" format, filter by year and month of entry_at
          query += ` AND TO_CHAR(m.entry_at, 'YYYY-MM') = $${paramIndex++}`
          params.push(filters.month)
        }

        query += " ORDER BY m.created_at DESC"

        const result = await client.query(query, params)
        return result.rows
      } finally {
        client.release()
      }
    },
    3,
    1000,
    "Get MCL reports",
  )
}

  async createMCLReport(reportData: any): Promise<any> {
    return withRetry(
      async () => {
        return withTransaction(async (client) => {
          const id = reportData.id || `MCL-${new Date().getFullYear()}-${String(Date.now()).slice(-3).padStart(3, "0")}`

          const result = await client.query(
            `
          INSERT INTO mcl_reports (
            id, client_name_id, user_id, entry_at, exit_at, 
            visit_type_id, purpose_id, shift_id, remark, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `,
            [
              id,
              reportData.client_name_id,
              reportData.user_id,
              reportData.entry_at,
              reportData.exit_at,
              reportData.visit_type_id,
              reportData.purpose_id,
              reportData.shift_id,
              reportData.remark,
              "Pending Approval",
            ],
          )

          return result.rows[0]
        })
      },
      3,
      1000,
      "Create MCL report",
    )
  }

  async updateMCLReportStatus(reportId: string, status: string, actionBy: string): Promise<void> {
    return withRetry(
      async () => {
        return withTransaction(async (client) => {
          const field = status === "Approved" ? "approved" : "rejected"
          await client.query(
            `
          UPDATE mcl_reports 
          SET status = $1, ${field}_by = $2, ${field}_at = CURRENT_TIMESTAMP 
          WHERE id = $3
        `,
            [status, actionBy, reportId],
          )
        })
      },
      3,
      1000,
      "Update MCL report status",
    )
  }

   async getMCLReportById(id: string): Promise<MCLReport | null> {
    return withRetry(
      async () => {
        const client = await pool.connect()
        try {
          const result = await client.query(
            `
            SELECT 
              m.*,
              c.value as client_name,
              vt.value as visit_type,
              p.value as purpose,
              s.value as shift,
              u.name as submitted_by
            FROM mcl_reports m
            LEFT JOIN lookup_list_values c ON m.client_name_id = c.id
            LEFT JOIN lookup_list_values vt ON m.visit_type_id = vt.id
            LEFT JOIN lookup_list_values p ON m.purpose_id = p.id
            LEFT JOIN lookup_list_values s ON m.shift_id = s.id
            LEFT JOIN users u ON m.user_id = u.emp_id
            WHERE m.id = $1
            `,
            [id]
          )
          return result.rows[0] || null
        } finally {
          client.release()
        }
      },
      3,
      1000,
      "Get MCL report by ID"
    )
  }

  // Problem Reports
  async getProblemReports(userId?: string): Promise<any[]> {
    return withRetry(
      async () => {
        const client = await pool.connect()
        try {
          let query = `
          SELECT 
            p.*,
            c.value as client_name,
            e.value as environment,
            u.name as submitted_by,
            a.name as attended_by
          FROM problem_reports p
          LEFT JOIN lookup_list_values c ON p.client_name_id = c.id
          LEFT JOIN lookup_list_values e ON p.environment_id = e.id
          LEFT JOIN users u ON p.user_id = u.emp_id
          LEFT JOIN users a ON p.attended_by_id = a.emp_id
        `

          const params: any[] = []
          if (userId) {
            query += " WHERE p.user_id = $1"
            params.push(userId)
          }

          query += " ORDER BY p.created_at DESC"

          const result = await client.query(query, params)
          return result.rows
        } finally {
          client.release()
        }
      },
      3,
      1000,
      "Get problem reports",
    )
  }

async getProblemReportsForManager(filters?: { dateFrom?: string; dateTo?: string; user?: string; month?: string }): Promise<any[]> {
  return withRetry(
    async () => {
      const client = await pool.connect()
      try {
        let query = `
          SELECT 
            p.*,
            c.value as client_name,
            e.value as environment,
            u.name as submitted_by,
            a.name as attended_by
          FROM problem_reports p
          LEFT JOIN lookup_list_values c ON p.client_name_id = c.id
          LEFT JOIN lookup_list_values e ON p.environment_id = e.id
          LEFT JOIN users u ON p.user_id = u.emp_id
          LEFT JOIN users a ON p.attended_by_id = a.emp_id
          WHERE 1=1
        `

        const params: any[] = []
        let paramIndex = 1

        if (filters?.dateFrom) {
          query += ` AND p.received_at >= $${paramIndex++}`
          params.push(filters.dateFrom)
        }
        if (filters?.dateTo) {
          query += ` AND p.received_at <= $${paramIndex++}`
          params.push(filters.dateTo)
        }
        if (filters?.user) {
          query += ` AND p.user_id = $${paramIndex++}`
          params.push(filters.user)
        }
        if (filters?.month) {
          query += ` AND TO_CHAR(p.received_at, 'YYYY-MM') = $${paramIndex++}`
          params.push(filters.month)
        }

        query += " ORDER BY p.created_at DESC"

        const result = await client.query(query, params)
        return result.rows
      } finally {
        client.release()
      }
    },
    3,
    1000,
    "Get problem reports",
  )
}
  async createProblemReport(reportData: any): Promise<any> {
    return withRetry(
      async () => {
        return withTransaction(async (client) => {
          const id = `PRB-${new Date().getFullYear()}-${String(Date.now()).slice(-3).padStart(3, "0")}`

          const result = await client.query(
            `
          INSERT INTO problem_reports (
            id, client_name_id, environment_id, problem_statement, 
            received_at, attended_by_id, status, sla_hours, user_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `,
            [
              id,
              reportData.client_name_id,
              reportData.environment_id,
              reportData.problem_statement,
              reportData.received_at,
              reportData.attended_by_id,
              "Open",
              reportData.sla_hours,
              reportData.user_id,
            ],
          )

          return result.rows[0]
        })
      },
      3,
      1000,
      "Create problem report",
    )
  }

  // Lookup values
  async getLookupValues(listName: string): Promise<LookupListValue[]> {
    return withRetry(
      async () => {
        const client = await pool.connect()
        try {
          const result = await client.query(
            "SELECT * FROM lookup_list_values WHERE list_name = $1 ORDER BY sort_order",
            [listName],
          )
          return result.rows
        } finally {
          client.release()
        }
      },
      3,
      1000,
      "Get lookup values",
    )
  }

  async createLookupValue(data: Omit<LookupListValue, "id" | "created_at" | "updated_at">): Promise<LookupListValue> {
    return withRetry(
      async () => {
        const client = await pool.connect()
        return withTransaction(async (client) => {
          const result = await client.query(
            `
          INSERT INTO lookup_list_values (list_name, value, sort_order, manager_id)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `,
            [data.list_name, data.value, data.sort_order, data.manager_id],
          )

          return result.rows[0]
        })
      },
      3,
      1000,
      "Create lookup value",
    )
  }

  // Discussions
  async getDiscussions(): Promise<any[]> {
    return withRetry(
      async () => {
        const client = await pool.connect()
        try {
          const result = await client.query(`
          SELECT 
            d.*,
            u.name as author,
            u.role as author_role,
            (SELECT COUNT(*) FROM discussion_posts WHERE parent_post_id = d.id) as comments_count
          FROM discussion_posts d
          LEFT JOIN users u ON d.user_id = u.emp_id
          WHERE d.is_active = true AND d.parent_post_id IS NULL
          ORDER BY d.updated_at DESC
        `)
          return result.rows
        } finally {
          client.release()
        }
      },
      3,
      1000,
      "Get discussions",
    )
  }

  async getDiscussionById(id: string): Promise<any> {
    return withRetry(
      async () => {
        return withTransaction(async (client) => {
          const result = await client.query(
            `
            SELECT 
              d.*, 
              u.name AS author, 
              u.role AS author_role
            FROM discussion_posts d
            JOIN users u ON d.user_id = u.emp_id
            WHERE d.id = $1
            `,
            [id]
          )
          return result.rows[0] || null
        })
      },
      3,
      1000,
      "Get discussion by ID"
    )
  }

   async createComment(data: {
  discussion_id: number,
  content: string,
  user_id: string,
  mentions: string[],
  is_active: boolean
}): Promise<any> {
  return withRetry(
    async () => {
      return withTransaction(async (client) => {
        const result = await client.query(
          `
          INSERT INTO discussion_posts (
            title, content, user_id, parent_post_id, is_active
          ) VALUES (
            $1, $2, $3, $4, $5
          )
          RETURNING *
          `,
          [
            "", // Use empty string for comment title
            data.content,
            data.user_id,
            data.discussion_id, // parent_post_id links to the main discussion
            data.is_active
          ]
        )

        // Notify mentioned users
  for (const mention of data.mentions) {
          // Query to get emp_id from user name
          const userRes = await client.query(
            `SELECT emp_id FROM users WHERE name = $1`,
            [mention]
          )
          if (userRes.rows.length > 0) {
            const mentionedEmpId = userRes.rows[0].emp_id
            await client.query(
              `INSERT INTO notifications (user_id, message) VALUES ($1, $2)`,
              [mentionedEmpId, `${data.user_id} mentioned you in a discussion.`]
            )
          } else {
            console.warn(`Mentioned user '${mention}' not found, skipping notification.`)
          }
        }

        return result.rows[0]
      })
    },
    3,
    1000,
    "Create comment"
  )
}

  async getDiscussionComments(discussionId: string): Promise<any[]> {
    return withRetry(
      async () => {
        const client = await pool.connect()
        try {
          const result = await client.query(`
          SELECT 
            d.*,
            u.name as author,
            u.role as author_role
          FROM discussion_posts d
          LEFT JOIN users u ON d.user_id = u.emp_id
          WHERE d.parent_post_id = $1 AND d.is_active = true
          ORDER BY d.created_at ASC
        `, [discussionId])
          return result.rows
        } finally {
          client.release()
        }
      },
      3,
      1000,
      "Get discussion comments",
    )
  }

  async updateDiscussion(id: string, data: Partial<Discussion>): Promise<Discussion> {
    return withRetry(
      async () => {
        return withTransaction(async (client) => {
          const updateFields = []
          const values = []
          let valueCounter = 1

          if (data.title !== undefined) {
            updateFields.push(`title = $${valueCounter}`)
            values.push(data.title)
            valueCounter++
          }
          if (data.content !== undefined) {
            updateFields.push(`content = $${valueCounter}`)
            values.push(data.content)
            valueCounter++
          }
          if (data.is_active !== undefined) {
            updateFields.push(`is_active = $${valueCounter}`)
            values.push(data.is_active)
            valueCounter++
          }

          values.push(id)
          
          const result = await client.query(
            `
            UPDATE discussion_posts
            SET ${updateFields.join(", ")},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $${valueCounter}
            RETURNING *
            `,
            values
          )

          return result.rows[0]
        })
      },
      3,
      1000,
      "Update discussion",
    )
  }

  async createDiscussion(data: Omit<Discussion, "id" | "created_at" | "updated_at">): Promise<Discussion> {
    return withRetry(
      async () => {
        return withTransaction(async (client) => {
          const result = await client.query(
            `
          INSERT INTO discussion_posts (title, content, report_type, report_id, user_id, is_active)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `,
            [data.title, data.content, data.report_type, data.report_id, data.user_id, data.is_active],
          )

          return result.rows[0]
        })
      },
      3,
      1000,
      "Create discussion",
    )
  }

  

  // Analytics and reporting
  async getSystemStats(): Promise<any> {
    return withRetry(
      async () => {
        const client = await pool.connect()
        try {
          const [userStats, mclStats, problemStats, discussionStats] = await Promise.all([
            client.query(`
            SELECT 
              COUNT(*) as total_users,
              COUNT(*) FILTER (WHERE is_active = true) as active_users,
              COUNT(*) FILTER (WHERE role = 'Admin') as admin_count,
              COUNT(*) FILTER (WHERE role = 'Manager') as manager_count,
              COUNT(*) FILTER (WHERE role = 'User') as user_count
            FROM users
          `),
            client.query(`
            SELECT 
              COUNT(*) as total_reports,
              COUNT(*) FILTER (WHERE status = 'Pending Approval') as pending_reports,
              COUNT(*) FILTER (WHERE status = 'Approved') as approved_reports,
              COUNT(*) FILTER (WHERE status = 'Rejected') as rejected_reports
            FROM mcl_reports
          `),
            client.query(`
            SELECT 
              COUNT(*) as total_reports,
              COUNT(*) FILTER (WHERE status = 'Open') as open_reports,
              COUNT(*) FILTER (WHERE status = 'In Progress') as in_progress_reports,
              COUNT(*) FILTER (WHERE status = 'Closed') as closed_reports
            FROM problem_reports
          `),
            client.query(`
            SELECT 
              COUNT(*) as total_discussions,
              COUNT(*) FILTER (WHERE is_active = true) as active_discussions
            FROM discussion_posts
            WHERE parent_post_id IS NULL
          `),
          ])

          return {
            users: userStats.rows[0],
            mcl_reports: mclStats.rows[0],
            problem_reports: problemStats.rows[0],
            discussions: discussionStats.rows[0],
          }
        } finally {
          client.release()
        }
      },
      3,
      1000,
      "Get system stats",
    )
  }

  // Cleanup and maintenance
  async cleanup(): Promise<void> {
    try {
      await pool.end()
      console.log("🧹 Database connections closed")
    } catch (error) {
      console.error("❌ Error during cleanup:", error)
    }
  }
}

// Export singleton instance
export const db = DatabaseService.getInstance()

// Initialize database on module load (server-side only)
if (typeof window === "undefined") {
  db.initialize().catch((error) => {
    console.error("Failed to initialize database:", error)
  })
  console.log("🔄 Database initialized successfully")
  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("🛑 Received SIGINT, shutting down gracefully...")
    await db.cleanup()
    process.exit(0)
  })

  process.on("SIGTERM", async () => {
    console.log("🛑 Received SIGTERM, shutting down gracefully...")
    await db.cleanup()
    process.exit(0)
  })
}
