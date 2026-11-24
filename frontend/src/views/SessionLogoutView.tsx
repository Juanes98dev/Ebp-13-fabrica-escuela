import { useEffect, useState } from "react";
import Sidebar from "../shared/Sidebar";
import {
  IcoAlert,
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
  IcoLogout,
  IcoPagos,
  IcoPrestamos,
  IcoShield,
  IcoTransfer,
  IcoUser,
} from "../shared/icons";
import { apiRequest } from "../shared/api";

const CLIENT_NAV = [
  { id: "inicio", label: "Inicio", icon: <IcoDash /> },
  { id: "cuentas", label: "Mis Cuentas", icon: <IcoCuentas /> },
  { id: "transferencias", label: "Transferencias", icon: <IcoTransfer /> },
  { id: "pagos", label: "Pagos", icon: <IcoPagos /> },
  { id: "prestamos", label: "Préstamos", icon: <IcoPrestamos /> },
  { id: "inversiones", label: "Inversiones", icon: <IcoInversiones /> },
  { id: "extractos", label: "Extractos", icon: <IcoExtractos /> },
  { id: "perfil", label: "Perfil y seguridad", icon: <IcoUser /> },
];

type SessionState = "active" | "logged-out" | "expired";

export default function SessionLogoutView() {
  const loggedName = window.localStorage.getItem("bancox-name") || "Cliente"
  const loggedInitials = loggedName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
  const loggedDocument = window.localStorage.getItem("bancox-user-id") || ""
  const [activeNav, setActiveNav] = useState("inicio");
  const [sessionState, setSessionState] = useState<SessionState>("active");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(600);
  const [protectedNotice, setProtectedNotice] = useState(false);

  useEffect(() => {
    if (sessionState !== "active") return;
    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setSessionState("expired");
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [sessionState]);

  useEffect(() => {
    if (sessionState !== "active") return;
    const recordActivity = () => setRemainingSeconds(600);
    window.addEventListener("pointerdown", recordActivity);
    window.addEventListener("keydown", recordActivity);
    return () => {
      window.removeEventListener("pointerdown", recordActivity);
      window.removeEventListener("keydown", recordActivity);
    };
  }, [sessionState]);

  useEffect(() => {
    const protectRoute = () => {
      if (sessionState !== "active") setProtectedNotice(true);
    };
    window.addEventListener("popstate", protectRoute);
    return () => window.removeEventListener("popstate", protectRoute);
  }, [sessionState]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  async function confirmLogout() {
    try {
      await apiRequest<{ mensaje: string }>("/api/auth/logout", { method: "POST" })
    } finally {
      window.localStorage.removeItem("bancox-session-token")
      window.localStorage.removeItem("bancox-user-id")
      window.localStorage.removeItem("bancox-role")
    }
    setShowLogoutConfirm(false);
    setSessionState("logged-out");
    setProtectedNotice(false);
    window.history.pushState({ authenticated: false }, "", window.location.href);
  }

  function simulateExpiredSession() {
    setShowLogoutConfirm(false);
    setRemainingSeconds(0);
    setSessionState("expired");
    setProtectedNotice(false);
  }

  function restoreSession() {
    setSessionState("active");
    setRemainingSeconds(600);
    setProtectedNotice(false);
    setActiveNav("inicio");
  }

  function tryProtectedRoute() {
    setProtectedNotice(true);
  }

  if (sessionState !== "active") {
    const expired = sessionState === "expired";
    return (
      <div className="min-h-full flex bg-bg-base">
        <aside className="hidden lg:flex lg:w-[42%] relative overflow-hidden flex-col justify-between p-10 bg-sidebar border-r border-border">
          <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl" />
          <div className="absolute -bottom-32 -right-24 w-96 h-96 rounded-full bg-accent/15 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-purple-600 to-accent font-display">BX</div>
            <div>
              <div className="text-base font-semibold text-text-primary font-display">Banco X</div>
              <div className="text-xs text-text-muted">Banca personal</div>
            </div>
          </div>
          <div className="relative max-w-md">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-6 bg-purple-600/15 text-purple-300"><IcoShield /></div>
            <h1 className="text-4xl font-bold leading-tight text-text-primary font-display">Tu seguridad es<br /><span className="text-purple-300">nuestra prioridad.</span></h1>
            <p className="text-sm leading-relaxed text-text-muted mt-4">Al finalizar tu sesión, Banco X invalida el token de acceso para proteger toda tu información financiera.</p>
            <div className="flex items-start gap-3 rounded-xl p-4 mt-8 bg-purple-400/5 border border-border">
              <span className="text-emerald-400 mt-0.5"><IcoCheck /></span>
              <div>
                <div className="text-xs font-semibold text-text-secondary">Token invalidado en el servidor</div>
                <div className="text-xs text-text-muted mt-1">Las páginas internas ya no pueden consultarse desde este dispositivo.</div>
              </div>
            </div>
          </div>
          <div className="relative text-xs text-text-muted">© 2026 Banco X · Conexión segura</div>
        </aside>

        <main className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <div className="flex lg:hidden items-center gap-3 mb-10">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-purple-600 to-accent font-display">BX</div>
              <div className="text-base font-semibold text-text-primary font-display">Banco X</div>
            </div>

            <div className="flex justify-end mb-6">
              
            </div>

            <div className={`flex items-start gap-4 rounded-2xl px-5 py-4 mb-6 ${expired ? "bg-warn/10 border border-warn/30" : "bg-success/10 border border-success/30"}`}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${expired ? "bg-warn/15 text-amber-400" : "bg-success/15 text-emerald-400"}`}>
                {expired ? <IcoClock /> : <IcoCheck />}
              </div>
              <div>
                <div className={`text-sm font-bold ${expired ? "text-amber-400" : "text-emerald-400"}`}>
                  {expired ? "Su sesión ha expirado, inicie sesión nuevamente" : "Sesión cerrada correctamente"}
                </div>
                <p className="text-xs text-text-muted mt-1">
                  {expired ? "Cerramos tu sesión después de 10 minutos sin actividad." : "Tu sesión fue invalidada y tu información permanece protegida."}
                </p>
              </div>
            </div>

            {protectedNotice && (
              <div role="alert" className="flex items-start gap-3 rounded-xl px-4 py-3.5 mb-5 bg-danger/10 border border-danger/25">
                <span className="text-red-400 mt-0.5"><IcoLock /></span>
                <div>
                  <div className="text-sm font-semibold text-red-400">Acceso protegido</div>
                  <div className="text-xs text-text-muted mt-1">La sesión ya no es válida. Debes iniciar sesión para acceder a páginas internas.</div>
                </div>
              </div>
            )}

            <div className="mb-8">
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-300 font-display">Banca personal</span>
              <h2 className="text-2xl font-bold text-text-primary font-display mt-2">Inicia sesión nuevamente</h2>
              <p className="text-sm text-text-muted mt-1">Accede de forma segura a tus productos Banco X.</p>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="session-username" className="block text-xs font-semibold tracking-wide uppercase mb-2 text-purple-200 font-display">Usuario</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"><IcoUser /></span>
                  <input id="session-username" defaultValue="valentina.morales" className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none bg-purple-400/5 text-text-primary border border-border focus:border-purple-400/60 focus:ring-4 focus:ring-purple-400/10" />
                </div>
              </div>
              <div>
                <label htmlFor="session-password" className="block text-xs font-semibold tracking-wide uppercase mb-2 text-purple-200 font-display">Contraseña</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"><IcoLock /></span>
                  <input id="session-password" type="password" placeholder="Ingresa tu contraseña" className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none bg-purple-400/5 text-text-primary border border-border focus:border-purple-400/60 focus:ring-4 focus:ring-purple-400/10" />
                </div>
              </div>
              <button type="button" onClick={restoreSession} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-purple-600 to-accent shadow-lg shadow-purple-600/25 transition-all hover:-translate-y-0.5">
                <IcoLock />Iniciar sesión
              </button>
            </div>

            <div className="flex items-center gap-2 my-6">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-text-muted">Validación de seguridad</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <button type="button" onClick={tryProtectedRoute} className="w-full py-2.5 rounded-xl text-xs font-semibold text-purple-300 border border-border hover:bg-purple-400/10">
              Intentar abrir “Mis cuentas” sin iniciar sesión
            </button>
            <p className="text-center text-xs text-text-muted mt-3">Simula el acceso mediante URL o el botón atrás del navegador.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-bg-base">
      <Sidebar
        navItems={CLIENT_NAV}
        activeNav={activeNav}
        onNav={setActiveNav}
        userLabel={loggedName}
        userSub={loggedDocument ? `Usuario ${loggedDocument}` : "Cliente"}
        userInitials={loggedInitials}
        badge="Banca Personal"
      />

      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-5 flex items-center justify-between sticky top-0 z-10 bg-bg-base/95 border-b border-border backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Banca personal</span><IcoChevron /><span className="text-text-secondary">Panel principal</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-400/5 border border-border">
              <span className="text-purple-300"><IcoClock /></span>
              <div>
                <div className="text-xs font-semibold text-text-secondary">Sesión activa</div>
                <div className="text-[10px] text-text-muted">Expira en {formattedTime}</div>
              </div>
            </div>
            <button type="button" onClick={() => setShowLogoutConfirm(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-muted border border-border hover:text-red-400 hover:border-danger/30 hover:bg-danger/5">
              <IcoLogout />Cerrar sesión
            </button>
          </div>
        </div>

        <div className="px-8 py-7 max-w-6xl">
          <div className="flex items-start justify-between gap-6 mb-7">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md mb-2 inline-block bg-purple-600/15 text-purple-300 font-display">Sesión protegida</span>
              <h1 className="text-2xl font-bold mb-1 text-text-primary font-display">Hola, {loggedName}</h1>
              <p className="text-sm text-text-muted">Administra tus productos financieros desde un entorno seguro.</p>
            </div>
            
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-2xl p-5 bg-gradient-to-br from-purple-600/25 to-accent/10 border border-purple-400/30">
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs text-purple-200">Saldo total</span>
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-400/15 text-purple-300"><IcoCuentas /></span>
              </div>
              <div className="text-2xl font-bold text-text-primary font-display">$ 6.070.500</div>
              <div className="text-xs text-text-muted mt-1">Disponible en 2 cuentas</div>
            </div>
            <div className="rounded-2xl p-5 bg-sidebar border border-border">
              <div className="text-xs text-text-muted mb-5">Último acceso</div>
              <div className="text-base font-semibold text-text-primary font-display">Hoy, 10:42 a. m.</div>
              <div className="text-xs text-emerald-400 mt-1">Dispositivo reconocido</div>
            </div>
            <div className="rounded-2xl p-5 bg-sidebar border border-border">
              <div className="text-xs text-text-muted mb-5">Seguridad de sesión</div>
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400"><IcoShield />Token activo</div>
              <div className="text-xs text-text-muted mt-1">Protegido mediante HTTPS</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
            <section className="rounded-2xl overflow-hidden bg-sidebar border border-border">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="text-sm font-semibold text-text-primary font-display">Mis cuentas</h2>
                  <p className="text-xs text-text-muted mt-0.5">Resumen de productos disponibles.</p>
                </div>
                <button type="button" className="text-xs font-semibold text-purple-300 hover:text-purple-200">Ver todas</button>
              </div>
              <div className="px-6 py-8 text-center text-sm text-text-muted">
                No hay cuentas cargadas para este usuario.
              </div>
            </section>

            <aside className="flex flex-col gap-4">
              <div className="rounded-2xl p-5 bg-sidebar border border-border">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl mb-4 bg-purple-600/15 text-purple-300"><IcoClock /></div>
                <h2 className="text-sm font-semibold text-text-primary font-display">Control de inactividad</h2>
                <p className="text-xs text-text-muted leading-relaxed mt-2">Por seguridad, cerraremos tu sesión después de 10 minutos sin actividad.</p>
                <div className="mt-4 p-3 rounded-xl bg-purple-400/5 border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">Tiempo restante</span>
                    <span className="text-lg font-bold text-purple-200 font-display">{formattedTime}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full mt-2 bg-purple-400/10 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-accent transition-all" style={{ width: `${(remainingSeconds / 600) * 100}%` }} />
                  </div>
                </div>
                <button type="button" onClick={() => setRemainingSeconds(600)} className="w-full mt-3 py-2 rounded-lg text-xs font-semibold text-purple-300 border border-border hover:bg-purple-400/10">Mantener sesión activa</button>
              </div>

              <button type="button" onClick={simulateExpiredSession} className="w-full p-4 rounded-xl text-left bg-warn/5 border border-warn/20 hover:bg-warn/10">
                <span className="flex items-center gap-2 text-xs font-semibold text-amber-400"><IcoClock />Simular 10 minutos sin actividad</span>
                <span className="block text-xs text-text-muted mt-1.5">Prueba el cierre automático de la sesión.</span>
              </button>
            </aside>
          </div>
        </div>
      </main>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="logout-title" className="relative w-full max-w-md rounded-2xl p-7 bg-surface border border-purple-400/30 shadow-2xl shadow-black/40">
            <button type="button" onClick={() => setShowLogoutConfirm(false)} aria-label="Cerrar confirmación" className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-purple-200 hover:bg-purple-400/10"><IcoClose /></button>
            <div className="flex items-center justify-center w-14 h-14 rounded-full mb-5 bg-purple-600/15 text-purple-300"><IcoLogout /></div>
            <h2 id="logout-title" className="text-xl font-bold text-text-primary font-display">¿Deseas cerrar sesión?</h2>
            <p className="text-sm text-text-muted leading-relaxed mt-2">Finalizaremos tu sesión e invalidaremos el token de acceso en el servidor. Tendrás que ingresar tus credenciales nuevamente.</p>
            <div className="flex items-start gap-2.5 rounded-xl p-3.5 mt-5 bg-purple-400/5 border border-border">
              <span className="text-purple-300 mt-0.5"><IcoInfo /></span>
              <p className="text-xs text-text-muted leading-relaxed">Esta acción protege tus cuentas si compartes este dispositivo con otras personas.</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-text-secondary border border-border hover:bg-purple-400/10">Cancelar</button>
              <button type="button" onClick={confirmLogout} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-purple-600 to-accent shadow-lg shadow-purple-600/25"><IcoLogout />Cerrar sesión</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
