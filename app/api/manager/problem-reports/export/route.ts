import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { pool } from "@/lib/database"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const client = await pool.connect()
    try {
      const result = await client.query(`
        SELECT 
          p.id,
          c.value AS clientName,
          u.name AS submittedBy,
          e.value AS environment,
          p.received_at,
          p.problem_statement,
          p.solution,
          p.rca,
          p.sla_hours,
          p.status,
          p.updated_at AS resolved_at
        FROM problem_reports p
        LEFT JOIN lookup_list_values c ON p.client_name_id = c.id
        LEFT JOIN users u ON p.user_id = u.emp_id
        LEFT JOIN lookup_list_values e ON p.environment_id = e.id
        ORDER BY p.received_at DESC
      `)
      return NextResponse.json({ reports: result.rows })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error exporting problem reports:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}