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

    const { id } = params
    const data = await request.json()
    const db = DatabaseService.getInstance()

    // Fetch discussion to check author
    const discussion = await db.getDiscussionById(id)
    if (!discussion) {
      return NextResponse.json({ error: "Discussion not found" }, { status: 404 })
    }
    if (discussion.user_id !== session.empId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Only author can update
    const updated = await db.updateDiscussion(id, {
      title: data.title,
      content: data.content,
      is_active: data.isActive
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating discussion:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const db = DatabaseService.getInstance()
    const discussion = await db.getDiscussionById(id)
    if (!discussion) {
      return NextResponse.json({ error: "Discussion not found" }, { status: 404 })
    }
    if (discussion.user_id !== session.empId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Soft delete: set is_active = false
    await db.updateDiscussion(id, { is_active: false })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting discussion:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}