"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Loader2, AlertCircle, Eye, EyeOff, Stethoscope, UserCheck } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { setUser, refreshUser } = useAuth()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      console.log("Login response data:", data)

      if (response.ok) {
        if (data.twoFactorEnabled) {
          console.log("Redirecting to 2FA page with patientId:", data.patientId)
          // Redirect to 2FA verification page with patientId
          window.location.href = `/login/2fa?patientId=${data.patientId}`
        } else {
          setMessage("Login successful!")
          setFormData({ email: "", password: "" })
          if (data.user) {
            setUser(data.user)
            await refreshUser()
          }
          await router.push("/")
          await refreshUser()
        }
      } else {
        setMessage(data.error || "Login failed")
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Main Login Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Patient Login</CardTitle>
            <CardDescription>Sign in to access your healthcare dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-red-600 text-sm">{message}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="patient@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  Sign up here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Staff Login Options */}
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Staff Access</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Link href="/doctor/login">
              <Card className="cursor-pointer transition-all hover:shadow-md hover:scale-105 border-2 hover:border-primary/20">
                <CardContent className="flex items-center justify-center p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Stethoscope className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-blue-900">Doctor Login</p>
                      <p className="text-xs text-blue-600">Access admin dashboard</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/staff/login">
              <Card className="cursor-pointer transition-all hover:shadow-md hover:scale-105 border-2 hover:border-primary/20">
                <CardContent className="flex items-center justify-center p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-green-900">Staff Login</p>
                      <p className="text-xs text-green-600">Reception & support staff</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Demo Credentials */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">Demo Credentials</h4>
            <div className="text-xs text-blue-800 space-y-1">
              <p>
                <strong>Patient:</strong> patient@example.com / password123
              </p>
              <p>
                <strong>Doctor:</strong> dr.johnson@hospital.com / password123
              </p>
              <p>
                <strong>Staff:</strong> staff@hospital.com / password123
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
