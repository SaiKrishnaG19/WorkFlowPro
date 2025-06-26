import { Pool } from 'pg'

export interface User {
  emp_id: string
  name: string
  email: string
  password_hash: string
  role: UserRole
  is_active: boolean
  created_at: Date
  updated_at: Date
  last_login?: Date
  password_change_required?: boolean
}

export type UserRole = 'User' | 'Manager' | 'Admin'

export interface MCLReport {
  id: string
  client_name_id: number
  user_id: string
  entry_at: Date
  exit_at: Date
  visit_type_id: number
  purpose_id: number
  shift_id: number
  remark: string
  status: MCLReportStatus
  created_at: Date
  updated_at: Date
  approved_by?: string
  approved_at?: Date
  rejected_by?: string
  rejected_at?: Date
}

export type MCLReportStatus = 'Pending Approval' | 'Approved' | 'Rejected'

export interface ProblemReport {
  id: string
  client_name_id: number
  environment_id: number
  problem_statement: string
  received_at: Date
  rca?: string
  solution?: string
  attended_by_id: string
  status: ProblemReportStatus
  sla_hours: number
  user_id: string
  created_at: Date
  updated_at: Date
}

export type ProblemReportStatus = 'Open' | 'In Progress' | 'Closed'

export interface Discussion {
  id: number
  title: string
  content: string
  report_type?: ReportType
  report_id?: string
  user_id: string
  parent_post_id?: number
  attachment_url?: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export type ReportType = 'MCL' | 'Problem'

export interface LookupListValue {
  id: number
  list_name: string
  value: string
  sort_order: number
  manager_id?: string
  created_at: Date
  updated_at: Date
}

export interface DatabaseHealth {
  status: DatabaseStatus
  responseTime: number
  poolStats: PoolStats
  lastCheck: Date
}

export type DatabaseStatus = 'healthy' | 'degraded' | 'unhealthy'

export interface PoolStats {
  totalCount: number
  idleCount: number
  waitingCount: number
}