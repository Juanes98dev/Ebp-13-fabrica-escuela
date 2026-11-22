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
  IcoExtractos,
  IcoInfo,
  IcoInversiones,
  IcoLock,
  IcoPagos,
  IcoPrestamos,
  IcoShield,
  IcoTransfer,
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

type CardStatus = "Activa" | "Bloqueada"
type CardKind = "Crédito" | "Débito"

type BankCard = {
  id: string
  kind: CardKind
  status: CardStatus
  brand: string
  lastFour: string
  holder: string
  expires: string
  product: string
  detailLabel: string
  detailValue: string
  gradient: string
}

const INITIAL_CARDS: BankCard[] = [
  {
    id: "card-debit-2841",
    kind: "Débito",
    status: "Activa",
    brand: "VISA",
    lastFour: "2841",
    holder: "VALENTINA MORALES",
    expires: "08/29",
    product: "Cuenta de ahorros •••• 2291",
    detailLabel: "Disponible",
    detailValue: "$ 4.820.500",
    gradient: "from-[#4c1d95] via-[#6d28d9] to-[#a855f7]",
  },
  {
    id: "card-credit-7164",
    kind: "Crédito",
    status: "Activa",
    brand: "MASTERCARD",
    lastFour: "7164",
    holder: "VALENTINA MORALES",
    expires: "11/28",
    product: "Tarjeta Platinum",
    detailLabel: "Cupo disponible",
    detailValue: "$ 4.650.000",
    gradient: "from-[#172554] via-[#312e81] to-[#6d28d9]",
  },
  {
    id: "card-credit-9302",
    kind: "Crédito",
    status: "Bloqueada",
    brand: "VISA",
    lastFour: "9302",
    holder: "VALENTINA MORALES",
    expires: "03/27",
    product: "Tarjeta Clásica",
    detailLabel: "Cupo disponible",
    detailValue: "$ 1.200.000",
    gradient: "from-[#272334] via-[#302940] to-[#443653]",
  },
]

type BlockReason = "Pérdida" | "Robo" | "Sospecha de fraude"

type ApiCard = {
  id: number
  numeroEnmascarado: string
  tipo: "DEBITO" | "CREDITO"
  estado: string
  cupoDisponible?: number
}

export default function CardBlockingView() {
  const [activeNav, setActiveNav] = useState("tarjetas")
  const [cards, setCards] = useState(INITIAL_CARDS)
  const [selectedId, setSelectedId] = useState(INITIAL_CARDS[0].id)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [reason, setReason] = useState<BlockReason | "">("")
  const [blocking, setBlocking] = useState(false)
  const [success, setSuccess] = useState<{
    timestamp: string
    reference: string
    elapsed: string
    reason: BlockReason
  } | null>(null)
  const [transactionState, setTransactionState] =
    useState<"idle" | "testing" | "approved" | "rejected">("idle")
  const [cancelled, setCancelled] = useState(false)
  const [fieldError, setFieldError] = useState("")

  useEffect(() => {
    const clienteId = window.localStorage.getItem("bancox-user-id")
    if (!clienteId) return
    apiRequest<ApiCard[]>(`/api/tarjetas?clienteId=${clienteId}`)
      .then((apiCards) => {
        const loaded = apiCards
          .filter((card) => card.estado !== "eliminada")
          .map((card, index): BankCard => ({
            id: String(card.id),
            kind: card.tipo === "CREDITO" ? "Crédito" : "Débito",
            status: card.estado === "bloqueada" ? "Bloqueada" : "Activa",
            brand: index % 2 === 0 ? "VISA" : "MASTERCARD",
            lastFour: card.numeroEnmascarado.slice(-4),
            holder: CLIENTE_ACTIVO.nombre.toUpperCase(),
            expires: "08/29",
            product: card.tipo === "CREDITO" ? "Tarjeta de crédito" : "Tarjeta de débito",
            detailLabel: card.tipo === "CREDITO" ? "Cupo disponible" : "Disponible",
            detailValue: card.cupoDisponible != null
              ? new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(card.cupoDisponible)
              : "$ 0",
            gradient: "from-[#4c1d95] via-[#6d28d9] to-[#a855f7]",
          }))
        if (loaded.length > 0) {
          setCards(loaded)
          setSelectedId(loaded[0].id)
        }
      })
      .catch(() => undefined)
  }, [])

  const selectedCard = cards.find((card) => card.id === selectedId) ?? cards[0]

  function selectCard(card: BankCard) {
    setSelectedId(card.id)
    setSuccess(null)
    setTransactionState("idle")
    setCancelled(false)
  }

  function openConfirmation() {
    if (selectedCard.status === "Bloqueada") return
    setReason("")
    setSuccess(null)
    setCancelled(false)
    setConfirmationOpen(true)
  }

  function cancelBlocking() {
    setConfirmationOpen(false)
    setReason("")
    setCancelled(true)
  }

  async function confirmBlocking() {
    if (!reason || blocking) return
    const startedAt = performance.now()
    setBlocking(true)
    try {
      await apiRequest<{ mensaje: string }>(`/api/tarjetas/${selectedCard.id}/bloquear`, {
        method: "POST",
      })
      const now = new Date()
      setCards((current) =>
        current.map((card) =>
          card.id === selectedCard.id ? { ...card, status: "Bloqueada" } : card,
        ),
      )
      setBlocking(false)
      setConfirmationOpen(false)
      setSuccess({
        timestamp: new Intl.DateTimeFormat("es-CO", {
          dateStyle: "long",
          timeStyle: "short",
        }).format(now),
        reference: `SEG-TAR-${String(now.getTime()).slice(-7)}`,
        elapsed: `${((performance.now() - startedAt) / 1000).toFixed(1)} s`,
        reason,
      })
      setReason("")
      setTransactionState("idle")
    } catch (error) {
      setSuccess(null)
      setBlocking(false)
      setFieldError(error instanceof Error ? error.message : "No fue posible bloquear la tarjeta")
    }
  }

  function simulateTransaction() {
    setTransactionState("testing")
    window.setTimeout(() => {
      setTransactionState(
        selectedCard.status === "Bloqueada" ? "rejected" : "approved",
      )
    }, 500)
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
            <span className="text-text-secondary">Bloqueo de tarjeta</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-lg border border-success/20 bg-success/10 px-3 py-1.5 text-xs text-emerald-400 sm:flex">
              <IcoShield /> Sesión segura
            </span>
            <span className="rounded-lg border border-border bg-purple-600/15 px-3 py-1.5 text-xs text-purple-200">
              HU-02-03-03
            </span>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-8 py-7">
          <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <span className="mb-2 inline-block rounded-md bg-danger/10 px-2 py-1 font-display text-xs font-semibold uppercase tracking-wider text-red-300">
                Seguridad de tarjetas
              </span>
              <h1 className="mb-1 font-display text-2xl font-bold text-text-primary">
                Bloquear una tarjeta
              </h1>
              <p className="max-w-2xl text-sm text-text-muted">
                Protege tu dinero bloqueando de inmediato una tarjeta perdida,
                robada o con actividad sospechosa.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-sidebar px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600/15 text-purple-300">
                <IcoClock />
              </span>
              <div>
                <div className="text-xs font-semibold text-text-secondary">
                  Protección inmediata
                </div>
                <div className="mt-0.5 text-xs text-text-muted">
                  El bloqueo se aplica en menos de 2 segundos
                </div>
              </div>
            </div>
          </div>

          <section className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-sm font-semibold text-purple-200">
                  Selecciona una tarjeta
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  Consulta el estado y elige la tarjeta que deseas proteger.
                </p>
              </div>
              <span className="text-xs text-text-muted">
                {cards.length} tarjetas
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => selectCard(card)}
                  aria-pressed={selectedId === card.id}
                  className={`rounded-2xl border p-3 text-left transition-all ${
                    selectedId === card.id
                      ? "border-purple-400/60 bg-purple-600/10 shadow-lg shadow-purple-900/20"
                      : "border-border bg-sidebar hover:-translate-y-0.5 hover:border-border-hover"
                  }`}
                >
                  <div
                    className={`relative aspect-[1.58/1] overflow-hidden rounded-xl bg-gradient-to-br ${card.gradient} p-4 shadow-xl`}
                  >
                    <span className="absolute -right-10 -top-14 h-32 w-32 rounded-full border border-white/10" />
                    <span className="absolute -bottom-16 -left-8 h-36 w-36 rounded-full bg-white/5" />
                    <div className="relative flex h-full flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <span className="font-display text-xs font-semibold tracking-wide text-white/85">
                          BANCO X
                        </span>
                        <span className="font-display text-[10px] font-bold tracking-wider text-white/85">
                          {card.brand}
                        </span>
                      </div>
                      <div>
                        <div className="mb-3 flex items-center gap-2">
                          <span className="h-5 w-7 rounded bg-gradient-to-br from-amber-200 to-amber-500 opacity-85" />
                          {card.status === "Bloqueada" && (
                            <span className="flex items-center gap-1 rounded-full border border-white/15 bg-black/25 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">
                              <IcoLock /> Bloqueada
                            </span>
                          )}
                        </div>
                        <div className="font-display text-sm tracking-[0.18em] text-white">
                          •••• •••• •••• {card.lastFour}
                        </div>
                        <div className="mt-3 flex items-end justify-between text-white/70">
                          <div>
                            <div className="text-[8px] uppercase tracking-wide">
                              Titular
                            </div>
                            <div className="mt-0.5 text-[9px] font-semibold tracking-wide text-white/90">
                              {card.holder}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[8px] uppercase">Vence</div>
                            <div className="mt-0.5 text-[9px] font-semibold text-white/90">
                              {card.expires}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-1 pb-1 pt-3">
                    <span>
                      <span className="block text-xs font-semibold text-text-secondary">
                        Tarjeta {card.kind}
                      </span>
                      <span className="mt-0.5 block text-xs text-text-muted">
                        {card.product}
                      </span>
                    </span>
                    <span
                      className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${
                        card.status === "Activa"
                          ? "border-success/25 bg-success/10 text-emerald-400"
                          : "border-border bg-purple-400/5 text-text-muted"
                      }`}
                    >
                      {card.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-2xl border border-border bg-sidebar">
              <div className="flex flex-col gap-4 border-b border-border bg-gradient-to-r from-purple-600/10 to-transparent p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600/15 text-purple-300">
                    <IcoCard />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-sm font-semibold text-text-primary">
                        Tarjeta {selectedCard.kind} •••• {selectedCard.lastFour}
                      </h2>
                      <span
                        className={`h-2 w-2 rounded-full ${
                          selectedCard.status === "Activa"
                            ? "bg-success"
                            : "bg-danger"
                        }`}
                      />
                    </div>
                    <p className="mt-1 text-xs text-text-muted">
                      {selectedCard.product}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    selectedCard.status === "Activa"
                      ? "border-success/25 bg-success/10 text-emerald-400"
                      : "border-danger/25 bg-danger/10 text-red-300"
                  }`}
                >
                  {selectedCard.status}
                </span>
              </div>

              <div className="grid gap-px bg-border sm:grid-cols-3">
                <DetailCell label="Tipo de tarjeta" value={selectedCard.kind} />
                <DetailCell
                  label={selectedCard.detailLabel}
                  value={selectedCard.detailValue}
                />
                <DetailCell
                  label="Fecha de vencimiento"
                  value={selectedCard.expires}
                />
              </div>

              <div className="p-5">
                {selectedCard.status === "Activa" ? (
                  <div className="flex flex-col gap-4 rounded-xl border border-danger/20 bg-danger/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-red-400">
                        <IcoShield />
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-text-secondary">
                          ¿No reconoces tu tarjeta?
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-text-muted">
                          Bloquéala para impedir compras, retiros y pagos.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={openConfirmation}
                      className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-danger/40 bg-danger/15 px-5 py-2.5 text-sm font-semibold text-red-300 transition-all hover:bg-danger/25"
                    >
                      <IcoLock />
                      Bloquear tarjeta
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 rounded-xl border border-border bg-purple-400/5 p-4">
                    <span className="mt-0.5 text-text-muted">
                      <IcoLock />
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-text-secondary">
                        Esta tarjeta ya se encuentra bloqueada
                      </div>
                      <p className="mt-1 text-xs text-text-muted">
                        La opción de bloqueo no está disponible y la tarjeta no
                        puede procesar transacciones.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled
                      className="hidden cursor-not-allowed rounded-xl border border-border px-4 py-2 text-xs font-semibold text-text-muted opacity-50 sm:block"
                    >
                      Bloquear
                    </button>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-sidebar p-5">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/15 text-purple-300">
                  <IcoTransfer />
                </span>
                <div>
                  <h2 className="font-display text-sm font-semibold text-purple-200">
                    Validación de transacción
                  </h2>
                  <p className="mt-0.5 text-xs text-text-muted">
                    Comprueba el estado operativo de la tarjeta.
                  </p>
                </div>
              </div>

              <div className="mb-4 rounded-xl border border-border bg-purple-400/5 p-4">
                <div className="mb-3 flex items-center justify-between text-xs">
                  <span className="text-text-muted">Comercio</span>
                  <span className="font-semibold text-text-secondary">
                    Compra de prueba
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">Monto</span>
                  <span className="font-semibold text-text-primary">
                    $ 50.000
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={simulateTransaction}
                disabled={transactionState === "testing"}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-purple-400/10 px-4 py-2.5 text-sm font-semibold text-purple-200 transition-colors hover:bg-purple-400/15 disabled:opacity-60"
              >
                {transactionState === "testing" ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-purple-200/30 border-t-purple-200" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <IcoTransfer />
                    Simular transacción
                  </>
                )}
              </button>

              {transactionState === "rejected" && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4"
                >
                  <span className="mt-0.5 text-red-400">
                    <IcoAlert />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-red-300">
                      La tarjeta está bloqueada
                    </div>
                    <p className="mt-1 text-xs text-red-200/65">
                      Transacción rechazada. No se realizó ningún cargo.
                    </p>
                  </div>
                </div>
              )}

              {transactionState === "approved" && (
                <div
                  role="status"
                  className="mt-4 flex items-start gap-3 rounded-xl border border-success/25 bg-success/10 p-4"
                >
                  <span className="mt-0.5 text-emerald-400">
                    <IcoCheck />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-emerald-300">
                      Tarjeta disponible
                    </div>
                    <p className="mt-1 text-xs text-emerald-100/60">
                      La tarjeta puede procesar transacciones.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>

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
                  Bloqueo cancelado
                </div>
                <p className="mt-1 text-xs text-amber-100/65">
                  La tarjeta permanece activa y no se realizaron cambios.
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
                    Tarjeta bloqueada exitosamente
                  </h3>
                  <p className="mt-1 text-sm text-text-muted">
                    La tarjeta •••• {selectedCard.lastFour} ya no permite
                    compras, retiros ni pagos.
                  </p>
                </div>
                <span className="rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                  {success.elapsed}
                </span>
              </div>
              <div className="grid gap-px border-t border-success/15 bg-success/15 sm:grid-cols-4">
                <AuditCell label="Fecha y hora" value={success.timestamp} />
                <AuditCell label="Usuario" value={CLIENTE_ACTIVO.nombre} />
                <AuditCell label="Motivo" value={success.reason} />
                <AuditCell
                  label="Referencia"
                  value={success.reference}
                  accent
                />
              </div>
            </section>
          )}

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-purple-400/5 px-4 py-3.5">
            <span className="mt-0.5 shrink-0 text-purple-300">
              <IcoInfo />
            </span>
            <p className="text-xs leading-relaxed text-text-muted">
              El bloqueo es inmediato. Si recuperas tu tarjeta o necesitas una
              reposición, comunícate con la línea de atención de Banco X. Cada
              bloqueo queda registrado para tu seguridad.
            </p>
          </div>
        </div>
      </main>

      {confirmationOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="card-blocking-title"
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-danger/30 bg-surface shadow-2xl shadow-black/40">
            <div className="flex items-start gap-4 border-b border-border p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-danger/25 bg-danger/10 text-red-400">
                <IcoLock />
              </span>
              <div className="flex-1">
                <h2
                  id="card-blocking-title"
                  className="font-display text-lg font-bold text-text-primary"
                >
                  Confirmar bloqueo
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-text-muted">
                  La tarjeta {selectedCard.kind.toLowerCase()} ••••{" "}
                  {selectedCard.lastFour} dejará de procesar transacciones.
                </p>
              </div>
              <button
                type="button"
                onClick={cancelBlocking}
                aria-label="Cerrar confirmación"
                className="text-text-muted hover:text-text-secondary"
              >
                <IcoClose />
              </button>
            </div>
            <div className="p-6">
              <fieldset>
                <legend className="mb-3 font-display text-xs font-semibold uppercase tracking-wide text-purple-200">
                  Motivo del bloqueo
                </legend>
                <div className="mb-5 grid grid-cols-3 gap-2">
                  {([
                    "Pérdida",
                    "Robo",
                    "Sospecha de fraude",
                  ] as BlockReason[]).map((item) => (
                    <label
                      key={item}
                      className={`cursor-pointer rounded-xl border p-3 text-center text-xs font-semibold transition-colors ${
                        reason === item
                          ? "border-purple-400/60 bg-purple-600/20 text-purple-200"
                          : "border-border bg-purple-400/5 text-text-muted hover:bg-purple-400/10"
                      }`}
                    >
                      <input
                        type="radio"
                        name="block-reason"
                        value={item}
                        checked={reason === item}
                        onChange={() => setReason(item)}
                        className="sr-only"
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="mb-5 flex items-start gap-3 rounded-xl border border-warn/20 bg-warn/10 p-4">
                <span className="mt-0.5 text-amber-400">
                  <IcoAlert />
                </span>
                <p className="text-xs leading-relaxed text-amber-100/65">
                  Todas las compras, retiros y pagos serán rechazados de
                  inmediato.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={cancelBlocking}
                  disabled={blocking}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-text-secondary hover:bg-purple-400/5 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmBlocking}
                  disabled={!reason || blocking}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-danger py-2.5 text-sm font-semibold text-white shadow-lg shadow-danger/20 hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-danger/35 disabled:text-white/50 disabled:shadow-none"
                >
                  {blocking ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Bloqueando...
                    </>
                  ) : (
                    <>
                      <IcoLock />
                      Bloquear ahora
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

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-sidebar p-5">
      <div className="mb-1 text-xs text-text-muted">{label}</div>
      <div className="text-sm font-semibold text-text-secondary">{value}</div>
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
