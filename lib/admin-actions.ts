"use server"

import prisma  from "./prisma"
import { revalidatePath } from "next/cache"
import { requireAuth } from "./auth-actions"

export async function getDoctorAppointments() {
  try {
    const doctor = await requireAuth()

    const appointments = await prisma.appointment.findMany({
      where: { doctorId: doctor.id },
      include: {
        patient: {
          include: {
            address: true,
            emergencyContact: true,
            medicalInfo: true,
          },
        },
        service: true,
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

export async function updateAppointmentStatus(appointmentId: number, status: string) {
  try {
    const doctor = await requireAuth()

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

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
    })

    revalidatePath("/admin")
    return { success: true, message: `Appointment ${status.toLowerCase()} successfully` }
  } catch (error) {
    console.error("Error updating appointment status:", error)
    return { success: false, message: "Failed to update appointment status" }
  }
}

export async function scheduleAppointment(formData: FormData) {
  try {
    const doctor = await requireAuth()

    const patientId = Number.parseInt(formData.get("patientId") as string)
    const serviceId = Number.parseInt(formData.get("serviceId") as string)
    const datetime = new Date(formData.get("datetime") as string)
    const notes = formData.get("notes") as string

    await prisma.appointment.create({
      data: {
        patientId,
        doctorId: doctor.id,
        serviceId,
        datetime,
        status: "Scheduled",
        notes: notes || null,
      },
    })

    revalidatePath("/admin")
    return { success: true, message: "Appointment scheduled successfully" }
  } catch (error) {
    console.error("Error scheduling appointment:", error)
    return { success: false, message: "Failed to schedule appointment" }
  }
}

export async function getAllPatients() {
  try {
    await requireAuth() // Ensure doctor is authenticated

    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        dob: true,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    })

    return patients
  } catch (error) {
    console.error("Error fetching patients:", error)
    throw new Error("Failed to fetch patients")
  }
}

export async function getAllServices() {
  try {
    await requireAuth() // Ensure doctor is authenticated

    const services = await prisma.service.findMany({
      orderBy: { name: "asc" },
    })

    return services
  } catch (error) {
    console.error("Error fetching services:", error)
    throw new Error("Failed to fetch services")
  }
}

export async function getPatientDetails(patientId: number) {
  try {
    await requireAuth() // Ensure doctor is authenticated

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        address: true,
        emergencyContact: true,
        medicalInfo: true,
        stats: true,
        appointments: {
          include: {
            doctor: true,
            service: true,
          },
          orderBy: {
            datetime: "desc",
          },
          take: 10,
        },
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

export async function updateAppointment(appointmentId: number, formData: FormData) {
  try {
    const doctor = await requireAuth()

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

    const status = formData.get("status") as string
    const datetime = formData.get("datetime") ? new Date(formData.get("datetime") as string) : undefined
    const notes = formData.get("notes") as string

    const updateData: any = {}
    if (status) updateData.status = status
    if (datetime) updateData.datetime = datetime
    if (notes !== null) updateData.notes = notes || null

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
    })

    revalidatePath("/admin")
    return { success: true, message: "Appointment updated successfully" }
  } catch (error) {
    console.error("Error updating appointment:", error)
    return { success: false, message: "Failed to update appointment" }
  }
}

export async function cancelAppointment(appointmentId: number, reason?: string) {
  try {
    const doctor = await requireAuth()

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

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "Cancelled",
        notes: reason ? `Cancelled: ${reason}` : "Cancelled by doctor",
      },
    })

    revalidatePath("/admin")
    return { success: true, message: "Appointment cancelled successfully" }
  } catch (error) {
    console.error("Error cancelling appointment:", error)
    return { success: false, message: "Failed to cancel appointment" }
  }
}
