import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const dbUsers = await db.getAllUsers()
    // Map database fields to just names for mentions
    const users = dbUsers
      .filter(user => user.is_active)
      .map(user => ({
        name: user.name,
        empId: user.emp_id,
        role: user.role
      }))
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users for mentions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}