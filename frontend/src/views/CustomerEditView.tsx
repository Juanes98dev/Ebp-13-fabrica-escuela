import { useMemo, useState } from "react"
import Sidebar from "../shared/Sidebar"
import { apiRequest } from "../shared/api"
import {
  IcoAlert,
  IcoCheck,
  IcoChevron,
  IcoClientes,
  IcoClock,
  IcoConfig,
  IcoCuentas,
  IcoDash,
  IcoEdit,
  IcoInfo,
  IcoLock,
  IcoMail,
  IcoProductos,
  IcoReportes,
  IcoSearch,
  IcoShield,
  IcoTransfer,
  IcoUser,
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

type ContactData = {
  email: string
  phone: string
  address: string
}

type Customer = ContactData & {
  id: string
  document: string
  name: string
  initials: string
  status: "Activo" | "Inactivo"
  city: string
}

type AuditEntry = {
  field: keyof ContactData
  previous: string
  next: string
}

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "BX-C10-20304050",
    document: "1020304050",
    name: "Laura Sofía Mendoza Ruiz",
    initials: "LM",
    status: "Activo",
    email: "laura.mendoza@email.com",
    phone: "+57 310 456 7890",
    address: "Carrera 18 # 82-45",
    city: "Bogotá D.C.",
  },
  {
    id: "BX-C79-45612308",
    document: "7945612308",
    name: "Carlos Andrés Herrera",
    initials: "CH",
    status: "Activo",
    email: "carlos.herrera@email.com",
    phone: "+57 315 204 1187",
    address: "Calle 10 # 34-21",
    city: "Medellín",
  },
  {
    id: "BX-C52-78903416",
    document: "5278903416",
    name: "Ana Lucía Torres",
    initials: "AT",
    status: "Inactivo",
    email: "ana.torres@email.com",
    phone: "+57 300 882 4071",
    address: "Avenida 6N # 24-18",
    city: "Cali",
  },
]

const FIELD_LABELS: Record<keyof ContactData, string> = {
  email: "Correo electrónico",
  phone: "Teléfono",
  address: "Dirección",
}

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
  telefono?: string
  direccion?: string
  ciudad?: string
  activo: boolean
}

export default function CustomerEditView() {
  const [activeNav, setActiveNav] = useState("clientes")
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS)
  const [query, setQuery] = useState("")
  const [searchError, setSearchError] = useState("")
  const [viewState, setViewState] = useState<ViewState>("idle")
  const [selectedId, setSelectedId] = useState("")
  const [lastQuery, setLastQuery] = useState("")
  const [form, setForm] = useState<ContactData>({
    email: "",
    phone: "",
    address: "",
  })
  const [original, setOriginal] = useState<ContactData>({
    email: "",
    phone: "",
    address: "",
  })
  const [errors, setErrors] = useState<Partial<ContactData>>({})
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<{
    timestamp: string
    elapsed: string
    entries: AuditEntry[]
  } | null>(null)

  const selectedCustomer =
    customers.find((customer) => customer.id === selectedId) ?? null

  const changes = useMemo(
    () =>
      (Object.keys(FIELD_LABELS) as keyof ContactData[])
        .filter((field) => form[field].trim() !== original[field].trim())
        .map((field) => ({
          field,
          previous: original[field],
          next: form[field].trim(),
        })),
    [form, original],
  )

  function loadCustomer(customer: Customer) {
    const contact = {
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    }
    setSelectedId(customer.id)
    setForm(contact)
    setOriginal(contact)
    setErrors({})
    setSuccess(null)
    setViewState("found")
  }

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault()
    const value = query.trim()
    if (!/^[A-Za-z0-9-]{6,20}$/.test(value)) {
      setSearchError("Ingrese una cédula o identificador válido")
      setViewState("idle")
      return
    }

    setSearchError("")
    setSuccess(null)
    setLastQuery(value)
    setViewState("loading")
    try {
      const customer = await apiRequest<ApiCustomer>(`/api/clientes/buscar/${encodeURIComponent(value)}`)
      const name = [customer.primerNombre, customer.segundoNombre, customer.primerApellido, customer.segundoApellido].filter(Boolean).join(" ")
      loadCustomer({
        id: String(customer.id),
        document: customer.cedula,
        name,
        initials: name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpper(),
        status: customer.activo ? "Activo" : "Inactivo",
        email: customer.email ?? "",
        phone: customer.telefono ?? "",
        address: customer.direccion ?? "",
        city: customer.ciudad ?? "",
      })
    } catch {
      setSelectedId("")
      setViewState("not-found")
    }
  }

  function selectExample(customer: Customer) {
    setQuery(customer.id)
    setSearchError("")
    loadCustomer(customer)
  }

  function resetSearch() {
    setQuery("")
    setSearchError("")
    setSelectedId("")
    setLastQuery("")
    setErrors({})
    setSuccess(null)
    setViewState("idle")
  }

  function updateField(field: keyof ContactData, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setSuccess(null)
  }

  function validate() {
    const nextErrors: Partial<ContactData> = {}
    const email = form.email.trim()
    const phoneDigits = form.phone.replace(/\D/g, "")

    if (!email) nextErrors.email = "El correo electrónico es obligatorio"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
      nextErrors.email = "Ingrese un correo electrónico válido"

    if (!form.phone.trim()) nextErrors.phone = "El teléfono es obligatorio"
    else if (
      !/^[+\d\s()-]+$/.test(form.phone.trim()) ||
      phoneDigits.length < 7 ||
      phoneDigits.length > 12
    )
      nextErrors.phone = "Ingrese un teléfono válido de 7 a 12 dígitos"

    if (!form.address.trim()) nextErrors.address = "La dirección es obligatoria"
    else if (form.address.trim().length < 8)
      nextErrors.address = "La dirección debe tener al menos 8 caracteres"

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function saveChanges(event: React.FormEvent) {
    event.preventDefault()
    if (!selectedCustomer || selectedCustomer.status !== "Activo") return
    if (!validate() || changes.length === 0) return

    const start = performance.now()
    const pendingChanges = changes
    setSaving(true)
    setSuccess(null)

    try {
      await apiRequest(`/api/clientes/${selectedCustomer.id}`, {
        method: "PUT",
        body: JSON.stringify({
          email: form.email.trim(),
          telefono: form.phone.trim(),
          direccion: form.address.trim(),
        }),
      })
      const updated = {
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      }
      setCustomers((current) =>
        current.map((customer) =>
          customer.id === selectedCustomer.id
            ? { ...customer, ...updated }
            : customer,
        ),
      )
      setOriginal(updated)
      setForm(updated)
      setSaving(false)
      setSuccess({
        timestamp: new Intl.DateTimeFormat("es-CO", {
          dateStyle: "long",
          timeStyle: "short",
        }).format(new Date()),
        elapsed: `${((performance.now() - start) / 1000).toFixed(1)} s`,
        entries: pendingChanges,
      })
    } catch (error) {
      setSaving(false)
      setSuccess(null)
      setErrors({ email: error instanceof Error ? error.message : "No fue posible actualizar los datos" })
    }
  }

  function discardChanges() {
    setForm(original)
    setErrors({})
    setSuccess(null)
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
            <span className="text-text-secondary">Modificar información</span>
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
              <span className="mb-2 inline-block rounded-md bg-accent/15 px-2 py-1 font-display text-xs font-semibold uppercase tracking-wider text-purple-300">
                Gestión de clientes
              </span>
              <h1 className="mb-1 font-display text-2xl font-bold text-text-primary">
                Modificar información del cliente
              </h1>
              <p className="max-w-2xl text-sm text-text-muted">
                Consulta un cliente activo y mantén actualizados sus datos de
                contacto.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-sidebar px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600/15 text-purple-300">
                <IcoClock />
              </span>
              <div>
                <div className="text-xs font-semibold text-text-secondary">
                  Actualización ágil
                </div>
                <div className="mt-0.5 text-xs text-text-muted">
                  Tiempo objetivo menor a 3 segundos
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
                  htmlFor="edit-customer-search"
                  className="mb-2 block font-display text-xs font-semibold uppercase tracking-wide text-purple-200"
                >
                  Cédula o identificador del cliente
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
                    <IcoSearch />
                  </span>
                  <input
                    id="edit-customer-search"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value)
                      setSearchError("")
                    }}
                    aria-invalid={Boolean(searchError)}
                    placeholder="Ej: BX-C10-20304050"
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
                    Busca por documento o por el identificador único de Banco X.
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
                    Consultando...
                  </>
                ) : (
                  <>
                    <IcoSearch />
                    Consultar cliente
                  </>
                )}
              </button>
            </div>
          </form>

          <section className="mb-6 rounded-2xl border border-border bg-sidebar p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-sm font-semibold text-purple-200">
                  Clientes de prueba
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  Selecciona un perfil para completar la consulta.
                </p>
              </div>
              <span className="text-xs text-text-muted">
                2 activos · 1 inactivo
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {customers.map((customer) => (
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
                          customer.status === "Activo"
                            ? "text-emerald-400"
                            : "text-text-muted"
                        }`}
                      >
                        {customer.status} · {customer.city}
                      </span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {viewState === "idle" && (
            <div className="rounded-2xl border border-border bg-sidebar px-6 py-12 text-center">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600/15 text-purple-300">
                <IcoEdit />
              </span>
              <h2 className="font-display text-base font-semibold text-text-secondary">
                Consulta un cliente para editar sus datos
              </h2>
              <p className="mx-auto mt-1 max-w-lg text-sm text-text-muted">
                Podrás actualizar correo, teléfono y dirección. Los datos de
                identificación permanecerán protegidos.
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
                No encontramos un cliente asociado a “{lastQuery}”.
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
              <section className="rounded-2xl border border-border bg-sidebar">
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
                    <p className="text-xs text-text-muted">
                      Perfil verificado · {selectedCustomer.city}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetSearch}
                    className="rounded-lg border border-border bg-purple-400/10 px-4 py-2 text-xs font-semibold text-purple-200 hover:bg-purple-400/15"
                  >
                    Cambiar cliente
                  </button>
                </div>

                {selectedCustomer.status === "Inactivo" ? (
                  <div className="m-6 flex items-start gap-3 rounded-xl border border-warn/25 bg-warn/10 p-4">
                    <span className="mt-0.5 text-amber-400">
                      <IcoAlert />
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-amber-300">
                        Cliente inactivo
                      </div>
                      <p className="mt-1 text-xs text-amber-100/65">
                        Solo es posible modificar la información de clientes
                        activos.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={saveChanges} noValidate className="p-6">
                    <div className="mb-6">
                      <div className="mb-4 flex items-center gap-2.5">
                        <span className="text-purple-300">
                          <IcoLock />
                        </span>
                        <div>
                          <h3 className="font-display text-sm font-semibold text-purple-200">
                            Datos de identificación
                          </h3>
                          <p className="mt-0.5 text-xs text-text-muted">
                            Estos campos están protegidos y no pueden
                            modificarse.
                          </p>
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <LockedField
                          label="Número de cédula"
                          value={selectedCustomer.document}
                        />
                        <LockedField
                          label="Identificador Banco X"
                          value={selectedCustomer.id}
                        />
                      </div>
                    </div>

                    <div className="border-t border-border pt-6">
                      <div className="mb-5 flex items-center gap-2.5">
                        <span className="text-purple-300">
                          <IcoUser />
                        </span>
                        <div>
                          <h3 className="font-display text-sm font-semibold text-purple-200">
                            Datos de contacto
                          </h3>
                          <p className="mt-0.5 text-xs text-text-muted">
                            Modifica uno o varios campos y guarda los cambios.
                          </p>
                        </div>
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <EditableField
                          id="customer-email"
                          label="Correo electrónico"
                          type="email"
                          value={form.email}
                          placeholder="nombre@correo.com"
                          error={errors.email}
                          onChange={(value) => updateField("email", value)}
                          icon={<IcoMail />}
                        />
                        <EditableField
                          id="customer-phone"
                          label="Teléfono"
                          type="tel"
                          value={form.phone}
                          placeholder="+57 300 000 0000"
                          error={errors.phone}
                          onChange={(value) => updateField("phone", value)}
                        />
                        <div className="sm:col-span-2">
                          <EditableField
                            id="customer-address"
                            label="Dirección"
                            value={form.address}
                            placeholder="Calle, número y complemento"
                            error={errors.address}
                            onChange={(value) => updateField("address", value)}
                          />
                        </div>
                      </div>
                    </div>

                    {changes.length > 0 && !success && (
                      <div className="mt-6 rounded-xl border border-purple-400/20 bg-purple-400/5 p-4">
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-purple-200">
                          <IcoInfo />
                          Resumen de cambios
                        </div>
                        <p className="text-xs text-text-muted">
                          Se actualizarán{" "}
                          {changes
                            .map((change) => FIELD_LABELS[change.field])
                            .join(", ")}
                          .
                        </p>
                      </div>
                    )}

                    {Object.keys(errors).length > 0 && (
                      <div
                        role="alert"
                        className="mt-6 flex items-start gap-3 rounded-xl border border-danger/25 bg-danger/10 p-4"
                      >
                        <span className="mt-0.5 text-red-400">
                          <IcoAlert />
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-red-300">
                            No fue posible guardar los cambios
                          </div>
                          <p className="mt-1 text-xs text-red-200/65">
                            Revisa los campos resaltados e intenta nuevamente.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-2 text-xs text-text-muted">
                        <IcoShield />
                        <span>
                          Cada modificación quedará registrada en auditoría.
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={discardChanges}
                          disabled={changes.length === 0 || saving}
                          className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-text-secondary hover:bg-purple-400/5 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Descartar
                        </button>
                        <button
                          type="submit"
                          disabled={changes.length === 0 || saving}
                          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-purple-600 to-accent px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          {saving ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <IcoCheck />
                              Guardar cambios
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </section>

              {success && (
                <section
                  role="status"
                  className="overflow-hidden rounded-2xl border border-success/30 bg-success/5"
                >
                  <div className="flex items-start gap-4 p-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-success/30 bg-success/15 text-emerald-400">
                      <IcoCheck />
                    </span>
                    <div className="flex-1">
                      <h3 className="font-display text-base font-bold text-emerald-300">
                        Datos actualizados correctamente
                      </h3>
                      <p className="mt-1 text-sm text-text-muted">
                        La información de contacto fue guardada y el cambio
                        quedó registrado.
                      </p>
                    </div>
                    <span className="rounded-full border border-success/20 bg-success/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                      {success.elapsed}
                    </span>
                  </div>

                  <div className="border-t border-success/15 px-5 py-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Registro de auditoría
                      </h4>
                      <span className="text-xs text-text-muted">
                        {success.timestamp} · Gestor Rodríguez
                      </span>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-border">
                      <div className="grid grid-cols-[0.8fr_1fr_1fr] gap-3 border-b border-border bg-purple-400/5 px-4 py-2.5 text-xs font-semibold text-text-muted">
                        <span>Campo</span>
                        <span>Valor anterior</span>
                        <span>Nuevo valor</span>
                      </div>
                      {success.entries.map((entry) => (
                        <div
                          key={entry.field}
                          className="grid grid-cols-[0.8fr_1fr_1fr] gap-3 border-b border-border px-4 py-3 text-xs last:border-b-0"
                        >
                          <span className="font-semibold text-text-secondary">
                            {FIELD_LABELS[entry.field]}
                          </span>
                          <span className="break-words text-text-muted">
                            {entry.previous}
                          </span>
                          <span className="break-words text-emerald-300">
                            {entry.next}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-2 block font-display text-xs font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </label>
      <div className="relative">
        <input
          value={value}
          readOnly
          aria-readonly="true"
          className="w-full cursor-not-allowed rounded-xl border border-border bg-black/15 px-4 py-3 pr-11 text-sm text-text-muted outline-none"
        />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted">
          <IcoLock />
        </span>
      </div>
      <span className="mt-1.5 block text-xs text-text-muted">
        Campo protegido
      </span>
    </div>
  )
}

function EditableField({
  id,
  label,
  type = "text",
  value,
  placeholder,
  error,
  onChange,
  icon,
}: {
  id: string
  label: string
  type?: string
  value: string
  placeholder: string
  error?: string
  onChange: (value: string) => void
  icon?: React.ReactNode
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block font-display text-xs font-semibold uppercase tracking-wide text-purple-200"
      >
        {label} <span className="text-accent">*</span>
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
            {icon}
          </span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-xl border bg-purple-400/5 px-4 py-3 text-sm text-text-primary outline-none transition-all focus:ring-4 focus:ring-purple-400/10 ${
            icon ? "pl-11" : ""
          } ${
            error
              ? "border-danger focus:border-danger"
              : "border-border focus:border-purple-400/60"
          }`}
        />
      </div>
      {error && (
        <span
          id={`${id}-error`}
          className="mt-2 flex items-center gap-1.5 text-xs text-red-400"
        >
          <IcoAlert />
          {error}
        </span>
      )}
    </div>
  )
}
