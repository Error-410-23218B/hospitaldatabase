"use client"

import type React from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Heart,
  Users,
  Award,
  Clock,
  MapPin,
  Phone,
  Mail,
  Stethoscope,
  Building2,
  Star,
  Calendar,
  Shield,
  Microscope,
  Ambulance,
  UserCheck,
  Activity,
  CheckCircle,
  ArrowRight,
  Play,
  ChevronDown,
} from "lucide-react"
import { useEffect, useRef, useState, useCallback } from "react"

// Enhanced Smooth Animation Components
function SmoothScrollReveal({
  children,
  delay = 0,
  direction = "up",
  distance = 30,
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
    if (isVisible) return "translate3d(0, 0, 0) scale(1) rotateX(0deg)"

    switch (direction) {
      case "up":
        return `translate3d(0, ${distance}px, 0) scale(0.98) rotateX(5deg)`
      case "down":
        return `translate3d(0, -${distance}px, 0) scale(0.98) rotateX(-5deg)`
      case "left":
        return `translate3d(${distance}px, 0, 0) scale(0.98) rotateY(-5deg)`
      case "right":
        return `translate3d(-${distance}px, 0, 0) scale(0.98) rotateY(5deg)`
      default:
        return `translate3d(0, ${distance}px, 0) scale(0.98) rotateX(5deg)`
    }
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: "all 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
    >
      {children}
    </div>
  )
}

function TactileFloat({
  children,
  intensity = 15,
  speed = 0.3,
  className = "",
}: {
  children: React.ReactNode
  intensity?: number
  speed?: number
  className?: string
}) {
  const [scrollY, setScrollY] = useState(0)
  const [elementTop, setElementTop] = useState(0)
  const [isInView, setIsInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>()

  const updatePosition = useCallback(() => {
    if (ref.current && isInView) {
      const rect = ref.current.getBoundingClientRect()
      const scrolled = window.scrollY
      setScrollY(scrolled)
      setElementTop(rect.top + scrolled)
    }
  }, [isInView])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      { threshold: 0.1 },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isInView) return

    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      rafRef.current = requestAnimationFrame(updatePosition)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    updatePosition()

    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [isInView, updatePosition])

  const yPos = (scrollY - elementTop) * speed
  const floatY = Math.sin((scrollY - elementTop) * 0.008) * intensity
  const rotateX = Math.sin((scrollY - elementTop) * 0.005) * 2

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `translate3d(0, ${yPos + floatY}px, 0) rotateX(${rotateX}deg)`,
        transition: isInView ? "none" : "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        transformStyle: "preserve-3d",
      }}
    >
      {children}
    </div>
  )
}

function TactileHover({
  children,
  strength = 0.1,
  className = "",
}: {
  children: React.ReactNode
  strength?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isHoveredRef = useRef(false)
  const isPressedRef = useRef(false)
  const rafRef = useRef<number>()
  const translateRef = useRef({ x: 0, y: 0 })

  const updateTransform = useCallback(
    (clientX: number, clientY: number) => {
      if (!ref.current) return

      const rect = ref.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const deltaX = (clientX - centerX) * strength
      const deltaY = (clientY - centerY) * strength

      translateRef.current = { x: deltaX, y: deltaY }

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        if (!ref.current) return

        const scale = isPressedRef.current ? 0.98 : isHoveredRef.current ? 1.02 : 1

        ref.current.style.transform = `translate3d(${translateRef.current.x}px, ${translateRef.current.y}px, 0) scale(${scale})`
        ref.current.style.transition = isHoveredRef.current
          ? "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
          : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
        ref.current.style.willChange = "transform"
      })
    },
    [strength],
  )

  const handleMouseMove = (e: React.MouseEvent) => {
    updateTransform(e.clientX, e.clientY)
  }

  const handleMouseEnter = () => {
    isHoveredRef.current = true
  }

  const handleMouseLeave = () => {
    isHoveredRef.current = false
    isPressedRef.current = false
    translateRef.current = { x: 0, y: 0 }
    if (ref.current) {
      ref.current.style.transform = "none"
      ref.current.style.transition = "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
      ref.current.style.willChange = "transform"
    }
  }

  const handleMouseDown = () => {
    isPressedRef.current = true
    if (ref.current) {
      ref.current.style.transform = `translate3d(${translateRef.current.x}px, ${translateRef.current.y}px, 0) scale(0.98)`
    }
  }

  const handleMouseUp = () => {
    isPressedRef.current = false
    if (ref.current) {
      const scale = isHoveredRef.current ? 1.02 : 1
      ref.current.style.transform = `translate3d(${translateRef.current.x}px, ${translateRef.current.y}px, 0) scale(${scale})`
    }
  }

  return (
    <div
      ref={ref}
      className={`${className} cursor-pointer`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {children}
    </div>
  )
}

function SmoothRotate({
  children,
  speed = 0.05,
  className = "",
}: {
  children: React.ReactNode
  speed?: number
  className?: string
}) {
  const [rotation, setRotation] = useState(0)
  const [isInView, setIsInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>()

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      { threshold: 0.1 },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isInView) return

    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect()
          const scrolled = window.scrollY
          const elementTop = rect.top + scrolled
          const rotation = (scrolled - elementTop) * speed
          setRotation(rotation)
        }
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [speed, isInView])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `rotate(${rotation}deg)`,
        transition: "transform 0.1s ease-out",
      }}
    >
      {children}
    </div>
  )
}

function FluidWave({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null
    const observer = new IntersectionObserver(
      ([entry]) => {
        console.log("FluidWave IntersectionObserver entry:", entry.isIntersecting)
        if (entry.isIntersecting) {
          timeoutId = setTimeout(() => setIsVisible(true), delay)
        }
      },
      { threshold: 0.1 },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    // Fallback: if IntersectionObserver does not trigger within 1 second, force visible
    const fallbackTimeout = setTimeout(() => {
      if (!isVisible) {
        console.log("FluidWave fallback triggered")
        setIsVisible(true)
      }
    }, 1000 + delay)

    return () => {
      observer.disconnect()
      if (timeoutId) clearTimeout(timeoutId)
      clearTimeout(fallbackTimeout)
    }
  }, [delay, isVisible])

  return (
    <div
      ref={ref}
      className={`${className} overflow-hidden`}
      style={{
        clipPath: isVisible
          ? "polygon(0 0, 100% 0, 100% 100%, 0 100%)"
          : "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)",
        transition: "clip-path 1.4s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {children}
    </div>
  )
}

function SmoothTypewriter({
  text,
  speed = 40,
  delay = 0,
  className = "",
}: {
  text: string
  speed?: number
  delay?: number
  className?: string
}) {
  const [displayText, setDisplayText] = useState("")
  const [isVisible, setIsVisible] = useState(false)
  const [showCursor, setShowCursor] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null
    const observer = new IntersectionObserver(
      ([entry]) => {
        console.log("SmoothTypewriter IntersectionObserver entry:", entry.isIntersecting)
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true)
          setTimeout(() => {
            let i = 0
            intervalId = setInterval(() => {
              setDisplayText(text.slice(0, i + 1))
              i++
              if (i >= text.length) {
                if (intervalId) clearInterval(intervalId)
                setTimeout(() => setShowCursor(false), 1000)
              }
            }, speed)
          }, delay)
        }
      },
      { threshold: 0.1 },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    // Fallback: if IntersectionObserver does not trigger within 1 second, force animation start
    const fallbackTimeout = setTimeout(() => {
      if (!isVisible) {
        console.log("SmoothTypewriter fallback triggered")
        setIsVisible(true)
        let i = 0
        intervalId = setInterval(() => {
          setDisplayText(text.slice(0, i + 1))
          i++
          if (i >= text.length) {
            if (intervalId) clearInterval(intervalId)
            setTimeout(() => setShowCursor(false), 1000)
          }
        }, speed)
      }
    }, 1000 + delay)

    return () => {
      observer.disconnect()
      if (intervalId) clearInterval(intervalId)
      clearTimeout(fallbackTimeout)
    }
  }, [text, speed, delay, isVisible])

  return (
    <span ref={ref} className={className}>
      {displayText}
      {showCursor && (
        <span className="inline-block w-0.5 h-8 bg-current ml-1 animate-pulse" style={{ animationDuration: "1s" }} />
      )}
    </span>
  )
}

function SmoothProgress() {
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number>()

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight
        const currentProgress = Math.min((window.scrollY / totalHeight) * 100, 100)
        setProgress(currentProgress)
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-200 to-gray-300 z-50">
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-lg"
        style={{
          width: `${progress}%`,
          transition: "width 0.1s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: "0 0 10px rgba(59, 130, 246, 0.5)",
        }}
      />
    </div>
  )
}

function TactileParticles({
  children,
  particleCount = 6,
  className = "",
}: {
  children: React.ReactNode
  particleCount?: number
  className?: string
}) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      })
    }
  }, [])

  const particles = Array.from({ length: particleCount }, (_, i) => {
    const baseX = Math.random() * 100
    const baseY = Math.random() * 100
    const attraction = 0.1
    const repulsion = 20

    const distanceX = mousePos.x - baseX
    const distanceY = mousePos.y - baseY
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)

    let finalX = baseX
    let finalY = baseY

    if (distance < repulsion) {
      finalX = baseX - (distanceX / distance) * (repulsion - distance) * attraction
      finalY = baseY - (distanceY / distance) * (repulsion - distance) * attraction
    }

    return (
      <div
        key={i}
        className="absolute w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-60"
        style={{
          left: `${finalX}%`,
          top: `${finalY}%`,
          transform: "translate(-50%, -50%)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          animationDelay: `${i * 0.2}s`,
          filter: "blur(0.5px)",
        }}
      />
    )
  })

  return (
    <div ref={containerRef} className={`relative ${className}`} onMouseMove={handleMouseMove}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">{particles}</div>
      {children}
    </div>
  )
}

function TactileButton({
  children,
  className = "",
  ...props
}: {
  children: React.ReactNode
  className?: string
  [key: string]: any
}) {
  const [isPressed, setIsPressed] = useState(false)
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPressed(true)

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const newRipple = { id: Date.now(), x, y }
      setRipples((prev) => [...prev, newRipple])

      setTimeout(() => {
        setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id))
      }, 600)
    }
  }

  const handleMouseUp = () => {
    setIsPressed(false)
  }

  return (
    <Button
      ref={buttonRef}
      className={`relative overflow-hidden ${className}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        transform: isPressed ? "scale(0.98)" : "scale(1)",
        transition: "transform 0.1s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      {...props}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full pointer-events-none animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
            animationDuration: "0.6s",
          }}
        />
      ))}
      {children}
    </Button>
  )
}

export default function AboutPage() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const services = [
    {
      name: "Emergency Care",
      description: "24/7 emergency medical services with state-of-the-art trauma center",
      icon: Ambulance,
      color: "text-red-600 bg-red-100",
      gradient: "from-red-500 to-pink-500",
      details: {
        overview:
          "Our Emergency Department operates 24/7 with a dedicated team of emergency physicians, nurses, and support staff ready to handle any medical emergency.",
        features: [
          "Level 1 Trauma Center certification",
          "Advanced life support ambulance services",
          "Helicopter emergency medical services",
          "Pediatric emergency care specialists",
          "Stroke and heart attack rapid response teams",
          "Mental health crisis intervention",
        ],
        equipment: [
          "Advanced cardiac monitors",
          "Digital X-ray and CT scan",
          "Ultrasound machines",
          "Ventilators and life support systems",
          "Emergency surgical suite",
          "Blood bank and laboratory services",
        ],
        waitTime: "Average wait time: 15 minutes",
        contact: "Emergency: 911 | Direct: (555) 123-4567",
      },
    },
    {
      name: "Cardiology",
      description: "Comprehensive heart care including surgery and rehabilitation",
      icon: Heart,
      color: "text-pink-600 bg-pink-100",
      gradient: "from-pink-500 to-rose-500",
      details: {
        overview:
          "Our Cardiology Department provides comprehensive cardiovascular care from prevention to complex surgical interventions, with board-certified cardiologists and cardiac surgeons.",
        features: [
          "Cardiac catheterization laboratory",
          "Electrophysiology studies",
          "Heart rhythm management",
          "Minimally invasive cardiac surgery",
          "Heart failure management program",
          "Cardiac rehabilitation services",
        ],
        equipment: [
          "Advanced cardiac catheterization labs",
          "3D echocardiography",
          "Cardiac MRI and CT",
          "Stress testing equipment",
          "Pacemaker and defibrillator implantation",
          "Robotic-assisted surgical systems",
        ],
        waitTime: "New patient appointments: 2-3 weeks",
        contact: "Cardiology: (555) 123-4568",
      },
    },
    {
      name: "General Practice",
      description: "Primary healthcare services for patients of all ages",
      icon: Stethoscope,
      color: "text-blue-600 bg-blue-100",
      gradient: "from-blue-500 to-cyan-500",
      details: {
        overview:
          "Our General Practice provides comprehensive primary care services for individuals and families, focusing on preventive care, health maintenance, and management of chronic conditions.",
        features: [
          "Annual physical examinations",
          "Preventive care and screenings",
          "Chronic disease management",
          "Immunizations and vaccinations",
          "Minor surgical procedures",
          "Health education and counseling",
        ],
        equipment: [
          "Digital examination rooms",
          "Electronic health records",
          "Point-of-care testing",
          "Spirometry equipment",
          "EKG machines",
          "Minor surgery suite",
        ],
        waitTime: "Same-day appointments available",
        contact: "General Practice: (555) 123-4569",
      },
    },
    {
      name: "Pediatrics",
      description: "Specialized medical care for infants, children, and adolescents",
      icon: Users,
      color: "text-green-600 bg-green-100",
      gradient: "from-green-500 to-emerald-500",
      details: {
        overview:
          "Our Pediatrics Department provides specialized medical care for children from birth through adolescence, with board-certified pediatricians and pediatric specialists.",
        features: [
          "Well-child checkups and immunizations",
          "Developmental assessments",
          "Pediatric emergency care",
          "Adolescent medicine",
          "Behavioral health services",
          "Specialized pediatric clinics",
        ],
        equipment: [
          "Child-friendly examination rooms",
          "Pediatric-specific medical equipment",
          "Growth and development tracking tools",
          "Pediatric emergency equipment",
          "Play therapy areas",
          "Family consultation rooms",
        ],
        waitTime: "Urgent care: Same day | Routine: 1-2 weeks",
        contact: "Pediatrics: (555) 123-4570",
      },
    },
    {
      name: "Surgery",
      description: "Advanced surgical procedures with minimally invasive techniques",
      icon: Activity,
      color: "text-purple-600 bg-purple-100",
      gradient: "from-purple-500 to-violet-500",
      details: {
        overview:
          "Our Surgery Department offers a full range of surgical services using the latest minimally invasive techniques and robotic-assisted procedures to ensure optimal patient outcomes.",
        features: [
          "Minimally invasive laparoscopic surgery",
          "Robotic-assisted procedures",
          "Orthopedic and joint replacement surgery",
          "General and specialized surgery",
          "Outpatient surgical procedures",
          "Pre and post-operative care",
        ],
        equipment: [
          "State-of-the-art operating rooms",
          "Da Vinci robotic surgical system",
          "Advanced laparoscopic equipment",
          "Intraoperative imaging systems",
          "Surgical navigation systems",
          "Recovery and monitoring equipment",
        ],
        waitTime: "Consultation: 1-2 weeks | Surgery scheduling varies",
        contact: "Surgery: (555) 123-4571",
      },
    },
    {
      name: "Laboratory Services",
      description: "Comprehensive diagnostic testing and pathology services",
      icon: Microscope,
      color: "text-orange-600 bg-orange-100",
      gradient: "from-orange-500 to-amber-500",
      details: {
        overview:
          "Our Laboratory Services provide comprehensive diagnostic testing with rapid turnaround times, utilizing the latest technology and staffed by certified laboratory professionals.",
        features: [
          "Clinical chemistry and hematology",
          "Microbiology and infectious disease testing",
          "Molecular diagnostics and genetics",
          "Pathology and cytology services",
          "Blood bank and transfusion services",
          "Point-of-care testing",
        ],
        equipment: [
          "Automated chemistry analyzers",
          "Advanced microscopy systems",
          "Molecular diagnostic platforms",
          "Blood typing and crossmatching systems",
          "Rapid diagnostic test equipment",
          "Quality control and monitoring systems",
        ],
        waitTime: "Routine results: 2-4 hours | Urgent: 30 minutes",
        contact: "Laboratory: (555) 123-4572",
      },
    },
  ]

  const doctors = [
    {
      name: "Dr. Sarah Johnson",
      specialization: "Chief of Cardiology",
      experience: "15+ years",
      education: "Harvard Medical School",
      avatar: "/placeholder.svg?height=100&width=100",
      achievements: ["Board Certified", "Research Publications: 50+", "Awards: 12"],
    },
    {
      name: "Dr. Michael Chen",
      specialization: "Emergency Medicine Director",
      experience: "12+ years",
      education: "Johns Hopkins University",
      avatar: "/placeholder.svg?height=100&width=100",
      achievements: ["Trauma Specialist", "Life Saver Award", "Teaching Excellence"],
    },
    {
      name: "Dr. Emily Rodriguez",
      specialization: "Pediatric Specialist",
      experience: "10+ years",
      education: "Stanford Medical School",
      avatar: "/placeholder.svg?height=100&width=100",
      achievements: ["Child Care Expert", "Community Service Award", "Research Leader"],
    },
    {
      name: "Dr. James Wilson",
      specialization: "Chief Surgeon",
      experience: "20+ years",
      education: "Mayo Clinic College",
      avatar: "/placeholder.svg?height=100&width=100",
      achievements: ["Surgical Innovation", "Patient Safety Award", "Mentor of the Year"],
    },
  ]

  const stats = [
    { label: "Patients Served Annually", value: 50000, suffix: "+", icon: Users },
    { label: "Medical Professionals", value: 200, suffix: "+", icon: UserCheck },
    { label: "Years of Service", value: 25, suffix: "+", icon: Calendar },
    { label: "Patient Satisfaction", value: 98, suffix: "%", icon: Star },
  ]

  const facilities = [
    {
      name: "Modern Patient Rooms",
      description: "Private rooms with advanced monitoring systems and family accommodations",
      features: ["Private bathrooms", "Entertainment systems", "Wi-Fi access", "Family seating"],
    },
    {
      name: "Advanced Surgical Suites",
      description: "State-of-the-art operating rooms with the latest medical technology",
      features: ["Robotic surgery", "Minimally invasive procedures", "Real-time imaging", "Sterile environment"],
    },
    {
      name: "Emergency Department",
      description: "24/7 emergency care with rapid response capabilities",
      features: ["Trauma center", "Fast-track care", "Helicopter pad", "Specialized units"],
    },
    {
      name: "Diagnostic Center",
      description: "Comprehensive imaging and laboratory services",
      features: ["MRI & CT scans", "Digital X-ray", "Ultrasound", "Laboratory testing"],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white overflow-hidden">
      <SmoothProgress />

      {/* Enhanced Floating Navigation */}
      <div
        className={`fixed top-20 right-4 z-40 transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${
          isScrolled ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
        }`}
        onClick={() => {
          window.scrollBy({ top: window.innerHeight, behavior: "smooth" })
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            window.scrollBy({ top: window.innerHeight, behavior: "smooth" })
          }
        }}
      >
        <TactileFloat intensity={8} speed={0.15}>
          <TactileHover strength={0.1}>
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-2xl border border-blue-100/50 hover:shadow-blue-500/20 transition-shadow duration-500 cursor-pointer">
              <ChevronDown className="h-5 w-5 text-blue-600 animate-bounce" />
            </div>
          </TactileHover>
        </TactileFloat>
      </div>

      {/* Hero Section with Enhanced Tactile Effects */}
      <section className="relative py-20 px-4 overflow-hidden">
        <TactileParticles particleCount={10} className="absolute inset-0" />

        <TactileFloat intensity={25} speed={0.25} className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/8 to-purple-600/8" />
        </TactileFloat>

        <div className="container mx-auto text-center relative z-10">
          <SmoothScrollReveal direction="down" distance={60}>
            <div className="flex justify-center mb-6">
              <SmoothRotate speed={0.03}>
                <TactileHover strength={0.15}>
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl hover:shadow-blue-500/30 transition-all duration-500">
                    <Building2 className="h-10 w-10 text-white" />
                  </div>
                </TactileHover>
              </SmoothRotate>
            </div>
          </SmoothScrollReveal>

          <FluidWave delay={300}>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                <SmoothTypewriter text="St. Mary's Medical Center" speed={60} delay={500} />
              </span>
            </h1>
          </FluidWave>

          <SmoothScrollReveal delay={800} direction="up" distance={40}>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Providing exceptional healthcare services to our community for over 25 years. Our commitment to
              excellence, compassion, and innovation drives everything we do.
            </p>
          </SmoothScrollReveal>

          <SmoothScrollReveal delay={1000} direction="up" distance={30}>
            <div className="flex flex-wrap justify-center gap-4">
              <TactileHover strength={0.12}>
                <TactileButton
                  asChild
                  size="lg"
                  className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <a href="/appointments" className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                    Book Appointment
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </a>
                </TactileButton>
              </TactileHover>
              <TactileHover strength={0.12}>
                <TactileButton
                  asChild
                  variant="outline"
                  size="lg"
                  className="group border-2 hover:bg-red-50 hover:border-red-500 hover:text-red-600 transition-all duration-300 bg-transparent"
                >
                  <a href="/contact" className="flex items-center">
                    <Phone className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                    Contact Us
                  </a>
                </TactileButton>
              </TactileHover>
            </div>
          </SmoothScrollReveal>
        </div>
      </section>

      {/* Mission & Values with Enhanced Tactile Cards */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <SmoothScrollReveal direction="up" distance={50}>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission & Values</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                We are dedicated to providing compassionate, high-quality healthcare that improves the lives of our
                patients and strengthens our community.
              </p>
            </div>
          </SmoothScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: "Compassionate Care",
                description:
                  "We treat every patient with dignity, respect, and empathy, ensuring they feel heard and cared for throughout their healthcare journey.",
                gradient: "from-blue-500 to-blue-600",
                bg: "from-white to-blue-50 hover:from-blue-50 hover:to-blue-100",
              },
              {
                icon: Award,
                title: "Excellence",
                description:
                  "We strive for the highest standards in medical care, continuously improving our services and embracing innovative treatments.",
                gradient: "from-green-500 to-green-600",
                bg: "from-white to-green-50 hover:from-green-50 hover:to-green-100",
              },
              {
                icon: Shield,
                title: "Integrity",
                description:
                  "We maintain the highest ethical standards, ensuring transparency, honesty, and accountability in all our interactions.",
                gradient: "from-purple-500 to-purple-600",
                bg: "from-white to-purple-50 hover:from-purple-50 hover:to-purple-100",
              },
            ].map((value, index) => (
              <SmoothScrollReveal key={index} delay={index * 150} direction="up" distance={40}>
                <TactileHover strength={0.08}>
                  <Card
                    className={`text-center border-0 shadow-lg bg-gradient-to-br ${value.bg} transition-all duration-700 hover:shadow-2xl`}
                  >
                    <CardContent className="pt-8">
                      <div
                        className={`h-16 w-16 rounded-full bg-gradient-to-br ${value.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg hover:scale-110 transition-transform duration-500`}
                      >
                        <value.icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                      <p className="text-gray-600">{value.description}</p>
                    </CardContent>
                  </Card>
                </TactileHover>
              </SmoothScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics with Smooth CountUp */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
        <TactileFloat intensity={18} speed={0.18} className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-purple-400/5" />
        </TactileFloat>

        <div className="container mx-auto relative z-10">
          <SmoothScrollReveal direction="up" distance={40}>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Impact</h2>
              <p className="text-gray-600">Numbers that reflect our commitment to community health</p>
            </div>
          </SmoothScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <SmoothScrollReveal key={index} delay={index * 100} direction="up" distance={50}>
                <TactileFloat intensity={8} speed={0.12}>
                  <TactileHover strength={0.06}>
                    <Card className="text-center border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:bg-white hover:shadow-2xl transition-all duration-700 group">
                      <CardContent className="pt-6">
                        <SmoothRotate speed={0.015}>
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-500">
                            <stat.icon className="h-6 w-6 text-white" />
                          </div>
                        </SmoothRotate>
                        <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                          <CountUp end={stat.value} delay={index * 150} />
                          {stat.suffix}
                        </div>
                        <div className="text-sm text-gray-600">{stat.label}</div>
                      </CardContent>
                    </Card>
                  </TactileHover>
                </TactileFloat>
              </SmoothScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Services with Enhanced Tactile Interactions and Popups */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <SmoothScrollReveal direction="up" distance={40}>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Services</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Comprehensive healthcare services delivered by experienced professionals using the latest medical
                technology.
              </p>
            </div>
          </SmoothScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <SmoothScrollReveal key={index} delay={index * 80} direction="up" distance={40}>
                <TactileFloat intensity={6} speed={0.08}>
                  <TactileHover strength={0.06}>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-700 group overflow-hidden relative cursor-pointer">
                          <div
                            className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-700`}
                          />
                          <CardContent className="pt-6 relative z-10">
                            <div
                              className={`h-12 w-12 rounded-lg ${service.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500`}
                            >
                              <service.icon className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-semibold mb-3 group-hover:text-gray-900 transition-colors duration-300">
                              {service.name}
                            </h3>
                            <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                              {service.description}
                            </p>
                            <div className="mt-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                              <div className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                                Learn More <ArrowRight className="h-4 w-4 ml-1" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-3 text-2xl">
                            <div className={`h-10 w-10 rounded-lg ${service.color} flex items-center justify-center`}>
                              <service.icon className="h-5 w-5" />
                            </div>
                            {service.name}
                          </DialogTitle>
                          <DialogDescription className="text-base mt-2">{service.details.overview}</DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                          <div>
                            <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              Services & Features
                            </h4>
                            <ul className="space-y-2">
                              {service.details.features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                              <Activity className="h-5 w-5 text-purple-600" />
                              Equipment & Technology
                            </h4>
                            <ul className="space-y-2">
                              {service.details.equipment.map((equipment, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                                  <span>{equipment}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                              <Clock className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="font-medium text-sm">Availability</p>
                                <p className="text-sm text-gray-600">{service.details.waitTime}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-medium text-sm">Contact</p>
                                <p className="text-sm text-gray-600">{service.details.contact}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                          <Link href="/appointments" className="flex-1">
                            <TactileButton className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                              <Calendar className="h-4 w-4 mr-2" />
                              Book Appointment
                            </TactileButton>
                          </Link>
                          <Link href="/contact" className="flex-1">
                            <TactileButton variant="outline" className="w-full">
                              <Phone className="h-4 w-4 mr-2" />
                              Contact Us
                            </TactileButton>
                          </Link>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TactileHover>
                </TactileFloat>
              </SmoothScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Medical Team with Smooth Alternating Reveals */}
      <section className="py-16 px-4 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        <TactileParticles particleCount={8} className="absolute inset-0" />

        <div className="container mx-auto relative z-10">
          <SmoothScrollReveal direction="up" distance={40}>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Medical Team</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Our experienced physicians and healthcare professionals are dedicated to providing you with the best
                possible care.
              </p>
            </div>
          </SmoothScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {doctors.map((doctor, index) => (
              <SmoothScrollReveal
                key={index}
                delay={index * 120}
                direction={index % 2 === 0 ? "left" : "right"}
                distance={50}
              >
                <TactileFloat intensity={10} speed={0.06}>
                  <TactileHover strength={0.08}>
                    <Card className="text-center border-0 shadow-xl bg-white hover:bg-gradient-to-br hover:from-white hover:to-blue-50 transition-all duration-700 group">
                      <CardContent className="pt-6">
                        <div className="relative mb-4">
                          <Avatar className="h-24 w-24 mx-auto ring-4 ring-blue-100 group-hover:ring-blue-200 transition-all duration-500 group-hover:scale-105">
                            <AvatarImage src={doctor.avatar || "/placeholder.svg"} alt={doctor.name} />
                            <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {doctor.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold mb-1">{doctor.name}</h3>
                        <p className="text-blue-600 font-medium mb-2">{doctor.specialization}</p>
                        <div className="space-y-1 text-sm text-gray-600 mb-4">
                          <p>{doctor.experience} experience</p>
                          <p>{doctor.education}</p>
                        </div>
                        <div className="space-y-1">
                          {doctor.achievements.map((achievement, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-xs hover:bg-blue-100 transition-colors duration-300"
                            >
                              {achievement}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TactileHover>
                </TactileFloat>
              </SmoothScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Facilities with Fluid Wave Reveals */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <SmoothScrollReveal direction="up" distance={40}>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">World-Class Facilities</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Our modern facilities are designed with patient comfort and safety in mind, featuring the latest medical
                technology.
              </p>
            </div>
          </SmoothScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {facilities.map((facility, index) => (
              <FluidWave key={index} delay={index * 200}>
                <TactileFloat intensity={8} speed={0.04}>
                  <TactileHover strength={0.04}>
                    <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-700 group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      <CardHeader className="relative z-10">
                        <CardTitle className="flex items-center gap-2 group-hover:text-blue-600 transition-colors duration-300">
                          <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-all duration-500 group-hover:scale-110">
                            <Building2 className="h-5 w-5 text-blue-600" />
                          </div>
                          {facility.name}
                        </CardTitle>
                        <CardDescription className="group-hover:text-gray-700 transition-colors duration-300">
                          {facility.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="grid grid-cols-2 gap-2">
                          {facility.features.map((feature, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-sm group-hover:text-gray-700 transition-colors duration-300"
                            >
                              <div className="w-2 h-2 rounded-full bg-green-500 group-hover:bg-green-600 transition-colors duration-300 animate-pulse" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                          <TactileButton variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 p-0">
                            Virtual Tour <Play className="h-4 w-4 ml-1" />
                          </TactileButton>
                        </div>
                      </CardContent>
                    </Card>
                  </TactileHover>
                </TactileFloat>
              </FluidWave>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Information with Enhanced Floating Elements */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 text-white relative overflow-hidden">
        <TactileParticles particleCount={12} className="absolute inset-0" />

        <TactileFloat intensity={35} speed={0.25} className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=1200')] bg-cover bg-center opacity-10" />
        </TactileFloat>

        <TactileFloat intensity={20} speed={0.15} className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
        </TactileFloat>

        <div className="container mx-auto relative z-10">
          <SmoothScrollReveal direction="up" distance={50}>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
              <p className="text-blue-100 max-w-2xl mx-auto">
                We're here to help. Reach out to us for appointments, questions, or emergency care.
              </p>
            </div>
          </SmoothScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Phone, title: "Phone", primary: "Main: (555) 123-4567", secondary: "Emergency: 911" },
              { icon: MapPin, title: "Address", primary: "123 Healthcare Drive", secondary: "Medical City, MC 12345" },
              { icon: Clock, title: "Hours", primary: "Emergency: 24/7", secondary: "Outpatient: 8AM - 6PM" },
            ].map((contact, index) => (
              <SmoothScrollReveal key={index} delay={index * 150} direction="up" distance={40}>
                <TactileFloat intensity={12} speed={0.08}>
                  <TactileHover strength={0.08}>
                    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-700 hover:scale-105">
                      <CardContent className="pt-6 text-center">
                        <SmoothRotate speed={0.02}>
                          <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 hover:bg-white/30 transition-colors duration-500">
                            <contact.icon className="h-6 w-6" />
                          </div>
                        </SmoothRotate>
                        <h3 className="text-lg font-semibold mb-2">{contact.title}</h3>
                        <p className="text-blue-100 mb-2">{contact.primary}</p>
                        <p className="text-blue-100">{contact.secondary}</p>
                      </CardContent>
                    </Card>
                  </TactileHover>
                </TactileFloat>
              </SmoothScrollReveal>
            ))}
          </div>

          <SmoothScrollReveal delay={600} direction="up" distance={30}>
            <div className="text-center mt-12">
              <div className="flex flex-wrap justify-center gap-4">
                <TactileHover strength={0.12}>
                  <Link href="/appointments">
                    <TactileButton
                      size="lg"
                      className="group bg-white text-blue-900 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-500"
                    >
                      <Calendar className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                      Schedule Appointment
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </TactileButton>
                  </Link>
                </TactileHover>
                <TactileHover strength={0.12}>
                  <Link href="/contact">
                    <TactileButton
                      variant="outline"
                      size="lg"
                      className="group text-white border-white hover:bg-white hover:text-blue-900 transition-all duration-500 bg-transparent"
                    >
                      <Mail className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                      Contact Us
                    </TactileButton>
                  </Link>
                </TactileHover>
              </div>
            </div>
          </SmoothScrollReveal>
        </div>
      </section>
    </div>
  )
}

// Enhanced CountUp component
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
