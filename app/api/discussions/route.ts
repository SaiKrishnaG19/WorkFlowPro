import { NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = DatabaseService.getInstance()
    const discussions = await db.getDiscussions()

    return NextResponse.json(discussions)
  } catch (error) {
    console.error("Error fetching discussions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const db = DatabaseService.getInstance()

    const discussion = await db.createDiscussion({
      title: data.title,
      content: data.content,
      report_type: data.reportType,
      report_id: data.reportId,
      user_id: session.empId,
      is_active: true
    })

    return NextResponse.json(discussion)
  } catch (error) {
    console.error("Error creating discussion:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}