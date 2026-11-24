import type { ReactNode } from "react"
import { Link } from "react-router"
import { IcoAlert, IcoCuentas, IcoInfo } from "./icons"
import { esDebito, etiquetaTipoCuenta, etiquetaTransaccion, fmtCOP, fmtFecha } from "./helpers"
import { useHistorial } from "./hooks"
import type { CuentaApi } from "./types"

export type PasoOperacion = "form" | "confirm" | "success"

export function Stepper({ step, labels }: { step: PasoOperacion; labels: [string, string, string] }) {
  const keys: PasoOperacion[] = ["form", "confirm", "success"]
  const current = keys.indexOf(step)
  return (
    <div className="flex items-center mb-8">
      {keys.map((key, index) => {
        const done = index < current
        const active = index === current
        return (
          <div key={key} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold font-display ${done ? "bg-success/20 text-emerald-500 border border-success/40" : active ? "bg-gradient-to-br from-purple-600 to-accent text-white" : "bg-purple-400/10 text-text-muted border border-border"}`}>
                {done ? "✓" : index + 1}
              </div>
              <span className={`text-xs font-medium ${active ? "text-text-secondary" : done ? "text-emerald-500" : "text-text-muted"}`}>{labels[index]}</span>
            </div>
            {index < 2 && <div className={`w-10 h-px mx-3 ${done ? "bg-success/40" : "bg-border"}`} />}
          </div>
        )
      })}
    </div>
  )
}

export function Seccion({ titulo, accion, children }: { titulo: string; accion?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl p-5 bg-sidebar border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-gradient-to-b from-purple-600 to-accent" />
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary font-display">{titulo}</h2>
        </div>
        {accion}
      </div>
      {children}
    </section>
  )
}

export function CampoError({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null
  return <p className="flex items-center gap-1 text-xs mt-1.5 text-red-400"><IcoAlert />{mensaje}</p>
}

export function AlertaError({ mensaje }: { mensaje: string }) {
  if (!mensaje) return null
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl px-4 py-3.5 bg-danger/10 border border-danger/25">
      <span className="text-red-400 shrink-0 mt-0.5"><IcoAlert /></span>
      <span className="text-sm text-red-300">{mensaje}</span>
    </div>
  )
}

export function SelectorCuenta({
  cuentas,
  seleccionada,
  onSelect,
  deshabilitar,
  extra,
}: {
  cuentas: CuentaApi[]
  seleccionada: string
  onSelect: (numero: string) => void
  deshabilitar?: (cuenta: CuentaApi) => string | null
  extra?: (cuenta: CuentaApi) => ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      {cuentas.map((cuenta) => {
        const sel = seleccionada === cuenta.numeroCuenta
        const motivo = deshabilitar?.(cuenta) ?? null
        return (
          <button
            key={cuenta.numeroCuenta}
            type="button"
            disabled={Boolean(motivo)}
            onClick={() => onSelect(cuenta.numeroCuenta)}
            className={`flex items-center justify-between px-4 py-3 rounded-xl text-left border transition-all disabled:opacity-55 disabled:cursor-not-allowed ${sel ? "bg-purple-600/20 border-purple-400/45" : "bg-purple-400/5 border-border hover:border-purple-400/30"}`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${sel ? "bg-purple-600/35 text-purple-300" : "bg-purple-400/10 text-text-muted"}`}><IcoCuentas /></div>
              <div>
                <div className={`text-xs font-semibold ${sel ? "text-text-primary" : "text-text-secondary"}`}>{etiquetaTipoCuenta(cuenta.tipo)}</div>
                <div className="text-xs font-mono text-text-muted" data-i18n-ignore>{cuenta.numeroCuenta}</div>
                {motivo && <div className="text-xs mt-0.5 text-red-400">{motivo}</div>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-text-muted">Disponible</div>
              <div className={`text-sm font-bold font-display ${sel ? "text-purple-300" : "text-text-secondary"}`}>{fmtCOP(Number(cuenta.saldo))}</div>
              {extra?.(cuenta)}
            </div>
          </button>
        )
      })}
    </div>
  )
}

export function SinCuentas({ loading, error }: { loading: boolean; error: string }) {
  if (loading) return <p className="text-sm text-text-muted">Cargando tus cuentas...</p>
  if (error) return <CampoError mensaje={error} />
  return (
    <div className="rounded-xl p-4 bg-purple-400/5 border border-border text-sm text-text-muted">
      No tienes cuentas activas. <Link to="/cuentas/nueva" className="font-semibold text-purple-300 hover:text-purple-200">Abrir una cuenta</Link>
    </div>
  )
}

export function FilasResumen({ filas }: { filas: { label: string; value: string; tono?: "destacado" | "tenue" | "ok" }[] }) {
  return (
    <div className="flex flex-col">
      {filas.map((fila) => (
        <div key={fila.label} className="flex items-center justify-between gap-4 py-2 border-b border-border/50 last:border-b-0">
          <span className="text-xs text-text-muted">{fila.label}</span>
          <span className={`text-sm font-medium text-right ${fila.tono === "destacado" ? "text-purple-300" : fila.tono === "tenue" ? "text-text-muted" : fila.tono === "ok" ? "text-emerald-400" : "text-text-primary"}`}>{fila.value}</span>
        </div>
      ))}
    </div>
  )
}

export function AvisoOperacion({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-xs leading-relaxed text-text-muted">
      <span className="text-purple-300 shrink-0 mt-0.5"><IcoInfo /></span>
      <span>{children}</span>
    </div>
  )
}

export function IconoExito() {
  return (
    <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-success/10 border-2 border-success/35">
      <div className="absolute inset-0 rounded-full animate-ping bg-success/5" />
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
    </div>
  )
}

export function MontosRapidos({ valores, onPick, maximo }: { valores: number[]; onPick: (valor: number) => void; maximo?: number }) {
  return (
    <div className="flex gap-2 mt-2 flex-wrap">
      {valores.map((valor) => (
        <button
          key={valor}
          type="button"
          disabled={maximo !== undefined && valor > maximo}
          onClick={() => onPick(valor)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-400/10 text-text-muted border border-border transition-all hover:bg-purple-400/20 hover:text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-purple-400/10"
        >
          {fmtCOP(valor)}
        </button>
      ))}
    </div>
  )
}

export const claseInput =
  "w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all bg-purple-400/5 text-text-primary border focus:ring-4 focus:ring-purple-400/10"

export const claseBotonPrimario =
  "flex items-center justify-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-purple-600 to-accent shadow-lg shadow-purple-600/35 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0"

export const claseBotonSecundario =
  "px-5 py-2.5 rounded-xl text-sm font-medium text-text-muted border border-border transition-all hover:text-text-secondary hover:border-purple-400/40 disabled:opacity-50"

export function PanelSaldos({ cuentas }: { cuentas: CuentaApi[] }) {
  return (
    <div className="rounded-2xl p-5 bg-sidebar border border-border">
      <h2 className="text-xs font-semibold uppercase tracking-wide mb-3 text-text-muted font-display">Mis saldos</h2>
      {cuentas.length === 0 && <p className="text-xs text-text-muted">Sin cuentas activas.</p>}
      {cuentas.map((cuenta) => (
        <div key={cuenta.numeroCuenta} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-b-0">
          <div>
            <div className="text-xs font-medium text-text-secondary">{etiquetaTipoCuenta(cuenta.tipo)}</div>
            <div className="text-[10px] font-mono text-text-muted" data-i18n-ignore>{cuenta.numeroCuenta}</div>
          </div>
          <div className="text-sm font-bold text-purple-300 font-display">{fmtCOP(Number(cuenta.saldo))}</div>
        </div>
      ))}
    </div>
  )
}

/** Montar con `key` distinto tras cada operación para recargar los movimientos. */
export function PanelHistorialReciente({ numeroCuenta, limite = 5 }: { numeroCuenta: string; limite?: number }) {
  const { transacciones, loading } = useHistorial(numeroCuenta || null)
  return (
    <div className="rounded-2xl p-5 bg-sidebar border border-border">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted font-display">Historial reciente</h2>
        {numeroCuenta && <Link to={`/cuentas/historial?cuenta=${encodeURIComponent(numeroCuenta)}`} className="text-xs font-semibold text-purple-300 hover:text-purple-200">Ver todo</Link>}
      </div>
      {loading && <p className="text-xs text-text-muted">Cargando...</p>}
      {!loading && transacciones.length === 0 && <p className="text-xs text-text-muted">Sin movimientos en esta cuenta.</p>}
      <div className="flex flex-col">
        {transacciones.slice(0, limite).map((tx) => {
          const debito = esDebito(tx, numeroCuenta)
          return (
            <Link key={tx.referencia} to={`/cuentas/transaccion?ref=${encodeURIComponent(tx.referencia)}&cuenta=${encodeURIComponent(numeroCuenta)}`} className="flex items-center gap-3 py-2 px-1 rounded-lg border-b border-border/40 last:border-b-0 hover:bg-purple-400/5">
              <div className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${debito ? "bg-danger/10" : "bg-success/10"}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={debito ? "#f87171" : "#10b981"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  {debito ? <path d="M12 5v14M19 12l-7-7-7 7" /> : <path d="M12 19V5M5 12l7 7 7-7" />}
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate text-text-secondary">{tx.descripcion || etiquetaTransaccion(tx.tipo)}</div>
                <div className="text-[10px] text-text-muted">{fmtFecha(tx.fecha)}</div>
              </div>
              <div className={`text-xs font-bold shrink-0 font-display ${debito ? "text-red-400" : "text-emerald-400"}`}>
                {debito ? "−" : "+"}{fmtCOP(Number(tx.monto))}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
