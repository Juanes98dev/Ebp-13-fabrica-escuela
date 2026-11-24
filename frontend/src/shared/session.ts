export type Rol = "CLIENTE" | "GESTOR"

export type Session = {
  token: string
  usuarioId: number
  rol: Rol
  nombre: string
  cedula: string
}

export type LoginResponse = {
  sessionToken: string
  usuarioId: number
  rol: Rol
  cedula: string
  nombre: string
  idiomaPreferido: string
  inactividadMinutos: number
}

const KEYS = {
  token: "bancox-session-token",
  usuarioId: "bancox-user-id",
  rol: "bancox-role",
  nombre: "bancox-name",
  cedula: "bancox-cedula",
} as const

export function getSession(): Session | null {
  const token = window.localStorage.getItem(KEYS.token)
  const rol = window.localStorage.getItem(KEYS.rol)
  const usuarioId = Number(window.localStorage.getItem(KEYS.usuarioId))
  if (!token || (rol !== "CLIENTE" && rol !== "GESTOR") || !usuarioId) return null
  return {
    token,
    usuarioId,
    rol,
    nombre: window.localStorage.getItem(KEYS.nombre) ?? "",
    cedula: window.localStorage.getItem(KEYS.cedula) ?? "",
  }
}

export const ACTIVITY_KEY = "bancox-last-activity"

export function saveSession(login: LoginResponse) {
  window.localStorage.setItem(ACTIVITY_KEY, String(Date.now()))
  window.localStorage.setItem(KEYS.token, login.sessionToken)
  window.localStorage.setItem(KEYS.usuarioId, String(login.usuarioId))
  window.localStorage.setItem(KEYS.rol, login.rol)
  window.localStorage.setItem(KEYS.nombre, login.nombre)
  window.localStorage.setItem(KEYS.cedula, login.cedula)
}

export function clearSession() {
  Object.values(KEYS).forEach((key) => window.localStorage.removeItem(key))
}

export function homeFor(rol: Rol) {
  return rol === "GESTOR" ? "/gestor/clientes" : "/inicio"
}

export function initials(nombre: string) {
  const letters = nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
  return letters || "BX"
}
