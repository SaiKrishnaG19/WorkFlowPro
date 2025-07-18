import { pool } from '@/lib/database'

export async function approveMclReport(reportId: string, empId: string, date: Date) {
  const client = await pool.connect()
  try {
    await client.query(
      `
      UPDATE mcl_reports
      SET status = 'Approved', approved_by = $1, approved_at = $2
      WHERE id = $3
      `,
      [empId, date.toISOString(), reportId]
    )
  } finally {
    client.release()
  }
}

export async function rejectMclReport(reportId: string, empId: string, date: Date) {
  const client = await pool.connect()
  try {
    await client.query(
      `
      UPDATE mcl_reports
      SET status = 'Rejected', rejected_by = $1, rejected_at = $2
      WHERE id = $3
      `,
      [empId, date.toISOString(), reportId]
    )
  } finally {
    client.release()
  }
}

// Example function to fetch MCL reports
export async function getMCLReports() {
  const client = await pool.connect()
  try {
    const result = await client.query('SELECT * FROM mcl_reports')
    return result.rows
  } finally {
    client.release()
  }
}