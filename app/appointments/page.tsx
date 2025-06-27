'use client';

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Edit3,
} from "lucide-react";
import { format } from "date-fns";

interface Appointment {
  id: number;
  doctor: string;
  service: string;
  datetime: string;
  status: string;
  specialty: string;
  priority: number;
}

type SortOption = "priority" | "date" | "doctor" | "service";

export default function AppointmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number } | null>(null);
  const [doctors, setDoctors] = useState<{ id: number; name: string; specialization: string }[]>([]);
  const [services, setServices] = useState<{ id: number; name: string }[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("priority");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const dragCounter = useRef(0);

  // New state for edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editAppointmentId, setEditAppointmentId] = useState<number | null>(null);
  const [editSelectedDoctor, setEditSelectedDoctor] = useState("");
  const [editSelectedService, setEditSelectedService] = useState("");
  const [editSelectedDate, setEditSelectedDate] = useState("");
  const [editSelectedTime, setEditSelectedTime] = useState("");
  const [editSelectedStatus, setEditSelectedStatus] = useState("");

  // Function to open edit dialog and prefill data
  const openEditDialog = (appointment: Appointment) => {
    setEditAppointmentId(appointment.id);
    // Find doctor id by name
    const doctor = doctors.find(d => d.name === appointment.doctor);
    setEditSelectedDoctor(doctor ? doctor.id.toString() : "");
    // Find service id by name
    const service = services.find(s => s.name === appointment.service);
    setEditSelectedService(service ? service.id.toString() : "");
    // Set date and time from datetime string
    const dt = new Date(appointment.datetime);
    setEditSelectedDate(dt.toISOString().split("T")[0]);
    setEditSelectedTime(dt.toTimeString().slice(0,5));
    setEditSelectedStatus(appointment.status);
    setIsEditDialogOpen(true);
  };

  useEffect(() => {
    async function checkUser() {
      try {
        const meRes = await fetch('/api/me', { cache: 'no-store', credentials: 'include' });
        if (!meRes.ok) throw new Error('Not logged in');
        const meData = await meRes.json();
        if (!meData.user?.id) throw new Error('Not logged in');
        setUser({ id: meData.user.id });
      } catch (error) {
        router.push('/login');
      }
    }
    checkUser();
  }, [router]);

  useEffect(() => {
    async function fetchDoctorsAndServices() {
      try {
        const doctorsRes = await fetch('/api/doctors', { cache: 'no-store' });
        if (!doctorsRes.ok) throw new Error('Failed to fetch doctors');
        const doctorsData = await doctorsRes.json();
        setDoctors(doctorsData);

        const servicesRes = await fetch('/api/services', { cache: 'no-store' });
        if (!servicesRes.ok) throw new Error('Failed to fetch services');
        const servicesData = await servicesRes.json();
        setServices(servicesData);
      } catch (error) {
        console.error('Error fetching doctors or services:', error);
      }
    }
    fetchDoctorsAndServices();
  }, []);

  // Fetch appointments from backend API
  useEffect(() => {
    async function fetchAppointments() {
      if (!user) return;
      setIsLoadingAppointments(true);
      try {
        const res = await fetch(`/api/appointments?patientId=${user.id}`, { cache: 'no-store', credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch appointments');
        const data = await res.json();

        // Map backend appointments to local state format
        const mappedAppointments = data.appointments.map((apt: any, index: number) => ({
          id: apt.id,
          doctor: apt.doctor.name,
          service: apt.service.name,
          datetime: apt.datetime,
          status: apt.status.toLowerCase(),
          specialty: apt.doctor.specialization,
          priority: index + 1,
        }));

        setAppointments(mappedAppointments);
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setIsLoadingAppointments(false);
      }
    }
    fetchAppointments();
  }, [user]);

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedService || !selectedDate || !selectedTime) {
      alert("Please fill in all fields");
      return;
    }

    try {
      if (!user) throw new Error('User not logged in');

      const datetime = new Date(`${selectedDate}T${selectedTime}`);

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: user.id,
          doctorId: Number(selectedDoctor),
          serviceId: Number(selectedService),
          datetime,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to book appointment');
        console.log(errorData.error);
        return;
      }

      // Refresh appointments list
      setIsDialogOpen(false);
      setSelectedDoctor("");
      setSelectedService("");
      setSelectedDate("");
      setSelectedTime("");
      // Refetch appointments
      const updatedRes = await fetch(`/api/appointments?patientId=${user.id}`, { cache: 'no-store', credentials: 'include' });
      const updatedData = await updatedRes.json();
      const mappedAppointments = updatedData.appointments.map((apt: any, index: number) => ({
        id: apt.id,
        doctor: apt.doctor.name,
        service: apt.service.name,
        datetime: apt.datetime,
        status: apt.status.toLowerCase(),
        specialty: apt.doctor.specialty,
        priority: index + 1,
      }));
      setAppointments(mappedAppointments);
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Failed to book appointment');
    }
  };

  const handleUpdateAppointment = async () => {
    if (!editAppointmentId || !editSelectedDoctor || !editSelectedService || !editSelectedDate || !editSelectedTime || !editSelectedStatus) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const datetime = new Date(`${editSelectedDate}T${editSelectedTime}`);

      const res = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: editAppointmentId,
          doctorId: Number(editSelectedDoctor),
          serviceId: Number(editSelectedService),
          datetime,
          status: editSelectedStatus,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to update appointment');
        console.log(errorData.error);
        return;
      }

      // Refresh appointments list
      if (!user) throw new Error('User not logged in');
      const updatedRes = await fetch(`/api/appointments?patientId=${user.id}`, { cache: 'no-store', credentials: 'include' });
      const updatedData = await updatedRes.json();
      const mappedAppointments = updatedData.appointments.map((apt: any, index: number) => ({
        id: apt.id,
        doctor: apt.doctor.name,
        service: apt.service.name,
        datetime: apt.datetime,
        status: apt.status.toLowerCase(),
        specialty: apt.doctor.specialization,
        priority: index + 1,
      }));
      setAppointments(mappedAppointments);

      setIsEditDialogOpen(false);
      setEditAppointmentId(null);
      setEditSelectedDoctor("");
      setEditSelectedService("");
      setEditSelectedDate("");
      setEditSelectedTime("");
      setEditSelectedStatus("");
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment');
    }
  };

  const handleCancelAppointment = (id: number) => {
    // TODO: Implement cancel appointment API call
    alert('Cancel appointment functionality not implemented yet.');
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    if (sortBy !== "priority") return; // Only allow drag when sorted by priority
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", "");
    dragCounter.current = 0;
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
    dragCounter.current = 0;
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (sortBy !== "priority") return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent, id: number) => {
    if (sortBy !== "priority") return;
    e.preventDefault();
    dragCounter.current++;
    setDragOverItem(id);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (sortBy !== "priority") return;
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverItem(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: number) => {
    if (sortBy !== "priority") return;
    e.preventDefault();

    if (draggedItem === null || draggedItem === targetId) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const draggedIndex = appointments.findIndex((apt) => apt.id === draggedItem);
    const targetIndex = appointments.findIndex((apt) => apt.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newAppointments = [...appointments];
    const draggedAppointment = newAppointments[draggedIndex];

    // Remove dragged item
    newAppointments.splice(draggedIndex, 1);

    // Insert at new position
    newAppointments.splice(targetIndex, 0, draggedAppointment);

    // Update priorities
    const updatedAppointments = newAppointments.map((apt, index) => ({
      ...apt,
      priority: index + 1,
    }));

    setAppointments(updatedAppointments);
    setDraggedItem(null);
    setDragOverItem(null);
    dragCounter.current = 0;
  };

  const movePriority = (id: number, direction: "up" | "down") => {
    if (sortBy !== "priority") return;

    const currentIndex = appointments.findIndex((apt) => apt.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= appointments.length) return;

    const newAppointments = [...appointments];
    const [movedItem] = newAppointments.splice(currentIndex, 1);
    newAppointments.splice(newIndex, 0, movedItem);

    // Update priorities
    const updatedAppointments = newAppointments.map((apt, index) => ({
      ...apt,
      priority: index + 1,
    }));

    setAppointments(updatedAppointments);
  };

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(option);
      setSortDirection("asc");
    }
  };

  const getSortedAppointments = () => {
    const sorted = [...appointments].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "priority":
          comparison = a.priority - b.priority;
          break;
        case "date":
          comparison = new Date(a.datetime).getTime() - new Date(b.datetime).getTime();
          break;
        case "doctor":
          comparison = a.doctor.localeCompare(b.doctor);
          break;
        case "service":
          comparison = a.service.localeCompare(b.service);
          break;
        default:
          comparison = a.priority - b.priority;
      }

      return sortDirection === "desc" ? -comparison : comparison;
    });

    return sorted;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return "bg-red-100 text-red-800 border-red-200";
    if (priority === 2) return "bg-orange-100 text-orange-800 border-orange-200";
    if (priority === 3) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  const getSortIcon = (option: SortOption) => {
    if (sortBy !== option) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const getSortLabel = () => {
    const labels = {
      priority: "Priority",
      date: "Date",
      doctor: "Doctor",
      service: "Service",
    };
    return labels[sortBy];
  };

  const sortedAppointments = getSortedAppointments();
  const isDragEnabled = sortBy === "priority";

  if (isLoadingAppointments) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 animate-spin" />
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
        <DialogContent className="sm:max-w-md animate-in zoom-in-95 fade-in-0 duration-300">
          <DialogHeader>
            <DialogTitle>Book New Appointment</DialogTitle>
            <DialogDescription>Select your preferred doctor, service, and time slot.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="doctor">Doctor</Label>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id.toString()}>
                      <div className="flex flex-col">
                        <span>{doctor.name}</span>
                        <span className="text-sm text-muted-foreground">{doctor.specialization}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      <div className="flex justify-between w-full">
                        <span>{service.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 18 }, (_, i) => {
                      const hour = Math.floor(i / 2) + 9;
                      const minute = i % 2 === 0 ? "00" : "30";
                      const time = `${hour.toString().padStart(2, "0")}:${minute}`;
                      return (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBookAppointment} className="hover:scale-105 transition-transform duration-200">
              Book Appointment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md animate-in zoom-in-95 fade-in-0 duration-300">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>Update your appointment details below.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-doctor">Doctor</Label>
              <Select value={editSelectedDoctor} onValueChange={setEditSelectedDoctor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id.toString()}>
                      <div className="flex flex-col">
                        <span>{doctor.name}</span>
                        <span className="text-sm text-muted-foreground">{doctor.specialization}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-service">Service</Label>
              <Select value={editSelectedService} onValueChange={setEditSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      <div className="flex justify-between w-full">
                        <span>{service.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editSelectedDate}
                  onChange={(e) => setEditSelectedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-time">Time</Label>
                <Select value={editSelectedTime} onValueChange={setEditSelectedTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 18 }, (_, i) => {
                      const hour = Math.floor(i / 2) + 9;
                      const minute = i % 2 === 0 ? "00" : "30";
                      const time = `${hour.toString().padStart(2, "0")}:${minute}`;
                      return (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={editSelectedStatus} onValueChange={setEditSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateAppointment}
                disabled={
                  !editSelectedDoctor ||
                  !editSelectedService ||
                  !editSelectedDate ||
                  !editSelectedTime ||
                  !editSelectedStatus
                }
                className="hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
              </Button>
            </div>
        </DialogContent>
      </Dialog>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {!isLoadingAppointments && sortedAppointments.length === 0 ? (
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

                {/* Sort Options */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
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

            {/* Scrollable appointments container */}
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
                              {format(new Date(appointment.datetime), "MMM dd")}
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2 text-lg group-hover:text-primary transition-colors duration-200">
                            <User className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                            {appointment.doctor}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1">
                            <Stethoscope className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                            {appointment.specialty}
                      
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(appointment)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2 group-hover:text-primary transition-colors duration-200">
                        <Stethoscope className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                        <span className="font-medium">{appointment.service}</span>
                      </div>
                      <div className="flex items-center gap-2 group-hover:text-primary transition-colors duration-200">
                        <Calendar className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                        <span>{format(new Date(appointment.datetime), "MMM dd, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2 group-hover:text-primary transition-colors duration-200">
                        <Clock className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                        <span>{format(new Date(appointment.datetime), "hh:mm a")}</span>
                      </div>
                    </div>
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
