import { Navigate, createBrowserRouter } from "react-router"
import CustomerLookupView from "./views/CustomerLookupView"
import CustomerDeactivationView from "./views/CustomerDeactivationView"
import CustomerEditView from "./views/CustomerEditView"
import LoginView from "./views/LoginView"
import ManagerView from "./views/ManagerView"
import ActivityReportView from "./views/ActivityReportView"
import CardRequestsView from "./views/CardRequestsView"
import AccountDeactivationView from "./views/AccountDeactivationView"
import type { ReactNode } from "react"
import BalanceInquiryView from "./views/BalanceInquiryView"
import ClientView from "./views/ClientView"
import CreditCardView from "./views/CreditCardView"
import CardBlockingView from "./views/CardBlockingView"
import CardDeletionView from "./views/CardDeletionView"
import CardInquiryView from "./views/CardInquiryView"
import CardUnblockingView from "./views/CardUnblockingView"
import CredentialsView from "./views/CredentialsView"
import DebitCardView from "./views/DebitCardView"
import DepositView from "./views/DepositView"
import SessionLogoutView from "./views/SessionLogoutView"
import TransactionDetailView from "./views/TransactionDetailView"
import TransactionHistoryView from "./views/TransactionHistoryView"
import TransferView from "./views/TransferView"
import WithdrawView from "./views/WithdrawView"
import DeviceSessionView from "./views/DeviceSessionView"
import PasswordRecoveryView from "./views/PasswordRecoveryView"

function GestorRoute({ children }: { children: ReactNode }) {
  const role = window.localStorage.getItem("bancox-role")
  const token = window.localStorage.getItem("bancox-session-token")
  if (!token || role !== "GESTOR") {
    return <Navigate to="/login" replace />
  }
  return children
}

function UsuarioRoute({ children }: { children: ReactNode }) {
  const role = window.localStorage.getItem("bancox-role")
  const token = window.localStorage.getItem("bancox-session-token")
  if (!token || (role !== "GESTOR" && role !== "CLIENTE")) {
    return <Navigate to="/login" replace />
  }
  return children
}

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", Component: LoginView },
  { path: "/recuperar-contrasena", Component: PasswordRecoveryView },
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
  { path: "*", element: <Navigate to="/login" replace /> },
])
