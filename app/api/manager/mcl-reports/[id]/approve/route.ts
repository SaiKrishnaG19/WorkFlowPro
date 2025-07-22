import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { withRetry, withTransaction, pool } from "@/lib/database"
import { db } from "@/lib/database"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Await params before accessing id
    const { id } = await params
    
    // Get the existing report
    const existingReport = await db.getMCLReportById(id)
    
    if (!existingReport) {
      return NextResponse.json({ error: "MCL report not found" }, { status: 404 })
    }
    
    // Only allow approving if the report is in Pending status
    if (existingReport.status !== "Pending Approval") {
      return NextResponse.json({ 
        error: "Cannot approve a report that is not in Pending status" 
      }, { status: 403 })
    }
    
    // Update the report status to Approved
    await updateMCLReportStatus(id, "Approved")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error approving MCL report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to update MCL report status
async function updateMCLReportStatus(id: string, status: string) {
  return withRetry(
    async () => {
      return await withTransaction(async (client) => {
        const result = await client.query(
          `
          UPDATE mcl_reports
          SET 
            status = $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          RETURNING *
          `,
          [status, id]
        )

        if (result.rowCount === 0) {
          throw new Error('MCL report not found')
        }

        return result.rows[0]
      })
    },
    3,
    1000,
    "Update MCL report status"
  )
}

