import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { approveMclReport, rejectMclReport } from '@/lib/dbextend'
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

    // Pass filters to your DB function
    const reports = await db.getMCLReportsForManager({ dateFrom, dateTo, user, month })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Error fetching MCL reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params
  const url = new URL(request.url)
  const action = url.pathname.endsWith('/approve') ? 'approve' : url.pathname.endsWith('/reject') ? 'reject' : null

  if (!action) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  try {
    if (action === 'approve') {
      await approveMclReport(id, session.empId, new Date())
    } else {
      await rejectMclReport(id, session.empId, new Date())
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error ${action} MCL report:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}