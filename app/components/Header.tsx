"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings, Home, Info, Mail, Menu, X, Clock, Building2, TestTube } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function Header() {
  const { user, loading, setUser, refreshUser } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        cache: "no-store",
      })
    } catch (error) {
      console.error("Logout failed", error)
    } finally {
      setUser(null)
      refreshUser()
    }
  }

  const handleLogin = () => {
    window.location.href = "/login"
  }

const appointmentsHref = user?.specialization ? "/doctor/appointments" : "/appointments"

  // Build navigation links excluding Tests if user is doctor (has specialization)
  const navigationLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/about", label: "About", icon: Info },
    { href: "/contact", label: "Contact", icon: Mail },
  ]

  if (user?.role === "admin") {
    // Remove Appointments link if present
    const appointmentsIndex = navigationLinks.findIndex(link => link.label === "Appointments")
    if (appointmentsIndex !== -1) {
      navigationLinks.splice(appointmentsIndex, 1)
    }
    // Ensure Contact link remains
    if (!navigationLinks.find(link => link.label === "Contact")) {
      navigationLinks.push({ href: "/contact", label: "Contact", icon: Mail })
    }
  } else {
    navigationLinks.push({ href: appointmentsHref, label: "Appointments", icon: Clock })
  }

  // Add Tests link for non-doctor users (patients) as normal link, but remove if admin
  if (!user?.specialization && user?.role !== "admin") {
    navigationLinks.push({ href: "/tests", label: "Tests", icon: TestTube })
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-x-hidden" style={{ top: 'constant(safe-area-inset-top)', paddingTop: 'env(safe-area-inset-top)', WebkitPaddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex w-full px-4 sm:px-6 md:px-8 h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Building2 className="h-6 w-6 text-white" />
          </div>
        </Link>
        <nav className="hidden md:flex items-center space-x-6">
          {navigationLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {user?.specialization && user?.role !== "admin" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                Tests
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link href="/doctor/tests">Create Tests</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/doctor/testsview">View Tests</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
        <div className="flex items-center space-x-4">
          {loading ? (
            <span>Loading user...</span>
          ) : user ? (
            user.role === "admin" ? (
              <div className="flex items-center space-x-3">
                <Link href="/administrator" className="text-sm font-semibold text-red-600 hover:underline">
                  Admin Dashboard
                </Link>
                <span className="text-sm font-semibold text-red-600">Admin</span>
                <Button onClick={handleLogout} variant="ghost" size="sm">
                  Log out
                </Button>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name || "User"} />
                      <AvatarFallback>
                        {(user.name && user.name[0]) || (user.email && user.email[0]) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name || user.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href={user && user.specialization ? "/doctor/profile" : "/profile"}
                      className="flex items-center"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
          ) : (
            <Button onClick={handleLogin} size="sm">
              Log in
            </Button>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="bottom" className="md:hidden w-56">
            {navigationLinks.map((link) => {
              const IconComponent = link.icon
              return (
                <DropdownMenuItem asChild key={link.href}>
                  <Link href={link.href} className="flex items-center space-x-3">
                    <IconComponent className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                </DropdownMenuItem>
              )
            })}
            {user?.specialization && user?.role !== "admin" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Tests</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/doctor/tests">Create Tests</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/doctor/testsview">View Tests</Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            {loading ? (
              <DropdownMenuItem disabled>Loading user...</DropdownMenuItem>
            ) : user ? (
              user.role === "admin" ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/administrator">Admin Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>Admin</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href={user.specialization ? "/doctor/profile" : "/profile"}>Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
                </>
              )
            ) : (
              <DropdownMenuItem onClick={handleLogin}>Log in</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
