import { useState } from "react";
import Sidebar from "../shared/Sidebar";
import { CLIENTES_CONSULTA } from "../shared/data";
import { apiRequest } from "../shared/api";
import {
  IcoAlert,
  IcoCard,
  IcoChevron,
  IcoClientes,
  IcoClock,
  IcoConfig,
  IcoCuentas,
  IcoDash,
  IcoInfo,
  IcoProductos,
  IcoReportes,
  IcoSearch,
  IcoShield,
  IcoTransfer,
  IcoUser,
} from "../shared/icons";

const MANAGER_NAV = [
  { id: "dashboard", label: "Panel Principal", icon: <IcoDash /> },
  { id: "clientes", label: "Clientes", icon: <IcoClientes /> },
  { id: "cuentas", label: "Cuentas", icon: <IcoCuentas /> },
  { id: "transacciones", label: "Transacciones", icon: <IcoTransfer /> },
  { id: "productos", label: "Productos", icon: <IcoProductos /> },
  { id: "reportes", label: "Reportes", icon: <IcoReportes /> },
  { id: "configuracion", label: "Configuración", icon: <IcoConfig /> },
];

type SearchState = "idle" | "loading" | "success" | "not-found";

type ApiCustomer = {
  id: number;
  idCliente: string;
  cedula: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  activo: boolean;
};

export default function CustomerLookupView() {
  const [activeNav, setActiveNav] = useState("clientes");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [state, setState] = useState<SearchState>("idle");
  const [lastQuery, setLastQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<(typeof CLIENTES_CONSULTA)[number] | null>(null);

  function handleChange(value: string) {
    setQuery(value);
    setError("");
    if (state !== "idle") setState("idle");
  }

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const value = query.trim().replace(/\s+/g, "");
    if (!/^[A-Za-z0-9-]{6,30}$/.test(value)) {
      setError("Ingrese una cédula o identificador válido");
      setState("idle");
      return;
    }

    setError("");
    setState("loading");
    setLastQuery(value);
    try {
      const customer = await apiRequest<ApiCustomer>(`/api/clientes/buscar/${encodeURIComponent(value)}`);
      const name = [customer.primerNombre, customer.segundoNombre, customer.primerApellido, customer.segundoApellido].filter(Boolean).join(" ");
      setSelectedCustomer({
        id: customer.idCliente,
        document: customer.cedula,
        formattedDocument: customer.cedula,
        name,
        initials: name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
        status: customer.activo ? "Activo" : "Inactivo",
        customerSince: "No disponible",
        personal: [
          { label: "Número de documento", value: customer.cedula },
          { label: "Correo electrónico", value: customer.email ?? "No disponible" },
          { label: "Teléfono", value: customer.telefono ?? "No disponible" },
          { label: "Ciudad", value: customer.ciudad ?? "No disponible" },
          { label: "Dirección", value: customer.direccion ?? "No disponible" },
        ],
        accounts: [],
        cards: [],
      });
      setState("success");
    } catch (caught) {
      setSelectedCustomer(null);
      setError(caught instanceof Error ? caught.message : "Cliente no encontrado");
      setState("not-found");
    }
  }

  function clearSearch() {
    setQuery("");
    setError("");
    setState("idle");
    setLastQuery("");
    setSelectedCustomer(null);
  }

  function useTestCustomer(document: string) {
    setQuery(document);
    setError("");
    setState("idle");
    setSelectedCustomer(null);
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
        <div className="px-8 py-5 flex items-center justify-between sticky top-0 z-10 bg-bg-base/95 border-b border-border backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Clientes</span><IcoChevron /><span className="text-text-secondary">Consultar cliente</span>
          </div>
          
        </div>

        <div className="px-8 py-7 max-w-6xl">
          <div className="flex items-end justify-between gap-6 mb-7">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md mb-2 inline-block bg-accent/15 text-purple-300 font-display">Gestión de clientes</span>
              <h1 className="text-2xl font-bold mb-1 text-text-primary font-display">Consulta de información del cliente</h1>
              <p className="text-sm text-text-muted">Busca por número de cédula o identificador único para consultar su perfil y productos asociados.</p>
            </div>
            <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-success/10 text-emerald-400 border border-success/25 text-xs">
              <IcoShield />
              Sesión segura
            </div>
          </div>

          <form onSubmit={handleSearch} noValidate className="rounded-2xl p-5 mb-5 bg-sidebar border border-border">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label htmlFor="customer-search" className="block text-xs font-semibold tracking-wide uppercase mb-2 text-purple-200 font-display">
                  Cédula o identificador del cliente
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"><IcoSearch /></span>
                  <input
                    id="customer-search"
                    value={query}
                    onChange={(event) => handleChange(event.target.value)}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "customer-search-error" : "customer-search-help"}
                    placeholder="Ej: 1020304050"
                    autoComplete="off"
                    className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none bg-purple-400/5 text-text-primary border transition-all focus:ring-4 focus:ring-purple-400/10 ${error ? "border-danger" : "border-border focus:border-purple-400/60"}`}
                  />
                </div>
                {error ? (
                  <span id="customer-search-error" className="flex items-center gap-1.5 text-xs mt-2 text-red-400"><IcoAlert />{error}</span>
                ) : (
                  <span id="customer-search-help" className="block text-xs mt-2 text-text-muted">Entre 6 y 20 caracteres. Se permiten letras, números y guiones.</span>
                )}
              </div>
              <button
                type="submit"
                disabled={state === "loading"}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-purple-600 to-accent shadow-lg shadow-purple-600/25 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0"
              >
                {state === "loading" ? (
                  <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Buscando...</>
                ) : (
                  <><IcoSearch />Buscar cliente</>
                )}
              </button>
            </div>
          </form>

          <div className="flex items-start gap-3 rounded-xl px-4 py-3.5 mb-6 bg-purple-400/5 border border-border">
            <span className="text-purple-300 shrink-0 mt-0.5"><IcoInfo /></span>
            <p className="text-xs text-text-muted leading-relaxed">
              Por seguridad, las credenciales y claves del cliente nunca se muestran. Cada consulta queda registrada automáticamente con el gestor, fecha y criterio utilizado.
            </p>
          </div>

          <div className="rounded-2xl p-5 mb-6 bg-sidebar border border-border">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <div className="text-sm font-semibold text-purple-200 font-display">Clientes de prueba</div>
                <p className="text-xs text-text-muted mt-1">Selecciona uno para completar la cédula y consultar su información.</p>
              </div>
              <span className="text-xs text-text-muted">{CLIENTES_CONSULTA.length} registros disponibles</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {CLIENTES_CONSULTA.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => useTestCustomer(customer.document)}
                  className="rounded-xl p-3 text-left bg-purple-400/5 border border-border transition-colors hover:bg-purple-400/10 hover:border-border-hover"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-600/20 text-xs font-bold text-purple-200 font-display">
                      {customer.initials}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-text-secondary">{customer.name}</span>
                      <span className="block mt-0.5 text-xs text-text-muted">CC {customer.document}</span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {state === "idle" && !error && (
            <div className="rounded-2xl py-14 px-6 flex flex-col items-center text-center bg-sidebar border border-border">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4 bg-purple-600/15 text-purple-300"><IcoUser /></div>
              <div className="text-base font-semibold text-text-secondary font-display">Busca un cliente para ver su información</div>
              <p className="text-sm text-text-muted mt-1 max-w-md">El resultado incluirá sus datos personales, estado actual, cuentas y tarjetas vinculadas.</p>
            </div>
          )}

          {state === "not-found" && (
            <div role="alert" className="rounded-2xl py-12 px-6 flex flex-col items-center text-center bg-sidebar border border-danger/25">
              <div className="flex items-center justify-center w-14 h-14 rounded-full mb-4 bg-danger/10 text-red-400"><IcoAlert /></div>
              <h2 className="text-lg font-bold text-text-primary font-display">Cliente no encontrado</h2>
              <p className="text-sm text-text-muted mt-1">No encontramos un cliente asociado a “{lastQuery}”. Verifica el dato e intenta nuevamente.</p>
              <button type="button" onClick={clearSearch} className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-purple-400/10 text-purple-200 border border-border hover:bg-purple-400/15">
                Realizar otra búsqueda
              </button>
            </div>
          )}

          {state === "success" && selectedCustomer && (
            <div className="flex flex-col gap-5">
              <div className="rounded-2xl p-6 bg-gradient-to-br from-purple-600/20 to-accent/5 border border-purple-400/30">
                <div className="flex items-center gap-5">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl text-lg font-bold bg-gradient-to-br from-purple-600 to-accent text-white font-display">{selectedCustomer.initials}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-text-primary font-display">{selectedCustomer.name}</h2>
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${selectedCustomer.status === "Activo" ? "bg-success/10 text-emerald-400 border-success/25" : "bg-warn/10 text-amber-400 border-warn/25"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${selectedCustomer.status === "Activo" ? "bg-success" : "bg-warn"}`} />{selectedCustomer.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                      <span>CC {selectedCustomer.formattedDocument}</span>
                      <span>ID {selectedCustomer.id}</span>
                      <span>Cliente desde {selectedCustomer.customerSince}</span>
                    </div>
                  </div>
                  <button type="button" onClick={clearSearch} className="px-4 py-2 rounded-lg text-xs font-semibold bg-purple-400/10 text-purple-200 border border-border hover:bg-purple-400/15">
                    Nueva consulta
                  </button>
                </div>
              </div>

              <section className="rounded-2xl p-6 bg-sidebar border border-border">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-purple-300"><IcoUser /></span>
                    <h2 className="text-sm font-semibold text-purple-200 font-display">Datos personales</h2>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-text-muted"><IcoShield />Información verificada</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5">
                  {selectedCustomer.personal.map((item) => (
                    <div key={item.label}>
                      <div className="text-xs text-text-muted mb-1">{item.label}</div>
                      <div className="text-sm font-medium text-text-secondary">{item.value}</div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <section className="rounded-2xl overflow-hidden bg-sidebar border border-border">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <span className="text-purple-300"><IcoCuentas /></span>
                      <h2 className="text-sm font-semibold text-purple-200 font-display">Cuentas</h2>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-md bg-purple-400/10 text-purple-300">{selectedCustomer.accounts.length} {selectedCustomer.accounts.length === 1 ? "producto" : "productos"}</span>
                  </div>
                  <div className="divide-y divide-border">
                    {selectedCustomer.accounts.map((account) => (
                      <div key={account.number} className="p-5 flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-600/15 text-purple-300"><IcoCuentas /></div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-text-secondary">{account.type}</div>
                          <div className="text-xs text-text-muted mt-0.5">{account.number}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-text-primary">{account.balance}</div>
                          <div className={`text-xs mt-0.5 ${account.status === "Activa" ? "text-emerald-400" : "text-amber-400"}`}>{account.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl overflow-hidden bg-sidebar border border-border">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <span className="text-purple-300"><IcoCard /></span>
                      <h2 className="text-sm font-semibold text-purple-200 font-display">Tarjetas</h2>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-md bg-purple-400/10 text-purple-300">{selectedCustomer.cards.length} {selectedCustomer.cards.length === 1 ? "producto" : "productos"}</span>
                  </div>
                  <div className="divide-y divide-border">
                    {selectedCustomer.cards.map((card) => (
                      <div key={card.number} className="p-5 flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-600/15 text-purple-300"><IcoCard /></div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-text-secondary">{card.type}</div>
                          <div className="text-xs text-text-muted mt-0.5">{card.number} · {card.detail}</div>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${card.status === "Activa" ? "bg-success/10 text-emerald-400 border-success/25" : "bg-warn/10 text-amber-400 border-warn/25"}`}>
                          {card.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="flex items-center gap-3 rounded-xl px-4 py-3.5 bg-success/5 border border-success/20">
                <span className="text-emerald-400"><IcoClock /></span>
                <div>
                  <div className="text-xs font-semibold text-emerald-400">Consulta registrada exitosamente</div>
                  <div className="text-xs text-text-muted mt-0.5">Auditoría asociada a Gestor Rodríguez · Criterio: {lastQuery} · Registro automático</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
