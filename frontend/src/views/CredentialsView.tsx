import { useMemo, useState } from "react";
import { Link } from "react-router";
import Sidebar from "../shared/Sidebar";
import { apiRequest, errorMessage } from "../shared/api";
import { getSession } from "../shared/session";
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
} from "../shared/icons";

type CampoError = "currentPassword" | "newPassword" | "confirmPassword" | "form";

export default function CredentialsView() {
  const cedula = getSession()?.cedula ?? "";
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<CampoError, string>>>({});
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const passwordRules = useMemo(() => [
    { label: "Entre 8 y 64 caracteres", valid: newPassword.length >= 8 && newPassword.length <= 64 },
    { label: "Una letra mayúscula", valid: /[A-Z]/.test(newPassword) },
    { label: "Un número", valid: /\d/.test(newPassword) },
    { label: "Un carácter especial", valid: /[^A-Za-z0-9]/.test(newPassword) },
  ], [newPassword]);

  const passwordValid = passwordRules.every((rule) => rule.valid);

  function clearError(campo: CampoError) {
    setErrors((current) => ({ ...current, [campo]: undefined, form: undefined }));
    setSuccess(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: Partial<Record<CampoError, string>> = {};

    if (!currentPassword) nextErrors.currentPassword = "Ingresa tu contraseña actual";
    if (!newPassword) nextErrors.newPassword = "Ingresa la nueva contraseña";
    else if (!passwordValid) nextErrors.newPassword = "La nueva contraseña no cumple todos los requisitos.";
    else if (newPassword === currentPassword) nextErrors.newPassword = "La nueva contraseña debe ser diferente a la actual";
    if (newPassword && confirmPassword !== newPassword) nextErrors.confirmPassword = "Las contraseñas no coinciden.";

    setErrors(nextErrors);
    setSuccess(false);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSaving(true);
    try {
      await apiRequest("/api/auth/cambiar-password", {
        method: "POST",
        body: JSON.stringify({ passwordActual: currentPassword, passwordNueva: newPassword }),
      });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (caught) {
      const mensaje = errorMessage(caught, "No fue posible actualizar la contraseña");
      const texto = mensaje.toLowerCase();
      if (texto.includes("actual no es correcta")) setErrors({ currentPassword: mensaje });
      else if (texto.includes("contraseña")) setErrors({ newPassword: mensaje });
      else setErrors({ form: mensaje });
    } finally {
      setIsSaving(false);
    }
  }

  function resetForm() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setSuccess(false);
  }

  const inputClass = (hasError: boolean) =>
    `w-full px-3.5 py-3 rounded-xl text-sm outline-none bg-purple-400/5 text-text-primary border transition-all focus:ring-4 focus:ring-purple-400/10 ${hasError ? "border-danger" : "border-border focus:border-purple-400/60"}`;

  return (
    <div className="flex h-full overflow-hidden bg-bg-base">
      <Sidebar variant="cliente" />

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
            <p className="text-sm text-text-muted">Actualiza tu contraseña para mantener protegida tu cuenta.</p>
          </div>

          {success && (
            <div role="status" className="flex items-start gap-4 rounded-2xl px-5 py-4 mb-5 bg-success/10 border border-success/30">
              <div className="flex items-center justify-center w-10 h-10 rounded-full shrink-0 bg-success/15 text-emerald-400"><IcoCheck /></div>
              <div className="flex-1">
                <div className="text-sm font-bold text-emerald-400">Contraseña actualizada correctamente</div>
                <p className="text-xs text-text-muted mt-1">
                  Cerramos tus otras sesiones abiertas y enviamos una notificación de seguridad a tu correo registrado.
                </p>
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
                    <h2 className="text-sm font-semibold text-text-primary font-display">Usuario de acceso</h2>
                    <p className="text-xs text-text-muted mt-0.5">Inicias sesión con tu número de cédula.</p>
                  </div>
                </div>

                <label htmlFor="username" className="block text-xs font-semibold tracking-wide uppercase mb-2 text-purple-200 font-display">Usuario</label>
                <div className="relative">
                  <input
                    id="username"
                    value={cedula}
                    readOnly
                    aria-readonly="true"
                    autoComplete="username"
                    data-i18n-ignore
                    className="w-full px-3.5 py-3 pr-11 rounded-xl text-sm outline-none bg-black/15 text-text-muted border border-border cursor-not-allowed"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted"><IcoLock /></span>
                </div>
                <span className="block text-xs mt-2 text-text-muted">El usuario corresponde a tu documento y no puede modificarse.</span>
              </section>

              <section className="rounded-2xl p-6 bg-sidebar border border-border">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-600/15 text-purple-300"><IcoLock /></div>
                  <div>
                    <h2 className="text-sm font-semibold text-text-primary font-display">Contraseña</h2>
                    <p className="text-xs text-text-muted mt-0.5">Valida tu identidad antes de guardar el cambio.</p>
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
                          clearError("currentPassword");
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
                      <label htmlFor="new-password" className="block text-xs font-semibold tracking-wide uppercase mb-2 text-purple-200 font-display">Nueva contraseña <span className="text-accent">*</span></label>
                      <div className="relative">
                        <input
                          id="new-password"
                          type={showNew ? "text" : "password"}
                          value={newPassword}
                          maxLength={64}
                          onChange={(event) => {
                            setNewPassword(event.target.value);
                            clearError("newPassword");
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
                      <label htmlFor="confirm-password" className="block text-xs font-semibold tracking-wide uppercase mb-2 text-purple-200 font-display">Confirmar contraseña <span className="text-accent">*</span></label>
                      <input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        maxLength={64}
                        onChange={(event) => {
                          setConfirmPassword(event.target.value);
                          clearError("confirmPassword");
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
                <div role="alert" className="flex items-center gap-2 rounded-xl px-4 py-3 bg-danger/10 border border-danger/25 text-sm text-red-400">
                  <IcoAlert />{errors.form}
                </div>
              )}

              <div className="flex items-center justify-between pb-6">
                <button type="button" onClick={resetForm} disabled={isSaving} className="px-5 py-2.5 rounded-xl text-sm font-medium text-text-muted border border-border hover:text-purple-200 hover:border-purple-400/40 disabled:opacity-50">
                  Limpiar
                </button>
                <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-purple-600 to-accent shadow-lg shadow-purple-600/25 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0">
                  {isSaving ? <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Actualizando...</> : <><IcoShield />Actualizar contraseña</>}
                </button>
              </div>
            </form>

            <aside className="flex flex-col gap-4">
              <div className="rounded-2xl p-5 bg-sidebar border border-border">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl mb-4 bg-success/10 text-emerald-400"><IcoShield /></div>
                <h2 className="text-sm font-semibold text-text-primary font-display">Protección de credenciales</h2>
                <p className="text-xs text-text-muted leading-relaxed mt-2">Tus contraseñas se almacenan mediante hash. Banco X nunca puede consultar su contenido.</p>
              </div>

              <div className="rounded-2xl p-5 bg-sidebar border border-border">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl mb-4 bg-purple-600/15 text-purple-300"><IcoMail /></div>
                <h2 className="text-sm font-semibold text-text-primary font-display">Notificación por correo</h2>
                <p className="text-xs text-text-muted leading-relaxed mt-2">Después del cambio enviaremos una alerta a tu correo registrado y cerraremos las demás sesiones abiertas.</p>
                <Link to="/perfil/sesiones" className="inline-block text-xs font-semibold text-purple-300 hover:underline mt-3">Ver mis sesiones</Link>
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
