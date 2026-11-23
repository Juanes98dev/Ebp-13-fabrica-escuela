import { useState } from "react"
import Sidebar from "../shared/Sidebar"
import { apiRequest } from "../shared/api"
import {
  IcoAccountMinus,
  IcoAlert,
  IcoCard,
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

type Account = {
  number: string
  type: string
  status: "Activa" | "Inactiva"
  balance: number
  activeCards: number
  owner: string
  ownerId: string
  initials: string
  openedAt: string
  transactions: number
  lastTransaction: string
}

const INITIAL_ACCOUNTS: Account[] = [
  {
    number: "301-884-1200-07",
    type: "Cuenta de ahorros",
    status: "Activa",
    balance: 0,
    activeCards: 0,
    owner: "Diego Alejandro Ríos",
    ownerId: "BX-C88-21470369",
    initials: "DR",
    openedAt: "17 de junio de 2020",
    transactions: 148,
    lastTransaction: "28 de enero de 2026",
  },
  {
    number: "301-481-2209-12",
    type: "Cuenta de ahorros",
    status: "Activa",
    balance: 8_450_320,
    activeCards: 0,
    owner: "Laura Sofía Mendoza",
    ownerId: "BX-C10-20304050",
    initials: "LM",
    openedAt: "12 de febrero de 2021",
    transactions: 326,
    lastTransaction: "9 de febrero de 2026",
  },
  {
    number: "501-903-6411-25",
    type: "Cuenta corriente",
    status: "Activa",
    balance: 0,
    activeCards: 1,
    owner: "Carlos Andrés Herrera",
    ownerId: "BX-C79-45612308",
    initials: "CH",
    openedAt: "6 de agosto de 2019",
    transactions: 241,
    lastTransaction: "2 de febrero de 2026",
  },
]

type ViewState = "idle" | "loading" | "found" | "not-found"

type ApiAccount = {
  numeroCuenta: string
  tipo: "AHORROS" | "CORRIENTE"
  saldo: number
  activa: boolean
  idCliente: string
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value)
}

export default function AccountDeactivationView() {
  const [activeNav, setActiveNav] = useState("cuentas")
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS)
  const [query, setQuery] = useState("")
  const [searchError, setSearchError] = useState("")
  const [viewState, setViewState] = useState<ViewState>("idle")
  const [selectedNumber, setSelectedNumber] = useState("")
  const [lastQuery, setLastQuery] = useState("")
  const [blockingError, setBlockingError] = useState<{
    title: string
    detail: string
  } | null>(null)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [confirmationAccepted, setConfirmationAccepted] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [success, setSuccess] = useState<{
    timestamp: string
    reference: string
  } | null>(null)

  const selectedAccount =
    accounts.find((account) => account.number === selectedNumber) ?? null

  function clearMessages() {
    setBlockingError(null)
    setCancelled(false)
    setSuccess(null)
  }

  function loadAccount(account: Account) {
    setSelectedNumber(account.number)
    setViewState("found")
    setSearchError("")
    clearMessages()
  }

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault()
    const value = query.trim()
    if (!/^[A-Za-z0-9-]{6,20}$/.test(value)) {
      setSearchError("Ingrese un número de cuenta o identificador válido")
      setViewState("idle")
      return
    }

    setSearchError("")
    clearMessages()
    setLastQuery(value)
    setViewState("loading")
    try {
      const account = await apiRequest<ApiAccount>(`/api/cuentas/${encodeURIComponent(value)}`)
      const mapped: Account = {
        number: account.numeroCuenta,
        type: account.tipo === "AHORROS" ? "Cuenta de ahorros" : "Cuenta corriente",
        status: account.activa ? "Activa" : "Inactiva",
        balance: Number(account.saldo),
        activeCards: 0,
        owner: "Cliente asociado",
        ownerId: account.idCliente,
        initials: "CA",
        openedAt: "No disponible",
        transactions: 0,
        lastTransaction: "No disponible",
      }
      setAccounts((current) => [
        mapped,
        ...current.filter((item) => item.number !== mapped.number),
      ])
      setSelectedNumber(mapped.number)
      setViewState("found")
    } catch {
      setSelectedNumber("")
      setViewState("not-found")
    }
  }

  function selectExample(account: Account) {
    setQuery(account.number)
    loadAccount(account)
  }

  function resetSearch() {
    setQuery("")
    setSearchError("")
    setSelectedNumber("")
    setLastQuery("")
    clearMessages()
    setViewState("idle")
  }

  function requestDeactivation() {
    if (!selectedAccount || selectedAccount.status === "Inactiva") return
    setCancelled(false)
    setSuccess(null)

    if (selectedAccount.balance > 0) {
      setBlockingError({
        title:
          "La cuenta tiene saldo disponible; debe retirarse o transferirse antes de desactivarla",
        detail: `Saldo pendiente: ${formatCurrency(selectedAccount.balance)}. La operación no realizó ningún cambio.`,
      })
      return
    }

    if (selectedAccount.activeCards > 0) {
      setBlockingError({
        title: "Debe eliminar las tarjetas activas asociadas a la cuenta",
        detail: `${selectedAccount.activeCards} tarjeta activa debe ser cancelada antes de continuar.`,
      })
      return
    }

    setBlockingError(null)
    setConfirmationAccepted(false)
    setConfirmationOpen(true)
  }

  function cancelDeactivation() {
    setConfirmationOpen(false)
    setConfirmationAccepted(false)
    setCancelled(true)
  }

  async function confirmDeactivation() {
    if (!selectedAccount || !confirmationAccepted) return
    try {
      await apiRequest(`/api/cuentas/${encodeURIComponent(selectedAccount.number)}/desactivar`, {
        method: "PATCH",
      })
      const now = new Date()
      setAccounts((current) =>
        current.map((account) =>
          account.number === selectedAccount.number
            ? { ...account, status: "Inactiva" }
            : account,
        ),
      )
      setConfirmationOpen(false)
      setConfirmationAccepted(false)
      setCancelled(false)
      setSuccess({
        timestamp: new Intl.DateTimeFormat("es-CO", {
          dateStyle: "long",
          timeStyle: "short",
        }).format(now),
        reference: `AUD-CTA-${String(now.getTime()).slice(-7)}`,
      })
    } catch (error) {
      setBlockingError({
        title: error instanceof Error ? error.message : "No fue posible desactivar la cuenta",
        detail: "La operación no realizó ningún cambio.",
      })
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
            <span>Cuentas</span>
            <IcoChevron />
            <span className="text-text-secondary">Desactivar cuenta</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-lg border border-success/20 bg-success/10 px-3 py-1.5 text-xs text-emerald-400 sm:flex">
              <IcoShield /> Rol: Gestor
            </span>
            
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-8 py-7">
          <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <span className="mb-2 inline-block rounded-md bg-danger/10 px-2 py-1 font-display text-xs font-semibold uppercase tracking-wider text-red-300">
                Gestión de cuentas
              </span>
              <h1 className="mb-1 font-display text-2xl font-bold text-text-primary">
                Desactivar cuenta financiera
              </h1>
              <p className="max-w-2xl text-sm text-text-muted">
                Da de baja una cuenta sin eliminar su información ni su
                historial de transacciones.
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
                  htmlFor="account-search"
                  className="mb-2 block font-display text-xs font-semibold uppercase tracking-wide text-purple-200"
                >
                  Número de cuenta o identificador del cliente
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                    <IcoSearch />
                  </span>
                  <input
                    id="account-search"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value)
                      setSearchError("")
                    }}
                    aria-invalid={Boolean(searchError)}
                    placeholder="Ej: 301-884-1200-07"
                    className={`w-full rounded-xl border bg-purple-400/5 py-3 pl-11 pr-4 text-sm text-text-primary outline-none transition-all focus:ring-4 focus:ring-purple-400/10 ${
                      searchError
                        ? "border-danger"
                        : "border-border focus:border-purple-400/60"
                    }`}
                  />
                </div>
                {searchError ? (
                  <span className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
                    <IcoAlert />
                    {searchError}
                  </span>
                ) : (
                  <span className="mt-2 block text-xs text-text-muted">
                    Verificaremos el saldo y las tarjetas asociadas antes de
                    continuar.
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
                    Buscar cuenta
                  </>
                )}
              </button>
            </div>
          </form>

          <section className="mb-6 rounded-2xl border border-border bg-sidebar p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-sm font-semibold text-purple-200">
                  Escenarios de prueba
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  Selecciona una cuenta para validar las reglas de
                  desactivación.
                </p>
              </div>
              <span className="text-xs text-text-muted">
                3 cuentas disponibles
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {accounts.map((account) => {
                const eligible =
                  account.status === "Activa" &&
                  account.balance === 0 &&
                  account.activeCards === 0
                const condition =
                  account.status === "Inactiva"
                    ? "Cuenta inactiva"
                    : account.balance > 0
                      ? `Saldo ${formatCurrency(account.balance)}`
                      : account.activeCards > 0
                        ? `${account.activeCards} tarjeta activa`
                        : "Apta para desactivar"
                return (
                  <button
                    key={account.number}
                    type="button"
                    onClick={() => selectExample(account)}
                    className={`rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 ${
                      selectedNumber === account.number && viewState === "found"
                        ? "border-purple-400/50 bg-purple-600/15"
                        : "border-border bg-purple-400/5 hover:border-border-hover hover:bg-purple-400/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-600/20 text-purple-200">
                        <IcoCuentas />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-text-secondary">
                          {account.number}
                        </span>
                        <span
                          className={`mt-0.5 block truncate text-xs ${
                            eligible ? "text-emerald-400" : "text-amber-400"
                          }`}
                        >
                          {condition}
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
                <IcoAccountMinus />
              </span>
              <h2 className="font-display text-base font-semibold text-text-secondary">
                Selecciona la cuenta que deseas desactivar
              </h2>
              <p className="mx-auto mt-1 max-w-lg text-sm text-text-muted">
                La cuenta debe tener saldo cero y no puede tener tarjetas
                activas asociadas.
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
                Cuenta no encontrada
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                No encontramos una cuenta asociada a “{lastQuery}”.
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

          {viewState === "found" && selectedAccount && (
            <div className="flex flex-col gap-5">
              <section className="overflow-hidden rounded-2xl border border-border bg-sidebar">
                <div className="flex flex-col gap-5 border-b border-border bg-gradient-to-r from-purple-600/15 to-transparent p-6 sm:flex-row sm:items-center">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-accent text-white">
                    <IcoCuentas />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-xl font-bold text-text-primary">
                        {selectedAccount.type}
                      </h2>
                      <span
                        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          selectedAccount.status === "Activa"
                            ? "border-success/25 bg-success/10 text-emerald-400"
                            : "border-border bg-purple-400/5 text-text-muted"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            selectedAccount.status === "Activa"
                              ? "bg-success"
                              : "bg-text-muted"
                          }`}
                        />
                        {selectedAccount.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                      <span>{selectedAccount.number}</span>
                      <span>{selectedAccount.owner}</span>
                      <span>ID {selectedAccount.ownerId}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={resetSearch}
                    className="rounded-lg border border-border bg-purple-400/10 px-4 py-2 text-xs font-semibold text-purple-200 hover:bg-purple-400/15"
                  >
                    Cambiar cuenta
                  </button>
                </div>

                <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      label: "Saldo disponible",
                      value: formatCurrency(selectedAccount.balance),
                    },
                    {
                      label: "Tarjetas activas",
                      value: String(selectedAccount.activeCards),
                    },
                    {
                      label: "Historial conservado",
                      value: `${selectedAccount.transactions} transacciones`,
                    },
                    {
                      label: "Fecha de apertura",
                      value: selectedAccount.openedAt,
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

              {blockingError && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-4"
                >
                  <span className="mt-0.5 shrink-0 text-red-400">
                    <IcoAlert />
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-red-300">
                      {blockingError.title}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-red-200/70">
                      {blockingError.detail}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBlockingError(null)}
                    aria-label="Cerrar mensaje"
                    className="text-red-300/70 hover:text-red-200"
                  >
                    <IcoClose />
                  </button>
                </div>
              )}

              {cancelled && (
                <div
                  role="status"
                  className="flex items-start gap-3 rounded-xl border border-warn/25 bg-warn/10 px-4 py-4"
                >
                  <span className="mt-0.5 text-amber-400">
                    <IcoInfo />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-amber-300">
                      Desactivación cancelada
                    </div>
                    <p className="mt-1 text-xs text-amber-100/65">
                      La cuenta permanece activa y continúa admitiendo
                      operaciones.
                    </p>
                  </div>
                </div>
              )}

              {success ? (
                <section
                  role="status"
                  className="overflow-hidden rounded-2xl border border-success/30 bg-success/5"
                >
                  <div className="flex items-start gap-4 p-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-success/30 bg-success/15 text-emerald-400">
                      <IcoCheck />
                    </span>
                    <div>
                      <h3 className="font-display text-base font-bold text-emerald-300">
                        Cuenta desactivada exitosamente
                      </h3>
                      <p className="mt-1 text-sm text-text-muted">
                        La cuenta ya no admite transferencias, retiros ni
                        consignaciones. Su historial permanece disponible.
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-px border-t border-success/15 bg-success/15 sm:grid-cols-3">
                    <AuditDetail
                      label="Fecha y hora"
                      value={success.timestamp}
                    />
                    <AuditDetail
                      label="Gestor responsable"
                      value="Gestor Rodríguez"
                    />
                    <AuditDetail
                      label="Referencia de auditoría"
                      value={success.reference}
                      accent
                    />
                  </div>
                  <div className="grid gap-3 border-t border-success/15 p-5 sm:grid-cols-3">
                    {["Transferencias", "Retiros", "Consignaciones"].map(
                      (operation) => (
                        <div
                          key={operation}
                          className="flex items-center justify-between rounded-xl border border-border bg-sidebar px-4 py-3"
                        >
                          <span className="text-xs font-semibold text-text-secondary">
                            {operation}
                          </span>
                          <span className="rounded-full bg-danger/10 px-2 py-1 text-xs font-semibold text-red-300">
                            Bloqueadas
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </section>
              ) : (
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
                    <ValidationCard
                      icon={<IcoCheck />}
                      valid={selectedAccount.status === "Activa"}
                      title="Estado de la cuenta"
                      detail={
                        selectedAccount.status === "Activa"
                          ? "Cuenta activa verificada"
                          : "La cuenta ya está inactiva"
                      }
                    />
                    <ValidationCard
                      icon={
                        selectedAccount.balance === 0 ? (
                          <IcoCheck />
                        ) : (
                          <IcoAlert />
                        )
                      }
                      valid={selectedAccount.balance === 0}
                      title="Saldo disponible"
                      detail={
                        selectedAccount.balance === 0
                          ? "Saldo en $0"
                          : `${formatCurrency(selectedAccount.balance)} pendientes`
                      }
                    />
                    <ValidationCard
                      icon={
                        selectedAccount.activeCards === 0 ? (
                          <IcoCheck />
                        ) : (
                          <IcoCard />
                        )
                      }
                      valid={selectedAccount.activeCards === 0}
                      title="Tarjetas asociadas"
                      detail={
                        selectedAccount.activeCards === 0
                          ? "Sin tarjetas activas"
                          : `${selectedAccount.activeCards} tarjeta activa`
                      }
                    />
                  </div>

                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-purple-400/5 p-4">
                    <span className="mt-0.5 text-purple-300">
                      <IcoDatabase />
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-text-secondary">
                        Historial protegido
                      </div>
                      <p className="mt-1 text-xs text-text-muted">
                        Las {selectedAccount.transactions} transacciones y los
                        datos de la cuenta se conservarán para trazabilidad.
                        Último movimiento: {selectedAccount.lastTransaction}.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2 text-xs text-text-muted">
                      <IcoClock />
                      <span>
                        La acción registrará fecha, hora y gestor responsable.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={requestDeactivation}
                      disabled={selectedAccount.status === "Inactiva"}
                      className="flex items-center justify-center gap-2 rounded-xl border border-danger/40 bg-danger/15 px-5 py-2.5 text-sm font-semibold text-red-300 transition-all hover:bg-danger/25 disabled:cursor-not-allowed disabled:border-border disabled:bg-purple-400/5 disabled:text-text-muted"
                    >
                      <IcoAccountMinus />
                      {selectedAccount.status === "Inactiva"
                        ? "Cuenta ya inactiva"
                        : "Desactivar cuenta"}
                    </button>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>

      {confirmationOpen && selectedAccount && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-deactivation-title"
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-danger/30 bg-surface shadow-2xl shadow-black/40">
            <div className="flex items-start gap-4 border-b border-border p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-danger/25 bg-danger/10 text-red-400">
                <IcoAccountMinus />
              </span>
              <div className="flex-1">
                <h2
                  id="account-deactivation-title"
                  className="font-display text-lg font-bold text-text-primary"
                >
                  Confirmar desactivación
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-text-muted">
                  La cuenta dejará de admitir operaciones inmediatamente.
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
                <ConfirmationRow
                  label="Cuenta"
                  value={selectedAccount.number}
                />
                <ConfirmationRow
                  label="Titular"
                  value={selectedAccount.owner}
                />
                <ConfirmationRow label="Saldo" value="$0" success />
                <ConfirmationRow
                  label="Tarjetas activas"
                  value="Ninguna"
                  success
                  last
                />
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
                  Confirmo que verifiqué las condiciones y comprendo que la
                  cuenta no admitirá nuevas operaciones.
                </span>
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={cancelDeactivation}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-text-secondary hover:bg-purple-400/5"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDeactivation}
                  disabled={!confirmationAccepted}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-danger py-2.5 text-sm font-semibold text-white shadow-lg shadow-danger/20 hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-danger/35 disabled:text-white/50 disabled:shadow-none"
                >
                  <IcoAccountMinus />
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

function ValidationCard({
  icon,
  valid,
  title,
  detail,
}: {
  icon: React.ReactNode
  valid: boolean
  title: string
  detail: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-purple-400/5 p-4">
      <span
        className={`mt-0.5 ${valid ? "text-emerald-400" : "text-amber-400"}`}
      >
        {icon}
      </span>
      <div>
        <div className="text-xs font-semibold text-text-secondary">{title}</div>
        <div className="mt-1 text-xs text-text-muted">{detail}</div>
      </div>
    </div>
  )
}

function AuditDetail({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="bg-sidebar px-5 py-3">
      <div className="text-xs text-text-muted">{label}</div>
      <div
        className={`mt-1 text-xs font-semibold ${
          accent ? "text-purple-300" : "text-text-secondary"
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function ConfirmationRow({
  label,
  value,
  success = false,
  last = false,
}: {
  label: string
  value: string
  success?: boolean
  last?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between py-2.5 text-xs ${
        last ? "" : "border-b border-border"
      }`}
    >
      <span className="text-text-muted">{label}</span>
      <span
        className={`font-semibold ${
          success ? "text-emerald-400" : "text-text-secondary"
        }`}
      >
        {value}
      </span>
    </div>
  )
}
