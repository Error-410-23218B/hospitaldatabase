"use server"

import prisma  from "./prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import bcrypt from "bcrypt"

// Validation schemas
const addressSchema = z.object({
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  county: z.string().min(1, "County is required"),
  postcode: z.string().min(1, "Postcode is required"),
  country: z.string().min(1, "Country is required"),
})

const emergencyContactSchema = z.object({
  name: z.string().min(1, "Emergency contact name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  phone: z.string().min(1, "Phone number is required"),
})

const medicalInfoSchema = z.object({
  bloodType: z.string().min(1, "Blood type is required"),
  allergies: z.array(z.string()),
  conditions: z.array(z.string()),
  medications: z.array(z.string()),
})

const preferencesSchema = z.object({
  notificationsEmail: z.boolean(),
  notificationsSms: z.boolean(),
  notificationsPush: z.boolean(),
  notificationsReminders: z.boolean(),
  profileVisible: z.boolean(),
  shareData: z.boolean(),
  language: z.string(),
  timezone: z.string(),
  theme: z.string().optional(),
})

const patientUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  bio: z.string().optional(),
  dob: z.date(),
  address: addressSchema.optional(),
  emergencyContact: emergencyContactSchema.optional(),
  medicalInfo: medicalInfoSchema.optional(),
  preferences: preferencesSchema.optional(),
})

export async function getPatientProfile(patientId: number) {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        address: true,
        emergencyContact: true,
        medicalInfo: true,
        preferences: true,
        stats: true,
        appointments: {
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
              },
            },
          },
          orderBy: {
            datetime: "asc",
          },
        },
      },
    })

    if (!patient) {
      throw new Error("Patient not found")
    }

    return patient
  } catch (error) {
    console.error("Error fetching patient profile:", error)
    throw new Error("Failed to fetch patient profile")
  }
}

export async function updatePatientProfile(patientId: number, formData: FormData) {
  try {
    // Extract form data
    const rawData = {
      firstName: formData.get("firstName") as string | null,
      lastName: formData.get("lastName") as string | null,
      email: formData.get("email") as string | null,
      bio: formData.get("bio") as string | null,
      dob: formData.get("dob") ? new Date(formData.get("dob") as string) : null,
      // Address data
      street: formData.get("street") as string | null,
      city: formData.get("city") as string | null,
      county: formData.get("county") as string | null,
      postcode: formData.get("postcode") as string | null,
      country: formData.get("country") as string | null,
      // Emergency contact data
      emergencyName: formData.get("emergencyName") as string | null,
      emergencyRelationship: formData.get("emergencyRelationship") as string | null,
      emergencyPhone: formData.get("emergencyPhone") as string | null,
      // Phone number
      phone: formData.get("phone") as string | null,
      // Medical info data
      bloodType: formData.get("bloodType") as string | null,
      allergies: formData.get("allergies") as string | null,
      conditions: formData.get("conditions") as string | null,
      medications: formData.get("medications") as string | null,
      // Preferences data
      notificationsEmail: formData.get("notificationsEmail") === "true",
      notificationsSms: formData.get("notificationsSms") === "true",
      notificationsPush: formData.get("notificationsPush") === "true",
      notificationsReminders: formData.get("notificationsReminders") === "true",
      profileVisible: formData.get("profileVisible") === "true",
      shareData: formData.get("shareData") === "true",
      language: formData.get("language") as string | null,
      timezone: formData.get("timezone") as string | null,
      theme: formData.get("theme") as string | null,
    }

    // Determine which section is being updated based on which fields are present
    const isPersonalUpdate = rawData.firstName !== null || rawData.lastName !== null || rawData.email !== null
    const isMedicalUpdate =
      rawData.bloodType !== null ||
      rawData.allergies !== null ||
      rawData.conditions !== null ||
      rawData.medications !== null
    const isPreferencesUpdate =
      formData.has("notificationsEmail") || formData.has("language") || formData.has("timezone") || formData.has("theme")

    // Get current patient data for partial updates
    const currentPatient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        address: true,
        emergencyContact: true,
        medicalInfo: true,
        preferences: true,
      },
    })

    if (!currentPatient) {
      throw new Error("Patient not found")
    }

    // Start transaction
    await prisma.$transaction(async (tx) => {
      // Update personal information if present
        if (isPersonalUpdate) {
        const personalData: any = {}

        if (rawData.firstName) personalData.firstName = rawData.firstName
        if (rawData.lastName) personalData.lastName = rawData.lastName
        if (rawData.email) personalData.email = rawData.email
        if (rawData.bio !== null) personalData.bio = rawData.bio
        if (rawData.dob) personalData.dob = rawData.dob
        if (rawData.phone) personalData.phone = rawData.phone

        if (Object.keys(personalData).length > 0) {
          await tx.patient.update({
            where: { id: patientId },
            data: personalData,
          })
        }

        // Handle address if any address fields are present
        if (rawData.street || rawData.city || rawData.county || rawData.postcode || rawData.country) {
          const addressData = {
            street: rawData.street || currentPatient.address?.street || "",
            city: rawData.city || currentPatient.address?.city || "",
            county: rawData.county || currentPatient.address?.county || "",
            postcode: rawData.postcode || currentPatient.address?.postcode || "",
            country: rawData.country || currentPatient.address?.country || "",
          }

          if (currentPatient.address) {
            await tx.address.update({
              where: { id: currentPatient.address.id },
              data: addressData,
            })
          } else {
            const newAddress = await tx.address.create({
              data: addressData,
            })
            await tx.patient.update({
              where: { id: patientId },
              data: { addressId: newAddress.id },
            })
          }
        }

        // Handle emergency contact if any emergency contact fields are present
        if (rawData.emergencyName || rawData.emergencyRelationship || rawData.emergencyPhone) {
          const emergencyContactData = {
            name: rawData.emergencyName || currentPatient.emergencyContact?.name || "",
            relationship: rawData.emergencyRelationship || currentPatient.emergencyContact?.relationship || "",
            phone: rawData.emergencyPhone || currentPatient.emergencyContact?.phone || "",
          }

          if (currentPatient.emergencyContact) {
            await tx.emergencyContact.update({
              where: { id: currentPatient.emergencyContact.id },
              data: emergencyContactData,
            })
          } else {
            const newEmergencyContact = await tx.emergencyContact.create({
              data: emergencyContactData,
            })
            await tx.patient.update({
              where: { id: patientId },
              data: { emergencyContactId: newEmergencyContact.id },
            })
          }
        }
      }

      // Update medical information if present
      if (isMedicalUpdate) {
        const medicalData: any = {}

        if (rawData.bloodType) medicalData.bloodType = rawData.bloodType
        if (rawData.allergies !== null) {
          medicalData.allergies = rawData.allergies
            ? rawData.allergies
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : []
        }
        if (rawData.conditions !== null) {
          medicalData.conditions = rawData.conditions
            ? rawData.conditions
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : []
        }
        if (rawData.medications !== null) {
          medicalData.medications = rawData.medications
            ? rawData.medications
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : []
        }

        if (Object.keys(medicalData).length > 0) {
          if (currentPatient.medicalInfo) {
            await tx.medicalInfo.update({
              where: { id: currentPatient.medicalInfo.id },
              data: medicalData,
            })
          } else {
            const newMedicalInfo = await tx.medicalInfo.create({
              data: {
                bloodType: medicalData.bloodType || "",
                allergies: medicalData.allergies || [],
                conditions: medicalData.conditions || [],
                medications: medicalData.medications || [],
              },
            })
            await tx.patient.update({
              where: { id: patientId },
              data: { medicalInfoId: newMedicalInfo.id },
            })
          }
        }
      }

      // Update preferences if present
      if (isPreferencesUpdate) {
        const preferencesData = {
      notificationsEmail: formData.has("notificationsEmail")
        ? rawData.notificationsEmail
        : (currentPatient.preferences?.notificationsEmail ?? true),
      notificationsSms: formData.has("notificationsSms")
        ? rawData.notificationsSms
        : (currentPatient.preferences?.notificationsSms ?? false),
      notificationsPush: formData.has("notificationsPush")
        ? rawData.notificationsPush
        : (currentPatient.preferences?.notificationsPush ?? true),
      notificationsReminders: formData.has("notificationsReminders")
        ? rawData.notificationsReminders
        : (currentPatient.preferences?.notificationsReminders ?? true),
      profileVisible: formData.has("profileVisible")
        ? rawData.profileVisible
        : (currentPatient.preferences?.profileVisible ?? true),
      shareData: formData.has("shareData") ? rawData.shareData : (currentPatient.preferences?.shareData ?? false),
      language: rawData.language || currentPatient.preferences?.language || "en",
      timezone: rawData.timezone || currentPatient.preferences?.timezone || "Europe/London",
      theme: rawData.theme || currentPatient.preferences?.theme || "light",
        }

        if (currentPatient.preferences) {
          await tx.preferences.update({
            where: { id: currentPatient.preferences.id },
            data: preferencesData,
          })
        } else {
          const newPreferences = await tx.preferences.create({
            data: preferencesData,
          })
          await tx.patient.update({
            where: { id: patientId },
            data: { preferencesId: newPreferences.id },
          })
        }
      }
    })

    // Update stats
    await updatePatientStats(patientId)

    revalidatePath("/profile")
    return { success: true, message: "Profile updated successfully" }
  } catch (error) {
    console.error("Error updating patient profile:", error)
    return { success: false, message: "Failed to update profile" }
  }
}

export async function updatePatientStats(patientId: number) {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { patientId },
    })

    const now = new Date()
    const upcomingAppointments = appointments.filter((apt) => apt.datetime > now).length
    const completedAppointments = appointments.filter((apt) => apt.datetime < now && apt.status === "Completed").length

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { stats: true },
    })

    const statsData = {
      totalAppointments: appointments.length,
      upcomingAppointments,
      completedAppointments,
      memberSince: patient?.stats?.memberSince || new Date(),
    }

    if (patient?.stats) {
      await prisma.stats.update({
        where: { id: patient.stats.id },
        data: statsData,
      })
    } else {
      const newStats = await prisma.stats.create({
        data: {
          ...statsData,
          memberSince: new Date(),
        },
      })
      await prisma.patient.update({
        where: { id: patientId },
        data: { statsId: newStats.id },
      })
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating patient stats:", error)
    throw new Error("Failed to update patient stats")
  }
}

export async function updatePassword(patientId: number, formData: FormData) {
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

    // Fetch current hashed password from database
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { password: true },
    })

    if (!patient) {
      return { success: false, message: "User not found" }
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, patient.password)
    if (!isMatch) {
      return { success: false, message: "Current password is incorrect" }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password in database
    await prisma.patient.update({
      where: { id: patientId },
      data: { password: hashedPassword },
    })

    revalidatePath("/profile")

    return { success: true, message: "Password updated successfully" }
  } catch (error) {
    console.error("Error updating password:", error)
    return { success: false, message: "Failed to update password" }
  }
}
