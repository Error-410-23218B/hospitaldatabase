"use server"

import prisma  from "./prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret"

export async function getCurrentPatient(request?: NextRequest) {
  try {
    if (!request || !request.cookies) {
      return null
    }
    // Await cookies if it's a Promise
    const cookies = await request.cookies
    if (typeof (cookies as any).get !== "function") {
      return null
    }
    const token = (cookies as any).get("token")?.value
    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { patientId?: number, userType?: string }
    if (decoded.userType !== "patient") {
      return null
    }
    const patientId = decoded.patientId
    if (!patientId) {
      return null
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    })

    return patient
  } catch (error) {
    console.error("Error getting current patient:", error)
    return null
  }
}

export async function getCurrentDoctor(request?: NextRequest) {
  try {
    if (!request || !request.cookies) {
      return null
    }
    // Await cookies if it's a Promise
    const cookies = await request.cookies
    if (typeof (cookies as any).get !== "function") {
      return null
    }
    const token = (cookies as any).get("token")?.value
    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { doctorId?: number, userType?: string }
    if (decoded.userType !== "doctor") {
      return null
    }
    const doctorId = decoded.doctorId
    if (!doctorId) {
      return null
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    })

    return doctor
  } catch (error) {
    console.error("Error getting current doctor:", error)
    return null
  }
}

// Login validation schemas
const patientLoginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const doctorLoginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function loginPatient(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const validatedData = patientLoginSchema.parse({ email, password })

    // In a real app, you would verify the password hash
    const patient = await prisma.patient.findUnique({
      where: { email: validatedData.email },
    })

    if (!patient) {
      return { success: false, message: "Invalid email or password" }
    }

    // Mock password check - in real app, use bcrypt.compare()
    if (patient.password !== validatedData.password) {
      return { success: false, message: "Invalid email or password" }
    }

    // In a real app, you would create a session/JWT here
    revalidatePath("/")
    return { success: true, message: "Login successful", patient }
  } catch (error) {
    console.error("Error logging in patient:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      }
    }
    return { success: false, message: "Login failed" }
  }
}

export async function loginDoctor(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const validatedData = doctorLoginSchema.parse({ email, password })

    // In a real app, you would verify the password hash
    const doctor = await prisma.doctor.findUnique({
      where: { email: validatedData.email },
    })

    if (!doctor) {
      return { success: false, message: "Invalid email or password" }
    }

    // Mock password check - in real app, use bcrypt.compare()
    if (doctor.password !== validatedData.password) {
      return { success: false, message: "Invalid email or password" }
    }

    // In a real app, you would create a session/JWT here
    revalidatePath("/")
    return { success: true, message: "Login successful", doctor }
  } catch (error) {
    console.error("Error logging in doctor:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      }
    }
    return { success: false, message: "Login failed" }
  }
}
