"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  Download,
  Filter,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"

interface User {
  empId: string
  role: string
  name: string
}

interface MCLReport {
  id: string
  clientName: string
  submittedBy: string
  submittedAt: string
  status: "Pending Approval" | "Approved" | "Rejected"
  visitType: string
  purpose: string
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
}

interface ProblemReport {
  id: string
  clientName: string
  submittedBy: string
  submittedAt: string
  status: "Open" | "In Progress" | "Closed"
  environment: string
  slaHours: number
}

export default function ManagerDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [mclReports, setMclReports] = useState<MCLReport[]>([])
  const [problemReports, setProblemReports] = useState<ProblemReport[]>([])
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedUser, setSelectedUser] = useState("all")
  const [selectedMonth, setSelectedMonth] = useState("")
  const router = useRouter()

  const loadReports = () => {
    // Load reports from localStorage (submitted by users) and combine with mock data
    const savedMCLReports = JSON.parse(localStorage.getItem("mclReports") || "[]")

    // Load manager actions (approvals/rejections) from localStorage
    const managerActions = JSON.parse(localStorage.getItem("managerActions") || "[]")

    // Mock data for demonstration - ensure consistency
    const mockMCLReports: MCLReport[] = [
      {
        id: "MCL-2025-001",
        clientName: "TechCorp Solutions",
        submittedBy: "Alice User",
        submittedAt: "2025-06-18T18:00:00",
        status: "Approved",
        visitType: "On-site Support",
        purpose: "System Maintenance",
        approvedBy: "Bob Manager",
        approvedAt: "2025-06-18T19:00:00",
      },
      {
        id: "MCL-2025-002",
        clientName: "DataFlow Inc",
        submittedBy: "Alice User",
        submittedAt: "2025-06-17T22:30:00",
        status: "Pending Approval",
        visitType: "Remote Support",
        purpose: "Troubleshooting",
      },
      {
        id: "MCL-2025-003",
        clientName: "CloudTech Ltd",
        submittedBy: "Alice User",
        submittedAt: "2025-06-16T15:30:00",
        status: "Rejected",
        visitType: "On-site Support",
        purpose: "Installation",
        rejectedBy: "Bob Manager",
        rejectedAt: "2025-06-16T16:00:00",
      },
    ]

    // Combine saved reports with mock data and remove duplicates
    const allMCLReports = [...mockMCLReports, ...savedMCLReports]
    const uniqueMCLReports = allMCLReports.filter(
      (report, index, self) => index === self.findIndex((r) => r.id === report.id),
    )

    // Apply manager actions to update report statuses
    const updatedReports = uniqueMCLReports.map((report) => {
      const action = managerActions.find((action: any) => action.reportId === report.id)
      if (action) {
        return {
          ...report,
          status: action.status,
          approvedBy: action.status === "Approved" ? action.actionBy : report.approvedBy,
          approvedAt: action.status === "Approved" ? action.actionAt : report.approvedAt,
          rejectedBy: action.status === "Rejected" ? action.actionBy : report.rejectedBy,
          rejectedAt: action.status === "Rejected" ? action.actionAt : report.rejectedAt,
        }
      }
      return report
    })

    console.log("Manager Dashboard MCL Debug:", {
      totalReports: updatedReports.length,
      savedReports: savedMCLReports.length,
      mockReports: mockMCLReports.length,
      managerActions: managerActions.length,
    })

    setMclReports(updatedReports)

    const mockProblemReports: ProblemReport[] = [
      {
        id: "PRB-2025-001",
        clientName: "TechCorp Solutions",
        submittedBy: "Alice User",
        submittedAt: "2025-06-18T10:30:00",
        status: "Closed",
        environment: "Production",
        slaHours: 4,
      },
    ]

    // Combine saved reports with mock data
    const savedProblemReports = JSON.parse(localStorage.getItem("problemReports") || "[]")
    const allProblemReports = [...mockProblemReports, ...savedProblemReports]

    setProblemReports(allProblemReports)
  }

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== "Manager" && parsedUser.role !== "Admin") {
      router.push("/dashboard")
      return
    }
    setUser(parsedUser)
  }, [router])

  useEffect(() => {
    if (user) {
      loadReports()

      // Set up interval to refresh data every 10 seconds
      const interval = setInterval(loadReports, 10000)

      // Listen for storage changes
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "mclReports" || e.key === "managerActions" || e.key === "problemReports") {
          loadReports()
        }
      }

      window.addEventListener("storage", handleStorageChange)

      return () => {
        clearInterval(interval)
        window.removeEventListener("storage", handleStorageChange)
      }
    }
  }, [user])

  const handleApprove = (reportId: string) => {
    if (!user) return

    const now = new Date().toISOString()

    // Update local state immediately
    setMclReports((prev) =>
      prev.map((report) =>
        report.id === reportId
          ? {
              ...report,
              status: "Approved" as const,
              approvedBy: user.name,
              approvedAt: now,
            }
          : report,
      ),
    )

    // Save manager action to localStorage for persistence
    const managerActions = JSON.parse(localStorage.getItem("managerActions") || "[]")
    const existingActionIndex = managerActions.findIndex((action: any) => action.reportId === reportId)

    const newAction = {
      reportId,
      status: "Approved",
      actionBy: user.name,
      actionAt: now,
    }

    if (existingActionIndex >= 0) {
      managerActions[existingActionIndex] = newAction
    } else {
      managerActions.push(newAction)
    }

    localStorage.setItem("managerActions", JSON.stringify(managerActions))

    // Also update the main mclReports if the report exists there
    const savedReports = JSON.parse(localStorage.getItem("mclReports") || "[]")
    const updatedSavedReports = savedReports.map((report: MCLReport) =>
      report.id === reportId
        ? {
            ...report,
            status: "Approved" as const,
            approvedBy: user.name,
            approvedAt: now,
          }
        : report,
    )
    localStorage.setItem("mclReports", JSON.stringify(updatedSavedReports))

    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent("reportStatusChanged", { detail: { reportId, status: "Approved" } }))
  }

  const handleReject = (reportId: string) => {
    if (!user) return

    const now = new Date().toISOString()

    // Update local state immediately
    setMclReports((prev) =>
      prev.map((report) =>
        report.id === reportId
          ? {
              ...report,
              status: "Rejected" as const,
              rejectedBy: user.name,
              rejectedAt: now,
            }
          : report,
      ),
    )

    // Save manager action to localStorage for persistence
    const managerActions = JSON.parse(localStorage.getItem("managerActions") || "[]")
    const existingActionIndex = managerActions.findIndex((action: any) => action.reportId === reportId)

    const newAction = {
      reportId,
      status: "Rejected",
      actionBy: user.name,
      actionAt: now,
    }

    if (existingActionIndex >= 0) {
      managerActions[existingActionIndex] = newAction
    } else {
      managerActions.push(newAction)
    }

    localStorage.setItem("managerActions", JSON.stringify(managerActions))

    // Also update the main mclReports if the report exists there
    const savedReports = JSON.parse(localStorage.getItem("mclReports") || "[]")
    const updatedSavedReports = savedReports.map((report: MCLReport) =>
      report.id === reportId
        ? {
            ...report,
            status: "Rejected" as const,
            rejectedBy: user.name,
            rejectedAt: now,
          }
        : report,
    )
    localStorage.setItem("mclReports", JSON.stringify(updatedSavedReports))

    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent("reportStatusChanged", { detail: { reportId, status: "Rejected" } }))
  }

  const handleExport = (type: "mcl" | "problem", format: "csv" | "excel") => {
    // Simulate export
    const data = type === "mcl" ? mclReports : problemReports
    const filename = `${type}_reports_${new Date().toISOString().split("T")[0]}.${format}`

    // In a real app, this would generate and download the file
    alert(`Exporting ${data.length} ${type} reports as ${format.toUpperCase()} file: ${filename}`)
  }

  const getStatusBadge = (status: string, type: "mcl" | "problem") => {
    if (type === "mcl") {
      switch (status) {
        case "Approved":
          return (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Approved
            </Badge>
          )
        case "Pending Approval":
          return (
            <Badge className="bg-yellow-100 text-yellow-800">
              <Clock className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          )
        case "Rejected":
          return (
            <Badge className="bg-red-100 text-red-800">
              <XCircle className="h-3 w-3 mr-1" />
              Rejected
            </Badge>
          )
      }
    } else {
      switch (status) {
        case "Open":
          return (
            <Badge className="bg-red-100 text-red-800">
              <XCircle className="h-3 w-3 mr-1" />
              Open
            </Badge>
          )
        case "In Progress":
          return (
            <Badge className="bg-blue-100 text-blue-800">
              <Clock className="h-3 w-3 mr-1" />
              In Progress
            </Badge>
          )
        case "Closed":
          return (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Closed
            </Badge>
          )
      }
    }
    return <Badge variant="secondary">{status}</Badge>
  }

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString()
  }

  if (!user) return null

  const stats = {
    mclPending: mclReports.filter((r) => r.status === "Pending Approval").length,
    mclApproved: mclReports.filter((r) => r.status === "Approved").length,
    mclRejected: mclReports.filter((r) => r.status === "Rejected").length,
    problemOpen: problemReports.filter((r) => r.status === "Open").length,
    problemInProgress: problemReports.filter((r) => r.status === "In Progress").length,
    problemClosed: problemReports.filter((r) => r.status === "Closed").length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Manager Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">{user.role}</Badge>
              <span className="text-sm text-gray-700">{user.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Manager Dashboard</h2>
          <p className="text-gray-600">Review, approve, and export reports with advanced filtering capabilities</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">MCL Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.mclPending}</p>
                  <p className="text-xs text-gray-500">Total MCL: {mclReports.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">MCL Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.mclApproved}</p>
                  <p className="text-xs text-gray-500">Rejected: {stats.mclRejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Problems Open</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.problemOpen}</p>
                  <p className="text-xs text-gray-500">Total: {problemReports.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Problems Active</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.problemInProgress}</p>
                  <p className="text-xs text-gray-500">Closed: {stats.problemClosed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters & Export
            </CardTitle>
            <CardDescription>Filter reports by date range, user, or month and export data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">From Date</Label>
                <Input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">To Date</Label>
                <Input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="selectedUser">User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="Alice User">Alice User</SelectItem>
                    <SelectItem value="David Support">David Support</SelectItem>
                    <SelectItem value="Sarah Tech">Sarah Tech</SelectItem>
                    <SelectItem value="Mike Developer">Mike Developer</SelectItem>
                    <SelectItem value="Lisa Analyst">Lisa Analyst</SelectItem>
                    <SelectItem value="Bob Manager">Bob Manager</SelectItem>
                    <SelectItem value="Emma Lead">Emma Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="selectedMonth">Month/Year</Label>
                <Input
                  id="selectedMonth"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleExport("mcl", "csv")} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export MCL (CSV)
              </Button>
              <Button onClick={() => handleExport("mcl", "excel")} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export MCL (Excel)
              </Button>
              <Button onClick={() => handleExport("problem", "csv")} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Problems (CSV)
              </Button>
              <Button onClick={() => handleExport("problem", "excel")} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Problems (Excel)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reports Tabs */}
        <Tabs defaultValue="mcl" className="space-y-4">
          <TabsList>
            <TabsTrigger value="mcl" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              MCL Reports ({mclReports.length})
            </TabsTrigger>
            <TabsTrigger value="problem" className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Problem Reports ({problemReports.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mcl">
            <Card>
              <CardHeader>
                <CardTitle>MCL Reports - Approval Workflow</CardTitle>
                <CardDescription>Review and approve/reject MCL reports submitted by team members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Report ID</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Submitted At</TableHead>
                        <TableHead>Visit Type</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mclReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">{report.id}</TableCell>
                          <TableCell>{report.clientName}</TableCell>
                          <TableCell>{report.submittedBy}</TableCell>
                          <TableCell>{formatDateTime(report.submittedAt)}</TableCell>
                          <TableCell>{report.visitType}</TableCell>
                          <TableCell>{report.purpose}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {getStatusBadge(report.status, "mcl")}
                              {report.approvedBy && <p className="text-xs text-gray-500">by {report.approvedBy}</p>}
                              {report.rejectedBy && <p className="text-xs text-gray-500">by {report.rejectedBy}</p>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                              {report.status === "Pending Approval" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprove(report.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleReject(report.id)}>
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="problem">
            <Card>
              <CardHeader>
                <CardTitle>Problem Reports - Monitoring</CardTitle>
                <CardDescription>Monitor problem reports and track resolution progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Report ID</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Submitted At</TableHead>
                        <TableHead>Environment</TableHead>
                        <TableHead>SLA Hours</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {problemReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">{report.id}</TableCell>
                          <TableCell>{report.clientName}</TableCell>
                          <TableCell>{report.submittedBy}</TableCell>
                          <TableCell>{formatDateTime(report.submittedAt)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{report.environment}</Badge>
                          </TableCell>
                          <TableCell>{report.slaHours}h</TableCell>
                          <TableCell>{getStatusBadge(report.status, "problem")}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
