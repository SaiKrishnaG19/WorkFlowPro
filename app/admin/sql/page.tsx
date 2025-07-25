"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function SqlEditorPage() {
  const [sqlQuery, setSqlQuery] = useState("")
  const [sqlResult, setSqlResult] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSqlExecution = async () => {
    setError(null)
    setSqlResult(null)

    try {
      const response = await fetch("/api/admin/sql-execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: sqlQuery }),
      })

      const data = await response.json()
      if (data.result) {
        setSqlResult(data.result)
      } else if (data.error) {
        setError(data.error)
      }
    } catch (error) {
      console.error("Error executing SQL:", error)
      setError("Failed to execute SQL query. Please try again.")
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>SQL Editor</CardTitle>
          <CardDescription>Execute SQL queries directly on the database. Use with caution!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              placeholder="Enter your SQL query here..."
              rows={5}
            />
            <div className="flex space-x-2">
              <Button onClick={handleSqlExecution}>Execute Query</Button>
              <Button variant="outline" onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
            </div>
            {error && (
              <div className="text-red-500 mt-2">{error}</div>
            )}
            {sqlResult && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Query Result:</h3>
                {sqlResult.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(sqlResult[0]).map((key) => (
                          <TableHead key={key}>{key}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sqlResult.map((row, index) => (
                        <TableRow key={index}>
                          {Object.values(row).map((value, i) => (
                            <TableCell key={i}>{String(value)}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p>No results returned.</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}