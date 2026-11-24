import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import Sidebar from "../shared/Sidebar";
import { ApiError, apiRequest, errorMessage } from "../shared/api";
import {
  IcoAlert,
  IcoCheck,
  IcoChevron,
  IcoCuentas,
  IcoInfo,
  IcoSearch,
  IcoShield,
  IcoTransfer,
} from "../shared/icons";
import { esDebito, etiquetaTipoCuenta, etiquetaTransaccion, fmtCOP } from "../shared/helpers";
import { useHistorial, useMisCuentas } from "../shared/hooks";
import type { TransaccionApi } from "../shared/types";

type DetailStatus = "idle" | "loading" | "success" | "not-found" | "error";

const PATRON_REFERENCIA = /^REF-\d{6,}$/;
const RECIENTES = 8;

function fecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

function hora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
}

function describirCuenta(numero: string | null, titular: string | null) {
  if (!numero) return "—";
  if (numero === "EFECTIVO") return "Efectivo (canal físico)";
  return titular ? `${numero} · ${titular}` : numero;
}

export default function TransactionDetailView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { cuentas } = useMisCuentas();
  const cuentaParam = searchParams.get("cuenta") ?? "";
  const cuenta = cuentaParam || cuentas[0]?.numeroCuenta || "";
  const { transacciones, loading: loadingRecent } = useHistorial(cuenta || null);
  const recientes = transacciones.slice(0, RECIENTES);
  const misNumeros = new Set(cuentas.map((item) => item.numeroCuenta));

  const [selected, setSelected] = useState<TransaccionApi | null>(null);
  const [status, setStatus] = useState<DetailStatus>("idle");
  const [query, setQuery] = useState("");
  const [validationError, setValidationError] = useState("");
  const [errorText, setErrorText] = useState("");

  const loadTransaction = useCallback(async (referencia: string) => {
    setSelected(null);
    setStatus("loading");
    setQuery(referencia);
    setValidationError("");
    try {
      const transaction = await apiRequest<TransaccionApi>(
        `/api/transacciones/referencia/${encodeURIComponent(referencia)}`,
      );
      setSelected(transaction);
      setStatus("success");
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
        setStatus("not-found");
      } else {
        setErrorText(errorMessage(error, "No fue posible consultar la transacción"));
        setStatus("error");
      }
    }
  }, []);

  const refParam = searchParams.get("ref")?.toUpperCase() ?? "";
  useEffect(() => {
    if (refParam) void loadTransaction(refParam);
  }, [refParam, loadTransaction]);

  function openTransaction(referencia: string) {
    const next = new URLSearchParams(searchParams);
    next.set("ref", referencia);
    if (cuenta) next.set("cuenta", cuenta);
    setSearchParams(next);
  }

  function searchTransaction(event: React.FormEvent) {
    event.preventDefault();
    const normalized = query.trim().toUpperCase();
    if (!PATRON_REFERENCIA.test(normalized)) {
      setValidationError("Ingresa un número de transacción válido (ej: REF-00000001)");
      return;
    }
    if (normalized === refParam) void loadTransaction(normalized);
    else openTransaction(normalized);
  }

  function changeAccount(numero: string) {
    const next = new URLSearchParams(searchParams);
    next.set("cuenta", numero);
    setSearchParams(next);
  }

  const cuentaReferencia = selected
    ? [selected.cuentaOrigen, selected.cuentaDestino].find((numero) => numero && misNumeros.has(numero)) ?? cuenta
    : cuenta;
  const incomingSelected = selected ? !esDebito(selected, cuentaReferencia) : false;

  return (
    <div className="flex h-full overflow-hidden bg-bg-base">
      <Sidebar variant="cliente" />

      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-5 flex items-center justify-between sticky top-0 z-10 bg-bg-base/95 border-b border-border backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <button type="button" onClick={() => navigate(`/cuentas/historial${cuenta ? `?cuenta=${encodeURIComponent(cuenta)}` : ""}`)} className="hover:text-purple-200">Historial</button>
            <IcoChevron /><span className="text-text-secondary">Detalle de transacción</span>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-success/10 text-emerald-400 border border-success/25"><IcoShield />Consulta segura</span>
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
                    }}
                    placeholder="Ej: REF-00000001"
                    className={`w-full pl-10 pr-3 py-2.5 rounded-xl text-sm outline-none bg-purple-400/5 text-text-primary border focus:ring-4 focus:ring-purple-400/10 ${validationError ? "border-danger" : "border-border focus:border-purple-400/60"}`}
                  />
                </div>
                <button type="submit" disabled={status === "loading"} aria-label="Buscar transacción" className="flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-purple-600 to-accent disabled:opacity-60"><IcoSearch /></button>
              </div>
              {validationError && <span className="flex items-center gap-1.5 text-xs mt-2 text-red-400"><IcoAlert />{validationError}</span>}
            </form>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-5">
            <section className="rounded-2xl overflow-hidden bg-sidebar border border-border">
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-text-primary font-display">Últimos movimientos</h2>
                  {cuentas.length > 1 ? (
                    <select value={cuenta} onChange={(event) => changeAccount(event.target.value)} className="mt-1 text-xs bg-transparent text-text-muted outline-none" data-i18n-ignore>
                      {cuentas.map((item) => (
                        <option key={item.numeroCuenta} value={item.numeroCuenta} className="bg-surface">{etiquetaTipoCuenta(item.tipo)} · {item.numeroCuenta}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-text-muted mt-0.5" data-i18n-ignore>{cuentas[0] ? `${etiquetaTipoCuenta(cuentas[0].tipo)} · ${cuentas[0].numeroCuenta}` : "Sin cuentas"}</p>
                  )}
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-400/10 text-purple-300 shrink-0">{recientes.length} transacciones</span>
              </div>
              {loadingRecent && <p className="px-5 py-6 text-sm text-text-muted">Cargando movimientos...</p>}
              {!loadingRecent && recientes.length === 0 && (
                <p className="px-5 py-6 text-sm text-text-muted">No hay movimientos recientes para mostrar.</p>
              )}
              <div className="divide-y divide-border">
                {recientes.map((transaction) => {
                  const incoming = !esDebito(transaction, cuenta);
                  const active = selected?.referencia === transaction.referencia && status === "success";
                  return (
                    <button
                      type="button"
                      key={transaction.referencia}
                      onClick={() => openTransaction(transaction.referencia)}
                      className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-all ${active ? "bg-purple-600/15" : "hover:bg-purple-400/5"}`}
                    >
                      <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${incoming ? "bg-success/10 text-emerald-400" : "bg-purple-600/15 text-purple-300"}`}>
                        <span className={incoming ? "rotate-45" : "-rotate-[135deg]"}><IcoTransfer /></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-text-secondary truncate">{transaction.descripcion || etiquetaTransaccion(transaction.tipo)}</div>
                        <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1"><span>{fecha(transaction.fecha)}</span><span>·</span><span>{hora(transaction.fecha)}</span></div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${incoming ? "text-emerald-400" : "text-text-primary"}`}>{incoming ? "+" : "−"} {fmtCOP(Number(transaction.monto))}</div>
                        <div className="text-xs text-text-muted mt-1" data-i18n-ignore>{transaction.referencia}</div>
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

              {(status === "not-found" || status === "error") && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full mb-4 bg-danger/10 text-red-400"><IcoAlert /></div>
                  <h2 className="text-lg font-bold text-text-primary font-display">{status === "error" ? "No fue posible consultar la transacción" : "Transacción no encontrada"}</h2>
                  <p className="text-sm text-text-muted mt-1 max-w-sm">{status === "error" ? errorText : "La transacción no existe o no pertenece a ninguna de tus cuentas."}</p>
                  <button type="button" onClick={() => navigate("/cuentas/historial")} className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold text-purple-200 border border-border hover:bg-purple-400/10">Volver al historial</button>
                </div>
              )}

              {status === "success" && selected && (
                <>
                  <div className="px-6 py-5 bg-gradient-to-br from-purple-600/20 to-accent/5 border-b border-border">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-purple-300 font-display">Comprobante de transacción</span>
                        <h2 className="text-lg font-bold text-text-primary font-display mt-1">{etiquetaTransaccion(selected.tipo)}</h2>
                        <div className="text-xs text-text-muted mt-1">{selected.descripcion || "Sin descripción"}</div>
                      </div>
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/10 text-emerald-400 border border-success/25">
                        <IcoCheck />{selected.estado === "EXITOSA" ? "Exitosa" : selected.estado}
                      </span>
                    </div>
                    <div className={`text-3xl font-bold font-display mt-6 ${incomingSelected ? "text-emerald-400" : "text-text-primary"}`}>
                      {incomingSelected ? "+" : "−"} {fmtCOP(Number(selected.monto))}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                      <div>
                        <div className="text-xs text-text-muted">Número de transacción</div>
                        <div className="text-sm font-semibold text-text-secondary mt-1" data-i18n-ignore>{selected.referencia}</div>
                      </div>
                      <div>
                        <div className="text-xs text-text-muted">Tipo</div>
                        <div className="text-sm font-semibold text-text-secondary mt-1">{etiquetaTransaccion(selected.tipo)}</div>
                      </div>
                      <div className="col-span-2 rounded-xl p-4 bg-purple-400/5 border border-border">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-600/15 text-purple-300"><IcoCuentas /></span>
                          <div className="flex-1">
                            <div className="text-xs text-text-muted">Cuenta origen</div>
                            <div className="text-sm font-medium text-text-secondary mt-1" data-i18n-ignore>{describirCuenta(selected.cuentaOrigen, selected.titularOrigen)}</div>
                          </div>
                        </div>
                        <div className="h-px bg-border my-3" />
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-success/10 text-emerald-400"><IcoCuentas /></span>
                          <div className="flex-1">
                            <div className="text-xs text-text-muted">Cuenta destino</div>
                            <div className="text-sm font-medium text-text-secondary mt-1" data-i18n-ignore>{describirCuenta(selected.cuentaDestino, selected.titularDestino)}</div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-text-muted">Fecha</div>
                        <div className="text-sm font-semibold text-text-secondary mt-1">{fecha(selected.fecha)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-text-muted">Hora</div>
                        <div className="text-sm font-semibold text-text-secondary mt-1">{hora(selected.fecha)}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-xl p-3.5 mt-5 bg-purple-400/5 border border-border">
                      <span className="text-purple-300 mt-0.5"><IcoShield /></span>
                      <p className="text-xs text-text-muted leading-relaxed">Por seguridad, el nombre de los titulares de terceros se muestra parcialmente.</p>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl p-4 mt-5 bg-purple-400/5 border border-border">
            <span className="text-purple-300 mt-0.5"><IcoInfo /></span>
            <p className="text-xs text-text-muted leading-relaxed">
              El número de transacción aparece en el comprobante de cada operación con el formato REF-00000000.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
