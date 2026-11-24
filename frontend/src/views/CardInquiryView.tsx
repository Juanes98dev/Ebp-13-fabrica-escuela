import { useState } from "react"
import { useNavigate } from "react-router"
import Sidebar from "../shared/Sidebar"
import { fmtCOP, fmtFecha } from "../shared/helpers"
import { useMisTarjetas } from "../shared/hooks"
import { IcoAlert, IcoChevron, IcoCuentas, IcoInfo, IcoLock, IcoSearch, IcoShield } from "../shared/icons"
import { AlertaError, claseBotonSecundario } from "../shared/operaciones"
import {
  ESTADO_TARJETA,
  EstadoBadge,
  ListaTarjetas,
  TarjetaVisual,
  etiquetaTipoTarjeta,
  ultimos4,
} from "../shared/tarjetas"

export default function CardInquiryView() {
  const navigate = useNavigate()
  const { tarjetas, loading, error } = useMisTarjetas()
  const [seleccionadaId, setSeleccionadaId] = useState<number | null>(null)
  const [query, setQuery] = useState("")
  const [searchError, setSearchError] = useState("")
  const [noEncontrada, setNoEncontrada] = useState("")

  const seleccionada = tarjetas.find((tarjeta) => tarjeta.id === seleccionadaId) ?? tarjetas[0]

  function buscar(event: React.FormEvent) {
    event.preventDefault()
    const valor = query.trim()
    if (!/^\d{4}$/.test(valor)) {
      setSearchError("Ingresa los últimos 4 dígitos de la tarjeta")
      return
    }
    setSearchError("")
    const encontrada = tarjetas.find((tarjeta) => ultimos4(tarjeta.numeroEnmascarado) === valor)
    if (encontrada) {
      setSeleccionadaId(encontrada.id)
      setNoEncontrada("")
    } else {
      setNoEncontrada(valor)
    }
  }

  const cupoTotal = Number(seleccionada?.cupoTotal ?? 0)
  const cupoDisponible = Number(seleccionada?.cupoDisponible ?? 0)
  const usado = Math.max(0, cupoTotal - cupoDisponible)
  const porcentaje = cupoTotal > 0 ? (usado / cupoTotal) * 100 : 0

  return (
    <div className="flex h-full overflow-hidden bg-bg-base">
      <Sidebar variant="cliente" />

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-bg-base/95 px-8 py-5 backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Tarjetas</span><IcoChevron /><span className="text-text-secondary">Consultar tarjetas</span>
          </div>
          <span className="hidden items-center gap-1.5 rounded-lg border border-success/20 bg-success/10 px-3 py-1.5 text-xs text-emerald-400 sm:flex"><IcoShield /> Sesión segura</span>
        </header>

        <div className="mx-auto max-w-6xl px-8 py-7">
          <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <span className="mb-2 inline-block rounded-md bg-accent/15 px-2 py-1 font-display text-xs font-semibold uppercase tracking-wider text-purple-300">Mis productos</span>
              <h1 className="mb-1 font-display text-2xl font-bold text-text-primary">Consulta tus tarjetas</h1>
              <p className="max-w-2xl text-sm text-text-muted">Verifica los datos, el estado y la información financiera de tus tarjetas Banco X.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => navigate("/tarjetas/debito")} className={claseBotonSecundario}>Solicitar débito</button>
              <button type="button" onClick={() => navigate("/tarjetas/credito")} className={claseBotonSecundario}>Solicitar crédito</button>
            </div>
          </div>

          {loading && tarjetas.length === 0 && <p className="text-sm text-text-muted">Cargando tus tarjetas...</p>}
          {error && <AlertaError mensaje={error} />}

          {!loading && !error && tarjetas.length === 0 && (
            <div className="rounded-2xl border border-border bg-sidebar px-6 py-12 text-center">
              <h2 className="font-display text-lg font-bold text-text-primary">Aún no tienes tarjetas</h2>
              <p className="mt-1 text-sm text-text-muted">Solicita tu primera tarjeta débito o de crédito con los botones de arriba.</p>
            </div>
          )}

          {tarjetas.length > 0 && seleccionada && (
            <>
              <form onSubmit={buscar} noValidate className="mb-6 rounded-2xl border border-border bg-sidebar p-5">
                <label htmlFor="card-inquiry-search" className="mb-2 block font-display text-xs font-semibold uppercase tracking-wide text-purple-200">Buscar una de mis tarjetas</label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"><IcoSearch /></span>
                    <input
                      id="card-inquiry-search"
                      value={query}
                      inputMode="numeric"
                      maxLength={4}
                      onChange={(event) => { setQuery(event.target.value.replace(/\D/g, "")); setSearchError(""); setNoEncontrada("") }}
                      aria-invalid={Boolean(searchError)}
                      placeholder="Últimos 4 dígitos"
                      className={`w-full rounded-xl border bg-purple-400/5 py-3 pl-11 pr-4 text-sm text-text-primary outline-none focus:ring-4 focus:ring-purple-400/10 ${searchError ? "border-danger" : "border-border focus:border-purple-400/60"}`}
                    />
                  </div>
                  <button type="submit" className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-purple-600 to-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/25">
                    <IcoSearch />Consultar
                  </button>
                </div>
                {searchError && <span className="mt-2 flex items-center gap-1.5 text-xs text-red-400"><IcoAlert />{searchError}</span>}
                {noEncontrada && <span className="mt-2 flex items-center gap-1.5 text-xs text-red-400"><IcoAlert />No tienes una tarjeta terminada en “{noEncontrada}”.</span>}
              </form>

              <section className="mb-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-sm font-semibold text-purple-200">Tarjetas asociadas a tu perfil</h2>
                  <span className="text-xs text-text-muted">{tarjetas.length} producto(s)</span>
                </div>
                <ListaTarjetas tarjetas={tarjetas} seleccionada={seleccionada.id} onSelect={(id) => { setSeleccionadaId(id); setNoEncontrada("") }} />
              </section>

              <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <section className="rounded-2xl border border-border bg-sidebar p-6">
                  <TarjetaVisual tipo={seleccionada.tipo} titular={seleccionada.titular} numero={seleccionada.numeroEnmascarado} estado={seleccionada.estado} />
                  <div className="mt-5 flex items-center justify-center gap-2 text-xs text-text-muted"><IcoLock />Número protegido mediante enmascaramiento</div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-border bg-sidebar">
                  <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-purple-600/10 to-transparent px-6 py-5">
                    <h2 className="font-display text-lg font-bold text-text-primary">{etiquetaTipoTarjeta(seleccionada.tipo)}</h2>
                    <EstadoBadge estado={seleccionada.estado} />
                  </div>

                  <div className="grid gap-px bg-border sm:grid-cols-2">
                    <Celda label="Número de tarjeta" value={seleccionada.numeroEnmascarado} />
                    <Celda label="Estado actual" value={ESTADO_TARJETA[seleccionada.estado].label} />
                    <Celda label="Fecha de solicitud" value={fmtFecha(seleccionada.fechaSolicitud)} />
                    <Celda label={seleccionada.tipo === "DEBITO" ? "Cuenta asociada" : "Fecha de resolución"} value={seleccionada.tipo === "DEBITO" ? seleccionada.cuentaAsociada ?? "—" : fmtFecha(seleccionada.fechaResolucion)} />
                  </div>

                  {seleccionada.estado === "rechazada" && seleccionada.motivoRechazo && (
                    <div className="border-t border-border p-5">
                      <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-xs text-text-muted">
                        <div className="mb-1 font-semibold text-red-300">Motivo del rechazo</div>{seleccionada.motivoRechazo}
                      </div>
                    </div>
                  )}

                  {seleccionada.estado === "bloqueada" && (
                    <div className="border-t border-border p-5 text-xs text-text-muted">
                      {seleccionada.bloqueadaPor === "gestor"
                        ? "Esta tarjeta fue bloqueada por el banco. Comunícate con un gestor para reactivarla."
                        : <>Bloqueaste esta tarjeta. <button type="button" onClick={() => navigate("/tarjetas/desbloqueo")} className="font-semibold text-purple-300 hover:text-purple-200">Desbloquearla</button></>}
                    </div>
                  )}

                  {seleccionada.tipo === "DEBITO" && seleccionada.cuentaAsociada && (
                    <div className="border-t border-border p-5">
                      <div className="flex items-start gap-3 rounded-xl border border-border bg-purple-400/5 p-4">
                        <span className="mt-0.5 text-purple-300"><IcoCuentas /></span>
                        <p className="text-xs text-text-muted">Las compras se descuentan directamente de la cuenta terminada en {seleccionada.cuentaAsociada.slice(-4)}.</p>
                      </div>
                    </div>
                  )}

                  {seleccionada.tipo === "CREDITO" && cupoTotal > 0 && (
                    <div className="border-t border-border p-5">
                      <div className="mb-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-border bg-purple-400/5 p-4">
                          <div className="text-xs text-text-muted">Cupo total</div>
                          <div className="mt-1 font-display text-lg font-bold text-text-primary">{fmtCOP(cupoTotal)}</div>
                        </div>
                        <div className="rounded-xl border border-border bg-purple-400/5 p-4">
                          <div className="text-xs text-text-muted">Cupo disponible</div>
                          <div className="mt-1 font-display text-lg font-bold text-emerald-400">{fmtCOP(cupoDisponible)}</div>
                        </div>
                      </div>
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-text-muted">Cupo utilizado</span>
                        <span className="font-semibold text-text-secondary">{porcentaje.toFixed(1)}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-purple-400/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-accent" style={{ width: `${porcentaje}%` }} />
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </>
          )}

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-purple-400/5 px-4 py-3.5">
            <span className="mt-0.5 shrink-0 text-purple-300"><IcoInfo /></span>
            <p className="text-xs leading-relaxed text-text-muted">Por tu seguridad, solo mostramos tarjetas vinculadas a tu perfil y nunca revelamos el número completo.</p>
          </div>
        </div>
      </main>
    </div>
  )
}

function Celda({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-sidebar p-5">
      <div className="mb-1.5 text-xs text-text-muted">{label}</div>
      <div className="text-sm font-semibold text-text-secondary" data-i18n-ignore>{value}</div>
    </div>
  )
}
