import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import Sidebar from "../shared/Sidebar";
import {
  IcoAlert,
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
  IcoSearch,
  IcoShield,
  IcoTransfer,
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
];

const TRANSACTIONS = [
  {
    id: "BX-984210",
    type: "Transferencia recibida",
    direction: "income",
    origin: "Cuenta de ahorros · •••• 4488",
    destination: "Cuenta de ahorros · 301-847-2291-05",
    amount: 500_000,
    date: "12 de septiembre de 2026",
    time: "2:12 p. m.",
    status: "Confirmada",
    description: "Transferencia de Carlos Herrera",
    reference: "REF-8812KA",
    channel: "Banca móvil",
  },
  {
    id: "BX-984209",
    type: "Compra con tarjeta",
    direction: "expense",
    origin: "Cuenta de ahorros · 301-847-2291-05",
    destination: "Comercio · •••• 7392",
    amount: 86_400,
    date: "11 de septiembre de 2026",
    time: "1:19 p. m.",
    status: "Confirmada",
    description: "Compra en Mercado Central",
    reference: "REF-7741MX",
    channel: "Datáfono",
  },
  {
    id: "BX-984208",
    type: "Pago de servicios",
    direction: "expense",
    origin: "Cuenta de ahorros · 301-847-2291-05",
    destination: "Convenio de recaudo · •••• 2051",
    amount: 142_900,
    date: "10 de septiembre de 2026",
    time: "12:26 p. m.",
    status: "Confirmada",
    description: "Factura de energía",
    reference: "REF-6294QZ",
    channel: "Banca web",
  },
  {
    id: "BX-984207",
    type: "Transferencia enviada",
    direction: "expense",
    origin: "Cuenta de ahorros · 301-847-2291-05",
    destination: "Cuenta corriente · •••• 1022",
    amount: 320_000,
    date: "9 de septiembre de 2026",
    time: "11:33 a. m.",
    status: "Confirmada",
    description: "Transferencia a Lucía Fernández",
    reference: "REF-5208LP",
    channel: "Banca móvil",
  },
  {
    id: "BX-984206",
    type: "Consignación",
    direction: "income",
    origin: "Corresponsal bancario · •••• 8810",
    destination: "Cuenta de ahorros · 301-847-2291-05",
    amount: 1_250_000,
    date: "8 de septiembre de 2026",
    time: "10:40 a. m.",
    status: "Confirmada",
    description: "Consignación en efectivo",
    reference: "REF-4157NE",
    channel: "Corresponsal",
  },
];

type Transaction = (typeof TRANSACTIONS)[number];
type DetailStatus = "idle" | "loading" | "success" | "not-found";

export default function TransactionDetailView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeNav, setActiveNav] = useState("extractos");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [status, setStatus] = useState<DetailStatus>("idle");
  const [query, setQuery] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    const transactionId = searchParams.get("id")?.toUpperCase();
    if (!transactionId) return;
    setQuery(transactionId);
    const transaction = TRANSACTIONS.find((item) => item.id === transactionId);
    if (transaction) {
      setSelected(transaction);
      setStatus("success");
    } else {
      setStatus("not-found");
    }
  }, [searchParams]);

  function openTransaction(transaction: Transaction) {
    setSelected(null);
    setStatus("loading");
    setQuery(transaction.id);
    setValidationError("");
    window.setTimeout(() => {
      setSelected(transaction);
      setStatus("success");
    }, 500);
  }

  function searchTransaction(event: React.FormEvent) {
    event.preventDefault();
    const normalized = query.trim().toUpperCase();
    if (!/^BX-\d{6}$/.test(normalized)) {
      setValidationError("Ingresa un número de transacción válido");
      return;
    }
    setValidationError("");
    setSelected(null);
    setStatus("loading");
    window.setTimeout(() => {
      const transaction = TRANSACTIONS.find((item) => item.id === normalized);
      if (transaction) {
        setSelected(transaction);
        setStatus("success");
      } else {
        setStatus("not-found");
      }
    }, 550);
  }

  function resetDetail() {
    setSelected(null);
    setStatus("idle");
    setQuery("");
    setValidationError("");
  }

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
            <span>Historial</span><IcoChevron /><span className="text-text-secondary">Detalle de transacción</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-success/10 text-emerald-400 border border-success/25"><IcoShield />Consulta segura</span>
            
          </div>
        </div>

        <div className="px-8 py-7 max-w-6xl">
          <div className="flex items-end justify-between gap-6 mb-7">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md mb-2 inline-block bg-accent/15 text-purple-300 font-display">Movimientos</span>
              <h1 className="text-2xl font-bold mb-1 text-text-primary font-display">Detalle de transacción</h1>
              <p className="text-sm text-text-muted">Selecciona un movimiento o busca su número para verificar toda la información.</p>
            </div>
            <form onSubmit={searchTransaction} noValidate className="w-full max-w-sm">
              <label htmlFor="transaction-search" className="block text-xs font-semibold tracking-wide uppercase mb-2 text-purple-200 font-display">Número de transacción</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"><IcoSearch /></span>
                  <input
                    id="transaction-search"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setValidationError("");
                      if (status === "not-found") setStatus("idle");
                    }}
                    placeholder="Ej: BX-984210"
                    className={`w-full pl-10 pr-3 py-2.5 rounded-xl text-sm outline-none bg-purple-400/5 text-text-primary border focus:ring-4 focus:ring-purple-400/10 ${validationError ? "border-danger" : "border-border focus:border-purple-400/60"}`}
                  />
                </div>
                <button type="submit" disabled={status === "loading"} className="flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-purple-600 to-accent disabled:opacity-60"><IcoSearch /></button>
              </div>
              {validationError && <span className="flex items-center gap-1.5 text-xs mt-2 text-red-400"><IcoAlert />{validationError}</span>}
            </form>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-5">
            <section className="rounded-2xl overflow-hidden bg-sidebar border border-border">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h2 className="text-sm font-semibold text-text-primary font-display">Últimos movimientos</h2>
                  <p className="text-xs text-text-muted mt-0.5">Cuenta de ahorros · 301-847-2291-05</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-400/10 text-purple-300">5 transacciones</span>
              </div>
              <div className="divide-y divide-border">
                {TRANSACTIONS.map((transaction) => {
                  const incoming = transaction.direction === "income";
                  const active = selected?.id === transaction.id && status === "success";
                  return (
                    <button
                      type="button"
                      key={transaction.id}
                      onClick={() => openTransaction(transaction)}
                      className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-all ${active ? "bg-purple-600/15" : "hover:bg-purple-400/5"}`}
                    >
                      <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${incoming ? "bg-success/10 text-emerald-400" : "bg-purple-600/15 text-purple-300"}`}>
                        <span className={incoming ? "rotate-45" : "-rotate-[135deg]"}><IcoTransfer /></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-text-secondary truncate">{transaction.description}</div>
                        <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1"><span>{transaction.date}</span><span>·</span><span>{transaction.time}</span></div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${incoming ? "text-emerald-400" : "text-text-primary"}`}>{incoming ? "+" : "−"} $ {transaction.amount.toLocaleString("es-CO")}</div>
                        <div className="text-xs text-text-muted mt-1">{transaction.id}</div>
                      </div>
                      <span className={active ? "text-purple-200" : "text-text-muted"}><IcoChevron /></span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl overflow-hidden bg-sidebar border border-border min-h-[520px]">
              {status === "idle" && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4 bg-purple-600/15 text-purple-300"><IcoTransfer /></div>
                  <h2 className="text-base font-bold text-text-primary font-display">Selecciona una transacción</h2>
                  <p className="text-sm text-text-muted mt-1 max-w-sm">Consulta el número, cuentas involucradas, monto, fecha, hora y estado del movimiento.</p>
                </div>
              )}

              {status === "loading" && (
                <div className="h-full flex flex-col items-center justify-center p-8">
                  <span className="w-8 h-8 rounded-full border-2 border-purple-300/30 border-t-purple-300 animate-spin" />
                  <span className="text-sm text-text-muted mt-4">Consultando detalle...</span>
                </div>
              )}

              {status === "not-found" && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full mb-4 bg-danger/10 text-red-400"><IcoAlert /></div>
                  <h2 className="text-lg font-bold text-text-primary font-display">Transacción no encontrada</h2>
                  <p className="text-sm text-text-muted mt-1 max-w-sm">La transacción no existe o no pertenece a ninguna de tus cuentas.</p>
                  <button type="button" onClick={() => navigate("/cuentas/historial")} className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold text-purple-200 border border-border hover:bg-purple-400/10">Volver al historial</button>
                </div>
              )}

              {status === "success" && selected && (
                <>
                  <div className="px-6 py-5 bg-gradient-to-br from-purple-600/20 to-accent/5 border-b border-border">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-purple-300 font-display">Comprobante de transacción</span>
                        <h2 className="text-lg font-bold text-text-primary font-display mt-1">{selected.type}</h2>
                        <div className="text-xs text-text-muted mt-1">{selected.description}</div>
                      </div>
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/10 text-emerald-400 border border-success/25">
                        <IcoCheck />{selected.status}
                      </span>
                    </div>
                    <div className={`text-3xl font-bold font-display mt-6 ${selected.direction === "income" ? "text-emerald-400" : "text-text-primary"}`}>
                      {selected.direction === "income" ? "+" : "−"} $ {selected.amount.toLocaleString("es-CO")}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                      <div>
                        <div className="text-xs text-text-muted">Número de transacción</div>
                        <div className="text-sm font-semibold text-text-secondary mt-1">{selected.id}</div>
                      </div>
                      <div>
                        <div className="text-xs text-text-muted">Tipo</div>
                        <div className="text-sm font-semibold text-text-secondary mt-1">{selected.type}</div>
                      </div>
                      <div className="col-span-2 rounded-xl p-4 bg-purple-400/5 border border-border">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-600/15 text-purple-300"><IcoCuentas /></span>
                          <div className="flex-1">
                            <div className="text-xs text-text-muted">Cuenta origen</div>
                            <div className="text-sm font-medium text-text-secondary mt-1">{selected.origin}</div>
                          </div>
                        </div>
                        <div className="h-px bg-border my-3" />
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-success/10 text-emerald-400"><IcoCuentas /></span>
                          <div className="flex-1">
                            <div className="text-xs text-text-muted">Cuenta destino</div>
                            <div className="text-sm font-medium text-text-secondary mt-1">{selected.destination}</div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-text-muted">Fecha</div>
                        <div className="text-sm font-semibold text-text-secondary mt-1">{selected.date}</div>
                      </div>
                      <div>
                        <div className="text-xs text-text-muted">Hora</div>
                        <div className="text-sm font-semibold text-text-secondary mt-1">{selected.time}</div>
                      </div>
                      <div>
                        <div className="text-xs text-text-muted">Referencia</div>
                        <div className="text-sm font-semibold text-text-secondary mt-1">{selected.reference}</div>
                      </div>
                      <div>
                        <div className="text-xs text-text-muted">Canal</div>
                        <div className="text-sm font-semibold text-text-secondary mt-1">{selected.channel}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-xl p-3.5 mt-5 bg-purple-400/5 border border-border">
                      <span className="text-purple-300 mt-0.5"><IcoShield /></span>
                      <p className="text-xs text-text-muted leading-relaxed">Por seguridad, los números de cuenta de terceros se muestran parcialmente enmascarados.</p>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl p-4 mt-5 bg-purple-400/5 border border-border">
            <span className="text-purple-300 mt-0.5"><IcoInfo /></span>
            <p className="text-xs text-text-muted leading-relaxed">
              Para probar el estado no encontrado busca <span className="font-semibold text-text-secondary">BX-000000</span>. El detalle válido puede consultarse con <span className="font-semibold text-text-secondary">BX-984210</span>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
