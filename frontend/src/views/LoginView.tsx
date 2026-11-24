import { useState } from "react"
import { Navigate, useNavigate, useSearchParams } from "react-router"
import {
  IcoAlert,
  IcoClock,
  IcoEye,
  IcoInfo,
  IcoLock,
  IcoShield,
  IcoUser,
} from "../shared/icons"
import { ApiError, apiRequest } from "../shared/api"
import {
  clearSession,
  getSession,
  homeFor,
  saveSession,
  type LoginResponse,
} from "../shared/session"

type LoginStatus = "idle" | "loading" | "error" | "inactive" | "locked"

const REMEMBER_KEY = "bancox-remembered-cedula"

export default function LoginView() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const remembered = window.localStorage.getItem(REMEMBER_KEY) ?? ""
  const [cedula, setCedula] = useState(remembered)
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(Boolean(remembered))
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<LoginStatus>("idle")
  const [serverMessage, setServerMessage] = useState("")
  const [fieldError, setFieldError] = useState("")
  const sessionNotice = searchParams.get("motivo")

  const session = getSession()
  if (session) return <Navigate to={homeFor(session.rol)} replace />

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault()
    const value = cedula.trim()
    if (!value || !password) {
      setFieldError("Ingresa tu cédula y contraseña para continuar.")
      return
    }
    if (!/^\d{6,10}$/.test(value)) {
      setFieldError("La cédula debe contener entre 6 y 10 dígitos.")
      return
    }

    setFieldError("")
    setServerMessage("")
    setStatus("loading")
    clearSession()
    try {
      const result = await apiRequest<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ cedula: value, password }),
      })
      if (remember) window.localStorage.setItem(REMEMBER_KEY, value)
      else window.localStorage.removeItem(REMEMBER_KEY)
      saveSession(result)
      navigate(homeFor(result.rol), { replace: true })
    } catch (error) {
      setPassword("")
      const message =
        error instanceof Error ? error.message : "No fue posible iniciar sesión"
      setServerMessage(message)
      if (error instanceof ApiError && error.status === 423) setStatus("locked")
      else if (error instanceof ApiError && error.status === 403) setStatus("inactive")
      else setStatus("error")
    }
  }

  const disabled = status === "loading"

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
                description: "La sesión se cierra tras 10 minutos de inactividad.",
              },
              {
                icon: <IcoShield />,
                title: "Monitoreo continuo",
                description: "Bloqueo temporal tras 3 intentos fallidos.",
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
          © {new Date().getFullYear()} Banco X · Vigilado por la Superintendencia Financiera
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

          <div className="mb-8">
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

          {sessionNotice && status === "idle" && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-xl px-4 py-3.5 mb-5 bg-warn/10 border border-warn/25"
            >
              <span className="text-amber-400 mt-0.5">
                <IcoClock />
              </span>
              <div className="text-sm font-semibold text-amber-400">{sessionNotice}</div>
            </div>
          )}

          {status === "error" && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl px-4 py-3.5 mb-5 bg-danger/10 border border-danger/25"
            >
              <span className="text-red-400 mt-0.5">
                <IcoAlert />
              </span>
              <div>
                <div className="text-sm font-semibold text-red-400">{serverMessage}</div>
                <div className="text-xs text-text-muted mt-1">
                  Por seguridad, tras 3 intentos fallidos el acceso se bloquea temporalmente.
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
                <div className="text-xs text-text-muted mt-1">{serverMessage}</div>
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
                    Acceso bloqueado temporalmente
                  </div>
                  <div className="text-xs text-text-muted mt-1.5 leading-relaxed">
                    {serverMessage}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/recuperar-contrasena")}
                    className="mt-3 text-xs font-semibold text-purple-300 hover:text-purple-200"
                  >
                    Recuperar mi contraseña
                  </button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} noValidate className="flex flex-col gap-5">
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-semibold tracking-wide uppercase mb-2 text-purple-200 font-display"
              >
                Cédula
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                  <IcoUser />
                </span>
                <input
                  id="login-username"
                  value={cedula}
                  onChange={(event) => {
                    setCedula(event.target.value.replace(/\D/g, "").slice(0, 10))
                    setFieldError("")
                  }}
                  disabled={disabled}
                  inputMode="numeric"
                  autoComplete="username"
                  placeholder="Ingresa tu número de cédula"
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
                  }}
                  disabled={disabled}
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  className="w-full pl-11 pr-12 py-3 rounded-xl text-sm outline-none bg-purple-400/5 text-text-primary border border-border focus:border-purple-400/60 focus:ring-4 focus:ring-purple-400/10 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-purple-200"
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
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="w-4 h-4 rounded accent-purple-600"
              />
              Recordar mi cédula en este dispositivo
            </label>

            <button
              type="submit"
              disabled={disabled}
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
                Usa tu cédula y contraseña. Si eres cliente nuevo, tu contraseña
                inicial es tu cédula; cámbiala desde "Seguridad" al ingresar.
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-text-muted mt-8">
            ¿Necesitas ayuda?{" "}
            <a
              href="mailto:soporte@bancox.local"
              className="font-semibold text-purple-300 hover:text-purple-200"
            >
              Contactar a Banco X
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
