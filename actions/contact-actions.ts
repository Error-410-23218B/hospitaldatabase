"use server"

import { z } from "zod"
import nodemailer from "nodemailer"

// Validation schema
const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  department: z.string().optional(),
  subject: z.string().min(5, "Subject must be at least 5 characters").max(200, "Subject is too long"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message is too long"),
})

export async function submitContactForm(prevState: any, formData: FormData) {
  try {
    // Extract form data
    const rawData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      department: formData.get("department") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
    }

    // Validate the data
    const validatedData = contactFormSchema.parse(rawData)

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // For now, we'll simulate different responses based on department
    const responses = {
      emergency:
        "Your emergency inquiry has been received. If this is a medical emergency, please call 911 immediately.",
      appointments:
        "Thank you for your appointment inquiry! Our scheduling team will contact you within 2 hours during business hours.",
      billing:
        "Your billing inquiry has been forwarded to our financial services team. You can expect a response within 1-2 business days.",
      records:
        "Your medical records request has been received. Please allow 3-5 business days for processing. You may be contacted to verify your identity.",
      support:
        "Your technical support request has been logged. Our IT team will assist you within 4 hours during business hours.",
      general:
        "Thank you for contacting St. Mary's Medical Center! We've received your message and will respond within 24 hours.",
      other:
        "Thank you for your inquiry! Our team will review your message and respond appropriately within 24-48 hours.",
    }

    const department = validatedData.department || "general"
    const responseMessage = responses[department as keyof typeof responses] || responses.general

    // Log the successful submission (in a real app, you'd save this to a database)
    console.log("Contact form submission:", {
      ...validatedData,
      timestamp: new Date().toISOString(),
      ip: "simulated", // In a real app, you'd get this from the request
    })

    // Send email notification using Nodemailer
    await sendEmailNotification(validatedData)

    return {
      success: true,
      message: responseMessage,
      errors: {},
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return validation errors
      const errors: Record<string, string> = {}
      error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message
        }
      })

      return {
        success: false,
        message: "Please correct the errors below and try again.",
        errors,
      }
    }

    // Handle other errors
    console.error("Contact form error:", error)
    return {
      success: false,
      message: "An unexpected error occurred. Please try again or call us directly at (555) 123-4567.",
      errors: {},
    }
  }
}

async function sendEmailNotification(data: any) {
  // Configure Nodemailer transporter for Gmail SMTP
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })

  // Send mail with defined transport object
  let info = await transporter.sendMail({
    from: process.env.GMAIL_EMAIL, // use authenticated email as sender
    replyTo: `"${data.name}" <${data.email}>`, // user's email for replies
    to: "19rjose@thelangton.org.uk", // list of receivers
    subject: `New Contact Form Submission: ${data.subject}`, // Subject line
    text: `Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || "N/A"}
Department: ${data.department || "N/A"}
Message:
${data.message}`, // plain text body
  })

  console.log("Message sent: %s", info.messageId)
}
