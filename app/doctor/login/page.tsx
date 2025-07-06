"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Stethoscope, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function DoctorLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { user, loading, refreshUser } = useAuth()
  const [loginState, setLoginState] = useState({ success: false, message: "" })
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    if (!loading && user?.userType === "doctor") {
      router.replace("/doctor/appointments")
    }
  }, [user, loading, router])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsPending(true)
    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const response = await fetch("/api/doctor-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()
      console.log("Login result:", result)

      if (response.ok) {
        setLoginState({ success: true, message: "Login successful" })
        await refreshUser()
        // Use setTimeout to ensure state updates before redirect
        setTimeout(() => {
          router.push("/doctor/appointments")
        }, 0)
      } else {
        setLoginState({ success: false, message: result.error || "Login failed" })
      }
    } catch (error) {
      console.error("Login error:", error)
      setLoginState({ success: false, message: "Login failed. Please try again." })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Stethoscope className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Doctor Login</CardTitle>
          <CardDescription>Sign in to access your admin dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          {!loginState.success && loginState.message && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-red-600 text-sm">{loginState.message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="doctor@example.com"
                required
                disabled={isPending}
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
                  required
                  disabled={isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isPending}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Demo Credentials</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                <strong>Email:</strong> smith@hospital.com
              </p>
              <p>
                <strong>Password:</strong> doctorpassword123
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
