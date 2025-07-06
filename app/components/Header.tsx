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
import { User, LogOut, Settings, Home, Info, Mail, Menu, X, Clock } from "lucide-react"
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

  const navigationLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/about", label: "About", icon: Info },
    { href: "/contact", label: "Contact", icon: Mail },
  ]

const appointmentsHref = user?.specialization ? "/doctor/appointments" : "/appointments"

  // If user is staff/admin, do not show profile and appointments links except Contact
  if (user?.role === "admin") {
    navigationLinks.splice(
      navigationLinks.findIndex(link => link.label === "Appointments"),
      1
    )
    // Ensure Contact link remains
    if (!navigationLinks.find(link => link.label === "Contact")) {
      navigationLinks.push({ href: "/contact", label: "Contact", icon: Mail })
    }
  } else {
    navigationLinks.push({ href: appointmentsHref, label: "Appointments", icon: Clock })
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">L</span>
          </div>
          <span className="font-bold text-xl">Logo</span>
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
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
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
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="flex flex-col space-y-3">
              <nav className="container py-4 px-4">
                {navigationLinks.map((link) => {
                  const IconComponent = link.icon
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center space-x-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{link.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
