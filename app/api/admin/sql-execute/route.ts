// FILEPATH: c:/Users/Pratyusha/Downloads/wms/app/api/admin/sql-execute/route.ts

import { NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await getSession()

  if (!session || session.role !== "Admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { query } = await req.json()

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 })
  }

  try {
    const result = await db.executeSqlQuery(query)
    return NextResponse.json({ result })
  } catch (error) {
    console.error("Error executing SQL query:", error)
    return NextResponse.json({ error: "Error executing SQL query" }, { status: 500 })
  }
}