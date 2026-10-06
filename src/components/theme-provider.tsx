"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react"

export type Theme = "light" | "dark" | "system"

const STORAGE_KEY = "hl-theme"
const CHANGE_EVENT = "hl-theme-change"
const DARK_QUERY = "(prefers-color-scheme: dark)"

/**
 * Runs before first paint (see layout.tsx) so the page never flashes the wrong
 * theme. Keep in sync with `applyTheme` below.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");var d=t==="dark"||(t!=="light"&&matchMedia("${DARK_QUERY}").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light"}catch(e){}})()`

function readStored(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === "light" || value === "dark" ? value : "system"
  } catch {
    return "system"
  }
}

function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" || (theme === "system" && matchMedia(DARK_QUERY).matches)
  const root = document.documentElement
  root.classList.toggle("dark", dark)
  root.style.colorScheme = dark ? "dark" : "light"
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener("storage", onChange)
  }
}

const ThemeContext = createContext<{
  theme: Theme
  setTheme: (theme: Theme) => void
}>({ theme: "system", setTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore<Theme>(subscribe, readStored, () => "system")

  // Keep the page in sync with the stored choice (also covers other tabs) and,
  // for "system", with the OS preference changing while the site is open.
  useEffect(() => {
    applyTheme(theme)
    if (theme !== "system") return
    const media = matchMedia(DARK_QUERY)
    const onChange = () => applyTheme("system")
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    const root = document.documentElement
    root.classList.add("theme-transition")
    window.setTimeout(() => root.classList.remove("theme-transition"), 300)
    try {
      if (next === "system") localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // storage blocked: the choice still applies for this visit
    }
    applyTheme(next)
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
