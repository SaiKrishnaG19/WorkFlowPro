"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, AlertTriangle, MessageSquare, Users, Settings, Plus, TrendingUp, Clock, Bell } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { SessionUser } from "@/lib/auth"

interface DashboardClientProps {
  user: SessionUser
  mclReports: any[]
  problemReports: any[]
  discussions: any[]
}

export default function DashboardClient({ user, mclReports, problemReports, discussions }: DashboardClientProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const loadNotifications = async () => {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
        setShowNotifications(true)
      } else {
        setNotifications([])
        setShowNotifications(true)
      }
    } catch (error) {
      console.error("Error loading notifications:", error)
      setNotifications([])
      setShowNotifications(true)
    }
  }

  // Calculate stats
  const mclPending = mclReports.filter((r) => r.status === "Pending Approval").length
  const mclApproved = mclReports.filter((r) => r.status === "Approved").length
  const problemOpen = problemReports.filter((r) => r.status === "Open").length
  const problemInProgress = problemReports.filter((r) => r.status === "In Progress").length
  const discussionActive = discussions.filter((d) => d.is_active).length

  // Helper to get month and year from a date string or Date object
  const getMonthYear = (dateStr: string | Date) => {
    const date = new Date(dateStr)
    return { month: date.getMonth(), year: date.getFullYear() }
  }

    // Calculate problem reports count for current and previous month
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1)
  const prevMonth = prevMonthDate.getMonth()
  const prevYear = prevMonthDate.getFullYear()

  const problemCountCurrentMonth = problemReports.filter((r) => {
    const { month, year } = getMonthYear(r.created_at)
    return month === currentMonth && year === currentYear
  }).length

  const problemCountPrevMonth = problemReports.filter((r) => {
    const { month, year } = getMonthYear(r.created_at)
    return month === prevMonth && year === prevYear
  }).length

  // Calculate percentage increase, handle division by zero
  const problemMonthChange =
    problemCountPrevMonth === 0
      ? problemCountCurrentMonth > 0
        ? 100
        : 0
      : ((problemCountCurrentMonth - problemCountPrevMonth) / problemCountPrevMonth) * 100

  // Format percentage string with sign and rounded value
  const problemMonthChangeStr =
    (problemMonthChange >= 0 ? "+" : "") + problemMonthChange.toFixed(0) + "%"


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">WorkFlow Pro</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">{user.role}</Badge>
              <span className="text-sm text-gray-700">{user.name}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
              <Button variant="ghost" onClick={loadNotifications}>
                <Bell />
                {notifications.length > 0 && <Badge>{notifications.length}</Badge>}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {user.name}!</h2>
          <p className="text-gray-600">Here's an overview of your workload management system.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">MCL</p>
                  <p className="text-2xl font-bold text-gray-900">{mclReports.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Problem Reports</p>
                  <p className="text-2xl font-bold text-gray-900">{problemReports.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Discussions</p>
                  <p className="text-2xl font-bold text-gray-900">{discussions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{problemMonthChangeStr}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* MCL Reports */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 text-blue-600 mr-2" />
                MCL
              </CardTitle>
              <CardDescription>Manage Manpower, Cost & Logistics reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending Approval</span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    {mclPending}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Approved</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {mclApproved}
                  </Badge>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Link href="/mcl-reports" className="flex-1">
                    <Button className="w-full" size="sm">
                      View Reports
                    </Button>
                  </Link>
                  {user.role === "User" && (
                    <Link href="/mcl-reports/new">
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Problem Reports */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                Problem Reports
              </CardTitle>
              <CardDescription>Track and manage problem reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Open</span>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    {problemOpen}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">In Progress</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {problemInProgress}
                  </Badge>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Link href="/problem-reports" className="flex-1">
                    <Button className="w-full" size="sm">
                      View Reports
                    </Button>
                  </Link>
                  {user.role === "User" && (
                    <Link href="/problem-reports/new">
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Discussions */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 text-green-600 mr-2" />
                Discussions
              </CardTitle>
              <CardDescription>Collaborate and discuss issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Threads</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {discussionActive}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Threads</span>
                  <Badge variant="secondary">{discussions.length}</Badge>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Link href="/discussions" className="flex-1">
                    <Button className="w-full" size="sm">
                      View Discussions
                    </Button>
                  </Link>
                  <Link href="/discussions/new">
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Role-specific sections */}
        {(user.role === "Manager" || user.role === "Admin") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {user.role === "Manager" && (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
                    Manager Dashboard
                  </CardTitle>
                  <CardDescription>Filter, review, and export reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Access advanced filtering, approval workflows, and data export capabilities.
                    </p>
                    <div className="flex space-x-2">
                      <Link href="/manager/dashboard" className="flex-1">
                        <Button className="w-full" size="sm">
                          Open Dashboard
                        </Button>
                      </Link>
                      <Link href="/manager/lookup-lists">
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {user.role === "Admin" && (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 text-indigo-600 mr-2" />
                    User Management
                  </CardTitle>
                  <CardDescription>Manage users, roles, and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Create, activate, deactivate users and assign roles.</p>
                    <Link href="/admin/users">
                      <Button className="w-full" size="sm">
                        Manage Users
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Activity
              <Badge variant="outline" className="text-xs">
                PostgreSQL Powered
              </Badge>
            </CardTitle>
            <CardDescription>Latest updates from the production database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mclReports.slice(0, 3).map((report) => (
                <div key={report.id} className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">MCL Report for {report.client_name}</p>
                    <p className="text-xs text-gray-500">
                      by {report.submitted_by} • {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      report.status === "Approved"
                        ? "bg-green-100 text-green-800"
                        : report.status === "Rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {report.status}
                  </Badge>
                </div>
              ))}

              {problemReports.slice(0, 2).map((report) => (
                <div key={report.id} className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Problem Report for {report.client_name}</p>
                    <p className="text-xs text-gray-500">
                      by {report.submitted_by} • {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      report.status === "Closed"
                        ? "bg-green-100 text-green-800"
                        : report.status === "In Progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                    }
                  >
                    {report.status}
                  </Badge>
                </div>
              ))}

              {mclReports.length === 0 && problemReports.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activities found.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notification dropdown/modal */}
        {showNotifications && (
          <div className="absolute right-4 top-16 bg-white shadow-lg rounded-lg p-4 z-50 w-80">
            <h3 className="font-semibold mb-2">Notifications</h3>
            {notifications.length === 0 ? (
              <p className="text-gray-500">No notifications.</p>
            ) : (
              <ul className="space-y-2">
                {notifications.map((n) => (
                  <li key={n.id} className="text-sm text-gray-700 border-b pb-2">
                    {n.message}
                    <span className="block text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => setShowNotifications(false)}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
