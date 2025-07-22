import { Pool } from 'pg'
import { 
  Notification, 
  CreateNotificationRequest, 
  NotificationFilters,
  NotificationStatus 
} from './notification-types'

export class NotificationService {
  constructor(private pool: Pool) {}

  async createNotification(request: CreateNotificationRequest): Promise<Notification> {
    const id = crypto.randomUUID()
    const now = new Date()
    
    const query = `
      INSERT INTO notifications (
        id, user_id, title, message, type, priority, data, action_url, 
        status, created_at, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `
    
    const values = [
      id,
      request.user_id,
      request.title,
      request.message,
      request.type,
      request.priority || 'medium',
      request.data ? JSON.stringify(request.data) : null,
      request.action_url,
      'unread',
      now,
      request.expires_at
    ]

    const result = await this.pool.query(query, values)
    return this.mapRowToNotification(result.rows[0])
  }

  async getNotifications(
    userId: string, 
    filters: NotificationFilters = {}
  ): Promise<Notification[]> {
    let query = `
      SELECT * FROM notifications 
      WHERE user_id = $1 
      AND (expires_at IS NULL OR expires_at > NOW())
    `
    const values: any[] = [userId]
    let paramCount = 1

    if (filters.status) {
      paramCount++
      query += ` AND status = $${paramCount}`
      values.push(filters.status)
    }

    if (filters.type) {
      paramCount++
      query += ` AND type = $${paramCount}`
      values.push(filters.type)
    }

    if (filters.priority) {
      paramCount++
      query += ` AND priority = $${paramCount}`
      values.push(filters.priority)
    }

    query += ` ORDER BY created_at DESC`

    if (filters.limit) {
      paramCount++
      query += ` LIMIT $${paramCount}`
      values.push(filters.limit)
    }

    if (filters.offset) {
      paramCount++
      query += ` OFFSET $${paramCount}`
      values.push(filters.offset)
    }

    const result = await this.pool.query(query, values)
    return result.rows.map(this.mapRowToNotification)
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const query = `
      UPDATE notifications 
      SET status = 'read', read_at = NOW() 
      WHERE id = $1 AND user_id = $2
    `
    const result = await this.pool.query(query, [notificationId, userId])
    return result.rowCount! > 0
  }

  async markAllAsRead(userId: string): Promise<number> {
    const query = `
      UPDATE notifications 
      SET status = 'read', read_at = NOW() 
      WHERE user_id = $1 AND status = 'unread'
    `
    const result = await this.pool.query(query, [userId])
    return result.rowCount || 0
  }

  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const query = `
      DELETE FROM notifications 
      WHERE id = $1 AND user_id = $2
    `
    const result = await this.pool.query(query, [notificationId, userId])
    return result.rowCount! > 0
  }

  async getUnreadCount(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = $1 AND status = 'unread'
      AND (expires_at IS NULL OR expires_at > NOW())
    `
    const result = await this.pool.query(query, [userId])
    return parseInt(result.rows[0].count)
  }

  async cleanupExpiredNotifications(): Promise<number> {
    const query = `
      DELETE FROM notifications 
      WHERE expires_at IS NOT NULL AND expires_at <= NOW()
    `
    const result = await this.pool.query(query)
    return result.rowCount || 0
  }

  private mapRowToNotification(row: any): Notification {
    return {
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      message: row.message,
      type: row.type,
      priority: row.priority,
      status: row.status,
      data: row.data ? JSON.parse(row.data) : undefined,
      action_url: row.action_url,
      created_at: new Date(row.created_at),
      read_at: row.read_at ? new Date(row.read_at) : undefined,
      expires_at: row.expires_at ? new Date(row.expires_at) : undefined
    }
  }

  // Helper methods for creating specific notification types
  async createMCLReportNotification(
    userId: string, 
    reportId: string, 
    action: 'created' | 'approved' | 'rejected'
  ): Promise<Notification> {
    const titles = {
      created: 'New MCL Report Submitted',
      approved: 'MCL Report Approved',
      rejected: 'MCL Report Rejected'
    }

    const messages = {
      created: 'A new MCL report has been submitted for review',
      approved: 'Your MCL report has been approved',
      rejected: 'Your MCL report has been rejected'
    }

    return this.createNotification({
      user_id: userId,
      title: titles[action],
      message: messages[action],
      type: 'mcl_report',
      priority: action === 'rejected' ? 'high' : 'medium',
      data: { reportId, action },
      action_url: `/mcl-reports/${reportId}`
    })
  }

  async createProblemReportNotification(
    userId: string, 
    reportId: string, 
    action: 'created' | 'updated' | 'closed'
  ): Promise<Notification> {
    const titles = {
      created: 'New Problem Report',
      updated: 'Problem Report Updated',
      closed: 'Problem Report Closed'
    }

    const messages = {
      created: 'A new problem report has been created',
      updated: 'A problem report has been updated',
      closed: 'A problem report has been closed'
    }

    return this.createNotification({
      user_id: userId,
      title: titles[action],
      message: messages[action],
      type: 'problem_report',
      priority: action === 'created' ? 'high' : 'medium',
      data: { reportId, action },
      action_url: `/problem-reports/${reportId}`
    })
  }

  async createDiscussionNotification(
    userId: string, 
    discussionId: string, 
    action: 'created' | 'replied' | 'mentioned'
  ): Promise<Notification> {
    const titles = {
      created: 'New Discussion Created',
      replied: 'New Reply in Discussion',
      mentioned: 'You were mentioned in a discussion'
    }

    const messages = {
      created: 'A new discussion has been started',
      replied: 'Someone replied to a discussion you\'re following',
      mentioned: 'You were mentioned in a discussion'
    }

    return this.createNotification({
      user_id: userId,
      title: titles[action],
      message: messages[action],
      type: 'discussion',
      priority: action === 'mentioned' ? 'high' : 'medium',
      data: { discussionId, action },
      action_url: `/discussions/${discussionId}`
    })
  }

  async createSystemNotification(
    userId: string, 
    title: string, 
    message: string, 
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      title,
      message,
      type: 'system',
      priority
    })
  }
}