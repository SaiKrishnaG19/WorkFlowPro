import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { pool } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { listName: string } }) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Await params before accessing properties
    const { listName } = await params
    
    const client = await pool.connect()
    try {
      const result = await client.query(
        'SELECT id, list_name, value, sort_order FROM lookup_list_values WHERE list_name = $1 ORDER BY sort_order',
        [listName]
      )
      return NextResponse.json({ values: result.rows })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching lookup values:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
