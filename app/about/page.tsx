"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen,
  Users,
  Award,
  Building,
  Heart,
  Target,
  Eye,
  Handshake,
  Calendar,
  Globe,
  Leaf,
  Shield,
  GraduationCap,
  Briefcase,
  Star,
  History,
  Building2,
  UserCheck,
  Stethoscope,
  Activity,
  Lightbulb,
  Users2,
  Phone,
  Mail,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"

// Smooth Animation Components
function SmoothReveal({
  children,
  delay = 0,
  direction = "up",
  distance = 40,
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  direction?: "up" | "down" | "left" | "right"
  distance?: number
  className?: string
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setTimeout(() => {
            setIsVisible(true)
            setHasAnimated(true)
          }, delay)
        }
      },
      { threshold: 0.15, rootMargin: "-20px" },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [delay, hasAnimated])

  const getTransform = () => {
    if (isVisible) return "translate3d(0, 0, 0) scale(1)"

    switch (direction) {
      case "up":
        return `translate3d(0, ${distance}px, 0) scale(0.95)`
      case "down":
        return `translate3d(0, -${distance}px, 0) scale(0.95)`
      case "left":
        return `translate3d(${distance}px, 0, 0) scale(0.95)`
      case "right":
        return `translate3d(-${distance}px, 0, 0) scale(0.95)`
      default:
        return `translate3d(0, ${distance}px, 0) scale(0.95)`
    }
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      }}
    >
      {children}
    </div>
  )
}

function SmoothHover({
  children,
  scale = 1.02,
  className = "",
}: {
  children: React.ReactNode
  scale?: number
  className?: string
}) {
  return (
    <div
      className={`${className} transition-all duration-300 ease-out hover:scale-[${scale}] hover:shadow-lg`}
      style={{
        transition: "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.3s ease",
      }}
    >
      {children}
    </div>
  )
}

function SmoothFloat({
  children,
  intensity = 10,
  className = "",
}: {
  children: React.ReactNode
  intensity?: number
  className?: string
}) {
  const [offset, setOffset] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect()
        const scrolled = window.scrollY
        const rate = scrolled * -0.5
        const yPos = Math.sin((scrolled + rect.top) * 0.01) * intensity
        setOffset(rate + yPos)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [intensity])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `translate3d(0, ${offset}px, 0)`,
        transition: "transform 0.1s ease-out",
      }}
    >
      {children}
    </div>
  )
}

function SmoothProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      const currentProgress = Math.min((window.scrollY / totalHeight) * 100, 100)
      setProgress(currentProgress)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState("history")

  const historyRef = useRef<HTMLDivElement>(null)
  const leadershipRef = useRef<HTMLDivElement>(null)
  const valuesRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<HTMLDivElement>(null)

  const scrollToSection = (tabId: string) => {
    setActiveTab(tabId)

    const refs = {
      history: historyRef,
      leadership: leadershipRef,
      values: valuesRef,
      recognition: recognitionRef,
    }

    const targetRef = refs[tabId as keyof typeof refs]
    if (targetRef.current) {
      const yOffset = -120 // Account for sticky header
      const y = targetRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset

      window.scrollTo({
        top: y,
        behavior: "smooth",
      })
    }
  }

  // Hospital history timeline
  const timeline = [
    {
      year: "1998",
      title: "Foundation",
      description:
        "St. Mary's Medical Center was established with a vision to provide compassionate healthcare to our community.",
      icon: Building,
      color: "bg-blue-500",
    },
    {
      year: "2003",
      title: "First Expansion",
      description: "Added the Emergency Department and expanded to 150 beds to serve growing community needs.",
      icon: Building2,
      color: "bg-green-500",
    },
    {
      year: "2008",
      title: "Technology Advancement",
      description: "Introduced state-of-the-art imaging technology and electronic health records system.",
      icon: Activity,
      color: "bg-purple-500",
    },
    {
      year: "2012",
      title: "Cardiac Center",
      description: "Opened the dedicated Cardiac Care Center with advanced surgical capabilities.",
      icon: Heart,
      color: "bg-red-500",
    },
    {
      year: "2018",
      title: "Research Institute",
      description: "Established the Medical Research Institute focusing on innovative treatments and clinical trials.",
      icon: GraduationCap,
      color: "bg-orange-500",
    },
    {
      year: "2023",
      title: "Sustainability Initiative",
      description: "Launched comprehensive green healthcare program, becoming carbon-neutral certified.",
      icon: Leaf,
      color: "bg-emerald-500",
    },
  ]

  // Leadership team
  const leadership = [
    {
      name: "Dr. Margaret Thompson",
      position: "Chief Executive Officer",
      tenure: "2019 - Present",
      background: "Former Director of Operations at Johns Hopkins Medical Center",
      education: "MBA Healthcare Management, Wharton School",
      avatar: "/placeholder.svg?height=120&width=120",
      achievements: ["Healthcare Innovation Award 2022", "Community Leadership Recognition"],
    },
    {
      name: "Dr. Robert Chen",
      position: "Chief Medical Officer",
      tenure: "2020 - Present",
      background: "20+ years in emergency medicine and hospital administration",
      education: "MD, Harvard Medical School",
      avatar: "/placeholder.svg?height=120&width=120",
      achievements: ["Patient Safety Excellence Award", "Medical Leadership Certificate"],
    },
    {
      name: "Sarah Williams, RN",
      position: "Chief Nursing Officer",
      tenure: "2017 - Present",
      background: "Nursing leadership with focus on patient care quality and staff development",
      education: "MSN, Nursing Administration",
      avatar: "/placeholder.svg?height=120&width=120",
      achievements: ["Nursing Excellence Award", "Magnet Recognition Program Leader"],
    },
    {
      name: "Michael Rodriguez",
      position: "Chief Financial Officer",
      tenure: "2021 - Present",
      background: "Healthcare finance expert with focus on operational efficiency",
      education: "CPA, MBA Finance",
      avatar: "/placeholder.svg?height=120&width=120",
      achievements: ["Healthcare Financial Management Award", "Cost Optimization Excellence"],
    },
  ]

  // Organizational values and culture
  const values = [
    {
      title: "Patient-Centered Care",
      description:
        "Every decision we make prioritizes the well-being, dignity, and comfort of our patients and their families.",
      icon: Heart,
      color: "from-red-500 to-pink-500",
      stats: "98% Patient Satisfaction",
    },
    {
      title: "Clinical Excellence",
      description:
        "We maintain the highest standards of medical care through continuous education, research, and innovation.",
      icon: Award,
      color: "from-blue-500 to-cyan-500",
      stats: "5-Star Quality Rating",
    },
    {
      title: "Community Partnership",
      description: "We actively engage with our community to understand and address local health needs and challenges.",
      icon: Handshake,
      color: "from-green-500 to-emerald-500",
      stats: "50+ Community Programs",
    },
    {
      title: "Environmental Stewardship",
      description:
        "We are committed to sustainable healthcare practices that protect our environment for future generations.",
      icon: Leaf,
      color: "from-emerald-500 to-teal-500",
      stats: "Carbon Neutral Since 2023",
    },
  ]

  // Organizational statistics
  const orgStats = [
    { label: "Years of Service", value: 25, icon: Calendar, color: "text-blue-600" },
    { label: "Total Employees", value: 1200, icon: Users, color: "text-green-600" },
    { label: "Medical Staff", value: 180, icon: Stethoscope, color: "text-purple-600" },
    { label: "Annual Patients", value: 75000, icon: UserCheck, color: "text-orange-600" },
    { label: "Community Programs", value: 52, icon: Globe, color: "text-teal-600" },
    { label: "Research Studies", value: 28, icon: BookOpen, color: "text-indigo-600" },
  ]

  // Accreditations and certifications
  const accreditations = [
    {
      name: "Joint Commission Accreditation",
      description: "Gold Seal of Approval for quality and safety",
      year: "2023",
      icon: Shield,
    },
    {
      name: "Magnet Recognition",
      description: "Excellence in nursing services and patient outcomes",
      year: "2022",
      icon: Star,
    },
    {
      name: "HIMSS Stage 7",
      description: "Highest level of electronic health record adoption",
      year: "2021",
      icon: Activity,
    },
    {
      name: "Green Healthcare Certification",
      description: "Environmental sustainability in healthcare operations",
      year: "2023",
      icon: Leaf,
    },
  ]

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        { id: "history", ref: historyRef },
        { id: "leadership", ref: leadershipRef },
        { id: "values", ref: valuesRef },
        { id: "recognition", ref: recognitionRef },
      ]

      const scrollPosition = window.scrollY + 200

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i]
        if (section.ref.current) {
          const sectionTop = section.ref.current.offsetTop
          if (scrollPosition >= sectionTop) {
            setActiveTab(section.id)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <SmoothProgress />

      {/* Header Section - Distinct from home page */}
      <section className="relative py-16 px-4 bg-gradient-to-br from-slate-800 via-gray-800 to-slate-900 text-white overflow-hidden">
        <SmoothFloat intensity={15} className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/placeholder.svg?height=600&width=1200')] bg-cover bg-center opacity-10"></div>
        </SmoothFloat>
        <div className="container mx-auto relative z-10">
          <SmoothReveal direction="down" distance={60}>
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center transition-all duration-500 hover:bg-white/20 hover:scale-110">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">About St. Mary's Medical Center</h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Discover our story, mission, and the dedicated people who make exceptional healthcare possible in our
                community.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Badge
                  variant="secondary"
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 transition-colors duration-300"
                >
                  <History className="w-4 h-4 mr-1" />
                  Established 1998
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 transition-colors duration-300"
                >
                  <Users className="w-4 h-4 mr-1" />
                  1,200+ Team Members
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 transition-colors duration-300"
                >
                  <Award className="w-4 h-4 mr-1" />
                  Nationally Recognized
                </Badge>
              </div>
            </div>
          </SmoothReveal>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto py-4 space-x-8">
            {[
              { id: "history", label: "Our History", icon: History },
              { id: "leadership", label: "Leadership", icon: Users2 },
              { id: "values", label: "Values & Culture", icon: Heart },
              { id: "recognition", label: "Recognition", icon: Award },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => scrollToSection(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-300 ease-out ${
                  activeTab === tab.id
                    ? "bg-blue-100 text-blue-700 font-medium scale-105"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:scale-102"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <SmoothReveal direction="up" distance={40}>
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <SmoothHover scale={1.01}>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 transition-all duration-500 hover:shadow-xl">
                  <Target className="h-12 w-12 text-blue-600 mx-auto mb-4 transition-transform duration-300 hover:scale-110" />
                  <p className="text-xl text-gray-700 leading-relaxed mb-6">
                    "To provide exceptional, compassionate healthcare services that improve the health and well-being of
                    our community, while advancing medical knowledge through research, education, and innovation."
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <SmoothHover>
                      <div className="text-center p-4 rounded-lg transition-all duration-300 hover:bg-white/50">
                        <Eye className="h-8 w-8 text-blue-600 mx-auto mb-2 transition-transform duration-300 hover:scale-110" />
                        <h3 className="font-semibold text-gray-900 mb-1">Vision</h3>
                        <p className="text-sm text-gray-600">To be the leading healthcare provider in our region</p>
                      </div>
                    </SmoothHover>
                    <SmoothHover>
                      <div className="text-center p-4 rounded-lg transition-all duration-300 hover:bg-white/50">
                        <Heart className="h-8 w-8 text-blue-600 mx-auto mb-2 transition-transform duration-300 hover:scale-110" />
                        <h3 className="font-semibold text-gray-900 mb-1">Purpose</h3>
                        <p className="text-sm text-gray-600">Healing, caring, and improving lives every day</p>
                      </div>
                    </SmoothHover>
                    <SmoothHover>
                      <div className="text-center p-4 rounded-lg transition-all duration-300 hover:bg-white/50">
                        <Handshake className="h-8 w-8 text-blue-600 mx-auto mb-2 transition-transform duration-300 hover:scale-110" />
                        <h3 className="font-semibold text-gray-900 mb-1">Promise</h3>
                        <p className="text-sm text-gray-600">Treating every patient like family</p>
                      </div>
                    </SmoothHover>
                  </div>
                </div>
              </SmoothHover>
            </div>
          </SmoothReveal>
        </div>
      </section>

      {/* Organizational Statistics */}
      <section className="py-16 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto">
          <SmoothReveal direction="up" distance={40}>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">By the Numbers</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Our commitment to excellence is reflected in our growth, our people, and our impact on the community.
              </p>
            </div>
          </SmoothReveal>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {orgStats.map((stat, index) => (
              <SmoothReveal key={index} delay={index * 100} direction="up" distance={30}>
                <SmoothHover scale={1.05}>
                  <Card className="text-center border-0 shadow-lg bg-white transition-all duration-500 hover:shadow-xl">
                    <CardContent className="pt-6">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 transition-all duration-300 hover:bg-gray-200">
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        <CountUp end={stat.value} />
                        {stat.value >= 1000 ? "+" : ""}
                      </div>
                      <div className="text-xs text-gray-600">{stat.label}</div>
                    </CardContent>
                  </Card>
                </SmoothHover>
              </SmoothReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Content Based on Active Tab */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          {activeTab === "history" && (
            <div className="space-y-12" ref={historyRef}>
              <SmoothReveal direction="up" distance={40}>
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Journey</h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    From a small community hospital to a leading medical center, our story is one of growth, innovation,
                    and unwavering commitment to our patients.
                  </p>
                </div>
              </SmoothReveal>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>

                <div className="space-y-12">
                  {timeline.map((event, index) => (
                    <SmoothReveal
                      key={index}
                      delay={index * 150}
                      direction={index % 2 === 0 ? "left" : "right"}
                      distance={50}
                    >
                      <div className="relative flex items-start gap-8">
                        <div
                          className={`flex-shrink-0 w-16 h-16 rounded-full ${event.color} flex items-center justify-center text-white shadow-lg z-10 transition-all duration-300 hover:scale-110`}
                        >
                          <event.icon className="h-8 w-8" />
                        </div>
                        <SmoothHover scale={1.02}>
                          <Card className="flex-1 shadow-lg border-0 transition-all duration-500 hover:shadow-xl">
                            <CardContent className="p-6">
                              <div className="flex items-center gap-3 mb-3">
                                <Badge
                                  variant="outline"
                                  className="font-mono text-sm transition-colors duration-300 hover:bg-gray-100"
                                >
                                  {event.year}
                                </Badge>
                                <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                              </div>
                              <p className="text-gray-600 leading-relaxed">{event.description}</p>
                            </CardContent>
                          </Card>
                        </SmoothHover>
                      </div>
                    </SmoothReveal>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "leadership" && (
            <div className="space-y-12" ref={leadershipRef}>
              <SmoothReveal direction="up" distance={40}>
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Leadership Team</h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Our experienced leadership team brings together decades of healthcare expertise, innovation, and
                    commitment to excellence.
                  </p>
                </div>
              </SmoothReveal>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {leadership.map((leader, index) => (
                  <SmoothReveal
                    key={index}
                    delay={index * 150}
                    direction={index % 2 === 0 ? "left" : "right"}
                    distance={40}
                  >
                    <SmoothHover scale={1.02}>
                      <Card className="border-0 shadow-lg transition-all duration-500 hover:shadow-xl overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4 mb-4">
                            <Avatar className="h-20 w-20 ring-4 ring-blue-100 transition-all duration-300 hover:ring-blue-200 hover:scale-105">
                              <AvatarImage src={leader.avatar || "/placeholder.svg"} alt={leader.name} />
                              <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                {leader.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-gray-900 mb-1">{leader.name}</h3>
                              <p className="text-blue-600 font-medium mb-1">{leader.position}</p>
                              <p className="text-sm text-gray-500">{leader.tenure}</p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">Background</h4>
                              <p className="text-sm text-gray-600">{leader.background}</p>
                            </div>

                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">Education</h4>
                              <p className="text-sm text-gray-600">{leader.education}</p>
                            </div>

                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Key Achievements</h4>
                              <div className="flex flex-wrap gap-1">
                                {leader.achievements.map((achievement, i) => (
                                  <Badge
                                    key={i}
                                    variant="secondary"
                                    className="text-xs transition-colors duration-300 hover:bg-blue-100"
                                  >
                                    {achievement}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </SmoothHover>
                  </SmoothReveal>
                ))}
              </div>
            </div>
          )}

          {activeTab === "values" && (
            <div className="space-y-12" ref={valuesRef}>
              <SmoothReveal direction="up" distance={40}>
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values & Culture</h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    These core values guide every decision we make and every interaction we have with patients,
                    families, and each other.
                  </p>
                </div>
              </SmoothReveal>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {values.map((value, index) => (
                  <SmoothReveal key={index} delay={index * 150} direction="up" distance={40}>
                    <SmoothHover scale={1.02}>
                      <Card className="border-0 shadow-lg transition-all duration-500 hover:shadow-xl overflow-hidden group">
                        <div className={`h-2 bg-gradient-to-r ${value.color}`}></div>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4 mb-4">
                            <div
                              className={`h-12 w-12 rounded-lg bg-gradient-to-br ${value.color} flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
                            >
                              <value.icon className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                              <p className="text-gray-600 leading-relaxed mb-3">{value.description}</p>
                              <Badge
                                variant="outline"
                                className="text-xs font-medium transition-colors duration-300 hover:bg-gray-100"
                              >
                                {value.stats}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </SmoothHover>
                  </SmoothReveal>
                ))}
              </div>

              {/* Culture Highlights */}
              <SmoothReveal delay={600} direction="up" distance={40}>
                <SmoothHover scale={1.01}>
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 transition-all duration-500 hover:shadow-xl">
                    <CardContent className="p-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Our Culture in Action</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SmoothHover>
                          <div className="text-center p-4 rounded-lg transition-all duration-300 hover:bg-white/50">
                            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4 transition-all duration-300 hover:bg-blue-200 hover:scale-110">
                              <GraduationCap className="h-8 w-8 text-blue-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">Continuous Learning</h4>
                            <p className="text-sm text-gray-600">Over 40 hours of annual training per employee</p>
                          </div>
                        </SmoothHover>
                        <SmoothHover>
                          <div className="text-center p-4 rounded-lg transition-all duration-300 hover:bg-white/50">
                            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 transition-all duration-300 hover:bg-green-200 hover:scale-110">
                              <Users2 className="h-8 w-8 text-green-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">Team Collaboration</h4>
                            <p className="text-sm text-gray-600">Interdisciplinary care teams for every patient</p>
                          </div>
                        </SmoothHover>
                        <SmoothHover>
                          <div className="text-center p-4 rounded-lg transition-all duration-300 hover:bg-white/50">
                            <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4 transition-all duration-300 hover:bg-purple-200 hover:scale-110">
                              <Lightbulb className="h-8 w-8 text-purple-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">Innovation Focus</h4>
                            <p className="text-sm text-gray-600">Employee-driven improvement initiatives</p>
                          </div>
                        </SmoothHover>
                      </div>
                    </CardContent>
                  </Card>
                </SmoothHover>
              </SmoothReveal>
            </div>
          )}

          {activeTab === "recognition" && (
            <div className="space-y-12" ref={recognitionRef}>
              <SmoothReveal direction="up" distance={40}>
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Awards & Recognition</h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Our commitment to excellence has been recognized by leading healthcare organizations and
                    accreditation bodies.
                  </p>
                </div>
              </SmoothReveal>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {accreditations.map((accreditation, index) => (
                  <SmoothReveal key={index} delay={index * 150} direction="up" distance={40}>
                    <SmoothHover scale={1.02}>
                      <Card className="border-0 shadow-lg transition-all duration-500 hover:shadow-xl group">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                              <accreditation.icon className="h-8 w-8" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">{accreditation.name}</h3>
                                <Badge
                                  variant="outline"
                                  className="text-xs transition-colors duration-300 hover:bg-gray-100"
                                >
                                  {accreditation.year}
                                </Badge>
                              </div>
                              <p className="text-gray-600">{accreditation.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </SmoothHover>
                  </SmoothReveal>
                ))}
              </div>

              {/* Quality Metrics */}
              <SmoothReveal delay={600} direction="up" distance={40}>
                <SmoothHover scale={1.01}>
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 transition-all duration-500 hover:shadow-xl">
                    <CardContent className="p-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Quality Performance</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                          { label: "Patient Safety Score", value: 95, color: "bg-green-500" },
                          { label: "Clinical Quality", value: 92, color: "bg-blue-500" },
                          { label: "Patient Experience", value: 98, color: "bg-purple-500" },
                          { label: "Efficiency Rating", value: 89, color: "bg-orange-500" },
                        ].map((metric, index) => (
                          <div key={index} className="text-center">
                            <div className="mb-3">
                              <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}%</div>
                              <Progress value={metric.value} className="h-2" />
                            </div>
                            <p className="text-sm font-medium text-gray-700">{metric.label}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </SmoothHover>
              </SmoothReveal>
            </div>
          )}
        </div>
      </section>

      {/* Contact Information for About Page */}
      <section className="py-16 px-4 bg-gradient-to-br from-slate-800 to-gray-900 text-white overflow-hidden">
        <SmoothFloat intensity={20} className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10" />
        </SmoothFloat>
        <div className="container mx-auto relative z-10">
          <SmoothReveal direction="up" distance={40}>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Learn More About Us</h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Have questions about our organization, leadership, or want to explore partnership opportunities?
              </p>
            </div>
          </SmoothReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <SmoothReveal delay={200} direction="up" distance={30}>
              <SmoothHover scale={1.05}>
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white transition-all duration-500 hover:bg-white/20">
                  <CardContent className="p-6 text-center">
                    <Phone className="h-8 w-8 mx-auto mb-4 text-blue-400 transition-transform duration-300 hover:scale-110" />
                    <h3 className="text-lg font-semibold mb-2">Administration</h3>
                    <p className="text-gray-300 mb-2">(555) 123-4567</p>
                    <p className="text-sm text-gray-400">Mon-Fri: 8AM-5PM</p>
                  </CardContent>
                </Card>
              </SmoothHover>
            </SmoothReveal>

            <SmoothReveal delay={400} direction="up" distance={30}>
              <SmoothHover scale={1.05}>
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white transition-all duration-500 hover:bg-white/20">
                  <CardContent className="p-6 text-center">
                    <Mail className="h-8 w-8 mx-auto mb-4 text-green-400 transition-transform duration-300 hover:scale-110" />
                    <h3 className="text-lg font-semibold mb-2">Media Inquiries</h3>
                    <p className="text-gray-300 mb-2">media@stmarys.com</p>
                    <p className="text-sm text-gray-400">Press & Communications</p>
                  </CardContent>
                </Card>
              </SmoothHover>
            </SmoothReveal>

            <SmoothReveal delay={600} direction="up" distance={30}>
              <SmoothHover scale={1.05}>
                <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white transition-all duration-500 hover:bg-white/20">
                  <CardContent className="p-6 text-center">
                    <Briefcase className="h-8 w-8 mx-auto mb-4 text-purple-400 transition-transform duration-300 hover:scale-110" />
                    <h3 className="text-lg font-semibold mb-2">Partnerships</h3>
                    <p className="text-gray-300 mb-2">partnerships@stmarys.com</p>
                    <p className="text-sm text-gray-400">Business Development</p>
                  </CardContent>
                </Card>
              </SmoothHover>
            </SmoothReveal>
          </div>
        </div>
      </section>
    </div>
  )
}

// CountUp component for statistics
function CountUp({ end, duration = 2000, delay = 0 }: { end: number; duration?: number; delay?: number }) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true)
          setTimeout(() => {
            let start = 0
            const increment = end / (duration / 16)
            const timer = setInterval(() => {
              start += increment
              if (start >= end) {
                setCount(end)
                clearInterval(timer)
              } else {
                setCount(Math.floor(start))
              }
            }, 16)
          }, delay)
        }
      },
      { threshold: 0.1 },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [end, duration, delay, isVisible])

  return <span ref={ref}>{count.toLocaleString()}</span>
}
