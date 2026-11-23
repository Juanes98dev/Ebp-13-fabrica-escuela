import { useMemo, useState } from "react";
import Sidebar from "../shared/Sidebar";
import {
  IcoAlert,
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
} from "../shared/icons";
import { CLIENTE_ACTIVO } from "../shared/data";

const CLIENT_NAV = [
  { id: "inicio", label: "Inicio", icon: <IcoDash /> },
  { id: "cuentas", label: "Mis Cuentas", icon: <IcoCuentas /> },
  { id: "transferencias", label: "Transferencias", icon: <IcoTransfer /> },
  { id: "pagos", label: "Pagos", icon: <IcoPagos /> },
  { id: "prestamos", label: "Préstamos", icon: <IcoPrestamos /> },
  { id: "inversiones", label: "Inversiones", icon: <IcoInversiones /> },
  { id: "extractos", label: "Extractos", icon: <IcoExtractos /> },
  { id: "perfil", label: "Perfil y seguridad", icon: <IcoUser /> },
];

const CURRENT_PASSWORD = "BancoX2026!";
const TAKEN_USERNAMES = ["carlos.herrera", "administrador", "soporte.bancox"];

type UsernameStatus = "idle" | "checking" | "available" | "taken";

export default function CredentialsView() {
  const [activeNav, setActiveNav] = useState("perfil");
  const [username, setUsername] = useState("valentina.morales");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const passwordRules = useMemo(() => [
    { label: "Mínimo 8 caracteres", valid: newPassword.length >= 8 },
    { label: "Una letra mayúscula", valid: /[A-Z]/.test(newPassword) },
    { label: "Un número", valid: /\d/.test(newPassword) },
    { label: "Un carácter especial", valid: /[^A-Za-z0-9]/.test(newPassword) },
  ], [newPassword]);

  const passwordValid = passwordRules.every((rule) => rule.valid);
  const usernameChanged = username !== "valentina.morales";

  function handleUsernameChange(value: string) {
    setUsername(value);
    setUsernameStatus("idle");
    setSuccess(false);
    setErrors((current) => ({ ...current, username: "" }));
  }

  function checkUsername() {
    const normalized = username.trim().toLowerCase();
    if (normalized === "valentina.morales") {
      setUsernameStatus("idle");
      return;
    }
    if (!/^[a-zA-Z0-9._-]{5,24}$/.test(normalized)) {
      setErrors((current) => ({ ...current, username: "Use entre 5 y 24 caracteres sin espacios." }));
      return;
    }
    setUsernameStatus("checking");
    window.setTimeout(() => {
      const taken = TAKEN_USERNAMES.includes(normalized);
      setUsernameStatus(taken ? "taken" : "available");
      if (taken) setErrors((current) => ({ ...current, username: "El nombre de usuario no está disponible" }));
    }, 500);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    const normalizedUsername = username.trim().toLowerCase();

    if (currentPassword !== CURRENT_PASSWORD) {
      nextErrors.currentPassword = "La contraseña actual es incorrecta";
    }
    if (!usernameChanged && !newPassword) {
      nextErrors.form = "Modifica el nombre de usuario o ingresa una nueva contraseña.";
    }
    if (usernameChanged && !/^[a-zA-Z0-9._-]{5,24}$/.test(normalizedUsername)) {
      nextErrors.username = "Use entre 5 y 24 caracteres sin espacios.";
    } else if (usernameChanged && TAKEN_USERNAMES.includes(normalizedUsername)) {
      nextErrors.username = "El nombre de usuario no está disponible";
      setUsernameStatus("taken");
    }
    if (newPassword && !passwordValid) {
      nextErrors.newPassword = "La nueva contraseña no cumple todos los requisitos.";
    }
    if (newPassword && confirmPassword !== newPassword) {
      nextErrors.confirmPassword = "Las contraseñas no coinciden.";
    }

    setErrors(nextErrors);
    setSuccess(false);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    window.setTimeout(() => {
      setIsSaving(false);
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setUsernameStatus("idle");
    }, 700);
  }

  function resetForm() {
    setUsername("valentina.morales");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setUsernameStatus("idle");
    setSuccess(false);
  }

  const inputClass = (hasError: boolean) =>
    `w-full px-3.5 py-3 rounded-xl text-sm outline-none bg-purple-400/5 text-text-primary border transition-all focus:ring-4 focus:ring-purple-400/10 ${hasError ? "border-danger" : "border-border focus:border-purple-400/60"}`;

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
            <span>Mi perfil</span><IcoChevron /><span className="text-text-secondary">Seguridad y acceso</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-success/10 text-emerald-400 border border-success/25"><IcoShield />Sesión protegida</span>
            
          </div>
        </div>

        <div className="px-8 py-7 max-w-5xl">
          <div className="mb-7">
            <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md mb-2 inline-block bg-accent/15 text-purple-300 font-display">Centro de seguridad</span>
            <h1 className="text-2xl font-bold mb-1 text-text-primary font-display">Credenciales de acceso</h1>
            <p className="text-sm text-text-muted">Actualiza tu nombre de usuario o contraseña para mantener protegida tu cuenta.</p>
          </div>

          {success && (
            <div role="status" className="flex items-start gap-4 rounded-2xl px-5 py-4 mb-5 bg-success/10 border border-success/30">
              <div className="flex items-center justify-center w-10 h-10 rounded-full shrink-0 bg-success/15 text-emerald-400"><IcoCheck /></div>
              <div className="flex-1">
                <div className="text-sm font-bold text-emerald-400">Credenciales actualizadas correctamente</div>
                <p className="text-xs text-text-muted mt-1">Enviamos una notificación de seguridad a {CLIENTE_ACTIVO.email} con los detalles del cambio.</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-text-muted"><IcoClock />Ahora</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              <section className="rounded-2xl p-6 bg-sidebar border border-border">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-600/15 text-purple-300"><IcoUser /></div>
                  <div>
                    <h2 className="text-sm font-semibold text-text-primary font-display">Nombre de usuario</h2>
                    <p className="text-xs text-text-muted mt-0.5">Será el identificador que usarás para iniciar sesión.</p>
                  </div>
                </div>

                <label htmlFor="username" className="block text-xs font-semibold tracking-wide uppercase mb-2 text-purple-200 font-display">Usuario</label>
                <div className="relative">
                  <input
                    id="username"
                    value={username}
                    onChange={(event) => handleUsernameChange(event.target.value)}
                    onBlur={checkUsername}
                    aria-invalid={Boolean(errors.username)}
                    autoComplete="username"
                    className={`${inputClass(Boolean(errors.username))} pr-28`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === "checking" && <span className="flex items-center gap-1.5 text-xs text-text-muted"><span className="w-3.5 h-3.5 rounded-full border-2 border-purple-300/40 border-t-purple-300 animate-spin" />Validando</span>}
                    {usernameStatus === "available" && <span className="flex items-center gap-1 text-xs text-emerald-400"><IcoCheck />Disponible</span>}
                  </div>
                </div>
                {errors.username ? (
                  <span className="flex items-center gap-1.5 text-xs mt-2 text-red-400"><IcoAlert />{errors.username}</span>
                ) : (
                  <span className="block text-xs mt-2 text-text-muted">Entre 5 y 24 caracteres. Puedes usar letras, números, puntos, guiones y guion bajo.</span>
                )}
              </section>

              <section className="rounded-2xl p-6 bg-sidebar border border-border">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-600/15 text-purple-300"><IcoLock /></div>
                  <div>
                    <h2 className="text-sm font-semibold text-text-primary font-display">Contraseña</h2>
                    <p className="text-xs text-text-muted mt-0.5">Valida tu identidad antes de guardar cualquier cambio.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="current-password" className="block text-xs font-semibold tracking-wide uppercase mb-2 text-purple-200 font-display">Contraseña actual <span className="text-accent">*</span></label>
                    <div className="relative">
                      <input
                        id="current-password"
                        type={showCurrent ? "text" : "password"}
                        value={currentPassword}
                        onChange={(event) => {
                          setCurrentPassword(event.target.value);
                          setErrors((current) => ({ ...current, currentPassword: "" }));
                          setSuccess(false);
                        }}
                        autoComplete="current-password"
                        aria-invalid={Boolean(errors.currentPassword)}
                        placeholder="Ingresa tu contraseña actual"
                        className={`${inputClass(Boolean(errors.currentPassword))} pr-12`}
                      />
                      <button type="button" onClick={() => setShowCurrent((current) => !current)} aria-label={showCurrent ? "Ocultar contraseña actual" : "Mostrar contraseña actual"} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-purple-200">
                        <IcoEye />
                      </button>
                    </div>
                    {errors.currentPassword && <span className="flex items-center gap-1.5 text-xs mt-2 text-red-400"><IcoAlert />{errors.currentPassword}</span>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="new-password" className="block text-xs font-semibold tracking-wide uppercase mb-2 text-purple-200 font-display">Nueva contraseña</label>
                      <div className="relative">
                        <input
                          id="new-password"
                          type={showNew ? "text" : "password"}
                          value={newPassword}
                          onChange={(event) => {
                            setNewPassword(event.target.value);
                            setErrors((current) => ({ ...current, newPassword: "" }));
                            setSuccess(false);
                          }}
                          autoComplete="new-password"
                          aria-invalid={Boolean(errors.newPassword)}
                          placeholder="Crea una contraseña segura"
                          className={`${inputClass(Boolean(errors.newPassword))} pr-12`}
                        />
                        <button type="button" onClick={() => setShowNew((current) => !current)} aria-label={showNew ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-purple-200">
                          <IcoEye />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="confirm-password" className="block text-xs font-semibold tracking-wide uppercase mb-2 text-purple-200 font-display">Confirmar contraseña</label>
                      <input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => {
                          setConfirmPassword(event.target.value);
                          setErrors((current) => ({ ...current, confirmPassword: "" }));
                        }}
                        autoComplete="new-password"
                        aria-invalid={Boolean(errors.confirmPassword)}
                        placeholder="Repite la nueva contraseña"
                        className={inputClass(Boolean(errors.confirmPassword))}
                      />
                    </div>
                  </div>

                  {(errors.newPassword || errors.confirmPassword) && (
                    <div className="flex flex-col gap-1.5">
                      {errors.newPassword && <span className="flex items-center gap-1.5 text-xs text-red-400"><IcoAlert />{errors.newPassword}</span>}
                      {errors.confirmPassword && <span className="flex items-center gap-1.5 text-xs text-red-400"><IcoAlert />{errors.confirmPassword}</span>}
                    </div>
                  )}

                  <div className="rounded-xl p-4 bg-purple-400/5 border border-border">
                    <div className="text-xs font-semibold text-text-secondary mb-3">Tu nueva contraseña debe incluir:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {passwordRules.map((rule) => (
                        <div key={rule.label} className={`flex items-center gap-2 text-xs ${newPassword && rule.valid ? "text-emerald-400" : newPassword ? "text-red-400" : "text-text-muted"}`}>
                          <span className={`flex items-center justify-center w-4 h-4 rounded-full border ${newPassword && rule.valid ? "bg-success/15 border-success/30" : newPassword ? "bg-danger/10 border-danger/30" : "border-border"}`}>
                            {newPassword && rule.valid ? <span className="[&>svg]:w-2.5 [&>svg]:h-2.5"><IcoCheck /></span> : <span className="w-1 h-1 rounded-full bg-current" />}
                          </span>
                          {rule.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {errors.form && (
                <div className="flex items-center gap-2 rounded-xl px-4 py-3 bg-danger/10 border border-danger/25 text-sm text-red-400">
                  <IcoAlert />{errors.form}
                </div>
              )}

              <div className="flex items-center justify-between pb-6">
                <button type="button" onClick={resetForm} className="px-5 py-2.5 rounded-xl text-sm font-medium text-text-muted border border-border hover:text-purple-200 hover:border-purple-400/40">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-purple-600 to-accent shadow-lg shadow-purple-600/25 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0">
                  {isSaving ? <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Actualizando...</> : <><IcoShield />Actualizar credenciales</>}
                </button>
              </div>
            </form>

            <aside className="flex flex-col gap-4">
              <div className="rounded-2xl p-5 bg-sidebar border border-border">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl mb-4 bg-success/10 text-emerald-400"><IcoShield /></div>
                <h2 className="text-sm font-semibold text-text-primary font-display">Protección de credenciales</h2>
                <p className="text-xs text-text-muted leading-relaxed mt-2">Tus contraseñas se procesan de forma segura y se almacenan mediante hash. Banco X nunca puede consultar su contenido.</p>
              </div>

              <div className="rounded-2xl p-5 bg-sidebar border border-border">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl mb-4 bg-purple-600/15 text-purple-300"><IcoMail /></div>
                <h2 className="text-sm font-semibold text-text-primary font-display">Notificación por correo</h2>
                <p className="text-xs text-text-muted leading-relaxed mt-2">Después del cambio enviaremos una alerta a:</p>
                <div className="text-xs font-medium text-purple-200 mt-3 break-all">{CLIENTE_ACTIVO.email}</div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl p-4 bg-warn/5 border border-warn/20">
                <span className="text-amber-400 shrink-0 mt-0.5"><IcoInfo /></span>
                <p className="text-xs text-text-muted leading-relaxed">Nunca compartas tu contraseña. Banco X no la solicitará por correo, llamada o mensaje.</p>
              </div>

            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
