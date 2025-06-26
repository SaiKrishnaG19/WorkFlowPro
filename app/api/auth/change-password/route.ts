import { type NextRequest, NextResponse } from "next/server"
import { getSession, createSession } from "@/lib/auth"
import { db } from "@/lib/database"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { newPassword } = await request.json()

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    // Update password and mark first login complete by setting last_login
    await db.updateUser(session.empId, {
      password_hash: await bcrypt.hash(newPassword, 10),
      password_change_required: false,
      last_login: new Date()
    })

    // Create new session with 24-hour expiry
    const user = await db.getUserById(session.empId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const token = await createSession(user)
    const response = NextResponse.json({ success: true })

    // Set new session cookie with 24-hour expiry
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Password change error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
