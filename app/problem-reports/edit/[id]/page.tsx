"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Send, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface User {
  empId: string
  role: string
  name: string
}

interface ProblemReport {
  id: string
  clientName: string
  environment: string
  problemStatement: string
  receivedAt: string
  rca: string
  solution: string
  attendedBy: string
  status: "Open" | "In Progress" | "Closed"
  slaHours: number
  submittedBy: string
  submittedAt: string
}

interface FormData {
  clientName: string
  environment: string
  problemStatement: string
  receivedAt: string
  rca: string
  solution: string
  attendedBy: string
  status: "Open" | "In Progress" | "Closed"
  slaHours: string
}

export default function EditProblemReportPage() {
  const [user, setUser] = useState<User | null>(null)
  const [report, setReport] = useState<ProblemReport | null>(null)
  const [formData, setFormData] = useState<FormData>({
    clientName: "",
    environment: "",
    problemStatement: "",
    receivedAt: "",
    rca: "",
    solution: "",
    attendedBy: "",
    status: "Open",
    slaHours: "4",
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const router = useRouter()
  const params = useParams()

  const lookupData = {
    clients: ["TechCorp Solutions", "DataFlow Inc", "CloudTech Ltd", "InnovateSoft", "SystemsPro"],
    environments: ["Production", "Staging", "Development", "Testing", "UAT"],
    slaOptions: [
      { value: "1", label: "1 Hour (Critical)" },
      { value: "2", label: "2 Hours (High)" },
      { value: "4", label: "4 Hours (Medium)" },
      { value: "8", label: "8 Hours (Low)" },
      { value: "24", label: "24 Hours (Planned)" },
    ],
  }

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }
    setUser(JSON.parse(userData))

    // Load the specific report
    const reportId = params.id as string
    const savedReports = JSON.parse(localStorage.getItem("problemReports") || "[]")
    const mockReports = [
      {
        id: "PRB-2025-001",
        clientName: "TechCorp Solutions",
        environment: "Production",
        problemStatement: "Database connection timeout errors occurring frequently",
        receivedAt: "2025-06-18T10:30",
        rca: "Connection pool exhaustion due to high traffic",
        solution: "Increased connection pool size and optimized queries",
        attendedBy: "Alice User",
        status: "Closed" as const,
        slaHours: 4,
        submittedBy: "Alice User",
        submittedAt: "2025-06-18T10:30:00",
      },
      {
        id: "PRB-2025-002",
        clientName: "DataFlow Inc",
        environment: "Staging",
        problemStatement: "Application crashes when processing large datasets",
        receivedAt: "2025-06-17T14:15",
        rca: "Memory leak in data processing module",
        solution: "Implementing fix and testing",
        attendedBy: "Alice User",
        status: "In Progress" as const,
        slaHours: 8,
        submittedBy: "Alice User",
        submittedAt: "2025-06-17T14:15:00",
      },
      {
        id: "PRB-2025-003",
        clientName: "CloudTech Ltd",
        environment: "Production",
        problemStatement: "Users unable to login to the system",
        receivedAt: "2025-06-16T09:00",
        rca: "",
        solution: "",
        attendedBy: "Alice User",
        status: "Open" as const,
        slaHours: 2,
        submittedBy: "Alice User",
        submittedAt: "2025-06-16T09:00:00",
      },
    ]

    const allReports = [...mockReports, ...savedReports]
    const foundReport = allReports.find((r) => r.id === reportId)

    if (!foundReport) {
      router.push("/problem-reports")
      return
    }

    setReport(foundReport)
    setFormData({
      clientName: foundReport.clientName,
      environment: foundReport.environment,
      problemStatement: foundReport.problemStatement,
      receivedAt: foundReport.receivedAt,
      rca: foundReport.rca,
      solution: foundReport.solution,
      attendedBy: foundReport.attendedBy,
      status: foundReport.status,
      slaHours: foundReport.slaHours.toString(),
    })
  }, [router, params.id])

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.clientName) newErrors.clientName = "Client name is required"
    if (!formData.environment) newErrors.environment = "Environment is required"
    if (!formData.problemStatement) newErrors.problemStatement = "Problem statement is required"
    if (!formData.receivedAt) newErrors.receivedAt = "Received time is required"
    if (!formData.attendedBy) newErrors.attendedBy = "Attended by is required"
    if (!formData.slaHours) newErrors.slaHours = "SLA hours is required"

    if (formData.status === "In Progress" || formData.status === "Closed") {
      if (!formData.rca) newErrors.rca = "RCA is required for In Progress/Closed status"
    }

    if (formData.status === "Closed") {
      if (!formData.solution) newErrors.solution = "Solution is required for Closed status"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !report) return

    setIsSubmitting(true)

    // Update the report
    const updatedReport = {
      ...report,
      ...formData,
      slaHours: Number.parseInt(formData.slaHours),
      updatedAt: new Date().toISOString(),
    }

    // Update in localStorage
    const savedReports = JSON.parse(localStorage.getItem("problemReports") || "[]")
    const updatedReports = savedReports.map((r: ProblemReport) => (r.id === report.id ? updatedReport : r))
    localStorage.setItem("problemReports", JSON.stringify(updatedReports))

    setIsSubmitting(false)
    setSubmitSuccess(true)

    setTimeout(() => {
      router.push("/problem-reports")
    }, 2000)
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  if (!user || !report) return null

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Updated Successfully!</h3>
            <p className="text-gray-600 mb-4">Your problem report has been updated.</p>
            <p className="text-sm text-gray-500">Redirecting to reports list...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/problem-reports">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Reports
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Edit Problem Report</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">{user.role}</Badge>
              <span className="text-sm text-gray-700">{user.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
              Edit Problem Report - {report.id}
            </CardTitle>
            <CardDescription>Update your problem report details and status.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Select value={formData.clientName} onValueChange={(value) => handleInputChange("clientName", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {lookupData.clients.map((client) => (
                        <SelectItem key={client} value={client}>
                          {client}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.clientName && <p className="text-sm text-red-600">{errors.clientName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="environment">Environment *</Label>
                  <Select
                    value={formData.environment}
                    onValueChange={(value) => handleInputChange("environment", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent>
                      {lookupData.environments.map((env) => (
                        <SelectItem key={env} value={env}>
                          {env}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.environment && <p className="text-sm text-red-600">{errors.environment}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="problemStatement">Problem Statement *</Label>
                <Textarea
                  id="problemStatement"
                  placeholder="Describe the problem in detail..."
                  value={formData.problemStatement}
                  onChange={(e) => handleInputChange("problemStatement", e.target.value)}
                  rows={4}
                />
                {errors.problemStatement && <p className="text-sm text-red-600">{errors.problemStatement}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="receivedAt">Received At *</Label>
                  <Input
                    id="receivedAt"
                    type="datetime-local"
                    value={formData.receivedAt}
                    onChange={(e) => handleInputChange("receivedAt", e.target.value)}
                  />
                  {errors.receivedAt && <p className="text-sm text-red-600">{errors.receivedAt}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slaHours">SLA Hours *</Label>
                  <Select value={formData.slaHours} onValueChange={(value) => handleInputChange("slaHours", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select SLA" />
                    </SelectTrigger>
                    <SelectContent>
                      {lookupData.slaOptions.map((sla) => (
                        <SelectItem key={sla.value} value={sla.value}>
                          {sla.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.slaHours && <p className="text-sm text-red-600">{errors.slaHours}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange("status", value as FormData["status"])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attendedBy">Attended By *</Label>
                  <Input
                    id="attendedBy"
                    value={formData.attendedBy}
                    onChange={(e) => handleInputChange("attendedBy", e.target.value)}
                    placeholder="Enter name of person handling this"
                  />
                  {errors.attendedBy && <p className="text-sm text-red-600">{errors.attendedBy}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rca">
                  Root Cause Analysis (RCA)
                  {(formData.status === "In Progress" || formData.status === "Closed") && " *"}
                </Label>
                <Textarea
                  id="rca"
                  placeholder="Enter root cause analysis..."
                  value={formData.rca}
                  onChange={(e) => handleInputChange("rca", e.target.value)}
                  rows={3}
                />
                {errors.rca && <p className="text-sm text-red-600">{errors.rca}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="solution">
                  Solution
                  {formData.status === "Closed" && " *"}
                </Label>
                <Textarea
                  id="solution"
                  placeholder="Enter solution details..."
                  value={formData.solution}
                  onChange={(e) => handleInputChange("solution", e.target.value)}
                  rows={3}
                />
                {errors.solution && <p className="text-sm text-red-600">{errors.solution}</p>}
              </div>

              <div className="flex justify-end space-x-4">
                <Link href="/problem-reports">
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Save className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Update Report
                    </>
                  )}
                </Button>
              </div>
            </form>

            <Alert className="mt-6">
              <AlertDescription>
                You can update the status and add RCA/Solution as you work on the problem. Once marked as "Closed", the
                report becomes read-only.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
