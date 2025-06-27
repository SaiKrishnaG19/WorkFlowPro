"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, Plus, Search, Eye, Edit, ArrowLeft, Clock, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

interface User {
  empId: string
  role: string
  name: string
}

interface ProblemReport {
  id: string
  client_name: string
  environment: string
  problem_statement: string
  received_at: string
  rca: string
  solution: string
  attended_by: string
  status: "Open" | "In Progress" | "Closed"
  sla_hours: number
  submitted_by: string
  submitted_at: string
}

export default function ProblemReportsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [reports, setReports] = useState<ProblemReport[]>([])
  const [filteredReports, setFilteredReports] = useState<ProblemReport[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include'
        })
        
        if (!response.ok) {
          router.push('/')
          return
        }

        const userData = await response.json()
        setUser(userData)

        // Fetch problem reports
        const reportsResponse = await fetch('/api/problem-reports', {
          credentials: 'include'
        })

        if (!reportsResponse.ok) {
          throw new Error('Failed to fetch reports')
        }

        const { reports: reportsData } = await reportsResponse.json()
        setReports(reportsData)
        setFilteredReports(reportsData)
      } catch (error) {
        console.error('Error:', error)
        router.push('/')
      }
    }

    checkSession()
  }, [router])

  useEffect(() => {
    let filtered = reports

    if (searchTerm) {
      filtered = filtered.filter(
        (report) =>
          report.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.problem_statement.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((report) => report.status === statusFilter)
    }

    setFilteredReports(filtered)
  }, [searchTerm, statusFilter, reports])

  const getStatusBadge = (status: string) => {
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
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString()
  }

  const getSLAStatus = (receivedAt: string, slaHours: number, status: string) => {
    if (status === "Closed") return null

    const received = new Date(receivedAt)
    const slaDeadline = new Date(received.getTime() + slaHours * 60 * 60 * 1000)
    const now = new Date()

    if (now > slaDeadline) {
      return (
        <Badge variant="destructive" className="ml-2">
          SLA Breached
        </Badge>
      )
    } else {
      const hoursLeft = Math.ceil((slaDeadline.getTime() - now.getTime()) / (1000 * 60 * 60))
      return (
        <Badge variant="outline" className="ml-2">
          {hoursLeft}h left
        </Badge>
      )
    }
  }

  if (!user) return null

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
              <AlertTriangle className="h-8 w-8 text-orange-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Problem Reports</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">{user?.role}</Badge>
              <span className="text-sm text-gray-700">{user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Problem Reports</h2>
            <p className="text-gray-600">Track and manage problem reports with SLA monitoring</p>
          </div>
          {user?.role === "User" && (
            <Link href="/problem-reports/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Report
              </Button>
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Open</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports.filter((r) => r.status === "Open").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports.filter((r) => r.status === "In Progress").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Closed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports.filter((r) => r.status === "Closed").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by client, report ID, or problem..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>Reports ({filteredReports.length})</CardTitle>
            <CardDescription>Problem reports with SLA tracking and status management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Environment</TableHead>
                    <TableHead>Problem Statement</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Attended By</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.id}</TableCell>
                      <TableCell>{report.client_names}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{report.environment}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{report.problem_statement}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getStatusBadge(report.status)}
                          {getSLAStatus(report.received_at, report.sla_hours, report.status)}
                        </div>
                      </TableCell>
                      <TableCell>{report.sla_hours}h</TableCell>
                      <TableCell>{report.attended_by}</TableCell>
                      <TableCell>{formatDateTime(report.received_at)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {report.status !== "Closed" && user?.role === "User" && report.submitted_by === user?.name && (
                            <Link href={`/problem-reports/edit/${report.id}`}>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredReports.length === 0 && (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No problem reports found matching your criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
