import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/database"
import { withRetry, withTransaction } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the problem report by ID
    const report = await getProblemReportById(params.id)

    if (!report) {
      return NextResponse.json({ error: "Problem report not found" }, { status: 404 })
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error("Error fetching problem report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const reportData = await request.json()
    
    // Check if the report exists
    const existingReport = await getProblemReportById(params.id)
    
    if (!existingReport) {
      return NextResponse.json({ error: "Problem report not found" }, { status: 404 })
    }
    
    // Only allow editing if the report is not closed
    if (existingReport.status === "Closed") {
      return NextResponse.json({ error: "Cannot edit a closed report" }, { status: 403 })
    }
    
    // Update the report
    await updateProblemReport(params.id, reportData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating problem report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to get problem report by ID
async function getProblemReportById(id: string) {
  return withRetry(
    async () => {
      const client = await db.pool.connect()
      try {
        const result = await client.query(
          `
          SELECT 
            p.*,
            c.value as client_name,
            e.value as environment,
            u.name as submitted_by,
            a.name as attended_by
          FROM problem_reports p
          LEFT JOIN lookup_list_values c ON p.client_name_id = c.id AND c.list_name = 'client_names'
          LEFT JOIN lookup_list_values e ON p.environment_id = e.id AND e.list_name = 'environments'
          LEFT JOIN users u ON p.user_id = u.emp_id
          LEFT JOIN users a ON p.attended_by_id = a.emp_id
          WHERE p.id = $1
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
    "Get problem report by ID"
  )
}

// Helper function to update problem report
async function updateProblemReport(id: string, reportData: any) {
  return withRetry(
    async () => {
      return withTransaction(async (client) => {
        const result = await client.query(
          `
          UPDATE problem_reports
          SET 
            client_name_id = $1,
            environment_id = $2,
            problem_statement = $3,
            received_at = $4,
            rca = $5,
            solution = $6,
            attended_by_id = $7,
            status = $8,
            sla_hours = $9,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $10
          RETURNING *
          `,
          [
            reportData.client_name_id,
            reportData.environment_id,
            reportData.problem_statement,
            reportData.received_at,
            reportData.rca,
            reportData.solution,
            reportData.attended_by_id,
            reportData.status,
            reportData.sla_hours,
            id
          ]
        )

        if (result.rowCount === 0) {
          throw new Error('Problem report not found')
        }

        return result.rows[0]
      })
    },
    3,
    1000,
    "Update problem report"
  )
}