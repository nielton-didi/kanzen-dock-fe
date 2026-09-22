"use client"

import { useLayoutEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

function isDarkPreferred() {
  const stored = localStorage.getItem("theme")
  if (stored) return stored === "dark"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  // Re-applies the theme the inline script already set (see app/layout.tsx),
  // since React's dev Strict Mode remount can clear it before this runs.
  useLayoutEffect(() => {
    const dark = isDarkPreferred()
    document.documentElement.classList.toggle("dark", dark)
    setIsDark(dark)
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("theme", next ? "dark" : "light")
  }

  return (
    <Button variant="ghost" size="icon" aria-label="Toggle dark mode" onClick={toggle}>
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}
