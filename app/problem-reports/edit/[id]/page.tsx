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
  const [user, setUser] = useState<{ empId: string; name: string } | null>(null)
  const [formData, setFormData] = useState({
    client_name_id: "",
    environment_id: "",
    problem_statement: "",
    rca: "",
    solution: "",
    attended_by_id: "",
    status: "Open",
    sla_hours: 4,
    received_at: "",  // add this
  })
  const [loading, setLoading] = useState(true)
  const [clientOptions, setClientOptions] = useState<{ id: number; value: string }[]>([])
  const [environmentOptions, setEnvironmentOptions] = useState<{ id: number; value: string }[]>([])

  // Ensure no null or undefined values in formData by defaulting to empty strings or valid defaults
  const safeValue = (value: any) => (value === null || value === undefined ? "" : value)
  
  useEffect(() => {
    const fetchSession = async () => {
      const res = await fetch("/api/auth/session", { credentials: "include" })
      if (res.ok) {
        const userData = await res.json()
        setUser(userData)
      } else {
        router.push("/")
      }
    }
    fetchSession()
  }, [router])

  useEffect(() => {
    const fetchReport = async () => {
      const res = await fetch(`/api/problem-reports/${params.id}`, { credentials: "include" })
      if (!res.ok) {
        alert("Failed to load report")
        router.push("/problem-reports")
        return
      }
      const { report } = await res.json()
        // Fetch clients
        const clientsRes = await fetch("/api/lookup-values/clients", { credentials: "include" })
        const clientsData = clientsRes.ok ? await clientsRes.json() : { values: [] }
        // Fetch environments
        const envRes = await fetch("/api/lookup-values/environments", { credentials: "include" })
        const envData = envRes.ok ? await envRes.json() : { values: [] }

        setClientOptions(clientsData.values || [])
        setEnvironmentOptions(envData.values || [])

        setFormData({
          client_name_id: safeValue(report.client_name ?? report.client_name_id ?? ""),
          environment_id: safeValue(report.environment ?? report.environment_id ?? ""),
          problem_statement: safeValue(report.problem_statement),
          rca: safeValue(report.rca),
          solution: safeValue(report.solution),
          attended_by_id: user?.empId || "",
          status: safeValue(report.status) || "Open",
          sla_hours: report.sla_hours || 4,
          received_at: safeValue(report.received_at),
        })
      setLoading(false)
    }
   if (user) {
      fetchReport()
    }
  }, [params.id, router, user])

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Optional: simple validation before submit
  const handleSubmit = async () => {
  if (!(formData.client_name_id + "").trim())  {
      alert("Client Name is required")
      return
    }
    if (!formData.environment_id.trim()) {
      alert("Environment is required")
      return
    }
    if (!formData.problem_statement.trim()) {
      alert("Problem Statement is required")
      return
    }
        if (!(formData.attended_by_id + "").trim()) {
      alert("Attended By is required")
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
        <Select value={formData.client_name_id} onValueChange={(value) => handleChange("client_name_id", value)}>
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
        <Select value={formData.environment_id} onValueChange={(value) => handleChange("environment_id", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select environment" />
          </SelectTrigger>
          <SelectContent>
            {environmentOptions.map((env) => (
              <SelectItem key={env.id} value={env.id.toString()}>
                {env.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
          value={formData.attended_by_id}
          onChange={(e) => handleChange("attended_by_id", e.target.value)}
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