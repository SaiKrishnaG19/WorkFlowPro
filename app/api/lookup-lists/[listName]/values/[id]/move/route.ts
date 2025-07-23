import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { pool } from "@/lib/database"

export async function POST(request: NextRequest, { params }: { params: { listName: string; id: string } }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { listName, id } = await params
    const { direction } = await request.json()

    if (direction !== "up" && direction !== "down") {
      return NextResponse.json({ error: "Invalid direction" }, { status: 400 })
    }

    const client = await pool.connect()
    try {
      // Get current item's sort order
      const currentRes = await client.query(
        `SELECT id, sort_order FROM lookup_list_values WHERE id = $1 AND list_name = $2`,
        [id, listName]
      )
      if (currentRes.rowCount === 0) {
        return NextResponse.json({ error: "Value not found" }, { status: 404 })
      }
      const currentItem = currentRes.rows[0]

      // Determine the adjacent item to swap with
      const operator = direction === "up" ? "<" : ">"
      const orderBy = direction === "up" ? "DESC" : "ASC"

      const adjacentRes = await client.query(
        `SELECT id, sort_order FROM lookup_list_values 
         WHERE list_name = $1 AND sort_order ${operator} $2 
         ORDER BY sort_order ${orderBy} LIMIT 1`,
        [listName, currentItem.sort_order]
      )

      if (adjacentRes.rowCount === 0) {
        // No adjacent item to swap with (already at top or bottom)
        return NextResponse.json({ message: "No move needed" })
      }

      const adjacentItem = adjacentRes.rows[0]

      // Swap sort_order values
      await client.query("BEGIN")
      await client.query(
        `UPDATE lookup_list_values SET sort_order = $1 WHERE id = $2`,
        [adjacentItem.sort_order, currentItem.id]
      )
      await client.query(
        `UPDATE lookup_list_values SET sort_order = $1 WHERE id = $2`,
        [currentItem.sort_order, adjacentItem.id]
      )
      await client.query("COMMIT")

      return NextResponse.json({ message: "Value moved successfully" })
    } catch (error) {
      await client.query("ROLLBACK")
      console.error("Error moving lookup value:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error in move API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}