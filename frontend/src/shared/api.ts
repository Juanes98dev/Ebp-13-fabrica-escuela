import { clearSession, getSession } from "./session"

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || ""

export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

export function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

function buildHeaders(options: RequestInit, accept: string) {
  const headers = new Headers(options.headers)
  headers.set("Accept", accept)
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  const session = getSession()
  if (session) headers.set("X-Session-Token", session.token)
  return headers
}

async function send(path: string, options: RequestInit, accept: string) {
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: buildHeaders(options, accept),
    })
  } catch {
    throw new ApiError(
      0,
      "No fue posible conectar con el servidor. Verifique su conexión e intente de nuevo.",
    )
  }
  if (response.ok) return response

  const contentType = response.headers.get("content-type") || ""
  const payload: unknown = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "")
  const body =
    typeof payload === "object" && payload !== null
      ? (payload as { mensaje?: string; error?: string })
      : {}
  const message =
    body.mensaje ||
    (typeof payload === "string" && payload) ||
    "Ocurrió un error al procesar la solicitud"

  if (response.status === 401 && getSession()) {
    clearSession()
    const reason = encodeURIComponent(message)
    const base = import.meta.env.BASE_URL.replace(/\/$/, "")
    window.location.assign(`${base}/login?motivo=${reason}`)
  }
  throw new ApiError(response.status, message, body.error)
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await send(path, options, "application/json")
  if (response.status === 204) return undefined as T
  const contentType = response.headers.get("content-type") || ""
  return (contentType.includes("application/json")
    ? await response.json()
    : await response.text()) as T
}

/** Descarga un archivo autenticado y lo guarda con el nombre que indique el servidor. */
export async function apiDownload(path: string, fallbackName: string) {
  const response = await send(path, {}, "*/*")
  const disposition = response.headers.get("content-disposition") || ""
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)
  const fileName = match ? decodeURIComponent(match[1]) : fallbackName
  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function logout() {
  try {
    if (getSession()) await apiRequest("/api/auth/logout", { method: "POST" })
  } catch {
    // La sesión local se limpia aunque el servidor ya la haya cerrado.
  } finally {
    clearSession()
  }
}
