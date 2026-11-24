import { useEffect } from "react"
import { useI18n } from "./I18nContext"
import { englishAttributes, englishPhrases } from "./translations/en"

const spanishMonths: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
}

const spanishShortMonths: Record<string, string> = {
  ene: "Jan",
  feb: "Feb",
  mar: "Mar",
  abr: "Apr",
  may: "May",
  jun: "Jun",
  jul: "Jul",
  ago: "Aug",
  sept: "Sep",
  oct: "Oct",
  nov: "Nov",
  dic: "Dec",
}

const textOriginals = new WeakMap<Text, string>()
const textApplied = new WeakMap<Text, string>()
const attributeOriginals = new WeakMap<Element, Map<string, string>>()

function formatEnglishValues(value: string) {
  let output = value.replace(
    /\$\s?(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?/g,
    (_, integer: string, decimals?: string) => {
      const amount = Number(
        `${integer.replace(/\./g, "")}${decimals ? `.${decimals}` : ""}`,
      )
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: decimals ? decimals.length : 0,
      }).format(amount)
    },
  )
  output = output.replace(
    /(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) de (\d{4})/gi,
    (_, day: string, month: string, year: string) =>
      new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(
        new Date(Number(year), spanishMonths[month.toLowerCase()], Number(day)),
      ),
  )
  output = output.replace(/(\d+),(\d+)%/g, "$1.$2%")
  output = output.replace(
    /(\d{1,2}) (?:de|of) (ene|feb|mar|abr|may|jun|jul|ago|sept|oct|nov|dic) (?:de|of) (\d{4})/gi,
    (_, day: string, month: string, year: string) =>
      `${spanishShortMonths[month.toLowerCase()]} ${Number(day)}, ${year}`,
  )
  output = output
    .replace(/\bHoy,\s*/g, "Today, ")
    .replace(/\ba\.\s*m\./gi, "AM")
    .replace(/\bp\.\s*m\./gi, "PM")
  return output
}

// Las frases más largas van primero para que no las fragmenten coincidencias parciales.
const partialPhrases = Object.entries(englishPhrases)
  .filter(([spanish]) => spanish.trim().length > 2)
  .sort(([a], [b]) => b.length - a.length)
  .map(([spanish, english]) => ({
    pattern: new RegExp(
      `(?<![\\p{L}\\p{N}])${spanish.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`,
      "gu",
    ),
    english,
  }))

function translateText(value: string) {
  const leading = value.match(/^\s*/)?.[0] ?? ""
  const trailing = value.match(/\s*$/)?.[0] ?? ""
  const content = value.trim()
  if (!content) return value

  let translated = englishPhrases[content] ?? content
  if (translated === content) {
    for (const { pattern, english } of partialPhrases) {
      translated = translated.replace(pattern, english)
    }
  }
  return `${leading}${formatEnglishValues(translated)}${trailing}`
}

export default function DomLocalizer() {
  const { language } = useI18n()

  useEffect(() => {
    const attributes = ["placeholder", "aria-label", "title"]
    let scheduled = false

    function isIgnored(node: Node) {
      const element =
        node.nodeType === Node.ELEMENT_NODE
          ? node as Element
          : node.parentElement
      return Boolean(element?.closest("[data-i18n-ignore]"))
    }

    function localizeTextNode(node: Text) {
      if (isIgnored(node)) return
      const current = node.nodeValue ?? ""
      const lastApplied = textApplied.get(node)
      if (
        !textOriginals.has(node) ||
        (lastApplied && current !== lastApplied)
      ) {
        textOriginals.set(node, current)
      }
      const original = textOriginals.get(node) ?? current
      const next = language === "en" ? translateText(original) : original
      if (current !== next) node.nodeValue = next
      textApplied.set(node, next)
    }

    function localizeElement(element: Element) {
      if (isIgnored(element)) return
      let originals = attributeOriginals.get(element)
      if (!originals) {
        originals = new Map()
        attributeOriginals.set(element, originals)
      }
      attributes.forEach((attribute) => {
        const current = element.getAttribute(attribute)
        if (current === null) return
        if (!originals?.has(attribute)) originals?.set(attribute, current)
        const original = originals?.get(attribute) ?? current
        const next =
          language === "en"
            ? (englishAttributes[original] ?? translateText(original))
            : original
        if (current !== next) element.setAttribute(attribute, next)
      })
    }

    function localize(root: ParentNode) {
      if (root instanceof Element) localizeElement(root)
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      )
      let current = walker.nextNode()
      while (current) {
        if (current.nodeType === Node.TEXT_NODE)
          localizeTextNode(current as Text)
        else localizeElement(current as Element)
        current = walker.nextNode()
      }
    }

    function scheduleLocalization() {
      if (scheduled) return
      scheduled = true
      requestAnimationFrame(() => {
        scheduled = false
        localize(document.getElementById("root") ?? document.body)
      })
    }

    localize(document.getElementById("root") ?? document.body)
    const observer = new MutationObserver(scheduleLocalization)
    observer.observe(document.getElementById("root") ?? document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    })
    return () => observer.disconnect()
  }, [language])

  return null
}
