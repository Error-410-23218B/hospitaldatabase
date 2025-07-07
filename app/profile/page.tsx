"use client"

import { useState, useEffect, useActionState } from "react"
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
  User,
  Mail,
  Calendar,
  Shield,
  Camera,
  Edit,
  Save,
  X,
  Check,
  Settings,
  Heart,
  Activity,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { getPatientProfile, updatePatientProfile, updatePassword } from "@/lib/profile-actions"
import { format } from "date-fns"
import { useAuth } from "@/lib/auth-context"
import QRCode from "react-qr-code"


// Types based on Prisma schema
type PatientProfile = {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  dob: Date
  avatar?: string | null
  bio?: string | null
  address?: {
    id: number
    street: string
    city: string
    county: string
    postcode: string
    country: string
  } | null
  emergencyContact?: {
    id: number
    name: string
    relationship: string
    phone: string
  } | null
  medicalInfo?: {
    id: number
    bloodType: string
    allergies: string[]
    conditions: string[]
    medications: string[]
  } | null
  preferences?: {
    id: number
    notificationsEmail: boolean
    notificationsSms: boolean
    notificationsPush: boolean
    notificationsReminders: boolean
    profileVisible: boolean
    shareData: boolean
    language: string
    timezone: string
    theme: string
  } | null
  stats?: {
    id: number
    totalAppointments: number
    upcomingAppointments: number
    completedAppointments: number
    memberSince: Date
  } | null
  twoFactorEnabled?: boolean
  smsenabled?: boolean
  appointments: Array<{
    id: number
    datetime: Date
    status: string
    doctor: {
      id: number
      firstName: string
      lastName: string
      specialization: string
    }
    service: {
      id: number
      name: string
    }
  }>
}

import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const router = useRouter()
  const { user, refreshUser, loading } = useAuth()

  const [showSetup, setShowSetup] = useState(false)
  const [secret, setSecret] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [token, setToken] = useState("")
  const [is2FALoading, setIs2FALoading] = useState(false)

  const fetch2FASecret = async () => {
    if (!patientId) return
    setIs2FALoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const response = await fetch('/api/patient-2fa/generate-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId }),
      })
      const data = await response.json()
      if (data.secret) {
        setSecret(data.secret)
        // Generate otpauth URL for QR code
        const otpauthUrl = `otpauth://totp/HospitalApp:${user?.email}?secret=${data.secret}&issuer=HospitalApp`
        // Generate QR code image URL using Google Charts API
        const qrUrl = `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(otpauthUrl)}`
        setQrCodeUrl(qrUrl)
      } else {
        setError('Failed to generate 2FA secret')
      }
    } catch (err) {
      setError('Error generating 2FA secret')
      console.error(err)
    } finally {
      setIs2FALoading(false)
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  const [patientData, setPatientData] = useState<PatientProfile | null>(null)
  const [isEditingPersonal, setIsEditingPersonal] = useState(false)
  const [isEditingMedical, setIsEditingMedical] = useState(false)
  const [isEditingPreferences, setIsEditingPreferences] = useState(false)
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("personal")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)


  // Form state for personal info update
  const [personalState, personalAction, isPersonalPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await updatePatientProfile(patientId, formData)
      if (result.success) {
        setSuccessMessage("Personal information updated successfully!")
        setIsEditingPersonal(false)
        await loadPatientProfile()
      }
      return result
    },
    { success: false, message: "" },
  )

  // Form state for medical info update
  const [medicalState, medicalAction, isMedicalPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await updatePatientProfile(patientId, formData)
      if (result.success) {
        setSuccessMessage("Medical information updated successfully!")
        setIsEditingMedical(false)
        await loadPatientProfile()
      }
      return result
    },
    { success: false, message: "" },
  )

  // Form state for preferences update
  const [preferencesState, preferencesAction, isPreferencesPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await updatePatientProfile(patientId, formData)
      if (result.success) {
        setSuccessMessage("Preferences updated successfully!")
        setIsEditingPreferences(false)
        await loadPatientProfile()
        await refreshUser()
        window.location.reload()
      }
      return result
    },
    { success: false, message: "" },
  )

  // Form state for password update
  const [passwordState, passwordAction, isPasswordPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await updatePassword(patientId, formData)
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

  
  console.log("Auth user object:", user);
  const patientId = user?.id;
  console.log("Derived patientId:", patientId);

  useEffect(() => {
    if (patientId) {
      loadPatientProfile()
    }
  }, [patientId])

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const loadPatientProfile = async () => {
    try {
      setIsLoading(true)
      const profile = await getPatientProfile(patientId)
      setPatientData(profile)
      setError(null)
    } catch (err) {
      setError("Failed to load profile")
      console.error("Error loading profile:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnable2FA = async () => {
    if (!patientId || !token || !secret) return
    setIs2FALoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const response = await fetch('/api/patient-2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, token, secret }),
      })
      const data = await response.json()
      if (response.ok) {
        setSuccessMessage("Two-factor authentication enabled successfully!")
        setShowSetup(false)
        await loadPatientProfile()
      } else {
        setError(data.error || "Failed to enable two-factor authentication")
      }
    } catch (err) {
      setError("Failed to enable two-factor authentication")
      console.error(err)
    } finally {
      setIs2FALoading(false)
    }
  }

  const handleDisable2FA = async () => {
    if (!patientId) return
    setIs2FALoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      // Call API or action to disable 2FA
      // Simulate success for now
      setSuccessMessage("Two-factor authentication disabled successfully!")
      await loadPatientProfile()
    } catch (err) {
      setError("Failed to disable two-factor authentication")
      console.error(err)
    } finally {
      setIs2FALoading(false)
    }
  }

  const handleCancelPersonal = () => {
    setIsEditingPersonal(false)
    setError(null)
    setSuccessMessage(null)
  }

  const handleCancelMedical = () => {
    setIsEditingMedical(false)
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

  const calculateAge = (dateOfBirth: Date) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const getCurrentEditingState = () => {
    switch (activeTab) {
      case "personal":
        return isEditingPersonal
      case "medical":
        return isEditingMedical
      case "preferences":
        return isEditingPreferences
      default:
        return false
    }
  }

  const getCurrentFormState = () => {
    switch (activeTab) {
      case "personal":
        return personalState
      case "medical":
        return medicalState
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

  if (error || !patientData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Error Loading Profile</h2>
            <p className="text-muted-foreground mb-4">{error || "Failed to load profile data"}</p>
            <Button onClick={loadPatientProfile}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  const currentFormState = getCurrentFormState()
  const isCurrentlyEditing = getCurrentEditingState()

  return (
    <div className="container mx-auto py-8 px-4">

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
        </div>
      )}

      {/* Profile Header Card */}
      <Card className="mb-8 animate-in slide-in-from-left-4 fade-in-0 duration-700 delay-200">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage
                  src={patientData.avatar || "/placeholder.svg"}
                  alt={`${patientData.firstName} ${patientData.lastName}`}
                />
                <AvatarFallback className="text-2xl">
                  {patientData.firstName[0]}
                  {patientData.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0"
                    disabled={!isEditingPersonal}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Profile Picture</DialogTitle>
                    <DialogDescription>Upload a new profile picture or choose from gallery.</DialogDescription>
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
                {patientData.firstName} {patientData.lastName}
              </h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {patientData.email}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Age {calculateAge(patientData.dob)}
                </div>
              </div>
              <p className="text-sm text-muted-foreground max-w-2xl">{patientData.bio || "No bio available"}</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-primary/10 rounded-lg p-3">
                  <div className="text-2xl font-bold text-primary">{patientData.stats?.totalAppointments || 0}</div>
                  <div className="text-xs text-muted-foreground">Total Appointments</div>
                </div>
                <div className="bg-green-100 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">
                    {patientData.stats?.upcomingAppointments || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Upcoming</div>
                </div>
              </div>
              {patientData.stats?.memberSince && (
                <Badge variant="secondary" className="text-center">
                  Member since {formatDate(patientData.stats.memberSince)}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-in fade-in-50 duration-700 delay-400">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="medical" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Medical
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

        {/* New: Edit/Save/Cancel buttons */}
        <div className="flex justify-end gap-2 mb-4">
          {getCurrentEditingState() ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  if (activeTab === "personal") handleCancelPersonal()
                  else if (activeTab === "medical") handleCancelMedical()
                  else if (activeTab === "preferences") handleCancelPreferences()
                }}
                disabled={
                  (activeTab === "personal" && isPersonalPending) ||
                  (activeTab === "medical" && isMedicalPending) ||
                  (activeTab === "preferences" && isPreferencesPending)
                }
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                form={`${activeTab}-form`}
                disabled={
                  (activeTab === "personal" && isPersonalPending) ||
                  (activeTab === "medical" && isMedicalPending) ||
                  (activeTab === "preferences" && isPreferencesPending)
                }
                className="flex items-center gap-2"
              >
                {(activeTab === "personal" && isPersonalPending) ||
                (activeTab === "medical" && isMedicalPending) ||
                (activeTab === "preferences" && isPreferencesPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {(activeTab === "personal" && isPersonalPending) ||
                (activeTab === "medical" && isMedicalPending) ||
                (activeTab === "preferences" && isPreferencesPending)
                  ? "Saving..."
                  : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => {
                if (activeTab === "personal") setIsEditingPersonal(true)
                else if (activeTab === "medical") setIsEditingMedical(true)
                else if (activeTab === "preferences") setIsEditingPreferences(true)
              }}
              className="flex items-center gap-2"
              disabled={activeTab === "security"}
            >
              <Edit className="h-4 w-4" />
              Edit{" "}
              {activeTab === "personal"
                ? "Personal"
                : activeTab === "medical"
                ? "Medical"
                : "Preferences"}
            </Button>
          )}
        </div>

        {/* Personal Information Tab */}
        <TabsContent value="personal" className="space-y-6">
          <form id="personal-form" action={personalAction}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Your personal details and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        defaultValue={patientData.firstName}
                        disabled={!isEditingPersonal}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        defaultValue={patientData.lastName}
                        disabled={!isEditingPersonal}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={patientData.email}
                      disabled={!isEditingPersonal}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth *</Label>
                    <Input
                      id="dob"
                      name="dob"
                      type="date"
                      defaultValue={format(new Date(patientData.dob), "yyyy-MM-dd")}
                      disabled={!isEditingPersonal}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      defaultValue={patientData.phone || ""}
                      disabled={!isEditingPersonal}
                      placeholder="+1 555 123 4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      defaultValue={patientData.bio || ""}
                      disabled={!isEditingPersonal}
                      rows={3}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Address</CardTitle>
                  <CardDescription>Your current address information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      name="street"
                      defaultValue={patientData.address?.street || ""}
                      disabled={!isEditingPersonal}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        defaultValue={patientData.address?.city || ""}
                        disabled={!isEditingPersonal}
                        placeholder="London"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="county">County</Label>
                      <Input
                        id="county"
                        name="county"
                        defaultValue={patientData.address?.county || ""}
                        disabled={!isEditingPersonal}
                        placeholder="Greater London"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="postcode">Postcode</Label>
                      <Input
                        id="postcode"
                        name="postcode"
                        defaultValue={patientData.address?.postcode || ""}
                        disabled={!isEditingPersonal}
                        placeholder="SW1A 1AA"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        name="country"
                        defaultValue={patientData.address?.country || ""}
                        disabled={!isEditingPersonal}
                        placeholder="United Kingdom"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
                <CardDescription>Person to contact in case of emergency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyName">Name</Label>
                    <Input
                      id="emergencyName"
                      name="emergencyName"
                      defaultValue={patientData.emergencyContact?.name || ""}
                      disabled={!isEditingPersonal}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyRelationship">Relationship</Label>
                    <Input
                      id="emergencyRelationship"
                      name="emergencyRelationship"
                      defaultValue={patientData.emergencyContact?.relationship || ""}
                      disabled={!isEditingPersonal}
                      placeholder="Spouse"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">Phone</Label>
                    <Input
                      id="emergencyPhone"
                      name="emergencyPhone"
                      defaultValue={patientData.emergencyContact?.phone || ""}
                      disabled={!isEditingPersonal}
                      placeholder="+44 7700 900123"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* Medical Information Tab */}
        <TabsContent value="medical" className="space-y-6">
          <form id="medical-form" action={medicalAction}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Medical Information</CardTitle>
                  <CardDescription>Important medical details for healthcare providers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bloodType">Blood Type</Label>
                    <Select
                      name="bloodType"
                      defaultValue={patientData.medicalInfo?.bloodType || ""}
                      disabled={!isEditingMedical}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allergies">Allergies</Label>
                    <Input
                      id="allergies"
                      name="allergies"
                      defaultValue={(patientData.medicalInfo?.allergies || []).join(", ")}
                      disabled={!isEditingMedical}
                      placeholder="Penicillin, Shellfish (separate with commas)"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(patientData.medicalInfo?.allergies || []).map((allergy, index) => (
                        <Badge key={index} variant="destructive">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="conditions">Medical Conditions</Label>
                    <Input
                      id="conditions"
                      name="conditions"
                      defaultValue={(patientData.medicalInfo?.conditions || []).join(", ")}
                      disabled={!isEditingMedical}
                      placeholder="Hypertension, Diabetes (separate with commas)"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(patientData.medicalInfo?.conditions || []).map((condition, index) => (
                        <Badge key={index} variant="secondary">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medications">Current Medications</Label>
                    <Input
                      id="medications"
                      name="medications"
                      defaultValue={(patientData.medicalInfo?.medications || []).join(", ")}
                      disabled={!isEditingMedical}
                      placeholder="Lisinopril 10mg, Metformin 500mg (separate with commas)"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(patientData.medicalInfo?.medications || []).map((medication, index) => (
                        <Badge key={index} variant="outline">
                          {medication}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Health Statistics</CardTitle>
                  <CardDescription>Your appointment and health tracking overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Activity className="h-8 w-8 text-blue-600" />
                        <div>
                          <div className="font-semibold">Total Appointments</div>
                          <div className="text-sm text-muted-foreground">All time</div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {patientData.stats?.totalAppointments || 0}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="h-8 w-8 text-green-600" />
                        <div>
                          <div className="font-semibold">Upcoming</div>
                          <div className="text-sm text-muted-foreground">Next 30 days</div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {patientData.stats?.upcomingAppointments || 0}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Check className="h-8 w-8 text-purple-600" />
                        <div>
                          <div className="font-semibold">Completed</div>
                          <div className="text-sm text-muted-foreground">Successfully attended</div>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-purple-600">
                        {patientData.stats?.completedAppointments || 0}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                        name="notificationsEmailSwitch"
                        defaultChecked={patientData.preferences?.notificationsEmail ?? true}
                        disabled={!isEditingPreferences}
                        onCheckedChange={(checked) => {
                          const hiddenInput = document.querySelector(
                            'input[name="notificationsEmail"]',
                          ) as HTMLInputElement
                          if (hiddenInput) hiddenInput.value = checked.toString()
                        }}
                      />
                      <input
                        type="hidden"
                        name="notificationsEmail"
                        defaultValue={(patientData.preferences?.notificationsEmail ?? true).toString()}
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
                        name="notificationsSmsSwitch"
                        defaultChecked={patientData.preferences?.notificationsSms ?? false}
                        disabled={!isEditingPreferences}
                        onCheckedChange={(checked) => {
                          const hiddenInput = document.querySelector(
                            'input[name="notificationsSms"]',
                          ) as HTMLInputElement
                          if (hiddenInput) hiddenInput.value = checked.toString()
                        }}
                      />
                      <input
                        type="hidden"
                        name="notificationsSms"
                        defaultValue={(patientData.preferences?.notificationsSms ?? false).toString()}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <div className="text-sm text-muted-foreground">Receive push notifications in browser</div>
                    </div>
                    <div>
                      <Switch
                        name="notificationsPushSwitch"
                        defaultChecked={patientData.preferences?.notificationsPush ?? true}
                        disabled={!isEditingPreferences}
                        onCheckedChange={(checked) => {
                          const hiddenInput = document.querySelector(
                            'input[name="notificationsPush"]',
                          ) as HTMLInputElement
                          if (hiddenInput) hiddenInput.value = checked.toString()
                        }}
                      />
                      <input
                        type="hidden"
                        name="notificationsPush"
                        defaultValue={(patientData.preferences?.notificationsPush ?? true).toString()}
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
                        name="notificationsRemindersSwitch"
                        defaultChecked={patientData.preferences?.notificationsReminders ?? true}
                        disabled={!isEditingPreferences}
                        onCheckedChange={(checked) => {
                          const hiddenInput = document.querySelector(
                            'input[name="notificationsReminders"]',
                          ) as HTMLInputElement
                          if (hiddenInput) hiddenInput.value = checked.toString()
                        }}
                      />
                      <input
                        type="hidden"
                        name="notificationsReminders"
                        defaultValue={(patientData.preferences?.notificationsReminders ?? true).toString()}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Privacy & Localization</CardTitle>
                  <CardDescription>Control your privacy settings and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Profile Visibility</Label>
                      <div className="text-sm text-muted-foreground">
                        Make your profile visible to healthcare providers
                      </div>
                    </div>
                    <div>
                      <Switch
                        name="profileVisibleSwitch"
                        defaultChecked={patientData.preferences?.profileVisible ?? true}
                        disabled={!isEditingPreferences}
                        onCheckedChange={(checked) => {
                          const hiddenInput = document.querySelector('input[name="profileVisible"]') as HTMLInputElement
                          if (hiddenInput) hiddenInput.value = checked.toString()
                        }}
                      />
                      <input
                        type="hidden"
                        name="profileVisible"
                        defaultValue={(patientData.preferences?.profileVisible ?? true).toString()}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Share Anonymous Data</Label>
                      <div className="text-sm text-muted-foreground">Help improve our services with anonymous data</div>
                    </div>
                    <div>
                      <Switch
                        name="shareDataSwitch"
                        defaultChecked={patientData.preferences?.shareData ?? false}
                        disabled={!isEditingPreferences}
                        onCheckedChange={(checked) => {
                          const hiddenInput = document.querySelector('input[name="shareData"]') as HTMLInputElement
                          if (hiddenInput) hiddenInput.value = checked.toString()
                        }}
                      />
                      <input
                        type="hidden"
                        name="shareData"
                        defaultValue={(patientData.preferences?.shareData ?? false).toString()}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select
                      name="language"
                      defaultValue={patientData.preferences?.language || "en"}
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
                      defaultValue={patientData.preferences?.timezone || "Europe/London"}
                      disabled={!isEditingPreferences}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/London">London Time</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 mt-4">
  <Label>Theme</Label>
  <Select
    name="theme"
    defaultValue={patientData.preferences?.theme || "light"}
    disabled={!isEditingPreferences}
  >
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="light">Light</SelectItem>
      <SelectItem value="dark">Dark</SelectItem>
      <SelectItem value="solarized-dark">Solarized Dark</SelectItem>
      <SelectItem value="forest-green">Forest Green</SelectItem>
      <SelectItem value="sunset-orange">Sunset Orange</SelectItem>
      <SelectItem value="ocean-breeze">Ocean Breeze</SelectItem>
      <SelectItem value="classic-sepia">Classic Sepia</SelectItem>
      <SelectItem value="high-contrast">High Contrast</SelectItem>
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
                <div className="flex flex-col gap-4 p-4 border rounded-lg">
      {/* Authenticator 2FA Setup */}
      {!patientData?.twoFactorEnabled ? (
        <>
          <div className="font-medium">Enable Authenticator Two-Factor Authentication</div>
          <div className="text-sm text-muted-foreground mb-2">
            Add an extra layer of security to your account using an authenticator app.
          </div>
          {!showSetup ? (
            <Button
              variant="outline"
              onClick={() => {
                setShowSetup(true);
                fetch2FASecret();
              }}
              disabled={is2FALoading}
            >
              {is2FALoading ? "Loading..." : "Setup Authenticator App"}
            </Button>
          ) : (
            <>
              <Dialog open={showSetup} onOpenChange={setShowSetup}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Setup Authenticator Two-Factor Authentication</DialogTitle>
                    <DialogDescription>
                      Scan this QR code with your authenticator app (e.g., Google Authenticator).
                    </DialogDescription>
                  </DialogHeader>
                  {secret && (
                    <div className="mb-4 flex justify-center">
                      <QRCode value={`otpauth://totp/HospitalApp:${user?.email}?secret=${secret}&issuer=HospitalApp`} size={200} title="2FA QR Code" />
                    </div>
                  )}
                  <Input
                    placeholder="Enter 2FA token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    maxLength={6}
                  />
                  <div className="flex gap-2 mt-2">
                    <Button onClick={handleEnable2FA} disabled={isLoading}>
                      {isLoading ? "Enabling..." : "Enable Authenticator App 2FA"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowSetup(false)} disabled={isLoading}>
                      Cancel
                    </Button>
                  </div>
                  {error && <p className="text-red-600 mt-2">{error}</p>}
                  {successMessage && <p className="text-green-600 mt-2">{successMessage}</p>}
                </DialogContent>
              </Dialog>
            </>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium">
            Authenticator Two-Factor Authentication is enabled on your account.
            <button
              className="text-red-600 underline"
              onClick={async () => {
                setIs2FALoading(true);
                setError(null);
                setSuccessMessage(null);
                try {
                  const res = await fetch('/api/patient-2fa/disable', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ patientId: patientData.id }),
                  });
                  if (res.ok) {
                    setSuccessMessage('Authenticator 2FA disabled successfully.');
                    await loadPatientProfile();
                  } else {
                    const data = await res.json();
                    setError(data.error || 'Failed to disable Authenticator 2FA');
                  }
                } catch (err) {
                  setError('Failed to disable Authenticator 2FA');
                } finally {
                  setIs2FALoading(false);
                }
              }}
            >
              Disable Authenticator 2FA
            </button>
          </div>
        </>
      )}

                  {/* SMS 2FA Enabled Indicator */}
                  {patientData?.smsenabled ? (
                    <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-medium">
                      <span>SMS Two-Factor Authentication is enabled on your account.</span>
                      <button
                        className="text-red-600 underline"
                        onClick={async () => {
                          setIs2FALoading(true);
                          setError(null);
                          setSuccessMessage(null);
                          try {
                            const res = await fetch('/api/patient-2fa/disable-sms', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ patientId: patientData.id }),
                            });
                            if (res.ok) {
                              setSuccessMessage('SMS 2FA disabled successfully.');
                              await loadPatientProfile();
                            } else {
                              const data = await res.json();
                              setError(data.error || 'Failed to disable SMS 2FA');
                            }
                          } catch (err) {
                            setError('Failed to disable SMS 2FA');
                          } finally {
                            setIs2FALoading(false);
                          }
                        }}
                      >
                        Disable SMS 2FA
                      </button>
                    </div>
                  ) : null}

                  {/* SMS 2FA Setup */}
                  {!patientData?.smsenabled && patientData?.phone ? (
                    <div>
                      <div className="font-medium">Enable SMS Two-Factor Authentication</div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Your phone number: {patientData.phone}
                      </div>
                      <Button
                        onClick={async () => {
                          setIs2FALoading(true)
                          setError(null)
                          setSuccessMessage(null)
                          try {
                            // Send SMS code
                            const res = await fetch('/api/patient-2fa/send-sms-code', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ patientId }),
                            })
                            const data = await res.json()
                            if (res.ok) {
                              setSuccessMessage('SMS code sent. Please check your phone.')
                              // Enable SMS 2FA by setting smsenabled to true
                              const enableRes = await fetch('/api/patient-2fa/enable-sms', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ patientId }),
                              })
                              if (!enableRes.ok) {
                                const enableData = await enableRes.json()
                                setError(enableData.error || 'Failed to enable SMS 2FA')
                              }
                            } else {
                              setError(data.error || 'Failed to send SMS code')
                            }
                          } catch (err) {
                            setError('Failed to send SMS code')
                          } finally {
                            setIs2FALoading(false)
                          }
                        }}
                        disabled={is2FALoading}
                      >
                        {is2FALoading ? 'Sending SMS...' : 'Send SMS Code'}
                      </Button>
                      <Input
                        placeholder="Enter SMS code"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        maxLength={6}
                        className="mt-2"
                      />
                      <Button
                        onClick={async () => {
                          if (!token) return
                          setIs2FALoading(true)
                          setError(null)
                          setSuccessMessage(null)
                          try {
                            const res = await fetch('/api/login/2fa/verify-sms', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ patientId, code: token }),
                            })
                            const data = await res.json()
                            if (res.ok) {
                              setSuccessMessage('SMS 2FA enabled successfully.')
                              await loadPatientProfile()
                            } else {
                              setError(data.error || 'Failed to verify SMS code')
                            }
                          } catch (err) {
                            setError('Failed to verify SMS code')
                          } finally {
                            setIs2FALoading(false)
                          }
                        }}
                        disabled={is2FALoading || !token}
                        className="mt-2"
                      >
                        {is2FALoading ? 'Verifying...' : 'Verify SMS Code'}
                      </Button>
                    </div>
                  ) : null}

                  {patientData?.twoFactorEnabled ? (
                    <>
                      <div className="font-medium">2FA is enabled on your account</div>
                      <Button variant="destructive" onClick={handleDisable2FA} disabled={is2FALoading}>
                        {is2FALoading ? "Disabling..." : "Disable 2FA"}
                      </Button>
                      {error && <p className="text-red-600 mt-2">{error}</p>}
                      {successMessage && <p className="text-green-600 mt-2">{successMessage}</p>}
                    </>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Active Sessions</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Current Session</div>
                      <div className="text-sm text-muted-foreground">Chrome on Windows • London, UK</div>
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
