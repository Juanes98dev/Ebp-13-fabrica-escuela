import { useState } from "react"
import Sidebar from "../shared/Sidebar"
import { apiRequest } from "../shared/api"
import {
  IcoAlert,
  IcoCheck,
  IcoChevron,
  IcoClientes,
  IcoClock,
  IcoClose,
  IcoConfig,
  IcoCuentas,
  IcoDash,
  IcoDatabase,
  IcoInfo,
  IcoProductos,
  IcoReportes,
  IcoSearch,
  IcoShield,
  IcoTransfer,
  IcoUserMinus,
} from "../shared/icons"

const MANAGER_NAV = [
  { id: "dashboard", label: "Panel Principal", icon: <IcoDash /> },
  { id: "clientes", label: "Clientes", icon: <IcoClientes /> },
  { id: "cuentas", label: "Cuentas", icon: <IcoCuentas /> },
  { id: "transacciones", label: "Transacciones", icon: <IcoTransfer /> },
  { id: "productos", label: "Productos", icon: <IcoProductos /> },
  { id: "reportes", label: "Reportes", icon: <IcoReportes /> },
  { id: "configuracion", label: "Configuración", icon: <IcoConfig /> },
]

type Customer = {
  id: string
  document: string
  name: string
  initials: string
  status: "Activo" | "Inactivo"
  activeAccounts: number
  totalAccounts: number
  movements: number
  lastMovement: string
  email: string
  customerSince: string
}

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "BX-C88-21470369",
    document: "8821470369",
    name: "Diego Alejandro Ríos",
    initials: "DR",
    status: "Activo",
    activeAccounts: 0,
    totalAccounts: 2,
    movements: 148,
    lastMovement: "28 de enero de 2026",
    email: "diego.rios@email.com",
    customerSince: "17 de junio de 2020",
  },
  {
    id: "BX-C10-20304050",
    document: "1020304050",
    name: "Laura Sofía Mendoza",
    initials: "LM",
    status: "Activo",
    activeAccounts: 2,
    totalAccounts: 2,
    movements: 326,
    lastMovement: "9 de febrero de 2026",
    email: "laura.mendoza@email.com",
    customerSince: "12 de febrero de 2021",
  },
  {
    id: "BX-C52-78903416",
    document: "5278903416",
    name: "Ana Lucía Torres",
    initials: "AT",
    status: "Inactivo",
    activeAccounts: 0,
    totalAccounts: 1,
    movements: 76,
    lastMovement: "4 de diciembre de 2025",
    email: "ana.torres@email.com",
    customerSince: "20 de marzo de 2023",
  },
]

type ViewState = "idle" | "loading" | "found" | "not-found"

type ApiCustomer = {
  id: number
  idCliente: string
  cedula: string
  primerNombre: string
  segundoNombre?: string
  primerApellido: string
  segundoApellido?: string
  email?: string
  activo: boolean
}

export default function CustomerDeactivationView() {
  const [activeNav, setActiveNav] = useState("clientes")
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS)
  const [query, setQuery] = useState("")
  const [searchError, setSearchError] = useState("")
  const [viewState, setViewState] = useState<ViewState>("idle")
  const [selectedId, setSelectedId] = useState("")
  const [lastQuery, setLastQuery] = useState("")
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [confirmationAccepted, setConfirmationAccepted] = useState(false)
  const [blockedMessage, setBlockedMessage] = useState("")
  const [cancelledMessage, setCancelledMessage] = useState("")
  const [successData, setSuccessData] = useState<{
    name: string
    timestamp: string
    reference: string
  } | null>(null)

  const selectedCustomer =
    customers.find((customer) => customer.id === selectedId) ?? null

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault()
    const value = query.trim()

    if (!/^[A-Za-z0-9-]{6,20}$/.test(value)) {
      setSearchError("Ingrese una cédula o identificador válido")
      setViewState("idle")
      return
    }

    setSearchError("")
    setBlockedMessage("")
    setCancelledMessage("")
    setSuccessData(null)
    setViewState("loading")
    setLastQuery(value)

    try {
      const customer = await apiRequest<ApiCustomer>(`/api/clientes/buscar/${encodeURIComponent(value)}`)
      const name = [customer.primerNombre, customer.segundoNombre, customer.primerApellido, customer.segundoApellido].filter(Boolean).join(" ")
      const mapped: Customer = {
        id: String(customer.id),
        document: customer.cedula,
        name,
        initials: name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpper(),
        status: customer.activo ? "Activo" : "Inactivo",
        activeAccounts: 0,
        totalAccounts: 0,
        movements: 0,
        lastMovement: "No disponible",
        email: customer.email ?? "",
        customerSince: "No disponible",
      }
      setCustomers((current) => [
        mapped,
        ...current.filter((item) => item.id !== mapped.id),
      ])
      setSelectedId(mapped.id)
      setViewState("found")
    } catch {
      setSelectedId("")
      setViewState("not-found")
    }
  }

  function selectExample(customer: Customer) {
    setQuery(customer.id)
    setSearchError("")
    setBlockedMessage("")
    setCancelledMessage("")
    setSuccessData(null)
    setSelectedId(customer.id)
    setViewState("found")
  }

  function resetSearch() {
    setQuery("")
    setSearchError("")
    setViewState("idle")
    setSelectedId("")
    setLastQuery("")
    setBlockedMessage("")
    setCancelledMessage("")
    setSuccessData(null)
  }

  function requestDeactivation() {
    if (!selectedCustomer || selectedCustomer.status === "Inactivo") return
    setCancelledMessage("")
    setSuccessData(null)

    if (selectedCustomer.activeAccounts > 0) {
      setBlockedMessage(
        "No es posible desactivar un cliente con cuentas activas",
      )
      return
    }

    setBlockedMessage("")
    setConfirmationAccepted(false)
    setConfirmationOpen(true)
  }

  function cancelDeactivation() {
    setConfirmationOpen(false)
    setConfirmationAccepted(false)
    setCancelledMessage(
      "Operación cancelada. El cliente permanece activo y no se realizaron cambios.",
    )
  }

  async function confirmDeactivation() {
    if (!selectedCustomer) return
    try {
      await apiRequest(`/api/clientes/${selectedCustomer.id}/desactivar`, { method: "PATCH" })
      const now = new Date()
      const timestamp = new Intl.DateTimeFormat("es-CO", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(now)
      const reference = `AUD-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`
      setCustomers((current) =>
        current.map((customer) =>
          customer.id === selectedCustomer.id
            ? { ...customer, status: "Inactivo" }
            : customer,
        ),
      )
      setConfirmationOpen(false)
      setConfirmationAccepted(false)
      setCancelledMessage("")
      setSuccessData({ name: selectedCustomer.name, timestamp, reference })
    } catch (error) {
      setBlockedMessage(error instanceof Error ? error.message : "No fue posible desactivar el cliente")
      setConfirmationOpen(false)
      setConfirmationAccepted(false)
    }
  }

  return (
    <div className="flex h-full overflow-hidden bg-bg-base">
      <Sidebar
        navItems={MANAGER_NAV}
        activeNav={activeNav}
        onNav={setActiveNav}
        userLabel="Gestor Rodríguez"
        userSub="Gestor Bancario"
        userInitials="GR"
        badge="Plataforma Gestión"
      />

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
            <span className="rounded-lg border border-border bg-purple-600/15 px-3 py-1.5 text-xs text-purple-200">
              HU-01-01-02
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
                    placeholder="Ej: BX-C88-21470369"
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

          <section className="mb-6 rounded-2xl border border-border bg-sidebar p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-sm font-semibold text-purple-200">
                  Casos de prueba
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  Selecciona un perfil para validar cada escenario de la
                  operación.
                </p>
              </div>
              <span className="text-xs text-text-muted">
                3 escenarios disponibles
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {customers.map((customer) => {
                const eligible =
                  customer.status === "Activo" && customer.activeAccounts === 0
                const subtitle =
                  customer.status === "Inactivo"
                    ? "Cliente ya inactivo"
                    : eligible
                      ? "Apto para desactivar"
                      : `${customer.activeAccounts} cuentas activas`
                return (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => selectExample(customer)}
                    className={`rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 ${
                      selectedId === customer.id && viewState === "found"
                        ? "border-purple-400/50 bg-purple-600/15"
                        : "border-border bg-purple-400/5 hover:border-border-hover hover:bg-purple-400/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-600/20 font-display text-xs font-bold text-purple-200">
                        {customer.initials}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-text-secondary">
                          {customer.name}
                        </span>
                        <span
                          className={`mt-0.5 block text-xs ${
                            eligible
                              ? "text-emerald-400"
                              : customer.status === "Inactivo"
                                ? "text-text-muted"
                                : "text-amber-400"
                          }`}
                        >
                          {subtitle}
                        </span>
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

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
                Cliente no encontrado
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                No existe un cliente asociado a “{lastQuery}”. Verifica el
                identificador e intenta nuevamente.
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

          {viewState === "found" && selectedCustomer && (
            <div className="flex flex-col gap-5">
              <section className="overflow-hidden rounded-2xl border border-border bg-sidebar">
                <div className="flex flex-col gap-5 border-b border-border bg-gradient-to-r from-purple-600/15 to-transparent p-6 sm:flex-row sm:items-center">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-accent font-display text-lg font-bold text-white">
                    {selectedCustomer.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-xl font-bold text-text-primary">
                        {selectedCustomer.name}
                      </h2>
                      <span
                        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          selectedCustomer.status === "Activo"
                            ? "border-success/25 bg-success/10 text-emerald-400"
                            : "border-border bg-purple-400/5 text-text-muted"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            selectedCustomer.status === "Activo"
                              ? "bg-success"
                              : "bg-text-muted"
                          }`}
                        />
                        {selectedCustomer.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                      <span>CC {selectedCustomer.document}</span>
                      <span>ID {selectedCustomer.id}</span>
                      <span>
                        Vinculado desde {selectedCustomer.customerSince}
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
                      value: selectedCustomer.email,
                    },
                    {
                      label: "Cuentas activas",
                      value: `${selectedCustomer.activeAccounts} de ${selectedCustomer.totalAccounts}`,
                    },
                    {
                      label: "Movimientos conservados",
                      value: `${selectedCustomer.movements} registros`,
                    },
                    {
                      label: "Último movimiento",
                      value: selectedCustomer.lastMovement,
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
                    <p className="mt-1 text-xs leading-relaxed text-red-200/70">
                      Cierra o inactiva todas las cuentas asociadas antes de
                      volver a intentar la operación.
                    </p>
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
                        Gestor Rodríguez
                      </div>
                    </div>
                    <div className="bg-sidebar px-5 py-3">
                      <div className="text-xs text-text-muted">
                        Referencia de auditoría
                      </div>
                      <div className="mt-1 text-xs font-semibold text-purple-300">
                        {successData.reference}
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
                          selectedCustomer.status === "Activo"
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
                          {selectedCustomer.status === "Activo"
                            ? "Cliente activo verificado"
                            : "El cliente ya está inactivo"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl border border-border bg-purple-400/5 p-4">
                      <span
                        className={`mt-0.5 ${
                          selectedCustomer.activeAccounts === 0
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }`}
                      >
                        {selectedCustomer.activeAccounts === 0 ? (
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
                          {selectedCustomer.activeAccounts === 0
                            ? "Sin cuentas activas"
                            : `${selectedCustomer.activeAccounts} cuentas requieren gestión`}
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
                          {selectedCustomer.movements} movimientos se
                          conservarán
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
                      disabled={selectedCustomer.status === "Inactivo"}
                      className="flex items-center justify-center gap-2 rounded-xl border border-danger/40 bg-danger/15 px-5 py-2.5 text-sm font-semibold text-red-300 transition-all hover:bg-danger/25 disabled:cursor-not-allowed disabled:border-border disabled:bg-purple-400/5 disabled:text-text-muted"
                    >
                      <IcoUserMinus />
                      {selectedCustomer.status === "Inactivo"
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

      {confirmationOpen && selectedCustomer && (
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
                    {selectedCustomer.name}
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
                  <span className="font-semibold text-text-secondary">
                    {selectedCustomer.id}
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
                  disabled={!confirmationAccepted}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-danger py-2.5 text-sm font-semibold text-white shadow-lg shadow-danger/20 hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-danger/35 disabled:text-white/50 disabled:shadow-none"
                >
                  <IcoUserMinus />
                  Sí, desactivar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
