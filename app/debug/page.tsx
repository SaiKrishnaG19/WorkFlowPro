"use client"

import { useEffect, useState } from "react"
import { getDatabase } from "@/lib/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DebugPage() {
  const [dbStats, setDbStats] = useState<any[]>([])
  const [sessionData, setSessionData] = useState<string | null>(null)

  useEffect(() => {
    const db = getDatabase()
    setDbStats(db.getTableStats())
    setSessionData(sessionStorage.getItem("user"))
  }, [])

  const clearDatabase = () => {
    localStorage.removeItem("workflowpro_database")
    window.location.reload()
  }

  const clearSession = () => {
    sessionStorage.removeItem("user")
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Debug Information</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Tables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dbStats.map((stat) => (
                  <div key={stat.table} className="flex justify-between">
                    <span className="font-medium">{stat.table}:</span>
                    <span>{stat.count} records</span>
                  </div>
                ))}
              </div>
              <Button onClick={clearDatabase} variant="destructive" className="mt-4">
                Clear Database
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Session Storage:</strong>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {sessionData || "No session data"}
                  </pre>
                </div>
              </div>
              <Button onClick={clearSession} variant="destructive" className="mt-4">
                Clear Session
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Browser Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <strong>localStorage keys:</strong>
                <ul className="mt-2 text-sm">
                  {Object.keys(localStorage).map((key) => (
                    <li key={key} className="ml-4">
                      • {key}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4">
                <strong>sessionStorage keys:</strong>
                <ul className="mt-2 text-sm">
                  {Object.keys(sessionStorage).map((key) => (
                    <li key={key} className="ml-4">
                      • {key}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
