"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Settings, Plus, Edit, Trash2, ArrowUp, ArrowDown, ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

interface User {
  empId: string
  role: string
  name: string
}

interface LookupValue {
  i: number
  value: string
  sortOrder: number
}

interface LookupList {
  name: string
  displayName: string
  values: LookupValue[]
}

export default function LookupListsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [lookupLists, setLookupLists] = useState<LookupList[]>([])
  const [selectedList, setSelectedList] = useState<string>("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newValue, setNewValue] = useState("")
  const [editingValue, setEditingValue] = useState<LookupValue | null>(null)
  const router = useRouter()

  const slaOptions = lookupLists.find(list => list.name === "sla_hours")?.values || []

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (!response.ok) {
          router.push('/');
          return;
        }
        const userData = await response.json();
        if (userData.role !== "Manager" && userData.role !== "Admin") {
          setUser(userData);
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Failed to fetch user session:', error);
        router.push('/');
      }
    };

    fetchUser();
  }, [router])

  // Load lookup lists from backend API
  const loadLookupLists = async () => {
    try {
      const res = await fetch('/api/lookup-lists')
      if (!res.ok) throw new Error('Failed to fetch lookup lists')
      const data = await res.json()
      // Use data.lookupLists as returned by backend
      setLookupLists(data.lookupLists || [])
      if (data.lookupLists && data.lookupLists.length > 0) {
        setSelectedList(data.lookupLists[0].name)
      }
    } catch (error) {
      console.error('Error loading lookup lists:', error)
    }
  }


  useEffect(() => {
    if (user) {
      loadLookupLists()
    }
  }, [user])

  const getCurrentList = () => {
    return lookupLists.find((list) => list.name === selectedList)
  }

  const handleAddValue = async () => {
    if (!newValue.trim()) return
    const currentList = getCurrentList()
    if (!currentList) return
    

    try {
      const res = await fetch(`/api/lookup-lists/${selectedList}/values`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: newValue.trim() }),
      })
      if (!res.ok) throw new Error('Failed to add value')
      await loadLookupLists()
      setNewValue("")
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Error adding value:', error)
    }
  }

  const handleEditValue = async () => {
    if (!editingValue || !editingValue.value.trim()) return

    try {
      const res = await fetch(`/api/lookup-lists/${selectedList}/values/${editingValue.i}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: editingValue.value.trim() }),
      })
      if (!res.ok) throw new Error('Failed to edit value')
      await loadLookupLists()
      setEditingValue(null)
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('Error editing value:', error)
    }
  }

  const handleDeleteValue = async (id: number) => {
    try {
      const res = await fetch(`/api/lookup-lists/${selectedList}/values/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete value')
      await loadLookupLists()
    } catch (error) {
      console.error('Error deleting value:', error)
    }
  }

  const handleMoveValue = async (id: number, direction: "up" | "down") => {
    try {
      const res = await fetch(`/api/lookup-lists/${selectedList}/values/${id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      })
      if (!res.ok) throw new Error('Failed to move value')
      await loadLookupLists()
    } catch (error) {
      console.error('Error moving value:', error)
    }
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
              <Settings className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Lookup Lists Management</h1>
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
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Lookup Lists Management</h2>
          <p className="text-gray-600">
            Manage dropdown values used in MCL and Problem report forms. Changes will be reflected immediately in all
            forms.
          </p>
        </div>

        {/* Tabs for different lookup lists */}
        <Tabs value={selectedList} onValueChange={setSelectedList} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            {lookupLists.map((list) => (
              <TabsTrigger key={list.name} value={list.name} className="text-xs">
                {list.displayName}
              </TabsTrigger>
            ))}
            {!lookupLists.some(l => l.name === "sla_hours") && (
              <TabsTrigger
                value="sla_hours"
                className="text-xs"
                onClick={() => setSelectedList("sla_hours")} // <-- ensure selectedList updates here
              >
                SLA Hours
              </TabsTrigger>
            )}
          </TabsList>

          {lookupLists.map((list) => (
            <TabsContent key={list.name} value={list.name}>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{list.displayName}</CardTitle>
                      <CardDescription>
                        Manage values for {list.displayName.toLowerCase()} dropdown. Total: {list.values.length} items
                      </CardDescription>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Value
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New {list.displayName} Value</DialogTitle>
                          <DialogDescription>
                            Enter a new value to add to the {list.displayName.toLowerCase()} list.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="newValue">Value</Label>
                            <Input
                              id="newValue"
                              value={newValue}
                              onChange={(e) => setNewValue(e.target.value)}
                              placeholder={`Enter new ${list.displayName.toLowerCase()} value`}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddValue} disabled={!newValue.trim()}>
                            <Save className="h-4 w-4 mr-2" />
                            Add Value
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead className="w-32">Sort Order</TableHead>
                          <TableHead className="w-48">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {list.values
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map((value, index) => (
                            <TableRow key={value.i}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="font-medium">{value.value}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{value.sortOrder}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMoveValue(value.i, "up")}
                                    disabled={index === 0}
                                  >
                                    <ArrowUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMoveValue(value.i, "down")}
                                    disabled={index === list.values.length - 1}
                                  >
                                    <ArrowDown className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingValue(value)
                                      setIsEditDialogOpen(true)
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteValue(value.i)}
                                    className="text-red-600 hover:text-red-700"
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

                  {list.values.length === 0 && (
                    <div className="text-center py-8">
                      <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No values configured for this list.</p>
                      <p className="text-sm text-gray-400">Add your first value to get started.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
          {/* Add SLA Hours tab content if not already present */}
          {!lookupLists.some(l => l.name === "sla_hours") && selectedList === "sla_hours" && (
            <TabsContent value="sla_hours">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>SLA Hours</CardTitle>
                      <CardDescription>
                        Manage values for SLA hours dropdown. Total: {slaOptions.length} items
                      </CardDescription>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Value
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New SLA Hours Value</DialogTitle>
                          <DialogDescription>
                            Enter a new value to add to the SLA hours list.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="newValue">Value</Label>
                            <Input
                              id="newValue"
                              value={newValue}
                              onChange={(e) => setNewValue(e.target.value)}
                              placeholder="Enter new SLA hours value"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddValue} disabled={!newValue.trim()}>
                            <Save className="h-4 w-4 mr-2" />
                            Add Value
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead className="w-32">Sort Order</TableHead>
                          <TableHead className="w-48">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {slaOptions
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map((value, index) => (
                            <TableRow key={value.i}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell className="font-medium">{value.value}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{value.sortOrder}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMoveValue(value.i, "up")}
                                    disabled={index === 0}
                                  >
                                    <ArrowUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMoveValue(value.i, "down")}
                                    disabled={index === slaOptions.length - 1}
                                  >
                                    <ArrowDown className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingValue(value)
                                      setIsEditDialogOpen(true)
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteValue(value.i)}
                                    className="text-red-600 hover:text-red-700"
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

                  {slaOptions.length === 0 && (
                    <div className="text-center py-8">
                      <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No values configured for SLA hours.</p>
                      <p className="text-sm text-gray-400">Add your first value to get started.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Value</DialogTitle>
              <DialogDescription>
                Modify the selected value. This change will be reflected in all forms immediately.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editValue">Value</Label>
                <Input
                  id="editValue"
                  value={editingValue?.value || ""}
                  onChange={(e) => setEditingValue((prev) => (prev ? { ...prev, value: e.target.value } : null))}
                  placeholder="Enter value"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditValue} disabled={!editingValue?.value.trim()}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
