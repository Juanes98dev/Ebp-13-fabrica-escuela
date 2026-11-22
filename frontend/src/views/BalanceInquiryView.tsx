import { useEffect, useState } from "react";
import Sidebar from "../shared/Sidebar";
import { apiRequest } from "../shared/api";
import {
  IcoAlert,
  IcoCheck,
  IcoChevron,
  IcoClock,
  IcoCuentas,
  IcoDash,
  IcoExtractos,
  IcoInfo,
  IcoInversiones,
  IcoPagos,
  IcoPrestamos,
  IcoSearch,
  IcoShield,
  IcoTransfer,
} from "../shared/icons";
import { CLIENTE_ACTIVO } from "../shared/data";

const CLIENT_NAV = [
  { id: "inicio", label: "Inicio", icon: <IcoDash /> },
  { id: "cuentas", label: "Mis Cuentas", icon: <IcoCuentas /> },
  { id: "transferencias", label: "Transferencias", icon: <IcoTransfer /> },
  { id: "pagos", label: "Pagos", icon: <IcoPagos /> },
  { id: "prestamos", label: "Préstamos", icon: <IcoPrestamos /> },
  { id: "inversiones", label: "Inversiones", icon: <IcoInversiones /> },
  { id: "extractos", label: "Extractos", icon: <IcoExtractos /> },
];

const OWN_ACCOUNTS = [
  {
    number: "301-847-2291-05",
    type: "Cuenta de ahorros",
    balance: 250_000,
    lastTransaction: "Transferencia recibida",
    lastTransactionDate: "8 sep 2026, 2:23 p. m.",
  },
  {
    number: "501-293-8841-17",
    type: "Cuenta corriente",
    balance: 1_250_000,
    lastTransaction: "Pago de servicios",
    lastTransactionDate: "7 sep 2026, 9:10 a. m.",
  },
];

const FOREIGN_ACCOUNT = "301-002-4419-88";
type QueryStatus = "idle" | "loading" | "success" | "forbidden" | "not-found";

type ApiAccount = {
  numeroCuenta: string;
  tipo: "AHORROS" | "CORRIENTE";
  saldo: number;
  activa: boolean;
};

export default function BalanceInquiryView() {
  const [activeNav, setActiveNav] = useState("cuentas");
  const [accountNumber, setAccountNumber] = useState("");
  const [status, setStatus] = useState<QueryStatus>("idle");
  const [selectedAccount, setSelectedAccount] = useState<(typeof OWN_ACCOUNTS)[number] | null>(null);
  const [consultedAt, setConsultedAt] = useState("");
  const [validationError, setValidationError] = useState("");
  const [accounts, setAccounts] = useState<(typeof OWN_ACCOUNTS)[number][]>(OWN_ACCOUNTS);

  useEffect(() => {
    const clienteId = window.localStorage.getItem("bancox-user-id");
    if (!clienteId) return;
    apiRequest<ApiAccount[]>(`/api/cuentas/cliente/${clienteId}`)
      .then((loaded) => {
        setAccounts(loaded.filter((account) => account.activa).map((account) => ({
          number: account.numeroCuenta,
          type: account.tipo === "AHORROS" ? "Cuenta de ahorros" : "Cuenta corriente",
          balance: Number(account.saldo),
          lastTransaction: "Consulta disponible",
          lastTransactionDate: new Date().toLocaleString("es-CO"),
        })));
      })
      .catch(() => undefined);
  }, []);

  function selectOwnAccount(account: (typeof OWN_ACCOUNTS)[number]) {
    setAccountNumber(account.number);
    setSelectedAccount(null);
    setStatus("idle");
    setValidationError("");
  }

  function handleChange(value: string) {
    setAccountNumber(value);
    setStatus("idle");
    setSelectedAccount(null);
    setValidationError("");
  }

  async function consultBalance(event?: React.FormEvent) {
    event?.preventDefault();
    const normalized = accountNumber.trim();
    if (!/^\d{3}-\d{3}-\d{4}-\d{2}$/.test(normalized)) {
      setValidationError("Ingresa un número de cuenta válido");
      setStatus("idle");
      return;
    }

    setValidationError("");
    setStatus("loading");
    try {
      const account = await apiRequest<ApiAccount>(`/api/cuentas/${normalized}`);
      const ownAccount = accounts.find((item) => item.number === normalized);
      if (!ownAccount) {
        setStatus("forbidden");
      } else if (!account.activa) {
        setStatus("not-found");
      } else {
        setSelectedAccount({ ...ownAccount, balance: Number(account.saldo) });
        setConsultedAt(new Date().toLocaleString("es-CO", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }));
        setStatus("success");
      }
    } catch {
      setSelectedAccount(null);
      setStatus("not-found");
    }
  }

  function resetQuery() {
    setAccountNumber("");
    setStatus("idle");
    setSelectedAccount(null);
    setValidationError("");
  }

  return (
    <div className="flex h-full overflow-hidden bg-bg-base">
      <Sidebar
        navItems={CLIENT_NAV}
        activeNav={activeNav}
        onNav={setActiveNav}
        userLabel={CLIENTE_ACTIVO.nombre}
        userSub={`CC ${CLIENTE_ACTIVO.cedula}`}
        userInitials={CLIENTE_ACTIVO.iniciales}
        badge="Banca Personal"
      />

      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-5 flex items-center justify-between sticky top-0 z-10 bg-bg-base/95 border-b border-border backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Mis Cuentas</span><IcoChevron /><span className="text-text-secondary">Consultar saldo</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-success/10 text-emerald-400 border border-success/25"><IcoShield />Sesión verificada</span>
            <span className="px-3 py-1.5 rounded-lg text-xs bg-purple-600/15 text-purple-200 border border-border">HU-04-01-01</span>
          </div>
        </div>

        <div className="px-8 py-7 max-w-5xl">
          <div className="mb-7">
            <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md mb-2 inline-block bg-accent/15 text-purple-300 font-display">Información financiera</span>
            <h1 className="text-2xl font-bold mb-1 text-text-primary font-display">Consulta tu saldo disponible</h1>
            <p className="text-sm text-text-muted">Selecciona una de tus cuentas o ingresa su número para consultar el saldo actualizado.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_290px] gap-5">
            <div className="flex flex-col gap-5">
              <section className="rounded-2xl p-6 bg-sidebar border border-border">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-600/15 text-purple-300"><IcoCuentas /></div>
                  <div>
                    <h2 className="text-sm font-semibold text-text-primary font-display">Selecciona una cuenta</h2>
                    <p className="text-xs text-text-muted mt-0.5">Solo puedes consultar productos registrados a tu nombre.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                  {accounts.map((account) => {
                    const selected = accountNumber === account.number;
                    return (
                      <button
                        type="button"
                        key={account.number}
                        onClick={() => selectOwnAccount(account)}
                        className={`relative p-4 rounded-xl text-left border transition-all ${selected ? "bg-purple-600/15 border-purple-400/50 ring-4 ring-purple-400/5" : "bg-purple-400/5 border-border hover:border-purple-400/30"}`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className={`flex items-center justify-center w-9 h-9 rounded-lg ${selected ? "bg-purple-600/25 text-purple-200" : "bg-purple-400/10 text-text-muted"}`}><IcoCuentas /></span>
                          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-success" />Activa</span>
                        </div>
                        <div className="text-sm font-semibold text-text-secondary">{account.type}</div>
                        <div className="text-xs text-text-muted mt-1">{account.number}</div>
                        <div className={`absolute top-4 right-4 flex items-center justify-center w-5 h-5 rounded-full border-2 ${selected ? "bg-purple-600 border-purple-500" : "border-purple-400/25"}`}>
                          {selected && <span className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 mb-5">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-text-muted">o ingresa el número de cuenta</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <form onSubmit={consultBalance} noValidate>
                  <label htmlFor="balance-account" className="block text-xs font-semibold tracking-wide uppercase mb-2 text-purple-200 font-display">Número de cuenta</label>
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"><IcoSearch /></span>
                        <input
                          id="balance-account"
                          value={accountNumber}
                          onChange={(event) => handleChange(event.target.value)}
                          placeholder="Ej: 301-847-2291-05"
                          autoComplete="off"
                          aria-invalid={Boolean(validationError)}
                          className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none bg-purple-400/5 text-text-primary border transition-all focus:ring-4 focus:ring-purple-400/10 ${validationError ? "border-danger" : "border-border focus:border-purple-400/60"}`}
                        />
                      </div>
                      {validationError ? (
                        <span className="flex items-center gap-1.5 text-xs mt-2 text-red-400"><IcoAlert />{validationError}</span>
                      ) : (
                        <span className="block text-xs mt-2 text-text-muted">Formato: 000-000-0000-00</span>
                      )}
                    </div>
                    <button type="submit" disabled={status === "loading"} className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-purple-600 to-accent shadow-lg shadow-purple-600/25 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0">
                      {status === "loading" ? <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Consultando...</> : <><IcoSearch />Consultar saldo</>}
                    </button>
                  </div>
                </form>
              </section>

              {status === "success" && selectedAccount && (
                <section className="rounded-2xl overflow-hidden bg-sidebar border border-purple-400/30">
                  <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-600/20 to-accent/5 border-b border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400"><IcoCheck /></span>
                      <span className="text-sm font-semibold text-text-primary font-display">Saldo consultado correctamente</span>
                    </div>
                    <button type="button" onClick={resetQuery} className="text-xs font-semibold text-purple-300 hover:text-purple-200">Nueva consulta</button>
                  </div>
                  <div className="p-6">
                    <div className="flex items-end justify-between gap-5 pb-6 border-b border-border">
                      <div>
                        <div className="text-xs text-text-muted">Saldo disponible</div>
                        <div className="text-4xl font-bold text-text-primary font-display mt-2">$ {selectedAccount.balance.toLocaleString("es-CO")}</div>
                        <div className="text-xs text-text-muted mt-2">Pesos colombianos</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-text-secondary">{selectedAccount.type}</div>
                        <div className="text-xs text-text-muted mt-1">{selectedAccount.number}</div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/10 text-emerald-400 border border-success/20 mt-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-success" />Cuenta activa
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5">
                      <div className="rounded-xl p-4 bg-purple-400/5 border border-border">
                        <div className="flex items-center gap-2 text-xs text-text-muted"><IcoClock />Fecha y hora de consulta</div>
                        <div className="text-sm font-medium text-text-secondary mt-2">{consultedAt}</div>
                      </div>
                      <div className="rounded-xl p-4 bg-purple-400/5 border border-border">
                        <div className="flex items-center gap-2 text-xs text-text-muted"><IcoCheck />Última transacción confirmada</div>
                        <div className="text-sm font-medium text-text-secondary mt-2">{selectedAccount.lastTransaction}</div>
                        <div className="text-xs text-text-muted mt-1">{selectedAccount.lastTransactionDate}</div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {(status === "forbidden" || status === "not-found") && (
                <div role="alert" className="rounded-2xl py-9 px-6 flex flex-col items-center text-center bg-sidebar border border-danger/25">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full mb-4 bg-danger/10 text-red-400">
                    {status === "forbidden" ? <IcoShield /> : <IcoAlert />}
                  </div>
                  <h2 className="text-lg font-bold text-text-primary font-display">
                    {status === "forbidden" ? "No tiene permisos para consultar esta cuenta" : "Cuenta no encontrada"}
                  </h2>
                  <p className="text-sm text-text-muted mt-1 max-w-md">
                    {status === "forbidden" ? "Por seguridad, solo puedes consultar cuentas registradas a tu nombre." : "No encontramos una cuenta asociada al número ingresado. Verifica los datos e intenta nuevamente."}
                  </p>
                  <button type="button" onClick={resetQuery} className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold text-purple-200 border border-border hover:bg-purple-400/10">Realizar otra consulta</button>
                </div>
              )}
            </div>

            <aside className="flex flex-col gap-4">
              <div className="rounded-2xl p-5 bg-sidebar border border-border">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl mb-4 bg-success/10 text-emerald-400"><IcoShield /></div>
                <h2 className="text-sm font-semibold text-text-primary font-display">Consulta protegida</h2>
                <p className="text-xs text-text-muted leading-relaxed mt-2">Validamos que la cuenta pertenezca a tu perfil antes de mostrar cualquier información financiera.</p>
              </div>

              <div className="rounded-2xl p-5 bg-sidebar border border-border">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl mb-4 bg-purple-600/15 text-purple-300"><IcoCheck /></div>
                <h2 className="text-sm font-semibold text-text-primary font-display">Saldo actualizado</h2>
                <p className="text-xs text-text-muted leading-relaxed mt-2">El saldo refleja todos los movimientos confirmados hasta el momento de la consulta.</p>
              </div>

              <div className="rounded-xl p-4 bg-purple-400/5 border border-border">
                <div className="flex items-start gap-2.5">
                  <span className="text-purple-300 mt-0.5"><IcoInfo /></span>
                  <div className="text-xs text-text-muted leading-relaxed">
                    <span className="font-semibold text-purple-200">Datos para probar:</span><br />
                    Cuenta propia: <span className="text-text-secondary">301-847-2291-05</span><br />
                    Cuenta ajena: <span className="text-text-secondary">301-002-4419-88</span><br />
                    No encontrada: <span className="text-text-secondary">999-999-9999-99</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
