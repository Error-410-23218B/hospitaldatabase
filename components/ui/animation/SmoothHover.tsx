"use client"

import React, { useRef, useState, useCallback } from "react"

interface SmoothHoverProps {
  children: React.ReactNode
  scale?: number
  className?: string
}

export default function SmoothHover({ children, scale = 1.02, className = "" }: SmoothHoverProps) {
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

      const deltaX = (clientX - centerX) * 0.1
      const deltaY = (clientY - centerY) * 0.1

      translateRef.current = { x: deltaX, y: deltaY }

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        if (!ref.current) return

        const scaleValue = isPressedRef.current ? scale * 0.98 : isHoveredRef.current ? scale : 1

        ref.current.style.transform = `translate3d(${translateRef.current.x}px, ${translateRef.current.y}px, 0) scale(${scaleValue})`
        ref.current.style.transition = isHoveredRef.current
          ? "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
          : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
        ref.current.style.willChange = "transform"
      })
    },
    [scale]
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
      ref.current.style.transform = `translate3d(${translateRef.current.x}px, ${translateRef.current.y}px, 0) scale(${scale * 0.98})`
    }
  }

  const handleMouseUp = () => {
    isPressedRef.current = false
    if (ref.current) {
      const scaleValue = isHoveredRef.current ? scale : 1
      ref.current.style.transform = `translate3d(${translateRef.current.x}px, ${translateRef.current.y}px, 0) scale(${scaleValue})`
    }
  }

  return (
    <div
      ref={ref}
      className={className}
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
