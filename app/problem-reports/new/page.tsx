"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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

interface LookupValue {
  id: number
  list_name: string
  value: string
  sort_order: number
}

export default function NewProblemReportPage() {
  const [user, setUser] = useState<User | null>(null)
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
  const [clientOptions, setClientOptions] = useState<LookupValue[]>([])
  const [environmentsOptions, setEnvironmentsOptions] = useState<LookupValue[]>([])
  const [supportTypeOptions, setSupportTypeOptions] = useState<LookupValue[]>([])
  const [slaOptions, setSlaOptions] = useState<LookupValue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', { credentials: 'include' })
        if (!response.ok) {
          router.push('/')
          return
        }
        const userData = await response.json()
        setUser(userData)
        setFormData((prev) => ({ ...prev, attendedBy: userData.name }))
      } catch (error) {
        console.error('Failed to fetch session:', error)
        router.push('/')
      }

              // Fetch lookup values
        await Promise.all([
          fetchLookupValues('client_names'),
          fetchLookupValues('support_types'),
          fetchLookupValues('environments'),
          fetchLookupValues('sla')
        ])
        
        setLoading(false)

        }

    checkSession()
  }, [router])

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.clientName) newErrors.clientName = "Client name is required"
    if (!formData.environment) newErrors.environment = "Environment is required"
    if (!formData.problemStatement) newErrors.problemStatement = "Problem statement is required"
    if (!formData.receivedAt) newErrors.receivedAt = "Received time is required"
    if (!formData.attendedBy) newErrors.attendedBy = "Attended by is required"
    if (!formData.slaHours) newErrors.slaHours = "SLA hours is required"

    // If status is In Progress or Closed, RCA and Solution should be provided
    if (formData.status === "In Progress" || formData.status === "Closed") {
      if (!formData.rca) newErrors.rca = "RCA is required for In Progress/Closed status"
    }

    if (formData.status === "Closed") {
      if (!formData.solution) newErrors.solution = "Solution is required for Closed status"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

    const fetchLookupValues = async (listName: string) => {
    try {
      const response = await fetch(`/api/lookup-values/${listName}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch ${listName}`)
      }

      const data = await response.json()
      
      switch(listName) {
        case 'client_names':
          setClientOptions(data.values)
          break
        case 'support_types':
          setSupportTypeOptions(data.values)
          break
        case 'environments':
          setEnvironmentsOptions(data.values)
          break
        case 'sla':
          setSlaOptions(data.values)
          break
      }
    } catch (error) {
      console.error(`Error fetching ${listName}:`, error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    // Create new report object
const newReport = {
      client_name: formData.clientName,
      environment: formData.environment,
      problem_statement: formData.problemStatement,
      received_at: formData.receivedAt,
      rca: formData.rca,
      solution: formData.solution,
      attended_by: formData.attendedBy,
      status: formData.status,
      sla_hours: Number.parseInt(formData.slaHours),
      submitted_by: user?.name || "Unknown",
      submitted_at: new Date().toISOString(),
    }

    try {
      const response = await fetch('/api/problem-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newReport),
      })

      if (!response.ok) {
        throw new Error('Failed to create problem report')
      }


    setIsSubmitting(false)
    setSubmitSuccess(true)

    // Redirect after success
    setTimeout(() => {
      router.push("/problem-reports")
    }, 2000)
  } catch (error) {
      console.error('Error creating problem report:', error)
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  if (!user) return null

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Problem Report Created Successfully!</h3>
            <p className="text-gray-600 mb-4">Your problem report has been created and is now being tracked.</p>
            <p className="text-sm text-gray-500">Redirecting to reports list...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
              <h1 className="text-xl font-semibold text-gray-900">New Problem Report</h1>
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
              Create New Problem Report
            </CardTitle>
            <CardDescription>
              Document and track a problem report with SLA monitoring. Fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Client Name and Environment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Select value={formData.clientName} onValueChange={(value) => handleInputChange("clientName", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientOptions.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.value}
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
                      {environmentsOptions.map((env) => (
                        <SelectItem key={env.id} value={env.id.toString()}>
                          {env.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.environment && <p className="text-sm text-red-600">{errors.environment}</p>}
                </div>
              </div>

              {/* Problem Statement */}
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

              {/* Received At and SLA Hours */}
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
                      {slaOptions.map((sla) => (
                        <SelectItem key={sla.value} value={sla.value}>
                          {sla.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.slaHours && <p className="text-sm text-red-600">{errors.slaHours}</p>}
                </div>
              </div>

              {/* Status and Attended By */}
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

              {/* RCA */}
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

              {/* Solution */}
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

              {/* Submit Button */}
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Create Report
                    </>
                  )}
                </Button>
              </div>
            </form>

            <Alert className="mt-6">
              <AlertDescription>
                Problem reports don't require manager approval. You can update the status as you work on the issue. Once
                marked as "Closed", the report becomes read-only.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
