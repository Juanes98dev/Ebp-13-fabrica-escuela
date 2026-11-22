import { Navigate, createBrowserRouter } from "react-router"
import BalanceInquiryView from "./views/BalanceInquiryView"
import AccountDeactivationView from "./views/AccountDeactivationView"
import ClientView from "./views/ClientView"
import CreditCardView from "./views/CreditCardView"
import CardBlockingView from "./views/CardBlockingView"
import CardDeletionView from "./views/CardDeletionView"
import CardInquiryView from "./views/CardInquiryView"
import CardUnblockingView from "./views/CardUnblockingView"
import CredentialsView from "./views/CredentialsView"
import CustomerLookupView from "./views/CustomerLookupView"
import CustomerDeactivationView from "./views/CustomerDeactivationView"
import CustomerEditView from "./views/CustomerEditView"
import DebitCardView from "./views/DebitCardView"
import DepositView from "./views/DepositView"
import LoginView from "./views/LoginView"
import ManagerView from "./views/ManagerView"
import ActivityReportView from "./views/ActivityReportView"
import CardRequestsView from "./views/CardRequestsView"
import SessionLogoutView from "./views/SessionLogoutView"
import TransactionDetailView from "./views/TransactionDetailView"
import TransactionHistoryView from "./views/TransactionHistoryView"
import TransferView from "./views/TransferView"
import WithdrawView from "./views/WithdrawView"
import DeviceSessionView from "./views/DeviceSessionView"
import PasswordRecoveryView from "./views/PasswordRecoveryView"

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", Component: LoginView },
  { path: "/recuperar-contrasena", Component: PasswordRecoveryView },
  { path: "/inicio", Component: SessionLogoutView },
  { path: "/cuentas/nueva", Component: ClientView },
  { path: "/cuentas/saldo", Component: BalanceInquiryView },
  { path: "/cuentas/historial", Component: TransactionHistoryView },
  { path: "/cuentas/transaccion", Component: TransactionDetailView },
  { path: "/tarjetas/debito", Component: DebitCardView },
  { path: "/tarjetas/credito", Component: CreditCardView },
  { path: "/tarjetas/bloqueo", Component: CardBlockingView },
  { path: "/tarjetas/eliminar", Component: CardDeletionView },
  { path: "/tarjetas/consulta", Component: CardInquiryView },
  { path: "/tarjetas/desbloqueo", Component: CardUnblockingView },
  { path: "/transferencias", Component: TransferView },
  { path: "/retiros", Component: WithdrawView },
  { path: "/consignaciones", Component: DepositView },
  { path: "/perfil/seguridad", Component: CredentialsView },
  { path: "/perfil/sesiones", Component: DeviceSessionView },
  { path: "/gestor/clientes", Component: CustomerLookupView },
  { path: "/gestor/clientes/nuevo", Component: ManagerView },
  { path: "/gestor/clientes/modificar", Component: CustomerEditView },
  { path: "/gestor/clientes/desactivar", Component: CustomerDeactivationView },
  { path: "/gestor/cuentas/desactivar", Component: AccountDeactivationView },
  { path: "/gestor/reportes/actividad", Component: ActivityReportView },
  { path: "/gestor/tarjetas/solicitudes", Component: CardRequestsView },
  { path: "*", element: <Navigate to="/login" replace /> },
])
