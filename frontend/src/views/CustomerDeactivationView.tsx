import { useCallback, useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router"
import Sidebar from "../shared/Sidebar"
import { ApiError, apiRequest, errorMessage } from "../shared/api"
import { fmtFechaLarga } from "../shared/helpers"
import { getSession, initials } from "../shared/session"
import { ESTADOS_VIGENTES } from "../shared/tarjetas"
import type { ClienteApi, CuentaApi, TarjetaApi } from "../shared/types"
import {
  IcoAlert,
  IcoCheck,
  IcoChevron,
  IcoClock,
  IcoClose,
  IcoDatabase,
  IcoInfo,
  IcoSearch,
  IcoShield,
  IcoUserMinus,
} from "../shared/icons"

type ViewState = "idle" | "loading" | "found" | "not-found"

type Seleccion = {
  cliente: ClienteApi
  cuentas: CuentaApi[]
  tarjetasVigentes: number
}

const PATRON_CRITERIO = /^[A-Za-z0-9-]{6,30}$/

export default function CustomerDeactivationView() {
  const [searchParams, setSearchParams] = useSearchParams()
  const cedulaParam = searchParams.get("cedula")
  const [query, setQuery] = useState(cedulaParam ?? "")
  const [searchError, setSearchError] = useState("")
  const [viewState, setViewState] = useState<ViewState>("idle")
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null)
  const [lastQuery, setLastQuery] = useState("")
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [confirmationAccepted, setConfirmationAccepted] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [blockedMessage, setBlockedMessage] = useState("")
  const [cancelledMessage, setCancelledMessage] = useState("")
  const [successData, setSuccessData] = useState<{
    name: string
    timestamp: string
  } | null>(null)
  const gestor = getSession()?.nombre ?? "Gestor"

  const buscar = useCallback(async (valor: string) => {
    setSearchError("")
    setBlockedMessage("")
    setCancelledMessage("")
    setSuccessData(null)
    setViewState("loading")
    setLastQuery(valor)
    try {
      const cliente = await apiRequest<ClienteApi>(`/api/clientes/buscar/${encodeURIComponent(valor)}`)
      const [cuentas, tarjetas] = await Promise.all([
        apiRequest<CuentaApi[]>(`/api/cuentas/cliente/${cliente.id}`),
        apiRequest<TarjetaApi[]>(`/api/tarjetas?clienteId=${cliente.id}`),
      ])
      setSeleccion({
        cliente,
        cuentas,
        tarjetasVigentes: tarjetas.filter((t) => ESTADOS_VIGENTES.includes(t.estado)).length,
      })
      setViewState("found")
    } catch (caught) {
      setSeleccion(null)
      setViewState("not-found")
      if (!(caught instanceof ApiError && caught.status === 404)) {
        setSearchError(errorMessage(caught, "No fue posible consultar el cliente"))
      }
    }
  }, [])

  useEffect(() => {
    const valor = cedulaParam?.trim().replace(/\s+/g, "") ?? ""
    if (PATRON_CRITERIO.test(valor)) void buscar(valor)
  }, [cedulaParam, buscar])

  function handleSearch(event: React.FormEvent) {
    event.preventDefault()
    const value = query.trim().replace(/\s+/g, "")
    if (!PATRON_CRITERIO.test(value)) {
      setSearchError("Ingrese una cédula o identificador válido")
      return
    }
    if (value === cedulaParam) void buscar(value)
    else setSearchParams({ cedula: value })
  }

  function resetSearch() {
    setQuery("")
    setSearchError("")
    setViewState("idle")
    setSeleccion(null)
    setLastQuery("")
    setBlockedMessage("")
    setCancelledMessage("")
    setSuccessData(null)
    setSearchParams({})
  }

  const cuentasActivas = seleccion?.cuentas.filter((cuenta) => cuenta.activa) ?? []

  function requestDeactivation() {
    if (!seleccion || !seleccion.cliente.activo) return
    setCancelledMessage("")
    setSuccessData(null)

    if (cuentasActivas.length > 0) {
      setBlockedMessage("No es posible desactivar un cliente con cuentas activas")
      return
    }

    setBlockedMessage("")
    setConfirmationAccepted(false)
    setConfirmationOpen(true)
  }

  function cancelDeactivation() {
    if (processing) return
    setConfirmationOpen(false)
    setConfirmationAccepted(false)
    setCancelledMessage(
      "Operación cancelada. El cliente permanece activo y no se realizaron cambios.",
    )
  }

  async function confirmDeactivation() {
    if (!seleccion) return
    setProcessing(true)
    try {
      const actualizado = await apiRequest<ClienteApi>(`/api/clientes/${seleccion.cliente.id}/desactivar`, { method: "PATCH" })
      const timestamp = new Intl.DateTimeFormat("es-CO", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(new Date())
      setSeleccion({ ...seleccion, cliente: actualizado })
      setCancelledMessage("")
      setSuccessData({ name: actualizado.nombreCompleto, timestamp })
    } catch (error) {
      setBlockedMessage(errorMessage(error, "No fue posible desactivar el cliente"))
    } finally {
      setProcessing(false)
      setConfirmationOpen(false)
      setConfirmationAccepted(false)
    }
  }

  const cliente = seleccion?.cliente

  return (
    <div className="flex h-full overflow-hidden bg-bg-base">
      <Sidebar variant="gestor" />

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-bg-base/95 px-8 py-5 backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Clientes</span>
            <IcoChevron />
            <span className="text-text-secondary">Desactivar cliente</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 rounded-lg border border-success/20 bg-success/10 px-3 py-1.5 text-xs text-emerald-400">
              <IcoShield /> Rol: Gestor
            </span>
            
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-8 py-7">
          <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <span className="mb-2 inline-block rounded-md bg-danger/10 px-2 py-1 font-display text-xs font-semibold uppercase tracking-wider text-red-300">
                Gestión de acceso
              </span>
              <h1 className="mb-1 font-display text-2xl font-bold text-text-primary">
                Desactivar cliente
              </h1>
              <p className="max-w-2xl text-sm text-text-muted">
                Retira el acceso del cliente sin eliminar sus datos ni el
                historial de movimientos.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-sidebar px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600/15 text-purple-300">
                <IcoShield />
              </span>
              <div>
                <div className="text-xs font-semibold text-text-secondary">
                  Operación restringida
                </div>
                <div className="mt-0.5 text-xs text-text-muted">
                  Solo disponible para gestores
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSearch}
            noValidate
            className="mb-5 rounded-2xl border border-border bg-sidebar p-5"
          >
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end">
              <div className="w-full flex-1">
                <label
                  htmlFor="deactivation-search"
                  className="mb-2 block font-display text-xs font-semibold uppercase tracking-wide text-purple-200"
                >
                  Identificador o cédula del cliente
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                    <IcoSearch />
                  </span>
                  <input
                    id="deactivation-search"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value)
                      setSearchError("")
                      setBlockedMessage("")
                      setCancelledMessage("")
                    }}
                    aria-invalid={Boolean(searchError)}
                    aria-describedby={
                      searchError
                        ? "deactivation-search-error"
                        : "deactivation-search-help"
                    }
                    placeholder="Ej: 1020304050 o BX-..."
                    autoComplete="off"
                    className={`w-full rounded-xl border bg-purple-400/5 py-3 pl-11 pr-4 text-sm text-text-primary outline-none transition-all focus:ring-4 focus:ring-purple-400/10 ${
                      searchError
                        ? "border-danger"
                        : "border-border focus:border-purple-400/60"
                    }`}
                  />
                </div>
                {searchError ? (
                  <span
                    id="deactivation-search-error"
                    className="mt-2 flex items-center gap-1.5 text-xs text-red-400"
                  >
                    <IcoAlert />
                    {searchError}
                  </span>
                ) : (
                  <span
                    id="deactivation-search-help"
                    className="mt-2 block text-xs text-text-muted"
                  >
                    Busca el cliente para validar su estado y productos activos.
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={viewState === "loading"}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-purple-600 to-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60 sm:w-auto"
              >
                {viewState === "loading" ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Validando...
                  </>
                ) : (
                  <>
                    <IcoSearch />
                    Buscar cliente
                  </>
                )}
              </button>
            </div>
          </form>


          {viewState === "idle" && (
            <div className="rounded-2xl border border-border bg-sidebar px-6 py-12 text-center">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600/15 text-purple-300">
                <IcoUserMinus />
              </span>
              <h2 className="font-display text-base font-semibold text-text-secondary">
                Selecciona el cliente que deseas desactivar
              </h2>
              <p className="mx-auto mt-1 max-w-lg text-sm text-text-muted">
                Antes de permitir la operación, verificaremos que el cliente
                esté activo y no tenga cuentas activas.
              </p>
            </div>
          )}

          {viewState === "not-found" && (
            <div
              role="alert"
              className="rounded-2xl border border-danger/25 bg-sidebar px-6 py-12 text-center"
            >
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-red-400">
                <IcoAlert />
              </span>
              <h2 className="font-display text-lg font-bold text-text-primary">
                {searchError ? "No fue posible completar la consulta" : "Cliente no encontrado"}
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                {searchError ||
                  `No existe un cliente asociado a “${lastQuery}”. Verifica el identificador e intenta nuevamente.`}
              </p>
              <button
                type="button"
                onClick={resetSearch}
                className="mt-5 rounded-xl border border-border bg-purple-400/10 px-5 py-2.5 text-sm font-semibold text-purple-200 hover:bg-purple-400/15"
              >
                Realizar otra búsqueda
              </button>
            </div>
          )}

          {viewState === "found" && seleccion && cliente && (
            <div className="flex flex-col gap-5">
              <section className="overflow-hidden rounded-2xl border border-border bg-sidebar">
                <div className="flex flex-col gap-5 border-b border-border bg-gradient-to-r from-purple-600/15 to-transparent p-6 sm:flex-row sm:items-center">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-accent font-display text-lg font-bold text-white">
                    {initials(cliente.nombreCompleto)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-xl font-bold text-text-primary">
                        {cliente.nombreCompleto}
                      </h2>
                      <span
                        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          cliente.activo
                            ? "border-success/25 bg-success/10 text-emerald-400"
                            : "border-border bg-purple-400/5 text-text-muted"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            cliente.activo
                              ? "bg-success"
                              : "bg-text-muted"
                          }`}
                        />
                        {cliente.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                      <span data-i18n-ignore>CC {cliente.cedula}</span>
                      <span data-i18n-ignore>ID {cliente.idCliente}</span>
                      <span>
                        Vinculado desde {fmtFechaLarga(cliente.fechaRegistro)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={resetSearch}
                    className="rounded-lg border border-border bg-purple-400/10 px-4 py-2 text-xs font-semibold text-purple-200 hover:bg-purple-400/15"
                  >
                    Cambiar cliente
                  </button>
                </div>

                <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      label: "Correo registrado",
                      value: cliente.email ?? "No registrado",
                    },
                    {
                      label: "Cuentas activas",
                      value: `${cuentasActivas.length} de ${seleccion.cuentas.length}`,
                    },
                    {
                      label: "Tarjetas vigentes",
                      value: String(seleccion.tarjetasVigentes),
                    },
                    {
                      label: "Teléfono",
                      value: cliente.telefono ?? "No registrado",
                    },
                  ].map((item) => (
                    <div key={item.label} className="bg-sidebar p-5">
                      <div className="mb-1 text-xs text-text-muted">
                        {item.label}
                      </div>
                      <div className="truncate text-sm font-semibold text-text-secondary">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {blockedMessage && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-4"
                >
                  <span className="mt-0.5 shrink-0 text-red-400">
                    <IcoAlert />
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-red-300">
                      {blockedMessage}
                    </div>
                    {cuentasActivas.length > 0 && (
                      <div className="mt-2 flex flex-col gap-1">
                        <p className="text-xs leading-relaxed text-red-200/70">
                          Inactiva primero las cuentas asociadas:
                        </p>
                        {cuentasActivas.map((cuenta) => (
                          <Link
                            key={cuenta.numeroCuenta}
                            to={`/gestor/cuentas/desactivar?numero=${encodeURIComponent(cuenta.numeroCuenta)}`}
                            className="text-xs font-semibold text-red-200 hover:underline"
                            data-i18n-ignore
                          >
                            {cuenta.numeroCuenta} →
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setBlockedMessage("")}
                    aria-label="Cerrar mensaje"
                    className="text-red-300/70 hover:text-red-200"
                  >
                    <IcoClose />
                  </button>
                </div>
              )}

              {cancelledMessage && (
                <div
                  role="status"
                  className="flex items-start gap-3 rounded-xl border border-warn/25 bg-warn/10 px-4 py-4"
                >
                  <span className="mt-0.5 shrink-0 text-amber-400">
                    <IcoInfo />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-amber-300">
                      Desactivación cancelada
                    </div>
                    <p className="mt-1 text-xs text-amber-100/65">
                      {cancelledMessage}
                    </p>
                  </div>
                </div>
              )}

              {successData && (
                <div
                  role="status"
                  className="overflow-hidden rounded-2xl border border-success/30 bg-success/5"
                >
                  <div className="flex items-start gap-4 p-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-success/30 bg-success/15 text-emerald-400">
                      <IcoCheck />
                    </span>
                    <div className="flex-1">
                      <h3 className="font-display text-base font-bold text-emerald-300">
                        Cliente desactivado exitosamente
                      </h3>
                      <p className="mt-1 text-sm text-text-muted">
                        {successData.name} ya no puede iniciar sesión. Sus datos
                        y movimientos permanecen disponibles para trazabilidad.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-px border-t border-success/15 bg-success/15 sm:grid-cols-3">
                    <div className="bg-sidebar px-5 py-3">
                      <div className="text-xs text-text-muted">
                        Fecha y hora
                      </div>
                      <div className="mt-1 text-xs font-semibold text-text-secondary">
                        {successData.timestamp}
                      </div>
                    </div>
                    <div className="bg-sidebar px-5 py-3">
                      <div className="text-xs text-text-muted">
                        Gestor responsable
                      </div>
                      <div className="mt-1 text-xs font-semibold text-text-secondary">
                        {gestor}
                      </div>
                    </div>
                    <div className="bg-sidebar px-5 py-3">
                      <div className="text-xs text-text-muted">
                        Sesiones del cliente
                      </div>
                      <div className="mt-1 text-xs font-semibold text-purple-300">
                        Cerradas automáticamente
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!successData && (
                <section className="rounded-2xl border border-border bg-sidebar p-6">
                  <div className="mb-5 flex items-center gap-2.5">
                    <span className="text-purple-300">
                      <IcoShield />
                    </span>
                    <h3 className="font-display text-sm font-semibold text-purple-200">
                      Validación previa
                    </h3>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="flex items-start gap-3 rounded-xl border border-border bg-purple-400/5 p-4">
                      <span
                        className={`mt-0.5 ${
                          cliente.activo
                            ? "text-emerald-400"
                            : "text-text-muted"
                        }`}
                      >
                        <IcoCheck />
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-text-secondary">
                          Estado del cliente
                        </div>
                        <div className="mt-1 text-xs text-text-muted">
                          {cliente.activo
                            ? "Cliente activo verificado"
                            : "El cliente ya está inactivo"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl border border-border bg-purple-400/5 p-4">
                      <span
                        className={`mt-0.5 ${
                          cuentasActivas.length === 0
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }`}
                      >
                        {cuentasActivas.length === 0 ? (
                          <IcoCheck />
                        ) : (
                          <IcoAlert />
                        )}
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-text-secondary">
                          Productos asociados
                        </div>
                        <div className="mt-1 text-xs text-text-muted">
                          {cuentasActivas.length === 0
                            ? "Sin cuentas activas"
                            : `${cuentasActivas.length} ${cuentasActivas.length === 1 ? "cuenta requiere" : "cuentas requieren"} gestión`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl border border-border bg-purple-400/5 p-4">
                      <span className="mt-0.5 text-emerald-400">
                        <IcoDatabase />
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-text-secondary">
                          Trazabilidad
                        </div>
                        <div className="mt-1 text-xs text-text-muted">
                          Datos e historial de movimientos se conservan
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2 text-xs text-text-muted">
                      <IcoClock />
                      <span>
                        La acción se registrará con fecha, hora y gestor
                        responsable.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={requestDeactivation}
                      disabled={!cliente.activo}
                      className="flex items-center justify-center gap-2 rounded-xl border border-danger/40 bg-danger/15 px-5 py-2.5 text-sm font-semibold text-red-300 transition-all hover:bg-danger/25 disabled:cursor-not-allowed disabled:border-border disabled:bg-purple-400/5 disabled:text-text-muted"
                    >
                      <IcoUserMinus />
                      {!cliente.activo
                        ? "Cliente ya inactivo"
                        : "Desactivar cliente"}
                    </button>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>

      {confirmationOpen && cliente && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deactivation-title"
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-danger/30 bg-surface shadow-2xl shadow-black/40">
            <div className="flex items-start gap-4 border-b border-border p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-danger/25 bg-danger/10 text-red-400">
                <IcoUserMinus />
              </span>
              <div className="flex-1">
                <h2
                  id="deactivation-title"
                  className="font-display text-lg font-bold text-text-primary"
                >
                  Confirmar desactivación
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-text-muted">
                  Esta acción retirará inmediatamente el acceso de{" "}
                  <strong className="font-semibold text-text-secondary">
                    {cliente.nombreCompleto}
                  </strong>
                  .
                </p>
              </div>
              <button
                type="button"
                onClick={cancelDeactivation}
                aria-label="Cerrar confirmación"
                className="text-text-muted hover:text-text-secondary"
              >
                <IcoClose />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-5 rounded-xl border border-border bg-purple-400/5 p-4">
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="text-text-muted">Identificador</span>
                  <span className="font-semibold text-text-secondary" data-i18n-ignore>
                    {cliente.idCliente}
                  </span>
                </div>
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="text-text-muted">Acceso a plataforma</span>
                  <span className="font-semibold text-red-300">
                    Será revocado
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">Datos y movimientos</span>
                  <span className="font-semibold text-emerald-400">
                    Se conservarán
                  </span>
                </div>
              </div>
              <label className="mb-5 flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3.5">
                <input
                  type="checkbox"
                  checked={confirmationAccepted}
                  onChange={(event) =>
                    setConfirmationAccepted(event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 accent-purple-600"
                />
                <span className="text-xs leading-relaxed text-text-muted">
                  Confirmo que verifiqué que el cliente no tiene cuentas activas
                  y comprendo que perderá el acceso.
                </span>
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={cancelDeactivation}
                  className="flex-1 rounded-xl border border-border bg-transparent py-2.5 text-sm font-semibold text-text-secondary hover:bg-purple-400/5"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDeactivation}
                  disabled={!confirmationAccepted || processing}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-danger py-2.5 text-sm font-semibold text-white shadow-lg shadow-danger/20 hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-danger/35 disabled:text-white/50 disabled:shadow-none"
                >
                  <IcoUserMinus />
                  {processing ? "Desactivando..." : "Sí, desactivar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
