import { useState } from "react"
import { useNavigate } from "react-router"
import Sidebar from "./Sidebar"
import { apiRequest, errorMessage } from "./api"
import { etiquetaTipoCuenta, fmtCOP, fmtFecha } from "./helpers"
import { useMisCuentas, useMisTarjetas } from "./hooks"
import { IcoAlert, IcoCard, IcoCheck, IcoChevron, IcoClock, IcoCuentas, IcoInfo, IcoShield } from "./icons"
import { AlertaError, FilasResumen, type PasoOperacion, Stepper, claseBotonPrimario, claseBotonSecundario } from "./operaciones"
import { getSession } from "./session"
import type { EstadoTarjeta, TarjetaApi } from "./types"

export const ESTADOS_VIGENTES: EstadoTarjeta[] = ["pendiente", "activa", "bloqueada"]

export const ESTADO_TARJETA: Record<EstadoTarjeta, { label: string; clase: string }> = {
  pendiente: { label: "Pendiente de aprobación", clase: "bg-warn/10 text-amber-400 border-warn/25" },
  activa: { label: "Activa", clase: "bg-success/10 text-emerald-400 border-success/25" },
  bloqueada: { label: "Bloqueada", clase: "bg-danger/10 text-red-400 border-danger/25" },
  rechazada: { label: "Rechazada", clase: "bg-purple-400/10 text-text-muted border-border" },
  eliminada: { label: "Eliminada", clase: "bg-purple-400/10 text-text-muted border-border" },
}

export function etiquetaTipoTarjeta(tipo: TarjetaApi["tipo"]): string {
  return tipo === "CREDITO" ? "Tarjeta de crédito" : "Tarjeta débito"
}

export function ultimos4(numeroEnmascarado: string): string {
  return numeroEnmascarado.replace(/\D/g, "").slice(-4)
}

export function EstadoBadge({ estado }: { estado: EstadoTarjeta }) {
  const info = ESTADO_TARJETA[estado]
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${info.clase}`}>{info.label}</span>
}

export function TarjetaVisual({ tipo, titular, numero, estado }: { tipo: TarjetaApi["tipo"]; titular: string; numero?: string; estado?: EstadoTarjeta }) {
  const bloqueada = estado === "bloqueada"
  return (
    <div className={`rounded-2xl p-5 shadow-xl shadow-purple-600/20 ${bloqueada ? "bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-600" : "bg-gradient-to-br from-purple-900 via-purple-600 to-accent"}`}>
      <div className="flex items-center justify-between text-white">
        <span className="text-sm font-bold font-display">BANCO X</span>
        <IcoCard />
      </div>
      <div className="mt-10 text-base font-semibold tracking-widest text-white" data-i18n-ignore>
        {numero ? `•••• •••• •••• ${ultimos4(numero)}` : "•••• •••• •••• ••••"}
      </div>
      <div className="flex items-end justify-between mt-6">
        <div>
          <div className="text-[10px] uppercase text-white/50">Titular</div>
          <div className="text-xs font-semibold text-white mt-1 uppercase" data-i18n-ignore>{titular}</div>
        </div>
        <div className="text-right">
          {estado && <div className="text-[10px] uppercase text-white/60">{ESTADO_TARJETA[estado].label}</div>}
          <div className="text-xs font-bold text-white">{tipo === "CREDITO" ? "CRÉDITO" : "DÉBITO"}</div>
        </div>
      </div>
    </div>
  )
}

export function SolicitudTarjeta({ tipo }: { tipo: TarjetaApi["tipo"] }) {
  const navigate = useNavigate()
  const titular = getSession()?.nombre ?? ""
  const { cuentas, loading: cargandoCuentas, error: errorCuentas } = useMisCuentas()
  const { tarjetas, loading: cargandoTarjetas, error: errorTarjetas } = useMisTarjetas()
  const [step, setStep] = useState<PasoOperacion>("form")
  const [cuentaNum, setCuentaNum] = useState("")
  const [error, setError] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<TarjetaApi | null>(null)

  const esCredito = tipo === "CREDITO"
  const activas = cuentas.filter((cuenta) => cuenta.activa)
  const vigentes = tarjetas.filter((tarjeta) => ESTADOS_VIGENTES.includes(tarjeta.estado))
  const creditoVigente = vigentes.find((tarjeta) => tarjeta.tipo === "CREDITO")
  const debitoDe = (numero: string) => vigentes.find((tarjeta) => tarjeta.tipo === "DEBITO" && tarjeta.cuentaAsociada === numero)
  const cuenta = activas.find((item) => item.numeroCuenta === cuentaNum)
  const cargando = cargandoCuentas || cargandoTarjetas
  const errorCarga = errorCuentas || errorTarjetas

  function continuar() {
    setError("")
    if (esCredito) {
      if (activas.length === 0) return setError("Debes tener al menos una cuenta activa para solicitar una tarjeta de crédito.")
      if (creditoVigente) return setError("Ya tienes una tarjeta de crédito activa o en solicitud.")
    } else {
      if (!cuenta) return setError("Selecciona una cuenta activa para continuar.")
      if (debitoDe(cuenta.numeroCuenta)) return setError("Esta cuenta ya tiene una tarjeta débito activa o en solicitud.")
    }
    setStep("confirm")
  }

  async function confirmar() {
    setEnviando(true)
    setError("")
    try {
      const tarjeta = await apiRequest<TarjetaApi>("/api/tarjetas/solicitudes", {
        method: "POST",
        body: JSON.stringify({ tipo, numeroCuenta: esCredito ? null : cuentaNum }),
      })
      setResultado(tarjeta)
      setStep("success")
    } catch (err) {
      setError(errorMessage(err, "No fue posible registrar la solicitud"))
    } finally {
      setEnviando(false)
    }
  }

  const producto = esCredito ? "Tarjeta de crédito Banco X" : "Tarjeta débito Banco X"
  const beneficios = esCredito
    ? ["Compras nacionales e internacionales", "Avances en cajeros Banco X", "Control total desde la aplicación", "Alertas de compra en tiempo real"]
    : ["Compras físicas y digitales", "Retiros en cajeros Banco X", "Control desde la aplicación", "Sin cuota de emisión"]

  return (
    <div className="flex h-full overflow-hidden bg-bg-base">
      <Sidebar variant="cliente" />

      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-5 flex items-center justify-between sticky top-0 z-10 bg-bg-base/95 border-b border-border backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Mis Tarjetas</span><IcoChevron /><span className="text-text-secondary">{esCredito ? "Solicitar tarjeta de crédito" : "Solicitar tarjeta débito"}</span>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-success/10 text-emerald-400 border border-success/25"><IcoShield />Proceso seguro</span>
        </div>

        <div className="px-8 py-7 max-w-5xl">
          <div className="mb-7">
            <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md mb-2 inline-block bg-accent/15 text-purple-300 font-display">{esCredito ? "Crédito Banco X" : "Nueva tarjeta"}</span>
            <h1 className="text-2xl font-bold mb-1 text-text-primary font-display">{esCredito ? "Solicita tu tarjeta de crédito" : "Solicita tu tarjeta débito"}</h1>
            <p className="text-sm text-text-muted">
              {esCredito
                ? "Obtén un cupo básico para tus compras. Un gestor revisará y aprobará tu solicitud."
                : "Asóciala a una cuenta activa para pagar y retirar usando tu saldo. Un gestor aprobará la solicitud."}
            </p>
          </div>

          <Stepper step={step} labels={[esCredito ? "Validar requisitos" : "Seleccionar cuenta", "Confirmar solicitud", "Solicitud enviada"]} />

          {step === "form" && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_290px] gap-5">
              <div className="flex flex-col gap-4">
                <section className="rounded-2xl overflow-hidden bg-sidebar border border-border">
                  <div className="px-6 py-4 border-b border-border">
                    <h2 className="text-sm font-semibold text-text-primary font-display">{esCredito ? "Requisitos de la solicitud" : "Selecciona la cuenta asociada"}</h2>
                    <p className="text-xs text-text-muted mt-1">
                      {esCredito ? "Necesitas al menos una cuenta activa y no tener otra tarjeta de crédito vigente." : "Solo cuentas activas sin tarjeta débito vigente o en solicitud."}
                    </p>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    {cargando && <p className="text-sm text-text-muted px-2">Cargando tus productos...</p>}
                    {errorCarga && <p className="flex items-center gap-1.5 text-sm text-red-400 px-2"><IcoAlert />{errorCarga}</p>}

                    {!cargando && !errorCarga && esCredito && (
                      <>
                        <Requisito ok={activas.length > 0} titulo="Al menos una cuenta activa" detalle={activas.length > 0 ? `${activas.length} cuenta(s) activa(s) encontradas` : "No se encontraron cuentas activas"} />
                        <Requisito ok={!creditoVigente} titulo="Sin tarjeta de crédito vigente" detalle={creditoVigente ? `Ya tienes una en estado: ${ESTADO_TARJETA[creditoVigente.estado].label.toLowerCase()}` : "No tienes otra tarjeta de crédito"} />
                      </>
                    )}

                    {!cargando && !errorCarga && !esCredito && activas.length === 0 && (
                      <div className="rounded-xl p-4 bg-purple-400/5 border border-border text-sm text-text-muted">
                        No tienes cuentas activas.{" "}
                        <button type="button" onClick={() => navigate("/cuentas/nueva")} className="font-semibold text-purple-300 hover:text-purple-200">Abrir una cuenta</button>
                      </div>
                    )}

                    {!cargando && !esCredito && activas.map((item) => {
                      const selected = item.numeroCuenta === cuentaNum
                      const existente = debitoDe(item.numeroCuenta)
                      return (
                        <button
                          type="button"
                          key={item.numeroCuenta}
                          onClick={() => { setCuentaNum(item.numeroCuenta); setError("") }}
                          className={`relative w-full flex items-center gap-4 p-4 rounded-xl text-left border transition-all ${selected ? "bg-purple-600/15 border-purple-400/50 ring-4 ring-purple-400/5" : "bg-purple-400/5 border-border hover:border-purple-400/30"}`}
                        >
                          <div className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 ${selected ? "bg-purple-600/25 text-purple-200" : "bg-purple-400/10 text-text-muted"}`}><IcoCuentas /></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-text-secondary">{etiquetaTipoCuenta(item.tipo)}</span>
                              {existente
                                ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-purple-400/10 text-purple-300 border-border">Tarjeta {ESTADO_TARJETA[existente.estado].label.toLowerCase()}</span>
                                : <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-success/10 text-emerald-400 border-success/20">Disponible</span>}
                            </div>
                            <div className="text-xs text-text-muted mt-1" data-i18n-ignore>{item.numeroCuenta}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-text-primary">{fmtCOP(Number(item.saldo))}</div>
                            <div className="text-xs text-text-muted mt-1">Saldo disponible</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </section>

                <AlertaError mensaje={error} />

                <div className="flex justify-end pb-6">
                  <button type="button" onClick={continuar} disabled={cargando} className={claseBotonPrimario}>Continuar <IcoChevron /></button>
                </div>
              </div>

              <aside className="flex flex-col gap-4">
                <TarjetaVisual tipo={tipo} titular={titular} />
                <div className="rounded-2xl p-5 bg-sidebar border border-border">
                  <h2 className="text-sm font-semibold text-text-primary font-display">{producto}</h2>
                  <ul className="flex flex-col gap-3 mt-4">
                    {beneficios.map((beneficio) => (
                      <li key={beneficio} className="flex items-start gap-2 text-xs text-text-muted">
                        <span className="text-emerald-400 mt-0.5 [&>svg]:w-3.5 [&>svg]:h-3.5"><IcoCheck /></span>{beneficio}
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            </div>
          )}

          {step === "confirm" && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
              <div className="flex flex-col gap-5">
                <section className="rounded-2xl overflow-hidden bg-sidebar border border-border">
                  <div className="px-6 py-5 bg-gradient-to-br from-purple-600/20 to-accent/5 border-b border-border">
                    <span className="text-xs font-semibold uppercase tracking-wider text-purple-300 font-display">Resumen de solicitud</span>
                    <h2 className="text-lg font-bold text-text-primary font-display mt-1">Confirma los datos de tu tarjeta</h2>
                  </div>
                  <div className="px-6 py-4">
                    <FilasResumen
                      filas={[
                        { label: "Titular", value: titular },
                        { label: "Producto", value: producto },
                        ...(esCredito
                          ? [{ label: "Cupo inicial", value: fmtCOP(3_000_000), tono: "destacado" as const }]
                          : [
                              { label: "Cuenta asociada", value: cuentaNum },
                              { label: "Tipo de cuenta", value: cuenta ? etiquetaTipoCuenta(cuenta.tipo) : "—" },
                            ]),
                        { label: "Estado inicial", value: "Pendiente de aprobación", tono: "tenue" },
                      ]}
                    />
                  </div>
                </section>

                <div className="flex items-start gap-3 rounded-xl px-4 py-3.5 bg-purple-400/5 border border-border">
                  <span className="text-purple-300 mt-0.5"><IcoInfo /></span>
                  <p className="text-xs text-text-muted leading-relaxed">Tu solicitud quedará pendiente hasta que un gestor la apruebe. Podrás ver su estado en “Mis Tarjetas”.</p>
                </div>

                <AlertaError mensaje={error} />

                <div className="flex items-center justify-between pb-6">
                  <button type="button" onClick={() => setStep("form")} disabled={enviando} className={claseBotonSecundario}>Volver</button>
                  <button type="button" onClick={() => void confirmar()} disabled={enviando} className={claseBotonPrimario}>
                    {enviando ? "Enviando solicitud..." : <><IcoCard />Confirmar solicitud</>}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl h-fit p-5 bg-sidebar border border-border">
                <div className="text-xs font-semibold uppercase tracking-wider text-text-muted font-display mb-4">Vista previa</div>
                <TarjetaVisual tipo={tipo} titular={titular} />
              </div>
            </div>
          )}

          {step === "success" && resultado && (
            <div className="flex flex-col items-center text-center pb-10">
              <div className="flex items-center justify-center w-20 h-20 rounded-full mb-5 bg-warn/10 border-2 border-warn/30 text-amber-400"><IcoClock /></div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-display">Solicitud registrada</span>
              <h2 className="text-2xl font-bold text-text-primary font-display mt-2">Tu solicitud está en revisión</h2>
              <p className="text-sm text-text-muted mt-2 max-w-md">Un gestor revisará tu solicitud. Cuando sea aprobada la tarjeta quedará activa{resultado.cuentaAsociada ? ` y asociada a la cuenta terminada en ${resultado.cuentaAsociada.slice(-4)}` : ""}.</p>

              <div className="w-full max-w-md mt-7 text-left">
                <TarjetaVisual tipo={resultado.tipo} titular={resultado.titular || titular} numero={resultado.numeroEnmascarado} estado={resultado.estado} />
              </div>

              <div className="w-full max-w-md rounded-xl px-4 py-2 mt-5 bg-sidebar border border-border text-left">
                <FilasResumen
                  filas={[
                    { label: "Producto", value: etiquetaTipoTarjeta(resultado.tipo) },
                    { label: "Fecha de solicitud", value: fmtFecha(resultado.fechaSolicitud) },
                    ...(resultado.cupoTotal ? [{ label: "Cupo solicitado", value: fmtCOP(Number(resultado.cupoTotal)) }] : []),
                    { label: "Estado", value: ESTADO_TARJETA[resultado.estado].label, tono: "tenue" },
                  ]}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => navigate("/inicio")} className={claseBotonSecundario}>Ir al inicio</button>
                <button type="button" onClick={() => navigate("/tarjetas/consulta")} className={claseBotonPrimario}>Ir a Mis Tarjetas</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export function detalleProducto(tarjeta: TarjetaApi): string {
  if (tarjeta.tipo === "CREDITO") {
    return tarjeta.cupoDisponible != null ? `Cupo disponible ${fmtCOP(Number(tarjeta.cupoDisponible))}` : "Tarjeta de crédito"
  }
  return tarjeta.cuentaAsociada ? `Cuenta ${tarjeta.cuentaAsociada}` : "Sin cuenta asociada"
}

export function ListaTarjetas({
  tarjetas,
  seleccionada,
  onSelect,
  motivoNoDisponible,
}: {
  tarjetas: TarjetaApi[]
  seleccionada: number | null
  onSelect: (id: number) => void
  motivoNoDisponible?: (tarjeta: TarjetaApi) => string | null
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {tarjetas.map((tarjeta) => {
        const sel = tarjeta.id === seleccionada
        const motivo = motivoNoDisponible?.(tarjeta) ?? null
        return (
          <button
            key={tarjeta.id}
            type="button"
            onClick={() => onSelect(tarjeta.id)}
            aria-pressed={sel}
            className={`rounded-xl border p-3 text-left transition-all ${sel ? "border-purple-400/60 bg-purple-600/15" : "border-border bg-sidebar hover:border-border-hover"} ${motivo ? "opacity-70" : ""}`}
          >
            <div className="flex items-center gap-3">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${tarjeta.estado === "bloqueada" ? "bg-zinc-600" : "bg-gradient-to-br from-purple-600 to-accent"}`}><IcoCard /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-text-secondary">{etiquetaTipoTarjeta(tarjeta.tipo)}</span>
                <span className="mt-1 block text-xs text-text-muted" data-i18n-ignore>•••• {ultimos4(tarjeta.numeroEnmascarado)}</span>
              </span>
              <EstadoBadge estado={tarjeta.estado} />
            </div>
            {motivo && <div className="mt-2 text-[11px] text-text-muted">{motivo}</div>}
          </button>
        )
      })}
    </div>
  )
}

type AccionTarjeta = "bloquear" | "desbloquear" | "eliminar"

const CONFIG_ACCION: Record<AccionTarjeta, {
  migaPan: string
  etiqueta: string
  titulo: string
  descripcion: string
  boton: string
  procesando: string
  confirmacion: (tarjeta: TarjetaApi) => string
  aviso: string
  exito: string
  peligro: boolean
  disponible: (tarjeta: TarjetaApi) => string | null
}> = {
  bloquear: {
    migaPan: "Bloqueo de tarjeta",
    etiqueta: "Seguridad de tarjetas",
    titulo: "Bloquear una tarjeta",
    descripcion: "Protege tu dinero bloqueando de inmediato una tarjeta perdida, robada o con actividad sospechosa.",
    boton: "Bloquear tarjeta",
    procesando: "Bloqueando...",
    confirmacion: (t) => `La ${etiquetaTipoTarjeta(t.tipo).toLowerCase()} •••• ${ultimos4(t.numeroEnmascarado)} dejará de procesar compras, retiros y pagos.`,
    aviso: "Podrás desbloquearla después desde la opción “Desbloquear tarjeta”.",
    exito: "Tarjeta bloqueada exitosamente",
    peligro: true,
    disponible: (t) => (t.estado === "activa" ? null : t.estado === "bloqueada" ? "Ya está bloqueada" : "Solo se pueden bloquear tarjetas activas"),
  },
  desbloquear: {
    migaPan: "Desbloqueo de tarjeta",
    etiqueta: "Seguridad de tarjetas",
    titulo: "Desbloquear una tarjeta",
    descripcion: "Reactiva una tarjeta que bloqueaste para volver a usarla en compras, retiros y pagos.",
    boton: "Desbloquear tarjeta",
    procesando: "Desbloqueando...",
    confirmacion: (t) => `La ${etiquetaTipoTarjeta(t.tipo).toLowerCase()} •••• ${ultimos4(t.numeroEnmascarado)} volverá a procesar transacciones de inmediato.`,
    aviso: "Desbloquéala solo si la tienes en tu poder y no reconoces movimientos sospechosos.",
    exito: "Tarjeta desbloqueada correctamente",
    peligro: false,
    disponible: (t) =>
      t.estado !== "bloqueada"
        ? t.estado === "activa" ? "Ya está activa" : "Solo se pueden desbloquear tarjetas bloqueadas"
        : t.bloqueadaPor === "gestor" ? "Bloqueada por el banco: comunícate con un gestor" : null,
  },
  eliminar: {
    migaPan: "Eliminar tarjeta",
    etiqueta: "Gestión de tarjetas",
    titulo: "Eliminar una tarjeta",
    descripcion: "Cancela definitivamente una tarjeta que ya no usas. Esta acción no se puede deshacer.",
    boton: "Eliminar tarjeta",
    procesando: "Eliminando...",
    confirmacion: (t) => `La ${etiquetaTipoTarjeta(t.tipo).toLowerCase()} •••• ${ultimos4(t.numeroEnmascarado)} se cancelará de forma permanente.`,
    aviso: "Esta acción es irreversible. Si la necesitas de nuevo tendrás que solicitar una tarjeta nueva.",
    exito: "Tarjeta eliminada exitosamente",
    peligro: true,
    disponible: (t) => {
      if (t.estado !== "activa" && t.estado !== "bloqueada") return "Solo se pueden eliminar tarjetas activas o bloqueadas"
      if (t.tipo === "CREDITO" && t.cupoTotal != null && t.cupoDisponible != null && Number(t.cupoDisponible) < Number(t.cupoTotal)) {
        return "Tiene saldo pendiente por pagar"
      }
      return null
    },
  },
}

export function AccionTarjetaView({ accion }: { accion: AccionTarjeta }) {
  const navigate = useNavigate()
  const config = CONFIG_ACCION[accion]
  const { tarjetas, loading, error: errorCarga, reload } = useMisTarjetas()
  const [seleccionadaId, setSeleccionadaId] = useState<number | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [aceptaIrreversible, setAceptaIrreversible] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState("")
  const [exito, setExito] = useState<{ tarjeta: TarjetaApi; mensaje: string; fecha: string } | null>(null)

  const visibles = tarjetas.filter((tarjeta) => tarjeta.estado !== "eliminada")
  const seleccionada = visibles.find((tarjeta) => tarjeta.id === seleccionadaId)
    ?? visibles.find((tarjeta) => !config.disponible(tarjeta))
    ?? visibles[0]
  const motivo = seleccionada ? config.disponible(seleccionada) : null

  function elegir(id: number) {
    setSeleccionadaId(id)
    setError("")
    setExito(null)
  }

  function abrirConfirmacion() {
    setError("")
    setExito(null)
    setAceptaIrreversible(false)
    setConfirmando(true)
  }

  async function ejecutar() {
    if (!seleccionada) return
    setProcesando(true)
    setError("")
    try {
      const respuesta = await apiRequest<{ mensaje: string }>(`/api/tarjetas/${seleccionada.id}/${accion}`, { method: "POST" })
      setExito({ tarjeta: seleccionada, mensaje: respuesta.mensaje || config.exito, fecha: new Date().toISOString() })
      setConfirmando(false)
      await reload()
    } catch (err) {
      setError(errorMessage(err, `No fue posible ${accion} la tarjeta`))
      setConfirmando(false)
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="flex h-full overflow-hidden bg-bg-base">
      <Sidebar variant="cliente" />

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-bg-base/95 px-8 py-5 backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Tarjetas</span><IcoChevron /><span className="text-text-secondary">{config.migaPan}</span>
          </div>
          <span className="hidden items-center gap-1.5 rounded-lg border border-success/20 bg-success/10 px-3 py-1.5 text-xs text-emerald-400 sm:flex"><IcoShield /> Sesión segura</span>
        </header>

        <div className="mx-auto max-w-6xl px-8 py-7">
          <div className="mb-7">
            <span className={`mb-2 inline-block rounded-md px-2 py-1 font-display text-xs font-semibold uppercase tracking-wider ${config.peligro ? "bg-danger/10 text-red-300" : "bg-accent/15 text-purple-300"}`}>{config.etiqueta}</span>
            <h1 className="mb-1 font-display text-2xl font-bold text-text-primary">{config.titulo}</h1>
            <p className="max-w-2xl text-sm text-text-muted">{config.descripcion}</p>
          </div>

          {loading && visibles.length === 0 && <p className="text-sm text-text-muted">Cargando tus tarjetas...</p>}
          {errorCarga && <AlertaError mensaje={errorCarga} />}
          {!loading && !errorCarga && visibles.length === 0 && (
            <div className="rounded-2xl border border-border bg-sidebar px-6 py-12 text-center">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-600/15 text-purple-300"><IcoCard /></span>
              <h2 className="font-display text-lg font-bold text-text-primary">No tienes tarjetas</h2>
              <p className="mt-1 text-sm text-text-muted">Solicita una tarjeta débito o de crédito para gestionarla aquí.</p>
              <div className="mt-5 flex justify-center gap-3">
                <button type="button" onClick={() => navigate("/tarjetas/debito")} className={claseBotonSecundario}>Solicitar débito</button>
                <button type="button" onClick={() => navigate("/tarjetas/credito")} className={claseBotonSecundario}>Solicitar crédito</button>
              </div>
            </div>
          )}

          {visibles.length > 0 && seleccionada && (
            <>
              <section className="mb-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-sm font-semibold text-purple-200">Selecciona una tarjeta</h2>
                  <span className="text-xs text-text-muted">{visibles.length} tarjeta(s)</span>
                </div>
                <ListaTarjetas tarjetas={visibles} seleccionada={seleccionada.id} onSelect={elegir} motivoNoDisponible={config.disponible} />
              </section>

              <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                <section className="rounded-2xl border border-border bg-sidebar">
                  <div className="flex items-center justify-between gap-4 border-b border-border bg-gradient-to-r from-purple-600/10 to-transparent p-5">
                    <div>
                      <h2 className="font-display text-sm font-semibold text-text-primary">{etiquetaTipoTarjeta(seleccionada.tipo)} <span data-i18n-ignore>•••• {ultimos4(seleccionada.numeroEnmascarado)}</span></h2>
                      <p className="mt-1 text-xs text-text-muted">{detalleProducto(seleccionada)}</p>
                    </div>
                    <EstadoBadge estado={seleccionada.estado} />
                  </div>
                  <div className="p-5">
                    {motivo ? (
                      <div className="flex items-start gap-3 rounded-xl border border-border bg-purple-400/5 p-4">
                        <span className="mt-0.5 text-text-muted"><IcoInfo /></span>
                        <div>
                          <div className="text-sm font-semibold text-text-secondary">Esta acción no está disponible</div>
                          <p className="mt-1 text-xs text-text-muted">{motivo}.</p>
                        </div>
                      </div>
                    ) : (
                      <div className={`flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${config.peligro ? "border-danger/20 bg-danger/5" : "border-success/20 bg-success/5"}`}>
                        <p className="text-xs leading-relaxed text-text-muted">{config.confirmacion(seleccionada)}</p>
                        <button
                          type="button"
                          onClick={abrirConfirmacion}
                          className={`shrink-0 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all ${config.peligro ? "border-danger/40 bg-danger/15 text-red-300 hover:bg-danger/25" : "border-success/40 bg-success/15 text-emerald-300 hover:bg-success/25"}`}
                        >
                          {config.boton}
                        </button>
                      </div>
                    )}
                  </div>
                </section>

                <div className="h-fit">
                  {accion === "eliminar" ? null : <TarjetaVisual tipo={seleccionada.tipo} titular={seleccionada.titular} numero={seleccionada.numeroEnmascarado} estado={seleccionada.estado} />}
                  {accion === "eliminar" && (
                    <div className="rounded-2xl border border-border bg-sidebar p-5 text-xs leading-relaxed text-text-muted">
                      <div className="mb-2 flex items-center gap-2 font-semibold text-text-secondary"><IcoAlert />Antes de eliminar</div>
                      Las tarjetas de crédito con saldo pendiente no pueden eliminarse. Si solo quieres evitar su uso temporalmente, usa la opción de bloqueo.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {error && <div className="mt-5"><AlertaError mensaje={error} /></div>}

          {exito && (
            <section role="status" className="mt-5 overflow-hidden rounded-2xl border border-success/30 bg-success/5">
              <div className="flex items-start gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-success/30 bg-success/15 text-emerald-400"><IcoCheck /></span>
                <div className="flex-1">
                  <h3 className="font-display text-base font-bold text-emerald-300">{exito.mensaje}</h3>
                  <p className="mt-1 text-sm text-text-muted">
                    {etiquetaTipoTarjeta(exito.tarjeta.tipo)} <span data-i18n-ignore>•••• {ultimos4(exito.tarjeta.numeroEnmascarado)}</span> · {fmtFecha(exito.fecha)}
                  </p>
                </div>
                <button type="button" onClick={() => navigate("/tarjetas/consulta")} className={claseBotonSecundario}>Ver mis tarjetas</button>
              </div>
            </section>
          )}
        </div>
      </main>

      {confirmando && seleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="accion-tarjeta-titulo">
          <div className={`w-full max-w-md overflow-hidden rounded-2xl border bg-surface shadow-2xl shadow-black/40 ${config.peligro ? "border-danger/30" : "border-success/30"}`}>
            <div className="border-b border-border p-6">
              <h2 id="accion-tarjeta-titulo" className="font-display text-lg font-bold text-text-primary">Confirmar: {config.boton.toLowerCase()}</h2>
              <p className="mt-1 text-sm leading-relaxed text-text-muted">{config.confirmacion(seleccionada)}</p>
            </div>
            <div className="p-6">
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-warn/20 bg-warn/10 p-4 text-xs leading-relaxed text-amber-100/70">
                <span className="mt-0.5 text-amber-400"><IcoAlert /></span>{config.aviso}
              </div>
              {accion === "eliminar" && (
                <label className="mb-5 flex items-start gap-2 text-xs text-text-secondary">
                  <input type="checkbox" checked={aceptaIrreversible} onChange={(ev) => setAceptaIrreversible(ev.target.checked)} className="mt-0.5" />
                  Entiendo que esta acción es permanente.
                </label>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setConfirmando(false)} disabled={procesando} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-text-secondary hover:bg-purple-400/5 disabled:opacity-50">Cancelar</button>
                <button
                  type="button"
                  onClick={() => void ejecutar()}
                  disabled={procesando || (accion === "eliminar" && !aceptaIrreversible)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${config.peligro ? "bg-danger hover:bg-red-500" : "bg-success hover:bg-emerald-500"}`}
                >
                  {procesando ? config.procesando : config.boton}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Requisito({ ok, titulo, detalle }: { ok: boolean; titulo: string; detalle: string }) {
  return (
    <div className={`flex items-center justify-between rounded-xl px-4 py-3.5 border ${ok ? "bg-purple-400/5 border-border" : "bg-danger/5 border-danger/20"}`}>
      <div>
        <div className="text-sm font-medium text-text-secondary">{titulo}</div>
        <div className="text-xs text-text-muted mt-0.5">{detalle}</div>
      </div>
      {ok ? <span className="text-emerald-400"><IcoCheck /></span> : <span className="text-red-400"><IcoAlert /></span>}
    </div>
  )
}
