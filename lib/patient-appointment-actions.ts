"use server"

import prisma  from "./prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getCurrentPatient } from "./auth-actions"
import { addMinutes, format, parseISO, startOfDay, endOfDay } from "date-fns"

// Validation schemas
const bookAppointmentSchema = z.object({
  doctorId: z.number().min(1, "Doctor is required"),
  serviceId: z.number().min(1, "Service is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
})

import { NextRequest } from "next/server"

export async function getPatientAppointments(request?: NextRequest) {
  try {
    const patient = await getCurrentPatient(request)
    if (!patient) {
      throw new Error("Patient not authenticated")
    }

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        datetime: "asc",
      },
    })

    // Add priority based on order
    const appointmentsWithPriority = appointments.map((appointment, index) => ({
      ...appointment,
      priority: index + 1,
    }))

    return appointmentsWithPriority
  } catch (error) {
    console.error("Error fetching patient appointments:", error)
    throw new Error("Failed to fetch appointments")
  }
}

export async function getDoctorsWithAvailability() {
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        availability: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    })

    // Only return doctors who have availability set
    return doctors.filter((doctor) => doctor.availability !== null)
  } catch (error) {
    console.error("Error fetching doctors with availability:", error)
    throw new Error("Failed to fetch doctors")
  }
}

export async function getServicesForDoctor(doctorId: number) {
  try {
    const services = await prisma.service.findMany({
      where: {
        doctors: {
          some: {
            id: doctorId,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    // If no specific services are assigned, return all services
    if (services.length === 0) {
      const allServices = await prisma.service.findMany({
        orderBy: {
          name: "asc",
        },
      })
      return allServices
    }

    return services
  } catch (error) {
    console.error("Error fetching services for doctor:", error)
    throw new Error("Failed to fetch services")
  }
}

export async function getAvailableTimeSlots(doctorId: number, date: string) {
  try {
    const selectedDate = parseISO(date)
    const dayOfWeek = selectedDate.getDay() // 0 = Sunday, 1 = Monday, etc.

    // Get doctor's availability
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { availability: true },
    })

    if (!doctor || !doctor.availability) {
      return []
    }

    const availability = doctor.availability
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const dayName = dayNames[dayOfWeek]

    const startKey = `${dayName}Start` as keyof typeof availability
    const endKey = `${dayName}End` as keyof typeof availability

    const startTime = availability[startKey] as string
    const endTime = availability[endKey] as string

    // Check if doctor works on this day
    if (startTime === "00:00" && endTime === "00:00") {
      return []
    }

    // Get existing appointments for this doctor on this date
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctorId,
        datetime: {
          gte: startOfDay(selectedDate),
          lte: endOfDay(selectedDate),
        },
        status: {
          not: "Cancelled",
        },
      },
    })

    // Generate time slots
    const slots = []
    const consultationDuration = availability.consultationDuration || 30
    const breakDuration = availability.breakDuration || 0
    const slotDuration = consultationDuration + breakDuration

    const startMinutes = parseTime(startTime)
    const endMinutes = parseTime(endTime)

    let currentTime = startMinutes
    while (currentTime + consultationDuration <= endMinutes) {
      const timeString = formatTime(currentTime)
      const slotStart = new Date(selectedDate)
      slotStart.setHours(Math.floor(currentTime / 60), currentTime % 60, 0, 0)

      const slotEnd = addMinutes(slotStart, consultationDuration)

      // Check if this slot conflicts with existing appointments
      const hasConflict = existingAppointments.some((appointment) => {
        const appointmentStart = new Date(appointment.datetime)
        const appointmentEnd = addMinutes(appointmentStart, consultationDuration)

        // Check for overlap
        return (
          (slotStart >= appointmentStart && slotStart < appointmentEnd) ||
          (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
          (slotStart <= appointmentStart && slotEnd >= appointmentEnd)
        )
      })

      slots.push({
        time: timeString,
        available: !hasConflict,
        reason: hasConflict ? "Already booked" : undefined,
        isBooked: hasConflict,
      })

      currentTime += slotDuration
    }

    return slots
  } catch (error) {
    console.error("Error getting available time slots:", error)
    throw new Error("Failed to get available time slots")
  }
}

export async function bookAppointment(data: {
  doctorId: number
  serviceId: number
  date: string
  time: string
}, request?: NextRequest) {
  try {
    const patient = await getCurrentPatient(request)
    if (!patient) {
      return { success: false, message: "Patient not authenticated" }
    }

    // Validate data
    const validatedData = bookAppointmentSchema.parse(data)

    // Create datetime from date and time
    const datetime = new Date(`${validatedData.date}T${validatedData.time}`)

    // Check if the datetime is in the future
    if (datetime <= new Date()) {
      return { success: false, message: "Appointment must be scheduled for a future date and time" }
    }

    // Get doctor's availability
    const doctor = await prisma.doctor.findUnique({
      where: { id: validatedData.doctorId },
      include: { availability: true },
    })

    if (!doctor || !doctor.availability) {
      return { success: false, message: "Doctor availability not found" }
    }

    // Check if doctor is available on this day and time
    const dayOfWeek = datetime.getDay()
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const dayName = dayNames[dayOfWeek]

    const startKey = `${dayName}Start` as keyof typeof doctor.availability
    const endKey = `${dayName}End` as keyof typeof doctor.availability

    const startTime = doctor.availability[startKey] as string
    const endTime = doctor.availability[endKey] as string

    if (startTime === "00:00" && endTime === "00:00") {
      return { success: false, message: "Doctor is not available on this day" }
    }

    // Check if the time is within doctor's availability
    const appointmentTime = parseTime(format(datetime, "HH:mm"))
    const startMinutes = parseTime(startTime)
    const endMinutes = parseTime(endTime)
    const consultationDuration = doctor.availability.consultationDuration || 30

    if (appointmentTime < startMinutes || appointmentTime + consultationDuration > endMinutes) {
      return { success: false, message: "Selected time is outside doctor's availability hours" }
    }

    // Check for conflicting appointments
    const appointmentEnd = addMinutes(datetime, consultationDuration)

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId: validatedData.doctorId,
        status: {
          not: "Cancelled",
        },
        datetime: {
          gte: startOfDay(datetime),
          lte: endOfDay(datetime),
        },
      },
    })

    if (conflictingAppointment) {
      const existingStart = new Date(conflictingAppointment.datetime)
      const existingEnd = addMinutes(existingStart, consultationDuration)

      // Check for actual overlap
      if (
        (datetime >= existingStart && datetime < existingEnd) ||
        (appointmentEnd > existingStart && appointmentEnd <= existingEnd) ||
        (datetime <= existingStart && appointmentEnd >= existingEnd)
      ) {
        return { success: false, message: "This time slot is already booked" }
      }
    }

    // Create the appointment
    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: validatedData.doctorId,
        serviceId: validatedData.serviceId,
        datetime: datetime,
        status: "Scheduled",
        priority: 0,
      },
    })

    // Increment totalAppointments in patient's stats
    await prisma.stats.update({
      where: { id: patient.statsId! },
      data: {
        totalAppointments: {
          increment: 1,
        },
      },
    })

    revalidatePath("/appointments")
    return { success: true, message: "Appointment booked successfully" }
  } catch (error) {
    console.error("Error booking appointment:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      }
    }
    return { success: false, message: "Failed to book appointment" }
  }
}

export async function cancelAppointment(appointmentId: number) {
  try {
    const patient = await getCurrentPatient()
    if (!patient) {
      return { success: false, message: "Patient not authenticated" }
    }

    // Verify the appointment belongs to this patient
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        patientId: patient.id,
      },
    })

    if (!appointment) {
      return { success: false, message: "Appointment not found or access denied" }
    }

    // Check if appointment can be cancelled
    if (appointment.status === "Completed") {
      return { success: false, message: "Cannot cancel a completed appointment" }
    }

    if (appointment.status === "Cancelled") {
      return { success: false, message: "Appointment is already cancelled" }
    }

    // Update the appointment status
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "Cancelled" },
    })

    revalidatePath("/appointments")
    return { success: true, message: "Appointment cancelled successfully" }
  } catch (error) {
    console.error("Error cancelling appointment:", error)
    return { success: false, message: "Failed to cancel appointment" }
  }
}

// Helper functions
function parseTime(timeString: string): number {
  const [hours, minutes] = timeString.split(":").map(Number)
  return hours * 60 + minutes
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}
