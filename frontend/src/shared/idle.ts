import { useEffect, useState } from "react"
import { apiRequest, logout } from "./api"
import { ACTIVITY_KEY, getSession } from "./session"

export const IDLE_LIMIT_SECONDS = 10 * 60
const KEEP_ALIVE_MS = 2 * 60 * 1000
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const

let lastKeepAlive = 0

function lastActivity() {
  return Number(window.localStorage.getItem(ACTIVITY_KEY)) || Date.now()
}

/** Registra actividad y, como mucho cada 2 minutos, renueva la sesión en el servidor. */
export function registerActivity() {
  window.localStorage.setItem(ACTIVITY_KEY, String(Date.now()))
  if (getSession() && Date.now() - lastKeepAlive > KEEP_ALIVE_MS) {
    lastKeepAlive = Date.now()
    apiRequest("/api/auth/sesion").catch(() => undefined)
  }
}

export function remainingIdleSeconds() {
  const elapsed = Math.floor((Date.now() - lastActivity()) / 1000)
  return Math.max(0, IDLE_LIMIT_SECONDS - elapsed)
}

/** Cierra la sesión del usuario tras el tiempo máximo de inactividad. */
export function IdleSessionGuard() {
  useEffect(() => {
    const onActivity = () => registerActivity()
    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, onActivity, { passive: true }))

    const timer = window.setInterval(async () => {
      if (!getSession() || remainingIdleSeconds() > 0) return
      await logout()
      const base = import.meta.env.BASE_URL.replace(/\/$/, "")
      const motivo = encodeURIComponent("Su sesión ha expirado, inicie sesión nuevamente")
      window.location.assign(`${base}/login?motivo=${motivo}`)
    }, 1000)

    return () => {
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity))
      window.clearInterval(timer)
    }
  }, [])

  return null
}

export function useIdleCountdown() {
  const [remaining, setRemaining] = useState(remainingIdleSeconds)
  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(remainingIdleSeconds()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  return remaining
}
