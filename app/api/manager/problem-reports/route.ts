import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/database'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const reports = await db.getProblemReports()
    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Error fetching problem reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}