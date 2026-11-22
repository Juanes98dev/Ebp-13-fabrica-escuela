import { useEffect, useMemo, useState } from "react"
import Sidebar from "../shared/Sidebar"
import { apiRequest } from "../shared/api"
import {
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
  IcoInbox,
  IcoInfo,
  IcoLock,
  IcoProductos,
  IcoReportes,
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

type RequestStatus = "Pendiente" | "Aprobada" | "Rechazada"

type CardRequest = {
  id: string
  status: RequestStatus
  requestedAt: string
  cardType: "Débito" | "Crédito"
  product: string
  lastFour: string
  customer: {
    name: string
    initials: string
    document: string
    customerId: string
    email: string
    since: string
  }
  account: {
    number: string
    type: string
    status: string
    balance: number
  }
  requestedLimit?: number
  monthlyIncome?: number
}

const INITIAL_REQUESTS: CardRequest[] = [
  {
    id: "SOL-TAR-2026-0184",
    status: "Pendiente",
    requestedAt: "10 de febrero de 2026 · 9:24 a. m.",
    cardType: "Crédito",
    product: "Tarjeta Platinum",
    lastFour: "4382",
    customer: {
      name: "Laura Sofía Mendoza Ruiz",
      initials: "LM",
      document: "1.020.304.050",
      customerId: "BX-C10-20304050",
      email: "laura.mendoza@email.com",
      since: "2021",
    },
    account: {
      number: "•••• 4812",
      type: "Cuenta de ahorros",
      status: "Activa",
      balance: 8_450_320,
    },
    requestedLimit: 6_000_000,
    monthlyIncome: 8_200_000,
  },
  {
    id: "SOL-TAR-2026-0181",
    status: "Pendiente",
    requestedAt: "9 de febrero de 2026 · 3:16 p. m.",
    cardType: "Débito",
    product: "Débito Preferencial",
    lastFour: "7619",
    customer: {
      name: "Carlos Andrés Herrera",
      initials: "CH",
      document: "7.945.612.308",
      customerId: "BX-C79-45612308",
      email: "carlos.herrera@email.com",
      since: "2019",
    },
    account: {
      number: "•••• 1988",
      type: "Cuenta de ahorros",
      status: "Activa",
      balance: 3_275_900,
    },
  },
  {
    id: "SOL-TAR-2026-0177",
    status: "Pendiente",
    requestedAt: "8 de febrero de 2026 · 11:05 a. m.",
    cardType: "Crédito",
    product: "Tarjeta Clásica",
    lastFour: "2054",
    customer: {
      name: "Natalia Fernanda Gómez",
      initials: "NG",
      document: "1.033.847.221",
      customerId: "BX-C10-33847221",
      email: "natalia.gomez@email.com",
      since: "2024",
    },
    account: {
      number: "•••• 6207",
      type: "Cuenta corriente",
      status: "Activa",
      balance: 1_180_000,
    },
    requestedLimit: 3_000_000,
    monthlyIncome: 3_400_000,
  },
]

type Decision = {
  action: "Aprobada" | "Rechazada"
  request: CardRequest
  timestamp: string
  reference: string
  elapsed: string
  reason?: string
}

type ApiCardRequest = {
  id: number
  numeroEnmascarado: string
  tipo: "DEBITO" | "CREDITO"
  estado: string
  cuentaAsociada?: string
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value)
}

export default function CardRequestsView() {
  const [activeNav, setActiveNav] = useState("productos")
  const [requests, setRequests] = useState(INITIAL_REQUESTS)
  const [selectedId, setSelectedId] = useState(INITIAL_REQUESTS[0].id)
  const [approvalOpen, setApprovalOpen] = useState(false)
  const [rejectionOpen, setRejectionOpen] = useState(false)
  const [approvalAccepted, setApprovalAccepted] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [rejectionError, setRejectionError] = useState("")
  const [processing, setProcessing] = useState(false)
  const [decision, setDecision] = useState<Decision | null>(null)
  const [emptyPreview, setEmptyPreview] = useState(false)

  useEffect(() => {
    apiRequest<ApiCardRequest[]>("/api/tarjetas/solicitudes")
      .then((cards) => {
        const mapped = cards.map((card): CardRequest => ({
          id: String(card.id),
          status: "Pendiente",
          requestedAt: "Solicitud pendiente",
          cardType: card.tipo === "CREDITO" ? "Crédito" : "Débito",
          product: card.tipo === "CREDITO" ? "Tarjeta de crédito" : "Tarjeta de débito",
          lastFour: card.numeroEnmascarado.slice(-4),
          customer: {
            name: "Cliente solicitante",
            initials: "CS",
            document: "No disponible",
            customerId: "No disponible",
            email: "No disponible",
            since: "No disponible",
          },
          account: {
            number: card.cuentaAsociada ? `•••• ${card.cuentaAsociada.slice(-4)}` : "No asociada",
            type: card.tipo === "CREDITO" ? "Tarjeta de crédito" : "Cuenta asociada",
            status: "Activa",
            balance: 0,
          },
        }))
        setRequests(mapped)
        setSelectedId(mapped[0]?.id ?? "")
      })
      .catch((error) => setRejectionError(error instanceof Error ? error.message : "No fue posible cargar solicitudes"))
  }, [])

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === "Pendiente"),
    [requests],
  )
  const selectedRequest =
    pendingRequests.find((request) => request.id === selectedId) ??
    pendingRequests[0] ??
    null

  const pendingDebit = pendingRequests.filter(
    (request) => request.cardType === "Débito",
  ).length
  const pendingCredit = pendingRequests.filter(
    (request) => request.cardType === "Crédito",
  ).length

  function selectRequest(request: CardRequest) {
    setSelectedId(request.id)
    setDecision(null)
  }

  function showApproval() {
    if (!selectedRequest) return
    setApprovalAccepted(false)
    setDecision(null)
    setApprovalOpen(true)
  }

  function showRejection() {
    if (!selectedRequest) return
    setRejectionReason("")
    setRejectionError("")
    setDecision(null)
    setRejectionOpen(true)
  }

  async function applyDecision(action: "Aprobada" | "Rechazada", reason?: string) {
    if (!selectedRequest || processing) return
    const requestSnapshot = selectedRequest
    const startedAt = performance.now()
    setProcessing(true)
    try {
      if (action === "Aprobada") {
        await apiRequest<{ mensaje: string }>(`/api/tarjetas/solicitudes/${requestSnapshot.id}/aprobar`, {
          method: "POST",
        })
      } else {
        await apiRequest<{ mensaje: string }>(`/api/tarjetas/solicitudes/${requestSnapshot.id}/rechazar`, {
          method: "POST",
          body: JSON.stringify({ motivo: reason }),
        })
      }
      const now = new Date()
      const remaining = requests.filter(
        (request) =>
          request.id !== requestSnapshot.id && request.status === "Pendiente",
      )
      setRequests((current) =>
        current.map((request) =>
          request.id === requestSnapshot.id
            ? { ...request, status: action }
            : request,
        ),
      )
      setSelectedId(remaining[0]?.id ?? "")
      setProcessing(false)
      setApprovalOpen(false)
      setRejectionOpen(false)
      setApprovalAccepted(false)
      setRejectionReason("")
      setRejectionError("")
      setDecision({
        action,
        request: requestSnapshot,
        timestamp: new Intl.DateTimeFormat("es-CO", {
          dateStyle: "long",
          timeStyle: "short",
        }).format(now),
        reference: `AUD-SOL-${String(now.getTime()).slice(-7)}`,
        elapsed: `${((performance.now() - startedAt) / 1000).toFixed(1)} s`,
        reason,
      })
    } catch (error) {
      setRejectionError(error instanceof Error ? error.message : "No fue posible aplicar la decisión")
    } finally {
      setProcessing(false)
    }
  }

  function confirmRejection() {
    if (!rejectionReason.trim()) {
      setRejectionError("Debe ingresar el motivo del rechazo")
      return
    }
    applyDecision("Rechazada", rejectionReason.trim())
  }

  const showEmpty = emptyPreview || pendingRequests.length === 0

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
            <span>Productos</span>
            <IcoChevron />
            <span className="text-text-secondary">Solicitudes de tarjetas</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-lg border border-success/20 bg-success/10 px-3 py-1.5 text-xs text-emerald-400 sm:flex">
              <IcoShield /> Rol: Gestor
            </span>
            <span className="rounded-lg border border-border bg-purple-600/15 px-3 py-1.5 text-xs text-purple-200">
              HU-02-03-07
            </span>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-8 py-7">
          <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <span className="mb-2 inline-block rounded-md bg-accent/15 px-2 py-1 font-display text-xs font-semibold uppercase tracking-wider text-purple-300">
                Control de emisión
              </span>
              <h1 className="mb-1 font-display text-2xl font-bold text-text-primary">
                Solicitudes de tarjetas
              </h1>
              <p className="max-w-2xl text-sm text-text-muted">
                Revisa los datos del cliente y decide si la tarjeta puede ser
                emitida.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEmptyPreview((current) => !current)}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-sidebar px-4 py-3 text-xs font-semibold text-text-muted transition-colors hover:bg-purple-400/5 hover:text-purple-200"
            >
              <IcoInbox />
              {emptyPreview ? "Volver a la bandeja" : "Probar bandeja vacía"}
            </button>
          </div>

          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <SummaryCard
              label="Solicitudes pendientes"
              value={pendingRequests.length}
              detail="Requieren decisión"
              icon={<IcoInbox />}
              color="purple"
            />
            <SummaryCard
              label="Tarjetas de crédito"
              value={pendingCredit}
              detail="Solicitudes pendientes"
              icon={<IcoCard />}
              color="blue"
            />
            <SummaryCard
              label="Tarjetas débito"
              value={pendingDebit}
              detail="Solicitudes pendientes"
              icon={<IcoCuentas />}
              color="green"
            />
          </section>

          {decision && (
            <section
              role="status"
              className={`mb-5 overflow-hidden rounded-2xl border ${
                decision.action === "Aprobada"
                  ? "border-success/30 bg-success/5"
                  : "border-warn/30 bg-warn/5"
              }`}
            >
              <div className="flex items-start gap-4 p-5">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${
                    decision.action === "Aprobada"
                      ? "border-success/30 bg-success/15 text-emerald-400"
                      : "border-warn/30 bg-warn/15 text-amber-400"
                  }`}
                >
                  {decision.action === "Aprobada" ? <IcoCheck /> : <IcoClose />}
                </span>
                <div className="flex-1">
                  <h3
                    className={`font-display text-base font-bold ${
                      decision.action === "Aprobada"
                        ? "text-emerald-300"
                        : "text-amber-300"
                    }`}
                  >
                    Solicitud {decision.action.toLowerCase()} correctamente
                  </h3>
                  <p className="mt-1 text-sm text-text-muted">
                    {decision.action === "Aprobada"
                      ? `La tarjeta •••• ${decision.request.lastFour} quedó activa y ${decision.request.customer.name} fue notificado de la aprobación.`
                      : `${decision.request.customer.name} fue notificado del rechazo y su motivo: “${decision.reason}”.`}
                  </p>
                </div>
                <span className="rounded-full border border-border bg-sidebar px-2.5 py-1 text-xs font-semibold text-text-muted">
                  {decision.elapsed}
                </span>
              </div>
              <div className="grid gap-px border-t border-border bg-border sm:grid-cols-4">
                <AuditCell
                  label="Gestor responsable"
                  value="Gestor Rodríguez"
                />
                <AuditCell label="Fecha y hora" value={decision.timestamp} />
                <AuditCell
                  label="Nuevo estado"
                  value={
                    decision.action === "Aprobada" ? "Activa" : "Rechazada"
                  }
                  success={decision.action === "Aprobada"}
                />
                <AuditCell
                  label="Referencia"
                  value={decision.reference}
                  accent
                />
              </div>
            </section>
          )}

          {showEmpty ? (
            <section className="rounded-2xl border border-border bg-sidebar px-6 py-14 text-center">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600/15 text-purple-300">
                <IcoInbox />
              </span>
              <h2 className="font-display text-lg font-bold text-text-primary">
                No hay solicitudes pendientes
              </h2>
              <p className="mx-auto mt-1 max-w-lg text-sm text-text-muted">
                Todas las solicitudes de tarjetas fueron revisadas. Te
                notificaremos cuando llegue una nueva.
              </p>
              {emptyPreview && pendingRequests.length > 0 && (
                <button
                  type="button"
                  onClick={() => setEmptyPreview(false)}
                  className="mt-5 rounded-xl border border-border bg-purple-400/10 px-5 py-2.5 text-sm font-semibold text-purple-200 hover:bg-purple-400/15"
                >
                  Volver a solicitudes
                </button>
              )}
            </section>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
              <section className="overflow-hidden rounded-2xl border border-border bg-sidebar">
                <div className="border-b border-border px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-display text-sm font-semibold text-purple-200">
                        Pendientes de revisión
                      </h2>
                      <p className="mt-1 text-xs text-text-muted">
                        Ordenadas desde la más reciente.
                      </p>
                    </div>
                    <span className="rounded-full bg-purple-600/15 px-2.5 py-1 text-xs font-semibold text-purple-300">
                      {pendingRequests.length}
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {pendingRequests.map((request) => (
                    <button
                      key={request.id}
                      type="button"
                      onClick={() => selectRequest(request)}
                      className={`w-full p-4 text-left transition-colors ${
                        selectedRequest?.id === request.id
                          ? "bg-purple-600/15"
                          : "hover:bg-purple-400/5"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            request.cardType === "Crédito"
                              ? "bg-purple-600/20 text-purple-300"
                              : "bg-sky-400/10 text-sky-400"
                          }`}
                        >
                          <IcoCard />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate text-xs font-semibold text-text-secondary">
                              {request.customer.name}
                            </span>
                            <span className="h-2 w-2 shrink-0 rounded-full bg-warn" />
                          </span>
                          <span className="mt-1 block text-xs text-text-muted">
                            {request.cardType} · •••• {request.lastFour}
                          </span>
                          <span className="mt-1.5 block text-[10px] text-text-muted">
                            {request.requestedAt}
                          </span>
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {selectedRequest && (
                <section className="overflow-hidden rounded-2xl border border-border bg-sidebar">
                  <div className="flex flex-col gap-4 border-b border-border bg-gradient-to-r from-purple-600/15 to-transparent p-6 sm:flex-row sm:items-center">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-accent font-display text-sm font-bold text-white">
                      {selectedRequest.customer.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-lg font-bold text-text-primary">
                          {selectedRequest.customer.name}
                        </h2>
                        <span className="rounded-full border border-warn/25 bg-warn/10 px-2.5 py-1 text-xs font-semibold text-amber-400">
                          Pendiente
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                        <span>CC {selectedRequest.customer.document}</span>
                        <span>ID {selectedRequest.customer.customerId}</span>
                        <span>
                          Cliente desde {selectedRequest.customer.since}
                        </span>
                      </div>
                    </div>
                    <span className="rounded-lg border border-border bg-purple-400/5 px-3 py-2 text-xs font-semibold text-purple-200">
                      {selectedRequest.id}
                    </span>
                  </div>

                  <div className="p-6">
                    <div className="mb-5 grid gap-4 sm:grid-cols-2">
                      <DetailSection
                        title="Solicitud de tarjeta"
                        icon={<IcoCard />}
                      >
                        <DetailRow
                          label="Producto"
                          value={selectedRequest.product}
                        />
                        <DetailRow
                          label="Tipo"
                          value={selectedRequest.cardType}
                        />
                        <DetailRow
                          label="Tarjeta preasignada"
                          value={`•••• ${selectedRequest.lastFour}`}
                          protectedValue
                        />
                        <DetailRow
                          label="Fecha de solicitud"
                          value={selectedRequest.requestedAt}
                          last
                        />
                      </DetailSection>

                      <DetailSection
                        title="Cuenta asociada"
                        icon={<IcoCuentas />}
                      >
                        <DetailRow
                          label="Cuenta"
                          value={selectedRequest.account.number}
                          protectedValue
                        />
                        <DetailRow
                          label="Tipo"
                          value={selectedRequest.account.type}
                        />
                        <DetailRow
                          label="Estado"
                          value={selectedRequest.account.status}
                          success
                        />
                        <DetailRow
                          label="Saldo"
                          value={formatCurrency(
                            selectedRequest.account.balance,
                          )}
                          last
                        />
                      </DetailSection>
                    </div>

                    {selectedRequest.cardType === "Crédito" && (
                      <div className="mb-5 grid gap-3 rounded-xl border border-border bg-purple-400/5 p-4 sm:grid-cols-2">
                        <div>
                          <div className="text-xs text-text-muted">
                            Ingresos mensuales declarados
                          </div>
                          <div className="mt-1 text-sm font-semibold text-text-secondary">
                            {formatCurrency(selectedRequest.monthlyIncome ?? 0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-text-muted">
                            Cupo solicitado
                          </div>
                          <div className="mt-1 text-sm font-semibold text-purple-300">
                            {formatCurrency(
                              selectedRequest.requestedLimit ?? 0,
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mb-5 flex items-start gap-3 rounded-xl border border-success/20 bg-success/5 p-4">
                      <span className="mt-0.5 text-emerald-400">
                        <IcoCheck />
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-emerald-300">
                          Identidad y cuenta verificadas
                        </div>
                        <p className="mt-1 text-xs text-text-muted">
                          El cliente se encuentra activo y la cuenta asociada
                          está habilitada.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-2 text-xs text-text-muted">
                        <IcoClock />
                        <span>
                          La decisión se registrará y notificará al cliente.
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={showRejection}
                          className="flex items-center justify-center gap-2 rounded-xl border border-danger/35 bg-danger/10 px-5 py-2.5 text-sm font-semibold text-red-300 hover:bg-danger/20"
                        >
                          <IcoClose />
                          Rechazar
                        </button>
                        <button
                          type="button"
                          onClick={showApproval}
                          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-purple-600 to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 hover:-translate-y-0.5"
                        >
                          <IcoCheck />
                          Aprobar
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-purple-400/5 px-4 py-3.5">
            <span className="mt-0.5 shrink-0 text-purple-300">
              <IcoInfo />
            </span>
            <p className="text-xs leading-relaxed text-text-muted">
              Solo gestores autorizados pueden tomar decisiones. En pantalla se
              muestran únicamente los últimos cuatro dígitos de las tarjetas y
              cada acción queda registrada.
            </p>
          </div>
        </div>
      </main>

      {approvalOpen && selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="approval-title"
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-success/30 bg-surface shadow-2xl shadow-black/40">
            <ModalHeader
              id="approval-title"
              title="Confirmar aprobación"
              description={`La tarjeta •••• ${selectedRequest.lastFour} quedará activa.`}
              icon={<IcoCheck />}
              tone="success"
              onClose={() => setApprovalOpen(false)}
            />
            <div className="p-6">
              <div className="mb-5 rounded-xl border border-border bg-purple-400/5 p-4">
                <DetailRow
                  label="Cliente"
                  value={selectedRequest.customer.name}
                />
                <DetailRow label="Producto" value={selectedRequest.product} />
                <DetailRow label="Nuevo estado" value="Activa" success last />
              </div>
              <label className="mb-5 flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3.5">
                <input
                  type="checkbox"
                  checked={approvalAccepted}
                  onChange={(event) =>
                    setApprovalAccepted(event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 accent-purple-600"
                />
                <span className="text-xs leading-relaxed text-text-muted">
                  Confirmo que revisé la información y que el cliente cumple los
                  requisitos de emisión.
                </span>
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setApprovalOpen(false)}
                  disabled={processing}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-text-secondary hover:bg-purple-400/5 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => applyDecision("Aprobada")}
                  disabled={!approvalAccepted || processing}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-purple-600 to-accent py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {processing ? (
                    <Spinner label="Aprobando..." />
                  ) : (
                    <>
                      <IcoCheck />
                      Aprobar solicitud
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectionOpen && selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rejection-title"
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-danger/30 bg-surface shadow-2xl shadow-black/40">
            <ModalHeader
              id="rejection-title"
              title="Rechazar solicitud"
              description={`Indica el motivo para la tarjeta •••• ${selectedRequest.lastFour}.`}
              icon={<IcoClose />}
              tone="danger"
              onClose={() => setRejectionOpen(false)}
            />
            <div className="p-6">
              <label
                htmlFor="rejection-reason"
                className="mb-2 block font-display text-xs font-semibold uppercase tracking-wide text-purple-200"
              >
                Motivo del rechazo <span className="text-accent">*</span>
              </label>
              <textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(event) => {
                  setRejectionReason(event.target.value.slice(0, 300))
                  setRejectionError("")
                }}
                rows={4}
                aria-invalid={Boolean(rejectionError)}
                placeholder="Describe claramente por qué la solicitud no cumple los requisitos..."
                className={`w-full resize-none rounded-xl border bg-purple-400/5 px-4 py-3 text-sm text-text-primary outline-none transition-all focus:ring-4 focus:ring-purple-400/10 ${
                  rejectionError
                    ? "border-danger"
                    : "border-border focus:border-purple-400/60"
                }`}
              />
              <div className="mt-2 flex items-start justify-between gap-3">
                {rejectionError ? (
                  <span
                    role="alert"
                    className="flex items-center gap-1.5 text-xs text-red-400"
                  >
                    <IcoAlert />
                    {rejectionError}
                  </span>
                ) : (
                  <span className="text-xs text-text-muted">
                    El cliente recibirá este motivo.
                  </span>
                )}
                <span className="shrink-0 text-xs text-text-muted">
                  {rejectionReason.length}/300
                </span>
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setRejectionOpen(false)}
                  disabled={processing}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-text-secondary hover:bg-purple-400/5 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmRejection}
                  disabled={processing}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-danger py-2.5 text-sm font-semibold text-white shadow-lg shadow-danger/20 hover:bg-red-500 disabled:opacity-50"
                >
                  {processing ? (
                    <Spinner label="Rechazando..." />
                  ) : (
                    <>
                      <IcoClose />
                      Confirmar rechazo
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  detail,
  icon,
  color,
}: {
  label: string
  value: number
  detail: string
  icon: React.ReactNode
  color: "purple" | "blue" | "green"
}) {
  const styles = {
    purple: "border-purple-400/20 bg-purple-600/15 text-purple-300",
    blue: "border-sky-400/20 bg-sky-400/10 text-sky-400",
    green: "border-success/20 bg-success/10 text-emerald-400",
  }
  return (
    <article className="rounded-2xl border border-border bg-sidebar p-5">
      <div className="flex items-center justify-between">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${styles[color]}`}
        >
          {icon}
        </span>
        <span className="font-display text-2xl font-bold text-text-primary">
          {value}
        </span>
      </div>
      <div className="mt-4 text-xs font-semibold text-text-secondary">
        {label}
      </div>
      <div className="mt-1 text-xs text-text-muted">{detail}</div>
    </article>
  )
}

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-purple-400/5 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-purple-200">
        {icon}
        {title}
      </div>
      {children}
    </div>
  )
}

function DetailRow({
  label,
  value,
  protectedValue = false,
  success = false,
  last = false,
}: {
  label: string
  value: string
  protectedValue?: boolean
  success?: boolean
  last?: boolean
}) {
  return (
    <div
      className={`flex items-start justify-between gap-3 py-2.5 text-xs ${
        last ? "" : "border-b border-border"
      }`}
    >
      <span className="text-text-muted">{label}</span>
      <span
        className={`flex items-center gap-1.5 text-right font-semibold ${
          success ? "text-emerald-400" : "text-text-secondary"
        }`}
      >
        {value}
        {protectedValue && <IcoLock />}
      </span>
    </div>
  )
}

function ModalHeader({
  id,
  title,
  description,
  icon,
  tone,
  onClose,
}: {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  tone: "success" | "danger"
  onClose: () => void
}) {
  return (
    <div className="flex items-start gap-4 border-b border-border p-6">
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border ${
          tone === "success"
            ? "border-success/25 bg-success/10 text-emerald-400"
            : "border-danger/25 bg-danger/10 text-red-400"
        }`}
      >
        {icon}
      </span>
      <div className="flex-1">
        <h2
          id={id}
          className="font-display text-lg font-bold text-text-primary"
        >
          {title}
        </h2>
        <p className="mt-1 text-sm text-text-muted">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="text-text-muted hover:text-text-secondary"
      >
        <IcoClose />
      </button>
    </div>
  )
}

function Spinner({ label }: { label: string }) {
  return (
    <>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      {label}
    </>
  )
}

function AuditCell({
  label,
  value,
  accent = false,
  success = false,
}: {
  label: string
  value: string
  accent?: boolean
  success?: boolean
}) {
  return (
    <div className="bg-sidebar px-5 py-3">
      <div className="text-xs text-text-muted">{label}</div>
      <div
        className={`mt-1 truncate text-xs font-semibold ${
          accent
            ? "text-purple-300"
            : success
              ? "text-emerald-400"
              : "text-text-secondary"
        }`}
      >
        {value}
      </div>
    </div>
  )
}
