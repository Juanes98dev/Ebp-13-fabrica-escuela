import { useState } from "react";
import Sidebar from "../shared/Sidebar";
import {
  IcoAlert,
  IcoCard,
  IcoCheck,
  IcoChevron,
  IcoCuentas,
  IcoDash,
  IcoExtractos,
  IcoInfo,
  IcoInversiones,
  IcoPagos,
  IcoPrestamos,
  IcoShield,
  IcoTransfer,
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

const ACCOUNTS = [
  {
    id: "eligible",
    type: "Cuenta de ahorros",
    number: "301-847-2291-05",
    balance: "$ 4.820.500",
    active: true,
    hasDebitCard: false,
    badge: "Disponible",
  },
  {
    id: "with-card",
    type: "Cuenta corriente",
    number: "501-293-8841-17",
    balance: "$ 1.250.000",
    active: true,
    hasDebitCard: true,
    badge: "Tarjeta activa",
  },
  {
    id: "inactive",
    type: "Cuenta de ahorros",
    number: "301-558-7764-03",
    balance: "$ 0",
    active: false,
    hasDebitCard: false,
    badge: "Inactiva",
  },
];

type CardStep = "select" | "confirm" | "success";

export default function DebitCardView() {
  const [activeNav, setActiveNav] = useState("tarjetas");
  const [step, setStep] = useState<CardStep>("select");
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastFour, setLastFour] = useState("");

  const selectedAccount = ACCOUNTS.find((account) => account.id === selectedId);

  function chooseAccount(id: string) {
    setSelectedId(id);
    setError("");
  }

  function continueRequest() {
    if (!selectedAccount) {
      setError("Selecciona una cuenta para continuar");
      return;
    }
    if (!selectedAccount.active) {
      setError("La cuenta seleccionada no está activa");
      return;
    }
    if (selectedAccount.hasDebitCard) {
      setError("Esta cuenta ya tiene una tarjeta débito activa");
      return;
    }
    setError("");
    setStep("confirm");
  }

  function confirmRequest() {
    setIsGenerating(true);
    window.setTimeout(() => {
      setLastFour(String(Math.floor(1000 + Math.random() * 9000)));
      setIsGenerating(false);
      setStep("success");
    }, 850);
  }

  function resetRequest() {
    setStep("select");
    setSelectedId("");
    setError("");
    setLastFour("");
    setIsGenerating(false);
  }

  const steps = [
    { key: "select", label: "Seleccionar cuenta", number: 1 },
    { key: "confirm", label: "Confirmar solicitud", number: 2 },
    { key: "success", label: "Tarjeta creada", number: 3 },
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
            <span>Mis Tarjetas</span><IcoChevron /><span className="text-text-secondary">Solicitar tarjeta débito</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-success/10 text-emerald-400 border border-success/25"><IcoShield />Proceso seguro</span>
            
          </div>
        </div>

        <div className="px-8 py-7 max-w-5xl">
          <div className="mb-7">
            <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md mb-2 inline-block bg-accent/15 text-purple-300 font-display">Nueva tarjeta</span>
            <h1 className="text-2xl font-bold mb-1 text-text-primary font-display">Solicita tu tarjeta débito</h1>
            <p className="text-sm text-text-muted">Asóciala a una cuenta activa para pagar y retirar usando el saldo disponible.</p>
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

          {step === "select" && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
              <div className="flex flex-col gap-4">
                <section className="rounded-2xl overflow-hidden bg-sidebar border border-border">
                  <div className="px-6 py-4 border-b border-border">
                    <h2 className="text-sm font-semibold text-text-primary font-display">Selecciona la cuenta asociada</h2>
                    <p className="text-xs text-text-muted mt-1">Solo puedes solicitar una tarjeta para cuentas activas sin tarjeta débito vigente.</p>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    {ACCOUNTS.map((account) => {
                      const selected = account.id === selectedId;
                      const eligible = account.active && !account.hasDebitCard;
                      return (
                        <button
                          type="button"
                          key={account.id}
                          onClick={() => chooseAccount(account.id)}
                          className={`relative w-full flex items-center gap-4 p-4 rounded-xl text-left border transition-all ${selected ? "bg-purple-600/15 border-purple-400/50 ring-4 ring-purple-400/5" : "bg-purple-400/5 border-border hover:border-purple-400/30"}`}
                        >
                          <div className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${selected ? "bg-purple-600/25 text-purple-200" : "bg-purple-400/10 text-text-muted"}`}><IcoCuentas /></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-text-secondary">{account.type}</span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${eligible ? "bg-success/10 text-emerald-400 border-success/20" : account.active ? "bg-purple-400/10 text-purple-300 border-border" : "bg-danger/10 text-red-400 border-danger/20"}`}>{account.badge}</span>
                            </div>
                            <div className="text-xs text-text-muted mt-1">{account.number}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-text-primary">{account.balance}</div>
                            <div className="text-xs text-text-muted mt-1">Saldo disponible</div>
                          </div>
                          <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 ml-2 ${selected ? "bg-purple-600 border-purple-500" : "border-purple-400/25"}`}>
                            {selected && <span className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {error && (
                  <div role="alert" className="flex items-start gap-3 rounded-xl px-4 py-3.5 bg-danger/10 border border-danger/25">
                    <span className="text-red-400 mt-0.5"><IcoAlert /></span>
                    <div>
                      <div className="text-sm font-semibold text-red-400">{error}</div>
                      <div className="text-xs text-text-muted mt-1">Selecciona otra cuenta disponible para continuar con la solicitud.</div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pb-6">
                  <button type="button" onClick={continueRequest} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-purple-600 to-accent shadow-lg shadow-purple-600/25 transition-all hover:-translate-y-0.5">
                    Continuar<IcoChevron />
                  </button>
                </div>
              </div>

              <aside className="flex flex-col gap-4">
                <div className="rounded-2xl p-5 bg-sidebar border border-border">
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl mb-4 bg-purple-600/15 text-purple-300"><IcoCard /></div>
                  <h2 className="text-sm font-semibold text-text-primary font-display">Tarjeta débito Banco X</h2>
                  <ul className="flex flex-col gap-3 mt-4">
                    {["Compras físicas y digitales", "Retiros en cajeros Banco X", "Control desde la aplicación", "Sin cuota de emisión"].map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2 text-xs text-text-muted">
                        <span className="text-emerald-400 mt-0.5 [&>svg]:w-3.5 [&>svg]:h-3.5"><IcoCheck /></span>{benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-start gap-2.5 rounded-xl p-4 bg-purple-400/5 border border-border">
                  <span className="text-purple-300 mt-0.5"><IcoShield /></span>
                  <p className="text-xs text-text-muted leading-relaxed">El número completo y el CVV se almacenan cifrados. En pantalla solo verás los últimos 4 dígitos.</p>
                </div>
              </aside>
            </div>
          )}

          {step === "confirm" && selectedAccount && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
              <div className="flex flex-col gap-5">
                <section className="rounded-2xl overflow-hidden bg-sidebar border border-border">
                  <div className="px-6 py-5 bg-gradient-to-br from-purple-600/20 to-accent/5 border-b border-border">
                    <span className="text-xs font-semibold uppercase tracking-wider text-purple-300 font-display">Resumen de solicitud</span>
                    <h2 className="text-lg font-bold text-text-primary font-display mt-1">Confirma los datos de tu tarjeta</h2>
                  </div>
                  <div className="p-6">
                    {[
                      { label: "Titular", value: CLIENTE_ACTIVO.nombre },
                      { label: "Producto", value: "Tarjeta débito Banco X" },
                      { label: "Cuenta asociada", value: selectedAccount.number },
                      { label: "Tipo de cuenta", value: selectedAccount.type },
                      { label: "Saldo disponible", value: selectedAccount.balance },
                      { label: "Estado inicial", value: "Activa" },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                        <span className="text-xs text-text-muted">{row.label}</span>
                        <span className={`text-sm font-medium ${row.label === "Estado inicial" ? "text-emerald-400" : "text-text-secondary"}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="flex items-start gap-3 rounded-xl px-4 py-3.5 bg-purple-400/5 border border-border">
                  <span className="text-purple-300 mt-0.5"><IcoInfo /></span>
                  <p className="text-xs text-text-muted leading-relaxed">Al confirmar, la tarjeta quedará activa y asociada inmediatamente a la cuenta seleccionada. Podrás bloquearla desde “Mis Tarjetas”.</p>
                </div>

                <div className="flex items-center justify-between pb-6">
                  <button type="button" onClick={() => setStep("select")} disabled={isGenerating} className="px-5 py-2.5 rounded-xl text-sm font-medium text-text-muted border border-border hover:text-purple-200 hover:border-purple-400/40 disabled:opacity-50">Volver</button>
                  <button type="button" onClick={confirmRequest} disabled={isGenerating} className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-purple-600 to-accent shadow-lg shadow-purple-600/25 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0">
                    {isGenerating ? <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Generando tarjeta...</> : <><IcoCard />Confirmar solicitud</>}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl h-fit p-5 bg-sidebar border border-border">
                <div className="text-xs font-semibold uppercase tracking-wider text-text-muted font-display mb-4">Vista previa</div>
                <div className="rounded-2xl p-5 bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500 shadow-xl shadow-purple-600/25">
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
                    <div className="text-xs font-bold text-white">DÉBITO</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 text-xs text-text-muted"><IcoShield />Datos cifrados de extremo a extremo</div>
              </div>
            </div>
          )}

          {step === "success" && selectedAccount && (
            <div className="flex flex-col items-center text-center pb-10">
              <div className="relative flex items-center justify-center w-20 h-20 rounded-full mb-5 bg-success/10 border-2 border-success/30 text-emerald-400">
                <div className="absolute inset-0 rounded-full bg-success/5 animate-ping" />
                <IcoCheck />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-display">Solicitud completada</span>
              <h2 className="text-2xl font-bold text-text-primary font-display mt-2">Tarjeta débito creada exitosamente</h2>
              <p className="text-sm text-text-muted mt-2 max-w-md">Tu nueva tarjeta está activa y asociada a la cuenta terminada en {selectedAccount.number.slice(-4)}.</p>

              <div className="w-full max-w-md rounded-2xl p-6 mt-7 text-left bg-gradient-to-br from-purple-900 via-purple-700 to-purple-500 shadow-2xl shadow-purple-600/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-base font-bold text-white font-display">BANCO X</div>
                    <div className="text-[10px] text-white/60 mt-0.5">BANCA PERSONAL</div>
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

              <div className="w-full max-w-md rounded-xl p-4 mt-5 bg-sidebar border border-border">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-xs text-text-muted">Tarjeta</span>
                  <span className="text-xs font-medium text-text-secondary">Terminada en {lastFour}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-xs text-text-muted">Cuenta asociada</span>
                  <span className="text-xs font-medium text-text-secondary">•••• {selectedAccount.number.slice(-4)}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-text-muted">Estado</span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-success" />Activa</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 max-w-md rounded-xl p-4 mt-5 text-left bg-purple-400/5 border border-border">
                <span className="text-purple-300 mt-0.5"><IcoShield /></span>
                <p className="text-xs text-text-muted leading-relaxed">Por seguridad, el número completo y el CVV permanecen cifrados y nunca se muestran en esta pantalla.</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={resetRequest} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-purple-200 border border-border hover:bg-purple-400/10">Solicitar otra tarjeta</button>
                <button type="button" onClick={() => setActiveNav("tarjetas")} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-purple-600 to-accent shadow-lg shadow-purple-600/25">Ir a Mis Tarjetas</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
