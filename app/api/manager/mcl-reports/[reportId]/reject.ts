import { NextApiRequest, NextApiResponse } from 'next'
import { pool } from '@/lib/database'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { reportId } = req.query

    try {
      const client = await pool.connect()
      try {
        // Query to reject the report
        const result = await client.query(
          'UPDATE mcl_reports SET status = $1 WHERE report_id = $2 RETURNING *',
          ['rejected', reportId]
        )
        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Report not found' })
        }
        return res.status(200).json({ message: 'Report rejected', report: result.rows[0] })
      } finally {
        client.release()
      }
    } catch (error) {
      console.error('Error rejecting report:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}