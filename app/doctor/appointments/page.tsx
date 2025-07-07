"use client"

import { useState, useEffect, useActionState } from "react"
import { useRouter } from "next/navigation"
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
  Calendar,
  Clock,
  User,
  Search,
  Plus,
  Check,
  X,
  Eye,
  Edit,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Heart,
  AlertTriangle,
  CalendarDays,
  Stethoscope,
} from "lucide-react"
import {
  getDoctorAppointments,
  scheduleNewAppointment,
  updateAppointmentStatus,
  getPatientDetailsForDoctor,
  getAllPatientsForDoctor,
  getAllServicesForDoctor,
  rescheduleAppointment,
} from "@/lib/doctor-appointment-actions"
import { useAuth } from "@/lib/auth-context"
import { format, isToday, isTomorrow, isThisWeek } from "date-fns"

type Appointment = {
  id: number
  datetime: Date
  status: string
  notes: string | null
  patient: {
    id: number
    firstName: string
    lastName: string
    email: string
    dob: Date
    avatar?: string | null
  }
  service: {
    id: number
    name: string
    duration: number
    price: number
  }
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
  stats?: {
    totalAppointments: number
    upcomingAppointments: number
    completedAppointments: number
    memberSince: Date
  } | null
}

type Service = {
  id: number
  name: string
  duration: number
  price: number
}

export default function DoctorAppointmentsPage() {
  const router = useRouter()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("appointments")
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [isPatientDetailsOpen, setIsPatientDetailsOpen] = useState(false)
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false)
  const [sortByPriority, setSortByPriority] = useState(true)

  // Load appointments with priority ordering
  // Renamed to avoid duplicate declaration error
  const loadAppointmentsWithPriority = async () => {
    if (!user) return
    try {
      const response = await fetch("/api/doctor-appointments")
      if (!response.ok) {
        throw new Error("Failed to fetch appointments")
      }
      const appointmentsData = await response.json()
      // Fix missing duration and price in service for type compatibility
      const fixedAppointments = appointmentsData
        .map((apt: any) => ({
          ...apt,
          service: {
            ...apt.service,
            duration: apt.service.duration ?? 0,
            price: apt.service.price ?? 0,
          },
          // Normalize notes null to undefined
          notes: apt.notes === null ? undefined : apt.notes,
        }))
        // Sort by priority ascending, then datetime ascending
        .sort((a: any, b: any) => {
          if (a.priority !== b.priority) return a.priority - b.priority
          return new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
        })
      setAppointments(fixedAppointments)
    } catch (error) {
      console.error("Error loading appointments:", error)
    }
  }

  // Form state for scheduling appointment
  const [scheduleState, scheduleAction, isSchedulePending] = useActionState(
    async (prevState: any, formData: FormData) => {
      if (!user) return { success: false, message: "User not authenticated" }
      const result = await scheduleNewAppointment(user.id, formData)
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

  // Form state for rescheduling appointment
  const [rescheduleState, rescheduleAction, isReschedulePending] = useActionState(
    async (prevState: any, formData: FormData) => {
      if (!user || !selectedAppointment) return prevState
      const result = await rescheduleAppointment(user.id, selectedAppointment.id, formData)
      if (result.success) {
        setIsRescheduleDialogOpen(false)
        setSelectedAppointment(null)
        await loadAppointments()
      }
      return result
    },
    { success: false, message: "" },
  )

  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && (!user || !user.specialization)) {
      router.push("/doctor/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && !loading) {
      loadData()
    }
  }, [user, loading])

  const loadData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([loadAppointmentsWithPriority(), loadPatients(), loadServices()])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAppointments = async () => {
    if (!user) return
    try {
      const response = await fetch("/api/doctor-appointments")
      if (!response.ok) {
        throw new Error("Failed to fetch appointments")
      }
      const appointmentsData = await response.json()
      // Fix missing duration and price in service for type compatibility
      const fixedAppointments = appointmentsData.map((apt: any) => ({
        ...apt,
        service: {
          ...apt.service,
          duration: apt.service.duration ?? 0,
          price: apt.service.price ?? 0,
        },
      }))
      setAppointments(fixedAppointments)
    } catch (error) {
      console.error("Error loading appointments:", error)
    }
  }

  const loadPatients = async () => {
    if (!user) return
    try {
      const patientsData = await getAllPatientsForDoctor(user.id)
      setPatients(patientsData)
    } catch (error) {
      console.error("Error loading patients:", error)
    }
  }

  const loadServices = async () => {
    if (!user) return
    try {
      const servicesData = await getAllServicesForDoctor(user.id)
      // Fix missing price in services for type compatibility
      const fixedServices = servicesData.map((service: any) => ({
        ...service,
        price: service.price ?? 0,
      }))
      setServices(fixedServices)
    } catch (error) {
      console.error("Error loading services:", error)
    }
  }

  const handleViewPatient = async (patientId: number) => {
    if (!user) return
    try {
      const patientDetails = await getPatientDetailsForDoctor(user.id, patientId)
      setSelectedPatient(patientDetails)
      setIsPatientDetailsOpen(true)
    } catch (error) {
      console.error("Error loading patient details:", error)
    }
  }

  const handleApproveAppointment = async (appointmentId: number) => {
    if (!user) return
    try {
      const result = await updateAppointmentStatus(user.id, appointmentId, "Confirmed")
      if (result.success) {
        await loadAppointments()
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error("Error approving appointment:", error)
    }
  }

  const handleCancelAppointment = async (appointmentId: number) => {
    if (!user) return
    if (confirm("Are you sure you want to cancel this appointment?")) {
      try {
        const result = await updateAppointmentStatus(user.id, appointmentId, "Cancelled")
        if (result.success) {
          await loadAppointments()
        } else {
          alert(result.message)
        }
      } catch (error) {
        console.error("Error cancelling appointment:", error)
      }
    }
  }

  const handleCompleteAppointment = async (appointmentId: number) => {
    if (!user) return
    try {
      const result = await updateAppointmentStatus(user.id, appointmentId, "Completed")
      if (result.success) {
        await loadAppointments()
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error("Error completing appointment:", error)
    }
  }

  const handleRescheduleAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsRescheduleDialogOpen(true)
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

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today"
    if (isTomorrow(date)) return "Tomorrow"
    if (isThisWeek(date)) return format(date, "EEEE")
    return format(date, "MMM dd")
  }

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.service.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || appointment.status.toLowerCase() === statusFilter.toLowerCase()

    const matchesDate = (() => {
      if (dateFilter === "all") return true
      const appointmentDate = new Date(appointment.datetime)
      switch (dateFilter) {
        case "today":
          return isToday(appointmentDate)
        case "tomorrow":
          return isTomorrow(appointmentDate)
        case "week":
          return isThisWeek(appointmentDate)
        default:
          return true
      }
    })()

    return matchesSearch && matchesStatus && matchesDate
  })

  const upcomingAppointments = appointments.filter(
    (apt) => new Date(apt.datetime) > new Date() && apt.status !== "Cancelled",
  )
  const todayAppointments = appointments.filter((apt) => isToday(new Date(apt.datetime)))
  const pendingAppointments = appointments.filter((apt) => apt.status === "Pending")

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading appointments...</span>
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
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Stethoscope className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">My Appointments</h1>
            <p className="text-muted-foreground">Manage your patient appointments</p>
          </div>
        </div>

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
              <DialogDescription>Book an appointment for a patient.</DialogDescription>
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
                    <SelectValue placeholder="Select patient" />
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
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.name} - {service.duration} min{service.price !== undefined ? ` - £${service.price}` : ""}
                  </SelectItem>
                ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" name="date" type="date" required min={new Date().toISOString().split("T")[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input id="time" name="time" type="time" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea id="notes" name="notes" placeholder="Any special notes for this appointment..." rows={3} />
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Appointments</p>
                <p className="text-2xl font-bold">{todayAppointments.length}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-blue-600" />
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
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold">{pendingAppointments.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
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
              <User className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search appointments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="tomorrow">Tomorrow</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appointments Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Appointments</CardTitle>
              <CardDescription>Manage your patient appointments</CardDescription>
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
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={appointment.patient.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {appointment.patient.firstName[0]}
                              {appointment.patient.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {appointment.patient.firstName} {appointment.patient.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Age {new Date().getFullYear() - new Date(appointment.patient.dob).getFullYear()}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{appointment.service.name}</p>
                          <p className="text-sm text-muted-foreground">{appointment.service.duration} minutes</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{getDateLabel(new Date(appointment.datetime))}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(appointment.datetime), "h:mm a")}
                          </p>
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
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {appointment.status === "Pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApproveAppointment(appointment.id)}
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelAppointment(appointment.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {appointment.status === "Confirmed" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRescheduleAppointment(appointment)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCompleteAppointment(appointment.id)}
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelAppointment(appointment.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
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
          {/* Patients List */}
          <Card>
            <CardHeader>
              <CardTitle>My Patients</CardTitle>
              <CardDescription>Patients who have appointments with you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {patients.map((patient) => (
                  <Card key={patient.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-12 w-12">
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
                          <p className="text-sm text-muted-foreground">
                            Age {new Date().getFullYear() - new Date(patient.dob).getFullYear()}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {patient.email}
                        </div>
                        {patient.stats && (
                          <div className="flex justify-between text-sm">
                            <span>Total Appointments:</span>
                            <span className="font-medium">{patient.stats.totalAppointments}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPatient(patient.id)}
                        className="w-full mt-3"
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reschedule Dialog */}
      <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Change the date and time for{" "}
              {selectedAppointment &&
                `${selectedAppointment.patient.firstName} ${selectedAppointment.patient.lastName}`}
            </DialogDescription>
          </DialogHeader>

          {!rescheduleState.success && rescheduleState.message && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{rescheduleState.message}</p>
            </div>
          )}

          {selectedAppointment && (
            <form action={rescheduleAction} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reschedule-date">New Date</Label>
                  <Input
                    id="reschedule-date"
                    name="date"
                    type="date"
                    required
                    defaultValue={format(new Date(selectedAppointment.datetime), "yyyy-MM-dd")}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reschedule-time">New Time</Label>
                  <Input
                    id="reschedule-time"
                    name="time"
                    type="time"
                    required
                    defaultValue={format(new Date(selectedAppointment.datetime), "HH:mm")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reschedule-reason">Reason for Rescheduling</Label>
                <Textarea
                  id="reschedule-reason"
                  name="reason"
                  placeholder="Optional reason for rescheduling..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsRescheduleDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isReschedulePending}>
                  {isReschedulePending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Reschedule
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
            <SheetDescription>Complete patient information and medical history</SheetDescription>
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
                    <h4 className="font-semibold mb-2">Patient Notes</h4>
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

              {/* Appointment History */}
              <div className="space-y-2">
                <h4 className="font-semibold">Appointment History</h4>
                <div className="space-y-2 pl-6">
                  {appointments
                    .filter((apt) => apt.patient.id === selectedPatient.id)
                    .slice(0, 5)
                    .map((appointment) => (
                      <div key={appointment.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium">{appointment.service.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(appointment.datetime), "MMM dd, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                        <Badge className={getStatusColor(appointment.status)} variant="outline">
                          {appointment.status}
                        </Badge>
                      </div>
                    ))}
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
                  <div className="text-center text-sm text-muted-foreground">
                    Patient since {format(new Date(selectedPatient.stats.memberSince), "MMMM yyyy")}
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
