import type { TipoCuenta, TransaccionApi } from "./types"

export function validarCedula(cedula: string): { valid: boolean; error?: string } {
  const limpia = cedula.replace(/\D/g, "")
  if (!limpia) return { valid: false, error: "La cédula es requerida." }
  if (limpia.length < 6 || limpia.length > 10)
    return { valid: false, error: "La cédula debe tener entre 6 y 10 dígitos." }
  return { valid: true }
}

export function fmtCOP(n: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export function fmtFecha(iso: string | null | undefined): string {
  if (!iso) return "No disponible"
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function fmtFechaLarga(iso: string | null | undefined): string {
  if (!iso) return "No disponible"
  // Una fecha sin hora se interpreta como UTC y en Colombia mostraría el día anterior.
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso)
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(fecha)
}

export function formatMonto(val: string): string {
  const digits = val.replace(/\D/g, "")
  return digits ? Number(digits).toLocaleString("es-CO") : ""
}

export function parseMonto(val: string): number {
  return Number(val.replace(/\D/g, "")) || 0
}

export function etiquetaTipoCuenta(tipo: TipoCuenta | string): string {
  return tipo === "CORRIENTE" ? "Cuenta corriente" : "Cuenta de ahorros"
}

export const PATRON_CUENTA = /^(301|501)-\d{3}-\d{4}-\d{2}$/

export function normalizarNumeroCuenta(valor: string): string {
  const digits = valor.replace(/\D/g, "").slice(0, 12)
  const partes = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10), digits.slice(10, 12)]
  return partes.filter(Boolean).join("-")
}

export function etiquetaTransaccion(tipo: TransaccionApi["tipo"]): string {
  if (tipo === "TRANSFERENCIA") return "Transferencia"
  if (tipo === "RETIRO") return "Retiro"
  return "Consignación"
}

/** Indica si el movimiento resta saldo de la cuenta consultada. */
export function esDebito(transaccion: TransaccionApi, numeroCuenta: string): boolean {
  return transaccion.cuentaOrigen === numeroCuenta
}
