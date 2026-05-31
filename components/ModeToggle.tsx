"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg border border-input bg-background/50 animate-pulse" />
    )
  }

  const isDark = theme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-all duration-300 cursor-pointer overflow-hidden group focus-visible:outline-hidden"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {/* Sun Icon */}
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-500 absolute dark:-rotate-90 dark:scale-0 text-amber-500 group-hover:rotate-45" />
        {/* Moon Icon */}
        <Moon className="h-5 w-5 rotate-90 scale-0 transition-all duration-500 absolute dark:rotate-0 dark:scale-100 text-indigo-400 group-hover:-rotate-12" />
      </div>
    </button>
  )
}
