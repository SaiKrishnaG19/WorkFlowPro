export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  priority: NotificationPriority
  status: NotificationStatus
  data?: Record<string, any> // Additional context data
  action_url?: string
  created_at: Date
  read_at?: Date
  expires_at?: Date
}

export type NotificationType = 
  | 'info'
  | 'success' 
  | 'warning'
  | 'error'
  | 'mcl_report'
  | 'problem_report'
  | 'discussion'
  | 'system'

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'

export type NotificationStatus = 'unread' | 'read' | 'archived'

export interface NotificationPreferences {
  user_id: string
  email_notifications: boolean
  push_notifications: boolean
  notification_types: NotificationType[]
  quiet_hours_start?: string
  quiet_hours_end?: string
}

export interface CreateNotificationRequest {
  user_id: string
  title: string
  message: string
  type: NotificationType
  priority?: NotificationPriority
  data?: Record<string, any>
  action_url?: string
  expires_at?: Date
}

export interface NotificationFilters {
  status?: NotificationStatus
  type?: NotificationType
  priority?: NotificationPriority
  limit?: number
  offset?: number
}
