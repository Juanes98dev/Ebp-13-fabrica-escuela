import { useLocation, useNavigate } from "react-router"
import { useI18n } from "../i18n/I18nContext"
import {
  IcoAccountMinus,
  IcoCard,
  IcoClientes,
  IcoCuentas,
  IcoDash,
  IcoEdit,
  IcoExtractos,
  IcoEye,
  IcoLock,
  IcoLogout,
  IcoInbox,
  IcoReportes,
  IcoShield,
  IcoTransfer,
  IcoTrash,
  IcoUnlock,
  IcoUser,
  IcoUserMinus,
} from "./icons"

type SidebarProps = {
  navItems: { id: string; label: string; icon: React.ReactNode }[]
  activeNav: string
  onNav: (id: string) => void
  userLabel: string
  userSub: string
  userInitials: string
  badge?: React.ReactNode
}

export default function Sidebar({
  navItems,
  activeNav,
  onNav,
  userLabel,
  userSub,
  userInitials,
  badge,
}: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useI18n()
  const clientNav = [
    {
      id: "inicio",
      label: t("nav.home"),
      icon: <IcoDash />,
      route: "/inicio",
    },
    {
      id: "nueva-cuenta",
      label: t("nav.openAccount"),
      icon: <IcoCuentas />,
      route: "/cuentas/nueva",
    },
    {
      id: "saldo",
      label: t("nav.balance"),
      icon: <IcoCuentas />,
      route: "/cuentas/saldo",
    },
    {
      id: "historial",
      label: t("nav.history"),
      icon: <IcoExtractos />,
      route: "/cuentas/historial",
    },
    {
      id: "tarjeta-debito",
      label: t("nav.debitCard"),
      icon: <IcoCard />,
      route: "/tarjetas/debito",
    },
    {
      id: "tarjeta-credito",
      label: t("nav.creditCard"),
      icon: <IcoCard />,
      route: "/tarjetas/credito",
    },
    {
      id: "consultar-tarjetas",
      label: t("nav.cardInquiry"),
      icon: <IcoEye />,
      route: "/tarjetas/consulta",
    },
    {
      id: "bloquear-tarjeta",
      label: t("nav.cardBlocking"),
      icon: <IcoLock />,
      route: "/tarjetas/bloqueo",
    },
    {
      id: "desbloquear-tarjeta",
      label: t("nav.cardUnblocking"),
      icon: <IcoUnlock />,
      route: "/tarjetas/desbloqueo",
    },
    {
      id: "eliminar-tarjeta",
      label: t("nav.cardDeletion"),
      icon: <IcoTrash />,
      route: "/tarjetas/eliminar",
    },
    {
      id: "transferencias",
      label: t("nav.transfer"),
      icon: <IcoTransfer />,
      route: "/transferencias",
    },
    {
      id: "retiros",
      label: t("nav.withdraw"),
      icon: <IcoTransfer />,
      route: "/retiros",
    },
    {
      id: "consignaciones",
      label: t("nav.deposit"),
      icon: <IcoTransfer />,
      route: "/consignaciones",
    },
    {
      id: "seguridad",
      label: t("nav.security"),
      icon: <IcoLock />,
      route: "/perfil/seguridad",
    },
    {
      id: "sesiones",
      label: t("nav.sessions"),
      icon: <IcoShield />,
      route: "/perfil/sesiones",
    },
  ]
  const managerNav = [
    {
      id: "consultar-clientes",
      label: t("nav.customerInquiry"),
      icon: <IcoClientes />,
      route: "/gestor/clientes",
    },
    {
      id: "registrar-cliente",
      label: t("nav.customerRegistration"),
      icon: <IcoUser />,
      route: "/gestor/clientes/nuevo",
    },
    {
      id: "editar-cliente",
      label: t("nav.customerEdit"),
      icon: <IcoEdit />,
      route: "/gestor/clientes/modificar",
    },
    {
      id: "desactivar-cliente",
      label: t("nav.customerDeactivation"),
      icon: <IcoUserMinus />,
      route: "/gestor/clientes/desactivar",
    },
    {
      id: "desactivar-cuenta",
      label: t("nav.accountDeactivation"),
      icon: <IcoAccountMinus />,
      route: "/gestor/cuentas/desactivar",
    },
    {
      id: "solicitudes-tarjetas",
      label: t("nav.cardRequests"),
      icon: <IcoInbox />,
      route: "/gestor/tarjetas/solicitudes",
    },
    {
      id: "reportes-actividad",
      label: t("nav.reports"),
      icon: <IcoReportes />,
      route: "/gestor/reportes/actividad",
    },
  ]
  const routedItems =
    badge === "Banca Personal"
      ? clientNav
      : badge === "Plataforma Gestión"
        ? managerNav
        : navItems.map((item) => ({
            ...item,
            route: undefined as string | undefined,
          }))

  return (
    <aside
      className="flex flex-col w-60 shrink-0 overflow-y-auto"
      style={{
        background: "#0d0820",
        borderRight: "1px solid rgba(139,92,246,0.12)",
      }}
    >
      <div
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}
      >
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl font-bold text-sm"
          style={{
            background: "linear-gradient(135deg,#6d28d9,#a855f7)",
            fontFamily: "Instrument Sans,sans-serif",
            color: "#fff",
          }}
        >
          BX
        </div>
        <div>
          <div
            className="text-sm font-semibold leading-tight"
            style={{
              color: "#f1eeff",
              fontFamily: "Instrument Sans,sans-serif",
            }}
          >
            Banco X
          </div>
          <div className="text-xs" style={{ color: "#7c6fa0" }}>
            {badge}
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1">
        {routedItems.map((item) => {
          const active = item.route
            ? location.pathname === item.route
            : activeNav === item.id
          return (
            <button
              key={item.id}
              onClick={() => {
                onNav(item.id)
                if (item.route) navigate(item.route)
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left w-full transition-all duration-150"
              style={{
                background: active ? "rgba(109,40,217,0.22)" : "transparent",
                color: active ? "#c4b5fd" : "#7c6fa0",
                border: active
                  ? "1px solid rgba(139,92,246,0.2)"
                  : "1px solid transparent",
              }}
              onMouseEnter={(ev) => {
                if (!active) {
                  ev.currentTarget.style.background = "rgba(139,92,246,0.08)"
                  ev.currentTarget.style.color = "#a78bfa"
                }
              }}
              onMouseLeave={(ev) => {
                if (!active) {
                  ev.currentTarget.style.background = "transparent"
                  ev.currentTarget.style.color = "#7c6fa0"
                }
              }}
            >
              <span style={{ color: active ? "#a78bfa" : "inherit" }}>
                {item.icon}
              </span>
              <span data-i18n-ignore>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div
        className="px-4 py-4"
        style={{ borderTop: "1px solid rgba(139,92,246,0.1)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold shrink-0"
            style={{ background: "rgba(109,40,217,0.3)", color: "#c4b5fd" }}
          >
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-xs font-semibold truncate"
              style={{ color: "#e2d9f3" }}
            >
              {userLabel}
            </div>
            <div className="text-xs truncate" style={{ color: "#7c6fa0" }}>
              {userSub}
            </div>
          </div>
        </div>
        {badge === "Plataforma Gestión" && (
          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-xs font-semibold text-text-muted transition-colors hover:bg-purple-400/10 hover:text-purple-200"
          >
            <IcoLogout />
            <span data-i18n-ignore>{t("nav.logout")}</span>
          </button>
        )}
      </div>
    </aside>
  )
}
