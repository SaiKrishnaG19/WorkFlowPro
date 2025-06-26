import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { withRetry, withTransaction, pool } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Await params before accessing id
    const { id } = await params
    // Get the MCL report by ID
    const report = await getMCLReportById(id)

    if (!report) {
      return NextResponse.json({ error: "MCL report not found" }, { status: 404 })
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error("Error fetching MCL report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Await params before accessing id
    const { id } = await params
    const reportData = await request.json()
    
    // Check if the report exists
    const existingReport = await getMCLReportById(id)
    
    if (!existingReport) {
      return NextResponse.json({ error: "MCL report not found" }, { status: 404 })
    }
    
    // Only allow editing if the report is in Pending or Rejected status
    if (existingReport.status === "Approved") {
      return NextResponse.json({ error: "Cannot edit an approved report" }, { status: 403 })
    }
    
    // Update the report
    await updateMCLReport(params.id, reportData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating MCL report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to get MCL report by ID
async function getMCLReportById(id: string) {
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
          LEFT JOIN lookup_list_values c ON m.client_name_id = c.id AND c.list_name = 'client_names'
          LEFT JOIN lookup_list_values vt ON m.visit_type_id = vt.id AND vt.list_name = 'visit_types'
          LEFT JOIN lookup_list_values p ON m.purpose_id = p.id AND p.list_name = 'purposes'
          LEFT JOIN lookup_list_values s ON m.shift_id = s.id AND s.list_name = 'shifts'
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

// Helper function to update MCL report
async function updateMCLReport(id: string, reportData: any) {
  return withRetry(
    async () => {
      return await withTransaction(async (client) => {
        const result = await client.query(
          `
          UPDATE mcl_reports
          SET 
            client_name_id = $1,
            visit_type_id = $2,
            purpose_id = $3,
            shift_id = $4,
            entry_at = $5,
            exit_at = $6,
            remark = $7,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $8
          RETURNING *
          `,
          [
            reportData.client_name_id,
            reportData.visit_type_id,
            reportData.purpose_id,
            reportData.shift_id,
            reportData.entry_at,
            reportData.exit_at,
            reportData.remark,
            id
          ]
        )

        if (result.rowCount === 0) {
          throw new Error('MCL report not found')
        }

        return result.rows[0]
      })
    },
    3,
    1000,
    "Update MCL report"
  )
}