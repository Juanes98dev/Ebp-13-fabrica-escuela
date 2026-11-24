import { useState } from "react"
import { useNavigate } from "react-router"
import Sidebar from "../shared/Sidebar"
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
  IcoLogout,
  IcoPagos,
  IcoPrestamos,
  IcoShield,
  IcoTransfer,
  IcoUser,
} from "../shared/icons"
import { CLIENTE_ACTIVO } from "../shared/data"
import { apiRequest } from "../shared/api"

const CLIENT_NAV = [
  { id: "inicio", label: "Inicio", icon: <IcoDash /> },
  { id: "cuentas", label: "Mis Cuentas", icon: <IcoCuentas /> },
  { id: "transferencias", label: "Transferencias", icon: <IcoTransfer /> },
  { id: "pagos", label: "Pagos", icon: <IcoPagos /> },
  { id: "prestamos", label: "Préstamos", icon: <IcoPrestamos /> },
  { id: "inversiones", label: "Inversiones", icon: <IcoInversiones /> },
  { id: "extractos", label: "Extractos", icon: <IcoExtractos /> },
  { id: "perfil", label: "Perfil y seguridad", icon: <IcoUser /> },
]

type LoginStatus = "idle" | "loading" | "error" | "inactive" | "locked"

export default function LoginView() {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<LoginStatus>("idle")
  const [attempts, setAttempts] = useState(0)
  const [loggedIn, setLoggedIn] = useState(false)
  const [activeNav, setActiveNav] = useState("inicio")
  const [fieldError, setFieldError] = useState("")

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault()
    if (status === "locked") return
    if (!username.trim() || !password) {
      setFieldError("Ingresa tu usuario y contraseña para continuar.")
      return
    }

    setFieldError("")
    setStatus("loading")
    try {
      const result = await apiRequest<{
        sessionToken: string
        usuarioId: number
        rol: string
        idiomaPreferido: string
      }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ cedula: username.trim(), password }),
      })
      window.localStorage.setItem("bancox-session-token", result.sessionToken)
      window.localStorage.setItem("bancox-user-id", String(result.usuarioId))
      window.localStorage.setItem("bancox-role", result.rol)
      setStatus("idle")
      setAttempts(0)
      navigate(result.rol === "GESTOR" ? "/gestor/clientes" : "/inicio")
    } catch (error) {
      const nextAttempts = attempts + 1
      setAttempts(nextAttempts)
      setStatus(nextAttempts >= 3 ? "locked" : "error")
      setFieldError(error instanceof Error ? error.message : "Credenciales inválidas")
    }
  }

  function resetDemo() {
    setUsername("")
    setPassword("")
    setStatus("idle")
    setAttempts(0)
    setFieldError("")
  }

  async function logout() {
    try {
      await apiRequest<{ mensaje: string }>("/api/auth/logout", { method: "POST" })
    } finally {
      window.localStorage.removeItem("bancox-session-token")
      window.localStorage.removeItem("bancox-user-id")
      window.localStorage.removeItem("bancox-role")
    }
    setLoggedIn(false)
    setUsername("")
    setPassword("")
    setStatus("idle")
    setAttempts(0)
    setActiveNav("inicio")
  }

  if (loggedIn) {
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
          <div className="px-8 py-5 flex items-center justify-between sticky top-0 z-10 bg-bg-base/95 border-b border-border backdrop-blur">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <span>Banca personal</span>
              <IcoChevron />
              <span className="text-text-secondary">Panel principal</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Notificaciones"
                className="relative p-2 rounded-lg text-text-muted border border-border hover:text-purple-200 hover:bg-purple-400/10"
              >
                <IcoBell />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent" />
              </button>
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-muted border border-border hover:text-purple-200 hover:bg-purple-400/10"
              >
                <IcoLogout />
                Cerrar sesión
              </button>
            </div>
          </div>

          <div className="px-8 py-7 max-w-6xl">
            <div className="flex items-start justify-between gap-6 mb-7">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md mb-2 inline-block bg-success/10 text-emerald-400 font-display">
                  Acceso exitoso
                </span>
                <h1 className="text-2xl font-bold mb-1 text-text-primary font-display">
                  Hola, Valentina
                </h1>
                <p className="text-sm text-text-muted">
                  Este es el resumen financiero de tus productos Banco X.
                </p>
              </div>
              
            </div>

            <div
              role="status"
              className="flex items-center gap-3 rounded-xl px-4 py-3.5 mb-6 bg-success/5 border border-success/20"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-success/10 text-emerald-400">
                <IcoCheck />
              </span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-emerald-400">
                  Sesión iniciada correctamente
                </div>
                <div className="text-xs text-text-muted mt-0.5">
                  Tu acceso está protegido mediante un token seguro con tiempo
                  de expiración.
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                <IcoClock />
                Expira en 30 min
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="rounded-2xl p-5 bg-gradient-to-br from-purple-600/25 to-accent/10 border border-purple-400/30">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs text-purple-200">Saldo total</span>
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-400/15 text-purple-300">
                    <IcoCuentas />
                  </span>
                </div>
                <div className="text-2xl font-bold text-text-primary font-display">
                  $ 6.070.500
                </div>
                <div className="text-xs text-text-muted mt-1">
                  Disponible en 2 cuentas
                </div>
              </div>
              <div className="rounded-2xl p-5 bg-sidebar border border-border">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs text-text-muted">
                    Ingresos este mes
                  </span>
                  <span className="text-xs text-emerald-400">+12,4%</span>
                </div>
                <div className="text-xl font-bold text-text-primary font-display">
                  $ 3.850.000
                </div>
                <div className="w-full h-1.5 rounded-full mt-3 bg-purple-400/10 overflow-hidden">
                  <div className="w-3/4 h-full rounded-full bg-success" />
                </div>
              </div>
              <div className="rounded-2xl p-5 bg-sidebar border border-border">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs text-text-muted">Próximo pago</span>
                  <span className="text-xs text-amber-400">12 sep</span>
                </div>
                <div className="text-xl font-bold text-text-primary font-display">
                  $ 284.600
                </div>
                <div className="text-xs text-text-muted mt-1">
                  Tarjeta de crédito •••• 7164
                </div>
              </div>
            </div>

            <section className="rounded-2xl overflow-hidden bg-sidebar border border-border">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-sm font-semibold text-text-primary font-display">
                    Mis cuentas
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    Productos disponibles después de iniciar sesión.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs font-semibold text-purple-300 hover:text-purple-200"
                >
                  Ver todas
                </button>
              </div>
              <div className="divide-y divide-border">
                {CLIENTE_ACTIVO.cuentas.map((account) => (
                  <div
                    key={account.numero}
                    className="flex items-center gap-4 px-6 py-5"
                  >
                    <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-purple-600/15 text-purple-300">
                      <IcoCuentas />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-text-secondary">
                        Cuenta {account.tipo.toLowerCase()}
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">
                        {account.numero}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-text-primary">
                        $ {account.saldo.toLocaleString("es-CO")}
                      </div>
                      <div className="text-xs text-emerald-400 mt-0.5">
                        Disponible
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={`Ver cuenta ${account.numero}`}
                      className="p-2 text-text-muted hover:text-purple-300"
                    >
                      <IcoChevron />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-full flex bg-bg-base">
      <aside className="hidden lg:flex lg:w-[42%] relative overflow-hidden flex-col justify-between p-10 bg-sidebar border-r border-border">
        <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 w-96 h-96 rounded-full bg-accent/15 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-purple-600 to-accent font-display">
            BX
          </div>
          <div>
            <div className="text-base font-semibold text-text-primary font-display">
              Banco X
            </div>
            <div className="text-xs text-text-muted">Banca personal</div>
          </div>
        </div>

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-purple-600/15 text-purple-200 border border-border mb-6">
            <IcoShield />
            Tu banca, siempre protegida
          </span>
          <h1 className="text-4xl font-bold leading-tight text-text-primary font-display">
            Todo tu banco,
            <br />
            <span className="text-purple-300">en un solo lugar.</span>
          </h1>
          <p className="text-sm leading-relaxed text-text-muted mt-4">
            Consulta tus productos, transfiere y administra tus finanzas con la
            seguridad de Banco X.
          </p>

          <div className="flex flex-col gap-3 mt-8">
            {[
              {
                icon: <IcoLock />,
                title: "Acceso seguro",
                description: "Tus datos viajan protegidos mediante HTTPS.",
              },
              {
                icon: <IcoClock />,
                title: "Sesiones protegidas",
                description: "Tokens de acceso con expiración automática.",
              },
              {
                icon: <IcoShield />,
                title: "Monitoreo continuo",
                description: "Protección activa ante intentos no autorizados.",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-600/15 text-purple-300">
                  {item.icon}
                </span>
                <div>
                  <div className="text-xs font-semibold text-text-secondary">
                    {item.title}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {item.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-text-muted">
          © 2026 Banco X · Vigilado por la Superintendencia Financiera
        </div>
      </aside>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-purple-600 to-accent font-display">
              BX
            </div>
            <div className="text-base font-semibold text-text-primary font-display">
              Banco X
            </div>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-300 font-display">
                Banca personal
              </span>
              <h2 className="text-2xl font-bold text-text-primary font-display mt-2">
                Inicia sesión
              </h2>
              <p className="text-sm text-text-muted mt-1">
                Ingresa tus credenciales para acceder.
              </p>
            </div>
            
          </div>

          {status === "error" && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl px-4 py-3.5 mb-5 bg-danger/10 border border-danger/25"
            >
              <span className="text-red-400 mt-0.5">
                <IcoAlert />
              </span>
              <div>
                <div className="text-sm font-semibold text-red-400">
                  Usuario o contraseña incorrectos
                </div>
                <div className="text-xs text-text-muted mt-1">
                  Intento fallido registrado. Te quedan {3 - attempts}{" "}
                  {3 - attempts === 1 ? "intento" : "intentos"} antes del
                  bloqueo temporal.
                </div>
              </div>
            </div>
          )}

          {status === "inactive" && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl px-4 py-3.5 mb-5 bg-warn/10 border border-warn/25"
            >
              <span className="text-amber-400 mt-0.5">
                <IcoAlert />
              </span>
              <div>
                <div className="text-sm font-semibold text-amber-400">
                  Usuario inactivo, comuníquese con el banco
                </div>
                <div className="text-xs text-text-muted mt-1">
                  Por seguridad no podemos iniciar tu sesión. Comunícate a la
                  línea de atención.
                </div>
              </div>
            </div>
          )}

          {status === "locked" && (
            <div
              role="alert"
              className="rounded-2xl p-5 mb-5 bg-danger/10 border border-danger/30"
            >
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-full shrink-0 bg-danger/15 text-red-400">
                  <IcoLock />
                </span>
                <div>
                  <div className="text-sm font-bold text-red-400">
                    Acceso bloqueado temporalmente por intentos fallidos
                  </div>
                  <div className="text-xs text-text-muted mt-1.5 leading-relaxed">
                    Detectamos 3 intentos fallidos consecutivos. Podrás volver a
                    intentarlo cuando termine el tiempo de seguridad.
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-sm font-semibold text-text-secondary">
                    <IcoClock />
                    14:59 minutos restantes
                  </div>
                </div>
              </div>
            </div>
          )}

          <form
            onSubmit={handleLogin}
            noValidate
            className="flex flex-col gap-5"
          >
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-semibold tracking-wide uppercase mb-2 text-purple-200 font-display"
              >
                Usuario
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                  <IcoUser />
                </span>
                <input
                  id="login-username"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value)
                    setFieldError("")
                    if (status !== "locked") setStatus("idle")
                  }}
                  disabled={status === "locked" || status === "loading"}
                  autoComplete="username"
                  placeholder="Ingresa tu nombre de usuario"
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none bg-purple-400/5 text-text-primary border border-border focus:border-purple-400/60 focus:ring-4 focus:ring-purple-400/10 disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="login-password"
                  className="text-xs font-semibold tracking-wide uppercase text-purple-200 font-display"
                >
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => navigate("/recuperar-contrasena")}
                  className="text-xs text-purple-300 hover:text-purple-200"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                  <IcoLock />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setFieldError("")
                    if (status !== "locked") setStatus("idle")
                  }}
                  disabled={status === "locked" || status === "loading"}
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  className="w-full pl-11 pr-12 py-3 rounded-xl text-sm outline-none bg-purple-400/5 text-text-primary border border-border focus:border-purple-400/60 focus:ring-4 focus:ring-purple-400/10 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={status === "locked"}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-purple-200 disabled:opacity-50"
                >
                  <IcoEye />
                </button>
              </div>
            </div>

            {fieldError && (
              <span className="flex items-center gap-1.5 text-xs text-red-400">
                <IcoAlert />
                {fieldError}
              </span>
            )}

            <label className="flex items-center gap-2.5 text-xs text-text-muted cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-purple-600"
              />
              Recordar mi usuario en este dispositivo
            </label>

            <button
              type="submit"
              disabled={status === "locked" || status === "loading"}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-purple-600 to-accent shadow-lg shadow-purple-600/25 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
            >
              {status === "loading" ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Validando acceso...
                </>
              ) : (
                <>
                  <IcoLock />
                  Ingresar de forma segura
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-2 mt-5 text-xs text-text-muted justify-center">
            <IcoShield />
            Conexión segura mediante HTTPS
          </div>

          <div className="rounded-xl p-4 mt-6 bg-purple-400/5 border border-border">
            <div className="flex items-start gap-2.5">
              <span className="text-purple-300 mt-0.5">
                <IcoInfo />
              </span>
              <div className="text-xs text-text-muted leading-relaxed">
                <span className="font-semibold text-purple-200">
                  Acceso para gestores y clientes
                </span>
                <br />
                Usa tu cédula y contraseña. Para clientes registrados, la contraseña inicial es la cédula.
              </div>
            </div>
            {(status === "locked" || attempts > 0) && (
              <button
                type="button"
                onClick={resetDemo}
                className="w-full mt-3 py-2 rounded-lg text-xs font-semibold text-purple-300 border border-border hover:bg-purple-400/10"
              >
                Reiniciar demostración
              </button>
            )}
          </div>

          <div className="text-center text-xs text-text-muted mt-8">
            ¿Necesitas ayuda?{" "}
            <button
              type="button"
              className="font-semibold text-purple-300 hover:text-purple-200"
            >
              Contactar a Banco X
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
