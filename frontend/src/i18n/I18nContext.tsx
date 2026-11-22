import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { en } from "./translations/en"
import { es } from "./translations/es"

export type Language = "es" | "en"
type TranslationTree = Record<string, unknown>

type I18nContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
  locale: string
}

const STORAGE_KEY = "bancox-language"

function getInitialLanguage(): Language {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === "es" || stored === "en") return stored

  const browserLanguages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language]
  const supported = browserLanguages.find((item) => /^(es|en)(-|$)/i.test(item))
  return supported?.toLowerCase().startsWith("en") ? "en" : "es"
}

function getNestedValue(source: TranslationTree, key: string) {
  return key.split(".").reduce<unknown>((current, segment) => {
    if (typeof current !== "object" || current === null) return undefined
    return (current as Record<string, unknown>)[segment]
  }, source)
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage)
  const translations = language === "en" ? en : es

  function setLanguage(nextLanguage: Language) {
    const startedAt = performance.now()
    setLanguageState(nextLanguage)
    requestAnimationFrame(() => {
      document.documentElement.dataset.languageChangeMs = String(
        Math.round(performance.now() - startedAt),
      )
    })
  }

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language)
    document.documentElement.lang = language
    document.documentElement.dir = "ltr"
  }, [language])

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      locale: language === "en" ? "en-US" : "es-CO",
      t: (key) => {
        const translated = getNestedValue(translations, key)
        return typeof translated === "string" ? translated : key
      },
    }),
    [language, translations],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error("useI18n must be used inside I18nProvider")
  return context
}
