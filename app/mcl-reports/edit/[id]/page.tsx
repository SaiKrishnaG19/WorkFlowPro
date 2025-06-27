"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface User {
  empId: string
  role: string
  name: string
}

interface MCLReport {

  id: string
  client_name: string
  client_name_id: number
  visit_type: string
  visit_type_id: number
  purpose: string
  purpose_id: number
  shift: string
  shift_id: number
  entry_at: string
  exit_at: string
  remark: string
  status: string
  submitted_by: string
  user_id: string
}

interface LookupValue {
  id: number
  list_name: string
  value: string
  sort_order: number
}

export default function EditMCLReportPage({ params }: { params: Promise<{ id: string }> }) {
  const  { id }  = use(params)
  const [user, setUser] = useState<User | null>(null)
  const [report, setReport] = useState<MCLReport | null>(null)
  const router = useRouter()
  const [clientOptions, setClientOptions] = useState<LookupValue[]>([])
  const [visitTypeOptions, setVisitTypeOptions] = useState<LookupValue[]>([])
  const [purposeOptions, setPurposeOptions] = useState<LookupValue[]>([])
  const [shiftOptions, setShiftOptions] = useState<LookupValue[]>([])
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    client_name_id: "",
    visit_type_id: "",
    purpose_id: "",
    shift_id: "",
    entry_at: "",
    exit_at: "",
    remark: "",
  })

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

        // Fetch lookup values
        await Promise.all([
          fetchLookupValues('client_names'),
          fetchLookupValues('visit_types'),
          fetchLookupValues('purposes'),
          fetchLookupValues('shifts')
        ])

        // Fetch report details
        const reportResponse = await fetch(`/api/mcl-reports/${id}`, {
          credentials: 'include'
        })

        if (!reportResponse.ok) {
          throw new Error('Failed to fetch report')
        }

        const { report: reportData } = await reportResponse.json()
        setReport(reportData)

        // Format dates for datetime-local input
        const formatDate = (dateString: string) => {
          const date = new Date(dateString)
          return date.toISOString().slice(0, 16) // Format as YYYY-MM-DDTHH:MM
        }
        
        setFormData({
          client_name_id: reportData.client_name_id.toString(),
          visit_type_id: reportData.visit_type_id.toString(),
          purpose_id: reportData.purpose_id.toString(),
          shift_id: reportData.shift_id.toString(),
          entry_at: formatDate(reportData.entry_at),
          exit_at: formatDate(reportData.exit_at),
          remark: reportData.remark,
        })
        
        setLoading(false)
      } catch (error) {
        console.error('Error:', error)
        router.push('/mcl-reports')
      }
    }

    checkSession()
  }, [router, id])

  const fetchLookupValues = async (listName: string) => {
    try {
      const response = await fetch(`/api/lookup-values/${listName}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch ${listName}`)
      }

      const data = await response.json()
      const values = data.values || []
      
      switch(listName) {
        case 'client_names':
          setClientOptions(values)
          break
        case 'visit_types':
          setVisitTypeOptions(values)
          break
        case 'purposes':
          setPurposeOptions(values)
          break
        case 'shifts':
          setShiftOptions(values)
          break
      }
    } catch (error) {
      console.error(`Error fetching ${listName}:`, error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch(`/api/mcl-reports/${(await params).id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update MCL report')
      }

      router.push('/mcl-reports')
    } catch (error) {
      console.error('Error updating MCL report:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  if (!user || !report || loading) return null

  // Only allow editing if the report is pending or rejected
  if (report.status !== "Pending Approval" && report.status !== "Rejected") {
    router.push('/mcl-reports')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/mcl-reports">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Reports
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Edit MCL Report</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Edit MCL Report</CardTitle>
            <CardDescription>
              Update the details of your Movement Control Log (MCL) report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="client_name_id">Client Name</Label>
                  <Select
                    value={formData.client_name_id}
                    onValueChange={(value) => handleInputChange("client_name_id", value)}
                    required
                  >
                    <SelectTrigger id="client_name_id">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(clientOptions) && clientOptions.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visit_type_id">Visit Type</Label>
                  <Select
                    value={formData.visit_type_id}
                    onValueChange={(value) => handleInputChange("visit_type_id", value)}
                    required
                  >
                    <SelectTrigger id="visit_type_id">
                      <SelectValue placeholder="Select visit type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(visitTypeOptions) && visitTypeOptions.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shift_id">Shift</Label>
                  <Select
                    value={formData.shift_id}
                    onValueChange={(value) => handleInputChange("shift_id", value)}
                    required
                  >
                    <SelectTrigger id="shift_id">
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(shiftOptions) && shiftOptions.map((shift) => (
                        <SelectItem key={shift.id} value={shift.id.toString()}>
                          {shift.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose_id">Purpose</Label>
                  <Select
                    value={formData.purpose_id}
                    onValueChange={(value) => handleInputChange("purpose_id", value)}
                    required
                  >
                    <SelectTrigger id="purpose_id">
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(purposeOptions) && purposeOptions.map((purpose) => (
                        <SelectItem key={purpose.id} value={purpose.id.toString()}>
                          {purpose.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entry_at">Entry Time</Label>
                  <Input
                    id="entry_at"
                    type="datetime-local"
                    value={formData.entry_at}
                    onChange={(e) => handleInputChange("entry_at", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exit_at">Exit Time</Label>
                  <Input
                    id="exit_at"
                    type="datetime-local"
                    value={formData.exit_at}
                    onChange={(e) => handleInputChange("exit_at", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remark">Remarks</Label>
                <Textarea
                  id="remark"
                  value={formData.remark}
                  onChange={(e) => handleInputChange("remark", e.target.value)}
                  className="h-32"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Link href="/mcl-reports">
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit">Update Report</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
