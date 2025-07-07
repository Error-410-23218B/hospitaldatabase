"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Plus,
  X,
  GripVertical,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  CalendarDays,
  UserCheck,
  Activity,
  AlertCircle,
  CheckCircle,
  Loader2,
  Check,
  XCircle,
} from "lucide-react"
import { format, addDays } from "date-fns"
import {
  getPatientAppointments,
  bookAppointment,
  cancelAppointment,
  getDoctorsWithAvailability,
  getAvailableTimeSlots,
  getServicesForDoctor,
} from "@/lib/patient-appointment-actions"

// Types
interface Appointment {
  id: number
  doctor: {
    id: number
    firstName: string
    lastName: string
    specialization: string
  }
  service: {
    id: number
    name: string
    description: string
  }
  datetime: Date
  status: string
  priority: number
  notes?: string
}

interface Doctor {
  id: number
  firstName: string
  lastName: string
  specialization: string
  availability?: {
    mondayStart: string
    mondayEnd: string
    tuesdayStart: string
    tuesdayEnd: string
    wednesdayStart: string
    wednesdayEnd: string
    thursdayStart: string
    thursdayEnd: string
    fridayStart: string
    fridayEnd: string
    saturdayStart: string
    saturdayEnd: string
    sundayStart: string
    sundayEnd: string
    consultationDuration: number
    breakDuration: number
  }
}

interface Service {
  id: number
  name: string
  description: string
}

interface TimeSlot {
  time: string
  available: boolean
  reason?: string
  isBooked?: boolean
}

type SortOption = "priority" | "date" | "doctor" | "service"

export default function AppointmentsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState("")
  const [selectedService, setSelectedService] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isBooking, setIsBooking] = useState(false)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [bookingError, setBookingError] = useState("")
  const [bookingSuccess, setBookingSuccess] = useState("")
  const [draggedItem, setDraggedItem] = useState<number | null>(null)
  const [dragOverItem, setDragOverItem] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>("priority")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const dragCounter = useRef(0)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (user.specialization) {
        router.push("/doctor/appointments")
      }
    }
  }, [loading, user])

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadAvailableTimeSlots()
    } else {
      setAvailableTimeSlots([])
      setSelectedTime("")
    }
  }, [selectedDoctor, selectedDate, selectedService])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      const [doctorsData, appointmentsResponse] = await Promise.all([
        getDoctorsWithAvailability(),
        fetch('/api/appointments').then(res => res.json()),
      ])
      if (appointmentsResponse.error) {
        console.error("Error fetching appointments:", appointmentsResponse.error)
        setAppointments([])
      } else {
        // Map notes null to undefined to satisfy type
        const mappedAppointments = appointmentsResponse.appointments.map((apt: any) => ({
          ...apt,
          notes: apt.notes === null ? undefined : apt.notes,
          datetime: new Date(apt.datetime),
        }))
        setAppointments(mappedAppointments)
      }
      // Map doctors to ensure availability is undefined instead of null
      const mappedDoctors = doctorsData.map((doctor: any) => ({
        ...doctor,
        availability: doctor.availability === null ? undefined : doctor.availability,
      }))
      setDoctors(mappedDoctors)
    } catch (error) {
      console.error("Error loading initial data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadServicesForDoctor = async (doctorId: string) => {
    try {
      const servicesData = await getServicesForDoctor(Number.parseInt(doctorId))
      setServices(servicesData)
    } catch (error) {
      console.error("Error loading services:", error)
      setServices([])
    }
  }

  const loadAvailableTimeSlots = async () => {
    if (!selectedDoctor || !selectedDate) return

    try {
      setIsLoadingSlots(true)
      const slots = await getAvailableTimeSlots(Number.parseInt(selectedDoctor), selectedDate)
      setAvailableTimeSlots(slots)
    } catch (error) {
      console.error("Error loading time slots:", error)
      setAvailableTimeSlots([])
    } finally {
      setIsLoadingSlots(false)
    }
  }

  const handleDoctorChange = (doctorId: string) => {
    setSelectedDoctor(doctorId)
    setSelectedService("")
    setSelectedTime("")
    setServices([])
    if (doctorId) {
      loadServicesForDoctor(doctorId)
    }
  }

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedService || !selectedDate || !selectedTime) {
      setBookingError("Please fill in all fields")
      return
    }

    try {
      setIsBooking(true)
      setBookingError("")
      setBookingSuccess("")

      const response = await fetch('/api/book-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          doctorId: Number.parseInt(selectedDoctor),
          serviceId: Number.parseInt(selectedService),
          date: selectedDate,
          time: selectedTime,
        }),
      })
      const result = await response.json()

      if (result.message) {
        setBookingSuccess("Appointment booked successfully!")
        // Reset form
        setSelectedDoctor("")
        setSelectedService("")
        setSelectedDate("")
        setSelectedTime("")
        setServices([])
        setAvailableTimeSlots([])
        // Reload appointments
        const updatedAppointmentsResponse = await fetch('/api/appointments')
        const updatedAppointmentsData = await updatedAppointmentsResponse.json()
        if (updatedAppointmentsData.error) {
          console.error("Error fetching appointments:", updatedAppointmentsData.error)
          setAppointments([])
        } else {
          const mappedAppointments = updatedAppointmentsData.appointments.map((apt: any) => ({
            ...apt,
            notes: apt.notes === null ? undefined : apt.notes,
            datetime: new Date(apt.datetime),
          }))
          setAppointments(mappedAppointments)
        }
        // Close dialog after a short delay
        setTimeout(() => {
          setIsDialogOpen(false)
          setBookingSuccess("")
        }, 2000)
      } else {
        setBookingError(result.error || "Failed to book appointment")
      }
    } catch (error) {
      console.error("Error booking appointment:", error)
      setBookingError("An unexpected error occurred")
    } finally {
      setIsBooking(false)
    }
  }

  const handleCancelAppointment = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return

    try {
      const result = await cancelAppointment(id)
      if (result.success) {
        const updatedAppointments = await getPatientAppointments()
        setAppointments(updatedAppointments)
      } else {
        alert(result.message || "Failed to cancel appointment")
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error)
      alert("An unexpected error occurred")
    }
  }

  const handleDragStart = (e: React.DragEvent, id: number) => {
    if (sortBy !== "priority") return
    setDraggedItem(id)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/html", "")
    dragCounter.current = 0
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverItem(null)
    dragCounter.current = 0
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (sortBy !== "priority") return
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDragEnter = (e: React.DragEvent, id: number) => {
    if (sortBy !== "priority") return
    e.preventDefault()
    dragCounter.current++
    setDragOverItem(id)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (sortBy !== "priority") return
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setDragOverItem(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, targetId: number) => {
    if (sortBy !== "priority") return
    e.preventDefault()

    if (draggedItem === null || draggedItem === targetId) {
      setDraggedItem(null)
      setDragOverItem(null)
      return
    }

    const draggedIndex = appointments.findIndex((apt) => apt.id === draggedItem)
    const targetIndex = appointments.findIndex((apt) => apt.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newAppointments = [...appointments]
    const draggedAppointment = newAppointments[draggedIndex]

    newAppointments.splice(draggedIndex, 1)
    newAppointments.splice(targetIndex, 0, draggedAppointment)

    const updatedAppointments = newAppointments.map((apt, index) => ({
      ...apt,
      priority: index + 1,
    }))

    setAppointments(updatedAppointments)
    setDraggedItem(null)
    setDragOverItem(null)
    dragCounter.current = 0

    // Persist priority changes to backend
    try {
      const response = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          updatedAppointments.map(({ id, priority }) => ({ id, priority }))
        ),
      })
      if (!response.ok) {
        console.error('Failed to update appointment priorities')
      }
    } catch (error) {
      console.error('Error updating appointment priorities:', error)
    }
  }

  const movePriority = async (id: number, direction: "up" | "down") => {
    if (sortBy !== "priority") return

    const currentIndex = appointments.findIndex((apt) => apt.id === id)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= appointments.length) return

    const newAppointments = [...appointments]
    const [movedItem] = newAppointments.splice(currentIndex, 1)
    newAppointments.splice(newIndex, 0, movedItem)

    const updatedAppointments = newAppointments.map((apt, index) => ({
      ...apt,
      priority: index + 1,
    }))

    setAppointments(updatedAppointments)

    // Persist priority changes to backend
    try {
      const response = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          updatedAppointments.map(({ id, priority }) => ({ id, priority }))
        ),
      })
      if (!response.ok) {
        console.error('Failed to update appointment priorities')
      }
    } catch (error) {
      console.error('Error updating appointment priorities:', error)
    }
  }

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(option)
      setSortDirection("asc")
    }
  }

  const getSortedAppointments = () => {
    const sorted = [...appointments].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "priority":
          comparison = a.priority - b.priority
          break
        case "date":
          comparison = a.datetime.getTime() - b.datetime.getTime()
          break
        case "doctor":
          comparison = `${a.doctor.firstName} ${a.doctor.lastName}`.localeCompare(
            `${b.doctor.firstName} ${b.doctor.lastName}`,
          )
          break
        case "service":
          comparison = a.service.name.localeCompare(b.service.name)
          break
        default:
          comparison = a.priority - b.priority
      }

      return sortDirection === "desc" ? -comparison : comparison
    })

    return sorted
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

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return "bg-red-100 text-red-800 border-red-200"
    if (priority === 2) return "bg-orange-100 text-orange-800 border-orange-200"
    if (priority === 3) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-blue-100 text-blue-800 border-blue-200"
  }

  const getSortIcon = (option: SortOption) => {
    if (sortBy !== option) return <ArrowUpDown className="h-4 w-4" />
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
  }

  const getSortLabel = () => {
    const labels = {
      priority: "Priority",
      date: "Date",
      doctor: "Doctor",
      service: "Service",
    }
    return labels[sortBy]
  }

  const isDoctorAvailableOnDate = (doctor: Doctor, date: string) => {
    if (!doctor.availability) return false

    const selectedDate = new Date(date)
    const dayOfWeek = selectedDate.getDay() // 0 = Sunday, 1 = Monday, etc.

    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const dayName = dayNames[dayOfWeek]

    const startKey = `${dayName}Start` as keyof typeof doctor.availability
    const endKey = `${dayName}End` as keyof typeof doctor.availability

    const startTime = doctor.availability[startKey] as string
    const endTime = doctor.availability[endKey] as string

    return startTime !== "00:00" || endTime !== "00:00"
  }

  const getMinDate = () => {
    const tomorrow = addDays(new Date(), 1)
    return format(tomorrow, "yyyy-MM-dd")
  }

  const getTimeSlotIcon = (slot: TimeSlot) => {
    if (slot.available) {
      return <Check className="h-4 w-4 text-green-600" />
    } else if (slot.isBooked) {
      return <XCircle className="h-4 w-4 text-red-600" />
    } else {
      return <X className="h-4 w-4 text-gray-400" />
    }
  }

  const getTimeSlotColor = (slot: TimeSlot) => {
    if (slot.available) {
      return "text-green-700 bg-green-50 border-green-200 hover:bg-green-100"
    } else if (slot.isBooked) {
      return "text-red-700 bg-red-50 border-red-200"
    } else {
      return "text-gray-500 bg-gray-50 border-gray-200"
    }
  }

  const sortedAppointments = getSortedAppointments()
  const isDragEnabled = sortBy === "priority"

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
      <div className="flex justify-between items-center mb-8 animate-in slide-in-from-top-4 fade-in-0 duration-700">
        <div>
          <h1 className="text-3xl font-bold">My Appointments</h1>
          <p className="text-muted-foreground mt-2 animate-in slide-in-from-left-4 fade-in-0 duration-700 delay-200">
            Manage your upcoming appointments •{" "}
            {isDragEnabled ? "Drag to reorder by priority" : `Sorted by ${getSortLabel().toLowerCase()}`}
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 animate-in slide-in-from-right-4 fade-in-0 duration-700 delay-300 hover:scale-105 transition-transform">
              <Plus className="h-4 w-4" />
              Book New Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl animate-in zoom-in-95 fade-in-0 duration-300">
            <DialogHeader>
              <DialogTitle>Book New Appointment</DialogTitle>
              <DialogDescription>Select your preferred doctor, service, and available time slot.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {bookingError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{bookingError}</AlertDescription>
                </Alert>
              )}

              {bookingSuccess && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">{bookingSuccess}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="doctor">Doctor</Label>
                  <Select value={selectedDoctor} onValueChange={handleDoctorChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id.toString()}>
                          <div className="flex flex-col">
                            <span>
                              {doctor.firstName} {doctor.lastName}
                            </span>
                            <span className="text-sm text-muted-foreground">{doctor.specialization}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service">Service</Label>
                  <Select value={selectedService} onValueChange={setSelectedService} disabled={!selectedDoctor}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedDoctor ? "Select a service" : "Select a doctor first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          <div className="flex flex-col">
                            <span>{service.name}</span>
                            <span className="text-sm text-muted-foreground">{service.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getMinDate()}
                  disabled={!selectedDoctor}
                />
                {selectedDoctor && selectedDate && (
                  <div className="text-sm">
                    {isDoctorAvailableOnDate(doctors.find((d) => d.id.toString() === selectedDoctor)!, selectedDate) ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <Check className="h-4 w-4" />
                        Doctor is available on this date
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        Doctor is not available on this date
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Available Time Slots</Label>
                {isLoadingSlots ? (
                  <div className="flex items-center gap-2 p-3 border rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading available times...</span>
                  </div>
                ) : availableTimeSlots.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md bg-gray-50">
                      {availableTimeSlots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.available ? slot.time : "")}
                          className={`flex items-center gap-2 p-2 rounded-md border text-sm transition-all duration-200 ${
                            selectedTime === slot.time
                              ? "ring-2 ring-blue-500 bg-blue-100 border-blue-300"
                              : getTimeSlotColor(slot)
                          } ${
                            slot.available
                              ? "cursor-pointer hover:scale-105 active:scale-95"
                              : "cursor-not-allowed opacity-60"
                          }`}
                        >
                          {getTimeSlotIcon(slot)}
                          <span className="font-medium">{slot.time}</span>
                        </button>
                      ))}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-600" />
                        <span>Available</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-red-600" />
                        <span>Booked</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <X className="h-3 w-3 text-gray-400" />
                        <span>Unavailable</span>
                      </div>
                    </div>

                    {selectedTime && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center gap-2 text-blue-700">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">Selected: {selectedTime}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : selectedDoctor && selectedDate ? (
                  <div className="p-3 border rounded-md text-sm text-muted-foreground">
                    {isDoctorAvailableOnDate(doctors.find((d) => d.id.toString() === selectedDoctor)!, selectedDate)
                      ? "No available time slots for this date"
                      : "Doctor is not available on this date"}
                  </div>
                ) : (
                  <div className="p-3 border rounded-md text-sm text-muted-foreground">
                    Select a doctor and date to see available times
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isBooking}>
                Cancel
              </Button>
              <Button
                onClick={handleBookAppointment}
                disabled={
                  !selectedDoctor ||
                  !selectedService ||
                  !selectedDate ||
                  !selectedTime ||
                  isBooking ||
                  !availableTimeSlots.find((slot) => slot.time === selectedTime)?.available
                }
                className="hover:scale-105 transition-transform duration-200"
              >
                {isBooking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Booking...
                  </>
                ) : (
                  "Book Appointment"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {sortedAppointments.length === 0 ? (
          <Card className="animate-in fade-in-50 duration-500">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
              <h3 className="text-lg font-semibold mb-2">No appointments scheduled</h3>
              <p className="text-muted-foreground text-center mb-4">
                You don't have any appointments yet. Book your first appointment to get started.
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="animate-in slide-in-from-bottom-4 duration-700 delay-300"
              >
                Book Your First Appointment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Appointments by {getSortLabel()}
                {sortDirection === "desc" && " (Descending)"}
              </h2>
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="animate-pulse">
                  {sortedAppointments.length} appointment{sortedAppointments.length !== 1 ? "s" : ""}
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                      {getSortIcon(sortBy)}
                      Sort by {getSortLabel()}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => handleSort("priority")} className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4" />
                      Priority
                      {sortBy === "priority" && getSortIcon("priority")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort("date")} className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Date
                      {sortBy === "date" && getSortIcon("date")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort("doctor")} className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Doctor Name
                      {sortBy === "doctor" && getSortIcon("doctor")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort("service")} className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Service
                      {sortBy === "service" && getSortIcon("service")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {isDragEnabled && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <GripVertical className="h-4 w-4" />
                    Drag to reorder
                  </div>
                )}
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
              {sortedAppointments.map((appointment, index) => (
                <Card
                  key={appointment.id}
                  draggable={isDragEnabled}
                  onDragStart={(e) => handleDragStart(e, appointment.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, appointment.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, appointment.id)}
                  className={`group hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 animate-in slide-in-from-left-5 fade-in-0 select-none ${
                    isDragEnabled ? "cursor-move" : "cursor-default"
                  } ${draggedItem === appointment.id ? "opacity-50 scale-105 shadow-2xl rotate-2" : ""} ${
                    dragOverItem === appointment.id && draggedItem !== appointment.id
                      ? "border-2 border-primary border-dashed bg-primary/5"
                      : ""
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-2 pt-1">
                          {isDragEnabled && (
                            <GripVertical className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors cursor-grab active:cursor-grabbing" />
                          )}
                          {sortBy === "priority" && (
                            <Badge className={`text-xs px-2 py-1 ${getPriorityColor(appointment.priority)}`}>
                              #{appointment.priority}
                            </Badge>
                          )}
                          {sortBy === "date" && (
                            <Badge variant="outline" className="text-xs px-2 py-1">
                              {format(appointment.datetime, "MMM dd")}
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2 text-lg group-hover:text-primary transition-colors duration-200">
                            <User className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                            {appointment.doctor.firstName} {appointment.doctor.lastName}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1">
                            <Stethoscope className="h-4 w-4" />
                            {appointment.doctor.specialization}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isDragEnabled && (
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => movePriority(appointment.id, "up")}
                              disabled={appointment.priority === 1}
                              className="h-6 w-6 p-0 hover:bg-blue-50"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => movePriority(appointment.id, "down")}
                              disabled={appointment.priority === appointments.length}
                              className="h-6 w-6 p-0 hover:bg-blue-50"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        <Badge
                          className={`${getStatusColor(appointment.status)} animate-in zoom-in-50 duration-300`}
                          style={{ animationDelay: `${index * 100 + 200}ms` }}
                        >
                          {appointment.status}
                        </Badge>
                        {appointment.status !== "Completed" && appointment.status !== "Cancelled" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelAppointment(appointment.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2 group-hover:text-primary transition-colors duration-200">
                        <Stethoscope className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                        <span className="font-medium">{appointment.service.name}</span>
                      </div>
                      <div className="flex items-center gap-2 group-hover:text-primary transition-colors duration-200">
                        <Calendar className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                        <span>{format(appointment.datetime, "MMM dd, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2 group-hover:text-primary transition-colors duration-200">
                        <Clock className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                        <span>{format(appointment.datetime, "hh:mm a")}</span>
                      </div>
                    </div>
                    {appointment.notes && (
                      <div className="mt-3 p-2 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-600">{appointment.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}