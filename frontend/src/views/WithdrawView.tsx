import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import Sidebar from "../shared/Sidebar";
import { IcoChevron, IcoInfo, IcoShield } from "../shared/icons";
import { apiRequest, errorMessage } from "../shared/api";
import { etiquetaTipoCuenta, fmtCOP, fmtFecha, formatMonto, parseMonto } from "../shared/helpers";
import { CANALES_RETIRO } from "../shared/data";
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
import type { TransaccionApi } from "../shared/types";

const MONTO_MINIMO = 10_000;
const MONTO_MAXIMO = 3_000_000;

type Errores = Partial<Record<"cuenta" | "monto", string>>;

export default function WithdrawView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cuentas: todas, loading, error: errorCuentas, reload } = useMisCuentas();
  const cuentas = todas.filter((cuenta) => cuenta.activa);
  const nombre = getSession()?.nombre ?? "";

  const [step, setStep] = useState<PasoOperacion>("form");
  const [cuentaNum, setCuentaNum] = useState(searchParams.get("cuenta") ?? "");
  const [montoStr, setMontoStr] = useState("");
  const [canal, setCanal] = useState(CANALES_RETIRO[0].id);
  const [concepto, setConcepto] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [errorEnvio, setErrorEnvio] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<TransaccionApi | null>(null);

  useEffect(() => {
    if (cuentas.length > 0 && !cuentas.some((cuenta) => cuenta.numeroCuenta === cuentaNum)) {
      const conSaldo = cuentas.find((cuenta) => Number(cuenta.saldo) >= MONTO_MINIMO) ?? cuentas[0];
      setCuentaNum(conSaldo.numeroCuenta);
    }
  }, [cuentas, cuentaNum]);

  const cuenta = cuentas.find((item) => item.numeroCuenta === cuentaNum);
  const saldo = Number(cuenta?.saldo ?? 0);
  const monto = parseMonto(montoStr);
  const canalInfo = CANALES_RETIRO.find((item) => item.id === canal) ?? CANALES_RETIRO[0];
  const descripcion = concepto.trim() ? `${concepto.trim()} · ${canalInfo.label}` : `Retiro · ${canalInfo.label}`;

  function validar(): Errores {
    const e: Errores = {};
    if (!cuenta) e.cuenta = "Debes tener una cuenta activa para realizar retiros.";
    if (!montoStr) e.monto = "Ingresa el monto a retirar.";
    else if (monto < MONTO_MINIMO) e.monto = `El monto mínimo de retiro es ${fmtCOP(MONTO_MINIMO)}.`;
    else if (monto > MONTO_MAXIMO) e.monto = `El monto máximo por retiro es ${fmtCOP(MONTO_MAXIMO)}.`;
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
      const tx = await apiRequest<TransaccionApi>("/api/transacciones/retiro", {
        method: "POST",
        body: JSON.stringify({ numeroCuenta: cuentaNum, monto, concepto: descripcion }),
      });
      setResultado(tx);
      await reload();
      setStep("success");
    } catch (err) {
      setErrorEnvio(errorMessage(err, "No fue posible realizar el retiro"));
    } finally {
      setEnviando(false);
    }
  }

  function nuevoRetiro() {
    setMontoStr("");
    setConcepto("");
    setCanal(CANALES_RETIRO[0].id);
    setErrores({});
    setErrorEnvio("");
    setResultado(null);
    setStep("form");
  }

  return (
    <div className="flex h-full overflow-hidden bg-bg-base">
      <Sidebar variant="cliente" />

      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-5 flex items-center justify-between sticky top-0 z-10 bg-bg-base/95 border-b border-border backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Mis Cuentas</span><IcoChevron /><span className="text-text-secondary">Retirar dinero</span>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-success/10 text-emerald-400 border border-success/25"><IcoShield />Operación segura</span>
        </div>

        <div className="px-8 py-6 max-w-[960px]">
          <div className="mb-7">
            <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded mb-2 inline-block bg-accent/15 text-purple-300 font-display">Retiros</span>
            <h1 className="text-2xl font-bold mb-1 text-text-primary font-display">Retirar dinero</h1>
            <p className="text-sm text-text-muted">Selecciona tu cuenta, el canal de retiro y el monto que deseas disponer en efectivo.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div>
              <Stepper step={step} labels={["Datos del retiro", "Confirmar operación", "Retiro procesado"]} />

              {step === "form" && (
                <div className="flex flex-col gap-5">
                  <Seccion titulo="Cuenta a debitar">
                    {cuentas.length === 0 ? (
                      <SinCuentas loading={loading} error={errorCuentas} />
                    ) : (
                      <SelectorCuenta
                        cuentas={cuentas}
                        seleccionada={cuentaNum}
                        onSelect={(numero) => { setCuentaNum(numero); setErrores((prev) => ({ ...prev, cuenta: undefined })); }}
                        deshabilitar={(item) => (Number(item.saldo) < MONTO_MINIMO ? "Saldo insuficiente para retiros" : null)}
                      />
                    )}
                    <CampoError mensaje={errores.cuenta} />
                  </Seccion>

                  <Seccion titulo="Canal de retiro">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {CANALES_RETIRO.map((item) => {
                        const sel = canal === item.id;
                        return (
                          <button key={item.id} type="button" onClick={() => setCanal(item.id)} className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl text-center border-2 transition-all ${sel ? "bg-purple-600/20 border-purple-400/50" : "bg-purple-400/5 border-border hover:border-purple-400/25"}`}>
                            <span className="text-2xl" aria-hidden>{item.icon}</span>
                            <span className={`text-xs font-semibold font-display ${sel ? "text-text-primary" : "text-text-secondary"}`}>{item.label}</span>
                            <span className="text-xs leading-tight text-text-muted">{item.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </Seccion>

                  <Seccion titulo="Monto a retirar">
                    <div className="flex items-center justify-between px-4 py-2.5 mb-3 rounded-lg bg-purple-400/5 border border-border">
                      <span className="flex items-center gap-1.5 text-xs text-text-muted"><IcoInfo />Límites por operación</span>
                      <span className="flex items-center gap-4 text-xs text-purple-300">
                        <span>Mín: <strong>{fmtCOP(MONTO_MINIMO)}</strong></span>
                        <span>Máx: <strong>{fmtCOP(MONTO_MAXIMO)}</strong></span>
                      </span>
                    </div>
                    <label htmlFor="monto" className="block text-xs font-semibold uppercase tracking-wide mb-1 text-text-secondary font-display">Monto (COP) <span className="text-accent">*</span></label>
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
                    <MontosRapidos valores={[100_000, 200_000, 500_000, 1_000_000]} maximo={Math.min(saldo, MONTO_MAXIMO)} onPick={(valor) => { setMontoStr(valor.toLocaleString("es-CO")); setErrores((prev) => ({ ...prev, monto: undefined })); }} />
                    {monto > 0 && monto <= saldo && (
                      <div className="flex items-center justify-between mt-3 px-3 py-2 rounded-lg bg-purple-400/5 border border-border">
                        <span className="text-xs text-text-muted">Saldo restante tras el retiro</span>
                        <span className="text-sm font-bold text-purple-300 font-display">{fmtCOP(saldo - monto)}</span>
                      </div>
                    )}

                    <label htmlFor="concepto" className="block text-xs font-semibold uppercase tracking-wide mt-4 mb-1 text-text-secondary font-display">Concepto (opcional)</label>
                    <input id="concepto" type="text" value={concepto} onChange={(ev) => setConcepto(ev.target.value)} placeholder="Ej: Gastos personales, arriendo..." maxLength={60} className={`${claseInput} border-border focus:border-purple-400/60`} />
                    <p className="text-xs text-right mt-1 text-text-muted">{concepto.length}/60</p>
                  </Seccion>

                  <div className="flex justify-end pb-2">
                    <button type="button" onClick={continuar} disabled={cuentas.length === 0} className={claseBotonPrimario}>Continuar <IcoChevron /></button>
                  </div>
                </div>
              )}

              {step === "confirm" && cuenta && (
                <div className="flex flex-col gap-5">
                  <div className="rounded-2xl overflow-hidden border border-purple-400/20">
                    <div className="px-6 py-5 flex items-center gap-4 bg-gradient-to-br from-purple-600/25 to-accent/10 border-b border-border">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl text-2xl bg-purple-600/30" aria-hidden>{canalInfo.icon}</div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider mb-0.5 text-purple-300 font-display">Resumen del retiro</div>
                        <div className="text-2xl font-bold text-text-primary font-display">{fmtCOP(monto)}</div>
                        <div className="text-xs mt-0.5 text-text-muted">{canalInfo.label}</div>
                      </div>
                    </div>
                    <div className="px-6 py-4 bg-sidebar">
                      <FilasResumen
                        filas={[
                          { label: "Titular", value: nombre },
                          { label: "Cuenta debitada", value: `${etiquetaTipoCuenta(cuenta.tipo)} · ${cuentaNum}` },
                          { label: "Canal de retiro", value: canalInfo.label },
                          { label: "Monto", value: fmtCOP(monto), tono: "destacado" },
                          { label: "Saldo después del retiro", value: fmtCOP(saldo - monto), tono: "tenue" },
                          { label: "Concepto", value: concepto || "Sin especificar", tono: concepto ? undefined : "tenue" },
                        ]}
                      />
                    </div>
                    <div className="px-6 py-3.5 bg-purple-400/5 border-t border-border">
                      <AvisoOperacion>Esta operación descontará el monto de tu cuenta de forma inmediata.</AvisoOperacion>
                    </div>
                  </div>
                  <AlertaError mensaje={errorEnvio} />
                  <div className="flex items-center justify-between pb-2">
                    <button type="button" onClick={() => setStep("form")} disabled={enviando} className={claseBotonSecundario}>← Volver</button>
                    <button type="button" onClick={() => void confirmar()} disabled={enviando} className={claseBotonPrimario}>{enviando ? "Procesando..." : "Confirmar retiro"}</button>
                  </div>
                </div>
              )}

              {step === "success" && resultado && (
                <div className="flex flex-col items-center text-center gap-6 py-2">
                  <IconoExito />
                  <div>
                    <h2 className="text-xl font-bold mb-1 text-text-primary font-display">¡Retiro procesado exitosamente!</h2>
                    <p className="text-sm max-w-sm mx-auto text-text-muted">El monto fue descontado de tu cuenta y quedó registrado en tu historial.</p>
                  </div>
                  <div className="w-full max-w-sm rounded-2xl overflow-hidden text-left border border-purple-400/20">
                    <div className="px-5 py-4 bg-gradient-to-br from-purple-600/20 to-accent/10 border-b border-border">
                      <div className="text-xs uppercase tracking-wider mb-0.5 text-purple-300 font-display">Comprobante de retiro</div>
                      <div className="text-xl font-bold text-text-primary font-display">{fmtCOP(Number(resultado.monto))}</div>
                    </div>
                    <div className="px-5 py-3 bg-sidebar">
                      <FilasResumen
                        filas={[
                          { label: "Referencia", value: resultado.referencia },
                          { label: "Canal", value: canalInfo.label },
                          { label: "Cuenta debitada", value: cuentaNum },
                          { label: "Fecha", value: fmtFecha(resultado.fecha) },
                          { label: "Estado", value: "Procesado", tono: "ok" },
                        ]}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button type="button" onClick={nuevoRetiro} className={claseBotonSecundario}>Nuevo retiro</button>
                    <button type="button" onClick={() => navigate(`/cuentas/transaccion?ref=${encodeURIComponent(resultado.referencia)}&cuenta=${encodeURIComponent(cuentaNum)}`)} className={claseBotonSecundario}>Ver comprobante</button>
                    <button type="button" onClick={() => navigate("/inicio")} className={claseBotonPrimario}>Ir al inicio</button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <PanelSaldos cuentas={cuentas} />
              <PanelHistorialReciente key={`${cuentaNum}-${resultado?.referencia ?? ""}`} numeroCuenta={cuentaNum} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
