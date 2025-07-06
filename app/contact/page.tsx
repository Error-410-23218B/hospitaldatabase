"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  AlertTriangle,
  Send,
  CheckCircle,
  Loader2,
  MessageCircle,
  Headphones,
  Calendar,
  Users,
  Building,
  Navigation,
  PhoneCall,
  MessageSquare,
  HelpCircle,
  FileText,
  CreditCard,
  UserCheck,
  Zap,
  Shield,
  Globe,
} from "lucide-react"
import { submitContactForm } from "../../actions/contact-actions"

export default function ContactPage() {
  const [formState, formAction, isPending] = useActionState(submitContactForm, {
    success: false,
    message: "",
    errors: {},
  })

  const contactMethods = [
    {
      icon: Phone,
      title: "Call Us",
      description: "Speak directly with our team",
      primary: "(555) 123-4567",
      secondary: "Emergency: 911",
      color: "emerald",
      available: "24/7 Available",
    },
{
  icon: Mail,
  title: "Email Support",
  description: "Send us a detailed message",
  primary: "19rjose@thelangton.org.uk",
  secondary: "info@stmarys.com",
  color: "violet",
  available: "Response within 24hrs",
},
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Get instant assistance",
      primary: "Chat with us now",
      secondary: "Available online",
      color: "orange",
      available: "Mon-Fri: 8AM-8PM",
    },
    {
      icon: Calendar,
      title: "Book Appointment",
      description: "Schedule your visit",
      primary: "Online Booking",
      secondary: "Quick & Easy",
      color: "blue",
      available: "Available 24/7",
    },
  ]

  const departments = [
    {
      name: "Patient Services",
      icon: UserCheck,
      phone: "(555) 123-CARE",
      email: "patients@stmarys.com",
      description: "General inquiries, appointments, and patient support",
      hours: "Mon-Fri: 7AM-7PM, Weekends: 9AM-5PM",
    },
    {
      name: "Emergency Services",
      icon: Zap,
      phone: "911",
      email: "emergency@stmarys.com",
      description: "24/7 emergency medical care and urgent situations",
      hours: "Available 24/7",
      urgent: true,
    },
    {
      name: "Billing & Insurance",
      icon: CreditCard,
      phone: "(555) 123-BILL",
      email: "billing@stmarys.com",
      description: "Payment questions, insurance verification, and financial assistance",
      hours: "Mon-Fri: 8AM-6PM",
    },
    {
      name: "Medical Records",
      icon: FileText,
      phone: "(555) 123-DOCS",
      email: "records@stmarys.com",
      description: "Request medical records, test results, and documentation",
      hours: "Mon-Fri: 9AM-5PM",
    },
    {
      name: "Technical Support",
      icon: Headphones,
      phone: "(555) 123-TECH",
      email: "support@stmarys.com",
      description: "Help with patient portal, online services, and technical issues",
      hours: "Mon-Fri: 8AM-6PM",
    },
    {
      name: "General Information",
      icon: HelpCircle,
      phone: "(555) 123-INFO",
      email: "info@stmarys.com",
      description: "Hospital information, directions, and general questions",
      hours: "Mon-Fri: 8AM-5PM",
    },
  ]

  const locations = [
    {
      name: "St Thomas' Hospital",
      address: "Westminster Bridge Rd",
      city: "London SE1 7EH",
      phone: "+44 20 7188 7188",
      services: ["Emergency Care", "Surgery", "Inpatient Services", "Imaging"],
      hours: "24/7 Emergency | Outpatient: 8AM-6PM",
      parking: "On-site parking available",
    },
    {
      name: "Royal London Hospital",
      address: "Whitechapel Rd",
      city: "London E1 1BB",
      phone: "+44 20 7377 7000",
      services: ["Trauma Care", "Specialist Surgery", "Maternity", "Outpatient Clinics"],
      hours: "24/7 Emergency | Outpatient: 7AM-7PM",
      parking: "Limited parking, public transport recommended",
    },
    {
      name: "Addenbrooke's Hospital",
      address: "Hills Rd",
      city: "Cambridge CB2 0QQ",
      phone: "+44 1223 245151",
      services: ["Cancer Care", "Cardiology", "Neurology", "Pediatrics"],
      hours: "24/7 Emergency | Outpatient: 7AM-8PM",
      parking: "Patient and visitor parking available",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">
      {/* Header Section */}
      <section className="relative py-16 px-4 bg-gradient-to-r from-slate-900 via-gray-900 to-zinc-900">
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=1200')] bg-cover bg-center opacity-10"></div>
        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 mb-6">
            <MessageSquare className="h-10 w-10 text-emerald-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Get in Touch</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            We're here to help with all your healthcare needs. Choose the best way to reach us below.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              <Clock className="w-4 h-4 mr-1" />
              24/7 Emergency Care
            </Badge>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
              <Shield className="w-4 h-4 mr-1" />
              HIPAA Compliant
            </Badge>
            <Badge variant="secondary" className="bg-violet-500/20 text-violet-300 border-violet-500/30">
              <Globe className="w-4 h-4 mr-1" />
              Multilingual Support
            </Badge>
          </div>
        </div>
      </section>

      {/* Emergency Banner */}
      <section className="px-4 py-6 bg-red-600">
        <div className="container mx-auto">
          <Alert className="border-red-400 bg-red-50 max-w-4xl mx-auto">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800 font-medium">
              <strong>Medical Emergency?</strong> Call 911 immediately or visit our Emergency Department at 123
              Healthcare Drive. Our emergency services are staffed 24/7 with board-certified emergency physicians.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Contact Methods Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How Can We Help You?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose your preferred method of contact. Our team is ready to assist you with appointments, questions, or
              any healthcare needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactMethods.map((method, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg"
              >
                <CardContent className="p-6 text-center">
                  <div
                    className={`w-16 h-16 mx-auto rounded-2xl bg-${method.color}-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <method.icon className={`h-8 w-8 text-${method.color}-600`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{method.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{method.description}</p>
                  <div className="space-y-1">
                    <p className={`font-medium text-${method.color}-600`}>{method.primary}</p>
                    <p className="text-xs text-gray-500">{method.secondary}</p>
                  </div>
                  <Badge variant="outline" className="mt-3 text-xs">
                    {method.available}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-xl border-0">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Send className="h-5 w-5 text-emerald-600" />
                    </div>
                    Send Us a Message
                  </CardTitle>
                  <CardDescription className="text-base">
                    Fill out the form below and our team will respond within 24 hours during business days.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  {formState.message && (
                    <Alert
                      className={`mb-6 ${formState.success ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}
                    >
                      {formState.success ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      <AlertDescription className={formState.success ? "text-emerald-800" : "text-red-800"}>
                        {formState.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  <form action={formAction} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Enter your full name"
                          required
                          disabled={isPending}
                          className={`h-12 ${formState.errors?.name ? "border-red-500" : ""}`}
                        />
                        {formState.errors?.name && <p className="text-sm text-red-600">{formState.errors.name}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                          Email Address *
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="your.email@example.com"
                          required
                          disabled={isPending}
                          className={`h-12 ${formState.errors?.email ? "border-red-500" : ""}`}
                        />
                        {formState.errors?.email && <p className="text-sm text-red-600">{formState.errors.email}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          disabled={isPending}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                          Department
                        </Label>
                        <Select name="department" disabled={isPending}>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General Inquiries</SelectItem>
                            <SelectItem value="appointments">Appointments</SelectItem>
                            <SelectItem value="billing">Billing & Insurance</SelectItem>
                            <SelectItem value="records">Medical Records</SelectItem>
                            <SelectItem value="support">Technical Support</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
                        Subject *
                      </Label>
                      <Input
                        id="subject"
                        name="subject"
                        placeholder="Brief description of your inquiry"
                        required
                        disabled={isPending}
                        className={`h-12 ${formState.errors?.subject ? "border-red-500" : ""}`}
                      />
                      {formState.errors?.subject && <p className="text-sm text-red-600">{formState.errors.subject}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                        Message *
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Please provide details about your inquiry or question..."
                        rows={6}
                        required
                        disabled={isPending}
                        className={`resize-none ${formState.errors?.message ? "border-red-500" : ""}`}
                      />
                      {formState.errors?.message && <p className="text-sm text-red-600">{formState.errors.message}</p>}
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-base bg-emerald-600 hover:bg-emerald-700"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Sending Message...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-5 w-5" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information Sidebar */}
            <div className="space-y-6">
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-br from-emerald-50 to-teal-50">
                  <CardTitle className="flex items-center gap-2 text-emerald-800">
                    <PhoneCall className="h-5 w-5" />
                    Quick Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-red-800">Emergency</div>
                      <div className="text-red-700 font-medium">Call 911</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-blue-800">Main Hospital</div>
                      <div className="text-blue-700">(555) 123-4567</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-emerald-800">Appointments</div>
                      <div className="text-emerald-700">(555) 123-APPT</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-violet-50 rounded-xl border border-violet-100">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-violet-800">Email Support</div>
                      <div className="text-violet-700 text-sm">testing@test.com</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-br from-slate-50 to-gray-50">
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Clock className="h-5 w-5" />
                    Hours of Operation
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Emergency Services</span>
                    <Badge className="bg-emerald-100 text-emerald-800">24/7</Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Outpatient Services</span>
                    <span className="text-sm font-medium">6AM - 8PM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Phone Support</span>
                    <span className="text-sm font-medium">8AM - 6PM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Billing Office</span>
                    <span className="text-sm font-medium">9AM - 5PM</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Department Directory */}
      <section className="py-16 px-4 bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Department Directory</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Connect directly with the right department for faster, more specialized assistance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept, index) => (
              <Card
                key={index}
                className={`hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-md ${
                  dept.urgent ? "ring-2 ring-red-200 bg-gradient-to-br from-red-50 to-orange-50" : "bg-white"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        dept.urgent ? "bg-red-100" : "bg-slate-100"
                      }`}
                    >
                      <dept.icon className={`h-6 w-6 ${dept.urgent ? "text-red-600" : "text-slate-600"}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{dept.name}</h3>
                      {dept.urgent && (
                        <Badge variant="destructive" className="text-xs mb-2">
                          URGENT CARE
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{dept.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{dept.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-blue-600">{dept.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{dept.hours}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Visit Our Locations</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find the most convenient location for your healthcare needs with multiple facilities across the region.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {locations.map((location, index) => (
              <Card key={index} className="shadow-xl border-0 hover:shadow-2xl transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50">
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-slate-600" />
                    {location.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-medium">{location.address}</div>
                        <div className="text-sm text-gray-600">{location.city}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{location.phone}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-gray-500 mt-1" />
                      <span className="text-sm">{location.hours}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 text-gray-500 mt-1" />
                      <span className="text-sm text-gray-600">{location.parking}</span>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Available Services</h4>
                    <div className="flex flex-wrap gap-1">
                      {location.services.map((service, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button asChild variant="outline" className="w-full mt-4 bg-transparent">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        locations[index].address + ', ' + locations[index].city
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Get Directions
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))} 
          </div>
        </div>
      </section>
    </div>
  )
}
