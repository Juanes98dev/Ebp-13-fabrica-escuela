import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import Sidebar from "../shared/Sidebar";
import { IcoAlert, IcoChevron, IcoShield } from "../shared/icons";
import { ApiError, apiRequest, errorMessage } from "../shared/api";
import {
  etiquetaTipoCuenta,
  fmtCOP,
  fmtFecha,
  formatMonto,
  normalizarNumeroCuenta,
  parseMonto,
  PATRON_CUENTA,
} from "../shared/helpers";
import { useMisCuentas } from "../shared/hooks";
import {
  AlertaError,
  AvisoOperacion,
  CampoError,
  claseBotonPrimario,
  claseBotonSecundario,
  claseInput,
  FilasResumen,
  IconoExito,
  MontosRapidos,
  PanelHistorialReciente,
  PanelSaldos,
  type PasoOperacion,
  Seccion,
  SelectorCuenta,
  SinCuentas,
  Stepper,
} from "../shared/operaciones";
import { getSession } from "../shared/session";
import type { CuentaDestinoApi, TransaccionApi } from "../shared/types";

const MONTO_MINIMO = 1_000;

type EstadoDestino = "idle" | "checking" | "ok" | "inactive" | "notfound" | "error";
type Errores = Partial<Record<"origen" | "destino" | "monto", string>>;

export default function TransferView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cuentas: todas, loading, error: errorCuentas, reload } = useMisCuentas();
  const cuentas = todas.filter((cuenta) => cuenta.activa);
  const nombre = getSession()?.nombre ?? "";

  const [step, setStep] = useState<PasoOperacion>("form");
  const [origenNum, setOrigenNum] = useState(searchParams.get("origen") ?? "");
  const [destinoNum, setDestinoNum] = useState("");
  const [destino, setDestino] = useState<CuentaDestinoApi | null>(null);
  const [estadoDestino, setEstadoDestino] = useState<EstadoDestino>("idle");
  const [montoStr, setMontoStr] = useState("");
  const [concepto, setConcepto] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [errorEnvio, setErrorEnvio] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<TransaccionApi | null>(null);

  useEffect(() => {
    if (cuentas.length > 0 && !cuentas.some((cuenta) => cuenta.numeroCuenta === origenNum)) {
      setOrigenNum(cuentas[0].numeroCuenta);
    }
  }, [cuentas, origenNum]);

  const origen = cuentas.find((cuenta) => cuenta.numeroCuenta === origenNum);
  const saldo = Number(origen?.saldo ?? 0);
  const monto = parseMonto(montoStr);
  const otrasPropias = cuentas.filter((cuenta) => cuenta.numeroCuenta !== origenNum);

  async function validarDestino(numero = destinoNum) {
    const limpio = numero.trim();
    if (!limpio) return;
    if (!PATRON_CUENTA.test(limpio)) {
      setDestino(null);
      setEstadoDestino("idle");
      setErrores((prev) => ({ ...prev, destino: "Formato de cuenta inválido (ej: 301-123-4567-89)." }));
      return;
    }
    setEstadoDestino("checking");
    try {
      const info = await apiRequest<CuentaDestinoApi>(`/api/cuentas/${encodeURIComponent(limpio)}/destino`);
      setDestino(info);
      setEstadoDestino(info.activa ? "ok" : "inactive");
    } catch (err) {
      setDestino(null);
      setEstadoDestino(err instanceof ApiError && err.status === 404 ? "notfound" : "error");
    }
  }

  function elegirDestino(numero: string) {
    setDestinoNum(numero);
    setErrores((prev) => ({ ...prev, destino: undefined }));
    void validarDestino(numero);
  }

  function validar(): Errores {
    const e: Errores = {};
    if (!origen) e.origen = "Debes tener una cuenta activa para realizar transferencias.";
    const limpio = destinoNum.trim();
    if (!limpio) e.destino = "Ingresa el número de cuenta destino.";
    else if (limpio === origenNum) e.destino = "La cuenta destino debe ser diferente a la cuenta origen.";
    else if (estadoDestino === "notfound") e.destino = "La cuenta destino no existe en el sistema.";
    else if (estadoDestino === "inactive") e.destino = "La cuenta destino está inactiva.";
    else if (estadoDestino !== "ok") e.destino = "Valida la cuenta destino antes de continuar.";
    if (!montoStr) e.monto = "Ingresa un monto a transferir.";
    else if (monto < MONTO_MINIMO) e.monto = `El monto mínimo de transferencia es ${fmtCOP(MONTO_MINIMO)}.`;
    else if (monto > saldo) e.monto = `Saldo insuficiente. Disponible: ${fmtCOP(saldo)}`;
    return e;
  }

  function continuar() {
    const e = validar();
    setErrores(e);
    setErrorEnvio("");
    if (Object.values(e).some(Boolean)) return;
    setStep("confirm");
  }

  async function confirmar() {
    setEnviando(true);
    setErrorEnvio("");
    try {
      const tx = await apiRequest<TransaccionApi>("/api/transacciones/transferencia", {
        method: "POST",
        body: JSON.stringify({
          cuentaOrigen: origenNum,
          cuentaDestino: destinoNum.trim(),
          monto,
          concepto: concepto.trim() || null,
        }),
      });
      setResultado(tx);
      await reload();
      setStep("success");
    } catch (err) {
      setErrorEnvio(errorMessage(err, "No fue posible realizar la transferencia"));
    } finally {
      setEnviando(false);
    }
  }

  function nuevaTransferencia() {
    setDestinoNum("");
    setDestino(null);
    setEstadoDestino("idle");
    setMontoStr("");
    setConcepto("");
    setErrores({});
    setErrorEnvio("");
    setResultado(null);
    setStep("form");
  }

  const bordeDestino = errores.destino || estadoDestino === "inactive" || estadoDestino === "notfound" || estadoDestino === "error"
    ? "border-danger"
    : estadoDestino === "ok"
      ? "border-success"
      : "border-border focus:border-purple-400/60";

  return (
    <div className="flex h-full overflow-hidden bg-bg-base">
      <Sidebar variant="cliente" />

      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-5 flex items-center justify-between sticky top-0 z-10 bg-bg-base/95 border-b border-border backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Transferencias</span><IcoChevron /><span className="text-text-secondary">Nueva transferencia</span>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-success/10 text-emerald-400 border border-success/25"><IcoShield />Operación segura</span>
        </div>

        <div className="px-8 py-6 max-w-[960px]">
          <div className="mb-7">
            <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded mb-2 inline-block bg-accent/15 text-purple-300 font-display">Transferencias</span>
            <h1 className="text-2xl font-bold mb-1 text-text-primary font-display">Transferir dinero</h1>
            <p className="text-sm text-text-muted">Envía fondos a cuentas propias o a terceros de forma segura e inmediata.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div>
              <Stepper step={step} labels={["Datos de transferencia", "Confirmar operación", "Transferencia enviada"]} />

              {step === "form" && (
                <div className="flex flex-col gap-5">
                  <Seccion titulo="Cuenta origen">
                    {cuentas.length === 0 ? (
                      <SinCuentas loading={loading} error={errorCuentas} />
                    ) : (
                      <SelectorCuenta
                        cuentas={cuentas}
                        seleccionada={origenNum}
                        onSelect={(numero) => { setOrigenNum(numero); setErrores((prev) => ({ ...prev, origen: undefined })); }}
                      />
                    )}
                    <CampoError mensaje={errores.origen} />
                  </Seccion>

                  <Seccion titulo="Cuenta destino">
                    <label htmlFor="destino" className="block text-xs font-semibold uppercase tracking-wide mb-1 text-text-secondary font-display">Número de cuenta <span className="text-accent">*</span></label>
                    <div className="relative">
                      <input
                        id="destino"
                        type="text"
                        inputMode="numeric"
                        value={destinoNum}
                        onChange={(ev) => {
                          setDestinoNum(normalizarNumeroCuenta(ev.target.value));
                          setDestino(null);
                          setEstadoDestino("idle");
                          setErrores((prev) => ({ ...prev, destino: undefined }));
                        }}
                        onBlur={() => void validarDestino()}
                        placeholder="Ej: 301-123-4567-89"
                        className={`${claseInput} pr-10 font-mono ${bordeDestino}`}
                        data-i18n-ignore
                      />
                      {estadoDestino === "checking" && <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-purple-300/50 border-t-transparent animate-spin" />}
                      {estadoDestino === "ok" && <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-emerald-500">✓</span>}
                    </div>
                    {estadoDestino === "ok" && destino && (
                      <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-success/10 border border-success/20">
                        <span className="text-emerald-500"><IcoShield /></span>
                        <span className="text-xs font-semibold text-emerald-400">{destino.titular}</span>
                        <span className="text-xs text-text-muted">· {etiquetaTipoCuenta(destino.tipo)}{destino.propia ? " · Propia" : ""} · Activa</span>
                      </div>
                    )}
                    {estadoDestino === "notfound" && <CampoError mensaje="La cuenta ingresada no existe en el sistema." />}
                    {estadoDestino === "inactive" && <CampoError mensaje={`La cuenta de ${destino?.titular ?? "destino"} está inactiva y no puede recibir transferencias.`} />}
                    {estadoDestino === "error" && <CampoError mensaje="No fue posible validar la cuenta. Intenta de nuevo." />}
                    {estadoDestino === "idle" && <CampoError mensaje={errores.destino} />}
                    {(estadoDestino === "ok" || estadoDestino === "checking") && errores.destino && <CampoError mensaje={errores.destino} />}
                    <p className="text-xs mt-1.5 text-text-muted">La cuenta se valida al salir del campo.</p>

                    {otrasPropias.length > 0 && (
                      <div className="mt-4">
                        <div className="text-xs mb-2 text-text-muted">Entre mis cuentas:</div>
                        <div className="flex gap-2 flex-wrap">
                          {otrasPropias.map((cuenta) => (
                            <button
                              key={cuenta.numeroCuenta}
                              type="button"
                              onClick={() => elegirDestino(cuenta.numeroCuenta)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${destinoNum === cuenta.numeroCuenta ? "bg-purple-600/25 text-text-secondary border-purple-400/40" : "bg-purple-400/10 text-text-muted border-border hover:text-purple-300"}`}
                            >
                              {etiquetaTipoCuenta(cuenta.tipo)} · <span data-i18n-ignore>{cuenta.numeroCuenta.slice(-7)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </Seccion>

                  <Seccion titulo="Monto y concepto">
                    <label htmlFor="monto" className="block text-xs font-semibold uppercase tracking-wide mb-1 text-text-secondary font-display">Monto a transferir (COP) <span className="text-accent">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted">$</span>
                      <input
                        id="monto"
                        type="text"
                        inputMode="numeric"
                        value={montoStr}
                        onChange={(ev) => { setMontoStr(formatMonto(ev.target.value)); setErrores((prev) => ({ ...prev, monto: undefined })); }}
                        placeholder="0"
                        className={`${claseInput} pl-7 py-3 text-lg font-bold font-display ${errores.monto ? "border-danger" : "border-border focus:border-purple-400/60"}`}
                      />
                    </div>
                    <CampoError mensaje={errores.monto} />
                    <MontosRapidos valores={[50_000, 100_000, 200_000, 500_000]} maximo={saldo} onPick={(valor) => { setMontoStr(valor.toLocaleString("es-CO")); setErrores((prev) => ({ ...prev, monto: undefined })); }} />
                    {origen && monto > 0 && monto <= saldo && (
                      <p className="text-xs mt-2 text-text-muted">Saldo restante: <span className="text-purple-300">{fmtCOP(saldo - monto)}</span></p>
                    )}

                    <label htmlFor="concepto" className="block text-xs font-semibold uppercase tracking-wide mt-4 mb-1 text-text-secondary font-display">Concepto / descripción</label>
                    <input id="concepto" type="text" value={concepto} onChange={(ev) => setConcepto(ev.target.value)} placeholder="Ej: Pago arriendo, envío familiar..." maxLength={80} className={`${claseInput} border-border focus:border-purple-400/60`} />
                    <p className="text-xs text-right mt-1 text-text-muted">{concepto.length}/80</p>
                  </Seccion>

                  <div className="flex justify-end pb-2">
                    <button type="button" onClick={continuar} disabled={cuentas.length === 0 || estadoDestino === "checking"} className={claseBotonPrimario}>
                      Continuar <IcoChevron />
                    </button>
                  </div>
                </div>
              )}

              {step === "confirm" && origen && (
                <div className="flex flex-col gap-5">
                  <div className="rounded-2xl overflow-hidden border border-purple-400/20">
                    <div className="px-6 py-5 bg-gradient-to-br from-purple-600/25 to-accent/10 border-b border-border">
                      <div className="text-xs font-semibold uppercase tracking-wider mb-0.5 text-purple-300 font-display">Resumen de la operación</div>
                      <div className="text-2xl font-bold text-text-primary font-display">{fmtCOP(monto)}</div>
                      <div className="text-xs mt-0.5 text-text-muted">{concepto || "Sin concepto especificado"}</div>
                    </div>
                    <div className="px-6 py-4 bg-sidebar">
                      <FilasResumen
                        filas={[
                          { label: "Cuenta origen", value: `${etiquetaTipoCuenta(origen.tipo)} · ${origenNum}` },
                          { label: "Titular origen", value: nombre },
                          { label: "Cuenta destino", value: `${destino ? etiquetaTipoCuenta(destino.tipo) : ""} · ${destinoNum}` },
                          { label: "Titular destino", value: destino?.titular ?? "—" },
                          { label: "Monto", value: fmtCOP(monto), tono: "destacado" },
                          { label: "Saldo después", value: fmtCOP(saldo - monto), tono: "tenue" },
                        ]}
                      />
                    </div>
                    <div className="px-6 py-3.5 bg-purple-400/5 border-t border-border">
                      <AvisoOperacion>Esta operación es inmediata e irreversible. Verifica los datos antes de confirmar.</AvisoOperacion>
                    </div>
                  </div>
                  <AlertaError mensaje={errorEnvio} />
                  <div className="flex items-center justify-between pb-2">
                    <button type="button" onClick={() => setStep("form")} disabled={enviando} className={claseBotonSecundario}>← Volver</button>
                    <button type="button" onClick={() => void confirmar()} disabled={enviando} className={claseBotonPrimario}>
                      {enviando ? "Procesando..." : "Confirmar transferencia"}
                    </button>
                  </div>
                </div>
              )}

              {step === "success" && resultado && (
                <div className="flex flex-col items-center text-center gap-6 py-2">
                  <IconoExito />
                  <div>
                    <h2 className="text-xl font-bold mb-1 text-text-primary font-display">¡Transferencia exitosa!</h2>
                    <p className="text-sm text-text-muted">Los fondos fueron enviados y los saldos se actualizaron.</p>
                  </div>
                  <div className="w-full max-w-sm rounded-2xl overflow-hidden text-left border border-purple-400/20">
                    <div className="px-5 py-4 bg-gradient-to-br from-purple-600/20 to-accent/10 border-b border-border">
                      <div className="text-xs uppercase tracking-wider mb-0.5 text-purple-300 font-display">Comprobante</div>
                      <div className="text-xl font-bold text-text-primary font-display">{fmtCOP(Number(resultado.monto))}</div>
                    </div>
                    <div className="px-5 py-3 bg-sidebar">
                      <FilasResumen
                        filas={[
                          { label: "Referencia", value: resultado.referencia },
                          { label: "Destino", value: resultado.titularDestino ?? destinoNum },
                          { label: "Cuenta destino", value: resultado.cuentaDestino ?? destinoNum },
                          { label: "Fecha", value: fmtFecha(resultado.fecha) },
                          { label: "Estado", value: "Completada", tono: "ok" },
                        ]}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button type="button" onClick={nuevaTransferencia} className={claseBotonSecundario}>Nueva transferencia</button>
                    <button type="button" onClick={() => navigate(`/cuentas/transaccion?ref=${encodeURIComponent(resultado.referencia)}&cuenta=${encodeURIComponent(origenNum)}`)} className={claseBotonSecundario}>Ver comprobante</button>
                    <button type="button" onClick={() => navigate("/inicio")} className={claseBotonPrimario}>Ir al inicio</button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <PanelSaldos cuentas={cuentas} />
              <PanelHistorialReciente key={`${origenNum}-${resultado?.referencia ?? ""}`} numeroCuenta={origenNum} limite={6} />
              {errorCuentas && cuentas.length > 0 && <CampoError mensaje={errorCuentas} />}
              <div className="flex items-start gap-2 rounded-xl p-4 bg-purple-400/5 border border-border text-xs text-text-muted">
                <span className="text-red-400"><IcoAlert /></span>
                Nunca compartas tus claves. Banco X no te pedirá datos de acceso para realizar una transferencia.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
