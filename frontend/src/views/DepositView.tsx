import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import Sidebar from "../shared/Sidebar";
import { IcoChevron, IcoInfo, IcoShield } from "../shared/icons";
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
import { CANALES_CONSIGNACION } from "../shared/data";
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
import type { CuentaDestinoApi, TransaccionApi } from "../shared/types";

const MONTO_MINIMO = 1_000;
const MONTO_MAXIMO = 50_000_000;

type EstadoDestino = "idle" | "checking" | "ok" | "inactive" | "notfound" | "error";
type Errores = Partial<Record<"destino" | "monto", string>>;

export default function DepositView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cuentaParam = searchParams.get("cuenta") ?? "";
  const { cuentas: todas, loading, error: errorCuentas, reload } = useMisCuentas();
  const cuentas = todas.filter((cuenta) => cuenta.activa);

  const [step, setStep] = useState<PasoOperacion>("form");
  const [manual, setManual] = useState(false);
  const [propiaNum, setPropiaNum] = useState(cuentaParam);
  const [destinoInput, setDestinoInput] = useState("");
  const [destinoTercero, setDestinoTercero] = useState<CuentaDestinoApi | null>(null);
  const [estadoDestino, setEstadoDestino] = useState<EstadoDestino>("idle");
  const [canal, setCanal] = useState(CANALES_CONSIGNACION[0].id);
  const [montoStr, setMontoStr] = useState("");
  const [concepto, setConcepto] = useState("");
  const [remitente, setRemitente] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [errorEnvio, setErrorEnvio] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<TransaccionApi | null>(null);

  useEffect(() => {
    if (cuentas.length > 0 && !cuentas.some((cuenta) => cuenta.numeroCuenta === propiaNum)) {
      setPropiaNum(cuentas[0].numeroCuenta);
    }
  }, [cuentas, propiaNum]);

  const propia = cuentas.find((cuenta) => cuenta.numeroCuenta === propiaNum);
  const destinoNum = manual ? destinoInput.trim() : propiaNum;
  const cuentaPropiaDestino = cuentas.find((cuenta) => cuenta.numeroCuenta === destinoNum);
  const monto = parseMonto(montoStr);
  const canalInfo = CANALES_CONSIGNACION.find((item) => item.id === canal) ?? CANALES_CONSIGNACION[0];
  const titularDestino = manual ? destinoTercero?.titular ?? "—" : "Cuenta propia";
  const tipoDestino = manual
    ? destinoTercero ? etiquetaTipoCuenta(destinoTercero.tipo) : "—"
    : propia ? etiquetaTipoCuenta(propia.tipo) : "—";

  async function validarDestino() {
    const limpio = destinoInput.trim();
    if (!limpio) return;
    if (!PATRON_CUENTA.test(limpio)) {
      setEstadoDestino("idle");
      setErrores((prev) => ({ ...prev, destino: "Formato de cuenta inválido (ej: 301-123-4567-89)." }));
      return;
    }
    setEstadoDestino("checking");
    try {
      const info = await apiRequest<CuentaDestinoApi>(`/api/cuentas/${encodeURIComponent(limpio)}/destino`);
      setDestinoTercero(info);
      setEstadoDestino(info.activa ? "ok" : "inactive");
    } catch (err) {
      setDestinoTercero(null);
      setEstadoDestino(err instanceof ApiError && err.status === 404 ? "notfound" : "error");
    }
  }

  function alternarManual() {
    setManual((prev) => !prev);
    setDestinoInput("");
    setDestinoTercero(null);
    setEstadoDestino("idle");
    setErrores((prev) => ({ ...prev, destino: undefined }));
  }

  function validar(): Errores {
    const e: Errores = {};
    if (!destinoNum) e.destino = "Ingresa o selecciona una cuenta destino.";
    else if (manual && estadoDestino === "notfound") e.destino = "La cuenta no existe en el sistema.";
    else if (manual && estadoDestino === "inactive") e.destino = "La cuenta está inactiva y no puede recibir consignaciones.";
    else if (manual && estadoDestino !== "ok") e.destino = "Valida la cuenta destino antes de continuar.";
    if (!montoStr) e.monto = "Ingresa el monto a consignar.";
    else if (monto < MONTO_MINIMO) e.monto = `El monto mínimo de consignación es ${fmtCOP(MONTO_MINIMO)}.`;
    else if (monto > MONTO_MAXIMO) e.monto = `El monto máximo por consignación es ${fmtCOP(MONTO_MAXIMO)}.`;
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
    const descripcion = concepto.trim() ? `${concepto.trim()} · ${canalInfo.label}` : `Consignación · ${canalInfo.label}`;
    try {
      const tx = await apiRequest<TransaccionApi>("/api/transacciones/consignacion", {
        method: "POST",
        body: JSON.stringify({
          cuentaDestino: destinoNum,
          monto,
          remitente: remitente.trim() || null,
          concepto: descripcion,
        }),
      });
      setResultado(tx);
      await reload();
      setStep("success");
    } catch (err) {
      setErrorEnvio(errorMessage(err, "No fue posible realizar la consignación"));
    } finally {
      setEnviando(false);
    }
  }

  function nuevaConsignacion() {
    setMontoStr("");
    setConcepto("");
    setRemitente("");
    setCanal(CANALES_CONSIGNACION[0].id);
    setManual(false);
    setDestinoInput("");
    setDestinoTercero(null);
    setEstadoDestino("idle");
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
            <span>Mis Cuentas</span><IcoChevron /><span className="text-text-secondary">Consignar dinero</span>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-success/10 text-emerald-400 border border-success/25"><IcoShield />Operación segura</span>
        </div>

        <div className="px-8 py-6 max-w-[960px]">
          <div className="mb-7">
            <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded mb-2 inline-block bg-success/10 text-emerald-400 font-display">Consignaciones</span>
            <h1 className="text-2xl font-bold mb-1 text-text-primary font-display">Consignar dinero</h1>
            <p className="text-sm text-text-muted">Ingresa fondos a tu cuenta o a la cuenta de un tercero para aumentar su saldo disponible.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div>
              <Stepper step={step} labels={["Datos de la consignación", "Confirmar operación", "Consignación registrada"]} />

              {step === "form" && (
                <div className="flex flex-col gap-5">
                  <Seccion
                    titulo="Cuenta destino"
                    accion={
                      <button type="button" onClick={alternarManual} className="text-xs px-3 py-1 rounded-lg bg-purple-400/10 text-purple-300 border border-border hover:bg-purple-400/20">
                        {manual ? "← Mis cuentas" : "Otra cuenta"}
                      </button>
                    }
                  >
                    {!manual && (cuentas.length === 0 ? (
                      <SinCuentas loading={loading} error={errorCuentas} />
                    ) : (
                      <SelectorCuenta
                        cuentas={cuentas}
                        seleccionada={propiaNum}
                        onSelect={(numero) => { setPropiaNum(numero); setErrores((prev) => ({ ...prev, destino: undefined })); }}
                        extra={(cuenta) => cuenta.numeroCuenta === propiaNum && monto > 0
                          ? <div className="text-xs mt-0.5 text-emerald-500">+{fmtCOP(monto)} → {fmtCOP(Number(cuenta.saldo) + monto)}</div>
                          : null}
                      />
                    ))}

                    {manual && (
                      <>
                        <label htmlFor="destino" className="block text-xs font-semibold uppercase tracking-wide mb-1 text-text-secondary font-display">Número de cuenta <span className="text-accent">*</span></label>
                        <div className="relative">
                          <input
                            id="destino"
                            type="text"
                            inputMode="numeric"
                            value={destinoInput}
                            onChange={(ev) => {
                              setDestinoInput(normalizarNumeroCuenta(ev.target.value));
                              setDestinoTercero(null);
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
                        {estadoDestino === "ok" && destinoTercero && (
                          <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-success/10 border border-success/20">
                            <span className="text-emerald-500"><IcoShield /></span>
                            <span className="text-xs font-semibold text-emerald-400">{destinoTercero.titular}</span>
                            <span className="text-xs text-text-muted">· {etiquetaTipoCuenta(destinoTercero.tipo)} · Activa</span>
                          </div>
                        )}
                        {estadoDestino === "notfound" && <CampoError mensaje="La cuenta ingresada no existe en el sistema." />}
                        {estadoDestino === "inactive" && <CampoError mensaje="Esta cuenta está inactiva y no puede recibir consignaciones." />}
                        {estadoDestino === "error" && <CampoError mensaje="No fue posible validar la cuenta. Intenta de nuevo." />}
                        <p className="text-xs mt-1.5 text-text-muted">La cuenta se valida al salir del campo.</p>
                      </>
                    )}
                    {(!manual || estadoDestino === "idle" || estadoDestino === "ok") && <CampoError mensaje={errores.destino} />}
                  </Seccion>

                  <Seccion titulo="Canal de consignación">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {CANALES_CONSIGNACION.map((item) => {
                        const sel = canal === item.id;
                        return (
                          <button key={item.id} type="button" onClick={() => setCanal(item.id)} className={`flex items-start gap-3 px-4 py-3.5 rounded-xl text-left border-2 transition-all ${sel ? "bg-purple-600/20 border-purple-400/50" : "bg-purple-400/5 border-border hover:border-purple-400/25"}`}>
                            <span className="text-xl shrink-0 mt-0.5" aria-hidden>{item.icon}</span>
                            <span>
                              <span className={`block text-xs font-semibold mb-0.5 font-display ${sel ? "text-text-primary" : "text-text-secondary"}`}>{item.label}</span>
                              <span className="block text-xs leading-relaxed text-text-muted">{item.desc}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </Seccion>

                  <Seccion titulo="Monto y detalle">
                    <div className="flex items-center justify-between px-4 py-2.5 mb-3 rounded-lg bg-success/5 border border-success/15">
                      <span className="flex items-center gap-1.5 text-xs text-text-muted"><IcoInfo />Límites de consignación</span>
                      <span className="flex items-center gap-4 text-xs text-emerald-400">
                        <span>Mín: <strong>{fmtCOP(MONTO_MINIMO)}</strong></span>
                        <span>Máx: <strong>{fmtCOP(MONTO_MAXIMO)}</strong></span>
                      </span>
                    </div>
                    <label htmlFor="monto" className="block text-xs font-semibold uppercase tracking-wide mb-1 text-text-secondary font-display">Monto a consignar (COP) <span className="text-accent">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-text-muted">$</span>
                      <input
                        id="monto"
                        type="text"
                        inputMode="numeric"
                        value={montoStr}
                        onChange={(ev) => { setMontoStr(formatMonto(ev.target.value)); setErrores((prev) => ({ ...prev, monto: undefined })); }}
                        placeholder="0"
                        className={`${claseInput} pl-7 py-3 text-xl font-bold font-display ${errores.monto ? "border-danger" : "border-border focus:border-purple-400/60"}`}
                      />
                    </div>
                    <CampoError mensaje={errores.monto} />
                    <MontosRapidos valores={[200_000, 500_000, 1_000_000, 2_000_000, 5_000_000]} onPick={(valor) => { setMontoStr(valor.toLocaleString("es-CO")); setErrores((prev) => ({ ...prev, monto: undefined })); }} />
                    {monto > 0 && cuentaPropiaDestino && (
                      <div className="flex items-center justify-between mt-3 px-3 py-2.5 rounded-lg bg-success/5 border border-success/20">
                        <span className="text-xs text-text-muted">Saldo proyectado tras la consignación</span>
                        <span className="text-sm font-bold text-emerald-400 font-display">{fmtCOP(Number(cuentaPropiaDestino.saldo) + monto)}</span>
                      </div>
                    )}

                    <label htmlFor="remitente" className="block text-xs font-semibold uppercase tracking-wide mt-4 mb-1 text-text-secondary font-display">Nombre del remitente (opcional)</label>
                    <input id="remitente" type="text" value={remitente} onChange={(ev) => setRemitente(ev.target.value)} placeholder="Si lo dejas vacío se usa tu nombre" maxLength={60} className={`${claseInput} border-border focus:border-purple-400/60`} />

                    <label htmlFor="concepto" className="block text-xs font-semibold uppercase tracking-wide mt-4 mb-1 text-text-secondary font-display">Concepto (opcional)</label>
                    <input id="concepto" type="text" value={concepto} onChange={(ev) => setConcepto(ev.target.value)} placeholder="Ej: Pago de nómina, ahorro mensual..." maxLength={80} className={`${claseInput} border-border focus:border-purple-400/60`} />
                    <p className="text-xs text-right mt-1 text-text-muted">{concepto.length}/80</p>
                  </Seccion>

                  <div className="flex justify-end pb-2">
                    <button type="button" onClick={continuar} disabled={estadoDestino === "checking"} className={claseBotonPrimario}>Continuar <IcoChevron /></button>
                  </div>
                </div>
              )}

              {step === "confirm" && (
                <div className="flex flex-col gap-5">
                  <div className="rounded-2xl overflow-hidden border border-purple-400/20">
                    <div className="px-6 py-5 flex items-center gap-4 bg-gradient-to-br from-success/15 to-purple-600/15 border-b border-border">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl text-2xl bg-success/15 border border-success/25" aria-hidden>{canalInfo.icon}</div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider mb-0.5 text-emerald-400 font-display">Resumen de la consignación</div>
                        <div className="text-2xl font-bold text-text-primary font-display">{fmtCOP(monto)}</div>
                        <div className="text-xs mt-0.5 text-text-muted">{canalInfo.label}</div>
                      </div>
                    </div>
                    <div className="px-6 py-4 bg-sidebar">
                      <FilasResumen
                        filas={[
                          { label: "Cuenta destino", value: destinoNum },
                          { label: "Titular", value: titularDestino },
                          { label: "Tipo de cuenta", value: tipoDestino },
                          { label: "Monto a consignar", value: fmtCOP(monto), tono: "destacado" },
                          ...(cuentaPropiaDestino ? [{ label: "Saldo proyectado", value: fmtCOP(Number(cuentaPropiaDestino.saldo) + monto), tono: "ok" as const }] : []),
                          { label: "Canal", value: canalInfo.label },
                          { label: "Remitente", value: remitente || "Titular de la sesión", tono: remitente ? undefined : "tenue" },
                          { label: "Concepto", value: concepto || "No especificado", tono: concepto ? undefined : "tenue" },
                        ]}
                      />
                    </div>
                    <div className="px-6 py-3.5 bg-purple-400/5 border-t border-border">
                      <AvisoOperacion>Al confirmar, el saldo de la cuenta destino se actualizará de forma inmediata.</AvisoOperacion>
                    </div>
                  </div>
                  <AlertaError mensaje={errorEnvio} />
                  <div className="flex items-center justify-between pb-2">
                    <button type="button" onClick={() => setStep("form")} disabled={enviando} className={claseBotonSecundario}>← Volver</button>
                    <button type="button" onClick={() => void confirmar()} disabled={enviando} className={claseBotonPrimario}>{enviando ? "Procesando..." : "Confirmar consignación"}</button>
                  </div>
                </div>
              )}

              {step === "success" && resultado && (
                <div className="flex flex-col items-center text-center gap-6 py-2">
                  <IconoExito />
                  <div>
                    <h2 className="text-xl font-bold mb-1 text-text-primary font-display">¡Consignación registrada!</h2>
                    <p className="text-sm max-w-sm mx-auto text-text-muted">El monto fue acreditado a la cuenta destino y la transacción quedó registrada en el historial.</p>
                  </div>
                  <div className="w-full max-w-sm rounded-2xl overflow-hidden text-left border border-purple-400/20">
                    <div className="px-5 py-4 bg-gradient-to-br from-success/10 to-purple-600/10 border-b border-border">
                      <div className="text-xs uppercase tracking-wider mb-0.5 text-emerald-400 font-display">Comprobante de consignación</div>
                      <div className="text-xl font-bold text-text-primary font-display">{fmtCOP(Number(resultado.monto))}</div>
                    </div>
                    <div className="px-5 py-3 bg-sidebar">
                      <FilasResumen
                        filas={[
                          { label: "Referencia", value: resultado.referencia },
                          { label: "Cuenta acreditada", value: resultado.cuentaDestino ?? destinoNum },
                          { label: "Titular", value: resultado.titularDestino ?? titularDestino },
                          { label: "Canal", value: canalInfo.label },
                          { label: "Remitente", value: resultado.titularOrigen ?? "—" },
                          { label: "Fecha", value: fmtFecha(resultado.fecha) },
                          ...(cuentaPropiaDestino ? [{ label: "Saldo actual", value: fmtCOP(Number(cuentaPropiaDestino.saldo)), tono: "ok" as const }] : []),
                          { label: "Estado", value: "Acreditado", tono: "ok" },
                        ]}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button type="button" onClick={nuevaConsignacion} className={claseBotonSecundario}>Nueva consignación</button>
                    {cuentaPropiaDestino && (
                      <button type="button" onClick={() => navigate(`/cuentas/transaccion?ref=${encodeURIComponent(resultado.referencia)}&cuenta=${encodeURIComponent(destinoNum)}`)} className={claseBotonSecundario}>Ver comprobante</button>
                    )}
                    <button type="button" onClick={() => navigate("/inicio")} className={claseBotonPrimario}>Ir al inicio</button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <PanelSaldos cuentas={cuentas} />
              <PanelHistorialReciente key={`${propiaNum}-${resultado?.referencia ?? ""}`} numeroCuenta={propiaNum} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
