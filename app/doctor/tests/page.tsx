
"use client"

import { useState, useEffect } from "react"
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
  Plus,
  Save,
  Search,
  User,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Trash2,
  Edit3,
  UserPlus,
  TestTube,
  Activity,
  Clock,
} from "lucide-react"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"



const testTemplates = {
  "Complete Blood Count": [
    { parameter: "WBC", normalValue: "5.0", unit: "x10^9/L", range: "4.0-11.0" },
    { parameter: "RBC", normalValue: "4.5", unit: "x10^12/L", range: "4.2-5.9" },
    { parameter: "Hemoglobin", normalValue: "14", unit: "g/dL", range: "13-17" },
    { parameter: "Hematocrit", normalValue: "42", unit: "%", range: "40-50" },
    { parameter: "Platelets", normalValue: "250", unit: "x10^9/L", range: "150-400" },
  ],
  "Basic Metabolic Panel": [
    { parameter: "Glucose", normalValue: "90", unit: "mg/dL", range: "70-99" },
    { parameter: "Calcium", normalValue: "9.5", unit: "mg/dL", range: "8.5-10.5" },
    { parameter: "Sodium", normalValue: "140", unit: "mmol/L", range: "135-145" },
    { parameter: "Potassium", normalValue: "4.0", unit: "mmol/L", range: "3.5-5.0" },
    { parameter: "Chloride", normalValue: "102", unit: "mmol/L", range: "98-107" },
  ],
  "Liver Function Test": [
    { parameter: "ALT", normalValue: "30", unit: "U/L", range: "7-56" },
    { parameter: "AST", normalValue: "30", unit: "U/L", range: "10-40" },
    { parameter: "ALP", normalValue: "70", unit: "U/L", range: "44-147" },
    { parameter: "Bilirubin", normalValue: "1.0", unit: "mg/dL", range: "0.1-1.2" },
  ],
}

export default function CreateTestPage() {
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [patientSearch, setPatientSearch] = useState("")
  const [showPatientDialog, setShowPatientDialog] = useState(false)
  const [testName, setTestName] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [testResults, setTestResults] = useState<any[]>([])
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0])
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split("T")[0])
  const [collectionTime, setCollectionTime] = useState("08:00")
  const [priority, setPriority] = useState("routine")
  const [department, setDepartment] = useState("")
  const [clinicalInfo, setClinicalInfo] = useState("")
  const [doctorNotes, setDoctorNotes] = useState("")
  const [recommendations, setRecommendations] = useState("")
  const [followUpRequired, setFollowUpRequired] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [isLoadingPatients, setIsLoadingPatients] = useState(false)
  const [showResultDialog, setShowResultDialog] = useState(false)
  const [resultDialogData, setResultDialogData] = useState<{
    success: boolean
    title: string
    message: string
    details?: string
  }>({
    success: false,
    title: "",
    message: "",
  })

  // Mock doctor ID - in a real app, this would come from authentication
const doctorId = "1"

const fetchPatients = async (search = "") => {
  setIsLoadingPatients(true)
  try {
    const response = await fetch(`/api/patients?search=${encodeURIComponent(search)}`)
    if (response.ok) {
      const data = await response.json()
      setPatients(data)
    }
  } catch (error) {
    console.error("Error fetching patients:", error)
  } finally {
    setIsLoadingPatients(false)
  }
}

const [existingTestResults, setExistingTestResults] = useState<any[]>([])
const [isLoadingTestResults, setIsLoadingTestResults] = useState(false)

const fetchTestResults = async () => {
  setIsLoadingTestResults(true)
  try {
    const response = await fetch("/api/doctor-test-results")
    if (response.ok) {
      const data = await response.json()
      setExistingTestResults(data.testResults)
    } else {
      console.error("Failed to fetch test results")
    }
  } catch (error) {
    console.error("Error fetching test results:", error)
  } finally {
    setIsLoadingTestResults(false)
  }
}

useEffect(() => {
  fetchTestResults()
  fetchPatients()  // Added call to fetch patients on component mount
}, [])


  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      patient.id.toLowerCase().includes(patientSearch.toLowerCase()),
  )

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient)
    setShowPatientDialog(false)
    setPatientSearch("")
  }

  const handleTemplateSelect = (template: string) => {
    setSelectedTemplate(template)
    setTestName(template)
    if (testTemplates[template as keyof typeof testTemplates]) {
      const templateResults = testTemplates[template as keyof typeof testTemplates].map((item) => ({
        ...item,
        value: item.normalValue,
        status: "normal",
      }))
      setTestResults(templateResults)
    }
  }

  const addCustomParameter = () => {
    setTestResults([
      ...testResults,
      {
        parameter: "",
        value: "",
        unit: "",
        range: "",
        status: "normal",
      },
    ])
  }

  const updateTestResult = (index: number, field: string, value: string) => {
    const updated = [...testResults]
    updated[index] = { ...updated[index], [field]: value }

    // Auto-determine status based on value and range
    if (field === "value" && updated[index].range) {
      updated[index].status = determineStatus(value, updated[index].range)
    }

    setTestResults(updated)
  }

const determineStatus = (value: string, range: string): string => {
    const numValue = Number.parseFloat(value)
    if (isNaN(numValue)) return "normal"

    // Handle different range formats
    if (range.includes("-")) {
      const [min, max] = range.split("-").map((v) => Number.parseFloat(v.replace(/[^\d.]/g, "")))
      if (numValue < min) return "low"
      if (numValue > max) return "high"
      return "normal"
    } else if (range.startsWith("<")) {
      const maxValue = Number.parseFloat(range.replace(/[^\d.]/g, ""))
      return numValue > maxValue ? "high" : "normal"
    } else if (range.startsWith(">")) {
      const minValue = Number.parseFloat(range.replace(/[^\d.]/g, ""))
      return numValue < minValue ? "low" : "normal"
    }

    return "normal"
  }

  const removeTestResult = (index: number) => {
    setTestResults(testResults.filter((_, i) => i !== index))
  }

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

  const handleCreateTest = async () => {
    if (!selectedPatient || !testName || testResults.length === 0) {
      setResultDialogData({
        success: false,
        title: "Validation Error",
        message: "Please fill in all required fields",
        details: "Make sure you have selected a patient, entered a test name, and added at least one test parameter.",
      })
      setShowResultDialog(true)
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch("/api/doctor-test-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: selectedPatient.id.replace("P", ""), // Remove 'P' prefix
          testName,
          orderDate,
          collectionDate,
          collectionTime,
          priority,
          department: department || "Laboratory",
          clinicalInfo,
          doctorNotes,
          recommendations,
          followUpRequired,
          testResults,
          doctorId,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setResultDialogData({
          success: true,
          title: "Test Results Created Successfully!",
          message: `Test results for ${result.testResult.patientName} have been created and are now available in the system.`,
          details: `Test: ${result.testResult.testName}\nPatient: ${result.testResult.patientName}\nTest ID: ${result.testResult.id}`,
        })
        setShowResultDialog(true)

        // Reset form after successful creation
        setSelectedPatient(null)
        setTestName("")
        setSelectedTemplate("")
        setTestResults([])
        setClinicalInfo("")
        setDoctorNotes("")
        setRecommendations("")
        setFollowUpRequired(false)
      } else {
        setResultDialogData({
          success: false,
          title: "Error Creating Test Results",
          message: result.error || "An unexpected error occurred while creating the test results.",
          details: "Please check your input data and try again. If the problem persists, contact system administrator.",
        })
        setShowResultDialog(true)
      }
    } catch (error) {
      console.error("Error creating test:", error)
      setResultDialogData({
        success: false,
        title: "Network Error",
        message: "Unable to connect to the server. Please check your internet connection and try again.",
        details: error instanceof Error ? error.message : "Unknown network error occurred.",
      })
      setShowResultDialog(true)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <TestTube className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Test Results</h1>
              <p className="text-gray-600">Create and assign new test results to patients</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient Selection */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Patient Selection
                </CardTitle>
                <CardDescription>Select the patient for whom you want to create test results</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedPatient ? (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <p className="font-semibold text-blue-900">{selectedPatient.name}</p>
                      <p className="text-sm text-blue-700">
                        ID: {selectedPatient.id} • {selectedPatient.age}y • {selectedPatient.gender}
                      </p>
                      <p className="text-sm text-blue-600">DOB: {selectedPatient.dob}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPatient(null)}
                      className="text-blue-600 border-blue-300"
                    >
                      Change Patient
                    </Button>
                  </div>
                ) : (
                  <Dialog open={showPatientDialog} onOpenChange={setShowPatientDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Select Patient
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Select Patient</DialogTitle>
                        <DialogDescription>Search and select a patient from the database</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search by patient name or ID..."
                            value={patientSearch}
                            onChange={(e) => setPatientSearch(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {isLoadingPatients ? (
                            <div className="text-center py-4">
                              <Clock className="h-6 w-6 animate-spin mx-auto mb-2" />
                              <p className="text-sm text-gray-500">Loading patients...</p>
                            </div>
                          ) : filteredPatients.length > 0 ? (
                            filteredPatients.map((patient) => (
                              <div
                                key={patient.id}
                                onClick={() => handleSelectPatient(patient)}
                                className="p-3 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{patient.name}</p>
                                    <p className="text-sm text-gray-600">
                                      ID: {patient.id} • {patient.age}y • {patient.gender}
                                    </p>
                                  </div>
                                  <Badge variant="outline">{patient.dob}</Badge>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-sm text-gray-500">No patients found</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>

            {/* Test Information */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Test Information
                </CardTitle>
                <CardDescription>Configure the basic test information and parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="testTemplate">Test Template</Label>
                    <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a test template" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(testTemplates).map((template) => (
                          <SelectItem key={template} value={template}>
                            {template}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="testName">Test Name</Label>
                    <Input
                      id="testName"
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      placeholder="Enter custom test name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="orderDate">Order Date</Label>
                    <Input
                      id="orderDate"
                      type="date"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="collectionDate">Collection Date</Label>
                    <Input
                      id="collectionDate"
                      type="date"
                      value={collectionDate}
                      onChange={(e) => setCollectionDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="collectionTime">Collection Time</Label>
                    <Input
                      id="collectionTime"
                      type="time"
                      value={collectionTime}
                      onChange={(e) => setCollectionTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">Routine</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="stat">STAT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Laboratory">Laboratory</SelectItem>
                        <SelectItem value="Hematology">Hematology</SelectItem>
                        <SelectItem value="Chemistry">Chemistry</SelectItem>
                        <SelectItem value="Microbiology">Microbiology</SelectItem>
                        <SelectItem value="Pathology">Pathology</SelectItem>
                        <SelectItem value="Cardiology">Cardiology</SelectItem>
                        <SelectItem value="Endocrinology">Endocrinology</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="clinicalInfo">Clinical Information</Label>
                  <Textarea
                    id="clinicalInfo"
                    value={clinicalInfo}
                    onChange={(e) => setClinicalInfo(e.target.value)}
                    placeholder="Enter clinical information, symptoms, or reason for testing..."
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Test Results */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Test Results
                    </CardTitle>
                    <CardDescription>Enter the test parameters and their values</CardDescription>
                  </div>
                  <Button onClick={addCustomParameter} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Parameter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {testResults.length > 0 ? (
                  <div className="space-y-4">
                    {testResults.map((result, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                          <div>
                            <Label className="text-xs">Parameter</Label>
                            <Input
                              value={result.parameter}
                              onChange={(e) => updateTestResult(index, "parameter", e.target.value)}
                              placeholder="Parameter name"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Value</Label>
                            <Input
                              value={result.value}
                              onChange={(e) => updateTestResult(index, "value", e.target.value)}
                              placeholder="Result value"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Unit</Label>
                            <Input
                              value={result.unit}
                              onChange={(e) => updateTestResult(index, "unit", e.target.value)}
                              placeholder="Unit"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Reference Range</Label>
                            <Input
                              value={result.range}
                              onChange={(e) => updateTestResult(index, "range", e.target.value)}
                              placeholder="Normal range"
                              className="text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(result.status)}>{result.status}</Badge>
                            {getStatusIcon(result.status)}
                          </div>
                          <div>
                            <Button
                              onClick={() => removeTestResult(index)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <TestTube className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No test parameters added yet</p>
                    <p className="text-sm">Select a template or add custom parameters</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Doctor's Notes and Recommendations */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5" />
                  Clinical Review
                </CardTitle>
                <CardDescription>Add your clinical interpretation and recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="doctorNotes">Clinical Notes & Interpretation</Label>
                  <Textarea
                    id="doctorNotes"
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    placeholder="Enter your clinical interpretation of the results..."
                    className="min-h-[100px]"
                  />
                </div>
                <div>
                  <Label htmlFor="recommendations">Recommendations & Next Steps</Label>
                  <Textarea
                    id="recommendations"
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    placeholder="Enter recommendations, treatment plans, or follow-up instructions..."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="followUp"
                    checked={followUpRequired}
                    onChange={(e) => setFollowUpRequired(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="followUp">Follow-up appointment required</Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Panel */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Test Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPatient && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Patient</p>
                    <p className="text-sm text-blue-800">{selectedPatient.name}</p>
                    <p className="text-xs text-blue-700">ID: {selectedPatient.id}</p>
                  </div>
                )}

                {testName && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-900">Test</p>
                    <p className="text-sm text-green-800">{testName}</p>
                  </div>
                )}

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Collection</p>
                  <p className="text-sm text-gray-800">
                    {collectionDate} at {collectionTime}
                  </p>
                </div>

                {testResults.length > 0 && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-purple-900">Parameters</p>
                    <p className="text-sm text-purple-800">{testResults.length} parameters</p>
                    <div className="mt-2 space-y-1">
                      {testResults
                        .filter((r) => r.status !== "normal")
                        .slice(0, 3)
                        .map((result, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs">
                            {getStatusIcon(result.status)}
                            <span className="text-purple-700">{result.parameter}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleCreateTest}
                  disabled={!selectedPatient || !testName || testResults.length === 0 || isCreating}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  {isCreating ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Creating Test...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Test Results
                    </>
                  )}
                </Button>

                <div className="pt-4 border-t">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-amber-800">
                      <p className="font-medium">Important</p>
                      <p>Test results will be immediately available to the patient once created.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Templates */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Quick Templates</CardTitle>
                <CardDescription>Common test templates for quick setup</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.keys(testTemplates)
                    .slice(0, 5)
                    .map((template) => (
                      <Button
                        key={template}
                        onClick={() => handleTemplateSelect(template)}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left h-auto p-3"
                      >
                        <div>
                          <p className="font-medium text-sm">{template}</p>
                          <p className="text-xs text-gray-500">
                            {testTemplates[template as keyof typeof testTemplates].length} parameters
                          </p>
                        </div>
                      </Button>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Result Dialog */}
        <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle
                className={`flex items-center gap-2 ${resultDialogData.success ? "text-green-600" : "text-red-600"}`}
              >
                {resultDialogData.success ? <CheckCircle className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
                {resultDialogData.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-gray-700">{resultDialogData.message}</p>

              {resultDialogData.details && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    resultDialogData.success
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-mono text-xs">{resultDialogData.details}</pre>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {resultDialogData.success ? (
                  <>
                    <Button
                      onClick={() => {
                        setShowResultDialog(false)
                        // Optionally redirect to doctor portal
                        window.location.href = "/doctor/testsview"
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      View in Doctor Portal
                    </Button>
                    <Button onClick={() => setShowResultDialog(false)} variant="outline" className="flex-1">
                      Create Another Test
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setShowResultDialog(false)} className="w-full" variant="outline">
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
