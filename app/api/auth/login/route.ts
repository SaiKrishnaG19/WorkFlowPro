import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { createSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { empId, password } = await request.json()

    if (!empId || !password) {
      return NextResponse.json({ error: "Employee ID and password are required" }, { status: 400 })
    }

    // Authenticate user
    const user = await db.authenticateUser(empId, password)

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create session token
    const token = await createSession(user)

    // Check if this is first-time login
    const isFirstTimeLogin = !user.last_login

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        empId: user.emp_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      passwordChangeRequired: user.password_change_required || isFirstTimeLogin,
      isFirstTimeLogin
    })

    // Set session cookie with 5-minute expiry for first-time login
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: isFirstTimeLogin ? 300 : 60 * 60 * 24, // 5 minutes for first login, 24 hours otherwise
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
