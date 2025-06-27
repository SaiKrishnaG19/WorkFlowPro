"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Plus, Search, Eye, Edit, Download, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface User {
  empId: string
  role: string
  name: string
}

interface MCLReport {
  id: string
  client_name: string
  entry_at: string
  exit_at: string
  visit_type: string
  purpose: string
  shift: string
  remark: string
  status: "Pending Approval" | "Approved" | "Rejected"
  submitted_by: string
  submitted_at: string
}

export default function MCLReportsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [reports, setReports] = useState<MCLReport[]>([])
  const [filteredReports, setFilteredReports] = useState<MCLReport[]>([])
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

        // Fetch MCL reports
        const reportsResponse = await fetch('/api/mcl-reports', {
          credentials: 'include'
        })

        if (!reportsResponse.ok) {
          throw new Error('Failed to fetch reports')
        }

        const { reports: fetchedReports } = await reportsResponse.json()
        setReports(fetchedReports)
        setFilteredReports(fetchedReports)
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
          report.purpose.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((report) => report.status === statusFilter)
    }

    setFilteredReports(filtered)
  }, [searchTerm, statusFilter, reports])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "Pending Approval":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "Rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString()
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
                  Back to Dashboard
                </Button>
              </Link>
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">MCL Reports</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">{user.role}</Badge>
              <span className="text-sm text-gray-700">{user.name}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by client, ID or purpose..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending Approval">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Link href="/mcl-reports/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
          </Link>
        </div>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>MCL Reports</CardTitle>
            <CardDescription>
              View and manage your Movement Control Log (MCL) reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report ID</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Visit Type</TableHead>
                  <TableHead>Entry Time</TableHead>
                  <TableHead>Exit Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.id}</TableCell>
                    <TableCell>{report.client_name}</TableCell>
                    <TableCell>{report.visit_type}</TableCell>
                    <TableCell>{formatDateTime(report.entry_at)}</TableCell>
                    <TableCell>{formatDateTime(report.exit_at)}</TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/mcl-reports/${report.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {report.status === "Pending Approval" && (
                          <Link href={`/mcl-reports/edit/${report.id}`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
