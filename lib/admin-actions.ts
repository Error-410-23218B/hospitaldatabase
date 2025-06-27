"use server"

import prisma  from "./prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Validation schemas
const createDoctorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  specialization: z.string().min(1, "Specialization is required"),
  licenseNumber: z.string().optional(),
  yearsOfExperience: z.number().min(0).max(50).optional(),
  bio: z.string().optional(),
})

const updatePatientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  dob: z.date(),
  bio: z.string().optional(),
  // Address fields
  street: z.string().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().optional(),
  // Emergency contact fields
  emergencyName: z.string().optional(),
  emergencyRelationship: z.string().optional(),
  emergencyPhone: z.string().optional(),
})

import bcrypt from "bcrypt"

export async function createDoctorAccount(formData: FormData) {
  try {
    const rawData = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      specialization: formData.get("specialization") as string,
      licenseNumber: (formData.get("licenseNumber") as string) || undefined,
      yearsOfExperience: formData.get("yearsOfExperience")
        ? Number.parseInt(formData.get("yearsOfExperience") as string)
        : undefined,
      bio: (formData.get("bio") as string) || undefined,
    }

    // Validate data
    const validatedData = createDoctorSchema.parse(rawData)

    // Check if email already exists
    const existingDoctor = await prisma.doctor.findUnique({
      where: { email: validatedData.email },
    })

    if (existingDoctor) {
      return { success: false, message: "Email already exists" }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    // Create doctor account
    const doctor = await prisma.doctor.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        password: hashedPassword,
        specialization: validatedData.specialization,
        licenseNumber: validatedData.licenseNumber,
        yearsOfExperience: validatedData.yearsOfExperience,
        bio: validatedData.bio,
      },
    })

    // Create default stats
    await prisma.doctorStats.create({
      data: {
        doctor: { connect: { id: doctor.id } },
        joinedDate: new Date(),
      },
    })

    revalidatePath("/administrator")
    return { success: true, message: "Doctor account created successfully" }
  } catch (error) {
    console.error("Error creating doctor account:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      }
    }
    return { success: false, message: "Failed to create doctor account" }
  }
}

export async function getAllDoctors() {
  try {
    const doctors = await prisma.doctor.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        specialization: true,
        avatar: true,
        bio: true,
        licenseNumber: true,
        yearsOfExperience: true,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    })

    return doctors
  } catch (error) {
    console.error("Error fetching doctors:", error)
    throw new Error("Failed to fetch doctors")
  }
}

export async function getAllPatients() {
  try {
    const patients = await prisma.patient.findMany({
      include: {
        address: true,
        emergencyContact: true,
        medicalInfo: true,
        stats: true,
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    })

    return patients
  } catch (error) {
    console.error("Error fetching patients:", error)
    throw new Error("Failed to fetch patients")
  }
}

export async function getPatientDetails(patientId: number) {
  try {
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

export async function updatePatientAccount(patientId: number, formData: FormData) {
  try {
    const rawData = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      dob: new Date(formData.get("dob") as string),
      bio: (formData.get("bio") as string) || undefined,
      // Address data
      street: (formData.get("street") as string) || undefined,
      city: (formData.get("city") as string) || undefined,
      county: (formData.get("county") as string) || undefined,
      postcode: (formData.get("postcode") as string) || undefined,
      country: (formData.get("country") as string) || undefined,
      // Emergency contact data
      emergencyName: (formData.get("emergencyName") as string) || undefined,
      emergencyRelationship: (formData.get("emergencyRelationship") as string) || undefined,
      emergencyPhone: (formData.get("emergencyPhone") as string) || undefined,
    }

    // Validate data
    const validatedData = updatePatientSchema.parse(rawData)

    // Get current patient data
    const currentPatient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        address: true,
        emergencyContact: true,
      },
    })

    if (!currentPatient) {
      return { success: false, message: "Patient not found" }
    }

    // Check if email is being changed and if it already exists
    if (validatedData.email !== currentPatient.email) {
      const existingPatient = await prisma.patient.findUnique({
        where: { email: validatedData.email },
      })

      if (existingPatient) {
        return { success: false, message: "Email already exists" }
      }
    }

    // Start transaction
    await prisma.$transaction(async (tx) => {
      // Update patient basic info
      await tx.patient.update({
        where: { id: patientId },
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          dob: validatedData.dob,
          bio: validatedData.bio,
        },
      })

      // Handle address
      if (
        validatedData.street ||
        validatedData.city ||
        validatedData.county ||
        validatedData.postcode ||
        validatedData.country
      ) {
        const addressData = {
          street: validatedData.street || currentPatient.address?.street || "",
          city: validatedData.city || currentPatient.address?.city || "",
          county: validatedData.county || currentPatient.address?.county || "",
          postcode: validatedData.postcode || currentPatient.address?.postcode || "",
          country: validatedData.country || currentPatient.address?.country || "",
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

      // Handle emergency contact
      if (validatedData.emergencyName || validatedData.emergencyRelationship || validatedData.emergencyPhone) {
        const emergencyContactData = {
          name: validatedData.emergencyName || currentPatient.emergencyContact?.name || "",
          relationship: validatedData.emergencyRelationship || currentPatient.emergencyContact?.relationship || "",
          phone: validatedData.emergencyPhone || currentPatient.emergencyContact?.phone || "",
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
    })

    revalidatePath("/administrator")
    return { success: true, message: "Patient account updated successfully" }
  } catch (error) {
    console.error("Error updating patient account:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      }
    }
    return { success: false, message: "Failed to update patient account" }
  }
}

export async function deletePatientAccount(patientId: number) {
  try {
    // Check if patient has appointments
    const appointmentCount = await prisma.appointment.count({
      where: { patientId },
    })

    if (appointmentCount > 0) {
      return {
        success: false,
        message: "Cannot delete patient with existing appointments. Please cancel all appointments first.",
      }
    }

    // Get patient with related data
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        address: true,
        emergencyContact: true,
        medicalInfo: true,
        preferences: true,
        stats: true,
      },
    })

    if (!patient) {
      return { success: false, message: "Patient not found" }
    }

    // Delete patient and related data in transaction
    await prisma.$transaction(async (tx) => {
      // Delete related records first
      if (patient.address) {
        await tx.address.delete({ where: { id: patient.address.id } })
      }
      if (patient.emergencyContact) {
        await tx.emergencyContact.delete({ where: { id: patient.emergencyContact.id } })
      }
      if (patient.medicalInfo) {
        await tx.medicalInfo.delete({ where: { id: patient.medicalInfo.id } })
      }
      if (patient.preferences) {
        await tx.preferences.delete({ where: { id: patient.preferences.id } })
      }
      if (patient.stats) {
        await tx.stats.delete({ where: { id: patient.stats.id } })
      }

      // Finally delete the patient
      await tx.patient.delete({ where: { id: patientId } })
    })

    revalidatePath("/administrator")
    return { success: true, message: "Patient account deleted successfully" }
  } catch (error) {
    console.error("Error deleting patient account:", error)
    return { success: false, message: "Failed to delete patient account" }
  }
}

export async function deleteDoctorAccount(doctorId: number) {
  try {
    // Check if doctor has appointments
    const appointmentCount = await prisma.appointment.count({
      where: { doctorId },
    })

    if (appointmentCount > 0) {
      return {
        success: false,
        message: "Cannot delete doctor with existing appointments. Please reassign or cancel all appointments first.",
      }
    }

    // Get doctor with related data
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        contactInfo: true,
        availability: true,
        preferences: true,
        stats: true,
      },
    })

    if (!doctor) {
      return { success: false, message: "Doctor not found" }
    }

    // Delete doctor and related data in transaction
    await prisma.$transaction(async (tx) => {
      // Delete related records first
      if (doctor.contactInfo) {
        await tx.doctorContactInfo.delete({ where: { id: doctor.contactInfo.id } })
      }
      if (doctor.availability) {
        await tx.doctorAvailability.delete({ where: { id: doctor.availability.id } })
      }
      if (doctor.preferences) {
        await tx.doctorPreferences.delete({ where: { id: doctor.preferences.id } })
      }
      if (doctor.stats) {
        await tx.doctorStats.delete({ where: { id: doctor.stats.id } })
      }

      // Finally delete the doctor
      await tx.doctor.delete({ where: { id: doctorId } })
    })

    revalidatePath("/administrator")
    return { success: true, message: "Doctor account deleted successfully" }
  } catch (error) {
    console.error("Error deleting doctor account:", error)
    return { success: false, message: "Failed to delete doctor account" }
  }
}
