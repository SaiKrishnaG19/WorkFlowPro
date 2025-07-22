import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db, withRetry, withTransaction } from "@/lib/database"
import { pool } from "@/lib/database" 

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { status } = await request.json()

    if (!["Open", "In Progress", "Closed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const client = await pool.connect()
    try {
      const result = await client.query(
        `
        UPDATE problem_reports
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
        `,
        [status, params.id]
      )

      if (result.rowCount === 0) {
        return NextResponse.json({ error: "Problem report not found" }, { status: 404 })
      }

      return NextResponse.json({ report: result.rows[0] })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error updating problem report status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}