import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { pool } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const client = await pool.connect()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      // Query distinct list names
      const listResult = await client.query(
        "SELECT DISTINCT list_name FROM lookup_list_values ORDER BY list_name"
      )
      const listNames = listResult.rows.map((row: { list_name: string }) => row.list_name)

      // For each list name, fetch its values
      const lookupLists = await Promise.all(
        listNames.map(async (listName) => {
          const valuesResult = await client.query(
            `SELECT id as i, value, sort_order as "sortOrder" 
             FROM lookup_list_values 
             WHERE list_name = $1 
             ORDER BY sort_order`,
            [listName]
          )

          return {
            name: listName,
            displayName: listName.charAt(0).toUpperCase() + listName.slice(1),
            values: valuesResult.rows,
          }
        })
      )

      return NextResponse.json({ lookupLists })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error fetching lookup lists:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}