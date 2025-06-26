"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { clearSession } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, Users, FileText, MessageSquare, Key } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { truncate } from "fs/promises"

export default function LoginPage() {
  const [empId, setEmpId] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordChangeError, setPasswordChangeError] = useState("")
  const router = useRouter()

   useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session", { credentials: "include" })
        const data = await res.json()

        if (data.session) {
          router.replace("/dashboard")
        } else {
          setIsLoading(false) // Only show login form if not logged in
        }
      } catch (error) {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  if (isLoading) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ empId, password }),
        credentials: "include",
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Login failed")
        return
      }

      if (data.passwordChangeRequired) {
        setShowPasswordChange(true)
        if (data.isFirstTimeLogin) {
          setError("First-time login detected. Please change your password. You have 5 minutes to complete this action.")
        }
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    setPasswordChangeError("")

    if (!newPassword || !confirmPassword) {
      setPasswordChangeError("Please fill in both password fields")
      return
    }

    if (newPassword.length < 6) {
      setPasswordChangeError("Password must be at least 6 characters long")
      return
    }

    // Add timer for session expiry (5 minutes)
    const timer = setTimeout(() => {
      clearSession()
      router.replace("/")
      setError("Session expired. Please login again.")
    }, 300000) // 5 minutes

    if (newPassword !== confirmPassword) {
      setPasswordChangeError("Passwords do not match")
      return
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword }),
      })

      if (!response.ok) {
        const data = await response.json()
        setPasswordChangeError(data.error || "Password change failed")
        return
      }

      setShowPasswordChange(false)
      router.push("/dashboard")
    } catch (error) {
      console.error("Password change error:", error)
      setPasswordChangeError("Network error. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start mb-6">
            <Building2 className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">WorkFlow Pro</h1>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Workload Management & Reporting System</h2>
          <p className="text-xl text-gray-600 mb-8">
            Streamline your MCL reports, track problems, and collaborate with your team efficiently.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="flex items-center justify-center lg:justify-start">
              <FileText className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-gray-700">Report Management</span>
            </div>
            <div className="flex items-center justify-center lg:justify-start">
              <Users className="h-8 w-8 text-green-600 mr-2" />
              <span className="text-gray-700">Team Collaboration</span>
            </div>
            <div className="flex items-center justify-center lg:justify-start">
              <MessageSquare className="h-8 w-8 text-purple-600 mr-2" />
              <span className="text-gray-700">Discussion Threads</span>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your Employee ID and password to access the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="empId">Employee ID</Label>
                <Input
                  id="empId"
                  type="text"
                  placeholder="Enter your Employee ID"
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</p>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="mb-2">
                  <strong className="text-purple-700">👑 Admin:</strong> EMP001 / admin123 (Carol Admin)
                </div>
                <div className="mb-2">
                  <strong className="text-blue-700">👔 Managers:</strong>
                  <div className="ml-4 space-y-1">
                    <div>EMP002 / manager123 (Bob Manager)</div>
                    <div>EMP005 / manager123 (Emma Lead)</div>
                  </div>
                </div>
                <div>
                  <strong className="text-green-700">👤 Users:</strong>
                  <div className="ml-4 space-y-1">
                    <div>EMP003 / user123 (Alice User)</div>
                    <div>EMP004 / user123 (David Support)</div>
                    <div>EMP006 / user123 (Sarah Tech)</div>
                    <div>EMP007 / user123 (Mike Developer)</div>
                    <div>EMP008 / user123 (Lisa Analyst)</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
                <strong>🗄️ Database:</strong> Production PostgreSQL with automatic setup
              </div>
              <div className="mt-2 p-2 bg-green-100 rounded text-xs text-green-800">
                <strong>🔐 Security:</strong> JWT-based authentication with secure cookies
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordChange} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Key className="h-5 w-5 text-orange-600 mr-2" />
              Change Password Required
            </DialogTitle>
            <DialogDescription>
              For security reasons, you must change your password before accessing the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            {passwordChangeError && (
              <Alert variant="destructive">
                <AlertDescription>{passwordChangeError}</AlertDescription>
              </Alert>
            )}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>Password Requirements:</strong>
                <br />• Minimum 6 characters
                <br />• Choose a secure password you can remember
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handlePasswordChange} className="w-full">
              Change Password & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
