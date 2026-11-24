import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import Sidebar from "../shared/Sidebar";
import {
  IcoAlert,
  IcoCheck,
  IcoChevron,
  IcoClock,
  IcoCuentas,
  IcoInfo,
  IcoSearch,
  IcoShield,
  IcoTransfer,
} from "../shared/icons";
import { esDebito, etiquetaTipoCuenta, etiquetaTransaccion, fmtCOP } from "../shared/helpers";
import { useHistorial, useMisCuentas } from "../shared/hooks";

const PAGE_SIZE = 20;

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function TransactionHistoryView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cuentas, loading: loadingAccounts, error: accountsError } = useMisCuentas();
  const [account, setAccount] = useState(searchParams.get("cuenta") ?? "");
  const { transacciones, loading, error: historyError, reload } = useHistorial(account || null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedRange, setAppliedRange] = useState({ start: "", end: "" });
  const [rangeError, setRangeError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!account && cuentas.length > 0) setAccount(cuentas[0].numeroCuenta);
  }, [account, cuentas]);

  const selected = cuentas.find((cuenta) => cuenta.numeroCuenta === account);

  const transactions = useMemo(
    () =>
      transacciones.map((transaction) => {
        const date = new Date(transaction.fecha);
        const outgoing = esDebito(transaction, account);
        return {
          id: transaction.referencia,
          description: transaction.descripcion || etiquetaTransaccion(transaction.tipo),
          kind: etiquetaTransaccion(transaction.tipo),
          type: outgoing ? ("Egreso" as const) : ("Ingreso" as const),
          amount: Number(transaction.monto),
          date,
          dateKey: dateKey(date),
        };
      }),
    [transacciones, account],
  );

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        if (appliedRange.start && transaction.dateKey < appliedRange.start) return false;
        if (appliedRange.end && transaction.dateKey > appliedRange.end) return false;
        return true;
      }),
    [appliedRange, transactions],
  );

  const pageCount = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const currentTransactions = filteredTransactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const status = rangeError
    ? "error"
    : loading || loadingAccounts
      ? "loading"
      : historyError
        ? "failed"
        : !account || filteredTransactions.length === 0
          ? "empty"
          : "ready";

  function applyFilter(event: React.FormEvent) {
    event.preventDefault();
    if (startDate && endDate && startDate > endDate) {
      setRangeError("El rango de fechas no es válido");
      return;
    }
    setRangeError("");
    setPage(1);
    setAppliedRange({ start: startDate, end: endDate });
  }

  function clearFilter() {
    setStartDate("");
    setEndDate("");
    setAppliedRange({ start: "", end: "" });
    setRangeError("");
    setPage(1);
  }

  function changeAccount(value: string) {
    setAccount(value);
    setPage(1);
  }

  return (
    <div className="flex h-full overflow-hidden bg-bg-base">
      <Sidebar variant="cliente" />

      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-5 flex items-center justify-between sticky top-0 z-10 bg-bg-base/95 border-b border-border backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Mis Cuentas</span><IcoChevron /><span className="text-text-secondary">Historial de transacciones</span>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-success/10 text-emerald-400 border border-success/25"><IcoShield />Información protegida</span>
        </div>

        <div className="px-8 py-7 max-w-6xl">
          <div className="flex items-end justify-between gap-6 mb-7">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md mb-2 inline-block bg-accent/15 text-purple-300 font-display">Movimientos</span>
              <h1 className="text-2xl font-bold mb-1 text-text-primary font-display">Historial de transacciones</h1>
              <p className="text-sm text-text-muted">Consulta y filtra los movimientos confirmados de tus cuentas.</p>
            </div>
            {selected && (
              <div className="text-right">
                <div className="text-xs text-text-muted">Saldo disponible</div>
                <div className="text-xl font-bold text-text-primary font-display mt-1">{fmtCOP(Number(selected.saldo))}</div>
              </div>
            )}
          </div>

          {accountsError && (
            <div role="alert" className="flex items-center gap-2 rounded-xl px-4 py-3 mb-5 bg-danger/10 border border-danger/25 text-sm text-red-400"><IcoAlert />{accountsError}</div>
          )}

          <section className="rounded-2xl p-5 mb-5 bg-sidebar border border-border">
            <form onSubmit={applyFilter} noValidate>
              <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_1fr_auto] gap-3 items-end">
                <div>
                  <label htmlFor="history-account" className="block text-xs font-semibold tracking-wide uppercase mb-2 text-purple-200 font-display">Cuenta</label>
                  <select id="history-account" value={account} onChange={(event) => changeAccount(event.target.value)} disabled={cuentas.length === 0} className="w-full px-3.5 py-3 rounded-xl text-sm outline-none appearance-none bg-purple-400/5 text-text-primary border border-border focus:border-purple-400/60 focus:ring-4 focus:ring-purple-400/10" data-i18n-ignore>
                    {cuentas.length === 0 && <option value="" className="bg-surface">No hay cuentas disponibles</option>}
                    {cuentas.map((cuenta) => (
                      <option key={cuenta.numeroCuenta} value={cuenta.numeroCuenta} className="bg-surface">
                        {etiquetaTipoCuenta(cuenta.tipo)} · {cuenta.numeroCuenta}{cuenta.activa ? "" : " (inactiva)"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="start-date" className="block text-xs font-semibold tracking-wide uppercase mb-2 text-purple-200 font-display">Fecha inicial</label>
                  <input id="start-date" type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); setRangeError(""); }} className={`w-full px-3.5 py-3 rounded-xl text-sm outline-none bg-purple-400/5 text-text-primary border focus:ring-4 focus:ring-purple-400/10 ${rangeError ? "border-danger" : "border-border focus:border-purple-400/60"}`} />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-xs font-semibold tracking-wide uppercase mb-2 text-purple-200 font-display">Fecha final</label>
                  <input id="end-date" type="date" value={endDate} onChange={(event) => { setEndDate(event.target.value); setRangeError(""); }} className={`w-full px-3.5 py-3 rounded-xl text-sm outline-none bg-purple-400/5 text-text-primary border focus:ring-4 focus:ring-purple-400/10 ${rangeError ? "border-danger" : "border-border focus:border-purple-400/60"}`} />
                </div>
                <button type="submit" disabled={status === "loading" || !account} className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-purple-600 to-accent shadow-lg shadow-purple-600/25 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0">
                  <IcoSearch />Filtrar
                </button>
              </div>
              {rangeError && <span className="flex items-center gap-1.5 text-xs mt-3 text-red-400"><IcoAlert />{rangeError}</span>}
              {(appliedRange.start || appliedRange.end) && !rangeError && (
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
                    {status === "ready" ? `${filteredTransactions.length} movimientos · Más recientes primero` : "0 movimientos encontrados"}
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

              {status === "failed" && (
                <div className="flex flex-col items-center justify-center text-center py-16 px-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full mb-4 bg-danger/10 text-red-400"><IcoAlert /></div>
                  <h3 className="text-base font-bold text-text-primary font-display">{historyError}</h3>
                  <button type="button" onClick={() => void reload()} className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold text-purple-200 border border-border hover:bg-purple-400/10">Reintentar</button>
                </div>
              )}

              {status === "empty" && (
                <div className="flex flex-col items-center justify-center text-center py-16 px-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full mb-4 bg-purple-600/15 text-purple-300"><IcoSearch /></div>
                  {!account ? (
                    <>
                      <h3 className="text-base font-bold text-text-primary font-display">Aún no tienes cuentas</h3>
                      <button type="button" onClick={() => navigate("/cuentas/nueva")} className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold text-purple-200 border border-border hover:bg-purple-400/10">Abrir una cuenta</button>
                    </>
                  ) : appliedRange.start || appliedRange.end ? (
                    <>
                      <h3 className="text-base font-bold text-text-primary font-display">No hay transacciones en el rango seleccionado</h3>
                      <p className="text-sm text-text-muted mt-1">Prueba con un periodo diferente para encontrar movimientos.</p>
                      <button type="button" onClick={clearFilter} className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold text-purple-200 border border-border hover:bg-purple-400/10">Ver todo el historial</button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-base font-bold text-text-primary font-display">Esta cuenta aún no tiene movimientos</h3>
                      <p className="text-sm text-text-muted mt-1">Las consignaciones, retiros y transferencias aparecerán aquí.</p>
                    </>
                  )}
                </div>
              )}

              {status === "ready" && (
                <>
                  <div className="divide-y divide-border">
                    {currentTransactions.map((transaction) => {
                      const incoming = transaction.type === "Ingreso";
                      return (
                        <button
                          key={transaction.id}
                          type="button"
                          onClick={() => navigate(`/cuentas/transaccion?ref=${encodeURIComponent(transaction.id)}&cuenta=${encodeURIComponent(account)}`)}
                          className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-purple-400/5"
                        >
                          <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${incoming ? "bg-success/10 text-emerald-400" : "bg-purple-600/15 text-purple-300"}`}>
                            <span className={incoming ? "rotate-45" : "-rotate-[135deg]"}><IcoTransfer /></span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-text-secondary truncate">{transaction.description}</div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                              <span>{transaction.kind}</span><span>·</span>
                              <span data-i18n-ignore>{transaction.id}</span><span>·</span>
                              <span>{transaction.date.toLocaleString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                            </div>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${incoming ? "bg-success/10 text-emerald-400" : "bg-purple-400/10 text-purple-300"}`}>{transaction.type}</span>
                          <div className={`w-32 text-right text-sm font-bold ${incoming ? "text-emerald-400" : "text-text-primary"}`}>
                            {incoming ? "+" : "−"} {fmtCOP(transaction.amount)}
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
                      <button type="button" onClick={() => setPage(page - 1)} disabled={page === 1} className="px-3 py-2 rounded-lg text-xs font-semibold text-text-muted border border-border hover:text-purple-200 hover:bg-purple-400/10 disabled:opacity-40 disabled:hover:bg-transparent">Anterior</button>
                      {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                        <button type="button" key={pageNumber} onClick={() => setPage(pageNumber)} className={`w-8 h-8 rounded-lg text-xs font-semibold border ${page === pageNumber ? "bg-purple-600/25 text-purple-200 border-purple-400/40" : "text-text-muted border-border hover:text-purple-200"}`}>{pageNumber}</button>
                      ))}
                      <button type="button" onClick={() => setPage(page + 1)} disabled={page === pageCount} className="px-3 py-2 rounded-lg text-xs font-semibold text-text-muted border border-border hover:text-purple-200 hover:bg-purple-400/10 disabled:opacity-40 disabled:hover:bg-transparent">Siguiente</button>
                    </div>
                  </div>
                </>
              )}
            </section>

            <aside className="flex flex-col gap-4">
              {selected && (
                <div className="rounded-2xl p-5 bg-sidebar border border-border">
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl mb-4 bg-purple-600/15 text-purple-300"><IcoCuentas /></div>
                  <h2 className="text-sm font-semibold text-text-primary font-display">Cuenta consultada</h2>
                  <div className="text-xs text-text-muted mt-3">{etiquetaTipoCuenta(selected.tipo)}</div>
                  <div className="text-sm font-medium text-text-secondary mt-1" data-i18n-ignore>{selected.numeroCuenta}</div>
                  <div className={`flex items-center gap-1.5 text-xs mt-3 ${selected.activa ? "text-emerald-400" : "text-red-400"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${selected.activa ? "bg-success" : "bg-danger"}`} />{selected.activa ? "Activa" : "Inactiva"}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2.5 rounded-xl p-4 bg-purple-400/5 border border-border">
                <span className="text-purple-300 mt-0.5"><IcoInfo /></span>
                <p className="text-xs text-text-muted leading-relaxed">El historial se presenta en grupos de 20 transacciones, ordenadas desde la más reciente. Selecciona un movimiento para ver su comprobante.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
