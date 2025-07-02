"use server"

import prisma  from "./prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getCurrentDoctor } from "./auth-actions"
import { NextRequest } from "next/server"

// Validation schemas
const scheduleAppointmentSchema = z.object({
  patientId: z.number().min(1, "Patient is required"),
  serviceId: z.number().min(1, "Service is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  notes: z.string().optional(),
})

const rescheduleAppointmentSchema = z.object({
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  reason: z.string().optional(),
})

export async function getDoctorAppointments(doctorId: number) {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { doctorId: doctorId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            dob: true,
            avatar: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        datetime: "asc",
      },
    })

    return appointments
  } catch (error) {
    console.error("Error fetching doctor appointments:", error)
    throw new Error("Failed to fetch appointments")
  }
}

function isTimeInRange(start: string, end: string, time: string) {
  return start <= time && time < end;
}

function checkAvailability(availability: any, datetime: Date) {
  const dayOfWeek = datetime.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  const appointmentTime = datetime.toTimeString().slice(0, 5); // "HH:MM"

  const dayMap: { [key: number]: { start: string; end: string } } = {
    0: { start: availability.sundayStart, end: availability.sundayEnd },
    1: { start: availability.mondayStart, end: availability.mondayEnd },
    2: { start: availability.tuesdayStart, end: availability.tuesdayEnd },
    3: { start: availability.wednesdayStart, end: availability.wednesdayEnd },
    4: { start: availability.thursdayStart, end: availability.thursdayEnd },
    5: { start: availability.fridayStart, end: availability.fridayEnd },
    6: { start: availability.saturdayStart, end: availability.saturdayEnd },
  };

  const { start, end } = dayMap[dayOfWeek];
  if (!start || !end) return false;
  return isTimeInRange(start, end, appointmentTime);
}

export async function scheduleNewAppointment(doctorId: number, formData: FormData) {
  try {
    const rawData = {
      patientId: Number.parseInt(formData.get("patientId") as string),
      serviceId: Number.parseInt(formData.get("serviceId") as string),
      date: formData.get("date") as string,
      time: formData.get("time") as string,
      notes: (formData.get("notes") as string) || undefined,
    }

    // Validate data
    const validatedData = scheduleAppointmentSchema.parse(rawData)

    // Create datetime from date and time
    const datetime = new Date(`${validatedData.date}T${validatedData.time}`)

    // Check if the datetime is in the future
    if (datetime <= new Date()) {
      return { success: false, message: "Appointment must be scheduled for a future date and time" }
    }

    // Fetch doctor's availability
    const availability = await prisma.doctorAvailability.findFirst({
      where: { doctor: { id: doctorId } },
    })

    if (!availability) {
      return { success: false, message: "Doctor availability not found" }
    }

    // Check if appointment time is within availability
    if (!checkAvailability(availability, datetime)) {
      return { success: false, message: "Appointment time is outside doctor availability" }
    }

    // Check for conflicting appointments
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId: doctorId,
        datetime: datetime,
        status: {
          not: "Cancelled",
        },
      },
    })

    if (conflictingAppointment) {
      return { success: false, message: "You already have an appointment at this time" }
    }

    // Create the appointment
    await prisma.appointment.create({
      data: {
        patientId: validatedData.patientId,
        doctorId: doctorId,
        serviceId: validatedData.serviceId,
        datetime: datetime,
        status: "Scheduled",
        notes: validatedData.notes,
      },
    })

    revalidatePath("/doctor/appointments")
    return { success: true, message: "Appointment scheduled successfully" }
  } catch (error) {
    console.error("Error scheduling appointment:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      }
    }
    return { success: false, message: "Failed to schedule appointment" }
  }
}

export async function updateAppointmentStatus(doctorId: number, appointmentId: number, status: string) {
  try {
    // Verify the appointment belongs to this doctor
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        doctorId: doctorId,
      },
    })

    if (!appointment) {
      return { success: false, message: "Appointment not found or access denied" }
    }

    // Update the appointment status
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
    })

    revalidatePath("/doctor/appointments")
    return { success: true, message: `Appointment ${status.toLowerCase()} successfully` }
  } catch (error) {
    console.error("Error updating appointment status:", error)
    return { success: false, message: "Failed to update appointment status" }
  }
}

export async function rescheduleAppointment(doctorId: number, appointmentId: number, formData: FormData) {
  try {
    const rawData = {
      date: formData.get("date") as string,
      time: formData.get("time") as string,
      reason: (formData.get("reason") as string) || undefined,
    }

    // Validate data
    const validatedData = rescheduleAppointmentSchema.parse(rawData)

    // Verify the appointment belongs to this doctor
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        doctorId: doctorId,
      },
    })

    if (!appointment) {
      return { success: false, message: "Appointment not found or access denied" }
    }

    // Create new datetime
    const newDatetime = new Date(`${validatedData.date}T${validatedData.time}`)

    // Check if the datetime is in the future
    if (newDatetime <= new Date()) {
      return { success: false, message: "Appointment must be rescheduled for a future date and time" }
    }

    // Check for conflicting appointments
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId: doctorId,
        datetime: newDatetime,
        status: {
          not: "Cancelled",
        },
        id: {
          not: appointmentId,
        },
      },
    })

    if (conflictingAppointment) {
      return { success: false, message: "You already have an appointment at this time" }
    }

    // Update the appointment
    const updateData: any = {
      datetime: newDatetime,
    }

    if (validatedData.reason) {
      updateData.notes = `Rescheduled: ${validatedData.reason}${appointment.notes ? ` | Previous notes: ${appointment.notes}` : ""}`
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
    })

    revalidatePath("/doctor/appointments")
    return { success: true, message: "Appointment rescheduled successfully" }
  } catch (error) {
    console.error("Error rescheduling appointment:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      }
    }
    return { success: false, message: "Failed to reschedule appointment" }
  }
}

export async function getPatientDetailsForDoctor(doctorId: number, patientId: number) {
  try {
    // Verify the doctor has appointments with this patient
    const hasAppointment = await prisma.appointment.findFirst({
      where: {
        patientId: patientId,
        doctorId: doctorId,
      },
    })

    if (!hasAppointment) {
      throw new Error("Access denied: No appointments with this patient")
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        address: true,
        emergencyContact: true,
        medicalInfo: true,
        stats: true,
      },
    })

    if (!patient) {
      throw new Error("Patient not found")
    }

    return patient
  } catch (error) {
    console.error("Error fetching patient details:", error)
    throw new Error("Failed to fetch patient details")
  }
}

export async function getAllPatientsForDoctor(doctorId: number) {
  try {
    // Get all patients who have appointments with this doctor
    const patients = await prisma.patient.findMany({
      where: {
        appointments: {
          some: {
            doctorId: doctorId,
          },
        },
      },
      include: {
        stats: true,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    })

    return patients
  } catch (error) {
    console.error("Error fetching patients for doctor:", error)
    throw new Error("Failed to fetch patients")
  }
}

export async function getAllServicesForDoctor(doctorId: number) {
  try {
    // Get all services that this doctor can provide
    const services = await prisma.service.findMany({
      where: {
        doctors: {
          some: {
            id: doctorId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { name: "asc" },
    })

    // If no specific services are assigned, return all services
    if (services.length === 0) {
      const allServices = await prisma.service.findMany({
        select: {
          id: true,
          name: true,
          description: true,
        },
        orderBy: { name: "asc" },
      })
      return allServices
    }

    return services
  } catch (error) {
    console.error("Error fetching services for doctor:", error)
    throw new Error("Failed to fetch services")
  }
}

export async function addAppointmentNotes(appointmentId: number, notes: string) {
  try {
    const doctor = await getCurrentDoctor()
    if (!doctor) {
      return { success: false, message: "Doctor not authenticated" }
    }

    // Verify the appointment belongs to this doctor
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        doctorId: doctor.id,
      },
    })

    if (!appointment) {
      return { success: false, message: "Appointment not found or access denied" }
    }

    // Update the appointment with notes
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { notes },
    })

    revalidatePath("/doctor/appointments")
    return { success: true, message: "Notes added successfully" }
  } catch (error) {
    console.error("Error adding appointment notes:", error)
    return { success: false, message: "Failed to add notes" }
  }
}

export async function getAppointmentsByDate(date: string) {
  try {
    const doctor = await getCurrentDoctor()
    if (!doctor) {
      throw new Error("Doctor not authenticated")
    }

    const startOfDay = new Date(`${date}T00:00:00`)
    const endOfDay = new Date(`${date}T23:59:59`)

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        datetime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            dob: true,
            avatar: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        datetime: "asc",
      },
    })

    return appointments
  } catch (error) {
    console.error("Error fetching appointments by date:", error)
    throw new Error("Failed to fetch appointments")
  }
}
