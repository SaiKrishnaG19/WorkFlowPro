import { NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = DatabaseService.getInstance()
    const comments = await db.getDiscussionComments(id)

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const db = DatabaseService.getInstance()

    // Create the comment
    const comment = await db.createDiscussion({
      title: "", // Comments don't have titles
      content: data.content,
      user_id: session.empId,
      parent_post_id: parseInt(id),
      is_active: true
    })

    // If there are mentions, create a new discussion for each mentioned user
    if (data.mentions && data.mentions.length > 0) {
      const originalDiscussion = await db.getDiscussionById(id)
      if (originalDiscussion) {
        for (const mentionedUser of data.mentions) {
          // Create a new discussion with the mention
          await db.createDiscussion({
            title: `Re: ${originalDiscussion.title}`,
            content: `${session.name} mentioned you in a comment:\n\n${data.content}`,
            user_id: session.empId,
            is_active: true
          })
        }
      }
    }

    return NextResponse.json(comment)
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}