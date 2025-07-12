"use client"

import React, { useEffect, useRef, useState } from "react"

interface SmoothRevealProps {
  children: React.ReactNode
  delay?: number
  direction?: "up" | "down" | "left" | "right"
  distance?: number
  className?: string
}

const directionTransforms: Record<string, string> = {
  up: "translate3d(0, 30px, 0) scale(0.98) rotateX(5deg)",
  down: "translate3d(0, -30px, 0) scale(0.98) rotateX(-5deg)",
  left: "translate3d(30px, 0, 0) scale(0.98) rotateY(-5deg)",
  right: "translate3d(-30px, 0, 0) scale(0.98) rotateY(5deg)",
}

export default function SmoothReveal({
  children,
  delay = 0,
  direction = "up",
  distance = 30,
  className = "",
}: SmoothRevealProps) {
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
      { threshold: 0.15, rootMargin: "-20px" }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [delay, hasAnimated])

  const getTransform = () => {
    if (isVisible) return "translate3d(0, 0, 0) scale(1) rotateX(0deg)"

    return directionTransforms[direction] || directionTransforms["up"]
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
