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

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== "Manager" && parsedUser.role !== "Admin") {
      router.push("/dashboard")
      return
    }
    setUser(parsedUser)

    // Load lookup lists from localStorage or use mock data
    const savedLookupLists = localStorage.getItem("lookupLists")
    let mockLookupLists: LookupList[]

    if (savedLookupLists) {
      mockLookupLists = JSON.parse(savedLookupLists)
    } else {
      // Mock lookup lists data
      mockLookupLists = [
        {
          name: "clients",
          displayName: "Client Names",
          values: [
            { id: 1, value: "TechCorp Solutions", sortOrder: 1 },
            { id: 2, value: "DataFlow Inc", sortOrder: 2 },
            { id: 3, value: "CloudTech Ltd", sortOrder: 3 },
            { id: 4, value: "InnovateSoft", sortOrder: 4 },
            { id: 5, value: "SystemsPro", sortOrder: 5 },
          ],
        },
        {
          name: "visitTypes",
          displayName: "Visit Types",
          values: [
            { id: 1, value: "On-site Support", sortOrder: 1 },
            { id: 2, value: "Remote Support", sortOrder: 2 },
            { id: 3, value: "Consultation", sortOrder: 3 },
            { id: 4, value: "Installation", sortOrder: 4 },
            { id: 5, value: "Maintenance", sortOrder: 5 },
          ],
        },
        {
          name: "purposes",
          displayName: "Purposes",
          values: [
            { id: 1, value: "System Maintenance", sortOrder: 1 },
            { id: 2, value: "Troubleshooting", sortOrder: 2 },
            { id: 3, value: "Installation", sortOrder: 3 },
            { id: 4, value: "Training", sortOrder: 4 },
            { id: 5, value: "Consultation", sortOrder: 5 },
            { id: 6, value: "Emergency Support", sortOrder: 6 },
          ],
        },
        {
          name: "shifts",
          displayName: "Shifts",
          values: [
            { id: 1, value: "Day Shift", sortOrder: 1 },
            { id: 2, value: "Evening Shift", sortOrder: 2 },
            { id: 3, value: "Night Shift", sortOrder: 3 },
            { id: 4, value: "Weekend", sortOrder: 4 },
          ],
        },
        {
          name: "environments",
          displayName: "Environments",
          values: [
            { id: 1, value: "Production", sortOrder: 1 },
            { id: 2, value: "Staging", sortOrder: 2 },
            { id: 3, value: "Development", sortOrder: 3 },
            { id: 4, value: "Testing", sortOrder: 4 },
            { id: 5, value: "UAT", sortOrder: 5 },
          ],
        },
        {
          name: "supportTypes",
          displayName: "Support Types",
          values: [
            { id: 1, value: "Technical Support", sortOrder: 1 },
            { id: 2, value: "Application Support", sortOrder: 2 },
            { id: 3, value: "Infrastructure Support", sortOrder: 3 },
            { id: 4, value: "Database Support", sortOrder: 4 },
          ],
        },
      ]
      // Save initial mock data to localStorage
      localStorage.setItem("lookupLists", JSON.stringify(mockLookupLists))
    }

    setLookupLists(mockLookupLists)
    setSelectedList("clients")
  }, [router])

  const getCurrentList = () => {
    return lookupLists.find((list) => list.name === selectedList)
  }

  const handleAddValue = () => {
    if (!newValue.trim()) return

    const currentList = getCurrentList()
    if (!currentList) return

    const newId = Math.max(...currentList.values.map((v) => v.id)) + 1
    const newSortOrder = Math.max(...currentList.values.map((v) => v.sortOrder)) + 1

    const updatedLists = lookupLists.map((list) =>
      list.name === selectedList
        ? {
            ...list,
            values: [...list.values, { id: newId, value: newValue.trim(), sortOrder: newSortOrder }],
          }
        : list,
    )

    setLookupLists(updatedLists)
    localStorage.setItem("lookupLists", JSON.stringify(updatedLists))

    setNewValue("")
    setIsAddDialogOpen(false)
  }

  const handleEditValue = () => {
    if (!editingValue || !editingValue.value.trim()) return

    const updatedLists = lookupLists.map((list) =>
      list.name === selectedList
        ? {
            ...list,
            values: list.values.map((v) => (v.id === editingValue.id ? { ...v, value: editingValue.value.trim() } : v)),
          }
        : list,
    )

    setLookupLists(updatedLists)
    localStorage.setItem("lookupLists", JSON.stringify(updatedLists))

    setEditingValue(null)
    setIsEditDialogOpen(false)
  }

  const handleDeleteValue = (id: number) => {
    const updatedLists = lookupLists.map((list) =>
      list.name === selectedList
        ? {
            ...list,
            values: list.values.filter((v) => v.id !== id),
          }
        : list,
    )

    setLookupLists(updatedLists)
    localStorage.setItem("lookupLists", JSON.stringify(updatedLists))
  }

  const handleMoveValue = (id: number, direction: "up" | "down") => {
    const currentList = getCurrentList()
    if (!currentList) return

    const sortedValues = [...currentList.values].sort((a, b) => a.sortOrder - b.sortOrder)
    const currentIndex = sortedValues.findIndex((v) => v.id === id)

    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === sortedValues.length - 1)
    ) {
      return
    }

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    const temp = sortedValues[currentIndex].sortOrder
    sortedValues[currentIndex].sortOrder = sortedValues[newIndex].sortOrder
    sortedValues[newIndex].sortOrder = temp

    const updatedLists = lookupLists.map((list) =>
      list.name === selectedList ? { ...list, values: sortedValues } : list,
    )

    setLookupLists(updatedLists)
    localStorage.setItem("lookupLists", JSON.stringify(updatedLists))
  }

  if (!user) return null

  const currentList = getCurrentList()

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
                            <TableRow key={value.id}>
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
                                    onClick={() => handleMoveValue(value.id, "up")}
                                    disabled={index === 0}
                                  >
                                    <ArrowUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMoveValue(value.id, "down")}
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
                                    onClick={() => handleDeleteValue(value.id)}
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
