import { NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const db = DatabaseService.getInstance()
    const discussion = await db.getDiscussionById(id)

    if (!discussion) {
      return NextResponse.json({ error: "Discussion not found" }, { status: 404 })
    }

    return NextResponse.json(discussion)
  } catch (error) {
    console.error("Error fetching discussion:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()
    const db = DatabaseService.getInstance()

    const discussion = await db.updateDiscussion(id, {
      title: data.title,
      content: data.content,
      is_active: data.isActive
    })

    return NextResponse.json(discussion)
  } catch (error) {
    console.error("Error updating discussion:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}