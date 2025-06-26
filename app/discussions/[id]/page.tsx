"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MessageSquare, ArrowLeft, Clock, Paperclip, Send, AtSign, Reply } from "lucide-react"
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

export default function DiscussionDetailPage() {
  const [user, setUser] = useState<UserType | null>(null)
  const [discussion, setDiscussion] = useState<Discussion | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [editedContent, setEditedContent] = useState("")
  const router = useRouter()
  const params = useParams()

  
  const [availableUsers, setAvailableUsers] = useState<string[]>([])
  const isDiscussionOwner = user?.empId === discussion?.author

  // Fetch available users for mentions
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users/mentions', {
          credentials: 'include'
        });
        if (response.ok) {
          const users = await response.json();
           setAvailableUsers(users.map((user: { name: string; empId: string; role: string }) => user.name));
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check session
        const response = await fetch('/api/auth/session')
        if (!response.ok) {
          router.push('/')
          return
        }
        const userData = await response.json()
        setUser(userData)

        // Load discussion
        const discussionId = params.id as string
        const discussionResponse = await fetch(`/api/discussions/${discussionId}`, {
          credentials: 'include'
        })
        if (!discussionResponse.ok) {
          throw new Error('Failed to fetch discussion')
        }
        const discussionData = await discussionResponse.json()
        setDiscussion(discussionData)

        // Load comments
        const commentsResponse = await fetch(`/api/discussions/${discussionId}/comments`, {
          credentials: 'include'
        })
        if (!commentsResponse.ok) {
          throw new Error('Failed to fetch comments')
        }
        const commentsData = await commentsResponse.json()
        setComments(commentsData)
      } catch (error) {
        console.error('Error loading data:', error)
        router.push('/discussions')
      }
    }
    loadData()
  }, [params.id, router])

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user || !discussion) return

    setIsSubmitting(true)

    try {
      // Extract mentions from comment
      const mentionRegex = /@(\w+\s\w+)/g
      const mentions = []
      let match
      while ((match = mentionRegex.exec(newComment)) !== null) {
        mentions.push(match[1])
      }

      // Submit comment via API
      const response = await fetch(`/api/discussions/${discussion.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          mentions,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit comment')
      }

      const newCommentData = await response.json()

      // Update local state
      setComments((prev) => [...prev, newCommentData])
      setNewComment("")

      // Refresh discussion data to get updated comment count
      const discussionResponse = await fetch(`/api/discussions/${discussion.id}`)
      if (discussionResponse.ok) {
        const updatedDiscussion = await discussionResponse.json()
        setDiscussion(updatedDiscussion)
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMentionSelect = (userName: string) => {
    const cursorPos = newComment.lastIndexOf("@")
    const beforeMention = newComment.substring(0, cursorPos)
    const afterMention = newComment.substring(cursorPos + mentionSearch.length + 1)
    setNewComment(`${beforeMention}@${userName} ${afterMention}`)
    setShowMentions(false)
    setMentionSearch("")
  }

  const handleCommentChange = (value: string) => {
    setNewComment(value)

    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf("@")
    if (lastAtIndex !== -1) {
      const afterAt = value.substring(lastAtIndex + 1)
      const spaceIndex = afterAt.indexOf(" ")
      const searchTerm = spaceIndex === -1 ? afterAt : afterAt.substring(0, spaceIndex)

      if (searchTerm.length > 0 && spaceIndex === -1) {
        setMentionSearch(searchTerm)
        setShowMentions(true)
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }

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
    if (!name || typeof name !== 'string') return ''
    return name
      .split(" ")
      .map((n) => n[0] || '')
      .join("")
      .toUpperCase()
  }

  const renderCommentWithMentions = (content: string) => {
    const mentionRegex = /@(\w+\s\w+)/g
    const parts = content.split(mentionRegex)

    return parts.map((part, index) => {
      if (availableUsers.includes(part)) {
        return (
          <span key={index} className="bg-blue-100 text-blue-800 px-1 rounded font-medium">
            @{part}
          </span>
        )
      }
      return part
    })
  }

  const handleEditDiscussion = async () => {
    if (!discussion || !user) return
    setEditedTitle(discussion.title)
    setEditedContent(discussion.content)
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!discussion || !user) return
    try {
      const response = await fetch(`/api/discussions/${discussion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: editedTitle,
          content: editedContent,
          isActive: discussion.isActive
        })
      })

      if (!response.ok) throw new Error('Failed to update discussion')
      
      const updatedDiscussion = await response.json()
      setDiscussion(updatedDiscussion)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating discussion:', error)
    }
  }

  const handleDeleteDiscussion = async () => {
    if (!discussion || !user || !window.confirm('Are you sure you want to delete this discussion?')) return

    try {
      const response = await fetch(`/api/discussions/${discussion.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Failed to delete discussion')
      
      router.push('/discussions')
    } catch (error) {
      console.error('Error deleting discussion:', error)
    }
  }

  if (!user || !discussion) return null

  const filteredUsers = availableUsers.filter((user) => user.toLowerCase().includes(mentionSearch.toLowerCase()))

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
              <MessageSquare className="h-8 w-8 text-green-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Discussion</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">{user.role}</Badge>
              <span className="text-sm text-gray-700">{user.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Discussion */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{discussion.title}</CardTitle>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">{getAuthorInitials(discussion.author)}</AvatarFallback>
                    </Avatar>
                    <span>{discussion.author}</span>
                    <Badge className={`text-xs ${getRoleBadgeColor(discussion.authorRole)}`}>
                      {discussion.authorRole}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{getTimeAgo(discussion.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {discussion.isActive && <Badge className="bg-green-100 text-green-800">Active</Badge>}
                {discussion.hasAttachment && <Paperclip className="h-4 w-4 text-gray-400" />}
                {discussion.reportType && (
                  <Badge variant="outline" className="text-xs">
                    {discussion.reportType}: {discussion.reportId}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{discussion.content}</p>
          </CardContent>
        </Card>

        {/* Comments */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Reply className="h-5 w-5 mr-2" />
              Comments ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border-l-2 border-gray-200 pl-4 py-2">
                <div className="flex items-center space-x-2 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">{getAuthorInitials(comment.author)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{comment.author}</span>
                  <Badge className={`text-xs ${getRoleBadgeColor(comment.authorRole)}`}>{comment.authorRole}</Badge>
                  <span className="text-xs text-gray-500">{getTimeAgo(comment.createdAt)}</span>
                  {comment.isEdited && (
                    <Badge variant="outline" className="text-xs">
                      Edited
                    </Badge>
                  )}
                </div>
                <p className="text-gray-700 text-sm">{renderCommentWithMentions(comment.content)}</p>
              </div>
            ))}

            {comments.length === 0 && (
              <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
            )}
          </CardContent>
        </Card>

        {/* Add Comment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Comment</CardTitle>
            <CardDescription>
              Share your thoughts or ask questions. Use @username to mention team members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder="Type your comment here... Use @username to mention someone"
                  value={newComment}
                  onChange={(e) => handleCommentChange(e.target.value)}
                  rows={4}
                />

                {/* Mention Dropdown */}
                {showMentions && filteredUsers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {filteredUsers.map((userName) => (
                      <button
                        key={userName}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                        onClick={() => handleMentionSelect(userName)}
                      >
                        <AtSign className="h-4 w-4 text-gray-400" />
                        <span>{userName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  <AtSign className="h-4 w-4 inline mr-1" />
                  Tip: Type @ followed by a name to mention team members
                </div>
                <Button onClick={handleSubmitComment} disabled={!newComment.trim() || isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Send className="h-4 w-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Post Comment
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Alert className="mt-4">
              <AlertDescription>
                <strong>Available for mentions:</strong> {availableUsers.join(", ")}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
