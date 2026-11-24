import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
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
import { apiRequest } from "../shared/api";

const CLIENT_NAV = [
  { id: "inicio", label: "Inicio", icon: <IcoDash /> },
  { id: "cuentas", label: "Mis Cuentas", icon: <IcoCuentas /> },
  { id: "transferencias", label: "Transferencias", icon: <IcoTransfer /> },
  { id: "pagos", label: "Pagos", icon: <IcoPagos /> },
  { id: "prestamos", label: "Préstamos", icon: <IcoPrestamos /> },
  { id: "inversiones", label: "Inversiones", icon: <IcoInversiones /> },
  { id: "extractos", label: "Extractos", icon: <IcoExtractos /> },
];

const TRANSACTION_LABELS = [
  "Transferencia recibida",
  "Compra en comercio",
  "Pago de servicios",
  "Transferencia enviada",
  "Consignación",
  "Retiro en cajero",
  "Pago con tarjeta",
  "Abono de nómina",
];

const TRANSACTIONS = Array.from({ length: 27 }, (_, index) => {
  const date = new Date(2026, 8, 12 - index, 14 - (index % 8), 12 + (index % 5) * 7);
  const incoming = index % 4 === 0 || index % 4 === 3;
  const type = incoming ? "Ingreso" : "Egreso";
  const baseAmounts = [500_000, 86_400, 142_900, 320_000, 1_250_000, 200_000, 54_600, 2_800_000];
  return {
    id: `BX-${String(98421 - index).padStart(6, "0")}`,
    description: TRANSACTION_LABELS[index % TRANSACTION_LABELS.length],
    type,
    amount: baseAmounts[index % baseAmounts.length],
    date,
    dateKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
  };
});

const PAGE_SIZE = 20;
type HistoryStatus = "ready" | "loading" | "empty" | "error";

type ApiTransaction = {
  id: number;
  referencia: string;
  tipo: "TRANSFERENCIA" | "RETIRO" | "CONSIGNACION";
  monto: number;
  cuentaOrigen: string;
  cuentaDestino: string;
  fecha: string;
  descripcion?: string;
};

type HistoryTransaction = {
  id: string;
  description: string;
  type: "Ingreso" | "Egreso";
  amount: number;
  date: Date;
  dateKey: string;
};

export default function TransactionHistoryView() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("extractos");
  const [account, setAccount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedRange, setAppliedRange] = useState({ start: "", end: "" });
  const [status, setStatus] = useState<HistoryStatus>("ready");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState<HistoryTransaction[]>([]);

  useEffect(() => {
    if (!account) return;
    setStatus("loading");
    apiRequest<ApiTransaction[]>(`/api/transacciones/cuenta/${account}`)
      .then((loaded) => {
        const mapped = loaded.map((transaction) => {
          const date = new Date(transaction.fecha);
          const incoming = transaction.cuentaDestino === account;
          return {
            id: transaction.referencia,
            description: transaction.descripcion || transaction.tipo,
            type: incoming ? "Ingreso" as const : "Egreso" as const,
            amount: Number(transaction.monto),
            date,
            dateKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
          };
        });
        setTransactions(mapped);
        setStatus(mapped.length > 0 ? "ready" : "empty");
      })
      .catch(() => {
        setTransactions([]);
        setStatus("empty");
      });
  }, [account]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (appliedRange.start && transaction.dateKey < appliedRange.start) return false;
      if (appliedRange.end && transaction.dateKey > appliedRange.end) return false;
      return true;
    });
  }, [appliedRange, transactions]);

  const pageCount = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const currentTransactions = filteredTransactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function applyFilter(event: React.FormEvent) {
    event.preventDefault();
    if (startDate && endDate && startDate > endDate) {
      setError("El rango de fechas no es válido");
      setStatus("error");
      return;
    }

    setError("");
    setStatus("loading");
    setPage(1);
    window.setTimeout(() => {
      setAppliedRange({ start: startDate, end: endDate });
      const matches = transactions.filter((transaction) => {
        if (startDate && transaction.dateKey < startDate) return false;
        if (endDate && transaction.dateKey > endDate) return false;
        return true;
      });
      setStatus(matches.length > 0 ? "ready" : "empty");
    }, 600);
  }

  function clearFilter() {
    setStartDate("");
    setEndDate("");
    setAppliedRange({ start: "", end: "" });
    setError("");
    setStatus("ready");
    setPage(1);
  }

  function changePage(nextPage: number) {
    if (nextPage < 1 || nextPage > pageCount) return;
    setStatus("loading");
    window.setTimeout(() => {
      setPage(nextPage);
      setStatus("ready");
    }, 450);
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
            <span>Mis Cuentas</span><IcoChevron /><span className="text-text-secondary">Historial de transacciones</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-success/10 text-emerald-400 border border-success/25"><IcoShield />Información protegida</span>
            
          </div>
        </div>

        <div className="px-8 py-7 max-w-6xl">
          <div className="flex items-end justify-between gap-6 mb-7">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md mb-2 inline-block bg-accent/15 text-purple-300 font-display">Movimientos</span>
              <h1 className="text-2xl font-bold mb-1 text-text-primary font-display">Historial de transacciones</h1>
              <p className="text-sm text-text-muted">Consulta y filtra los movimientos confirmados de tus cuentas.</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-text-muted">Saldo disponible</div>
              <div className="text-xl font-bold text-text-primary font-display mt-1">$ 250.000</div>
            </div>
          </div>

          <section className="rounded-2xl p-5 mb-5 bg-sidebar border border-border">
            <form onSubmit={applyFilter} noValidate>
              <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr_auto] gap-3 items-end">
                <div>
                  <label htmlFor="history-account" className="block text-xs font-semibold tracking-wide uppercase mb-2 text-purple-200 font-display">Cuenta</label>
                  <select id="history-account" value={account} onChange={(event) => setAccount(event.target.value)} className="w-full px-3.5 py-3 rounded-xl text-sm outline-none appearance-none bg-purple-400/5 text-text-primary border border-border focus:border-purple-400/60 focus:ring-4 focus:ring-purple-400/10">
                    <option value="" className="bg-surface">No hay cuentas disponibles</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="start-date" className="block text-xs font-semibold tracking-wide uppercase mb-2 text-purple-200 font-display">Fecha inicial</label>
                  <input id="start-date" type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); setError(""); }} className={`w-full px-3.5 py-3 rounded-xl text-sm outline-none bg-purple-400/5 text-text-primary border focus:ring-4 focus:ring-purple-400/10 ${error ? "border-danger" : "border-border focus:border-purple-400/60"}`} />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-xs font-semibold tracking-wide uppercase mb-2 text-purple-200 font-display">Fecha final</label>
                  <input id="end-date" type="date" value={endDate} onChange={(event) => { setEndDate(event.target.value); setError(""); }} className={`w-full px-3.5 py-3 rounded-xl text-sm outline-none bg-purple-400/5 text-text-primary border focus:ring-4 focus:ring-purple-400/10 ${error ? "border-danger" : "border-border focus:border-purple-400/60"}`} />
                </div>
                <button type="submit" disabled={status === "loading"} className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-purple-600 to-accent shadow-lg shadow-purple-600/25 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0">
                  <IcoSearch />Filtrar
                </button>
              </div>
              {error && <span className="flex items-center gap-1.5 text-xs mt-3 text-red-400"><IcoAlert />{error}</span>}
              {(appliedRange.start || appliedRange.end) && !error && (
                <div className="flex items-center gap-2 mt-3">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-purple-600/15 text-purple-200 border border-border">
                    <IcoClock />{appliedRange.start || "Inicio"} — {appliedRange.end || "Hoy"}
                  </span>
                  <button type="button" onClick={clearFilter} className="text-xs font-semibold text-text-muted hover:text-purple-200">Limpiar filtro</button>
                </div>
              )}
            </form>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
            <section className="rounded-2xl overflow-hidden bg-sidebar border border-border">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h2 className="text-sm font-semibold text-text-primary font-display">Movimientos de la cuenta</h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    {status === "empty" ? "0 movimientos encontrados" : `${filteredTransactions.length} movimientos · Más recientes primero`}
                  </p>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-text-muted"><IcoCheck />Solo transacciones confirmadas</span>
              </div>

              {status === "loading" && (
                <div className="flex flex-col items-center justify-center py-20">
                  <span className="w-8 h-8 rounded-full border-2 border-purple-300/30 border-t-purple-300 animate-spin" />
                  <span className="text-sm text-text-muted mt-4">Cargando movimientos...</span>
                </div>
              )}

              {status === "error" && (
                <div className="flex flex-col items-center justify-center text-center py-16 px-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full mb-4 bg-danger/10 text-red-400"><IcoAlert /></div>
                  <h3 className="text-base font-bold text-text-primary font-display">El rango de fechas no es válido</h3>
                  <p className="text-sm text-text-muted mt-1">La fecha inicial debe ser anterior o igual a la fecha final.</p>
                </div>
              )}

              {status === "empty" && (
                <div className="flex flex-col items-center justify-center text-center py-16 px-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full mb-4 bg-purple-600/15 text-purple-300"><IcoSearch /></div>
                  <h3 className="text-base font-bold text-text-primary font-display">No hay transacciones en el rango seleccionado</h3>
                  <p className="text-sm text-text-muted mt-1">Prueba con un periodo diferente para encontrar movimientos.</p>
                  <button type="button" onClick={clearFilter} className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold text-purple-200 border border-border hover:bg-purple-400/10">Ver todo el historial</button>
                </div>
              )}

              {status === "ready" && (
                <>
                  <div className="divide-y divide-border">
                    {currentTransactions.map((transaction) => {
                      const incoming = transaction.type === "Ingreso";
                      return (
                        <button type="button" key={transaction.id} onClick={() => navigate(`/cuentas/transaccion?id=${transaction.id}`)} className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-purple-400/5 transition-colors">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${incoming ? "bg-success/10 text-emerald-400" : "bg-purple-600/15 text-purple-300"}`}>
                            <span className={incoming ? "rotate-45" : "-rotate-[135deg]"}><IcoTransfer /></span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-text-secondary truncate">{transaction.description}</div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                              <span>{transaction.id}</span><span>·</span>
                              <span>{transaction.date.toLocaleString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                            </div>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${incoming ? "bg-success/10 text-emerald-400" : "bg-purple-400/10 text-purple-300"}`}>{transaction.type}</span>
                          <div className={`w-28 text-right text-sm font-bold ${incoming ? "text-emerald-400" : "text-text-primary"}`}>
                            {incoming ? "+" : "−"} $ {transaction.amount.toLocaleString("es-CO")}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between px-5 py-4 border-t border-border">
                    <div className="text-xs text-text-muted">
                      Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredTransactions.length)} de {filteredTransactions.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => changePage(page - 1)} disabled={page === 1} className="px-3 py-2 rounded-lg text-xs font-semibold text-text-muted border border-border hover:text-purple-200 hover:bg-purple-400/10 disabled:opacity-40 disabled:hover:bg-transparent">Anterior</button>
                      {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                        <button type="button" key={pageNumber} onClick={() => changePage(pageNumber)} className={`w-8 h-8 rounded-lg text-xs font-semibold border ${page === pageNumber ? "bg-purple-600/25 text-purple-200 border-purple-400/40" : "text-text-muted border-border hover:text-purple-200"}`}>{pageNumber}</button>
                      ))}
                      <button type="button" onClick={() => changePage(page + 1)} disabled={page === pageCount} className="px-3 py-2 rounded-lg text-xs font-semibold text-text-muted border border-border hover:text-purple-200 hover:bg-purple-400/10 disabled:opacity-40 disabled:hover:bg-transparent">Siguiente</button>
                    </div>
                  </div>
                </>
              )}
            </section>

            <aside className="flex flex-col gap-4">
              <div className="rounded-2xl p-5 bg-sidebar border border-border">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl mb-4 bg-purple-600/15 text-purple-300"><IcoCuentas /></div>
                <h2 className="text-sm font-semibold text-text-primary font-display">Cuenta consultada</h2>
                <div className="text-xs text-text-muted mt-3">Cuenta de ahorros</div>
                <div className="text-sm font-medium text-text-secondary mt-1">{account}</div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-3"><span className="w-1.5 h-1.5 rounded-full bg-success" />Activa</div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl p-4 bg-purple-400/5 border border-border">
                <span className="text-purple-300 mt-0.5"><IcoInfo /></span>
                <p className="text-xs text-text-muted leading-relaxed">El historial se presenta en grupos de 20 transacciones, ordenadas desde la más reciente.</p>
              </div>

              <div className="rounded-xl p-4 bg-purple-400/5 border border-border">
                <div className="text-xs font-semibold text-purple-200 mb-2">Rangos para probar</div>
                <div className="text-xs text-text-muted leading-relaxed">
                  Con resultados: <span className="text-text-secondary">2026-09-01 a 2026-09-12</span><br />
                  Sin resultados: <span className="text-text-secondary">2025-01-01 a 2025-01-31</span><br />
                  Inválido: <span className="text-text-secondary">2026-09-12 a 2026-09-01</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
