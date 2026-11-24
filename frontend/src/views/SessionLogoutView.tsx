import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import Sidebar from "../shared/Sidebar"
import {
  IcoAlert,
  IcoCard,
  IcoChevron,
  IcoClock,
  IcoClose,
  IcoCuentas,
  IcoInfo,
  IcoLogout,
  IcoShield,
  IcoTransfer,
} from "../shared/icons"
import { apiRequest, logout } from "../shared/api"
import { etiquetaTipoCuenta, fmtCOP, fmtFecha } from "../shared/helpers"
import { useMisCuentas } from "../shared/hooks"
import { IDLE_LIMIT_SECONDS, registerActivity, useIdleCountdown } from "../shared/idle"
import { getSession } from "../shared/session"

type SesionInfo = {
  sesiones: { fechaInicio: string; dispositivo: string; actual: boolean }[]
}

export default function SessionLogoutView() {
  const navigate = useNavigate()
  const session = getSession()
  const { cuentas, loading, error, reload } = useMisCuentas()
  const remainingSeconds = useIdleCountdown()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [lastAccess, setLastAccess] = useState<{ fecha: string; dispositivo: string } | null>(null)

  useEffect(() => {
    apiRequest<SesionInfo>("/api/auth/sesion")
      .then((info) => {
        const previous = info.sesiones.find((item) => !item.actual)
        setLastAccess(previous ? { fecha: previous.fechaInicio, dispositivo: previous.dispositivo } : null)
      })
      .catch(() => setLastAccess(null))
  }, [])

  const activas = cuentas.filter((cuenta) => cuenta.activa)
  const saldoTotal = activas.reduce((total, cuenta) => total + Number(cuenta.saldo), 0)
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`

  async function confirmLogout() {
    await logout()
    navigate("/login", { replace: true })
  }

  return (
    <div className="flex h-full overflow-hidden bg-bg-base">
      <Sidebar variant="cliente" />

      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-5 flex items-center justify-between sticky top-0 z-10 bg-bg-base/95 border-b border-border backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Banca personal</span><IcoChevron /><span className="text-text-secondary">Panel principal</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-400/5 border border-border">
              <span className="text-purple-300"><IcoClock /></span>
              <div>
                <div className="text-xs font-semibold text-text-secondary">Sesión activa</div>
                <div className="text-[10px] text-text-muted">Expira en {formattedTime}</div>
              </div>
            </div>
            <button type="button" onClick={() => setShowLogoutConfirm(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-muted border border-border hover:text-red-400 hover:border-danger/30 hover:bg-danger/5">
              <IcoLogout />Cerrar sesión
            </button>
          </div>
        </div>

        <div className="px-8 py-7 max-w-6xl">
          <div className="mb-7">
            <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md mb-2 inline-block bg-purple-600/15 text-purple-300 font-display">Sesión protegida</span>
            <h1 className="text-2xl font-bold mb-1 text-text-primary font-display">
              Hola, <span data-i18n-ignore>{session?.nombre || "Cliente"}</span>
            </h1>
            <p className="text-sm text-text-muted">Administra tus productos financieros desde un entorno seguro.</p>
          </div>

          {error && (
            <div role="alert" className="flex items-center justify-between gap-3 rounded-xl px-4 py-3.5 mb-6 bg-danger/10 border border-danger/25">
              <span className="flex items-center gap-2 text-sm text-red-400"><IcoAlert />{error}</span>
              <button type="button" onClick={() => void reload()} className="text-xs font-semibold text-purple-300 hover:text-purple-200">Reintentar</button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-2xl p-5 bg-gradient-to-br from-purple-600/25 to-accent/10 border border-purple-400/30">
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs text-purple-200">Saldo total</span>
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-400/15 text-purple-300"><IcoCuentas /></span>
              </div>
              <div className="text-2xl font-bold text-text-primary font-display">{loading ? "…" : fmtCOP(saldoTotal)}</div>
              <div className="text-xs text-text-muted mt-1">
                {loading ? "Cargando cuentas" : activas.length === 0 ? "Sin cuentas activas" : `${activas.length} ${activas.length === 1 ? "cuenta activa" : "cuentas activas"}`}
              </div>
            </div>
            <div className="rounded-2xl p-5 bg-sidebar border border-border">
              <div className="text-xs text-text-muted mb-5">Último acceso</div>
              <div className="text-base font-semibold text-text-primary font-display">
                {lastAccess ? fmtFecha(lastAccess.fecha) : "Primer ingreso"}
              </div>
              <div className="text-xs text-text-muted mt-1">
                {lastAccess ? lastAccess.dispositivo : "No hay accesos anteriores registrados"}
              </div>
            </div>
            <div className="rounded-2xl p-5 bg-sidebar border border-border">
              <div className="text-xs text-text-muted mb-5">Seguridad de sesión</div>
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400"><IcoShield />Token activo</div>
              <button type="button" onClick={() => navigate("/perfil/sesiones")} className="text-xs text-purple-300 hover:text-purple-200 mt-1">Ver mis sesiones</button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
            <section className="rounded-2xl overflow-hidden bg-sidebar border border-border">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-sm font-semibold text-text-primary font-display">Mis cuentas</h2>
                  <p className="text-xs text-text-muted mt-0.5">Resumen de productos disponibles.</p>
                </div>
                <button type="button" onClick={() => navigate("/cuentas/saldo")} className="text-xs font-semibold text-purple-300 hover:text-purple-200">Ver saldos</button>
              </div>
              {loading ? (
                <div className="px-6 py-8 text-center text-sm text-text-muted">Cargando cuentas...</div>
              ) : cuentas.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-sm text-text-muted">Aún no tienes cuentas abiertas.</p>
                  <button type="button" onClick={() => navigate("/cuentas/nueva")} className="mt-3 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-br from-purple-600 to-accent">Abrir mi primera cuenta</button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {cuentas.map((cuenta) => (
                    <button
                      key={cuenta.numeroCuenta}
                      type="button"
                      onClick={() => navigate(`/cuentas/historial?cuenta=${encodeURIComponent(cuenta.numeroCuenta)}`)}
                      className="flex w-full items-center gap-4 px-6 py-5 text-left hover:bg-purple-400/5"
                    >
                      <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-purple-600/15 text-purple-300"><IcoCuentas /></div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-text-secondary">{etiquetaTipoCuenta(cuenta.tipo)}</div>
                        <div className="text-xs text-text-muted mt-0.5" data-i18n-ignore>{cuenta.numeroCuenta}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-text-primary">{fmtCOP(Number(cuenta.saldo))}</div>
                        <div className={`text-xs mt-0.5 ${cuenta.activa ? "text-emerald-400" : "text-red-400"}`}>{cuenta.activa ? "Disponible" : "Inactiva"}</div>
                      </div>
                      <span className="p-2 text-text-muted"><IcoChevron /></span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <aside className="flex flex-col gap-4">
              <div className="rounded-2xl p-5 bg-sidebar border border-border">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl mb-4 bg-purple-600/15 text-purple-300"><IcoClock /></div>
                <h2 className="text-sm font-semibold text-text-primary font-display">Control de inactividad</h2>
                <p className="text-xs text-text-muted leading-relaxed mt-2">Por seguridad, cerraremos tu sesión después de 10 minutos sin actividad.</p>
                <div className="mt-4 p-3 rounded-xl bg-purple-400/5 border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">Tiempo restante</span>
                    <span className="text-lg font-bold text-purple-200 font-display">{formattedTime}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full mt-2 bg-purple-400/10 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-accent transition-all" style={{ width: `${(remainingSeconds / IDLE_LIMIT_SECONDS) * 100}%` }} />
                  </div>
                </div>
                <button type="button" onClick={registerActivity} className="w-full mt-3 py-2 rounded-lg text-xs font-semibold text-purple-300 border border-border hover:bg-purple-400/10">Mantener sesión activa</button>
              </div>
              <div className="rounded-2xl p-5 bg-sidebar border border-border">
                <h2 className="text-sm font-semibold text-text-primary font-display mb-3">Accesos rápidos</h2>
                <div className="flex flex-col gap-2">
                  {[
                    { label: "Transferir", route: "/transferencias", icon: <IcoTransfer /> },
                    { label: "Consignar", route: "/consignaciones", icon: <IcoTransfer /> },
                    { label: "Mis tarjetas", route: "/tarjetas/consulta", icon: <IcoCard /> },
                  ].map((item) => (
                    <button key={item.route} type="button" onClick={() => navigate(item.route)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-text-secondary border border-border hover:bg-purple-400/10">
                      <span className="text-purple-300">{item.icon}</span>{item.label}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="logout-title" className="relative w-full max-w-md rounded-2xl p-7 bg-surface border border-purple-400/30 shadow-2xl shadow-black/40">
            <button type="button" onClick={() => setShowLogoutConfirm(false)} aria-label="Cerrar confirmación" className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-purple-200 hover:bg-purple-400/10"><IcoClose /></button>
            <div className="flex items-center justify-center w-14 h-14 rounded-full mb-5 bg-purple-600/15 text-purple-300"><IcoLogout /></div>
            <h2 id="logout-title" className="text-xl font-bold text-text-primary font-display">¿Deseas cerrar sesión?</h2>
            <p className="text-sm text-text-muted leading-relaxed mt-2">Finalizaremos tu sesión e invalidaremos el token de acceso en el servidor. Tendrás que ingresar tus credenciales nuevamente.</p>
            <div className="flex items-start gap-2.5 rounded-xl p-3.5 mt-5 bg-purple-400/5 border border-border">
              <span className="text-purple-300 mt-0.5"><IcoInfo /></span>
              <p className="text-xs text-text-muted leading-relaxed">Esta acción protege tus cuentas si compartes este dispositivo con otras personas.</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-text-secondary border border-border hover:bg-purple-400/10">Cancelar</button>
              <button type="button" onClick={confirmLogout} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-purple-600 to-accent shadow-lg shadow-purple-600/25"><IcoLogout />Cerrar sesión</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
