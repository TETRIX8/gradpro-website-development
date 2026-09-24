"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

export type AdminTheme = "light" | "dark"

const ThemeContext = createContext<{ theme: AdminTheme; setTheme: (t: AdminTheme) => void; toggle: () => void } | null>(null)

export function AdminThemeProvider({ initial, children }: { initial: AdminTheme; children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AdminTheme>(initial)

  const setTheme = useCallback((t: AdminTheme) => {
    setThemeState(t)
    document.cookie = `admin-theme=${t}; path=/; max-age=31536000; samesite=lax`
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", theme === "dark")
    root.style.colorScheme = theme
    return () => {
      root.classList.remove("dark")
      root.style.colorScheme = ""
    }
  }, [theme])

  const value = useMemo(
    () => ({ theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") }),
    [theme, setTheme],
  )
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useAdminTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useAdminTheme must be used within AdminThemeProvider")
  return ctx
}
