import { NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET() {
  try {
    // Fetch active users from database
    const users = await db.getAllUsers() // You can add a new method to get only active users if preferred

    // Filter active users here or in DB method
    const activeUsers = users.filter((u) => u.is_active)

    // Map to minimal info for frontend
    const responseUsers = activeUsers.map((u) => ({
      empId: u.emp_id,
      name: u.name,
    }))

    return NextResponse.json({ users: responseUsers })
  } catch (error) {
    console.error("Error fetching active users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}