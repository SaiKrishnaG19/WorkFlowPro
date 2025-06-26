import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { hasPermission } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = request.headers.get("session")
    if (!session || !hasPermission(JSON.parse(session).role, "Admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUsers = await db.getAllUsers()
    // Map database fields to frontend SystemUser interface
    const users = dbUsers.map(user => ({
      empId: user.emp_id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      lastLogin: user.last_login || null
    })).filter(user => user !== null)
    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = request.headers.get("session")
    if (!session) {
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 })
    }

    const sessionData = JSON.parse(session)
    if (!hasPermission(sessionData.role, "Admin")) {
      return NextResponse.json({ error: "Unauthorized - Insufficient permissions" }, { status: 401 })
    }

    const data = await request.json()
    const { empId, name, email, role, password } = data

    if (!empId || !name || !email || !role || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const dbUser = await db.createUser({ emp_id: empId, name, email, role, password_hash: password, is_active: true })
    // Map database response to frontend SystemUser interface
    const user = {
      empId: dbUser.emp_id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      isActive: dbUser.is_active,
      createdAt: dbUser.created_at,
      lastLogin: dbUser.last_login || null
    }
    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = request.headers.get("session")
    if (!session) {
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 })
    }

    const sessionData = JSON.parse(session)
    if (!hasPermission(sessionData.role, "Admin")) {
      return NextResponse.json({ error: "Unauthorized - Insufficient permissions" }, { status: 401 })
    }

    const data = await request.json()
    const { empId, name, email, role, isActive } = data

    if (!empId) {
      return NextResponse.json({ error: "Missing employee ID" }, { status: 400 })
    }

    await db.updateUser(empId, { name, email, role, is_active: isActive })
    // Get updated user data and map to frontend format
    const dbUser = (await db.getAllUsers()).find(u => u.emp_id === empId)
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    const user = {
      empId: dbUser.emp_id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      isActive: dbUser.is_active,
      createdAt: dbUser.created_at,
      lastLogin: dbUser.last_login
    }
    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = request.headers.get("session")
    if (!session) {
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 })
    }

    const sessionData = JSON.parse(session)
    if (!hasPermission(sessionData.role, "Admin")) {
      return NextResponse.json({ error: "Unauthorized - Insufficient permissions" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const empId = searchParams.get("empId")

    if (!empId) {
      return NextResponse.json({ error: "Missing employee ID" }, { status: 400 })
    }

    await db.deleteUser(empId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}