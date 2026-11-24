import { useEffect, useMemo, useState } from "react"
import Sidebar from "../shared/Sidebar"
import { CLIENTE_ACTIVO } from "../shared/data"
import {
  IcoAlert,
  IcoBell,
  IcoCheck,
  IcoChevron,
  IcoClock,
  IcoCuentas,
  IcoDash,
  IcoExtractos,
  IcoEye,
  IcoInfo,
  IcoInversiones,
  IcoLock,
  IcoMail,
  IcoPagos,
  IcoPrestamos,
  IcoShield,
  IcoTransfer,
  IcoUser,
} from "../shared/icons"

const CLIENT_NAV = [
  { id: "inicio", label: "Inicio", icon: <IcoDash /> },
  { id: "cuentas", label: "Mis Cuentas", icon: <IcoCuentas /> },
  { id: "transferencias", label: "Transferencias", icon: <IcoTransfer /> },
  { id: "pagos", label: "Pagos", icon: <IcoPagos /> },
  { id: "prestamos", label: "Préstamos", icon: <IcoPrestamos /> },
  { id: "inversiones", label: "Inversiones", icon: <IcoInversiones /> },
  { id: "extractos", label: "Extractos", icon: <IcoExtractos /> },
]

type DemoState = "secure" | "invalidating" | "closed" | "recovered"

export default function DeviceSessionView() {
  const [activeNav, setActiveNav] = useState("sesiones")
  const [demoState, setDemoState] = useState<DemoState>("secure")
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [notificationSent, setNotificationSent] = useState(false)
  const [operationRejected, setOperationRejected] = useState(false)
  const [showRecovery, setShowRecovery] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [accessTime, setAccessTime] = useState("")

  const passwordRules = useMemo(
    () => [
      { label: "Mínimo 8 caracteres", valid: newPassword.length >= 8 },
      { label: "Una letra mayúscula", valid: /[A-Z]/.test(newPassword) },
      { label: "Un número", valid: /\d/.test(newPassword) },
      {
        label: "Un carácter especial",
        valid: /[^A-Za-z0-9]/.test(newPassword),
      },
    ],
    [newPassword],
  )

  useEffect(() => {
    if (demoState !== "invalidating") return
    const interval = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1))
    }, 1000)
    const closeTimer = window.setTimeout(() => {
      setDemoState("closed")
      setSecondsLeft(0)
      setNotificationSent(true)
    }, 2800)
    return () => {
      window.clearInterval(interval)
      window.clearTimeout(closeTimer)
    }
  }, [demoState])

  function simulateRemoteAccess() {
    const now = new Date()
    setAccessTime(
      now.toLocaleString("es-CO", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      }),
    )
    setDemoState("invalidating")
    setSecondsLeft(3)
    setNotificationSent(false)
    setOperationRejected(false)
    setShowRecovery(false)
  }

  function tryOperation() {
    if (demoState === "closed") setOperationRejected(true)
  }

  function recoverControl(event: React.FormEvent) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (currentPassword.length < 8) {
      nextErrors.currentPassword = "La contraseña actual es incorrecta"
    }
    if (!passwordRules.every((rule) => rule.valid)) {
      nextErrors.newPassword =
        "La nueva contraseña no cumple todos los requisitos."
    }
    if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = "Las contraseñas no coinciden."
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSaving(true)
    window.setTimeout(() => {
      setSaving(false)
      setDemoState("recovered")
      setShowRecovery(false)
      setOperationRejected(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    }, 900)
  }

  function resetDemo() {
    setDemoState("secure")
    setNotificationSent(false)
    setOperationRejected(false)
    setShowRecovery(false)
    setErrors({})
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setAccessTime("")
  }

  const remoteActive = demoState === "invalidating" || demoState === "closed"
  const currentActive = demoState === "secure" || demoState === "recovered"

  return (
    <div className="flex h-full overflow-hidden bg-bg-base">
      <Sidebar
        navItems={CLIENT_NAV}
        activeNav={activeNav}
        onNav={setActiveNav}
        userLabel={CLIENTE_ACTIVO.nombre}
        userSub={`CC ${CLIENTE_ACTIVO.cedula}`}
        userInitials={CLIENTE_ACTIVO.iniciales}
        badge="Banca Personal"
      />

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg-base/95 px-8 py-5 backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Perfil y seguridad</span>
            <IcoChevron />
            <span className="text-text-secondary">Sesiones y dispositivos</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-lg border border-success/25 bg-success/10 px-3 py-1.5 text-xs text-emerald-400">
              <IcoShield />
              Máximo 1 sesión
            </span>
            <span className="rounded-lg border border-border bg-purple-600/15 px-3 py-1.5 text-xs text-purple-200">
              HUS-02-02-05
            </span>
          </div>
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
                Banco X permite una única sesión por usuario y te avisa cuando
                detecta un nuevo acceso.
              </p>
            </div>
            <button
              type="button"
              onClick={resetDemo}
              className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-purple-200 transition-colors hover:bg-purple-400/10"
            >
              Reiniciar demostración
            </button>
          </div>

          {demoState === "invalidating" && (
            <div
              role="status"
              className="mb-5 flex items-center gap-4 rounded-2xl border border-warn/30 bg-warn/10 px-5 py-4"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-warn/15 text-amber-400">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
              </span>
              <div className="flex-1">
                <div className="text-sm font-bold text-amber-400">
                  Nuevo inicio de sesión detectado
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  Estamos invalidando esta sesión en el servidor.
                </p>
              </div>
              <div className="text-right">
                <div className="font-display text-xl font-bold text-amber-300">
                  {secondsLeft}s
                </div>
                <div className="text-[10px] text-text-muted">
                  Límite: menos de 5 s
                </div>
              </div>
            </div>
          )}

          {demoState === "closed" && (
            <div
              role="alert"
              className="mb-5 rounded-2xl border border-danger/30 bg-danger/10 px-5 py-4"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger/15 text-red-400">
                  <IcoLock />
                </span>
                <div className="flex-1">
                  <div className="text-sm font-bold text-red-400">
                    Su sesión fue cerrada porque se inició sesión en otro
                    dispositivo
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-text-muted">
                    Esta sesión ya no puede consultar información ni realizar
                    operaciones. Si no reconoces el acceso, recupera el control
                    de inmediato.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRecovery(true)}
                  className="rounded-xl bg-gradient-to-br from-purple-600 to-accent px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/20"
                >
                  Recuperar control
                </button>
              </div>
            </div>
          )}

          {demoState === "recovered" && (
            <div
              role="status"
              className="mb-5 flex items-start gap-4 rounded-2xl border border-success/30 bg-success/10 px-5 py-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/15 text-emerald-400">
                <IcoCheck />
              </span>
              <div>
                <div className="text-sm font-bold text-emerald-400">
                  Recuperaste el control de tu cuenta
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  La contraseña fue restablecida, la otra sesión se cerró y este
                  dispositivo es ahora el único autorizado.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
            <div className="flex flex-col gap-5">
              <section className="overflow-hidden rounded-2xl border border-border bg-sidebar">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <div>
                    <h2 className="font-display text-sm font-semibold text-text-primary">
                      Dispositivos de la cuenta
                    </h2>
                    <p className="mt-1 text-xs text-text-muted">
                      Solo un dispositivo puede conservar una sesión activa.
                    </p>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    {currentActive || remoteActive
                      ? "1 sesión activa"
                      : "Sin sesiones"}
                  </span>
                </div>

                <div className="divide-y divide-border">
                  <div className="flex items-center gap-4 px-6 py-5">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                        currentActive
                          ? "bg-purple-600/20 text-purple-200"
                          : "bg-danger/10 text-red-400"
                      }`}
                    >
                      <IcoDash />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text-secondary">
                          Chrome en Windows
                        </span>
                        <span className="rounded-full bg-purple-600/15 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                          Este dispositivo
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-text-muted">
                        Bogotá, Colombia · IP 190.25.•••.84
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`flex items-center justify-end gap-1.5 text-xs font-semibold ${
                          currentActive ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            currentActive ? "bg-success" : "bg-danger"
                          }`}
                        />
                        {currentActive ? "Activa" : "Cerrada"}
                      </div>
                      <div className="mt-1 text-[10px] text-text-muted">
                        {currentActive ? "En uso ahora" : "Token invalidado"}
                      </div>
                    </div>
                  </div>

                  {(remoteActive || demoState === "recovered") && (
                    <div className="flex items-center gap-4 px-6 py-5">
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                          remoteActive
                            ? "bg-warn/10 text-amber-400"
                            : "bg-purple-400/5 text-text-muted"
                        }`}
                      >
                        <IcoUser />
                      </span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-text-secondary">
                          Safari en iPhone 15
                        </div>
                        <div className="mt-1 text-xs text-text-muted">
                          Medellín, Colombia · IP 181.49.•••.12
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`flex items-center justify-end gap-1.5 text-xs font-semibold ${
                            remoteActive ? "text-amber-400" : "text-text-muted"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              remoteActive ? "bg-warn" : "bg-text-muted"
                            }`}
                          />
                          {remoteActive ? "Nueva sesión" : "Cerrada"}
                        </div>
                        <div className="mt-1 text-[10px] text-text-muted">
                          {demoState === "recovered"
                            ? "Cerrada al recuperar la cuenta"
                            : accessTime || "Ahora"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-sidebar p-6">
                <div className="mb-5 flex items-start justify-between gap-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/15 text-purple-300">
                      <IcoShield />
                    </span>
                    <div>
                      <h2 className="font-display text-sm font-semibold text-text-primary">
                        Prueba los criterios de aceptación
                      </h2>
                      <p className="mt-0.5 text-xs text-text-muted">
                        Simula un acceso desde un segundo dispositivo.
                      </p>
                    </div>
                  </div>
                  <span className="rounded-md border border-border bg-purple-400/5 px-2 py-1 text-[10px] text-text-muted">
                    Entorno de demostración
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-border bg-purple-400/5 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600/15 text-xs font-bold text-purple-300">
                        1
                      </span>
                      {demoState !== "secure" && (
                        <span className="text-emerald-400">
                          <IcoCheck />
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-text-secondary">
                      Nuevo acceso
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
                      Inicia sesión desde un iPhone simulado.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-purple-400/5 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600/15 text-xs font-bold text-purple-300">
                        2
                      </span>
                      {operationRejected && (
                        <span className="text-emerald-400">
                          <IcoCheck />
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-text-secondary">
                      Operación protegida
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
                      Intenta transferir desde la sesión cerrada.
                    </p>
                    <button
                      type="button"
                      onClick={tryOperation}
                      disabled={demoState !== "closed"}
                      className="mt-4 w-full rounded-lg border border-border py-2 text-xs font-semibold text-purple-200 hover:bg-purple-400/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Intentar transferencia
                    </button>
                  </div>

                  <div className="rounded-xl border border-border bg-purple-400/5 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600/15 text-xs font-bold text-purple-300">
                        3
                      </span>
                      {demoState === "recovered" && (
                        <span className="text-emerald-400">
                          <IcoCheck />
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-text-secondary">
                      Recuperar control
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
                      Restablece la clave y cierra la otra sesión.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowRecovery(true)}
                      disabled={demoState !== "closed"}
                      className="mt-4 w-full rounded-lg border border-border py-2 text-xs font-semibold text-purple-200 hover:bg-purple-400/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Restablecer contraseña
                    </button>
                  </div>
                </div>
              </section>

              {operationRejected && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-xl border border-danger/25 bg-danger/10 px-4 py-4"
                >
                  <span className="mt-0.5 text-red-400">
                    <IcoAlert />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-red-400">
                      Operación rechazada
                    </div>
                    <p className="mt-1 text-xs text-text-muted">
                      Su sesión fue cerrada porque se inició sesión en otro
                      dispositivo
                    </p>
                  </div>
                </div>
              )}
            </div>

            <aside className="flex flex-col gap-4">
              <div className="rounded-2xl border border-border bg-sidebar p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/15 text-purple-300">
                    <IcoMail />
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                      notificationSent
                        ? "border-success/20 bg-success/10 text-emerald-400"
                        : "border-border bg-purple-400/5 text-text-muted"
                    }`}
                  >
                    {notificationSent ? "Enviada" : "En espera"}
                  </span>
                </div>
                <h2 className="font-display text-sm font-semibold text-text-primary">
                  Notificación de seguridad
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  Se enviará a {CLIENTE_ACTIVO.email}
                </p>

                {notificationSent ? (
                  <div className="mt-4 rounded-xl border border-success/20 bg-success/5 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                      <IcoBell />
                      Nuevo inicio de sesión
                    </div>
                    <div className="mt-3 space-y-2 text-xs">
                      <div className="flex justify-between gap-3">
                        <span className="text-text-muted">Fecha y hora</span>
                        <span className="text-right text-text-secondary">
                          {accessTime}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-text-muted">Dispositivo</span>
                        <span className="text-text-secondary">
                          Safari · iPhone 15
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-text-muted">Ubicación</span>
                        <span className="text-text-secondary">
                          Medellín, Colombia
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 border-t border-success/15 pt-3 text-[10px] text-emerald-400">
                      <IcoClock />
                      Entregada en 4 segundos · Objetivo: menos de 1 min
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-border p-5 text-center">
                    <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-purple-400/5 text-text-muted">
                      <IcoMail />
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-text-muted">
                      Aquí verás el correo generado al detectar un nuevo
                      dispositivo.
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-sidebar p-5">
                <h2 className="font-display text-sm font-semibold text-text-primary">
                  Controles de seguridad
                </h2>
                <div className="mt-4 space-y-3">
                  {[
                    ["Una sesión por usuario", "Activo"],
                    ["Invalidación del token", "< 5 segundos"],
                    ["Alerta por correo", "< 1 minuto"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-3"
                    >
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

      {showRecovery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
          <form
            onSubmit={recoverControl}
            noValidate
            className="my-6 w-full max-w-lg rounded-2xl border border-purple-400/30 bg-surface p-7 shadow-2xl shadow-black/50"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-600/20 text-purple-200">
                <IcoShield />
              </span>
              <div>
                <span className="font-display text-xs font-semibold uppercase tracking-wider text-purple-300">
                  Acceso no reconocido
                </span>
                <h2 className="mt-1 font-display text-xl font-bold text-text-primary">
                  Recupera el control de tu cuenta
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">
                  Confirma tu identidad y crea una nueva contraseña. Todas las
                  demás sesiones serán cerradas.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="recovery-current"
                  className="mb-2 block font-display text-xs font-semibold uppercase tracking-wide text-purple-200"
                >
                  Contraseña actual
                </label>
                <input
                  id="recovery-current"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => {
                    setCurrentPassword(event.target.value)
                    setErrors((current) => ({
                      ...current,
                      currentPassword: "",
                    }))
                  }}
                  placeholder="Ingresa tu contraseña actual"
                  className={`w-full rounded-xl border bg-purple-400/5 px-3.5 py-3 text-sm text-text-primary outline-none focus:ring-4 focus:ring-purple-400/10 ${
                    errors.currentPassword
                      ? "border-danger"
                      : "border-border focus:border-purple-400/60"
                  }`}
                />
                {errors.currentPassword && (
                  <span className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
                    <IcoAlert />
                    {errors.currentPassword}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="recovery-new"
                    className="mb-2 block font-display text-xs font-semibold uppercase tracking-wide text-purple-200"
                  >
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="recovery-new"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => {
                        setNewPassword(event.target.value)
                        setErrors((current) => ({
                          ...current,
                          newPassword: "",
                        }))
                      }}
                      placeholder="Crea una contraseña segura"
                      className={`w-full rounded-xl border bg-purple-400/5 px-3.5 py-3 pr-11 text-sm text-text-primary outline-none focus:ring-4 focus:ring-purple-400/10 ${
                        errors.newPassword
                          ? "border-danger"
                          : "border-border focus:border-purple-400/60"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={
                        showPassword
                          ? "Ocultar nueva contraseña"
                          : "Mostrar nueva contraseña"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-purple-200"
                    >
                      <IcoEye />
                    </button>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="recovery-confirm"
                    className="mb-2 block font-display text-xs font-semibold uppercase tracking-wide text-purple-200"
                  >
                    Confirmar contraseña
                  </label>
                  <input
                    id="recovery-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value)
                      setErrors((current) => ({
                        ...current,
                        confirmPassword: "",
                      }))
                    }}
                    placeholder="Repite la nueva contraseña"
                    className={`w-full rounded-xl border bg-purple-400/5 px-3.5 py-3 text-sm text-text-primary outline-none focus:ring-4 focus:ring-purple-400/10 ${
                      errors.confirmPassword
                        ? "border-danger"
                        : "border-border focus:border-purple-400/60"
                    }`}
                  />
                </div>
              </div>

              {(errors.newPassword || errors.confirmPassword) && (
                <div className="space-y-1.5 text-xs text-red-400">
                  {errors.newPassword && (
                    <div className="flex items-center gap-1.5">
                      <IcoAlert />
                      {errors.newPassword}
                    </div>
                  )}
                  {errors.confirmPassword && (
                    <div className="flex items-center gap-1.5">
                      <IcoAlert />
                      {errors.confirmPassword}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-purple-400/5 p-4">
                {passwordRules.map((rule) => (
                  <div
                    key={rule.label}
                    className={`flex items-center gap-2 text-[11px] ${
                      newPassword && rule.valid
                        ? "text-emerald-400"
                        : "text-text-muted"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                        newPassword && rule.valid
                          ? "border-success/30 bg-success/15"
                          : "border-border"
                      }`}
                    >
                      {newPassword && rule.valid ? (
                        <span className="[&>svg]:h-2.5 [&>svg]:w-2.5">
                          <IcoCheck />
                        </span>
                      ) : (
                        <span className="h-1 w-1 rounded-full bg-current" />
                      )}
                    </span>
                    {rule.label}
                  </div>
                ))}
              </div>

            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowRecovery(false)}
                disabled={saving}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-text-secondary hover:bg-purple-400/10"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-purple-600 to-accent py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Protegiendo cuenta...
                  </>
                ) : (
                  <>
                    <IcoLock />
                    Cambiar y cerrar sesiones
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
