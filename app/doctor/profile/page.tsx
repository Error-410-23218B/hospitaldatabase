"use client"

import { useState, useEffect, useActionState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Stethoscope,
  Mail,
  Shield,
  Camera,
  Edit,
  Save,
  X,
  Check,
  Settings,
  Award,
  Clock,
  Loader2,
  AlertCircle,
  MapPin,
} from "lucide-react"
import {
  getDoctorProfile,
  updateDoctorPassword,
  updateDoctorProfessional,
  updateDoctorContact,
  updateDoctorAvailability,
  updateDoctorPreferences,
} from "@/lib/doctor-profile-actions"
import { format } from "date-fns"

// Types based on expected doctor profile structure
type DoctorProfile = {
  id: number
  firstName: string
  lastName: string
  email: string
  specialization: string
  avatar?: string | null
  bio?: string | null
  licenseNumber?: string | null
  yearsOfExperience?: number | null
  education?: string | null
  certifications?: string[] | null
  languages?: string[] | null
  contactInfo?: {
    id: number
    phone: string
    officeAddress: string
    city: string
    state: string
    zipCode: string
    country: string
  } | null
  availability?: {
    id: number
    mondayStart: string
    mondayEnd: string
    tuesdayStart: string
    tuesdayEnd: string
    wednesdayStart: string
    wednesdayEnd: string
    thursdayStart: string
    thursdayEnd: string
    fridayStart: string
    fridayEnd: string
    saturdayStart: string
    saturdayEnd: string
    sundayStart: string
    sundayEnd: string
    consultationDuration: number
    breakDuration: number
  } | null
  preferences?: {
    id: number
    emailNotifications: boolean
    smsNotifications: boolean
    appointmentReminders: boolean
    patientUpdates: boolean
    systemUpdates: boolean
    language: string
    timezone: string
    theme: string
  } | null
  stats?: {
    id: number
    totalPatients: number
    totalAppointments: number
    upcomingAppointments: number
    completedAppointments: number
    averageRating: number
    totalReviews: number
    joinedDate: Date
  } | null
  appointments: Array<{
    id: number
    datetime: Date
    status: string
    patient: {
      id: number
      firstName: string
      lastName: string
    }
    service: {
      id: number
      name: string
    }
  }>
}

export default function DoctorProfilePage() {
  const { user, loading } = useAuth()
  const [doctorData, setDoctorData] = useState<DoctorProfile | null>(null)
  const [isEditingProfessional, setIsEditingProfessional] = useState(false)
  const [isEditingContact, setIsEditingContact] = useState(false)
  const [isEditingAvailability, setIsEditingAvailability] = useState(false)
  const [isEditingPreferences, setIsEditingPreferences] = useState(false)
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("professional")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Form state for professional info update
  const [professionalState, professionalAction, isProfessionalPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      if (!user) return { success: false, message: "User not authenticated" }
      const result = await updateDoctorProfessional(user.id, formData)
      if (result.success) {
        setSuccessMessage("Professional information updated successfully!")
        setIsEditingProfessional(false)
        await loadDoctorProfile()
      }
      return result
    },
    { success: false, message: "" },
  )

  // Form state for contact info update
  const [contactState, contactAction, isContactPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      if (!user) return { success: false, message: "User not authenticated" }
      const result = await updateDoctorContact(user.id, formData)
      if (result.success) {
        setSuccessMessage("Contact information updated successfully!")
        setIsEditingContact(false)
        await loadDoctorProfile()
      }
      return result
    },
    { success: false, message: "" },
  )

  // Form state for availability update
  const [availabilityState, availabilityAction, isAvailabilityPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      if (!user) return { success: false, message: "User not authenticated" }
      const result = await updateDoctorAvailability(user.id, formData)
      if (result.success) {
        setSuccessMessage("Availability updated successfully!")
        setIsEditingAvailability(false)
        await loadDoctorProfile()
      }
      return result
    },
    { success: false, message: "" },
  )

  // Form state for preferences update
  const [preferencesState, preferencesAction, isPreferencesPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      if (!user) return { success: false, message: "User not authenticated" }
      const result = await updateDoctorPreferences(user.id, formData)
      if (result.success) {
        setSuccessMessage("Preferences updated successfully!")
        setIsEditingPreferences(false)
        await loadDoctorProfile()
      }
      return result
    },
    { success: false, message: "" },
  )

  // Form state for password update
  const [passwordState, passwordAction, isPasswordPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      if (!user) return { success: false, message: "User not authenticated" }
      const result = await updateDoctorPassword(user.id, formData)
      if (result.success) {
        setSuccessMessage("Password updated successfully!")
        // Reset form
        const form = document.getElementById("password-form") as HTMLFormElement
        form?.reset()
      }
      return result
    },
    { success: false, message: "" },
  )

  useEffect(() => {
    if (user && !loading) {
      loadDoctorProfile()
    }
  }, [user, loading])

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const loadDoctorProfile = async () => {
    if (!user) {
      setError("User not authenticated")
      setIsLoading(false)
      return
    }
    try {
      setIsLoading(true)
      const profile = await getDoctorProfile(user.id)
      setDoctorData(profile)
      setError(null)
    } catch (err) {
      setError("Failed to load profile")
      console.error("Error loading profile:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelProfessional = () => {
    setIsEditingProfessional(false)
    setError(null)
    setSuccessMessage(null)
  }

  const handleCancelContact = () => {
    setIsEditingContact(false)
    setError(null)
    setSuccessMessage(null)
  }

  const handleCancelAvailability = () => {
    setIsEditingAvailability(false)
    setError(null)
    setSuccessMessage(null)
  }

  const handleCancelPreferences = () => {
    setIsEditingPreferences(false)
    setError(null)
    setSuccessMessage(null)
  }

  const formatDate = (date: Date) => {
    return format(new Date(date), "MMMM dd, yyyy")
  }

  const getCurrentEditingState = () => {
    switch (activeTab) {
      case "professional":
        return isEditingProfessional
      case "contact":
        return isEditingContact
      case "availability":
        return isEditingAvailability
      case "preferences":
        return isEditingPreferences
      default:
        return false
    }
  }

  const getCurrentFormState = () => {
    switch (activeTab) {
      case "professional":
        return professionalState
      case "contact":
        return contactState
      case "availability":
        return availabilityState
      case "preferences":
        return preferencesState
      default:
        return { success: false, message: "" }
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading profile...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !doctorData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Error Loading Profile</h2>
            <p className="text-muted-foreground mb-4">{error || "Failed to load profile data"}</p>
            <Button onClick={loadDoctorProfile}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  const currentFormState = getCurrentFormState()
  const isCurrentlyEditing = getCurrentEditingState()

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-in slide-in-from-top-4 fade-in-0 duration-700">
        <div>
          <h1 className="text-3xl font-bold">Doctor Profile</h1>
          <p className="text-muted-foreground mt-2">Manage your professional information and settings</p>
        </div>
        <div className="flex items-center gap-2">
          {isCurrentlyEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  if (activeTab === "professional") handleCancelProfessional()
                  else if (activeTab === "contact") handleCancelContact()
                  else if (activeTab === "availability") handleCancelAvailability()
                  else if (activeTab === "preferences") handleCancelPreferences()
                }}
                disabled={isProfessionalPending || isContactPending || isAvailabilityPending || isPreferencesPending}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                form={`${activeTab}-form`}
                disabled={isProfessionalPending || isContactPending || isAvailabilityPending || isPreferencesPending}
                className="flex items-center gap-2"
              >
                {isProfessionalPending || isContactPending || isAvailabilityPending || isPreferencesPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isProfessionalPending || isContactPending || isAvailabilityPending || isPreferencesPending
                  ? "Saving..."
                  : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => {
                if (activeTab === "professional") setIsEditingProfessional(true)
                else if (activeTab === "contact") setIsEditingContact(true)
                else if (activeTab === "availability") setIsEditingAvailability(true)
                else if (activeTab === "preferences") setIsEditingPreferences(true)
              }}
              className="flex items-center gap-2"
              disabled={activeTab === "security"}
            >
              <Edit className="h-4 w-4" />
              Edit{" "}
              {activeTab === "professional"
                ? "Professional"
                : activeTab === "contact"
                  ? "Contact"
                  : activeTab === "availability"
                    ? "Availability"
                    : "Preferences"}
            </Button>
          )}
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <Check className="h-5 w-5 text-green-600" />
          <p className="text-green-600">{successMessage}</p>
        </div>
      )}

      {/* Error Messages */}
      {!currentFormState.success && currentFormState.message && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-600 font-medium">{currentFormState.message}</p>
          </div>
          {Array.isArray((currentFormState as any).errors) && (
            <ul className="text-red-600 text-sm ml-7">
              {(currentFormState as any).errors.map((error: string, index: number) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Profile Header Card */}
      <Card className="mb-8 animate-in slide-in-from-left-4 fade-in-0 duration-700 delay-200">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage src={doctorData.avatar || "/placeholder.svg"} alt={doctorData.firstName} />
                <AvatarFallback className="text-2xl">
                  {doctorData.firstName[0]}
                  {doctorData.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0"
                    disabled={!isEditingProfessional}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Profile Picture</DialogTitle>
                    <DialogDescription>Upload a new professional photo.</DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-center gap-4 py-4">
                    <Button variant="outline">Upload Photo</Button>
                    <Button variant="outline">Choose from Gallery</Button>
                    <Button variant="outline">Remove Photo</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold mb-2">
                Dr. {doctorData.firstName} {doctorData.lastName}
              </h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Stethoscope className="h-4 w-4" />
                  {doctorData.specialization}
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {doctorData.email}
                </div>
                {doctorData.yearsOfExperience && (
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    {doctorData.yearsOfExperience} years experience
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground max-w-2xl">{doctorData.bio || "No bio available"}</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-primary/10 rounded-lg p-3">
                  <div className="text-2xl font-bold text-primary">{doctorData.stats?.totalPatients || 0}</div>
                  <div className="text-xs text-muted-foreground">Total Patients</div>
                </div>
                <div className="bg-green-100 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">{doctorData.stats?.upcomingAppointments || 0}</div>
                  <div className="text-xs text-muted-foreground">Upcoming</div>
                </div>
              </div>
              {doctorData.stats?.averageRating && (
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-600">
                    ⭐ {doctorData.stats.averageRating.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">{doctorData.stats.totalReviews} reviews</div>
                </div>
              )}
              {doctorData.stats?.joinedDate && (
                <Badge variant="secondary" className="text-center">
                  Joined {formatDate(doctorData.stats.joinedDate)}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-in fade-in-50 duration-700 delay-400">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="professional" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Professional
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Contact
          </TabsTrigger>
          <TabsTrigger value="availability" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Availability
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Professional Information Tab */}
        <TabsContent value="professional" className="space-y-6">
          <form id="professional-form" action={professionalAction}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Your professional details and credentials</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      defaultValue={doctorData.firstName}
                      disabled={!isEditingProfessional}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      defaultValue={doctorData.lastName}
                      disabled={!isEditingProfessional}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={doctorData.email}
                      disabled={!isEditingProfessional}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization *</Label>
                    <Select
                      name="specialization"
                      defaultValue={doctorData.specialization}
                      disabled={!isEditingProfessional}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Family Medicine">Family Medicine</SelectItem>
                        <SelectItem value="Internal Medicine">Internal Medicine</SelectItem>
                        <SelectItem value="Cardiology">Cardiology</SelectItem>
                        <SelectItem value="Dermatology">Dermatology</SelectItem>
                        <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                        <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                        <SelectItem value="Psychiatry">Psychiatry</SelectItem>
                        <SelectItem value="Radiology">Radiology</SelectItem>
                        <SelectItem value="Surgery">Surgery</SelectItem>
                        <SelectItem value="Neurology">Neurology</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input
                      id="licenseNumber"
                      name="licenseNumber"
                      defaultValue={doctorData.licenseNumber || ""}
                      disabled={!isEditingProfessional}
                      placeholder="MD123456"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                    <Input
                      id="yearsOfExperience"
                      name="yearsOfExperience"
                      type="number"
                      min="0"
                      max="50"
                      defaultValue={doctorData.yearsOfExperience || ""}
                      disabled={!isEditingProfessional}
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Professional Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      defaultValue={doctorData.bio || ""}
                      disabled={!isEditingProfessional}
                      rows={4}
                      placeholder="Tell patients about your background and approach to healthcare..."
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Education & Certifications</CardTitle>
                  <CardDescription>Your educational background and professional certifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="education">Education</Label>
                    <Textarea
                      id="education"
                      name="education"
                      defaultValue={doctorData.education || ""}
                      disabled={!isEditingProfessional}
                      rows={3}
                      placeholder="MD from Harvard Medical School, Residency at Johns Hopkins..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="certifications">Certifications</Label>
                    <Input
                      id="certifications"
                      name="certifications"
                      defaultValue={(doctorData.certifications || []).join(", ")}
                      disabled={!isEditingProfessional}
                      placeholder="Board Certified Internal Medicine, ACLS (separate with commas)"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(doctorData.certifications || []).map((cert, index) => (
                        <Badge key={index} variant="secondary">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="languages">Languages Spoken</Label>
                    <Input
                      id="languages"
                      name="languages"
                      defaultValue={(doctorData.languages || []).join(", ")}
                      disabled={!isEditingProfessional}
                      placeholder="English, Spanish, French (separate with commas)"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(doctorData.languages || []).map((language, index) => (
                        <Badge key={index} variant="outline">
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </form>
        </TabsContent>

        {/* Contact Information Tab */}
        <TabsContent value="contact" className="space-y-6">
          <form id="contact-form" action={contactAction}>
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Your office location and contact details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      defaultValue={doctorData.contactInfo?.phone || ""}
                      disabled={!isEditingContact}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="officeAddress">Office Address</Label>
                    <Input
                      id="officeAddress"
                      name="officeAddress"
                      defaultValue={doctorData.contactInfo?.officeAddress || ""}
                      disabled={!isEditingContact}
                      placeholder="123 Medical Center Dr, Suite 100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      defaultValue={doctorData.contactInfo?.city || ""}
                      disabled={!isEditingContact}
                      placeholder="New York"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      defaultValue={doctorData.contactInfo?.state || ""}
                      disabled={!isEditingContact}
                      placeholder="NY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      defaultValue={doctorData.contactInfo?.zipCode || ""}
                      disabled={!isEditingContact}
                      placeholder="10001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      name="country"
                      defaultValue={doctorData.contactInfo?.country || ""}
                      disabled={!isEditingContact}
                      placeholder="United States"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* Availability Tab */}
        <TabsContent value="availability" className="space-y-6">
          <form id="availability-form" action={availabilityAction}>
            <Card>
              <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
                <CardDescription>Set your availability for each day of the week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                    <div key={day} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-24 font-medium capitalize">{day}</div>
                      <div className="flex items-center gap-2">
                        <Input
                          name={`${day}Start`}
                          type="time"
                          defaultValue={
                            doctorData.availability?.[`${day}Start` as keyof typeof doctorData.availability] || ""
                          }
                          disabled={!isEditingAvailability}
                          className="w-32"
                        />
                        <span>to</span>
                        <Input
                          name={`${day}End`}
                          type="time"
                          defaultValue={
                            doctorData.availability?.[`${day}End` as keyof typeof doctorData.availability] || ""
                          }
                          disabled={!isEditingAvailability}
                          className="w-32"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="consultationDuration">Consultation Duration (minutes)</Label>
                    <Select
                      name="consultationDuration"
                      defaultValue={doctorData.availability?.consultationDuration?.toString() || "30"}
                      disabled={!isEditingAvailability}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="breakDuration">Break Between Appointments (minutes)</Label>
                    <Select
                      name="breakDuration"
                      defaultValue={doctorData.availability?.breakDuration?.toString() || "15"}
                      disabled={!isEditingAvailability}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No break</SelectItem>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="10">10 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <form id="preferences-form" action={preferencesAction}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Choose how you want to receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <div className="text-sm text-muted-foreground">Receive notifications via email</div>
                    </div>
                    <div>
                      <Switch
                        name="emailNotificationsSwitch"
                        defaultChecked={doctorData.preferences?.emailNotifications ?? true}
                        disabled={!isEditingPreferences}
                        onCheckedChange={(checked) => {
                          const hiddenInput = document.querySelector(
                            'input[name="emailNotifications"]',
                          ) as HTMLInputElement
                          if (hiddenInput) hiddenInput.value = checked.toString()
                        }}
                      />
                      <input
                        type="hidden"
                        name="emailNotifications"
                        defaultValue={(doctorData.preferences?.emailNotifications ?? true).toString()}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Notifications</Label>
                      <div className="text-sm text-muted-foreground">Receive notifications via text message</div>
                    </div>
                    <div>
                      <Switch
                        name="smsNotificationsSwitch"
                        defaultChecked={doctorData.preferences?.smsNotifications ?? false}
                        disabled={!isEditingPreferences}
                        onCheckedChange={(checked) => {
                          const hiddenInput = document.querySelector(
                            'input[name="smsNotifications"]',
                          ) as HTMLInputElement
                          if (hiddenInput) hiddenInput.value = checked.toString()
                        }}
                      />
                      <input
                        type="hidden"
                        name="smsNotifications"
                        defaultValue={(doctorData.preferences?.smsNotifications ?? false).toString()}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Appointment Reminders</Label>
                      <div className="text-sm text-muted-foreground">Get reminded about upcoming appointments</div>
                    </div>
                    <div>
                      <Switch
                        name="appointmentRemindersSwitch"
                        defaultChecked={doctorData.preferences?.appointmentReminders ?? true}
                        disabled={!isEditingPreferences}
                        onCheckedChange={(checked) => {
                          const hiddenInput = document.querySelector(
                            'input[name="appointmentReminders"]',
                          ) as HTMLInputElement
                          if (hiddenInput) hiddenInput.value = checked.toString()
                        }}
                      />
                      <input
                        type="hidden"
                        name="appointmentReminders"
                        defaultValue={(doctorData.preferences?.appointmentReminders ?? true).toString()}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Patient Updates</Label>
                      <div className="text-sm text-muted-foreground">Notifications about patient changes</div>
                    </div>
                    <div>
                      <Switch
                        name="patientUpdatesSwitch"
                        defaultChecked={doctorData.preferences?.patientUpdates ?? true}
                        disabled={!isEditingPreferences}
                        onCheckedChange={(checked) => {
                          const hiddenInput = document.querySelector('input[name="patientUpdates"]') as HTMLInputElement
                          if (hiddenInput) hiddenInput.value = checked.toString()
                        }}
                      />
                      <input
                        type="hidden"
                        name="patientUpdates"
                        defaultValue={(doctorData.preferences?.patientUpdates ?? true).toString()}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Preferences</CardTitle>
                  <CardDescription>Customize your system settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>System Updates</Label>
                      <div className="text-sm text-muted-foreground">Notifications about system updates</div>
                    </div>
                    <div>
                      <Switch
                        name="systemUpdatesSwitch"
                        defaultChecked={doctorData.preferences?.systemUpdates ?? true}
                        disabled={!isEditingPreferences}
                        onCheckedChange={(checked) => {
                          const hiddenInput = document.querySelector('input[name="systemUpdates"]') as HTMLInputElement
                          if (hiddenInput) hiddenInput.value = checked.toString()
                        }}
                      />
                      <input
                        type="hidden"
                        name="systemUpdates"
                        defaultValue={(doctorData.preferences?.systemUpdates ?? true).toString()}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select
                      name="language"
                      defaultValue={doctorData.preferences?.language || "en"}
                      disabled={!isEditingPreferences}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select
                      name="timezone"
                      defaultValue={doctorData.preferences?.timezone || "America/New_York"}
                      disabled={!isEditingPreferences}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select
                      name="theme"
                      defaultValue={doctorData.preferences?.theme || "light"}
                      disabled={!isEditingPreferences}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </form>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-medium">Change Password</Label>
                {!passwordState.success && passwordState.message && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-red-600 text-sm">{passwordState.message}</p>
                  </div>
                )}
                <form id="password-form" action={passwordAction} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        placeholder="Enter current password"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        placeholder="Enter new password"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isPasswordPending} className="flex items-center gap-2">
                    {isPasswordPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isPasswordPending ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </div>

              <div className="space-y-2">
                <Label>Two-Factor Authentication</Label>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Enable 2FA</div>
                    <div className="text-sm text-muted-foreground">Add an extra layer of security to your account</div>
                  </div>
                  <Button variant="outline">Setup</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Active Sessions</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Current Session</div>
                      <div className="text-sm text-muted-foreground">Chrome on Windows • New York, NY</div>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
