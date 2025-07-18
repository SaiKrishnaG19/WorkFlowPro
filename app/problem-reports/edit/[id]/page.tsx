"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function EditProblemReportPage() {
  const router = useRouter()
  const params = useParams()
  const [formData, setFormData] = useState({
    client_name: "",
    environment: "",
    problem_statement: "",
    rca: "",
    solution: "",
    attended_by: "",
    status: "Open",
    sla_hours: 4,
    received_at: "",  // add this
  })
  const [loading, setLoading] = useState(true)

  // Ensure no null or undefined values in formData by defaulting to empty strings or valid defaults
  const safeValue = (value: any) => (value === null || value === undefined ? "" : value)

  useEffect(() => {
    const fetchReport = async () => {
      const res = await fetch(`/api/problem-reports/${params.id}`, { credentials: "include" })
      if (!res.ok) {
        alert("Failed to load report")
        router.push("/problem-reports")
        return
      }
      const { report } = await res.json()
      console.log("Fetched report:", report)
      setFormData({
        client_name:  safeValue(report.client_name ?? report.client_name_id ?? ""),
        environment: safeValue(report.environment),
        problem_statement: safeValue(report.problem_statement),
        rca: safeValue(report.rca),
        solution: safeValue(report.solution),
        attended_by: safeValue(report.attended_by),
        status: safeValue(report.status) || "Open",
        sla_hours: report.sla_hours || 4,
        received_at: safeValue(report.received_at),  // add this
      })
      setLoading(false)
    }
    fetchReport()
  }, [params.id, router])

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Optional: simple validation before submit
  const handleSubmit = async () => {
  if (!(formData.client_name + "").trim())  {
      alert("Client Name is required")
      return
    }
    if (!formData.environment.trim()) {
      alert("Environment is required")
      return
    }
    if (!formData.problem_statement.trim()) {
      alert("Problem Statement is required")
      return
    }

    // Add more validation as needed

    const res = await fetch(`/api/problem-reports/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
      credentials: "include",
    })
    if (res.ok) {
      alert("Report updated successfully")
      router.push("/problem-reports")
    } else {
      alert("Failed to update report")
    }
  }
  if (loading) return <p>Loading...</p>

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Edit Problem Report</h1>

      <div className="space-y-4">
        <Input
          value={formData.client_name}
          onChange={(e) => handleChange("client_name", e.target.value)}
          placeholder="Client Name"
        />
        <Input
          value={formData.environment}
          onChange={(e) => handleChange("environment", e.target.value)}
          placeholder="Environment"
        />
        <Textarea
          value={formData.problem_statement}
          onChange={(e) => handleChange("problem_statement", e.target.value)}
          placeholder="Problem Statement"
          rows={4}
        />
        <Textarea
          value={formData.rca}
          onChange={(e) => handleChange("rca", e.target.value)}
          placeholder="Root Cause Analysis"
          rows={3}
        />
        <Textarea
          value={formData.solution}
          onChange={(e) => handleChange("solution", e.target.value)}
          placeholder="Solution"
          rows={3}
        />
        <Input
          value={formData.attended_by}
          onChange={(e) => handleChange("attended_by", e.target.value)}
          placeholder="Attended By"
        />
        <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="number"
          value={formData.sla_hours}
          onChange={(e) => handleChange("sla_hours", Number(e.target.value))}
          placeholder="SLA Hours"
          min={1}
        />
        <Input
          value={formData.received_at}
          readOnly
          placeholder="Received At"
        />

        <Button onClick={handleSubmit}>Save Changes</Button>
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>

      </div>
    </div>
  )
}