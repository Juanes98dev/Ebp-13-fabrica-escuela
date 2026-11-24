import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router"
import Sidebar from "../shared/Sidebar"
import { apiRequest, errorMessage } from "../shared/api"
import { fmtFecha } from "../shared/helpers"
import {
  IcoAlert,
  IcoCheck,
  IcoChevron,
  IcoClock,
  IcoDash,
  IcoInfo,
  IcoLock,
  IcoMail,
  IcoShield,
} from "../shared/icons"

type SesionApi = {
  id: number
  dispositivo: string | null
  fechaInicio: string
  ultimaActividad: string
  fechaCierre: string | null
  motivoCierre: string | null
  activa: boolean
  actual: boolean
}

type SesionActualApi = {
  nombre: string
  cedula: string
  inactividadMinutos: number
  sesiones: SesionApi[]
}

export default function DeviceSessionView() {
  const [datos, setDatos] = useState<SesionActualApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const cargar = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setDatos(await apiRequest<SesionActualApi>("/api/auth/sesion"))
    } catch (caught) {
      setError(errorMessage(caught, "No fue posible consultar tus sesiones"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const actual = datos?.sesiones.find((sesion) => sesion.actual)
  const anteriores = datos?.sesiones.filter((sesion) => !sesion.actual) ?? []
  const cerradasPorOtroAcceso = anteriores.filter((sesion) =>
    sesion.motivoCierre?.toLowerCase().includes("otro dispositivo"),
  ).length

  return (
    <div className="flex h-full overflow-hidden bg-bg-base">
      <Sidebar variant="cliente" />

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg-base/95 px-8 py-5 backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Perfil y seguridad</span>
            <IcoChevron />
            <span className="text-text-secondary">Sesiones y dispositivos</span>
          </div>
          <span className="flex items-center gap-1.5 rounded-lg border border-success/25 bg-success/10 px-3 py-1.5 text-xs text-emerald-400">
            <IcoShield />
            Máximo 1 sesión
          </span>
        </header>

        <div className="max-w-6xl px-8 py-7">
          <div className="mb-7 flex items-end justify-between gap-6">
            <div>
              <span className="mb-2 inline-block rounded-md bg-accent/15 px-2 py-1 font-display text-xs font-semibold uppercase tracking-wider text-purple-300">
                Protección de acceso
              </span>
              <h1 className="font-display text-2xl font-bold text-text-primary">
                Sesión activa por dispositivo
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-text-muted">
                Banco X permite una única sesión por usuario. Al iniciar sesión en
                otro dispositivo, la sesión anterior se cierra y te enviamos un
                correo de alerta.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void cargar()}
              disabled={loading}
              className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-purple-200 transition-colors hover:bg-purple-400/10 disabled:opacity-50"
            >
              Actualizar
            </button>
          </div>

          {error && (
            <div role="alert" className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-red-300">
              <span className="flex items-center gap-2"><IcoAlert />{error}</span>
              <button type="button" onClick={() => void cargar()} className="text-xs font-semibold underline">Reintentar</button>
            </div>
          )}

          {cerradasPorOtroAcceso > 0 && (
            <div role="status" className="mb-5 flex items-start gap-4 rounded-2xl border border-warn/30 bg-warn/10 px-5 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warn/15 text-amber-400">
                <IcoLock />
              </span>
              <div className="flex-1">
                <div className="text-sm font-bold text-amber-300">
                  {cerradasPorOtroAcceso === 1
                    ? "Una sesión anterior se cerró por un nuevo inicio de sesión"
                    : `${cerradasPorOtroAcceso} sesiones anteriores se cerraron por nuevos inicios de sesión`}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">
                  Si no reconoces alguno de estos accesos, cambia tu contraseña de
                  inmediato. Al hacerlo se cierran las demás sesiones.
                </p>
              </div>
              <Link
                to="/perfil/seguridad"
                className="shrink-0 rounded-xl bg-gradient-to-br from-purple-600 to-accent px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/20"
              >
                Cambiar contraseña
              </Link>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
            <section className="overflow-hidden rounded-2xl border border-border bg-sidebar">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div>
                  <h2 className="font-display text-sm font-semibold text-text-primary">
                    Historial de accesos
                  </h2>
                  <p className="mt-1 text-xs text-text-muted">
                    Últimos 10 inicios de sesión de tu usuario.
                  </p>
                </div>
                {actual && (
                  <span className="flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    1 sesión activa
                  </span>
                )}
              </div>

              {loading && !datos ? (
                <div className="flex flex-col gap-3 p-6">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="h-14 animate-pulse rounded-xl bg-purple-400/5" />
                  ))}
                </div>
              ) : datos && datos.sesiones.length === 0 ? (
                <p className="p-6 text-sm text-text-muted">No hay sesiones registradas.</p>
              ) : (
                <div className="divide-y divide-border">
                  {datos?.sesiones.map((sesion) => (
                    <FilaSesion key={sesion.id} sesion={sesion} />
                  ))}
                </div>
              )}
            </section>

            <aside className="flex flex-col gap-4">
              <div className="rounded-2xl border border-border bg-sidebar p-5">
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/15 text-purple-300">
                  <IcoMail />
                </span>
                <h2 className="font-display text-sm font-semibold text-text-primary">
                  Alertas por correo
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">
                  Cada nuevo inicio de sesión genera un correo a tu dirección
                  registrada con la fecha y el dispositivo utilizado.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-sidebar p-5">
                <h2 className="font-display text-sm font-semibold text-text-primary">
                  Controles de seguridad
                </h2>
                <div className="mt-4 space-y-3">
                  {[
                    ["Una sesión por usuario", "Activo"],
                    ["Cierre por inactividad", datos ? `${datos.inactividadMinutos} min` : "—"],
                    ["Alerta de nuevo acceso", "Por correo"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-3">
                      <span className="text-xs text-text-muted">{label}</span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                        <IcoCheck />
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-warn/20 bg-warn/5 p-4">
                <span className="mt-0.5 shrink-0 text-amber-400">
                  <IcoInfo />
                </span>
                <p className="text-xs leading-relaxed text-text-muted">
                  Si no reconoces un acceso, cambia tu contraseña de inmediato y
                  nunca compartas códigos de seguridad.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}

function FilaSesion({ sesion }: { sesion: SesionApi }) {
  const estado = sesion.actual
    ? { texto: "Este dispositivo", clase: "text-emerald-400", punto: "bg-success" }
    : sesion.activa
      ? { texto: "Activa", clase: "text-amber-400", punto: "bg-warn" }
      : { texto: "Cerrada", clase: "text-text-muted", punto: "bg-text-muted" }

  return (
    <div className="flex items-center gap-4 px-6 py-5">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          sesion.actual ? "bg-purple-600/20 text-purple-200" : "bg-purple-400/5 text-text-muted"
        }`}
      >
        <IcoDash />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-text-secondary">
            {sesion.dispositivo || "Dispositivo desconocido"}
          </span>
          {sesion.actual && (
            <span className="rounded-full bg-purple-600/15 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
              Sesión actual
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
          <IcoClock />
          Inicio: {fmtFecha(sesion.fechaInicio)}
          {sesion.actual && <> · Última actividad: {fmtFecha(sesion.ultimaActividad)}</>}
        </div>
        {!sesion.activa && sesion.motivoCierre && (
          <div className="mt-1 text-xs text-text-muted">
            Cerrada el {fmtFecha(sesion.fechaCierre)} · {sesion.motivoCierre}
          </div>
        )}
      </div>
      <div className={`flex shrink-0 items-center gap-1.5 text-xs font-semibold ${estado.clase}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${estado.punto}`} />
        {estado.texto}
      </div>
    </div>
  )
}
