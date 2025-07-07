"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  FileText,
  Download,
  Eye,
  Calendar,
  Clock,
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
} from "lucide-react"

interface TestResultParameter {
  parameter: string
  value: string
  unit: string
  range: string
  status: string
}

interface TestResult {
  id: string
  testName: string
  date: string
  time: string
  doctor: string
  department: string
  status: string
  priority: string
  results: TestResultParameter[]
  notes?: string
  downloadUrl?: string
}

export default function TestResultsPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (user?.role === "doctor") {
      router.replace("/doctor/tests")
      return
    }
  }, [user, router])

  useEffect(() => {
    async function fetchTestResults() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/patient-test-results")
        if (!response.ok) {
          throw new Error("Failed to fetch test results")
        }
        const data = await response.json()
        setTestResults(data.testResults)
      } catch (err: any) {
        setError(err.message || "Unknown error")
      } finally {
        setIsLoading(false)
      }
    }
    fetchTestResults()
  }, [])

  const filteredResults = testResults.filter((result) => {
    const matchesSearch =
      result.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.department.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || result.status === filterStatus
    return matchesSearch && matchesFilter
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
      case "urgent":
        return "bg-red-100 text-red-800"
      case "routine":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Error loading test results: {error}
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Results</h1>
              <p className="text-gray-600">View and download your laboratory test results</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User className="h-4 w-4" />
              Patient Portal
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tests, doctors, or departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Results</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredResults.map((result) => (
            <Card key={result.id} className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-1">{result.testName}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Calendar className="h-4 w-4" />
                      {result.date}
                      <Clock className="h-4 w-4 ml-2" />
                      {result.time}
                    </div>
                  </div>
                  <Badge className={getPriorityColor(result.priority)}>{result.priority}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Stethoscope className="h-4 w-4" />
                  {result.doctor} • {result.department}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Quick Results Preview */}
                  <div className="space-y-2">
                    {result.results.slice(0, 3).map((item, index) => (
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
                    {result.results.length > 3 && (
                      <p className="text-xs text-gray-500">+{result.results.length - 3} more parameters</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3 border-t">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => setSelectedResult(result)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {selectedResult?.testName}
                          </DialogTitle>
                          <DialogDescription>
                            Test performed on {selectedResult?.date} at {selectedResult?.time}
                          </DialogDescription>
                        </DialogHeader>

                        {selectedResult && (
                          <div className="space-y-6">
                            {/* Test Info */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                              <div>
                                <p className="text-sm font-medium text-gray-700">Ordering Physician</p>
                                <p className="text-sm text-gray-900">{selectedResult.doctor}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700">Department</p>
                                <p className="text-sm text-gray-900">{selectedResult.department}</p>
                              </div>
                            </div>

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
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {selectedResult.results.map((item: any, index: number) => (
                                      <tr key={index} className="hover:bg-gray-50">
                                        <td className="border border-gray-200 px-4 py-2 font-medium">
                                          {item.parameter}
                                        </td>
                                        <td className="border border-gray-200 px-4 py-2">
                                          {item.value} {item.unit}
                                        </td>
                                        <td className="border border-gray-200 px-4 py-2 text-gray-600">{item.range}</td>
                                        <td className="border border-gray-200 px-4 py-2">
                                          <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Doctor's Notes */}
                            {selectedResult.notes && (
                              <div className="p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                                  <AlertCircle className="h-5 w-5 text-blue-600" />
                                  Doctor's Notes
                                </h4>
                                <p className="text-gray-700">{selectedResult.notes}</p>
                              </div>
                            )}

                            {/* Download Button */}
                            <div className="flex justify-end">
                              <Button
                                onClick={() => {
                                  // Simulate download
                                  const link = document.createElement("a")
                                  link.href = selectedResult.downloadUrl || "#"
                                  link.download = `${selectedResult.testName}-${selectedResult.date}.pdf`
                                  link.click()
                                }}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download Full Report
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!result.downloadUrl) {
                          // Call API to generate PDF and get downloadUrl
                          try {
                            const response = await fetch(`/api/patient-test-results/${result.id}/download`);
                            if (!response.ok) {
                              throw new Error("Failed to generate PDF");
                            }
                            const data = await response.json();
                            if (data.downloadUrl) {
                              // Update local state with new downloadUrl
                              setTestResults((prev) =>
                                prev.map((r) =>
                                  r.id === result.id ? { ...r, downloadUrl: data.downloadUrl } : r
                                )
                              );
                              // Trigger download
                              const link = document.createElement("a");
                              link.href = data.downloadUrl;
                              link.download = `${result.testName}-${result.date}.pdf`;
                              link.click();
                            }
                          } catch (error) {
                            console.error("Error generating PDF:", error);
                          }
                        } else {
                          // Use existing downloadUrl
                          const link = document.createElement("a");
                          link.href = result.downloadUrl;
                          link.download = `${result.testName}-${result.date}.pdf`;
                          link.click();
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredResults.length === 0 && (
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
              <h4 className="font-semibold text-gray-900 mb-2">Important Information</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Test results are typically available within 24-48 hours of collection</li>
                <li>• Abnormal results will be communicated directly by your healthcare provider</li>
                <li>• For questions about your results, please contact your ordering physician</li>
                <li>• Keep downloaded reports for your personal medical records</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
