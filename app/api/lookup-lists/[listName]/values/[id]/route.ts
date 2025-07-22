import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { pool } from "@/lib/database"

export async function PUT(request: NextRequest, { params }: { params: { listName: string; id: string } }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { listName, id } = await params
    const { value } = await request.json()

    if (!value || typeof value !== "string" || value.trim() === "") {
      return NextResponse.json({ error: "Invalid value" }, { status: 400 })
    }

    const client = await pool.connect()
    try {
      // Update the value in the database
      const result = await client.query(
        `UPDATE lookup_list_values SET value = $1 WHERE id = $2 AND list_name = $3`,
        [value.trim(), id, listName]
      )

      if (result.rowCount === 0) {
        return NextResponse.json({ error: "Value not found" }, { status: 404 })
      }

      return NextResponse.json({ message: "Value updated successfully" })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error updating lookup value:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { listName: string; id: string } }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { listName, id } = await params

    const client = await pool.connect()
    try {
      const result = await client.query(
        `DELETE FROM lookup_list_values WHERE id = $1 AND list_name = $2`,
        [id, listName]
      )

      if (result.rowCount === 0) {
        return NextResponse.json({ error: "Value not found" }, { status: 404 })
      }

      return NextResponse.json({ message: "Value deleted successfully" })
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("Error deleting lookup value:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}