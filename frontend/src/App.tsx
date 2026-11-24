import { RouterProvider } from "react-router"
import { router } from "./routes"
import DomLocalizer from "./i18n/DomLocalizer"
import { I18nProvider } from "./i18n/I18nContext"
import GlobalLanguageSelector from "./shared/GlobalLanguageSelector"
import { IdleSessionGuard } from "./shared/idle"

export default function App() {
  return (
    <I18nProvider>
      <DomLocalizer />
      <IdleSessionGuard />
      <RouterProvider router={router} />
      <GlobalLanguageSelector />
    </I18nProvider>
  )
}
