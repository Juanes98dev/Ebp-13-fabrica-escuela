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

function GestorRoute({ children }: { children: ReactNode }) {
  const role = window.localStorage.getItem("bancox-role")
  const token = window.localStorage.getItem("bancox-session-token")
  if (!token || role !== "GESTOR") {
    return <Navigate to="/login" replace />
  }
  return children
}

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", Component: LoginView },
  { path: "/gestor/clientes", element: <GestorRoute><CustomerLookupView /></GestorRoute> },
  { path: "/gestor/clientes/nuevo", element: <GestorRoute><ManagerView /></GestorRoute> },
  { path: "/gestor/clientes/modificar", element: <GestorRoute><CustomerEditView /></GestorRoute> },
  { path: "/gestor/clientes/desactivar", element: <GestorRoute><CustomerDeactivationView /></GestorRoute> },
  { path: "/gestor/cuentas/desactivar", element: <GestorRoute><AccountDeactivationView /></GestorRoute> },
  { path: "/gestor/reportes/actividad", element: <GestorRoute><ActivityReportView /></GestorRoute> },
  { path: "/gestor/tarjetas/solicitudes", element: <GestorRoute><CardRequestsView /></GestorRoute> },
  { path: "*", element: <Navigate to="/login" replace /> },
])
