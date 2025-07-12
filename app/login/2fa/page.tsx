"use client"

import type React from "react"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Loader2, Shield, CheckCircle, AlertCircle } from "lucide-react"

function TwoFAVerifyContent() {
  const [token, setToken] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [method, setMethod] = useState<"authenticator" | "sms">("authenticator")
  const [smsSent, setSmsSent] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser, refreshUser } = useAuth()

  // Get patientId from query parameters
  const patientId = searchParams.get("patientId") || ""

  async function sendSmsCode() {
    setLoading(true)
    setMessage("")
    try {
      const res = await fetch("/api/patient-2fa/send-sms-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage("SMS code sent. Please check your phone.")
        setSmsSent(true)
      } else {
        setMessage(data.error || "Failed to send SMS code")
      }
    } catch (error) {
      setMessage("Error sending SMS code")
    }
    setLoading(false)
  }

  async function verify2FA() {
    setLoading(true)
    setMessage("")
    setIsSuccess(false)
    try {
      let res
      // Unified 2FA verification API call
      res = await fetch("/api/login/2fa/verify-unified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, token, method }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage("2FA verification successful. Redirecting...")
        setIsSuccess(true)
        if (data.user) {
          setUser(data.user)
          await refreshUser()
        } else {
          await refreshUser()
        }
        // Redirect to patient dashboard or home page
        router.push("/appointments")
      } else {
        setMessage(data.error || "Invalid 2FA token")
        setIsSuccess(false)
      }
    } catch (error) {
      setMessage("Error verifying 2FA token")
      setIsSuccess(false)
    }
    setLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && token && !loading) {
      verify2FA()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">Two-Factor Authentication</CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              {method === "authenticator"
                ? "Enter the verification code from your authenticator app to continue"
                : "Click the button to send a verification code to your phone"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex justify-center space-x-4">
            <Button
              variant={method === "authenticator" ? "default" : "outline"}
              onClick={() => setMethod("authenticator")}
              disabled={loading}
            >
              Authenticator App
            </Button>
            <Button
              variant={method === "sms" ? "default" : "outline"}
              onClick={() => setMethod("sms")}
              disabled={loading}
            >
              SMS
            </Button>
          </div>

          {method === "sms" && (
            <>
              <Button
                onClick={sendSmsCode}
                disabled={loading || smsSent}
                className="w-full h-11 text-base font-medium"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : smsSent ? (
                  "Code Sent"
                ) : (
                  "Send SMS Code"
                )}
              </Button>
            </>
          )}

          {(method === "authenticator" || smsSent) && (
            <div className="space-y-2">
              <Label htmlFor="token" className="text-sm font-medium text-gray-700">
                {method === "authenticator" ? "Verification Code" : "Enter SMS Code"}
              </Label>
              <Input
                id="token"
                type="text"
                placeholder="Enter 6-digit code"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyPress={handleKeyPress}
                className="text-center text-lg tracking-widest font-mono"
                maxLength={6}
                autoComplete="one-time-code"
                autoFocus
              />
            </div>
          )}

          <Button
            onClick={verify2FA}
            disabled={loading || !token || token.length !== 6}
            className="w-full h-11 text-base font-medium"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Code"
            )}
          </Button>

          {message && (
            <Alert className={isSuccess ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {isSuccess ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={isSuccess ? "text-green-800" : "text-red-800"}>{message}</AlertDescription>
            </Alert>
          )}

          <div className="text-center">
            <p className="text-sm text-gray-500">Having trouble? Contact support for assistance</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TwoFAVerify() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TwoFAVerifyContent />
    </Suspense>
  )
}
