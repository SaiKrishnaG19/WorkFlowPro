import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { hasPermission } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = request.headers.get("session")
    if (!session || !hasPermission(JSON.parse(session), "Admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { empId, newPassword } = data

    if (!empId || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await db.user.update({
      where: { empId },
      data: { password: newPassword }
    })
    
    // Set password change required flag
    await db.user.update({
      where: { empId },
      data: { passwordChangeRequired: true }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}