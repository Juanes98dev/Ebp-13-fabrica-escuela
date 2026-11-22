import { useEffect, useState } from "react"
import Sidebar from "../shared/Sidebar"
import { CLIENTE_ACTIVO } from "../shared/data"
import { apiRequest } from "../shared/api"
import {
  IcoAlert,
  IcoCard,
  IcoCheck,
  IcoChevron,
  IcoClock,
  IcoClose,
  IcoCuentas,
  IcoDash,
  IcoDatabase,
  IcoExtractos,
  IcoInfo,
  IcoInversiones,
  IcoLock,
  IcoPagos,
  IcoPrestamos,
  IcoShield,
  IcoTransfer,
  IcoTrash,
} from "../shared/icons"

const CLIENT_NAV = [
  { id: "inicio", label: "Inicio", icon: <IcoDash /> },
  { id: "cuentas", label: "Mis Cuentas", icon: <IcoCuentas /> },
  { id: "transferencias", label: "Transferencias", icon: <IcoTransfer /> },
  { id: "pagos", label: "Pagos", icon: <IcoPagos /> },
  { id: "prestamos", label: "Préstamos", icon: <IcoPrestamos /> },
  { id: "inversiones", label: "Inversiones", icon: <IcoInversiones /> },
  { id: "extractos", label: "Extractos", icon: <IcoExtractos /> },
]

type CardStatus = "Activa" | "Bloqueada" | "Eliminada"

type BankCard = {
  id: string
  kind: "Débito" | "Crédito"
  status: CardStatus
  brand: string
  lastFour: string
  holder: string
  expires: string
  product: string
  pendingMovements: number
  pendingAmount: number
  historyCount: number
  linkedProduct: string
  gradient: string
}

const INITIAL_CARDS: BankCard[] = [
  {
    id: "delete-debit-2841",
    kind: "Débito",
    status: "Activa",
    brand: "VISA",
    lastFour: "2841",
    holder: "VALENTINA MORALES",
    expires: "08/29",
    product: "Débito Preferencial",
    pendingMovements: 0,
    pendingAmount: 0,
    historyCount: 186,
    linkedProduct: "Cuenta de ahorros •••• 2291",
    gradient: "from-[#4c1d95] via-[#6d28d9] to-[#a855f7]",
  },
  {
    id: "delete-credit-7164",
    kind: "Crédito",
    status: "Activa",
    brand: "MASTERCARD",
    lastFour: "7164",
    holder: "VALENTINA MORALES",
    expires: "11/28",
    product: "Crédito Platinum",
    pendingMovements: 3,
    pendingAmount: 485_900,
    historyCount: 324,
    linkedProduct: "Cupo total $ 6.000.000",
    gradient: "from-[#172554] via-[#312e81] to-[#6d28d9]",
  },
  {
    id: "delete-debit-6103",
    kind: "Débito",
    status: "Bloqueada",
    brand: "VISA",
    lastFour: "6103",
    holder: "VALENTINA MORALES",
    expires: "06/28",
    product: "Débito Cuenta Corriente",
    pendingMovements: 0,
    pendingAmount: 0,
    historyCount: 97,
    linkedProduct: "Cuenta corriente •••• 8841",
    gradient: "from-[#272334] via-[#3b3150] to-[#59416f]",
  },
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value)
}

type ApiCard = {
  id: number
  numeroEnmascarado: string
  tipo: "DEBITO" | "CREDITO"
  estado: string
  cupoDisponible?: number
  cupoTotal?: number
  cuentaAsociada?: string
}

export default function CardDeletionView() {
  const [activeNav, setActiveNav] = useState("tarjetas")
  const [cards, setCards] = useState(INITIAL_CARDS)
  const [selectedId, setSelectedId] = useState(INITIAL_CARDS[0].id)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [confirmationAccepted, setConfirmationAccepted] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [blockingError, setBlockingError] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [success, setSuccess] = useState<{
    card: BankCard
    timestamp: string
    reference: string
  } | null>(null)

  useEffect(() => {
    const clienteId = window.localStorage.getItem("bancox-user-id")
    if (!clienteId) return
    apiRequest<ApiCard[]>(`/api/tarjetas?clienteId=${clienteId}`)
      .then((apiCards) => {
        const loaded = apiCards
          .filter((card) => card.estado !== "eliminada")
          .map((card): BankCard => ({
            id: String(card.id),
            kind: card.tipo === "CREDITO" ? "Crédito" : "Débito",
            status: card.estado === "bloqueada" ? "Bloqueada" : "Activa",
            brand: card.tipo === "CREDITO" ? "MASTERCARD" : "VISA",
            lastFour: card.numeroEnmascarado.slice(-4),
            holder: CLIENTE_ACTIVO.nombre.toUpperCase(),
            expires: "08/29",
            product: card.tipo === "CREDITO" ? "Tarjeta de crédito" : "Tarjeta de débito",
            pendingMovements: card.tipo === "CREDITO" && card.cupoDisponible != null && card.cupoTotal != null
              ? card.cupoDisponible < card.cupoTotal ? 1 : 0
              : 0,
            pendingAmount: card.tipo === "CREDITO" && card.cupoDisponible != null && card.cupoTotal != null
              ? Math.max(0, card.cupoTotal - card.cupoDisponible)
              : 0,
            historyCount: 0,
            linkedProduct: card.cuentaAsociada ?? "Producto independiente",
            gradient: "from-[#4c1d95] via-[#6d28d9] to-[#a855f7]",
          }))
        if (loaded.length > 0) {
          setCards(loaded)
          setSelectedId(loaded[0].id)
        }
      })
      .catch(() => undefined)
  }, [])

  const visibleCards = cards.filter((card) => card.status !== "Eliminada")
  const deletedCards = cards.filter((card) => card.status === "Eliminada")
  const selectedCard =
    visibleCards.find((card) => card.id === selectedId) ??
    visibleCards[0] ??
    null

  function selectCard(card: BankCard) {
    setSelectedId(card.id)
    setBlockingError(false)
    setCancelled(false)
    setSuccess(null)
  }

  function requestDeletion() {
    if (!selectedCard) return
    setCancelled(false)
    setSuccess(null)
    if (selectedCard.pendingMovements > 0 || selectedCard.pendingAmount > 0) {
      setBlockingError(true)
      return
    }
    setBlockingError(false)
    setConfirmationAccepted(false)
    setConfirmationOpen(true)
  }

  function cancelDeletion() {
    setConfirmationOpen(false)
    setConfirmationAccepted(false)
    setCancelled(true)
  }

  async function confirmDeletion() {
    if (!selectedCard || !confirmationAccepted || deleting) return
    const deletedCard = selectedCard
    setDeleting(true)
    try {
      await apiRequest<{ mensaje: string }>(`/api/tarjetas/${deletedCard.id}/eliminar`, {
        method: "POST",
      })
      const now = new Date()
      const nextVisible = cards.find(
        (card) => card.id !== deletedCard.id && card.status !== "Eliminada",
      )
      setCards((current) =>
        current.map((card) =>
          card.id === deletedCard.id ? { ...card, status: "Eliminada" } : card,
        ),
      )
      setSelectedId(nextVisible?.id ?? "")
      setDeleting(false)
      setConfirmationOpen(false)
      setConfirmationAccepted(false)
      setCancelled(false)
      setSuccess({
        card: { ...deletedCard, status: "Eliminada" },
        timestamp: new Intl.DateTimeFormat("es-CO", {
          dateStyle: "long",
          timeStyle: "short",
        }).format(now),
        reference: `AUD-TAR-${String(now.getTime()).slice(-7)}`,
      })
    } catch (error) {
      setBlockingError(true)
      setDeleting(false)
    }
  }

  return (
    <div className="flex h-full overflow-hidden bg-bg-base">
      <Sidebar
        navItems={CLIENT_NAV}
        activeNav={activeNav}
        onNav={setActiveNav}
        userLabel={CLIENTE_ACTIVO.nombre}
        userSub={`ID ${CLIENTE_ACTIVO.id}`}
        userInitials={CLIENTE_ACTIVO.iniciales}
        badge="Banca Personal"
      />

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-bg-base/95 px-8 py-5 backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Tarjetas</span>
            <IcoChevron />
            <span className="text-text-secondary">Eliminar tarjeta</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-lg border border-success/20 bg-success/10 px-3 py-1.5 text-xs text-emerald-400 sm:flex">
              <IcoShield /> Sesión segura
            </span>
            <span className="rounded-lg border border-border bg-purple-600/15 px-3 py-1.5 text-xs text-purple-200">
              HU-02-03-04
            </span>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-8 py-7">
          <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <span className="mb-2 inline-block rounded-md bg-danger/10 px-2 py-1 font-display text-xs font-semibold uppercase tracking-wider text-red-300">
                Administración de tarjetas
              </span>
              <h1 className="mb-1 font-display text-2xl font-bold text-text-primary">
                Eliminar una tarjeta
              </h1>
              <p className="max-w-2xl text-sm text-text-muted">
                Da de baja una tarjeta que ya no necesitas. Su historial se
                conservará de forma segura.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-sidebar px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600/15 text-purple-300">
                <IcoDatabase />
              </span>
              <div>
                <div className="text-xs font-semibold text-text-secondary">
                  Eliminación lógica
                </div>
                <div className="mt-0.5 text-xs text-text-muted">
                  El registro y el historial se conservan
                </div>
              </div>
            </div>
          </div>

          <section className="mb-6 rounded-2xl border border-border bg-sidebar p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-sm font-semibold text-purple-200">
                  Tus tarjetas vigentes
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  Selecciona la tarjeta que deseas dar de baja.
                </p>
              </div>
              <span className="rounded-lg bg-purple-400/10 px-2.5 py-1 text-xs text-purple-300">
                {visibleCards.length} en el listado
              </span>
            </div>

            {visibleCards.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-3">
                {visibleCards.map((card) => {
                  const eligible =
                    card.pendingMovements === 0 && card.pendingAmount === 0
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => selectCard(card)}
                      aria-pressed={selectedCard?.id === card.id}
                      className={`rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 ${
                        selectedCard?.id === card.id
                          ? "border-purple-400/60 bg-purple-600/15"
                          : "border-border bg-purple-400/5 hover:border-border-hover hover:bg-purple-400/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-md`}
                        >
                          <IcoCard />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold text-text-secondary">
                            {card.kind} •••• {card.lastFour}
                          </span>
                          <span
                            className={`mt-1 block truncate text-xs ${
                              eligible ? "text-emerald-400" : "text-amber-400"
                            }`}
                          >
                            {eligible
                              ? "Disponible para eliminar"
                              : `${card.pendingMovements} movimientos pendientes`}
                          </span>
                        </span>
                        <span
                          className={`h-2 w-2 rounded-full ${
                            card.status === "Activa"
                              ? "bg-success"
                              : "bg-text-muted"
                          }`}
                        />
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border py-10 text-center">
                <div className="text-sm font-semibold text-text-secondary">
                  No tienes tarjetas vigentes
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  Todas tus tarjetas fueron dadas de baja.
                </p>
              </div>
            )}
          </section>

          {selectedCard && (
            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <section className="rounded-2xl border border-border bg-sidebar p-5">
                <div
                  className={`relative mx-auto aspect-[1.58/1] max-w-sm overflow-hidden rounded-2xl bg-gradient-to-br ${selectedCard.gradient} p-5 shadow-2xl shadow-black/30`}
                >
                  <span className="absolute -right-12 -top-14 h-40 w-40 rounded-full border border-white/10" />
                  <span className="absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-white/5" />
                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <span className="font-display text-sm font-semibold tracking-wide text-white/90">
                        BANCO X
                      </span>
                      <span className="font-display text-xs font-bold tracking-wider text-white/90">
                        {selectedCard.brand}
                      </span>
                    </div>
                    <div>
                      <div className="mb-4 flex items-center gap-2">
                        <span className="h-6 w-9 rounded bg-gradient-to-br from-amber-200 to-amber-500 opacity-90" />
                        {selectedCard.status === "Bloqueada" && (
                          <span className="flex items-center gap-1 rounded-full bg-black/25 px-2 py-1 text-[10px] font-bold uppercase text-white">
                            <IcoLock /> Bloqueada
                          </span>
                        )}
                      </div>
                      <div className="font-display text-base tracking-[0.2em] text-white">
                        •••• •••• •••• {selectedCard.lastFour}
                      </div>
                      <div className="mt-4 flex items-end justify-between text-white/75">
                        <div>
                          <div className="text-[9px] uppercase tracking-wide">
                            Titular
                          </div>
                          <div className="mt-0.5 text-[10px] font-semibold tracking-wide text-white/95">
                            {selectedCard.holder}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] uppercase">Vence</div>
                          <div className="mt-0.5 text-[10px] font-semibold text-white/95">
                            {selectedCard.expires}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <div className="font-display text-sm font-semibold text-text-secondary">
                    {selectedCard.product}
                  </div>
                  <div className="mt-1 text-xs text-text-muted">
                    {selectedCard.linkedProduct}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-sidebar">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-purple-300">
                      <IcoShield />
                    </span>
                    <h2 className="font-display text-sm font-semibold text-purple-200">
                      Validación previa
                    </h2>
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                      selectedCard.pendingMovements === 0 &&
                      selectedCard.pendingAmount === 0
                        ? "border-success/25 bg-success/10 text-emerald-400"
                        : "border-warn/25 bg-warn/10 text-amber-400"
                    }`}
                  >
                    {selectedCard.pendingMovements === 0 &&
                    selectedCard.pendingAmount === 0
                      ? "Sin pendientes"
                      : "Requiere gestión"}
                  </span>
                </div>

                <div className="grid gap-px bg-border sm:grid-cols-3">
                  <StatusCell
                    label="Movimientos pendientes"
                    value={String(selectedCard.pendingMovements)}
                    valid={selectedCard.pendingMovements === 0}
                  />
                  <StatusCell
                    label="Saldo pendiente"
                    value={formatCurrency(selectedCard.pendingAmount)}
                    valid={selectedCard.pendingAmount === 0}
                  />
                  <StatusCell
                    label="Historial registrado"
                    value={`${selectedCard.historyCount} movimientos`}
                    valid
                  />
                </div>

                <div className="p-5">
                  <div className="mb-5 flex items-start gap-3 rounded-xl border border-border bg-purple-400/5 p-4">
                    <span className="mt-0.5 text-purple-300">
                      <IcoDatabase />
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-text-secondary">
                        Tu historial está protegido
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-text-muted">
                        Al eliminar la tarjeta conservaremos sus movimientos y
                        datos para consulta y trazabilidad.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={requestDeletion}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-danger/40 bg-danger/15 px-5 py-3 text-sm font-semibold text-red-300 transition-all hover:bg-danger/25"
                  >
                    <IcoTrash />
                    Eliminar tarjeta
                  </button>
                </div>
              </section>
            </div>
          )}

          {blockingError && selectedCard && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-4"
            >
              <span className="mt-0.5 shrink-0 text-red-400">
                <IcoAlert />
              </span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-red-300">
                  No es posible eliminar la tarjeta: tiene movimientos
                  pendientes
                </div>
                <p className="mt-1 text-xs leading-relaxed text-red-200/70">
                  Completa el pago de{" "}
                  {formatCurrency(selectedCard.pendingAmount)} y espera a que
                  los {selectedCard.pendingMovements} movimientos sean
                  procesados.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBlockingError(false)}
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
              className="mt-5 flex items-start gap-3 rounded-xl border border-warn/25 bg-warn/10 px-4 py-4"
            >
              <span className="mt-0.5 text-amber-400">
                <IcoInfo />
              </span>
              <div>
                <div className="text-sm font-semibold text-amber-300">
                  Eliminación cancelada
                </div>
                <p className="mt-1 text-xs text-amber-100/65">
                  La tarjeta permanece sin cambios y continúa en tu listado.
                </p>
              </div>
            </div>
          )}

          {success && (
            <section
              role="status"
              className="mt-5 overflow-hidden rounded-2xl border border-success/30 bg-success/5"
            >
              <div className="flex items-start gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-success/30 bg-success/15 text-emerald-400">
                  <IcoCheck />
                </span>
                <div className="flex-1">
                  <h3 className="font-display text-base font-bold text-emerald-300">
                    Tarjeta eliminada correctamente
                  </h3>
                  <p className="mt-1 text-sm text-text-muted">
                    La tarjeta {success.card.kind.toLowerCase()} ••••{" "}
                    {success.card.lastFour} fue retirada de tus tarjetas
                    vigentes.
                  </p>
                </div>
                <span className="rounded-full border border-border bg-purple-400/5 px-2.5 py-1 text-xs font-semibold text-text-muted">
                  Estado: Eliminada
                </span>
              </div>
              <div className="grid gap-px border-t border-success/15 bg-success/15 sm:grid-cols-4">
                <AuditCell label="Fecha y hora" value={success.timestamp} />
                <AuditCell
                  label="Tarjeta"
                  value={`•••• ${success.card.lastFour}`}
                />
                <AuditCell
                  label="Historial conservado"
                  value={`${success.card.historyCount} registros`}
                />
                <AuditCell
                  label="Referencia"
                  value={success.reference}
                  accent
                />
              </div>
            </section>
          )}

          <section className="mt-5 rounded-2xl border border-border bg-sidebar p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/15 text-purple-300">
                  <IcoDatabase />
                </span>
                <div>
                  <h2 className="font-display text-sm font-semibold text-text-secondary">
                    Registros conservados
                  </h2>
                  <p className="mt-1 text-xs text-text-muted">
                    Tarjetas eliminadas que ya no aparecen en tu listado
                    vigente.
                  </p>
                </div>
              </div>
              <span className="rounded-lg border border-border bg-purple-400/5 px-3 py-1.5 text-xs font-semibold text-text-muted">
                {deletedCards.length} eliminadas
              </span>
            </div>
          </section>
        </div>
      </main>

      {confirmationOpen && selectedCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="card-deletion-title"
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-danger/30 bg-surface shadow-2xl shadow-black/40">
            <div className="flex items-start gap-4 border-b border-border p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-danger/25 bg-danger/10 text-red-400">
                <IcoTrash />
              </span>
              <div className="flex-1">
                <h2
                  id="card-deletion-title"
                  className="font-display text-lg font-bold text-text-primary"
                >
                  Confirmar eliminación
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-text-muted">
                  La tarjeta •••• {selectedCard.lastFour} dejará de aparecer
                  entre tus tarjetas vigentes.
                </p>
              </div>
              <button
                type="button"
                onClick={cancelDeletion}
                disabled={deleting}
                aria-label="Cerrar confirmación"
                className="text-text-muted hover:text-text-secondary disabled:opacity-50"
              >
                <IcoClose />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-5 rounded-xl border border-border bg-purple-400/5 p-4">
                <ConfirmationRow
                  label="Tarjeta"
                  value={`${selectedCard.kind} •••• ${selectedCard.lastFour}`}
                />
                <ConfirmationRow
                  label="Movimientos pendientes"
                  value="Ninguno"
                  success
                />
                <ConfirmationRow
                  label="Historial"
                  value="Se conservará"
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
                  Confirmo que deseo dar de baja esta tarjeta y comprendo que
                  dejará de estar disponible.
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={cancelDeletion}
                  disabled={deleting}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-text-secondary hover:bg-purple-400/5 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDeletion}
                  disabled={!confirmationAccepted || deleting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-danger py-2.5 text-sm font-semibold text-white shadow-lg shadow-danger/20 hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-danger/35 disabled:text-white/50 disabled:shadow-none"
                >
                  {deleting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <IcoTrash />
                      Sí, eliminar
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

function StatusCell({
  label,
  value,
  valid,
}: {
  label: string
  value: string
  valid: boolean
}) {
  return (
    <div className="bg-sidebar p-4">
      <div className="mb-1 text-xs text-text-muted">{label}</div>
      <div
        className={`text-sm font-semibold ${
          valid ? "text-emerald-400" : "text-amber-400"
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function AuditCell({
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
        className={`mt-1 truncate text-xs font-semibold ${
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
