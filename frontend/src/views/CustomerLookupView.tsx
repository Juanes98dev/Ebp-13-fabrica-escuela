import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import Sidebar from "../shared/Sidebar";
import { ApiError, apiRequest, errorMessage } from "../shared/api";
import { etiquetaTipoCuenta, fmtCOP, fmtFechaLarga } from "../shared/helpers";
import { getSession, initials } from "../shared/session";
import { ESTADO_TARJETA, etiquetaTipoTarjeta } from "../shared/tarjetas";
import type { ClienteApi, CuentaApi, TarjetaApi } from "../shared/types";
import {
  IcoAlert,
  IcoCard,
  IcoChevron,
  IcoClock,
  IcoCuentas,
  IcoInfo,
  IcoSearch,
  IcoShield,
  IcoUser,
} from "../shared/icons";

type SearchState = "idle" | "loading" | "success" | "not-found" | "error";

type Resultado = {
  cliente: ClienteApi;
  cuentas: CuentaApi[];
  tarjetas: TarjetaApi[];
};

const PATRON_CRITERIO = /^[A-Za-z0-9-]{6,30}$/;

function normalizarCriterio(valor: string) {
  return valor.trim().replace(/\s+/g, "");
}

export default function CustomerLookupView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("cedula") ?? "");
  const [error, setError] = useState("");
  const [state, setState] = useState<SearchState>("idle");
  const [lastQuery, setLastQuery] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const gestor = getSession()?.nombre ?? "Gestor";

  const buscar = useCallback(async (valor: string) => {
    setError("");
    setState("loading");
    setLastQuery(valor);
    try {
      const cliente = await apiRequest<ClienteApi>(`/api/clientes/buscar/${encodeURIComponent(valor)}`);
      const [cuentas, tarjetas] = await Promise.all([
        apiRequest<CuentaApi[]>(`/api/cuentas/cliente/${cliente.id}`),
        apiRequest<TarjetaApi[]>(`/api/tarjetas?clienteId=${cliente.id}`),
      ]);
      setResultado({ cliente, cuentas, tarjetas: tarjetas.filter((t) => t.estado !== "eliminada") });
      setState("success");
    } catch (caught) {
      setResultado(null);
      if (caught instanceof ApiError && caught.status === 404) {
        setState("not-found");
      } else {
        setError(errorMessage(caught, "No fue posible consultar el cliente"));
        setState("error");
      }
    }
  }, []);

  const cedulaParam = searchParams.get("cedula");
  useEffect(() => {
    if (cedulaParam && PATRON_CRITERIO.test(normalizarCriterio(cedulaParam))) {
      void buscar(normalizarCriterio(cedulaParam));
    }
  }, [cedulaParam, buscar]);

  function handleChange(value: string) {
    setQuery(value);
    setError("");
    if (state !== "idle" && state !== "success") setState("idle");
  }

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const value = normalizarCriterio(query);
    if (!PATRON_CRITERIO.test(value)) {
      setError("Ingrese una cédula o identificador válido");
      return;
    }
    if (value === cedulaParam) {
      void buscar(value);
    } else {
      setSearchParams({ cedula: value });
    }
  }

  function clearSearch() {
    setQuery("");
    setError("");
    setState("idle");
    setLastQuery("");
    setResultado(null);
    setSearchParams({});
  }

  const cliente = resultado?.cliente;
  const datosPersonales = cliente
    ? [
        { label: "Número de documento", value: cliente.cedula },
        { label: "Correo electrónico", value: cliente.email ?? "No registrado" },
        { label: "Teléfono", value: cliente.telefono ?? "No registrado" },
        { label: "Fecha de nacimiento", value: fmtFechaLarga(cliente.fechaNacimiento) },
        { label: "Ciudad", value: cliente.ciudad ?? "No registrada" },
        { label: "Departamento", value: cliente.departamento ?? "No registrado" },
        { label: "Dirección", value: cliente.direccion ?? "No registrada" },
      ]
    : [];

  return (
    <div className="flex h-full overflow-hidden bg-bg-base">
      <Sidebar variant="gestor" />

      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-5 flex items-center justify-between sticky top-0 z-10 bg-bg-base/95 border-b border-border backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Clientes</span><IcoChevron /><span className="text-text-secondary">Consultar cliente</span>
          </div>
          <Link to="/gestor/clientes/nuevo" className="px-4 py-2 rounded-lg text-xs font-semibold bg-purple-400/10 text-purple-200 border border-border hover:bg-purple-400/15">
            Registrar cliente
          </Link>
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
                    placeholder="Ej: 1020304050 o BX-..."
                    autoComplete="off"
                    className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none bg-purple-400/5 text-text-primary border transition-all focus:ring-4 focus:ring-purple-400/10 ${error ? "border-danger" : "border-border focus:border-purple-400/60"}`}
                  />
                </div>
                {error ? (
                  <span id="customer-search-error" className="flex items-center gap-1.5 text-xs mt-2 text-red-400"><IcoAlert />{error}</span>
                ) : (
                  <span id="customer-search-help" className="block text-xs mt-2 text-text-muted">Entre 6 y 30 caracteres. Se permiten letras, números y guiones.</span>
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

          {state === "idle" && (
            <div className="rounded-2xl py-14 px-6 flex flex-col items-center text-center bg-sidebar border border-border">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4 bg-purple-600/15 text-purple-300"><IcoUser /></div>
              <div className="text-base font-semibold text-text-secondary font-display">Busca un cliente para ver su información</div>
              <p className="text-sm text-text-muted mt-1 max-w-md">El resultado incluirá sus datos personales, estado actual, cuentas y tarjetas vinculadas.</p>
            </div>
          )}

          {(state === "not-found" || state === "error") && (
            <div role="alert" className="rounded-2xl py-12 px-6 flex flex-col items-center text-center bg-sidebar border border-danger/25">
              <div className="flex items-center justify-center w-14 h-14 rounded-full mb-4 bg-danger/10 text-red-400"><IcoAlert /></div>
              <h2 className="text-lg font-bold text-text-primary font-display">
                {state === "not-found" ? "Cliente no encontrado" : "No fue posible completar la consulta"}
              </h2>
              <p className="text-sm text-text-muted mt-1">
                {state === "not-found"
                  ? `No encontramos un cliente asociado a “${lastQuery}”. Verifica el dato e intenta nuevamente.`
                  : "Intenta nuevamente en unos segundos."}
              </p>
              <div className="flex gap-3 mt-5">
                {state === "error" && (
                  <button type="button" onClick={() => void buscar(lastQuery)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-purple-600 to-accent">
                    Reintentar
                  </button>
                )}
                <button type="button" onClick={clearSearch} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-purple-400/10 text-purple-200 border border-border hover:bg-purple-400/15">
                  Realizar otra búsqueda
                </button>
              </div>
            </div>
          )}

          {state === "success" && resultado && cliente && (
            <div className="flex flex-col gap-5">
              <div className="rounded-2xl p-6 bg-gradient-to-br from-purple-600/20 to-accent/5 border border-purple-400/30">
                <div className="flex items-center gap-5">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl text-lg font-bold bg-gradient-to-br from-purple-600 to-accent text-white font-display">{initials(cliente.nombreCompleto)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-text-primary font-display">{cliente.nombreCompleto}</h2>
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cliente.activo ? "bg-success/10 text-emerald-400 border-success/25" : "bg-warn/10 text-amber-400 border-warn/25"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cliente.activo ? "bg-success" : "bg-warn"}`} />{cliente.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                      <span data-i18n-ignore>CC {cliente.cedula}</span>
                      <span data-i18n-ignore>ID {cliente.idCliente}</span>
                      <span>Cliente desde {fmtFechaLarga(cliente.fechaRegistro)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {cliente.activo && (
                      <>
                        <Link to={`/gestor/clientes/modificar?cedula=${encodeURIComponent(cliente.cedula)}`} className="px-4 py-2 rounded-lg text-xs font-semibold text-center text-white bg-gradient-to-br from-purple-600 to-accent">
                          Modificar datos
                        </Link>
                        <Link to={`/gestor/clientes/desactivar?cedula=${encodeURIComponent(cliente.cedula)}`} className="px-4 py-2 rounded-lg text-xs font-semibold text-center bg-danger/10 text-red-300 border border-danger/25 hover:bg-danger/15">
                          Desactivar cliente
                        </Link>
                      </>
                    )}
                    <button type="button" onClick={clearSearch} className="px-4 py-2 rounded-lg text-xs font-semibold bg-purple-400/10 text-purple-200 border border-border hover:bg-purple-400/15">
                      Nueva consulta
                    </button>
                  </div>
                </div>
              </div>

              <section className="rounded-2xl p-6 bg-sidebar border border-border">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-purple-300"><IcoUser /></span>
                    <h2 className="text-sm font-semibold text-purple-200 font-display">Datos personales</h2>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5">
                  {datosPersonales.map((item) => (
                    <div key={item.label}>
                      <div className="text-xs text-text-muted mb-1">{item.label}</div>
                      <div className="text-sm font-medium text-text-secondary break-words">{item.value}</div>
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
                    <span className="text-xs px-2 py-1 rounded-md bg-purple-400/10 text-purple-300">{resultado.cuentas.length} {resultado.cuentas.length === 1 ? "producto" : "productos"}</span>
                  </div>
                  {resultado.cuentas.length === 0 ? (
                    <p className="p-5 text-sm text-text-muted">El cliente no tiene cuentas registradas.</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {resultado.cuentas.map((cuenta) => (
                        <div key={cuenta.numeroCuenta} className="p-5 flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-600/15 text-purple-300"><IcoCuentas /></div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-text-secondary">{etiquetaTipoCuenta(cuenta.tipo)}</div>
                            <div className="text-xs text-text-muted mt-0.5" data-i18n-ignore>{cuenta.numeroCuenta}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-text-primary">{fmtCOP(cuenta.saldo)}</div>
                            <div className={`text-xs mt-0.5 ${cuenta.activa ? "text-emerald-400" : "text-amber-400"}`}>{cuenta.activa ? "Activa" : "Inactiva"}</div>
                            {cuenta.activa && (
                              <Link to={`/gestor/cuentas/desactivar?numero=${encodeURIComponent(cuenta.numeroCuenta)}`} className="text-xs text-red-300 hover:underline">
                                Desactivar
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-2xl overflow-hidden bg-sidebar border border-border">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <span className="text-purple-300"><IcoCard /></span>
                      <h2 className="text-sm font-semibold text-purple-200 font-display">Tarjetas</h2>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-md bg-purple-400/10 text-purple-300">{resultado.tarjetas.length} {resultado.tarjetas.length === 1 ? "producto" : "productos"}</span>
                  </div>
                  {resultado.tarjetas.length === 0 ? (
                    <p className="p-5 text-sm text-text-muted">El cliente no tiene tarjetas vigentes ni solicitudes.</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {resultado.tarjetas.map((tarjeta) => (
                        <div key={tarjeta.id} className="p-5 flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-600/15 text-purple-300"><IcoCard /></div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-text-secondary">{etiquetaTipoTarjeta(tarjeta.tipo)}</div>
                            <div className="text-xs text-text-muted mt-0.5">
                              <span data-i18n-ignore>{tarjeta.numeroEnmascarado}</span>
                              {" · "}
                              {tarjeta.tipo === "CREDITO"
                                ? `Cupo ${fmtCOP(tarjeta.cupoTotal ?? 0)}`
                                : tarjeta.cuentaAsociada ?? "Sin cuenta asociada"}
                            </div>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ESTADO_TARJETA[tarjeta.estado].clase}`}>
                            {ESTADO_TARJETA[tarjeta.estado].label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <div className="flex items-center gap-3 rounded-xl px-4 py-3.5 bg-success/5 border border-success/20">
                <span className="text-emerald-400"><IcoClock /></span>
                <div>
                  <div className="text-xs font-semibold text-emerald-400">Consulta registrada en auditoría</div>
                  <div className="text-xs text-text-muted mt-0.5">Gestor {gestor} · Criterio: {lastQuery}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
