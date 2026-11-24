import { Suspense, lazy, type ReactNode } from "react"
import { Navigate, createBrowserRouter } from "react-router"
import LoginView from "./views/LoginView"
import { getSession, homeFor, type Rol } from "./shared/session"

const CustomerLookupView = lazy(() => import("./views/CustomerLookupView"))
const CustomerDeactivationView = lazy(() => import("./views/CustomerDeactivationView"))
const CustomerEditView = lazy(() => import("./views/CustomerEditView"))
const ManagerView = lazy(() => import("./views/ManagerView"))
const ActivityReportView = lazy(() => import("./views/ActivityReportView"))
const CardRequestsView = lazy(() => import("./views/CardRequestsView"))
const AccountDeactivationView = lazy(() => import("./views/AccountDeactivationView"))
const BalanceInquiryView = lazy(() => import("./views/BalanceInquiryView"))
const ClientView = lazy(() => import("./views/ClientView"))
const CreditCardView = lazy(() => import("./views/CreditCardView"))
const CardBlockingView = lazy(() => import("./views/CardBlockingView"))
const CardDeletionView = lazy(() => import("./views/CardDeletionView"))
const CardInquiryView = lazy(() => import("./views/CardInquiryView"))
const CardUnblockingView = lazy(() => import("./views/CardUnblockingView"))
const CredentialsView = lazy(() => import("./views/CredentialsView"))
const DebitCardView = lazy(() => import("./views/DebitCardView"))
const DepositView = lazy(() => import("./views/DepositView"))
const SessionLogoutView = lazy(() => import("./views/SessionLogoutView"))
const TransactionDetailView = lazy(() => import("./views/TransactionDetailView"))
const TransactionHistoryView = lazy(() => import("./views/TransactionHistoryView"))
const TransferView = lazy(() => import("./views/TransferView"))
const WithdrawView = lazy(() => import("./views/WithdrawView"))
const DeviceSessionView = lazy(() => import("./views/DeviceSessionView"))
const PasswordRecoveryView = lazy(() => import("./views/PasswordRecoveryView"))

function CargandoVista() {
  return (
    <div className="flex h-full items-center justify-center bg-bg-base">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-purple-400/20 border-t-purple-400" />
    </div>
  )
}

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<CargandoVista />}>{children}</Suspense>
}

function RoleRoute({ rol, children }: { rol: Rol; children: ReactNode }) {
  const session = getSession()
  if (!session) return <Navigate to="/login" replace />
  if (session.rol !== rol) return <Navigate to={homeFor(session.rol)} replace />
  return <Lazy>{children}</Lazy>
}

function GestorRoute({ children }: { children: ReactNode }) {
  return <RoleRoute rol="GESTOR">{children}</RoleRoute>
}

function UsuarioRoute({ children }: { children: ReactNode }) {
  return <RoleRoute rol="CLIENTE">{children}</RoleRoute>
}

function HomeRedirect() {
  const session = getSession()
  return <Navigate to={session ? homeFor(session.rol) : "/login"} replace />
}

export const router = createBrowserRouter([
  { path: "/", Component: HomeRedirect },
  { path: "/login", Component: LoginView },
  { path: "/recuperar-contrasena", element: <Lazy><PasswordRecoveryView /></Lazy> },
  { path: "/inicio", element: <UsuarioRoute><SessionLogoutView /></UsuarioRoute> },
  { path: "/cuentas/nueva", element: <UsuarioRoute><ClientView /></UsuarioRoute> },
  { path: "/cuentas/saldo", element: <UsuarioRoute><BalanceInquiryView /></UsuarioRoute> },
  { path: "/cuentas/historial", element: <UsuarioRoute><TransactionHistoryView /></UsuarioRoute> },
  { path: "/cuentas/transaccion", element: <UsuarioRoute><TransactionDetailView /></UsuarioRoute> },
  { path: "/tarjetas/debito", element: <UsuarioRoute><DebitCardView /></UsuarioRoute> },
  { path: "/tarjetas/credito", element: <UsuarioRoute><CreditCardView /></UsuarioRoute> },
  { path: "/tarjetas/consulta", element: <UsuarioRoute><CardInquiryView /></UsuarioRoute> },
  { path: "/tarjetas/bloqueo", element: <UsuarioRoute><CardBlockingView /></UsuarioRoute> },
  { path: "/tarjetas/desbloqueo", element: <UsuarioRoute><CardUnblockingView /></UsuarioRoute> },
  { path: "/tarjetas/eliminar", element: <UsuarioRoute><CardDeletionView /></UsuarioRoute> },
  { path: "/transferencias", element: <UsuarioRoute><TransferView /></UsuarioRoute> },
  { path: "/retiros", element: <UsuarioRoute><WithdrawView /></UsuarioRoute> },
  { path: "/consignaciones", element: <UsuarioRoute><DepositView /></UsuarioRoute> },
  { path: "/perfil/seguridad", element: <UsuarioRoute><CredentialsView /></UsuarioRoute> },
  { path: "/perfil/sesiones", element: <UsuarioRoute><DeviceSessionView /></UsuarioRoute> },
  { path: "/gestor/clientes", element: <GestorRoute><CustomerLookupView /></GestorRoute> },
  { path: "/gestor/clientes/nuevo", element: <GestorRoute><ManagerView /></GestorRoute> },
  { path: "/gestor/clientes/modificar", element: <GestorRoute><CustomerEditView /></GestorRoute> },
  { path: "/gestor/clientes/desactivar", element: <GestorRoute><CustomerDeactivationView /></GestorRoute> },
  { path: "/gestor/cuentas/desactivar", element: <GestorRoute><AccountDeactivationView /></GestorRoute> },
  { path: "/gestor/reportes/actividad", element: <GestorRoute><ActivityReportView /></GestorRoute> },
  { path: "/gestor/tarjetas/solicitudes", element: <GestorRoute><CardRequestsView /></GestorRoute> },
  { path: "*", Component: HomeRedirect },
])
