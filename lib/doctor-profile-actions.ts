"use server"

import prisma  from "./prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Validation schemas
const professionalSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  specialization: z.string().min(1, "Specialization is required"),
  licenseNumber: z.string().optional(),
  yearsOfExperience: z.number().min(0).max(50).optional(),
  bio: z.string().optional(),
  education: z.string().optional(),
  certifications: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
})

const contactSchema = z.object({
  phone: z.string().optional(),
  officeAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
})

const availabilitySchema = z.object({
  mondayStart: z.string().optional(),
  mondayEnd: z.string().optional(),
  tuesdayStart: z.string().optional(),
  tuesdayEnd: z.string().optional(),
  wednesdayStart: z.string().optional(),
  wednesdayEnd: z.string().optional(),
  thursdayStart: z.string().optional(),
  thursdayEnd: z.string().optional(),
  fridayStart: z.string().optional(),
  fridayEnd: z.string().optional(),
  saturdayStart: z.string().optional(),
  saturdayEnd: z.string().optional(),
  sundayStart: z.string().optional(),
  sundayEnd: z.string().optional(),
  consultationDuration: z.number().min(5).max(120).optional(),
  breakDuration: z.number().min(0).max(60).optional(),
})

const preferencesSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  appointmentReminders: z.boolean(),
  patientUpdates: z.boolean(),
  systemUpdates: z.boolean(),
  language: z.string(),
  timezone: z.string(),
  theme: z.string(),
})

export async function getDoctorProfile(doctorId: number) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        contactInfo: true,
        availability: true,
        preferences: true,
        stats: true,
        appointments: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            service: true,
          },
          orderBy: {
            datetime: "desc",
          },
          take: 10,
        },
      },
    })

    if (!doctor) {
      throw new Error("Doctor not found")
    }

    return doctor
  } catch (error) {
    console.error("Error fetching doctor profile:", error)
    throw new Error("Failed to fetch doctor profile")
  }
}

export async function updateDoctorProfessional(doctorId: number, formData: FormData) {
  try {
    // Extract and validate professional data
    const rawData = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      specialization: formData.get("specialization") as string,
      licenseNumber: (formData.get("licenseNumber") as string) || null,
      yearsOfExperience: formData.get("yearsOfExperience") ? Number(formData.get("yearsOfExperience")) : null,
      bio: (formData.get("bio") as string) || null,
      education: (formData.get("education") as string) || null,
      certifications: formData.get("certifications") as string,
      languages: formData.get("languages") as string,
    }

    // Process certifications and languages arrays
    const processedData = {
      ...rawData,
      certifications: rawData.certifications
        ? rawData.certifications
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      languages: rawData.languages
        ? rawData.languages
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    }

    // Validate data
    const validatedData = professionalSchema.parse(processedData)

    // Update doctor professional information
    await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        specialization: validatedData.specialization,
        licenseNumber: validatedData.licenseNumber,
        yearsOfExperience: validatedData.yearsOfExperience,
        bio: validatedData.bio,
        education: validatedData.education,
        certifications: validatedData.certifications || [],
        languages: validatedData.languages || [],
      },
    })

    // Update stats if needed
    await updateDoctorStats(doctorId)

    revalidatePath("/doctor/profile")
    return { success: true, message: "Professional information updated successfully" }
  } catch (error) {
    console.error("Error updating doctor professional info:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      }
    }
    return { success: false, message: "Failed to update professional information" }
  }
}

export async function updateDoctorContact(doctorId: number, formData: FormData) {
  try {
    // Extract contact data
    const rawData = {
      phone: (formData.get("phone") as string) || "",
      officeAddress: (formData.get("officeAddress") as string) || "",
      city: (formData.get("city") as string) || "",
      state: (formData.get("state") as string) || "",
      zipCode: (formData.get("zipCode") as string) || "",
      country: (formData.get("country") as string) || "",
    }

    // Validate data
    const validatedData = contactSchema.parse(rawData)

    // Get current doctor with contact info
    const currentDoctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { contactInfo: true },
    })

    if (!currentDoctor) {
      throw new Error("Doctor not found")
    }

    // Update or create contact info
    if (currentDoctor.contactInfo) {
      await prisma.doctorContactInfo.update({
        where: { id: currentDoctor.contactInfo.id },
        data: {
          phone: validatedData.phone || "",
          officeAddress: validatedData.officeAddress || "",
          city: validatedData.city || "",
          state: validatedData.state || "",
          zipCode: validatedData.zipCode || "",
          country: validatedData.country || "",
        },
      })
    } else {
      const newContactInfo = await prisma.doctorContactInfo.create({
        data: {
          phone: validatedData.phone || "",
          officeAddress: validatedData.officeAddress || "",
          city: validatedData.city || "",
          state: validatedData.state || "",
          zipCode: validatedData.zipCode || "",
          country: validatedData.country || "",
        },
      })
      await prisma.doctor.update({
        where: { id: doctorId },
        data: { contactInfoId: newContactInfo.id },
      })
    }

    revalidatePath("/doctor/profile")
    return { success: true, message: "Contact information updated successfully" }
  } catch (error) {
    console.error("Error updating doctor contact info:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      }
    }
    return { success: false, message: "Failed to update contact information" }
  }
}

export async function updateDoctorAvailability(doctorId: number, formData: FormData) {
  try {
    // Extract availability data
    const rawData = {
      mondayStart: (formData.get("mondayStart") as string) || "",
      mondayEnd: (formData.get("mondayEnd") as string) || "",
      tuesdayStart: (formData.get("tuesdayStart") as string) || "",
      tuesdayEnd: (formData.get("tuesdayEnd") as string) || "",
      wednesdayStart: (formData.get("wednesdayStart") as string) || "",
      wednesdayEnd: (formData.get("wednesdayEnd") as string) || "",
      thursdayStart: (formData.get("thursdayStart") as string) || "",
      thursdayEnd: (formData.get("thursdayEnd") as string) || "",
      fridayStart: (formData.get("fridayStart") as string) || "",
      fridayEnd: (formData.get("fridayEnd") as string) || "",
      saturdayStart: (formData.get("saturdayStart") as string) || "",
      saturdayEnd: (formData.get("saturdayEnd") as string) || "",
      sundayStart: (formData.get("sundayStart") as string) || "",
      sundayEnd: (formData.get("sundayEnd") as string) || "",
      consultationDuration: formData.get("consultationDuration") ? Number(formData.get("consultationDuration")) : 30,
      breakDuration: formData.get("breakDuration") ? Number(formData.get("breakDuration")) : 15,
    }

    // Validate data
    const validatedData = availabilitySchema.parse(rawData)

    // Get current doctor with availability
    const currentDoctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { availability: true },
    })

    if (!currentDoctor) {
      throw new Error("Doctor not found")
    }

    // Update or create availability
    if (currentDoctor.availability) {
      await prisma.doctorAvailability.update({
        where: { id: currentDoctor.availability.id },
        data: {
          mondayStart: validatedData.mondayStart || "",
          mondayEnd: validatedData.mondayEnd || "",
          tuesdayStart: validatedData.tuesdayStart || "",
          tuesdayEnd: validatedData.tuesdayEnd || "",
          wednesdayStart: validatedData.wednesdayStart || "",
          wednesdayEnd: validatedData.wednesdayEnd || "",
          thursdayStart: validatedData.thursdayStart || "",
          thursdayEnd: validatedData.thursdayEnd || "",
          fridayStart: validatedData.fridayStart || "",
          fridayEnd: validatedData.fridayEnd || "",
          saturdayStart: validatedData.saturdayStart || "",
          saturdayEnd: validatedData.saturdayEnd || "",
          sundayStart: validatedData.sundayStart || "",
          sundayEnd: validatedData.sundayEnd || "",
          consultationDuration: validatedData.consultationDuration || 30,
          breakDuration: validatedData.breakDuration || 15,
        },
      })
    } else {
      const newAvailability = await prisma.doctorAvailability.create({
        data: {
          mondayStart: validatedData.mondayStart || "",
          mondayEnd: validatedData.mondayEnd || "",
          tuesdayStart: validatedData.tuesdayStart || "",
          tuesdayEnd: validatedData.tuesdayEnd || "",
          wednesdayStart: validatedData.wednesdayStart || "",
          wednesdayEnd: validatedData.wednesdayEnd || "",
          thursdayStart: validatedData.thursdayStart || "",
          thursdayEnd: validatedData.thursdayEnd || "",
          fridayStart: validatedData.fridayStart || "",
          fridayEnd: validatedData.fridayEnd || "",
          saturdayStart: validatedData.saturdayStart || "",
          saturdayEnd: validatedData.saturdayEnd || "",
          sundayStart: validatedData.sundayStart || "",
          sundayEnd: validatedData.sundayEnd || "",
          consultationDuration: validatedData.consultationDuration || 30,
          breakDuration: validatedData.breakDuration || 15,
        },
      })
      await prisma.doctor.update({
        where: { id: doctorId },
        data: { availabilityId: newAvailability.id },
      })
    }

    revalidatePath("/doctor/profile")
    return { success: true, message: "Availability updated successfully" }
  } catch (error) {
    console.error("Error updating doctor availability:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      }
    }
    return { success: false, message: "Failed to update availability" }
  }
}

export async function updateDoctorPreferences(doctorId: number, formData: FormData) {
  try {
    // Extract preferences data
    const rawData = {
      emailNotifications: formData.get("emailNotifications") === "true",
      smsNotifications: formData.get("smsNotifications") === "true",
      appointmentReminders: formData.get("appointmentReminders") === "true",
      patientUpdates: formData.get("patientUpdates") === "true",
      systemUpdates: formData.get("systemUpdates") === "true",
      language: (formData.get("language") as string) || "en",
      timezone: (formData.get("timezone") as string) || "America/New_York",
      theme: (formData.get("theme") as string) || "light",
    }

    // Validate data
    const validatedData = preferencesSchema.parse(rawData)

    // Get current doctor with preferences
    const currentDoctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { preferences: true },
    })

    if (!currentDoctor) {
      throw new Error("Doctor not found")
    }

    // Update or create preferences
    if (currentDoctor.preferences) {
      await prisma.doctorPreferences.update({
        where: { id: currentDoctor.preferences.id },
        data: validatedData,
      })
    } else {
      const newPreferences = await prisma.doctorPreferences.create({
        data: validatedData,
      })
      await prisma.doctor.update({
        where: { id: doctorId },
        data: { preferencesId: newPreferences.id },
      })
    }

    revalidatePath("/doctor/profile")
    return { success: true, message: "Preferences updated successfully" }
  } catch (error) {
    console.error("Error updating doctor preferences:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      }
    }
    return { success: false, message: "Failed to update preferences" }
  }
}

import bcrypt from "bcrypt"

export async function updateDoctorPassword(doctorId: number, formData: FormData) {
  try {
    const currentPassword = formData.get("currentPassword") as string
    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (!currentPassword || !newPassword || !confirmPassword) {
      return { success: false, message: "All password fields are required" }
    }

    if (newPassword !== confirmPassword) {
      return { success: false, message: "New passwords do not match" }
    }

    if (newPassword.length < 8) {
      return { success: false, message: "Password must be at least 8 characters long" }
    }

    // Get current doctor to verify current password
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { password: true },
    })

    if (!doctor) {
      return { success: false, message: "Doctor not found" }
    }

    // Verify current password using bcrypt
    const isMatch = await bcrypt.compare(currentPassword, doctor.password)
    if (!isMatch) {
      return { success: false, message: "Current password is incorrect" }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password in database
    await prisma.doctor.update({
      where: { id: doctorId },
      data: { password: hashedPassword },
    })

    revalidatePath("/doctor/profile")

    return { success: true, message: "Password updated successfully" }
  } catch (error) {
    console.error("Error updating password:", error)
    return { success: false, message: "Failed to update password" }
  }
}

export async function updateDoctorStats(doctorId: number) {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { doctorId },
    })

    const now = new Date()
    const upcomingAppointments = appointments.filter((apt) => apt.datetime > now).length
    const completedAppointments = appointments.filter((apt) => apt.datetime < now && apt.status === "Completed").length

    // Get unique patients
    const uniquePatients = new Set(appointments.map((apt) => apt.patientId))
    const totalPatients = uniquePatients.size

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { stats: true },
    })

    const statsData = {
      totalAppointments: appointments.length,
      upcomingAppointments,
      completedAppointments,
      totalPatients,
      averageRating: 4.5, // Mock rating - implement actual rating system
      totalReviews: Math.floor(totalPatients * 0.7), // Mock reviews
      joinedDate: doctor?.stats?.joinedDate || new Date(),
    }

    if (doctor?.stats) {
      await prisma.doctorStats.update({
        where: { id: doctor.stats.id },
        data: statsData,
      })
    } else {
      const newStats = await prisma.doctorStats.create({
        data: {
          ...statsData,
          joinedDate: new Date(),
        },
      })
      await prisma.doctor.update({
        where: { id: doctorId },
        data: { statsId: newStats.id },
      })
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating doctor stats:", error)
    throw new Error("Failed to update doctor stats")
  }
}
