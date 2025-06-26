import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all available lookup list names
    const client = await db.pool.connect()
    try {
      const result = await client.query(
        "SELECT DISTINCT list_name FROM lookup_list_values ORDER BY list_name"
      )
      
      const listNames = result.rows.map((row: { list_name: string }) => row.list_name)
      return NextResponse.json({ listNames })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching lookup lists:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}