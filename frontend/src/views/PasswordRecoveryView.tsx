import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { CLIENTE_ACTIVO } from "../shared/data"
import { apiRequest } from "../shared/api"
import {
  IcoAlert,
  IcoCheck,
  IcoChevron,
  IcoClock,
  IcoEye,
  IcoInfo,
  IcoLock,
  IcoMail,
  IcoShield,
  IcoUser,
} from "../shared/icons"

type Step = "request" | "verify" | "reset" | "success"
type CodeState = "active" | "expired" | "invalidated" | "used"

const REGISTERED_EMAIL = CLIENTE_ACTIVO.email
const VALID_CODE = "482913"

export default function PasswordRecoveryView() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>("request")
  const [email, setEmail] = useState("")
  const [requestCount, setRequestCount] = useState(0)
  const [genericNotice, setGenericNotice] = useState("")
  const [requestError, setRequestError] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [codeState, setCodeState] = useState<CodeState>("active")
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [codeError, setCodeError] = useState("")
  const [secondsLeft, setSecondsLeft] = useState(600)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {},
  )
  const [isSaving, setIsSaving] = useState(false)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

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
    if (step !== "verify" || codeState !== "active") return
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          setCodeState("expired")
          return 0
        }
        return current - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [step, codeState])

  const currentStepIndex = {
    request: 0,
    verify: 1,
    reset: 2,
    success: 3,
  }[step]

  const steps = [
    {
      label: "Identifica tu cuenta",
      description: "Ingresa el correo registrado",
    },
    {
      label: "Verifica el código",
      description: "Código de un solo uso",
    },
    {
      label: "Crea una nueva clave",
      description: "Protege nuevamente tu cuenta",
    },
    {
      label: "Recuperación completa",
      description: "Todas las sesiones cerradas",
    },
  ]

  async function requestCode(event: React.FormEvent) {
    event.preventDefault()
    setRequestError("")
    setGenericNotice("")
    const normalized = email.trim().toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setRequestError("Ingresa un correo electrónico válido")
      return
    }

    setIsSending(true)
    try {
      const result = await apiRequest<{ mensaje: string }>("/api/auth/recuperar", {
        method: "POST",
        body: JSON.stringify({ correo: normalized }),
      })
      setIsSending(false)
      setGenericNotice(result.mensaje)
      setRequestCount((count) => count + 1)
      setCode(["", "", "", "", "", ""])
      setFailedAttempts(0)
      setCodeError("")
      setCodeState("active")
      setSecondsLeft(600)
      setStep("verify")
    } catch (error) {
      setIsSending(false)
      setRequestError(error instanceof Error ? error.message : "No fue posible solicitar el código")
    }
  }

  function updateCode(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1)
    const next = [...code]
    next[index] = digit
    setCode(next)
    setCodeError("")
    if (digit && index < 5) inputRefs.current[index + 1]?.focus()
  }

  function handleCodeKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function verifyCode(event: React.FormEvent) {
    event.preventDefault()
    const enteredCode = code.join("")
    if (enteredCode.length !== 6) {
      setCodeError("Ingresa los 6 dígitos del código")
      return
    }
    if (codeState === "expired") {
      setCodeError("El código ha vencido, solicite uno nuevo")
      return
    }
    if (codeState === "used") {
      setCodeError("El código no es válido")
      return
    }
    if (codeState === "invalidated") {
      setCodeError("El código no es válido")
      return
    }
    setCodeState("used")
    setCodeError("")
    setStep("reset")
  }

  function requestAnotherCode() {
    setStep("request")
    setCode(["", "", "", "", "", ""])
    setCodeError("")
    setGenericNotice("")
  }

  async function resetPassword(event: React.FormEvent) {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!passwordRules.every((rule) => rule.valid)) {
      nextErrors.password =
        "La nueva contraseña no cumple todos los requisitos."
    }
    if (newPassword !== confirmPassword) {
      nextErrors.confirmation = "Las contraseñas no coinciden."
    }
    setPasswordErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setIsSaving(true)
    try {
      await apiRequest<{ mensaje: string }>("/api/auth/restablecer", {
        method: "POST",
        body: JSON.stringify({
          correo: email.trim().toLowerCase(),
          codigo: code.join(""),
          password: newPassword,
        }),
      })
      window.localStorage.removeItem("bancox-session-token")
      window.localStorage.removeItem("bancox-user-id")
      window.localStorage.removeItem("bancox-role")
      window.localStorage.removeItem("bancox-name")
      window.localStorage.removeItem("bancox-cedula")
      setIsSaving(false)
      setStep("success")
    } catch (error) {
      setIsSaving(false)
      setPasswordErrors({
        confirmation:
          error instanceof Error ? error.message : "No fue posible restablecer la contraseña",
      })
    }
  }

  function simulateExpiredCode() {
    setCodeState("expired")
    setSecondsLeft(0)
    setCode(["4", "8", "2", "9", "1", "3"])
    setCodeError("")
  }

  function simulateRequestLimit() {
    setEmail(REGISTERED_EMAIL)
    setRequestCount(3)
    setRequestError("")
    setGenericNotice("")
  }

  function testCodeReuse() {
    setStep("verify")
    setCodeState("used")
    setCode(["4", "8", "2", "9", "1", "3"])
    setCodeError("")
    setSecondsLeft(480)
  }

  function resetDemo() {
    setStep("request")
    setEmail("")
    setRequestCount(0)
    setGenericNotice("")
    setRequestError("")
    setCode(["", "", "", "", "", ""])
    setCodeState("active")
    setFailedAttempts(0)
    setCodeError("")
    setSecondsLeft(600)
    setNewPassword("")
    setConfirmPassword("")
    setPasswordErrors({})
  }

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`

  return (
    <div className="min-h-full bg-bg-base lg:flex">
      <aside className="relative hidden w-[360px] shrink-0 overflow-hidden border-r border-border bg-sidebar p-8 lg:flex lg:flex-col">
        <div className="absolute -left-28 -top-28 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-28 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="relative flex w-fit items-center gap-3 text-left"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-accent font-display text-sm font-bold text-white">
            BX
          </span>
          <span>
            <span className="block font-display text-sm font-semibold text-text-primary">
              Banco X
            </span>
            <span className="block text-xs text-text-muted">
              Banca personal
            </span>
          </span>
        </button>

        <div className="relative mt-16">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-300">
            Recuperación segura
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-text-primary">
            Recupera tu acceso
            <br />
            <span className="text-purple-300">paso a paso.</span>
          </h1>

          <div className="mt-10 space-y-1">
            {steps.map((item, index) => {
              const active = index === currentStepIndex
              const done = index < currentStepIndex
              return (
                <div key={item.label} className="relative flex gap-4 pb-7">
                  {index < steps.length - 1 && (
                    <span
                      className={`absolute left-[15px] top-8 h-[calc(100%-20px)] w-px ${
                        done ? "bg-success/40" : "bg-border"
                      }`}
                    />
                  )}
                  <span
                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                      done
                        ? "border-success/30 bg-success/15 text-emerald-400"
                        : active
                          ? "border-purple-500 bg-gradient-to-br from-purple-600 to-accent text-white"
                          : "border-border bg-sidebar text-text-muted"
                    }`}
                  >
                    {done ? (
                      <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">
                        <IcoCheck />
                      </span>
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div>
                    <div
                      className={`text-sm font-semibold ${
                        active
                          ? "text-purple-200"
                          : done
                            ? "text-emerald-400"
                            : "text-text-muted"
                      }`}
                    >
                      {item.label}
                    </div>
                    <div className="mt-1 text-xs text-text-muted">
                      {item.description}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="relative mt-auto rounded-xl border border-border bg-purple-400/5 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-200">
            <IcoShield />
            Protección del código
          </div>
          <p className="mt-2 text-xs leading-relaxed text-text-muted">
            Vence en 10 minutos, se almacena con hash y solo puede utilizarse
            una vez.
          </p>
        </div>
      </aside>

      <main className="flex min-h-full flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-4 lg:px-10">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-purple-200"
          >
            <span className="rotate-180">
              <IcoChevron />
            </span>
            Volver al inicio de sesión
          </button>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-lg border border-success/25 bg-success/10 px-3 py-1.5 text-xs text-emerald-400 sm:flex">
              <IcoShield />
              Código de un solo uso
            </span>
            <span className="rounded-lg border border-border bg-purple-600/15 px-3 py-1.5 text-xs text-purple-200">
              HUS-02-02-04
            </span>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-xl">
            <div className="mb-8 lg:hidden">
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-accent font-display text-sm font-bold text-white">
                  BX
                </span>
                <span className="font-display text-base font-semibold text-text-primary">
                  Banco X
                </span>
              </div>
              <div className="flex items-center gap-2">
                {steps.map((item, index) => (
                  <span
                    key={item.label}
                    className={`h-1.5 flex-1 rounded-full ${
                      index <= currentStepIndex
                        ? "bg-purple-500"
                        : "bg-purple-400/10"
                    }`}
                  />
                ))}
              </div>
            </div>

            {step === "request" && (
              <div>
                <span className="font-display text-xs font-semibold uppercase tracking-wider text-purple-300">
                  Paso 1 de 3
                </span>
                <h2 className="mt-2 font-display text-2xl font-bold text-text-primary">
                  Recupera tu contraseña
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  Ingresa el correo asociado a tu cuenta. Si está registrado,
                  enviaremos un código de verificación de 6 dígitos.
                </p>

                {genericNotice && (
                  <div
                    role="status"
                    className="mt-6 flex items-start gap-3 rounded-xl border border-success/25 bg-success/10 px-4 py-3.5"
                  >
                    <span className="mt-0.5 text-emerald-400">
                      <IcoCheck />
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-emerald-400">
                        Solicitud recibida
                      </div>
                      <p className="mt-1 text-xs text-text-muted">
                        {genericNotice}
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={requestCode} noValidate className="mt-7">
                  <label
                    htmlFor="recovery-email"
                    className="mb-2 block font-display text-xs font-semibold uppercase tracking-wide text-purple-200"
                  >
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                      <IcoMail />
                    </span>
                    <input
                      id="recovery-email"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value)
                        setRequestError("")
                        setGenericNotice("")
                      }}
                      placeholder="nombre@correo.com"
                      autoComplete="email"
                      aria-invalid={Boolean(requestError)}
                      className={`w-full rounded-xl border bg-purple-400/5 py-3.5 pl-11 pr-4 text-sm text-text-primary outline-none transition-all focus:ring-4 focus:ring-purple-400/10 ${
                        requestError
                          ? "border-danger"
                          : "border-border focus:border-purple-400/60"
                      }`}
                    />
                  </div>
                  {requestError && (
                    <div
                      role="alert"
                      className="mt-3 flex items-center gap-2 text-xs text-red-400"
                    >
                      <IcoAlert />
                      {requestError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSending}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-purple-600 to-accent py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
                  >
                    {isSending ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Enviando código...
                      </>
                    ) : (
                      <>
                        <IcoMail />
                        Enviar código de verificación
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 rounded-xl border border-border bg-sidebar p-4">
                </div>
              </div>
            )}

            {step === "verify" && (
              <div>
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <span className="font-display text-xs font-semibold uppercase tracking-wider text-purple-300">
                      Paso 2 de 3
                    </span>
                    <h2 className="mt-2 font-display text-2xl font-bold text-text-primary">
                      Ingresa el código
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-text-muted">
                      Enviamos un código de 6 dígitos a{" "}
                      <span className="font-medium text-text-secondary">
                        v••••••s@email.com
                      </span>
                    </p>
                  </div>
                  <div
                    className={`rounded-xl border px-3 py-2 text-right ${
                      secondsLeft > 120
                        ? "border-border bg-purple-400/5"
                        : "border-warn/25 bg-warn/5"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                      <IcoClock />
                      Código válido por
                    </div>
                    <div
                      className={`mt-1 font-display text-lg font-bold ${
                        secondsLeft > 120 ? "text-purple-200" : "text-amber-400"
                      }`}
                    >
                      {formattedTime}
                    </div>
                  </div>
                </div>

                <form onSubmit={verifyCode} className="mt-8">
                  <div className="flex justify-between gap-2 sm:gap-3">
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        ref={(element) => {
                          inputRefs.current[index] = element
                        }}
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(event) =>
                          updateCode(index, event.target.value)
                        }
                        onKeyDown={(event) => handleCodeKeyDown(index, event)}
                        aria-label={`Dígito ${index + 1}`}
                        className={`h-14 min-w-0 flex-1 rounded-xl border bg-purple-400/5 text-center font-display text-xl font-bold text-text-primary outline-none focus:ring-4 focus:ring-purple-400/10 ${
                          codeError
                            ? "border-danger/60"
                            : "border-border focus:border-purple-400/60"
                        }`}
                      />
                    ))}
                  </div>

                  {codeError && (
                    <div
                      role="alert"
                      className="mt-4 flex items-start gap-2 rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-xs text-red-400"
                    >
                      <span className="mt-0.5">
                        <IcoAlert />
                      </span>
                      <span>{codeError}</span>
                    </div>
                  )}

                  {codeState === "active" && failedAttempts > 0 && (
                    <div className="mt-4 flex gap-2">
                      {[0, 1, 2].map((attempt) => (
                        <span
                          key={attempt}
                          className={`h-1.5 flex-1 rounded-full ${
                            attempt < failedAttempts
                              ? "bg-danger"
                              : "bg-purple-400/10"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {codeState !== "invalidated" ? (
                    <button
                      type="submit"
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-purple-600 to-accent py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/25"
                    >
                      <IcoShield />
                      Verificar código
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={requestAnotherCode}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-purple-600 to-accent py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/25"
                    >
                      <IcoMail />
                      Solicitar un código nuevo
                    </button>
                  )}
                  {(codeState === "expired" || codeState === "used") &&
                    codeError && (
                      <button
                        type="button"
                        onClick={requestAnotherCode}
                        className="mt-3 w-full rounded-xl border border-border py-3 text-xs font-semibold text-purple-200 hover:bg-purple-400/10"
                      >
                        Solicitar un código nuevo
                      </button>
                    )}
                </form>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-sidebar p-4 text-xs text-text-muted">
                    <span className="font-semibold text-purple-200">
                      Código para probar
                    </span>
                    <div className="mt-2 font-display text-lg font-bold tracking-[0.25em] text-text-secondary">
                      482913
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={requestAnotherCode}
                  className="mt-5 w-full text-center text-xs font-semibold text-purple-300 hover:text-purple-200"
                >
                  No recibí el código · Solicitar otro
                </button>
              </div>
            )}

            {step === "reset" && (
              <div>
                <span className="font-display text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Identidad verificada
                </span>
                <h2 className="mt-2 font-display text-2xl font-bold text-text-primary">
                  Crea una nueva contraseña
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  El código ya fue consumido y no podrá utilizarse nuevamente.
                  Al guardar, cerraremos todas tus sesiones abiertas.
                </p>

                <div className="mt-6 flex items-start gap-3 rounded-xl border border-success/25 bg-success/10 px-4 py-3.5">
                  <span className="mt-0.5 text-emerald-400">
                    <IcoCheck />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-emerald-400">
                      Código verificado correctamente
                    </div>
                    <p className="mt-1 text-xs text-text-muted">
                      El código fue marcado como utilizado y eliminado de forma
                      segura.
                    </p>
                  </div>
                </div>

                <form onSubmit={resetPassword} noValidate className="mt-6">
                  <div>
                    <label
                      htmlFor="new-recovery-password"
                      className="mb-2 block font-display text-xs font-semibold uppercase tracking-wide text-purple-200"
                    >
                      Nueva contraseña
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                        <IcoLock />
                      </span>
                      <input
                        id="new-recovery-password"
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(event) => {
                          setNewPassword(event.target.value)
                          setPasswordErrors((current) => ({
                            ...current,
                            password: "",
                          }))
                        }}
                        placeholder="Crea una contraseña segura"
                        autoComplete="new-password"
                        className={`w-full rounded-xl border bg-purple-400/5 py-3.5 pl-11 pr-12 text-sm text-text-primary outline-none focus:ring-4 focus:ring-purple-400/10 ${
                          passwordErrors.password
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
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-purple-200"
                      >
                        <IcoEye />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label
                      htmlFor="confirm-recovery-password"
                      className="mb-2 block font-display text-xs font-semibold uppercase tracking-wide text-purple-200"
                    >
                      Confirmar contraseña
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                        <IcoLock />
                      </span>
                      <input
                        id="confirm-recovery-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => {
                          setConfirmPassword(event.target.value)
                          setPasswordErrors((current) => ({
                            ...current,
                            confirmation: "",
                          }))
                        }}
                        placeholder="Repite la nueva contraseña"
                        autoComplete="new-password"
                        className={`w-full rounded-xl border bg-purple-400/5 py-3.5 pl-11 pr-4 text-sm text-text-primary outline-none focus:ring-4 focus:ring-purple-400/10 ${
                          passwordErrors.confirmation
                            ? "border-danger"
                            : "border-border focus:border-purple-400/60"
                        }`}
                      />
                    </div>
                  </div>

                  {(passwordErrors.password || passwordErrors.confirmation) && (
                    <div className="mt-3 space-y-1.5 text-xs text-red-400">
                      {passwordErrors.password && (
                        <div className="flex items-center gap-1.5">
                          <IcoAlert />
                          {passwordErrors.password}
                        </div>
                      )}
                      {passwordErrors.confirmation && (
                        <div className="flex items-center gap-1.5">
                          <IcoAlert />
                          {passwordErrors.confirmation}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl border border-border bg-purple-400/5 p-4">
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

                  <div className="mt-5 flex items-start gap-3 rounded-xl border border-warn/20 bg-warn/5 p-4">
                    <span className="mt-0.5 text-amber-400">
                      <IcoInfo />
                    </span>
                    <p className="text-xs leading-relaxed text-text-muted">
                      Por seguridad se cerrarán las sesiones de Chrome en
                      Windows y Safari en iPhone. Deberás iniciar sesión con tu
                      nueva contraseña.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-purple-600 to-accent py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 disabled:opacity-60"
                  >
                    {isSaving ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Protegiendo cuenta...
                      </>
                    ) : (
                      <>
                        <IcoShield />
                        Cambiar contraseña y cerrar sesiones
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {step === "success" && (
              <div className="text-center">
                <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-success/30 bg-success/10 text-emerald-400">
                  <IcoCheck />
                </span>
                <span className="mt-5 block font-display text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Recuperación completada
                </span>
                <h2 className="mt-2 font-display text-2xl font-bold text-text-primary">
                  Contraseña restablecida correctamente
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-muted">
                  Tu nueva contraseña está activa. Cerramos todas las sesiones
                  abiertas para proteger tu cuenta.
                </p>

                <div className="mt-7 grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
                  <div className="rounded-xl border border-success/20 bg-success/5 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                      <IcoLock />2 sesiones cerradas
                    </div>
                    <p className="mt-1.5 text-[11px] text-text-muted">
                      Los tokens de acceso fueron invalidados.
                    </p>
                  </div>
                  <div className="rounded-xl border border-success/20 bg-success/5 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                      <IcoMail />
                      Confirmación enviada
                    </div>
                    <p className="mt-1.5 text-[11px] text-text-muted">
                      Notificamos el cambio a tu correo.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-purple-600 to-accent py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/25"
                >
                  <IcoUser />
                  Ir a iniciar sesión
                </button>
                <button
                  type="button"
                  onClick={testCodeReuse}
                  className="mt-4 text-xs font-semibold text-purple-300 hover:text-purple-200"
                >
                  Probar reutilización del código
                </button>
              </div>
            )}

            <div className="mt-8 flex items-center justify-center gap-3 border-t border-border pt-5">
              <span className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <IcoShield />
                Conexión cifrada
              </span>
              <span className="h-3 w-px bg-border" />
              <button
                type="button"
                onClick={resetDemo}
                className="text-[11px] font-semibold text-purple-300 hover:text-purple-200"
              >
                Reiniciar demostración
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
