import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.role === "User" ? session.empId : undefined
    const reports = await db.getMCLReports(userId)

    return NextResponse.json({ reports })
  } catch (error) {
    console.error("Error fetching MCL reports:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const reportData = await request.json()
    reportData.user_id = session.empId

    const report = await db.createMCLReport(reportData)

    return NextResponse.json({ report }, { status: 201 })
  } catch (error) {
    console.error("Error creating MCL report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
