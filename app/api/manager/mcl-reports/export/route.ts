import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { pool } from "@/lib/database"

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(request.url)
    // You can parse filters here if needed, e.g. dateFrom, dateTo, user, month

    const client = await pool.connect()
    try {
      const result = await client.query(`
        SELECT 
          m.id,
          c.value AS clientName,
          u.name AS submittedBy,
          m.entry_at,
          m.exit_at,
          vt.value AS visitType,
          p.value AS purpose,
          m.status,
          m.approved_by,
          m.approved_at,
          m.rejected_by,
          m.rejected_at
        FROM mcl_reports m
        LEFT JOIN lookup_list_values c ON m.client_name_id = c.id
        LEFT JOIN users u ON m.user_id = u.emp_id
        LEFT JOIN lookup_list_values vt ON m.visit_type_id = vt.id
        LEFT JOIN lookup_list_values p ON m.purpose_id = p.id
        ORDER BY m.entry_at DESC
      `)
      return NextResponse.json({ reports: result.rows })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error exporting MCL reports:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}