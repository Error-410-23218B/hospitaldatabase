"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FileText,
  Send,
  Eye,
  Calendar,
  User,
  Stethoscope,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Filter,
  RefreshCw,
  Bell,
  MessageSquare,
  ClipboardCheck,
  AlertTriangle,
  Edit3,
  Save,
  X,
  Plus,
} from "lucide-react"

export default function DoctorPortalPage() {
  const [doctor, setDoctor] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [selectedTest, setSelectedTest] = useState<any>(null)
  const [isLoadingTests, setIsLoadingTests] = useState(false)
  const [pendingTests, setPendingTests] = useState<any[]>([])
  const [editingNotes, setEditingNotes] = useState(false)
  const [tempNotes, setTempNotes] = useState("")
  const [tempRecommendations, setTempRecommendations] = useState("")
  const [tempFollowUp, setTempFollowUp] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCurrentDoctor = async () => {
    try {
      const response = await fetch("/api/me")
      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setDoctor(data.user)
        } else {
          setError("Unauthorized: Please login to access this page.")
        }
      } else {
        setError("Unauthorized: Please login to access this page.")
      }
    } catch (err) {
      setError("Failed to fetch user info.")
    }
  }

  const fetchTestResults = async () => {
    setIsLoadingTests(true)
    try {
      const response = await fetch("/api/doctor-test-results")
      if (response.ok) {
        const data = await response.json()
        setPendingTests(data.testResults || [])
      } else {
        setError("Failed to fetch test results.")
      }
    } catch (error) {
      setError("Error fetching test results.")
    } finally {
      setIsLoadingTests(false)
    }
  }

  useEffect(() => {
    fetchCurrentDoctor()
  }, [])

  useEffect(() => {
    if (doctor) {
      fetchTestResults()
    }
  }, [doctor, filterStatus, filterPriority])

  const filteredTests = pendingTests.filter((test) => {
    const patientName = test.patient?.name || ""
    const patientId = test.patient?.id?.toString() || ""
    const doctorFirstName = test.doctor?.firstName || ""
    const doctorLastName = test.doctor?.lastName || ""

    const matchesSearch =
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctorFirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctorLastName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || test.status === filterStatus
    const matchesPriority = filterPriority === "all" || test.priority === filterPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "normal":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "high":
        return <TrendingUp className="h-4 w-4 text-red-600" />
      case "low":
        return <TrendingDown className="h-4 w-4 text-blue-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "bg-green-100 text-green-800"
      case "high":
        return "bg-red-100 text-red-800"
      case "low":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "stat":
        return "bg-red-100 text-red-800 border-red-200"
      case "urgent":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "routine":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTestStatusColor = (status: string) => {
    switch (status) {
      case "critical_review":
        return "bg-red-100 text-red-800 border-red-200"
      case "pending_review":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "reviewed":
        return "bg-green-100 text-green-800 border-green-200"
      case "released":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleStartReview = (test: any) => {
    setSelectedTest(test)
    setTempNotes(test.notes || "")
    setTempRecommendations(test.recommendations || "")
    setTempFollowUp(test.followUpRequired || false)
    setEditingNotes(true)
  }

  const handleSaveAndRelease = async () => {
    if (selectedTest) {
      try {
        const response = await fetch("/api/doctor-test-results", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            testResultId: selectedTest.id,
            notes: tempNotes,
            status: "released",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update test result");
        }

        const updatedTestResult = await response.json();

        const updatedTests = pendingTests.map((test) =>
          test.id === selectedTest.id
            ? {
                ...test,
                notes: tempNotes,
                status: "released",
              }
            : test,
        );
        setPendingTests(updatedTests);
        setEditingNotes(false);
        setSelectedTest(null);
        alert("Test results have been reviewed and released to the patient.");
      } catch (error: any) {
        alert("Error saving test result: " + error.message);
      }
    }
  };

  const handleSaveDraft = async () => {
    if (selectedTest) {
      try {
        const response = await fetch("/api/doctor-test-results", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            testResultId: selectedTest.id,
            notes: tempNotes,
            status: "reviewed",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update test result");
        }

        const updatedTestResult = await response.json();

        const updatedTests = pendingTests.map((test) =>
          test.id === selectedTest.id
            ? {
                ...test,
                notes: tempNotes,
                status: "reviewed",
              }
            : test,
        );
        setPendingTests(updatedTests);
        setEditingNotes(false);
        alert("Notes saved as draft. Test results not yet released to patient.");
      } catch (error: any) {
        alert("Error saving draft: " + error.message);
      }
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-red-600 font-semibold">{error}</p>
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Portal - Test Results</h1>
              <p className="text-gray-600">Review and release patient test results</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/doctor/tests">
                <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Test
                </Button>
              </Link>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <User className="h-4 w-4" />
                Dr. {doctor.name || doctor.firstName}
              </div>
              <div className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                <Bell className="h-4 w-4" />
                {pendingTests.filter((t) => t.status === "critical_review").length} Critical
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-md">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Review</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {pendingTests.filter((t) => t.status === "pending_review").length}
                    </p>
                  </div>
                  <ClipboardCheck className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Critical Review</p>
                    <p className="text-2xl font-bold text-red-600">
                      {pendingTests.filter((t) => t.status === "critical_review").length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Reviewed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {pendingTests.filter((t) => t.status === "reviewed").length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Released</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {pendingTests.filter((t) => t.status === "released").length}
                    </p>
                  </div>
                  <Send className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by patient name, ID, test name, or doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="critical_review">Critical Review</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="released">Released</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="stat">STAT</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="routine">Routine</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Test Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTests.map((test) => (
            <Card
              key={test.id}
              className={`hover:shadow-lg transition-all duration-300 border-2 shadow-md ${
                test.status === "critical_review" ? "border-red-200 bg-red-50/30" : "border-gray-100"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg font-semibold text-gray-900">{test.patient.name}</CardTitle>
                      {test.criticalValues && test.criticalValues.length > 0 && (
                        <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <User className="h-4 w-4" />
                      {test.patient.id} • {test.patient.age}y • {test.patient.gender}
                    </div>
                    <div className="text-sm font-medium text-blue-600 mb-2">{test.testName}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge className={getPriorityColor(test.priority)}>{test.priority.toUpperCase()}</Badge>
                    <Badge className={getTestStatusColor(test.status)}>
                      {test.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  Collected: {test.date?.split("T")[0]} at {test.time}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Stethoscope className="h-4 w-4" />
                  Ordered by: {test.doctor.firstName} {test.doctor.lastName}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Critical Values Alert */}
                  {test.criticalValues && test.criticalValues.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-800 text-sm font-medium">
                        <AlertTriangle className="h-4 w-4" />
                        Critical Values Detected
                      </div>
                      <p className="text-xs text-red-700 mt-1">
                        {test.criticalValues.join(", ")} - Requires immediate attention
                      </p>
                    </div>
                  )}

                  {/* Quick Results Preview */}
                  <div className="space-y-2">
                    {test.parameters.slice(0, 3).map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{item.parameter}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {item.value} {item.unit}
                          </span>
                          {getStatusIcon(item.status)}
                        </div>
                      </div>
                    ))}
                    {test.parameters.length > 3 && (
                      <p className="text-xs text-gray-500">+{test.parameters.length - 3} more parameters</p>
                    )}
                  </div>

                  {/* Clinical Info */}
                  {test.clinicalInfo && (
                    <div className="p-2 bg-blue-50 rounded text-sm">
                      <p className="font-medium text-blue-800 mb-1">Clinical Information:</p>
                      <p className="text-blue-700">{test.clinicalInfo}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3 border-t">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => setSelectedTest(test)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-full max-w-full sm:max-w-xl md:max-w-4xl lg:max-w-6xl xl:max-w-[1400px] max-h-[95vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {selectedTest?.testName} - {selectedTest?.patient?.name}
                          </DialogTitle>
                          <DialogDescription>
                            Patient ID: {selectedTest?.patient?.id} • Collected on {selectedTest?.date?.split("T")[0]} at{" "}
                            {selectedTest?.time}
                          </DialogDescription>
                        </DialogHeader>

                        {selectedTest && (
                          <div className="space-y-6">
                            {/* Patient & Test Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                              <div>
                                <p className="text-sm font-medium text-gray-700">Patient</p>
                                <p className="text-sm text-gray-900">
                                  {selectedTest.patient?.name} ({selectedTest.patient?.age}y, {selectedTest.patient?.gender})
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700">Ordering Physician</p>
                                <p className="text-sm text-gray-900">
                                  {selectedTest.doctor?.firstName} {selectedTest.doctor?.lastName}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700">Department</p>
                                <p className="text-sm text-gray-900">{selectedTest.department}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700">Priority</p>
                                <Badge className={getPriorityColor(selectedTest.priority)}>
                                  {selectedTest.priority.toUpperCase()}
                                </Badge>
                              </div>
                            </div>

                            {/* Clinical Information */}
                            {selectedTest.clinicalInfo && (
                              <div className="p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                  <AlertCircle className="h-5 w-5 text-blue-600" />
                                  Clinical Information
                                </h4>
                                <p className="text-gray-700">{selectedTest.clinicalInfo}</p>
                              </div>
                            )}

                            {/* Results Table */}
                            <div>
                              <h4 className="font-semibold text-lg mb-3">Test Results</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-200">
                                  <thead>
                                    <tr className="bg-gray-50">
                                      <th className="border border-gray-200 px-4 py-2 text-left">Parameter</th>
                                      <th className="border border-gray-200 px-4 py-2 text-left">Result</th>
                                      <th className="border border-gray-200 px-4 py-2 text-left">Reference Range</th>
                                      <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
                                      <th className="border border-gray-200 px-4 py-2 text-left">Critical</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {selectedTest.parameters.map((item: any, index: number) => (
                                      <tr
                                        key={index}
                                        className={`hover:bg-gray-50 ${
                                          selectedTest.criticalValues && selectedTest.criticalValues.includes(item.parameter)
                                            ? "bg-red-50 border-red-200"
                                            : ""
                                        }`}
                                      >
                                        <td className="border border-gray-200 px-4 py-2 font-medium">
                                          {item.parameter}
                                        </td>
                                        <td className="border border-gray-200 px-4 py-2 font-semibold">
                                          {item.value} {item.unit}
                                        </td>
                                        <td className="border border-gray-200 px-4 py-2 text-gray-600">{item.range}</td>
                                        <td className="border border-gray-200 px-4 py-2">
                                          <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                                        </td>
                                        <td className="border border-gray-200 px-4 py-2">
                                          {selectedTest.criticalValues && selectedTest.criticalValues.includes(item.parameter) && (
                                            <AlertTriangle className="h-4 w-4 text-red-500" />
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Doctor's Review Section */}
                            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                  <MessageSquare className="h-5 w-5 text-yellow-600" />
                                  Doctor's Review & Notes
                                </h4>
                                {!editingNotes && (
                                  <Button
                                    onClick={() => handleStartReview(selectedTest)}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <Edit3 className="h-4 w-4 mr-2" />
                                    Start Review
                                  </Button>
                                )}
                              </div>

                              {editingNotes ? (
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="doctorNotes" className="text-sm font-medium">
                                      Clinical Interpretation & Notes
                                    </Label>
                                    <Textarea
                                      id="doctorNotes"
                                      value={tempNotes}
                                      onChange={(e) => setTempNotes(e.target.value)}
                                      placeholder="Enter your clinical interpretation, findings, and notes..."
                                      className="mt-1 min-h-[100px]"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="recommendations" className="text-sm font-medium">
                                      Recommendations & Next Steps
                                    </Label>
                                    <Textarea
                                      id="recommendations"
                                      value={tempRecommendations}
                                      onChange={(e) => setTempRecommendations(e.target.value)}
                                      placeholder="Enter recommendations, follow-up instructions, or treatment plans..."
                                      className="mt-1 min-h-[80px]"
                                    />
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id="followUp"
                                      checked={tempFollowUp}
                                      onChange={(e) => setTempFollowUp(e.target.checked)}
                                      className="rounded border-gray-300"
                                    />
                                    <Label htmlFor="followUp" className="text-sm">
                                      Follow-up appointment required
                                    </Label>
                                  </div>
                                  <div className="flex gap-2 pt-2">
                                    <Button onClick={handleSaveAndRelease} className="bg-green-600 hover:bg-green-700">
                                      <Send className="h-4 w-4 mr-2" />
                                      Save & Release to Patient
                                    </Button>
                                    <Button onClick={handleSaveDraft} variant="outline">
                                      <Save className="h-4 w-4 mr-2" />
                                      Save Draft
                                    </Button>
                                    <Button
                                      onClick={() => setEditingNotes(false)}
                                      variant="outline"
                                      className="text-gray-600"
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {selectedTest.notes ? (
                                    <div>
                                      <p className="text-sm font-medium text-gray-700 mb-1">Clinical Notes:</p>
                                      <p className="text-gray-900 bg-white p-3 rounded border">{selectedTest.notes}</p>
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 italic">No clinical notes added yet.</p>
                                  )}
                                  {selectedTest.recommendations && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-700 mb-1">Recommendations:</p>
                                      <p className="text-gray-900 bg-white p-3 rounded border">{selectedTest.recommendations}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    {test.status !== "released" && test.status === "critical_review" && (
                      <Button
                        size="sm"
                        onClick={() => handleStartReview(test)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Urgent Review
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTests.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No test results found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Important Reminders</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Critical values require immediate review and patient notification</li>
                <li>• All test results must be reviewed and approved before release to patients</li>
                <li>• Add clinical interpretation and recommendations for abnormal results</li>
                <li>• Follow-up appointments should be scheduled for significant findings</li>
                <li>• Document all clinical decisions and communications in patient records</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
