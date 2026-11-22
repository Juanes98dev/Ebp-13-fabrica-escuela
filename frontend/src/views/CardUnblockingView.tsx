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
  IcoUnlock,
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

type BlockOrigin = "Cliente" | "Banco" | null

type BankCard = {
  id: string
  kind: "Débito" | "Crédito"
  status: "Activa" | "Bloqueada"
  blockOrigin: BlockOrigin
  lastFour: string
  brand: string
  product: string
  expires: string
  blockedAt?: string
  blockReason?: string
  gradient: string
}

const INITIAL_CARDS: BankCard[] = [
  {
    id: "unlock-debit-2841",
    kind: "Débito",
    status: "Bloqueada",
    blockOrigin: "Cliente",
    lastFour: "2841",
    brand: "VISA",
    product: "Débito Preferencial",
    expires: "08/29",
    blockedAt: "8 de febrero de 2026, 10:42 a. m.",
    blockReason: "Pérdida temporal",
    gradient: "from-[#4c1d95] via-[#6d28d9] to-[#a855f7]",
  },
  {
    id: "unlock-credit-9302",
    kind: "Crédito",
    status: "Bloqueada",
    blockOrigin: "Banco",
    lastFour: "9302",
    brand: "VISA",
    product: "Crédito Clásica",
    expires: "03/27",
    blockedAt: "5 de febrero de 2026, 4:18 p. m.",
    blockReason: "Validación preventiva del banco",
    gradient: "from-[#272334] via-[#3b3150] to-[#59416f]",
  },
  {
    id: "unlock-credit-7164",
    kind: "Crédito",
    status: "Activa",
    blockOrigin: null,
    lastFour: "7164",
    brand: "MASTERCARD",
    product: "Crédito Platinum",
    expires: "11/28",
    gradient: "from-[#172554] via-[#312e81] to-[#6d28d9]",
  },
]

type ApiCard = {
  id: number
  numeroEnmascarado: string
  tipo: "DEBITO" | "CREDITO"
  estado: string
  bloqueadaPor?: string
}

export default function CardUnblockingView() {
  const [activeNav, setActiveNav] = useState("tarjetas")
  const [cards, setCards] = useState(INITIAL_CARDS)
  const [selectedId, setSelectedId] = useState(INITIAL_CARDS[0].id)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [confirmationAccepted, setConfirmationAccepted] = useState(false)
  const [unblocking, setUnblocking] = useState(false)
  const [bankBlockedError, setBankBlockedError] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [success, setSuccess] = useState<{
    timestamp: string
    reference: string
    elapsed: string
    lastFour: string
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
            blockOrigin: card.estado === "bloqueada"
              ? card.bloqueadaPor === "gestor" ? "Banco" : "Cliente"
              : null,
            lastFour: card.numeroEnmascarado.slice(-4),
            brand: card.tipo === "CREDITO" ? "MASTERCARD" : "VISA",
            product: card.tipo === "CREDITO" ? "Tarjeta de crédito" : "Tarjeta de débito",
            expires: "08/29",
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
    setBankBlockedError(false)
    setCancelled(false)
    setSuccess(null)
  }

  function requestUnblocking() {
    if (selectedCard.status !== "Bloqueada") return
    setCancelled(false)
    setSuccess(null)

    if (selectedCard.blockOrigin === "Banco") {
      setBankBlockedError(true)
      return
    }

    setBankBlockedError(false)
    setConfirmationAccepted(false)
    setConfirmationOpen(true)
  }

  function cancelUnblocking() {
    setConfirmationOpen(false)
    setConfirmationAccepted(false)
    setCancelled(true)
  }

  async function confirmUnblocking() {
    if (!confirmationAccepted || unblocking) return
    const startedAt = performance.now()
    const cardLastFour = selectedCard.lastFour
    setUnblocking(true)
    try {
      await apiRequest<{ mensaje: string }>(`/api/tarjetas/${selectedCard.id}/desbloquear`, {
        method: "POST",
      })
      const now = new Date()
      setCards((current) =>
        current.map((card) =>
          card.id === selectedCard.id
            ? {
                ...card,
                status: "Activa",
                blockOrigin: null,
                blockedAt: undefined,
                blockReason: undefined,
              }
            : card,
        ),
      )
      setUnblocking(false)
      setConfirmationOpen(false)
      setConfirmationAccepted(false)
      setCancelled(false)
      setSuccess({
        timestamp: new Intl.DateTimeFormat("es-CO", {
          dateStyle: "long",
          timeStyle: "short",
        }).format(now),
        reference: `SEG-DES-${String(now.getTime()).slice(-7)}`,
        elapsed: `${((performance.now() - startedAt) / 1000).toFixed(1)} s`,
        lastFour: cardLastFour,
      })
    } catch (error) {
      setBankBlockedError(true)
      setUnblocking(false)
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
            <span className="text-text-secondary">Desbloquear tarjeta</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-lg border border-success/20 bg-success/10 px-3 py-1.5 text-xs text-emerald-400 sm:flex">
              <IcoShield /> Identidad verificada
            </span>
            <span className="rounded-lg border border-border bg-purple-600/15 px-3 py-1.5 text-xs text-purple-200">
              HU-02-03-06
            </span>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-8 py-7">
          <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <span className="mb-2 inline-block rounded-md bg-success/10 px-2 py-1 font-display text-xs font-semibold uppercase tracking-wider text-emerald-300">
                Seguridad de tarjetas
              </span>
              <h1 className="mb-1 font-display text-2xl font-bold text-text-primary">
                Desbloquear una tarjeta
              </h1>
              <p className="max-w-2xl text-sm text-text-muted">
                Reactiva una tarjeta que bloqueaste previamente para volver a
                utilizarla en tus transacciones.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-sidebar px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600/15 text-purple-300">
                <IcoClock />
              </span>
              <div>
                <div className="text-xs font-semibold text-text-secondary">
                  Cambio inmediato
                </div>
                <div className="mt-0.5 text-xs text-text-muted">
                  El estado se actualiza en menos de 3 segundos
                </div>
              </div>
            </div>
          </div>

          <section className="mb-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-sm font-semibold text-purple-200">
                  Selecciona una tarjeta
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  Solo se muestran tarjetas asociadas a tu perfil autenticado.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="rounded-lg bg-danger/10 px-2.5 py-1 text-xs text-red-300">
                  {cards.filter((card) => card.status === "Bloqueada").length}{" "}
                  bloqueadas
                </span>
                <span className="rounded-lg bg-success/10 px-2.5 py-1 text-xs text-emerald-400">
                  {cards.filter((card) => card.status === "Activa").length}{" "}
                  activas
                </span>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => selectCard(card)}
                  aria-pressed={selectedCard.id === card.id}
                  className={`rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 ${
                    selectedCard.id === card.id
                      ? "border-purple-400/60 bg-purple-600/15"
                      : "border-border bg-sidebar hover:border-border-hover"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-md`}
                    >
                      {card.status === "Bloqueada" ? <IcoLock /> : <IcoCard />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-text-secondary">
                        {card.kind} •••• {card.lastFour}
                      </span>
                      <span
                        className={`mt-1 block text-xs ${
                          card.status === "Bloqueada"
                            ? "text-red-300"
                            : "text-emerald-400"
                        }`}
                      >
                        {card.status}
                        {card.blockOrigin
                          ? ` · Por ${card.blockOrigin.toLowerCase()}`
                          : ""}
                      </span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-2xl border border-border bg-sidebar p-5">
              <div
                className={`relative mx-auto aspect-[1.58/1] max-w-sm overflow-hidden rounded-2xl bg-gradient-to-br ${selectedCard.gradient} p-5 shadow-2xl shadow-black/30`}
              >
                <span className="absolute -right-12 -top-14 h-40 w-40 rounded-full border border-white/10" />
                <span className="absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-white/5" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="font-display text-sm font-semibold text-white/90">
                      BANCO X
                    </span>
                    <span className="font-display text-xs font-bold tracking-wider text-white/90">
                      {selectedCard.brand}
                    </span>
                  </div>
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                      <span className="h-6 w-9 rounded bg-gradient-to-br from-amber-200 to-amber-500 opacity-90" />
                      <span
                        className={`flex items-center gap-1 rounded-full border border-white/15 px-2 py-1 text-[10px] font-bold uppercase text-white ${
                          selectedCard.status === "Bloqueada"
                            ? "bg-black/25"
                            : "bg-emerald-500/25"
                        }`}
                      >
                        {selectedCard.status === "Bloqueada" ? (
                          <IcoLock />
                        ) : (
                          <IcoCheck />
                        )}
                        {selectedCard.status}
                      </span>
                    </div>
                    <div className="font-display text-base tracking-[0.2em] text-white">
                      •••• {selectedCard.lastFour}
                    </div>
                    <div className="mt-4 flex items-end justify-between text-white/75">
                      <div>
                        <div className="text-[9px] uppercase">Titular</div>
                        <div className="mt-0.5 text-[10px] font-semibold text-white/95">
                          VALENTINA MORALES
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
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-text-muted">
                <IcoShield />
                Solo se muestran los últimos 4 dígitos
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-border bg-sidebar">
              <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-purple-600/10 to-transparent px-5 py-4">
                <div>
                  <h2 className="font-display text-base font-bold text-text-primary">
                    {selectedCard.product}
                  </h2>
                  <p className="mt-1 text-xs text-text-muted">
                    Tarjeta {selectedCard.kind.toLowerCase()} ••••{" "}
                    {selectedCard.lastFour}
                  </p>
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

              {selectedCard.status === "Bloqueada" ? (
                <div className="p-5">
                  <div className="mb-4 grid gap-3 sm:grid-cols-2">
                    <InfoCard
                      label="Bloqueada por"
                      value={
                        selectedCard.blockOrigin === "Banco"
                          ? "Banco X"
                          : CLIENTE_ACTIVO.nombre
                      }
                    />
                    <InfoCard
                      label="Fecha de bloqueo"
                      value={selectedCard.blockedAt ?? "No disponible"}
                    />
                  </div>
                  <div className="mb-5 rounded-xl border border-border bg-purple-400/5 p-4">
                    <div className="text-xs text-text-muted">
                      Motivo registrado
                    </div>
                    <div className="mt-1 text-sm font-semibold text-text-secondary">
                      {selectedCard.blockReason}
                    </div>
                  </div>

                  {selectedCard.blockOrigin === "Cliente" ? (
                    <div className="flex flex-col gap-4 rounded-xl border border-success/20 bg-success/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-emerald-400">
                          <IcoUnlock />
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-text-secondary">
                            Puedes reactivar esta tarjeta
                          </div>
                          <p className="mt-1 text-xs text-text-muted">
                            Volverá a admitir compras, pagos y retiros.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={requestUnblocking}
                        className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-purple-600 to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 hover:-translate-y-0.5"
                      >
                        <IcoUnlock />
                        Desbloquear tarjeta
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-warn/25 bg-warn/10 p-4">
                      <div className="mb-4 flex items-start gap-3">
                        <span className="mt-0.5 text-amber-400">
                          <IcoAlert />
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-amber-300">
                            Bloqueo preventivo del banco
                          </div>
                          <p className="mt-1 text-xs text-amber-100/65">
                            Este bloqueo requiere validación de identidad con un
                            gestor.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={requestUnblocking}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-warn/30 bg-warn/10 px-4 py-2.5 text-sm font-semibold text-amber-300 hover:bg-warn/15"
                      >
                        <IcoUnlock />
                        Intentar desbloqueo
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-5">
                  <div className="flex items-start gap-3 rounded-xl border border-success/25 bg-success/10 p-4">
                    <span className="mt-0.5 text-emerald-400">
                      <IcoCheck />
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-emerald-300">
                        La tarjeta está activa
                      </div>
                      <p className="mt-1 text-xs text-emerald-100/60">
                        Puede utilizarse normalmente. La opción de desbloquear
                        no está disponible para esta tarjeta.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          {bankBlockedError && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-4"
            >
              <span className="mt-0.5 shrink-0 text-red-400">
                <IcoAlert />
              </span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-red-300">
                  Esta tarjeta fue bloqueada por el banco, comuníquese con un
                  gestor
                </div>
                <p className="mt-1 text-xs text-red-200/65">
                  No se realizó ningún cambio. Comunícate con la línea de
                  atención de Banco X para validar el desbloqueo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBankBlockedError(false)}
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
                  Desbloqueo cancelado
                </div>
                <p className="mt-1 text-xs text-amber-100/65">
                  La tarjeta permanece bloqueada y no se realizaron cambios.
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
                    Tarjeta desbloqueada correctamente
                  </h3>
                  <p className="mt-1 text-sm text-text-muted">
                    La tarjeta •••• {success.lastFour} está activa y puede
                    volver a utilizarse.
                  </p>
                </div>
                <span className="rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                  {success.elapsed}
                </span>
              </div>
              <div className="grid gap-px border-t border-success/15 bg-success/15 sm:grid-cols-4">
                <AuditCell label="Fecha y hora" value={success.timestamp} />
                <AuditCell label="Usuario" value={CLIENTE_ACTIVO.nombre} />
                <AuditCell label="Nuevo estado" value="Activa" success />
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
              Por seguridad, solo puedes desbloquear tus propias tarjetas y
              aquellas que bloqueaste desde Banca Personal. Los desbloqueos
              quedan registrados.
            </p>
          </div>
        </div>
      </main>

      {confirmationOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="card-unblocking-title"
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-success/30 bg-surface shadow-2xl shadow-black/40">
            <div className="flex items-start gap-4 border-b border-border p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-success/25 bg-success/10 text-emerald-400">
                <IcoUnlock />
              </span>
              <div className="flex-1">
                <h2
                  id="card-unblocking-title"
                  className="font-display text-lg font-bold text-text-primary"
                >
                  Confirmar desbloqueo
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-text-muted">
                  La tarjeta •••• {selectedCard.lastFour} volverá a admitir
                  transacciones.
                </p>
              </div>
              <button
                type="button"
                onClick={cancelUnblocking}
                disabled={unblocking}
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
                <ConfirmationRow label="Estado actual" value="Bloqueada" />
                <ConfirmationRow
                  label="Nuevo estado"
                  value="Activa"
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
                  Confirmo que tengo la tarjeta en mi poder y deseo volver a
                  habilitarla para transacciones.
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={cancelUnblocking}
                  disabled={unblocking}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-text-secondary hover:bg-purple-400/5 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmUnblocking}
                  disabled={!confirmationAccepted || unblocking}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-purple-600 to-accent py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {unblocking ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Desbloqueando...
                    </>
                  ) : (
                    <>
                      <IcoUnlock />
                      Sí, desbloquear
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

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-purple-400/5 p-4">
      <div className="text-xs text-text-muted">{label}</div>
      <div className="mt-1 text-xs font-semibold text-text-secondary">
        {value}
      </div>
    </div>
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
