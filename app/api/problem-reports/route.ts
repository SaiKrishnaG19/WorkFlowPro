import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { pool, withRetry, withTransaction } from "@/lib/database"
import { db } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.role === "User" ? session.empId : undefined
    const reports = await db.getProblemReports(userId)

    return NextResponse.json({ reports })
  } catch (error) {
    console.error("Error fetching problem reports:", error)
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
      reportData.attended_by_id = session.empId

    const report = await db.createProblemReport(reportData)
  
      return NextResponse.json({ report })
    } catch (error) {
      console.error("Error creating problem report:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }

  

