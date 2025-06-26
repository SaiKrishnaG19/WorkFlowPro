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
import { ArrowLeft, Save, Send, MessageSquare, Paperclip, X } from "lucide-react"
import Link from "next/link"

interface User {
  empId: string
  role: string
  name: string
}

interface FormData {
  title: string
  content: string
  reportType: string
  reportId: string
  attachment: File | null
}

interface FormErrors extends Partial<FormData> {
  submit?: string
}



export default function NewDiscussionPage() {
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<FormData>({
    title: "",
    content: "",
    reportType: "",
    reportId: "",
    attachment: null,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
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
      } catch (error) {
        console.error('Error checking session:', error)
        router.push('/')
      }
    }
    checkSession()
  }, [router])

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.title.trim()) newErrors.title = "Title is required"
    if (!formData.content.trim()) newErrors.content = "Content is required"

    if (formData.title.length > 100) {
      newErrors.title = "Title must be less than 100 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/discussions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          reportType: formData.reportType !== "none" ? formData.reportType : null,
          reportId: formData.reportId || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create discussion')
      }

      // Handle file upload if there's an attachment
      if (formData.attachment) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', formData.attachment)
        
        const uploadResponse = await fetch('/api/discussions/upload', {
          method: 'POST',
          credentials: 'include',
          body: uploadFormData
        })
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload attachment')
        }
      }

      const result = await response.json()
      setSubmitSuccess(true)

      // Redirect after success
      setTimeout(() => {
        router.push("/discussions")
      }, 2000)
    } catch (error) {
      console.error('Error creating discussion:', error)
      setErrors(prev => ({ ...prev, submit: 'Failed to create discussion. Please try again.' }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData((prev) => ({ ...prev, attachment: file }))
  }

  const removeAttachment = () => {
    setFormData((prev) => ({ ...prev, attachment: null }))
  }

  if (!user) return null

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Discussion Created Successfully!</h3>
            <p className="text-gray-600 mb-4">
              Your discussion thread has been created and is now live for team collaboration.
            </p>
            <p className="text-sm text-gray-500">Redirecting to discussions...</p>
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
              <Link href="/discussions">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Discussions
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">New Discussion</h1>
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
              <MessageSquare className="h-5 w-5 text-green-600 mr-2" />
              Start New Discussion
            </CardTitle>
            <CardDescription>
              Create a discussion thread to collaborate with your team. You can link it to existing reports or start a
              general discussion.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Discussion Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter a clear, descriptive title..."
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  maxLength={100}
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{errors.title && <span className="text-red-600">{errors.title}</span>}</span>
                  <span>{formData.title.length}/100</span>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Discussion Content *</Label>
                <Textarea
                  id="content"
                  placeholder="Describe the topic, ask questions, or share information..."
                  value={formData.content}
                  onChange={(e) => handleInputChange("content", e.target.value)}
                  rows={6}
                />
                {errors.content && <p className="text-sm text-red-600">{errors.content}</p>}
              </div>

              {/* Link to Report (Optional) */}
              <div className="space-y-4">
                <Label>Link to Report (Optional)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reportType">Report Type</Label>
                    <Select
                      value={formData.reportType}
                      onValueChange={(value) => {
                        handleInputChange("reportType", value)
                        handleInputChange("reportId", "") // Reset report ID when type changes
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="MCL">MCL Report</SelectItem>
                        <SelectItem value="Problem">Problem Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reportId">Report</Label>
                    <Select
                      value={formData.reportId}
                      onValueChange={(value) => handleInputChange("reportId", value)}
                      disabled={!formData.reportType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select report" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                       
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {formData.reportType && formData.reportId && (
                  <Alert>
                    <AlertDescription>
                      This discussion will be linked to {formData.reportType} Report: {formData.reportId}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* File Attachment */}
              <div className="space-y-2">
                <Label htmlFor="attachment">Attachment (Optional)</Label>
                {!formData.attachment ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Paperclip className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Attach a file to support your discussion</p>
                    <Input
                      id="attachment"
                      type="file"
                      onChange={handleFileChange}
                      className="max-w-xs mx-auto"
                      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Supported: PDF, DOC, DOCX, TXT, PNG, JPG, GIF (Max 10MB)
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Paperclip className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{formData.attachment.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {(formData.attachment.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={removeAttachment}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {errors.submit && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.submit}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Link href="/discussions">
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
                      Create Discussion
                    </>
                  )}
                </Button>
              </div>
            </form>

            <Alert className="mt-6">
              <AlertDescription>
                <strong>Discussion Guidelines:</strong> Keep discussions professional and relevant. You can edit or
                delete your own posts at any time. All team members can participate in discussions.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
  }

