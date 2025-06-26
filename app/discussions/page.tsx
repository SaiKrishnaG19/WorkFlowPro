"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Plus, Search, ArrowLeft, Clock, MessageCircle, User, Paperclip } from "lucide-react"
import Link from "next/link"

interface UserType {
  empId: string
  role: string
  name: string
}

interface Discussion {
  id: string
  title: string
  content: string
  author: string
  authorRole: string
  createdAt: string
  updatedAt: string
  commentsCount: number
  reportType?: "MCL" | "Problem"
  reportId?: string
  hasAttachment: boolean
  isActive: boolean
}

interface Comment {
  id: string
  discussionId: string
  content: string
  author: string
  authorRole: string
  createdAt: string
  mentions: string[]
  isEdited: boolean
}

export default function DiscussionsPage() {
  const [user, setUser] = useState<UserType | null>(null)
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [filteredDiscussions, setFilteredDiscussions] = useState<Discussion[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()

  const loadDiscussions = async () => {
    try {
      const response = await fetch('/api/discussions', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch discussions')
      }

      const discussionsData = await response.json()
      const formattedDiscussions = discussionsData.map((discussion: any) => ({
        id: discussion.id,
        title: discussion.title,
        content: discussion.content,
        author: discussion.author,
        authorRole: discussion.author_role,
        createdAt: discussion.created_at,
        updatedAt: discussion.updated_at,
        commentsCount: discussion.comments_count || 0,
        reportType: discussion.report_type,
        reportId: discussion.report_id,
        hasAttachment: !!discussion.attachment_url,
        isActive: discussion.is_active
      }))

      setDiscussions(formattedDiscussions)
      setFilteredDiscussions(formattedDiscussions)
    } catch (error) {
      console.error('Error loading discussions:', error)
    }
  }


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
        await loadDiscussions()
      } catch (error) {
        console.error('Error checking session:', error)
        router.push('/')
      }
    }
    checkSession()
  }, [router])

  useEffect(() => {
    let filtered = discussions

    if (searchTerm) {
      filtered = filtered.filter(
        (discussion) =>
          discussion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          discussion.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          discussion.author.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredDiscussions(filtered)
  }, [searchTerm, discussions])

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString()
  }

  const getTimeAgo = (dateTime: string) => {
    const now = new Date()
    const past = new Date(dateTime)
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Less than an hour ago"
    if (diffInHours < 24) return `${diffInHours} hours ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return "1 day ago"
    return `${diffInDays} days ago`
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-purple-100 text-purple-800"
      case "Manager":
        return "bg-blue-100 text-blue-800"
      case "User":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAuthorInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
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
                  Back
                </Button>
              </Link>
              <MessageSquare className="h-8 w-8 text-green-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Discussions</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">{user.role}</Badge>
              <span className="text-sm text-gray-700">{user.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Discussion Threads</h2>
            <p className="text-gray-600">Collaborate and discuss issues with your team</p>
          </div>
          <Link href="/discussions/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Discussion
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Discussions</p>
                  <p className="text-2xl font-bold text-gray-900">{discussions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <MessageCircle className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Active Threads</p>
                  <p className="text-2xl font-bold text-gray-900">{discussions.filter((d) => d.isActive).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <User className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Your Discussions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {discussions.filter((d) => d.author === user.name).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search discussions by title, content, or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Discussions List */}
        <div className="space-y-4">
          {filteredDiscussions.map((discussion) => (
            <Card key={discussion.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`/placeholder-user.jpg`} alt={discussion.author} />
                    <AvatarFallback>{getAuthorInitials(discussion.author)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{discussion.title}</h3>
                        {discussion.isActive && <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>}
                        {discussion.hasAttachment && <Paperclip className="h-4 w-4 text-gray-400" />}
                      </div>
                      <div className="flex items-center space-x-2">
                        {discussion.reportType && (
                          <Badge variant="outline" className="text-xs">
                            {discussion.reportType}: {discussion.reportId}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-600 mb-3 line-clamp-2">{discussion.content}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <span>{discussion.author}</span>
                          <Badge className={`text-xs ${getRoleBadgeColor(discussion.authorRole)}`}>
                            {discussion.authorRole}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{getTimeAgo(discussion.updatedAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{discussion.commentsCount} comments</span>
                        </div>
                      </div>

                      <Button variant="outline" size="sm" onClick={() => router.push(`/discussions/${discussion.id}`)}>
                        View Discussion
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDiscussions.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No discussions found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? "No discussions match your search criteria." : "Be the first to start a discussion!"}
              </p>
              <Link href="/discussions/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Discussion
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
