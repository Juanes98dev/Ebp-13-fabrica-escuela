import { useEffect, useRef, useState } from "react"
import { useI18n, type Language } from "../i18n/I18nContext"
import { IcoCheck, IcoGlobe, IcoInfo } from "./icons"

export default function GlobalLanguageSelector() {
  const { language, setLanguage, t } = useI18n()
  const [showConfirmation, setShowConfirmation] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    },
    [],
  )

  function handleChange(nextLanguage: Language) {
    if (nextLanguage === language) return
    setLanguage(nextLanguage)
    setShowConfirmation(true)
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(
      () => setShowConfirmation(false),
      3200,
    )
  }

  return (
    <div
      data-i18n-ignore
      className="fixed bottom-5 right-5 z-[70] flex flex-col items-end gap-2"
    >
      {showConfirmation && (
        <div
          role="status"
          aria-live="polite"
          className="w-72 rounded-2xl border border-success/25 bg-surface/95 p-4 shadow-2xl shadow-black/35 backdrop-blur"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/15 text-emerald-400">
              <IcoCheck />
            </span>
            <div>
              <div className="text-sm font-semibold text-emerald-300">
                {t("changed")}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-text-muted">
                {t("saved")}
              </p>
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-purple-400/5 p-2.5">
                <span className="mt-0.5 text-purple-300">
                  <IcoInfo />
                </span>
                <div className="text-xs text-text-muted">
                  <div className="font-semibold text-text-secondary">
                    {t("currentLocale")}
                  </div>
                  <div className="mt-1">
                    {t("sampleDate")} · {t("sampleAmount")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 rounded-xl border border-purple-400/30 bg-surface/95 p-2 shadow-2xl shadow-black/35 backdrop-blur">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600/20 text-purple-300">
          <IcoGlobe />
        </span>
        <label htmlFor="global-language" className="sr-only">
          {t("selectorLabel")}
        </label>
        <select
          id="global-language"
          value={language}
          onChange={(event) => handleChange(event.target.value as Language)}
          aria-label={t("selectorLabel")}
          className="cursor-pointer rounded-lg border border-border bg-sidebar px-3 py-2 text-sm font-semibold text-text-secondary outline-none transition-all focus:border-purple-400 focus:ring-4 focus:ring-purple-400/15"
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      </div>
    </div>
  )
}
