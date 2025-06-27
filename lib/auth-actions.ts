"use server"

import prisma from "./prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'

export async function loginDoctor(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!email || !password) {
      return { success: false, message: "Email and password are required" }
    }

    // Find doctor by email
    const doctor = await prisma.doctor.findUnique({
      where: { email },
    })
    console.log("Doctor found:", doctor)
    if (!doctor) {
      return { success: false, message: "Invalid email or password" }
    }
    console.log("Doctor password hash:", doctor.password)
    // Compare password using bcrypt
    const passwordMatch = await bcrypt.compare(password, doctor.password)
    console.log("Password match result:", passwordMatch)
    if (!passwordMatch) {
      return { success: false, message: "Invalid email or password" }
    }

    // Generate JWT token
    const token = jwt.sign({ doctorId: doctor.id, email: doctor.email }, JWT_SECRET, {
      expiresIn: '1h',
    })

    // Set token cookie
    const cookieStore = await cookies()
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    })

    return { success: true, message: "Login successful", doctorId: doctor.id }
  } catch (error) {
    console.log("Full error object:", error);
    console.error("Error logging in doctor:", error)
    return { success: false, message: "Login failed. Please try again." }
  }
}

export async function logoutDoctor() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("token")
    redirect("/doctor/login")
  } catch (error) {
    console.error("Error logging out:", error)
  }
}

export async function getCurrentDoctor() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("token")

    if (!sessionCookie) {
      return null
    }

    const payload = jwt.verify(sessionCookie.value, JWT_SECRET) as { doctorId: number; email: string }

    if (!payload || !payload.doctorId) {
      return null
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: payload.doctorId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        specialization: true,
      },
    })

    return doctor
  } catch (error) {
    console.error("Error getting current doctor:", error)
    return null
  }
}

export async function requireAuth() {
  const doctor = await getCurrentDoctor()
  if (!doctor) {
    redirect("/doctor/login")
  }
  return doctor
}
