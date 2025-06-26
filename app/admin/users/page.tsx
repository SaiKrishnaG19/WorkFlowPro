"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { SessionUser } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Users, Plus, Edit, Trash2, ArrowLeft, Save, UserCheck, UserX, Search, Key } from "lucide-react"
import Link from "next/link"

interface User {
  empId: string
  role: string
  name: string
}

interface SystemUser {
  empId: string
  name: string
  email: string
  role: "User" | "Manager" | "Admin"
  isActive: boolean
  createdAt: string
  lastLogin?: string
}

export default function AdminUsersPage() {
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<SystemUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<SystemUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null)
  const [newUser, setNewUser] = useState({
    empId: "",
    name: "",
    email: "",
    role: "User" as SystemUser["role"],
    password: "",
  })
  const router = useRouter()

  const [isPasswordResetDialogOpen, setIsPasswordResetDialogOpen] = useState(false)
  const [resetPasswordUser, setResetPasswordUser] = useState<SystemUser | null>(null)
  const [newPassword, setNewPassword] = useState("")

  const [session, setSession] = useState<SessionUser | null | undefined>(undefined)
  const [isLoaded, setLoaded] = useState(false)
  
  useEffect(() => {
    fetch("/api/auth/session", { credentials: "include" })
      .then((res) => res.ok ? res.json() : Promise.reject())

      .then((data) => {
        if (data.session?.role === "Admin") {
          setSession(data.session)
          // Fetch users after session is confirmed
          fetch("/api/users", {
            headers: {
              session: JSON.stringify(data.session)
            }
          })
            .then(res => res.json())
            .then(data => {
              if (data.users) {
                setUsers(data.users)
              }
            })
            .catch(error => console.error("Error fetching users:", error))
        } else {
          router.replace("/dashboard")
        }
      })
      .catch(() => {
        router.replace("/")
      })
      .finally(() => {
        setLoaded(true)
      })
  }, [router])


  useEffect(() => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    if (statusFilter !== "all") {
      const isActive = statusFilter === "active"
      filtered = filtered.filter((user) => user.isActive === isActive)
    }

    setFilteredUsers(filtered)
  }, [searchTerm, roleFilter, statusFilter, users])

  const handleAddUser = async () => {
    if (!newUser.empId || !newUser.name || !newUser.email || !newUser.password || !session) return

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          session: JSON.stringify(session)
        },
        body: JSON.stringify(newUser)
      })

      const data = await response.json()
      if (data.user) {
        setUsers(prev => [...prev, data.user])
        setNewUser({ empId: "", name: "", email: "", role: "User", password: "" })
        setIsAddDialogOpen(false)
      }
    } catch (error) {
      console.error("Error adding user:", error)
    }
  }

  const handleEditUser = async () => {
    if (!editingUser || !session) return

    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          session: JSON.stringify(session)
        },
        body: JSON.stringify(editingUser)
      })

      const data = await response.json()
      if (data.user) {
        setUsers(prev => prev.map(user => user.empId === editingUser.empId ? data.user : user))
        setEditingUser(null)
        setIsEditDialogOpen(false)
      }
    } catch (error) {
      console.error("Error updating user:", error)
    }
  }

  const handleDeleteUser = async (empId: string) => {
    if (!session) return

    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        const response = await fetch(`/api/users?empId=${empId}`, {
          method: "DELETE",
          headers: {
            session: JSON.stringify(session)
          }
        })

        const data = await response.json()
        if (data.success) {
          setUsers(prev => prev.filter(user => user.empId !== empId))
        }
      } catch (error) {
        console.error("Error deleting user:", error)
      }
    }
  }

  const handleToggleStatus = async (empId: string) => {
    if (!session) return

    const userToUpdate = users.find(user => user.empId === empId)
    if (!userToUpdate) return

    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          session: JSON.stringify(session)
        },
        body: JSON.stringify({
          ...userToUpdate,
          isActive: !userToUpdate.isActive
        })
      })

      const data = await response.json()
      if (data.user) {
        setUsers(prev => prev.map(user => user.empId === empId ? data.user : user))
      }
    } catch (error) {
      console.error("Error toggling user status:", error)
    }
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

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString()
  }

  const handlePasswordReset = async () => {
    if (!resetPasswordUser || !newPassword.trim() || !session) return

    try {
      const response = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          session: JSON.stringify(session)
        },
        body: JSON.stringify({
          empId: resetPasswordUser.empId,
          newPassword: newPassword.trim()
        })
      })

      const data = await response.json()
      if (data.success) {
        alert(`Password reset successfully for ${resetPasswordUser.name}. New password: ${newPassword}`)
        setResetPasswordUser(null)
        setNewPassword("")
        setIsPasswordResetDialogOpen(false)
      }
    } catch (error) {
      console.error("Error resetting password:", error)
      alert("Failed to reset password. Please try again.")
    }
  }

  if (!isLoaded || !session) return null

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    inactive: users.filter((u) => !u.isActive).length,
    admins: users.filter((u) => u.role === "Admin").length,
    managers: users.filter((u) => u.role === "Manager").length,
    regularUsers: users.filter((u) => u.role === "User").length,
  }

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
              <Users className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">User Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user && <Badge variant="outline">{user.role}</Badge>}
              <span className="text-sm text-gray-700">{user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">User Management</h2>
            <p className="text-gray-600">Create, manage, and configure user accounts and permissions</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>Create a new user account with role and permissions.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="empId">Employee ID</Label>
                  <Input
                    id="empId"
                    value={newUser.empId}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, empId: e.target.value }))}
                    placeholder="EMP009"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="john.doe@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) => setNewUser((prev) => ({ ...prev, role: value as SystemUser["role"] }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="User">User</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Initial Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter initial password"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddUser}
                  disabled={!newUser.empId || !newUser.name || !newUser.email || !newUser.password}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
                <p className="text-sm text-gray-600">Inactive</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
                <p className="text-sm text-gray-600">Admins</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.managers}</p>
                <p className="text-sm text-gray-600">Managers</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.regularUsers}</p>
                <p className="text-sm text-gray-600">Users</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search"
                    placeholder="Search by name, ID, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="roleFilter">Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="statusFilter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
            <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.empId}>
                      <TableCell className="font-medium">{user.empId}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch checked={user.isActive} onCheckedChange={() => handleToggleStatus(user.empId)} />
                          <span className="text-sm">
                            {user.isActive ? (
                              <Badge className="bg-green-100 text-green-800">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">
                                <UserX className="h-3 w-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDateTime(user.createdAt)}</TableCell>
                      <TableCell>{user.lastLogin ? formatDateTime(user.lastLogin) : "Never"}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingUser(user)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setResetPasswordUser(user)
                              setIsPasswordResetDialogOpen(true)
                            }}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.empId)}
                            className="text-red-600 hover:text-red-700"
                            disabled={user.empId === "EMP001"} // Prevent deleting main admin
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No users found matching your criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user information and role assignments.</DialogDescription>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editName">Full Name</Label>
                  <Input
                    id="editName"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEmail">Email</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser((prev) => (prev ? { ...prev, email: e.target.value } : null))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editRole">Role</Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(value) =>
                      setEditingUser((prev) => (prev ? { ...prev, role: value as SystemUser["role"] } : null))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="User">User</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditUser}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Password Reset Dialog */}
        <Dialog open={isPasswordResetDialogOpen} onOpenChange={setIsPasswordResetDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Generate a new password for {resetPasswordUser?.name}. The user will need to use this password to log
                in.
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
                  placeholder="Enter new password"
                />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Make sure to securely share this password with the user. They should change it
                  after their first login.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPasswordResetDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePasswordReset} disabled={!newPassword.trim()}>
                <Save className="h-4 w-4 mr-2" />
                Reset Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
