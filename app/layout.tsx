"use client"

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import Header from "./components/Header"
import { AuthProvider } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"

const inter = Inter({ subsets: ["latin"] })

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [theme, setTheme] = useState("light")

  useEffect(() => {
    if (user?.preferences?.theme) {
      setTheme(user.preferences.theme)
    }
  }, [user])

  useEffect(() => {
    // Remove all theme classes
    document.documentElement.classList.remove(
      "light",
      "dark",
      "solarized-dark",
      "forest-green",
      "sunset-orange",
      "ocean-breeze",
      "classic-sepia",
      "high-contrast"
    )
    // Add the current theme class
    document.documentElement.classList.add(theme)
  }, [theme])

  return <>{children}</>
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ThemeWrapper>
            <Header />
            {children}
          </ThemeWrapper>
        </AuthProvider>
      </body>
    </html>
  )
}
