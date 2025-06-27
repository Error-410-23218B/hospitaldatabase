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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Heart,
  AlertTriangle,
  Plus,
  X,
  Eye,
  Filter,
  Search,
  CalendarDays,
  Stethoscope,
  Activity,
  Loader2,
  Edit,
  LogOut,
  Settings,
} from "lucide-react"
import {
  getDoctorAppointments,
  updateAppointmentStatus,
  updateAppointment,
  cancelAppointment,
  scheduleAppointment,
  getAllPatients,
  getAllServices,
  getPatientDetails,
} from "@/lib/admin-actions"
import { getCurrentDoctor, logoutDoctor } from "@/lib/auth-actions"
import { format } from "date-fns"

  type Doctor = {
    id: number
    firstName: string
    lastName: string
    email: string
    specialization: string
    avatar?: string | null
  }

type Appointment = {
  id: number
  datetime: Date
  status: string
  notes?: string | null
  patient: {
    id: number
    firstName: string
    lastName: string
    email: string
    dob: Date
    address?: {
      street: string
      city: string
      county: string
      postcode: string
      country: string
    } | null
    emergencyContact?: {
      name: string
      relationship: string
      phone: string
    } | null
    medicalInfo?: {
      bloodType: string
      allergies: string[]
      conditions: string[]
      medications: string[]
    } | null
  }
  service: {
    id: number
    name: string
    duration: number
  }
}

type Patient = {
  id: number
  firstName: string
  lastName: string
  email: string
  dob: Date
}

type Service = {
  id: number
  name: string
  duration: number
}

export default function AdminPage() {
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [isPatientSheetOpen, setIsPatientSheetOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<number | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [cancelReason, setCancelReason] = useState("")

  // Form state for scheduling appointment
  const [scheduleState, scheduleAction, isSchedulePending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await scheduleAppointment(formData)
      if (result.success) {
        setIsScheduleDialogOpen(false)
        await loadAppointments()
        // Reset form
        const form = document.getElementById("schedule-form") as HTMLFormElement
        form?.reset()
      }
      return result
    },
    { success: false, message: "" },
  )

  // Form state for editing appointment
  const [editState, editAction, isEditPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      if (!selectedAppointment) return prevState
      const result = await updateAppointment(selectedAppointment.id, formData)
      if (result.success) {
        setIsEditDialogOpen(false)
        setEditingAppointment(null)
        setSelectedAppointment(null)
        await loadAppointments()
      }
      return result
    },
    { success: false, message: "" },
  )

  // Form state for cancelling appointment
  const [cancelState, cancelAction, isCancelPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      if (!selectedAppointment) return prevState
      const reason = formData.get("reason") as string
      const result = await cancelAppointment(selectedAppointment.id, reason)
      if (result.success) {
        setIsCancelDialogOpen(false)
        setSelectedAppointment(null)
        setCancelReason("")
        await loadAppointments()
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
      const currentDoctor = await getCurrentDoctor();

      if (!currentDoctor) {
        window.location.href = "/doctor/login"
        return
      }

      const [appointmentsData, patientsData, servicesData] = await Promise.all([
        getDoctorAppointments(currentDoctor.id),
        getAllPatients(),
        getAllServices(),
      ])

      setDoctor(currentDoctor)
      setAppointments(appointmentsData)
      setPatients(patientsData)
      setServices(servicesData)

      setDoctor(currentDoctor)
      setAppointments(appointmentsData)
      setPatients(patientsData)
      setServices(servicesData)
    } catch (error) {
      console.error("Error loading data:", error)
      // If there's an auth error, redirect to login
      window.location.href = "/doctor/login"
    } finally {
      setIsLoading(false)
    }
  }

  const loadAppointments = async () => {
    try {
      const appointmentsData = await getDoctorAppointments()
      setAppointments(appointmentsData)
    } catch (error) {
      console.error("Error loading appointments:", error)
    }
  }

  const handleStatusUpdate = async (appointmentId: number, status: string) => {
    const result = await updateAppointmentStatus(appointmentId, status)
    if (result.success) {
      await loadAppointments()
    }
  }

  const handleViewPatient = async (patientId: number) => {
    try {
      const patientDetails = await getPatientDetails(patientId)
      setSelectedPatient(patientDetails)
      setIsPatientSheetOpen(true)
    } catch (error) {
      console.error("Error loading patient details:", error)
    }
  }

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsEditDialogOpen(true)
  }

  const handleCancelAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsCancelDialogOpen(true)
  }

  const handleLogout = async () => {
    await logoutDoctor()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "scheduled":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.service.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || appointment.status.toLowerCase() === statusFilter

    return matchesSearch && matchesStatus
  })

  const upcomingAppointments = appointments.filter((apt) => new Date(apt.datetime) > new Date())
  const todayAppointments = appointments.filter((apt) => {
    const today = new Date()
    const aptDate = new Date(apt.datetime)
    return (
      aptDate.getDate() === today.getDate() &&
      aptDate.getMonth() === today.getMonth() &&
      aptDate.getFullYear() === today.getFullYear()
    )
  })

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading admin dashboard...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!doctor) {
    return null // Will redirect to login
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header with Doctor Info */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={doctor.avatar || "/placeholder.svg"} alt={doctor.firstName + " " + doctor.lastName} />
            <AvatarFallback>
              {(doctor.firstName + " " + doctor.lastName)
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">Welcome, Dr. {doctor.lastName}</h1>
            <p className="text-muted-foreground">
              {doctor.specialization} • {doctor.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Schedule Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Schedule New Appointment</DialogTitle>
                <DialogDescription>Create a new appointment for a patient.</DialogDescription>
              </DialogHeader>

              {!scheduleState.success && scheduleState.message && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{scheduleState.message}</p>
                </div>
              )}

              <form id="schedule-form" action={scheduleAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="patientId">Patient</Label>
                  <Select name="patientId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id.toString()}>
                          {patient.firstName} {patient.lastName} - {patient.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceId">Service</Label>
                  <Select name="serviceId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          {service.name} ({service.duration} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="datetime">Date & Time</Label>
                  <Input
                    id="datetime"
                    name="datetime"
                    type="datetime-local"
                    required
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea id="notes" name="notes" placeholder="Additional notes for the appointment..." rows={3} />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSchedulePending}>
                    {isSchedulePending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Schedule Appointment
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={doctor.avatar || "/placeholder.svg"} alt={doctor.firstName + " " + doctor.lastName} />
            <AvatarFallback>
              {(doctor.firstName + " " + doctor.lastName)
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{doctor.firstName + " " + doctor.lastName}</p>
              <p className="text-xs leading-none text-muted-foreground">{doctor.email}</p>
            </div>
          </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Appointments</p>
                <p className="text-2xl font-bold">{appointments.length}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{todayAppointments.length}</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">{upcomingAppointments.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Patients</p>
                <p className="text-2xl font-bold">{patients.length}</p>
              </div>
              <User className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search patients or services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Appointments</CardTitle>
          <CardDescription>Manage your appointments and patient interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {appointment.patient.firstName} {appointment.patient.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">{appointment.patient.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-muted-foreground" />
                      <span>{appointment.service.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {appointment.service.duration}min
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{format(new Date(appointment.datetime), "MMM dd, yyyy")}</span>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(appointment.datetime), "hh:mm a")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewPatient(appointment.patient.id)}
                        className="h-8 w-8 p-0"
                        title="View Patient"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAppointment(appointment)}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Edit Appointment"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {appointment.status.toLowerCase() !== "cancelled" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelAppointment(appointment)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Cancel Appointment"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredAppointments.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No appointments found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Schedule your first appointment to get started."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Appointment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>
              Update appointment details for {selectedAppointment?.patient.firstName}{" "}
              {selectedAppointment?.patient.lastName}
            </DialogDescription>
          </DialogHeader>

          {!editState.success && editState.message && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{editState.message}</p>
            </div>
          )}

          {selectedAppointment && (
            <form action={editAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select name="status" defaultValue={selectedAppointment.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="No Show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-datetime">Date & Time</Label>
                <Input
                  id="edit-datetime"
                  name="datetime"
                  type="datetime-local"
                  defaultValue={format(new Date(selectedAppointment.datetime), "yyyy-MM-dd'T'HH:mm")}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  name="notes"
                  defaultValue={selectedAppointment.notes || ""}
                  placeholder="Add notes about this appointment..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isEditPending}>
                  {isEditPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Update Appointment
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Appointment Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment with {selectedAppointment?.patient.firstName}{" "}
              {selectedAppointment?.patient.lastName}?
            </DialogDescription>
          </DialogHeader>

          {!cancelState.success && cancelState.message && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{cancelState.message}</p>
            </div>
          )}

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Stethoscope className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedAppointment.service.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(selectedAppointment.datetime), "MMM dd, yyyy 'at' hh:mm a")}</span>
                </div>
              </div>

              <form action={cancelAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cancel-reason">Reason for Cancellation (Optional)</Label>
                  <Textarea
                    id="cancel-reason"
                    name="reason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Provide a reason for cancelling this appointment..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
                    Keep Appointment
                  </Button>
                  <Button type="submit" variant="destructive" disabled={isCancelPending}>
                    {isCancelPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Cancel Appointment
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Patient Details Sheet */}
      <Sheet open={isPatientSheetOpen} onOpenChange={setIsPatientSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Patient Information</SheetTitle>
            <SheetDescription>Detailed information about the patient</SheetDescription>
          </SheetHeader>

          {selectedPatient && (
            <div className="mt-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
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
                          {selectedPatient.medicalInfo.allergies.map((allergy: string, index: number) => (
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
                          {selectedPatient.medicalInfo.conditions.map((condition: string, index: number) => (
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
                          {selectedPatient.medicalInfo.medications.map((medication: string, index: number) => (
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

              {/* Recent Appointments */}
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Recent Appointments
                </h4>
                <div className="space-y-2 pl-6">
                  {selectedPatient.appointments.slice(0, 5).map((apt: any) => (
                    <div key={apt.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{apt.service.name}</p>
                        <p className="text-muted-foreground">{format(new Date(apt.datetime), "MMM dd, yyyy")}</p>
                      </div>
                      <Badge className={getStatusColor(apt.status)} variant="outline">
                        {apt.status}
                      </Badge>
                    </div>
                  ))}
                  {selectedPatient.appointments.length === 0 && (
                    <p className="text-sm text-muted-foreground">No previous appointments</p>
                  )}
                </div>
              </div>

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
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
