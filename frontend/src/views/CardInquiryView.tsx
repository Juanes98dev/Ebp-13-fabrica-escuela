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
  IcoCuentas,
  IcoDash,
  IcoExtractos,
  IcoEye,
  IcoInfo,
  IcoInversiones,
  IcoLock,
  IcoPagos,
  IcoPrestamos,
  IcoSearch,
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

type BankCard = {
  id: string
  kind: "Débito" | "Crédito"
  status: "Activa" | "Bloqueada"
  brand: string
  lastFour: string
  expires: string
  product: string
  associatedAccount: string
  accountType: string
  totalLimit?: number
  availableLimit?: number
  gradient: string
}

const CUSTOMER_CARDS: BankCard[] = [
  {
    id: "BX-TD-2841",
    kind: "Débito",
    status: "Activa",
    brand: "VISA",
    lastFour: "2841",
    expires: "08/29",
    product: "Débito Preferencial",
    associatedAccount: "301-847-2291-05",
    accountType: "Cuenta de ahorros",
    gradient: "from-[#4c1d95] via-[#6d28d9] to-[#a855f7]",
  },
  {
    id: "BX-TC-7164",
    kind: "Crédito",
    status: "Activa",
    brand: "MASTERCARD",
    lastFour: "7164",
    expires: "11/28",
    product: "Crédito Platinum",
    associatedAccount: "Producto de crédito independiente",
    accountType: "Tarjeta de crédito",
    totalLimit: 6_000_000,
    availableLimit: 4_650_000,
    gradient: "from-[#172554] via-[#312e81] to-[#6d28d9]",
  },
  {
    id: "BX-TC-9302",
    kind: "Crédito",
    status: "Bloqueada",
    brand: "VISA",
    lastFour: "9302",
    expires: "03/27",
    product: "Crédito Clásica",
    associatedAccount: "Producto de crédito independiente",
    accountType: "Tarjeta de crédito",
    totalLimit: 3_000_000,
    availableLimit: 1_200_000,
    gradient: "from-[#272334] via-[#3b3150] to-[#59416f]",
  },
]

type ViewState = "loading" | "found" | "not-found"

type ApiCard = {
  id: number
  numeroEnmascarado: string
  tipo: "DEBITO" | "CREDITO"
  estado: string
  cupoTotal?: number
  cupoDisponible?: number
  cuentaAsociada?: string
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value)
}

export default function CardInquiryView() {
  const [activeNav, setActiveNav] = useState("tarjetas")
  const [selectedId, setSelectedId] = useState(CUSTOMER_CARDS[0].id)
  const [query, setQuery] = useState("")
  const [viewState, setViewState] = useState<ViewState>("found")
  const [searchError, setSearchError] = useState("")
  const [lastQuery, setLastQuery] = useState("")
  const [elapsed, setElapsed] = useState("0.0 s")
  const [cards, setCards] = useState<BankCard[]>(CUSTOMER_CARDS)

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
            expires: "08/29",
            product: card.tipo === "CREDITO" ? "Tarjeta de crédito" : "Tarjeta de débito",
            associatedAccount: card.cuentaAsociada ?? "Producto independiente",
            accountType: card.tipo === "CREDITO" ? "Tarjeta de crédito" : "Cuenta asociada",
            totalLimit: card.cupoTotal,
            availableLimit: card.cupoDisponible,
            gradient: "from-[#4c1d95] via-[#6d28d9] to-[#a855f7]",
          }))
        setCards(loaded)
        if (loaded.length > 0) setSelectedId(loaded[0].id)
      })
      .catch(() => undefined)
  }, [])

  const selectedCard =
    cards.find((card) => card.id === selectedId) ?? null

  function displayCard(card: BankCard) {
    const startedAt = performance.now()
    setViewState("loading")
    setSearchError("")
    window.setTimeout(() => {
      setSelectedId(card.id)
      setViewState("found")
      setElapsed(`${((performance.now() - startedAt) / 1000).toFixed(1)} s`)
    }, 350)
  }

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault()
    const value = query.trim().toUpperCase()
    if (!/^(?:\d{4}|BX-T[DC]-\d{4})$/.test(value)) {
      setSearchError("Ingresa los últimos 4 dígitos o un identificador válido")
      return
    }

    const startedAt = performance.now()
    setSearchError("")
    setLastQuery(value)
    setViewState("loading")
    try {
      const card = cards.find(
        (item) => item.lastFour === value || item.id === value,
      )
      if (card) {
        const clienteId = window.localStorage.getItem("bancox-user-id")
        if (clienteId) {
          await apiRequest<ApiCard>(`/api/tarjetas/${card.id}?clienteId=${clienteId}`)
        }
        setSelectedId(card.id)
        setViewState("found")
        setElapsed(`${((performance.now() - startedAt) / 1000).toFixed(1)} s`)
      } else {
        setSelectedId("")
        setViewState("not-found")
      }
    } catch {
      setSelectedId("")
      setViewState("not-found")
    }
  }

  function resetInquiry() {
    setQuery("")
    setSearchError("")
    setLastQuery("")
    if (cards[0]) displayCard(cards[0])
  }

  const usedLimit =
    selectedCard?.kind === "Crédito" &&
    selectedCard.totalLimit !== undefined &&
    selectedCard.availableLimit !== undefined
      ? selectedCard.totalLimit - selectedCard.availableLimit
      : 0
  const usedPercentage =
    selectedCard?.totalLimit && usedLimit
      ? (usedLimit / selectedCard.totalLimit) * 100
      : 0

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
            <span className="text-text-secondary">Consultar tarjetas</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-lg border border-success/20 bg-success/10 px-3 py-1.5 text-xs text-emerald-400 sm:flex">
              <IcoShield /> Sesión segura
            </span>
            
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-8 py-7">
          <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <span className="mb-2 inline-block rounded-md bg-accent/15 px-2 py-1 font-display text-xs font-semibold uppercase tracking-wider text-purple-300">
                Mis productos
              </span>
              <h1 className="mb-1 font-display text-2xl font-bold text-text-primary">
                Consulta tus tarjetas
              </h1>
              <p className="max-w-2xl text-sm text-text-muted">
                Verifica los datos, el estado y la información financiera de tus
                tarjetas Banco X.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-sidebar px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600/15 text-purple-300">
                <IcoLock />
              </span>
              <div>
                <div className="text-xs font-semibold text-text-secondary">
                  Información protegida
                </div>
                <div className="mt-0.5 text-xs text-text-muted">
                  Los números siempre se muestran enmascarados
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSearch}
            noValidate
            className="mb-6 rounded-2xl border border-border bg-sidebar p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label
                  htmlFor="card-inquiry-search"
                  className="mb-2 block font-display text-xs font-semibold uppercase tracking-wide text-purple-200"
                >
                  Buscar una de mis tarjetas
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                    <IcoSearch />
                  </span>
                  <input
                    id="card-inquiry-search"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value)
                      setSearchError("")
                    }}
                    aria-invalid={Boolean(searchError)}
                    placeholder="Últimos 4 dígitos, ej: 2841"
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
                    Solo puedes consultar tarjetas asociadas a tu identidad.
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={viewState === "loading"}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-purple-600 to-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
              >
                <IcoSearch />
                Consultar
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuery("9999")
                  setSearchError("")
                }}
                className="rounded-xl border border-border bg-purple-400/5 px-4 py-3 text-sm font-semibold text-text-muted hover:bg-purple-400/10 hover:text-purple-200"
              >
                Probar no encontrada
              </button>
            </div>
          </form>

          <section className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-sm font-semibold text-purple-200">
                  Tarjetas asociadas a tu perfil
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  Selecciona una tarjeta para consultar su información.
                </p>
              </div>
              <span className="text-xs text-text-muted">
                {cards.length} productos
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => displayCard(card)}
                  disabled={viewState === "loading"}
                  aria-pressed={selectedCard?.id === card.id}
                  className={`rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 disabled:opacity-60 ${
                    selectedCard?.id === card.id && viewState === "found"
                      ? "border-purple-400/60 bg-purple-600/15"
                      : "border-border bg-sidebar hover:border-border-hover"
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
                        Tarjeta {card.kind}
                      </span>
                      <span className="mt-1 block text-xs text-text-muted">
                        **** **** **** {card.lastFour}
                      </span>
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        card.status === "Activa" ? "bg-success" : "bg-danger"
                      }`}
                    />
                  </div>
                </button>
              ))}
            </div>
          </section>

          {viewState === "loading" && (
            <div className="rounded-2xl border border-border bg-sidebar px-6 py-16 text-center">
              <span className="mx-auto mb-5 block h-10 w-10 animate-spin rounded-full border-4 border-purple-400/20 border-t-purple-400" />
              <h2 className="font-display text-base font-semibold text-text-secondary">
                Consultando información segura
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                Verificando que la tarjeta pertenezca a tu perfil...
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
                Tarjeta no encontrada
              </h2>
              <p className="mx-auto mt-1 max-w-lg text-sm text-text-muted">
                No existe una tarjeta terminada en “{lastQuery}” asociada a tu
                perfil.
              </p>
              <button
                type="button"
                onClick={resetInquiry}
                className="mt-5 rounded-xl border border-border bg-purple-400/10 px-5 py-2.5 text-sm font-semibold text-purple-200 hover:bg-purple-400/15"
              >
                Volver a mis tarjetas
              </button>
            </div>
          )}

          {viewState === "found" && selectedCard && (
            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <section className="rounded-2xl border border-border bg-sidebar p-6">
                <div
                  className={`relative mx-auto aspect-[1.58/1] max-w-md overflow-hidden rounded-2xl bg-gradient-to-br ${selectedCard.gradient} p-6 shadow-2xl shadow-black/35`}
                >
                  <span className="absolute -right-14 -top-16 h-48 w-48 rounded-full border border-white/10" />
                  <span className="absolute -bottom-24 -left-12 h-52 w-52 rounded-full bg-white/5" />
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
                      <div className="mb-5 flex items-center gap-2">
                        <span className="h-7 w-10 rounded bg-gradient-to-br from-amber-200 to-amber-500 opacity-90" />
                        {selectedCard.status === "Bloqueada" && (
                          <span className="flex items-center gap-1 rounded-full border border-white/15 bg-black/25 px-2.5 py-1 text-[10px] font-bold uppercase text-white">
                            <IcoLock /> Bloqueada
                          </span>
                        )}
                      </div>
                      <div className="font-display text-lg tracking-[0.18em] text-white">
                        **** **** **** {selectedCard.lastFour}
                      </div>
                      <div className="mt-5 flex items-end justify-between text-white/70">
                        <div>
                          <div className="text-[9px] uppercase tracking-wide">
                            Titular
                          </div>
                          <div className="mt-0.5 text-xs font-semibold tracking-wide text-white/95">
                            VALENTINA MORALES
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] uppercase">Vence</div>
                          <div className="mt-0.5 text-xs font-semibold text-white/95">
                            {selectedCard.expires}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-center gap-2 text-xs text-text-muted">
                  <IcoLock />
                  Número protegido mediante enmascaramiento
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-border bg-sidebar">
                <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-purple-600/10 to-transparent px-6 py-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-lg font-bold text-text-primary">
                        {selectedCard.product}
                      </h2>
                      <span
                        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          selectedCard.status === "Activa"
                            ? "border-success/25 bg-success/10 text-emerald-400"
                            : "border-danger/25 bg-danger/10 text-red-300"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            selectedCard.status === "Activa"
                              ? "bg-success"
                              : "bg-danger"
                          }`}
                        />
                        {selectedCard.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-text-muted">
                      Información actualizada · Consulta en {elapsed}
                    </p>
                  </div>
                  <span className="text-purple-300">
                    <IcoEye />
                  </span>
                </div>

                <div className="grid gap-px bg-border sm:grid-cols-2">
                  <InfoCell
                    label="Número de tarjeta"
                    value={`**** **** **** ${selectedCard.lastFour}`}
                    protectedValue
                  />
                  <InfoCell label="Tipo de tarjeta" value={selectedCard.kind} />
                  <InfoCell
                    label="Estado actual"
                    value={selectedCard.status}
                    status={selectedCard.status}
                  />
                  <InfoCell
                    label={
                      selectedCard.kind === "Débito"
                        ? "Cuenta asociada"
                        : "Tipo de producto"
                    }
                    value={
                      selectedCard.kind === "Débito"
                        ? selectedCard.associatedAccount
                        : selectedCard.accountType
                    }
                  />
                </div>

                {selectedCard.kind === "Débito" ? (
                  <div className="border-t border-border p-5">
                    <div className="flex items-start gap-3 rounded-xl border border-border bg-purple-400/5 p-4">
                      <span className="mt-0.5 text-purple-300">
                        <IcoCuentas />
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-text-secondary">
                          {selectedCard.accountType}
                        </div>
                        <p className="mt-1 text-xs text-text-muted">
                          Cuenta asociada terminada en{" "}
                          {selectedCard.associatedAccount.slice(-4)}. Las
                          compras se descuentan directamente de este producto.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-border p-5">
                    <div className="mb-4 grid gap-3 sm:grid-cols-2">
                      <LimitCard
                        label="Cupo total"
                        value={formatCurrency(selectedCard.totalLimit ?? 0)}
                      />
                      <LimitCard
                        label="Cupo disponible"
                        value={formatCurrency(selectedCard.availableLimit ?? 0)}
                        accent
                      />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-text-muted">Cupo utilizado</span>
                        <span className="font-semibold text-text-secondary">
                          {usedPercentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-purple-400/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-600 to-accent"
                          style={{ width: `${usedPercentage}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-text-muted">
                        Has utilizado {formatCurrency(usedLimit)} de tu cupo
                        total.
                      </p>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-border bg-purple-400/5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 text-purple-300">
                <IcoInfo />
              </span>
              <p className="text-xs leading-relaxed text-text-muted">
                Por tu seguridad, solo mostramos tarjetas vinculadas a tu perfil
                y nunca revelamos el número completo.
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 text-xs text-emerald-400">
              <IcoCheck /> Identidad verificada
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}

function InfoCell({
  label,
  value,
  protectedValue = false,
  status,
}: {
  label: string
  value: string
  protectedValue?: boolean
  status?: "Activa" | "Bloqueada"
}) {
  return (
    <div className="bg-sidebar p-5">
      <div className="mb-1.5 text-xs text-text-muted">{label}</div>
      <div
        className={`flex items-center gap-2 text-sm font-semibold ${
          status === "Activa"
            ? "text-emerald-400"
            : status === "Bloqueada"
              ? "text-red-300"
              : "text-text-secondary"
        }`}
      >
        {value}
        {protectedValue && (
          <span className="text-text-muted">
            <IcoLock />
          </span>
        )}
      </div>
    </div>
  )
}

function LimitCard({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="rounded-xl border border-border bg-purple-400/5 p-4">
      <div className="text-xs text-text-muted">{label}</div>
      <div
        className={`mt-1 font-display text-lg font-bold ${
          accent ? "text-emerald-400" : "text-text-primary"
        }`}
      >
        {value}
      </div>
    </div>
  )
}
