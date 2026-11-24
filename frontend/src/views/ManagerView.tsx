import { useState } from "react";
import Sidebar from "../shared/Sidebar";
import { IcoDash, IcoClientes, IcoCuentas, IcoTransfer, IcoProductos, IcoReportes, IcoConfig, IcoAlert, IcoCheck, IcoClose, IcoChevron, IcoAdd } from "../shared/icons";
import { validarCedula } from "../shared/helpers";
import type { ManagerFormData, ManagerFormErrors } from "../shared/types";
import { apiRequest } from "../shared/api";

const MANAGER_NAV = [
  { id: "dashboard", label: "Panel Principal", icon: <IcoDash /> },
  { id: "clientes", label: "Clientes", icon: <IcoClientes /> },
  { id: "cuentas", label: "Cuentas", icon: <IcoCuentas /> },
  { id: "transacciones", label: "Transacciones", icon: <IcoTransfer /> },
  { id: "productos", label: "Productos", icon: <IcoProductos /> },
  { id: "reportes", label: "Reportes", icon: <IcoReportes /> },
  { id: "configuracion", label: "Configuración", icon: <IcoConfig /> },
];

function Field({
  label,
  name,
  value,
  error,
  type = "text",
  placeholder,
  required,
  hint,
  onChange,
}: {
  label: string;
  name: keyof ManagerFormData;
  value: string;
  error?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  onChange: (name: keyof ManagerFormData, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold tracking-wide uppercase" style={{ color: "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>
        {label}{required && <span style={{ color: "#a855f7" }}> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-150"
        style={{ background: "rgba(139,92,246,0.06)", border: `1px solid ${error ? "#ef4444" : "rgba(139,92,246,0.22)"}`, color: "#f1eeff" }}
        onFocus={(event) => { event.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)"; event.currentTarget.style.borderColor = error ? "#ef4444" : "rgba(139,92,246,0.55)"; }}
        onBlur={(event) => { event.currentTarget.style.boxShadow = "none"; event.currentTarget.style.borderColor = error ? "#ef4444" : "rgba(139,92,246,0.22)"; }}
      />
      {error && <span className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "#f87171" }}><IcoAlert />{error}</span>}
      {hint && !error && <span className="text-xs mt-0.5" style={{ color: "#7c6fa0" }}>{hint}</span>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl p-6" style={{ background: "#130d24", border: "1px solid rgba(139,92,246,0.13)" }}>
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(180deg,#6d28d9,#a855f7)" }} />
        <h2 className="text-sm font-semibold" style={{ color: "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function ManagerView() {
  const [activeNav, setActiveNav] = useState("clientes");
  const [form, setForm] = useState<ManagerFormData>({
    cedula: "", primerNombre: "", segundoNombre: "",
    primerApellido: "", segundoApellido: "",
    fechaNacimiento: "", genero: "", email: "",
    telefono: "", direccion: "", ciudad: "", departamento: "",
  });
  const [errors, setErrors] = useState<ManagerFormErrors>({});
  const [cedulaStatus, setCedulaStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const [submitted, setSubmitted] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  function handleCedulaChange(val: string) {
    const limpia = val.replace(/\D/g, "").slice(0, 10);
    setForm((f) => ({ ...f, cedula: limpia }));
    setErrors((e) => ({ ...e, cedula: undefined }));
    setCedulaStatus("idle");
  }

  function handleCedulaBlur() {
    if (!form.cedula) return;
    setCedulaStatus("checking");
    setTimeout(() => {
      const r = validarCedula(form.cedula);
      setCedulaStatus(r.valid ? "ok" : "error");
      setErrors((e) => ({ ...e, cedula: r.valid ? undefined : r.error }));
    }, 600);
  }

  function validate(): ManagerFormErrors {
    const e: ManagerFormErrors = {};
    const ced = validarCedula(form.cedula);
    if (!ced.valid) e.cedula = ced.error;
    if (!form.primerNombre.trim()) e.primerNombre = "El primer nombre es requerido.";
    if (!form.primerApellido.trim()) e.primerApellido = "El primer apellido es requerido.";
    if (!form.fechaNacimiento) e.fechaNacimiento = "La fecha de nacimiento es requerida.";
    if (!form.genero) e.genero = "Seleccione un género.";
    if (!form.email.trim()) e.email = "El correo electrónico es requerido.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Correo electrónico inválido.";
    if (!form.telefono.trim()) e.telefono = "El teléfono es requerido.";
    else if (!/^\d{7,10}$/.test(form.telefono.replace(/\s/g, ""))) e.telefono = "Número inválido (7-10 dígitos).";
    if (!form.ciudad.trim()) e.ciudad = "La ciudad es requerida.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      const cliente = await apiRequest<{ idCliente: string }>("/api/clientes", {
        method: "POST",
        body: JSON.stringify({
          cedula: form.cedula,
          primerNombre: form.primerNombre,
          segundoNombre: form.segundoNombre,
          primerApellido: form.primerApellido,
          segundoApellido: form.segundoApellido,
          fechaNacimiento: form.fechaNacimiento,
          genero: form.genero,
          email: form.email,
          telefono: form.telefono,
          direccion: form.direccion,
          ciudad: form.ciudad,
          departamento: form.departamento,
        }),
      });
      setClienteId(cliente.idCliente);
      setSubmitted(true);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "No fue posible guardar el cliente");
      setErrors({
        cedula: error instanceof Error ? error.message : "No fue posible registrar el cliente",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setForm({ cedula: "", primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "", fechaNacimiento: "", genero: "", email: "", telefono: "", direccion: "", ciudad: "", departamento: "" });
    setErrors({});
    setApiError("");
    setCedulaStatus("idle");
    setSubmitted(false);
    setClienteId("");
  }

  function handleFieldChange(name: keyof ManagerFormData, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#0f0a1e" }}>
      <Sidebar navItems={MANAGER_NAV} activeNav={activeNav} onNav={setActiveNav} userLabel="Gestor Rodríguez" userSub="Gestor Bancario" userInitials="GR" badge="Plataforma Gestión" />

      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-5 flex items-center justify-between sticky top-0 z-10" style={{ background: "rgba(15,10,30,0.92)", borderBottom: "1px solid rgba(139,92,246,0.1)", backdropFilter: "blur(8px)" }}>
          <div className="flex items-center gap-2 text-sm" style={{ color: "#7c6fa0" }}>
            <span>Clientes</span><IcoChevron /><span style={{ color: "#c4b5fd" }}>Nuevo Cliente</span>
          </div>
          
        </div>

        <div className="px-8 py-6 max-w-5xl">
          <div className="mb-7">
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#f1eeff", fontFamily: "Instrument Sans,sans-serif", letterSpacing: "-0.3px" }}>Registro de Nuevo Cliente</h1>
            <p className="text-sm" style={{ color: "#7c6fa0" }}>Complete los campos requeridos para registrar y vincular al cliente a los productos de la plataforma.</p>
          </div>

          {submitted && (
            <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)" }}>
              <div className="relative rounded-2xl p-8 max-w-md w-full mx-4" style={{ background: "#1a1130", border: "1px solid rgba(139,92,246,0.3)" }}>
                <button onClick={() => setSubmitted(false)} className="absolute top-4 right-4 p-1.5 rounded-lg" style={{ color: "#7c6fa0" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.1)"; e.currentTarget.style.color = "#c4b5fd"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#7c6fa0"; }}><IcoClose /></button>
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full" style={{ background: "rgba(16,185,129,0.15)", border: "2px solid rgba(16,185,129,0.4)" }}>
                    <span style={{ color: "#10b981" }}><IcoCheck /></span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-1" style={{ color: "#f1eeff", fontFamily: "Instrument Sans,sans-serif" }}>Cliente Registrado Exitosamente</h2>
                    <p className="text-sm" style={{ color: "#7c6fa0" }}>El cliente ha sido vinculado a la plataforma y está listo para ser asociado a productos bancarios.</p>
                  </div>
                  <div className="w-full rounded-xl p-4" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
                    <div className="text-xs mb-2 font-semibold uppercase tracking-wide" style={{ color: "#7c6fa0", fontFamily: "Instrument Sans,sans-serif" }}>Identificador Único Asignado</div>
                    <div className="text-lg font-bold tracking-wider" style={{ color: "#a78bfa", fontFamily: "Instrument Sans,sans-serif" }}>{clienteId}</div>
                    <div className="text-xs mt-1" style={{ color: "#7c6fa0" }}>{form.primerNombre} {form.primerApellido} · CC {form.cedula}</div>
                    <div className="mt-3 text-xs" style={{ color: "#c4b5fd" }}>Contraseña inicial: la misma cédula del cliente.</div>
                  </div>
                  <div className="flex gap-3 w-full">
                    <button onClick={handleReset} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ background: "rgba(139,92,246,0.15)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.3)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.25)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.15)"; }}>Registrar Otro</button>
                    <button onClick={() => setSubmitted(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "linear-gradient(135deg,#6d28d9,#a855f7)", color: "#fff" }}>Ver Detalle</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-5">
              <Section title="Identificación del Cliente">
                <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold tracking-wide uppercase" style={{ color: "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>
                      Número de Cédula <span style={{ color: "#a855f7" }}>*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text" inputMode="numeric" value={form.cedula} maxLength={10}
                        onChange={(ev) => handleCedulaChange(ev.target.value)}
                        onBlur={handleCedulaBlur}
                        placeholder="Ingrese la cédula"
                        className="w-full px-3.5 py-2.5 pr-9 rounded-lg text-sm outline-none transition-all"
                        style={{ background: "rgba(139,92,246,0.06)", border: `1px solid ${errors.cedula ? "#ef4444" : cedulaStatus === "ok" ? "#10b981" : "rgba(139,92,246,0.22)"}`, color: "#f1eeff" }}
                        onFocus={(ev) => { ev.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)"; }}
                        onBlurCapture={(ev) => { ev.currentTarget.style.boxShadow = "none"; }}
                      />
                      {cedulaStatus === "checking" && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "rgba(168,139,250,0.5)", borderTopColor: "transparent" }} />}
                      {cedulaStatus === "ok" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "#10b981" }}>✓</span>}
                      {cedulaStatus === "error" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#ef4444" }}>✕</span>}
                    </div>
                    {errors.cedula && <span className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "#f87171" }}><IcoAlert />{errors.cedula}</span>}
                    {cedulaStatus === "ok" && <span className="text-xs mt-0.5" style={{ color: "#10b981" }}>✓ Cédula válida y disponible.</span>}
                    {!errors.cedula && cedulaStatus !== "ok" && <span className="text-xs mt-0.5" style={{ color: "#7c6fa0" }}>Solo dígitos, entre 6 y 10 caracteres.</span>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold tracking-wide uppercase" style={{ color: "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>Tipo de Documento</label>
                    <select className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none appearance-none" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.22)", color: "#f1eeff" }}>
                      <option style={{ background: "#1a1130" }}>Cédula de Ciudadanía</option>
                      <option style={{ background: "#1a1130" }}>Cédula de Extranjería</option>
                      <option style={{ background: "#1a1130" }}>Pasaporte</option>
                      <option style={{ background: "#1a1130" }}>NIT</option>
                    </select>
                  </div>
                </div>
              </Section>

              <Section title="Datos Personales">
                <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <Field label="Primer Nombre" name="primerNombre" value={form.primerNombre} error={errors.primerNombre} placeholder="Ej: María" required onChange={handleFieldChange} />
                  <Field label="Segundo Nombre" name="segundoNombre" value={form.segundoNombre} error={errors.segundoNombre} placeholder="Ej: Fernanda" onChange={handleFieldChange} />
                  <Field label="Primer Apellido" name="primerApellido" value={form.primerApellido} error={errors.primerApellido} placeholder="Ej: García" required onChange={handleFieldChange} />
                  <Field label="Segundo Apellido" name="segundoApellido" value={form.segundoApellido} error={errors.segundoApellido} placeholder="Ej: López" onChange={handleFieldChange} />
                  <Field label="Fecha de Nacimiento" name="fechaNacimiento" value={form.fechaNacimiento} error={errors.fechaNacimiento} type="date" required onChange={handleFieldChange} />
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold tracking-wide uppercase" style={{ color: "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>Género <span style={{ color: "#a855f7" }}>*</span></label>
                    <select value={form.genero} onChange={(ev) => { setForm((f) => ({ ...f, genero: ev.target.value })); setErrors((e) => ({ ...e, genero: undefined })); }} className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none appearance-none" style={{ background: "rgba(139,92,246,0.06)", border: `1px solid ${errors.genero ? "#ef4444" : "rgba(139,92,246,0.22)"}`, color: form.genero ? "#f1eeff" : "#7c6fa0" }}>
                      <option value="" style={{ background: "#1a1130" }}>Seleccionar...</option>
                      <option value="M" style={{ background: "#1a1130" }}>Masculino</option>
                      <option value="F" style={{ background: "#1a1130" }}>Femenino</option>
                      <option value="O" style={{ background: "#1a1130" }}>Otro</option>
                      <option value="N" style={{ background: "#1a1130" }}>Prefiero no indicar</option>
                    </select>
                    {errors.genero && <span className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "#f87171" }}><IcoAlert />{errors.genero}</span>}
                  </div>
                </div>
              </Section>

              <Section title="Información de Contacto">
                <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <Field label="Correo Electrónico" name="email" value={form.email} error={errors.email} type="email" placeholder="correo@ejemplo.com" required onChange={handleFieldChange} />
                  <Field label="Teléfono" name="telefono" value={form.telefono} error={errors.telefono} placeholder="Ej: 3001234567" required hint="Sin espacios ni guiones." onChange={handleFieldChange} />
                  <div className="col-span-2"><Field label="Dirección de Residencia" name="direccion" value={form.direccion} error={errors.direccion} placeholder="Calle 45 #23-10, Apto 301" onChange={handleFieldChange} /></div>
                  <Field label="Ciudad" name="ciudad" value={form.ciudad} error={errors.ciudad} placeholder="Ej: Bogotá" required onChange={handleFieldChange} />
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold tracking-wide uppercase" style={{ color: "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>Departamento</label>
                    <select value={form.departamento} onChange={(ev) => setForm((f) => ({ ...f, departamento: ev.target.value }))} className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none appearance-none" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.22)", color: form.departamento ? "#f1eeff" : "#7c6fa0" }}>
                      <option value="" style={{ background: "#1a1130" }}>Seleccionar...</option>
                      {["Antioquia","Atlántico","Bogotá D.C.","Bolívar","Boyacá","Caldas","Cundinamarca","Huila","Magdalena","Meta","Nariño","Norte de Santander","Quindío","Risaralda","Santander","Tolima","Valle del Cauca"].map((d) => (
                        <option key={d} value={d} style={{ background: "#1a1130" }}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </Section>

              {Object.keys(errors).length > 0 && (
                <div className="flex items-start gap-3 rounded-xl px-4 py-3.5" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                  <span style={{ color: "#f87171", flexShrink: 0, marginTop: "1px" }}><IcoAlert /></span>
                  <div>
                    <div className="text-sm font-semibold mb-0.5" style={{ color: "#f87171" }}>Hay errores en el formulario</div>
                    <div className="text-xs" style={{ color: "#fca5a5" }}>Se encontraron {Object.keys(errors).length} {Object.keys(errors).length === 1 ? "error" : "errores"}. Revise y corrija los campos marcados.</div>
                  </div>
                </div>
              )}

              {apiError && (
                <div className="flex items-start gap-3 rounded-xl px-4 py-3.5" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                  <span style={{ color: "#f87171", flexShrink: 0, marginTop: "1px" }}><IcoAlert /></span>
                  <div>
                    <div className="text-sm font-semibold mb-0.5" style={{ color: "#f87171" }}>No se pudo guardar el cliente</div>
                    <div className="text-xs" style={{ color: "#fca5a5" }}>{apiError}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 pb-6">
                <button type="button" onClick={handleReset} className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all" style={{ background: "transparent", color: "#7c6fa0", border: "1px solid rgba(139,92,246,0.2)" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#c4b5fd"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#7c6fa0"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.2)"; }}>
                  Limpiar Formulario
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: "#7c6fa0" }}>Los campos con <span style={{ color: "#a855f7" }}>*</span> son obligatorios</span>
                  <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60" style={{ background: "linear-gradient(135deg,#6d28d9,#a855f7)", color: "#fff", boxShadow: "0 4px 20px rgba(109,40,217,0.35)" }} onMouseEnter={(e) => { if (!saving) e.currentTarget.style.transform = "translateY(-1px)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}>
                    <IcoAdd />{saving ? "Guardando..." : "Registrar Cliente"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
