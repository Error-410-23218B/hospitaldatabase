"use client"

import { useState, useEffect, useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  UserPlus,
  Users,
  Stethoscope,
  Search,
  Edit,
  Eye,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Heart,
  AlertTriangle,
  User,
  Settings,
  Shield,
} from "lucide-react"
import {
  createDoctorAccount,
  getAllPatients,
  getAllDoctors,
  getPatientDetails,
  updatePatientAccount,
  deletePatientAccount,
  deleteDoctorAccount,
} from "@/lib/admin-actions"
import { format } from "date-fns"

type Doctor = {
  id: number
  firstName: string
  lastName: string
  email: string
  specialization: string
  avatar?: string | null
  bio?: string | null
  licenseNumber?: string | null
  yearsOfExperience?: number | null
}

type Patient = {
  id: number
  firstName: string
  lastName: string
  email: string
  dob: Date
  avatar?: string | null
  bio?: string | null
  address?: {
    id: number
    street: string
    city: string
    county: string
    postcode: string
    country: string
  } | null
  emergencyContact?: {
    id: number
    name: string
    relationship: string
    phone: string
  } | null
  medicalInfo?: {
    id: number
    bloodType: string
    allergies: string[]
    conditions: string[]
    medications: string[]
  } | null
  stats?: {
    id: number
    totalAppointments: number
    upcomingAppointments: number
    completedAppointments: number
    memberSince: Date
  } | null
}

export default function AdministratorPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [isCreateDoctorOpen, setIsCreateDoctorOpen] = useState(false)
  const [isEditPatientOpen, setIsEditPatientOpen] = useState(false)
  const [isPatientDetailsOpen, setIsPatientDetailsOpen] = useState(false)

  // Form state for creating doctor
  const [createDoctorState, createDoctorAction, isCreateDoctorPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await createDoctorAccount(formData)
      if (result.success) {
        setIsCreateDoctorOpen(false)
        await loadDoctors()
        // Reset form
        const form = document.getElementById("create-doctor-form") as HTMLFormElement
        form?.reset()
      }
      return result
    },
    { success: false, message: "" },
  )

  // Form state for editing patient
  const [editPatientState, editPatientAction, isEditPatientPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      if (!selectedPatient) return prevState
      const result = await updatePatientAccount(selectedPatient.id, formData)
      if (result.success) {
        setIsEditPatientOpen(false)
        await loadPatients()
        setSelectedPatient(null)
      }
      return result
    },
    { success: false, message: "" },
  )

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([loadDoctors(), loadPatients()])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadDoctors = async () => {
    try {
      const doctorsData = await getAllDoctors()
      setDoctors(doctorsData)
    } catch (error) {
      console.error("Error loading doctors:", error)
    }
  }

  const loadPatients = async () => {
    try {
      const patientsData = await getAllPatients()
      setPatients(patientsData)
    } catch (error) {
      console.error("Error loading patients:", error)
    }
  }

  const handleViewPatient = async (patientId: number) => {
    try {
      const patientDetails = await getPatientDetails(patientId)
      setSelectedPatient(patientDetails)
      setIsPatientDetailsOpen(true)
    } catch (error) {
      console.error("Error loading patient details:", error)
    }
  }

  const handleEditPatient = async (patientId: number) => {
    try {
      const patientDetails = await getPatientDetails(patientId)
      setSelectedPatient(patientDetails)
      setIsEditPatientOpen(true)
    } catch (error) {
      console.error("Error loading patient details:", error)
    }
  }

  const handleDeletePatient = async (patientId: number) => {
    if (confirm("Are you sure you want to delete this patient account? This action cannot be undone.")) {
      try {
        const result = await deletePatientAccount(patientId)
        if (result.success) {
          await loadPatients()
        } else {
          alert(result.message)
        }
      } catch (error) {
        console.error("Error deleting patient:", error)
        alert("Failed to delete patient account")
      }
    }
  }

  const handleDeleteDoctor = async (doctorId: number) => {
    if (confirm("Are you sure you want to delete this doctor account? This action cannot be undone.")) {
      try {
        const result = await deleteDoctorAccount(doctorId)
        if (result.success) {
          await loadDoctors()
        } else {
          alert(result.message)
        }
      } catch (error) {
        console.error("Error deleting doctor:", error)
        alert("Failed to delete doctor account")
      }
    }
  }

  const filteredPatients = patients.filter(
    (patient) =>
      patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading administrator dashboard...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Administrator Dashboard</h1>
            <p className="text-muted-foreground">Manage doctors and patients</p>
          </div>
        </div>

        <Dialog open={isCreateDoctorOpen} onOpenChange={setIsCreateDoctorOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Create Doctor Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Doctor Account</DialogTitle>
              <DialogDescription>Add a new doctor to the system.</DialogDescription>
            </DialogHeader>

            {!createDoctorState.success && createDoctorState.message && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{createDoctorState.message}</p>
              </div>
            )}

            <form id="create-doctor-form" action={createDoctorAction} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" name="firstName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" name="lastName" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required minLength={8} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Select name="specialization" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General Practice">General Practice</SelectItem>
                    <SelectItem value="Cardiology">Cardiology</SelectItem>
                    <SelectItem value="Dermatology">Dermatology</SelectItem>
                    <SelectItem value="Neurology">Neurology</SelectItem>
                    <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                    <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                    <SelectItem value="Psychiatry">Psychiatry</SelectItem>
                    <SelectItem value="Surgery">Surgery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input id="licenseNumber" name="licenseNumber" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                <Input id="yearsOfExperience" name="yearsOfExperience" type="number" min="0" max="50" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea id="bio" name="bio" placeholder="Brief professional bio..." rows={3} />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDoctorOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreateDoctorPending}>
                  {isCreateDoctorPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Doctor
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Doctors</p>
                <p className="text-2xl font-bold">{doctors.length}</p>
              </div>
              <Stethoscope className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                <p className="text-2xl font-bold">{patients.length}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Accounts</p>
                <p className="text-2xl font-bold">{doctors.length + patients.length}</p>
              </div>
              <User className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Health</p>
                <p className="text-2xl font-bold text-green-600">Good</p>
              </div>
              <Settings className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="doctors">Doctors</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Doctors</CardTitle>
                <CardDescription>Latest doctor accounts created</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {doctors.slice(0, 5).map((doctor) => (
                    <div key={doctor.id} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={doctor.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {doctor.firstName[0]}
                          {doctor.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">
                          {doctor.firstName} {doctor.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                      </div>
                      <Badge variant="outline">{doctor.yearsOfExperience || 0} yrs</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Patients</CardTitle>
                <CardDescription>Latest patient registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patients.slice(0, 5).map((patient) => (
                    <div key={patient.id} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={patient.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {patient.firstName[0]}
                          {patient.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">
                          {patient.firstName} {patient.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{patient.email}</p>
                      </div>
                      <Badge variant="outline">
                        Age {new Date().getFullYear() - new Date(patient.dob).getFullYear()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="doctors" className="space-y-6">
          {/* Search */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search doctors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Doctors Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Doctors</CardTitle>
              <CardDescription>Manage doctor accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDoctors.map((doctor) => (
                    <TableRow key={doctor.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={doctor.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {doctor.firstName[0]}
                              {doctor.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {doctor.firstName} {doctor.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{doctor.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{doctor.specialization}</Badge>
                      </TableCell>
                      <TableCell>{doctor.yearsOfExperience || 0} years</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{doctor.licenseNumber || "Not provided"}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDoctor(doctor.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            ×
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients" className="space-y-6">
          {/* Search */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search patients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patients Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Patients</CardTitle>
              <CardDescription>View and manage patient accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Member Since</TableHead>
                    <TableHead>Appointments</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={patient.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {patient.firstName[0]}
                              {patient.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {patient.firstName} {patient.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{patient.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{new Date().getFullYear() - new Date(patient.dob).getFullYear()} years</TableCell>
                      <TableCell>
                        {patient.stats?.memberSince
                          ? format(new Date(patient.stats.memberSince), "MMM yyyy")
                          : "Unknown"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{patient.stats?.totalAppointments || 0} total</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewPatient(patient.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPatient(patient.id)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePatient(patient.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            ×
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Patient Dialog */}
      <Dialog open={isEditPatientOpen} onOpenChange={setIsEditPatientOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Patient Account</DialogTitle>
            <DialogDescription>
              Update patient information for {selectedPatient?.firstName} {selectedPatient?.lastName}
            </DialogDescription>
          </DialogHeader>

          {!editPatientState.success && editPatientState.message && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{editPatientState.message}</p>
            </div>
          )}

          {selectedPatient && (
            <form action={editPatientAction} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h4 className="font-semibold">Personal Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-firstName">First Name</Label>
                    <Input id="edit-firstName" name="firstName" defaultValue={selectedPatient.firstName} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-lastName">Last Name</Label>
                    <Input id="edit-lastName" name="lastName" defaultValue={selectedPatient.lastName} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" name="email" type="email" defaultValue={selectedPatient.email} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-dob">Date of Birth</Label>
                  <Input
                    id="edit-dob"
                    name="dob"
                    type="date"
                    defaultValue={format(new Date(selectedPatient.dob), "yyyy-MM-dd")}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-bio">Bio</Label>
                  <Textarea id="edit-bio" name="bio" defaultValue={selectedPatient.bio || ""} rows={3} />
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h4 className="font-semibold">Address Information</h4>
                <div className="space-y-2">
                  <Label htmlFor="edit-street">Street Address</Label>
                  <Input id="edit-street" name="street" defaultValue={selectedPatient.address?.street || ""} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-city">City</Label>
                    <Input id="edit-city" name="city" defaultValue={selectedPatient.address?.city || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-county">County</Label>
                    <Input id="edit-county" name="county" defaultValue={selectedPatient.address?.county || ""} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-postcode">Postcode</Label>
                    <Input id="edit-postcode" name="postcode" defaultValue={selectedPatient.address?.postcode || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-country">Country</Label>
                    <Input id="edit-country" name="country" defaultValue={selectedPatient.address?.country || ""} />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h4 className="font-semibold">Emergency Contact</h4>
                <div className="space-y-2">
                  <Label htmlFor="edit-emergencyName">Name</Label>
                  <Input
                    id="edit-emergencyName"
                    name="emergencyName"
                    defaultValue={selectedPatient.emergencyContact?.name || ""}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-emergencyRelationship">Relationship</Label>
                    <Input
                      id="edit-emergencyRelationship"
                      name="emergencyRelationship"
                      defaultValue={selectedPatient.emergencyContact?.relationship || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-emergencyPhone">Phone</Label>
                    <Input
                      id="edit-emergencyPhone"
                      name="emergencyPhone"
                      defaultValue={selectedPatient.emergencyContact?.phone || ""}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditPatientOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isEditPatientPending}>
                  {isEditPatientPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Update Patient
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Patient Details Sheet */}
      <Sheet open={isPatientDetailsOpen} onOpenChange={setIsPatientDetailsOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Patient Details</SheetTitle>
            <SheetDescription>Complete patient information</SheetDescription>
          </SheetHeader>

          {selectedPatient && (
            <div className="mt-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedPatient.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {selectedPatient.firstName[0]}
                      {selectedPatient.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </h3>
                    <p className="text-muted-foreground">
                      Age {new Date().getFullYear() - new Date(selectedPatient.dob).getFullYear()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedPatient.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{format(new Date(selectedPatient.dob), "MMMM dd, yyyy")}</span>
                  </div>
                </div>

                {selectedPatient.bio && (
                  <div>
                    <h4 className="font-semibold mb-2">Bio</h4>
                    <p className="text-sm text-muted-foreground">{selectedPatient.bio}</p>
                  </div>
                )}
              </div>

              {/* Address */}
              {selectedPatient.address && (
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </h4>
                  <div className="text-sm text-muted-foreground pl-6">
                    <p>{selectedPatient.address.street}</p>
                    <p>
                      {selectedPatient.address.city}, {selectedPatient.address.county}
                    </p>
                    <p>
                      {selectedPatient.address.postcode}, {selectedPatient.address.country}
                    </p>
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              {selectedPatient.emergencyContact && (
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Emergency Contact
                  </h4>
                  <div className="text-sm text-muted-foreground pl-6">
                    <p className="font-medium">{selectedPatient.emergencyContact.name}</p>
                    <p>{selectedPatient.emergencyContact.relationship}</p>
                    <p>{selectedPatient.emergencyContact.phone}</p>
                  </div>
                </div>
              )}

              {/* Medical Information */}
              {selectedPatient.medicalInfo && (
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Medical Information
                  </h4>
                  <div className="space-y-3 pl-6">
                    <div>
                      <p className="text-sm font-medium">Blood Type</p>
                      <p className="text-sm text-muted-foreground">{selectedPatient.medicalInfo.bloodType}</p>
                    </div>
                    {selectedPatient.medicalInfo.allergies.length > 0 && (
                      <div>
                        <p className="text-sm font-medium flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                          Allergies
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedPatient.medicalInfo.allergies.map((allergy, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {allergy}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedPatient.medicalInfo.conditions.length > 0 && (
                      <div>
                        <p className="text-sm font-medium">Medical Conditions</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedPatient.medicalInfo.conditions.map((condition, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {condition}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedPatient.medicalInfo.medications.length > 0 && (
                      <div>
                        <p className="text-sm font-medium">Current Medications</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedPatient.medicalInfo.medications.map((medication, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {medication}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stats */}
              {selectedPatient.stats && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Statistics</h4>
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-lg font-bold text-blue-600">{selectedPatient.stats.totalAppointments}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-lg font-bold text-green-600">{selectedPatient.stats.completedAppointments}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    Member since {format(new Date(selectedPatient.stats.memberSince), "MMMM yyyy")}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
