import { useState } from "react";
import Sidebar from "../shared/Sidebar";
import {
  IcoAlert,
  IcoCard,
  IcoCheck,
  IcoChevron,
  IcoClock,
  IcoCuentas,
  IcoDash,
  IcoExtractos,
  IcoInfo,
  IcoInversiones,
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
  { id: "tarjetas", label: "Mis Tarjetas", icon: <IcoCard /> },
  { id: "transferencias", label: "Transferencias", icon: <IcoTransfer /> },
  { id: "pagos", label: "Pagos", icon: <IcoPagos /> },
  { id: "prestamos", label: "Préstamos", icon: <IcoPrestamos /> },
  { id: "inversiones", label: "Inversiones", icon: <IcoInversiones /> },
  { id: "extractos", label: "Extractos", icon: <IcoExtractos /> },
];

type CreditStep = "request" | "confirm" | "success";
type DemoProfile = "eligible" | "ineligible";

export default function CreditCardView() {
  const [activeNav, setActiveNav] = useState("tarjetas");
  const [step, setStep] = useState<CreditStep>("request");
  const [profile, setProfile] = useState<DemoProfile>("eligible");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [lastFour, setLastFour] = useState("");

  function changeProfile(nextProfile: DemoProfile) {
    setProfile(nextProfile);
    setError("");
    setStep("request");
  }

  function evaluateRequest() {
    setError("");
    setIsChecking(true);
    window.setTimeout(() => {
      setIsChecking(false);
      if (profile === "ineligible") {
        setError("No cumple los requisitos para obtener una tarjeta de crédito");
        return;
      }
      setStep("confirm");
    }, 650);
  }

  function confirmRequest() {
    setIsCreating(true);
    window.setTimeout(() => {
      setLastFour(String(Math.floor(1000 + Math.random() * 9000)));
      setIsCreating(false);
      setStep("success");
    }, 850);
  }

  function resetRequest() {
    setStep("request");
    setError("");
    setLastFour("");
    setIsCreating(false);
  }

  const steps = [
    { key: "request", label: "Validar requisitos", number: 1 },
    { key: "confirm", label: "Confirmar solicitud", number: 2 },
    { key: "success", label: "Tarjeta aprobada", number: 3 },
  ];

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
            <span>Mis Tarjetas</span><IcoChevron /><span className="text-text-secondary">Solicitar tarjeta de crédito</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-success/10 text-emerald-400 border border-success/25"><IcoShield />Evaluación segura</span>
            
          </div>
        </div>

        <div className="px-8 py-7 max-w-5xl">
          <div className="flex items-end justify-between gap-6 mb-7">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md mb-2 inline-block bg-accent/15 text-purple-300 font-display">Crédito Banco X</span>
              <h1 className="text-2xl font-bold mb-1 text-text-primary font-display">Solicita tu tarjeta de crédito</h1>
              <p className="text-sm text-text-muted">Obtén un cupo básico para tus compras y empieza a construir tu historial crediticio.</p>
            </div>
            {step === "request" && (
              <div className="flex items-center gap-1 p-1 rounded-xl bg-sidebar border border-border">
                <button type="button" onClick={() => changeProfile("eligible")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${profile === "eligible" ? "bg-purple-600/25 text-purple-200" : "text-text-muted hover:text-purple-200"}`}>Cliente elegible</button>
                <button type="button" onClick={() => changeProfile("ineligible")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${profile === "ineligible" ? "bg-purple-600/25 text-purple-200" : "text-text-muted hover:text-purple-200"}`}>Sin cuentas activas</button>
              </div>
            )}
          </div>

          <div className="flex items-center mb-8">
            {steps.map((item, index) => {
              const currentIndex = steps.findIndex((entry) => entry.key === step);
              const done = index < currentIndex;
              const active = item.key === step;
              return (
                <div key={item.key} className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border font-display ${done ? "bg-success/15 text-emerald-400 border-success/30" : active ? "bg-gradient-to-br from-purple-600 to-accent text-white border-purple-500" : "bg-purple-400/5 text-text-muted border-border"}`}>
                      {done ? <span className="[&>svg]:w-3.5 [&>svg]:h-3.5"><IcoCheck /></span> : item.number}
                    </div>
                    <span className={`text-xs font-medium ${active ? "text-purple-200" : done ? "text-emerald-400" : "text-text-muted"}`}>{item.label}</span>
                  </div>
                  {index < steps.length - 1 && <div className={`w-14 h-px mx-3 ${done ? "bg-success/40" : "bg-border"}`} />}
                </div>
              );
            })}
          </div>

          {step === "request" && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
              <div className="flex flex-col gap-5">
                <section className="rounded-2xl overflow-hidden bg-sidebar border border-border">
                  <div className="px-6 py-5 bg-gradient-to-br from-purple-600/20 to-accent/5 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-purple-300 font-display">Evaluación inicial</span>
                        <h2 className="text-lg font-bold text-text-primary font-display mt-1">Requisitos de la solicitud</h2>
                      </div>
                      <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-purple-600/20 text-purple-300"><IcoShield /></div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-4 pb-5 mb-5 border-b border-border">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-600/20 text-purple-200 font-bold font-display">{CLIENTE_ACTIVO.iniciales}</div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-text-primary">{CLIENTE_ACTIVO.nombre}</div>
                        <div className="text-xs text-text-muted mt-1">CC {CLIENTE_ACTIVO.cedula} · ID {CLIENTE_ACTIVO.id}</div>
                      </div>
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/10 text-emerald-400 border border-success/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-success" />Cliente activo
                      </span>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between rounded-xl px-4 py-3.5 bg-purple-400/5 border border-border">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-success/10 text-emerald-400"><IcoUser /></span>
                          <div>
                            <div className="text-sm font-medium text-text-secondary">Cliente activo</div>
                            <div className="text-xs text-text-muted mt-0.5">Estado vigente en Banco X</div>
                          </div>
                        </div>
                        <span className="text-emerald-400"><IcoCheck /></span>
                      </div>

                      <div className={`flex items-center justify-between rounded-xl px-4 py-3.5 border ${profile === "eligible" ? "bg-purple-400/5 border-border" : "bg-danger/5 border-danger/20"}`}>
                        <div className="flex items-center gap-3">
                          <span className={`flex items-center justify-center w-9 h-9 rounded-lg ${profile === "eligible" ? "bg-success/10 text-emerald-400" : "bg-danger/10 text-red-400"}`}><IcoCuentas /></span>
                          <div>
                            <div className="text-sm font-medium text-text-secondary">Al menos una cuenta activa</div>
                            <div className="text-xs text-text-muted mt-0.5">{profile === "eligible" ? "2 cuentas activas encontradas" : "No se encontraron cuentas activas"}</div>
                          </div>
                        </div>
                        {profile === "eligible" ? <span className="text-emerald-400"><IcoCheck /></span> : <span className="text-red-400"><IcoAlert /></span>}
                      </div>
                    </div>
                  </div>
                </section>

                {error && (
                  <div role="alert" className="flex items-start gap-3 rounded-xl px-4 py-4 bg-danger/10 border border-danger/25">
                    <span className="text-red-400 mt-0.5"><IcoAlert /></span>
                    <div>
                      <div className="text-sm font-semibold text-red-400">{error}</div>
                      <p className="text-xs text-text-muted mt-1">Necesitas tener al menos una cuenta activa para presentar una solicitud.</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pb-6">
                  <button type="button" onClick={evaluateRequest} disabled={isChecking} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-purple-600 to-accent shadow-lg shadow-purple-600/25 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0">
                    {isChecking ? <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Evaluando requisitos...</> : <><IcoCard />Solicitar tarjeta</>}
                  </button>
                </div>
              </div>

              <aside className="flex flex-col gap-4">
                <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500 shadow-xl shadow-purple-600/20">
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white font-display">BANCO X</span>
                      <IcoCard />
                    </div>
                    <div className="mt-10 text-base font-semibold tracking-widest text-white">•••• •••• •••• ••••</div>
                    <div className="flex items-end justify-between mt-6">
                      <div>
                        <div className="text-[10px] uppercase text-white/50">Titular</div>
                        <div className="text-xs font-semibold text-white mt-1">VALENTINA MORALES</div>
                      </div>
                      <div className="text-xs font-bold text-white">CRÉDITO</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3 bg-black/15 border-t border-white/10">
                    <span className="text-xs text-white/60">Cupo básico</span>
                    <span className="text-sm font-bold text-white">$ 3.000.000</span>
                  </div>
                </div>

                <div className="rounded-2xl p-5 bg-sidebar border border-border">
                  <h2 className="text-sm font-semibold text-text-primary font-display">Beneficios incluidos</h2>
                  <ul className="flex flex-col gap-3 mt-4">
                    {["Compras nacionales e internacionales", "Avances en cajeros Banco X", "Control total desde la aplicación", "Alertas de compra en tiempo real"].map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2 text-xs text-text-muted">
                        <span className="text-emerald-400 mt-0.5 [&>svg]:w-3.5 [&>svg]:h-3.5"><IcoCheck /></span>{benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl p-4 bg-purple-400/5 border border-border">
                  <span className="text-purple-300 mt-0.5"><IcoShield /></span>
                  <p className="text-xs text-text-muted leading-relaxed">La evaluación y generación de la tarjeta se realizan mediante una conexión segura.</p>
                </div>
              </aside>
            </div>
          )}

          {step === "confirm" && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
              <div className="flex flex-col gap-5">
                <section className="rounded-2xl overflow-hidden bg-sidebar border border-border">
                  <div className="px-6 py-5 bg-gradient-to-br from-success/10 to-purple-600/10 border-b border-border">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-10 h-10 rounded-full bg-success/10 text-emerald-400"><IcoCheck /></span>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-display">Requisitos cumplidos</span>
                        <h2 className="text-lg font-bold text-text-primary font-display mt-0.5">Confirma tu solicitud</h2>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    {[
                      { label: "Titular", value: CLIENTE_ACTIVO.nombre },
                      { label: "Producto", value: "Tarjeta de crédito Banco X" },
                      { label: "Cupo asignado", value: "$ 3.000.000 COP", highlight: true },
                      { label: "Cuota de manejo", value: "$ 18.900 mensuales" },
                      { label: "Tasa de interés", value: "24,90% E.A." },
                      { label: "Estado al crear", value: "Activa", success: true },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                        <span className="text-xs text-text-muted">{row.label}</span>
                        <span className={`text-sm font-medium ${row.success ? "text-emerald-400" : row.highlight ? "text-purple-200 font-bold" : "text-text-secondary"}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="flex items-start gap-3 rounded-xl px-4 py-3.5 bg-purple-400/5 border border-border">
                  <span className="text-purple-300 mt-0.5"><IcoInfo /></span>
                  <p className="text-xs text-text-muted leading-relaxed">Al confirmar aceptas las condiciones del producto. La tarjeta se generará activa y el cupo quedará disponible inmediatamente.</p>
                </div>

                <div className="flex items-center justify-between pb-6">
                  <button type="button" onClick={() => setStep("request")} disabled={isCreating} className="px-5 py-2.5 rounded-xl text-sm font-medium text-text-muted border border-border hover:text-purple-200 hover:border-purple-400/40 disabled:opacity-50">Volver</button>
                  <button type="button" onClick={confirmRequest} disabled={isCreating} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-purple-600 to-accent shadow-lg shadow-purple-600/25 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0">
                    {isCreating ? <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Generando tarjeta...</> : <><IcoShield />Confirmar y crear tarjeta</>}
                  </button>
                </div>
              </div>

              <aside className="flex flex-col gap-4">
                <div className="rounded-2xl p-5 bg-sidebar border border-border">
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl mb-4 bg-purple-600/15 text-purple-300"><IcoClock /></div>
                  <h2 className="text-sm font-semibold text-text-primary font-display">Respuesta inmediata</h2>
                  <p className="text-xs text-text-muted leading-relaxed mt-2">La tarjeta y su cupo se generarán en menos de 3 segundos después de confirmar.</p>
                </div>
                <div className="rounded-2xl p-5 bg-sidebar border border-border">
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl mb-4 bg-success/10 text-emerald-400"><IcoShield /></div>
                  <h2 className="text-sm font-semibold text-text-primary font-display">Información protegida</h2>
                  <p className="text-xs text-text-muted leading-relaxed mt-2">El número completo y el CVV serán almacenados de forma cifrada.</p>
                </div>
              </aside>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center text-center pb-10">
              <div className="relative flex items-center justify-center w-20 h-20 rounded-full mb-5 bg-success/10 border-2 border-success/30 text-emerald-400">
                <div className="absolute inset-0 rounded-full bg-success/5 animate-ping" />
                <IcoCheck />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-display">Solicitud aprobada</span>
              <h2 className="text-2xl font-bold text-text-primary font-display mt-2">Tu tarjeta de crédito está activa</h2>
              <p className="text-sm text-text-muted mt-2 max-w-md">Asignamos un cupo básico de crédito que ya puedes utilizar para tus compras.</p>

              <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-5 w-full max-w-2xl mt-7 text-left">
                <div className="rounded-2xl p-6 bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500 shadow-2xl shadow-purple-600/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-base font-bold text-white font-display">BANCO X</div>
                      <div className="text-[10px] text-white/60 mt-0.5">CRÉDITO PERSONAL</div>
                    </div>
                    <div className="text-white"><IcoCard /></div>
                  </div>
                  <div className="mt-12 text-lg font-semibold tracking-widest text-white">•••• •••• •••• {lastFour}</div>
                  <div className="flex items-end justify-between mt-7">
                    <div>
                      <div className="text-[10px] uppercase text-white/50">Titular</div>
                      <div className="text-xs font-semibold text-white mt-1">VALENTINA MORALES</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase text-white/50">Estado</div>
                      <div className="text-xs font-semibold text-emerald-300 mt-1">Activa</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl p-5 bg-sidebar border border-border">
                  <div className="text-xs font-semibold uppercase tracking-wider text-text-muted font-display">Cupo asignado</div>
                  <div className="text-2xl font-bold text-purple-200 font-display mt-2">$ 3.000.000</div>
                  <div className="text-xs text-text-muted mt-1">Disponible para compras</div>
                  <div className="w-full h-1.5 rounded-full mt-5 bg-purple-400/10 overflow-hidden"><div className="w-full h-full rounded-full bg-gradient-to-r from-purple-600 to-accent" /></div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-text-muted">Utilizado</span>
                    <span className="text-emerald-400">$ 0</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-5 text-xs text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-success" />Tarjeta activa</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 w-full max-w-2xl rounded-xl p-4 mt-5 text-left bg-purple-400/5 border border-border">
                <span className="text-purple-300 mt-0.5"><IcoShield /></span>
                <p className="text-xs text-text-muted leading-relaxed">Por seguridad, solo mostramos los últimos 4 dígitos. El número completo y el CVV permanecen cifrados.</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={resetRequest} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-purple-200 border border-border hover:bg-purple-400/10">Nueva solicitud</button>
                <button type="button" onClick={() => setActiveNav("tarjetas")} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-purple-600 to-accent shadow-lg shadow-purple-600/25">Ir a Mis Tarjetas</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
