import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/database'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const dateFrom = url.searchParams.get('dateFrom') || undefined
    const dateTo = url.searchParams.get('dateTo') || undefined
    const user = url.searchParams.get('user') || undefined
    const month = url.searchParams.get('month') || undefined

    const reports = await db.getProblemReportsForManager({ dateFrom, dateTo, user, month })
    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Error fetching problem reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}