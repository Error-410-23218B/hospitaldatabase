"use client"

import { useState, useActionState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserCheck, Loader2, AlertCircle, Eye, EyeOff, ArrowLeft } from "lucide-react"

// Placeholder staff login action - replace with actual implementation
async function loginStaff(formData: FormData) {
  // This is a placeholder - implement actual staff authentication
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  // Demo credentials
  if (email === "staff@hospital.com" && password === "password123") {
    return { success: true, message: "Login successful" }
  }

  return { success: false, message: "Invalid email or password" }
}

export default function StaffLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const [loginState, loginAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await loginStaff(formData)
      if (result.success) {
        // Redirect to staff dashboard (implement as needed)
        router.push("/staff/dashboard")
      }
      return result
    },
    { success: false, message: "" },
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back to main login */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to main login
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Staff Login</CardTitle>
            <CardDescription>Sign in to access staff management tools</CardDescription>
          </CardHeader>
          <CardContent>
            {!loginState.success && loginState.message && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-red-600 text-sm">{loginState.message}</p>
              </div>
            )}

            <form action={loginAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="staff@hospital.com"
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

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isPending}>
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

            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Demo Credentials</h4>
              <div className="text-sm text-green-800 space-y-1">
                <p>
                  <strong>Email:</strong> staff@hospital.com
                </p>
                <p>
                  <strong>Password:</strong> password123
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Access Info */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <h4 className="font-semibold text-green-900 mb-2 text-sm">Staff Access Includes</h4>
            <ul className="text-xs text-green-800 space-y-1">
              <li>• Patient registration and check-in</li>
              <li>• Appointment scheduling and management</li>
              <li>• Basic patient information access</li>
              <li>• Reception desk tools</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
