import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { pool, withRetry, withTransaction } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.role === "User" ? session.empId : undefined
    const reports = await withRetry(
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
            LEFT JOIN lookup_list_values c ON p.client_name_id = c.id AND c.list_name = 'clients'
            LEFT JOIN lookup_list_values e ON p.environment_id = e.id AND e.list_name = 'environments'
            LEFT JOIN users u ON p.user_id = u.emp_id
            LEFT JOIN users a ON p.attended_by_id = a.emp_id
          `

          if (userId) {
            query += ` WHERE p.user_id = $1`
          }

          query += ` ORDER BY p.created_at DESC`

          const result = await client.query(query, userId ? [userId] : [])
          return result.rows
        } finally {
          client.release()
        }
      },
      3,
      1000,
      "Get problem reports"
    )

    return NextResponse.json({ reports })
  } catch (error) {
    console.error("Error fetching problem reports:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

async function POST(request: NextRequest) {
    try {
      const session = await getSession()
  
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
  
      const reportData = await request.json()
      reportData.user_id = session.empId
      reportData.attended_by_id = session.empId
  
      const report = await withRetry(
        async () => {
          return await withTransaction(async (client) => {
            const result = await client.query(
              `
              INSERT INTO problem_reports (
                client_name_id,
                environment_id,
                problem_statement,
                received_at,
                attended_by_id,
                status,
                sla_hours,
                user_id,
                created_at,
                updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
              RETURNING *
              `,
              [
                reportData.client_name_id,
                reportData.environment_id,
                reportData.problem_statement,
                reportData.received_at,
                reportData.attended_by_id,
                'Open',
                reportData.sla_hours,
                reportData.user_id
              ]
            )
            return result.rows[0]
          })
        },
        3,
        1000,
        "Create problem report"
      )
  
      return NextResponse.json({ report })
    } catch (error) {
      console.error("Error creating problem report:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }
}
