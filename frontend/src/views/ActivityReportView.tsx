import { useMemo, useState } from "react"
import Sidebar from "../shared/Sidebar"
import { apiRequest } from "../shared/api"
import {
  IcoAlert,
  IcoCalendar,
  IcoCheck,
  IcoChevron,
  IcoClientes,
  IcoClock,
  IcoConfig,
  IcoCuentas,
  IcoDash,
  IcoDatabase,
  IcoDownload,
  IcoInfo,
  IcoProductos,
  IcoReportes,
  IcoShield,
  IcoTransfer,
} from "../shared/icons"

const MANAGER_NAV = [
  { id: "dashboard", label: "Panel Principal", icon: <IcoDash /> },
  { id: "clientes", label: "Clientes", icon: <IcoClientes /> },
  { id: "cuentas", label: "Cuentas", icon: <IcoCuentas /> },
  { id: "transacciones", label: "Transacciones", icon: <IcoTransfer /> },
  { id: "productos", label: "Productos", icon: <IcoProductos /> },
  { id: "reportes", label: "Reportes", icon: <IcoReportes /> },
  { id: "configuracion", label: "Configuración", icon: <IcoConfig /> },
]

type TransactionType = "Transferencias" | "Retiros" | "Consignaciones" | "Pagos"

type MonthlyActivity = {
  date: string
  activeAccounts: number
  transactions: Record<TransactionType, { count: number; amount: number }>
}

type ReportRow = {
  type: TransactionType
  count: number
  amount: number
  share: number
}

type Report = {
  startDate: string
  endDate: string
  totalTransactions: number
  totalAmount: number
  activeAccounts: number
  rows: ReportRow[]
  generatedAt: string
  elapsed: string
}

type ApiReport = {
  fechaInicial: string
  fechaFinal: string
  totalTransacciones: number
  montoTotalMovido: number
  cuentasActivas: number
  porTipo: {
    conteo: Record<string, number>
    montos: Record<string, number>
  }
}

const ACTIVITY_DATA: MonthlyActivity[] = [
  {
    date: "2026-01-15",
    activeAccounts: 2386,
    transactions: {
      Transferencias: { count: 420, amount: 1_286_450_000 },
      Retiros: { count: 284, amount: 426_800_000 },
      Consignaciones: { count: 198, amount: 682_340_000 },
      Pagos: { count: 351, amount: 318_760_000 },
    },
  },
  {
    date: "2026-02-15",
    activeAccounts: 2418,
    transactions: {
      Transferencias: { count: 438, amount: 1_342_780_000 },
      Retiros: { count: 301, amount: 458_920_000 },
      Consignaciones: { count: 207, amount: 714_500_000 },
      Pagos: { count: 366, amount: 342_180_000 },
    },
  },
  {
    date: "2026-03-15",
    activeAccounts: 2451,
    transactions: {
      Transferencias: { count: 461, amount: 1_418_320_000 },
      Retiros: { count: 295, amount: 447_650_000 },
      Consignaciones: { count: 221, amount: 756_890_000 },
      Pagos: { count: 389, amount: 361_420_000 },
    },
  },
  {
    date: "2026-04-15",
    activeAccounts: 2480,
    transactions: {
      Transferencias: { count: 478, amount: 1_496_740_000 },
      Retiros: { count: 312, amount: 472_360_000 },
      Consignaciones: { count: 230, amount: 781_250_000 },
      Pagos: { count: 401, amount: 378_910_000 },
    },
  },
  {
    date: "2026-05-15",
    activeAccounts: 2507,
    transactions: {
      Transferencias: { count: 492, amount: 1_552_190_000 },
      Retiros: { count: 325, amount: 491_480_000 },
      Consignaciones: { count: 243, amount: 806_720_000 },
      Pagos: { count: 417, amount: 395_640_000 },
    },
  },
  {
    date: "2026-06-15",
    activeAccounts: 2542,
    transactions: {
      Transferencias: { count: 516, amount: 1_638_450_000 },
      Retiros: { count: 337, amount: 512_900_000 },
      Consignaciones: { count: 255, amount: 845_380_000 },
      Pagos: { count: 432, amount: 414_270_000 },
    },
  },
]

const TYPE_COLORS: Record<TransactionType, string> = {
  Transferencias: "#8b5cf6",
  Retiros: "#f59e0b",
  Consignaciones: "#10b981",
  Pagos: "#38bdf8",
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000_000)
    return `$ ${(value / 1_000_000_000).toFixed(2)} mil M`
  if (value >= 1_000_000) return `$ ${(value / 1_000_000).toFixed(1)} M`
  return formatCurrency(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`))
}

function downloadBlob(content: BlobPart, mime: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }))
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function buildSimplePdf(report: Report) {
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[()\\]/g, (character) => `\\${character}`)
  const lines = [
    "BANCO X - REPORTE DE ACTIVIDAD FINANCIERA",
    `Periodo: ${formatDate(report.startDate)} a ${formatDate(report.endDate)}`,
    `Generado: ${report.generatedAt}`,
    "",
    `Total transacciones: ${report.totalTransactions.toLocaleString("es-CO")}`,
    `Monto total movido: ${formatCurrency(report.totalAmount)}`,
    `Cuentas activas: ${report.activeAccounts.toLocaleString("es-CO")}`,
    "",
    "DETALLE POR TIPO",
    ...report.rows.map(
      (row) =>
        `${row.type}: ${row.count.toLocaleString("es-CO")} operaciones - ${formatCurrency(row.amount)}`,
    ),
    "",
    "Generado por: Gestor Rodriguez",
  ].map(normalize)

  const stream = lines
    .map(
      (line, index) =>
        `${
          index === 0
            ? "BT /F1 16 Tf 50 790 Td"
            : `0 -${index === 1 ? 28 : 22} Td`
        } (${line}) Tj`,
    )
    .join("\n")
  const contentStream = `${stream}\nET`
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >> endobj",
    `4 0 obj << /Length ${contentStream.length} >> stream\n${contentStream}\nendstream endobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
  ]
  let pdf = "%PDF-1.4\n"
  const offsets = [0]
  objects.forEach((object) => {
    offsets.push(pdf.length)
    pdf += `${object}\n`
  })
  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`
  })
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return pdf
}

export default function ActivityReportView() {
  const [activeNav, setActiveNav] = useState("reportes")
  const [startDate, setStartDate] = useState("2026-01-01")
  const [endDate, setEndDate] = useState("2026-03-31")
  const [error, setError] = useState("")
  const [generating, setGenerating] = useState(false)
  const [report, setReport] = useState<Report | null>(null)
  const [noData, setNoData] = useState(false)
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("pdf")
  const [exporting, setExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState("")

  const maxCount = useMemo(
    () => Math.max(...(report?.rows.map((row) => row.count) ?? [1])),
    [report],
  )

  async function generateReport(event?: React.FormEvent) {
    event?.preventDefault()
    setExportMessage("")
    setNoData(false)
    setReport(null)

    if (!startDate || !endDate || startDate > endDate) {
      setError("El rango de fechas no es válido")
      return
    }

    const start = new Date(`${startDate}T00:00:00`)
    const end = new Date(`${endDate}T23:59:59`)
    const days = (end.getTime() - start.getTime()) / 86_400_000
    if (days > 366) {
      setError("El rango máximo permitido es de un año")
      return
    }

    setError("")
    setGenerating(true)
    const startedAt = performance.now()
    try {
      const data = await apiRequest<ApiReport>(
        `/api/reportes/actividad?fechaInicial=${startDate}&fechaFinal=${endDate}&formato=json`,
      )
      const rows: ReportRow[] = [
        { type: "Transferencias", count: data.porTipo.conteo.TRANSFERENCIA ?? 0, amount: Number(data.porTipo.montos.TRANSFERENCIA ?? 0), share: 0 },
        { type: "Retiros", count: data.porTipo.conteo.RETIRO ?? 0, amount: Number(data.porTipo.montos.RETIRO ?? 0), share: 0 },
        { type: "Consignaciones", count: data.porTipo.conteo.CONSIGNACION ?? 0, amount: Number(data.porTipo.montos.CONSIGNACION ?? 0), share: 0 },
        { type: "Pagos", count: data.porTipo.conteo.PAGO ?? 0, amount: Number(data.porTipo.montos.PAGO ?? 0), share: 0 },
      ].map((row) => ({
        ...row,
        share: data.totalTransacciones > 0 ? (row.count / data.totalTransacciones) * 100 : 0,
      }))
      setGenerating(false)
      setReport({
        startDate,
        endDate,
        totalTransactions: data.totalTransacciones,
        totalAmount: Number(data.montoTotalMovido),
        activeAccounts: data.cuentasActivas,
        rows,
        generatedAt: new Intl.DateTimeFormat("es-CO", {
          dateStyle: "long",
          timeStyle: "short",
        }).format(new Date()),
        elapsed: `${((performance.now() - startedAt) / 1000).toFixed(1)} s`,
      })
    } catch (error) {
      setGenerating(false)
      const message = error instanceof Error ? error.message : ""
      if (message === "No hay transacciones en el rango seleccionado") {
        setNoData(true)
      } else {
        setError(message || "No fue posible generar el reporte")
      }
    }
  }

  function applyPreset(preset: "quarter" | "semester" | "empty") {
    setError("")
    setNoData(false)
    setReport(null)
    setExportMessage("")
    if (preset === "quarter") {
      setStartDate("2026-01-01")
      setEndDate("2026-03-31")
    } else if (preset === "semester") {
      setStartDate("2026-01-01")
      setEndDate("2026-06-30")
    } else {
      setStartDate("2025-01-01")
      setEndDate("2025-01-31")
    }
  }

  async function exportReport() {
    if (!report) return
    setExporting(true)
    setExportMessage("")
    try {
      const format = exportFormat === "excel" ? "xlsx" : "pdf"
      const baseUrl = ((import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "")
      const response = await fetch(
        `${baseUrl}/api/reportes/actividad?fechaInicial=${report.startDate}&fechaFinal=${report.endDate}&formato=${format}`,
        {
          headers: {
            "X-Rol": window.localStorage.getItem("bancox-role") ?? "",
            "X-Usuario-Id": window.localStorage.getItem("bancox-user-id") ?? "",
          },
        },
      )
      if (!response.ok) throw new Error("No fue posible exportar el reporte")
      const blob = await response.blob()
      const suffix = `${report.startDate}_${report.endDate}`
      downloadBlob(
        blob,
        exportFormat === "excel"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf",
        `BancoX_Actividad_${suffix}.${format}`,
      )
      setExporting(false)
      setExportMessage(
        `Reporte exportado correctamente en formato ${
          exportFormat === "pdf" ? "PDF" : "Excel"
        }.`,
      )
    } catch (error) {
      setExporting(false)
      setExportMessage(error instanceof Error ? error.message : "No fue posible exportar el reporte")
    }
  }

  return (
    <div className="flex h-full overflow-hidden bg-bg-base">
      <Sidebar
        navItems={MANAGER_NAV}
        activeNav={activeNav}
        onNav={setActiveNav}
        userLabel="Gestor Rodríguez"
        userSub="Gestor Bancario"
        userInitials="GR"
        badge="Plataforma Gestión"
      />

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-bg-base/95 px-8 py-5 backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Reportes</span>
            <IcoChevron />
            <span className="text-text-secondary">Actividad financiera</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-lg border border-success/20 bg-success/10 px-3 py-1.5 text-xs text-emerald-400 sm:flex">
              <IcoShield /> Rol: Gestor
            </span>
            <span className="rounded-lg border border-border bg-purple-600/15 px-3 py-1.5 text-xs text-purple-200">
              HU-04-02-01
            </span>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-8 py-7">
          <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <span className="mb-2 inline-block rounded-md bg-accent/15 px-2 py-1 font-display text-xs font-semibold uppercase tracking-wider text-purple-300">
                Inteligencia financiera
              </span>
              <h1 className="mb-1 font-display text-2xl font-bold text-text-primary">
                Reporte de actividad
              </h1>
              <p className="max-w-2xl text-sm text-text-muted">
                Analiza transacciones, montos movilizados y cuentas activas en
                un periodo específico.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-sidebar px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600/15 text-purple-300">
                <IcoClock />
              </span>
              <div>
                <div className="text-xs font-semibold text-text-secondary">
                  Rendimiento optimizado
                </div>
                <div className="mt-0.5 text-xs text-text-muted">
                  Reportes de hasta un año en menos de 10 s
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={generateReport}
            noValidate
            className="mb-6 rounded-2xl border border-border bg-sidebar p-6"
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-purple-300">
                  <IcoCalendar />
                </span>
                <div>
                  <h2 className="font-display text-sm font-semibold text-purple-200">
                    Configurar periodo
                  </h2>
                  <p className="mt-0.5 text-xs text-text-muted">
                    Selecciona un rango máximo de 12 meses.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <PresetButton
                  label="Primer trimestre"
                  onClick={() => applyPreset("quarter")}
                />
                <PresetButton
                  label="Primer semestre"
                  onClick={() => applyPreset("semester")}
                />
                <PresetButton
                  label="Probar sin datos"
                  onClick={() => applyPreset("empty")}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <DateField
                id="report-start-date"
                label="Fecha inicial"
                value={startDate}
                error={Boolean(error)}
                onChange={(value) => {
                  setStartDate(value)
                  setError("")
                  setReport(null)
                  setNoData(false)
                }}
              />
              <DateField
                id="report-end-date"
                label="Fecha final"
                value={endDate}
                error={Boolean(error)}
                onChange={(value) => {
                  setEndDate(value)
                  setError("")
                  setReport(null)
                  setNoData(false)
                }}
              />
              <button
                type="submit"
                disabled={generating}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-purple-600 to-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
              >
                {generating ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Generando...
                  </>
                ) : (
                  <>
                    <IcoReportes />
                    Generar reporte
                  </>
                )}
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-4 flex items-center gap-2 rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm font-semibold text-red-300"
              >
                <IcoAlert />
                {error}
              </div>
            )}
          </form>

          {noData && (
            <div
              role="status"
              className="rounded-2xl border border-warn/25 bg-sidebar px-6 py-12 text-center"
            >
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warn/10 text-amber-400">
                <IcoDatabase />
              </span>
              <h2 className="font-display text-lg font-bold text-text-primary">
                No hay transacciones en el rango seleccionado
              </h2>
              <p className="mx-auto mt-1 max-w-lg text-sm text-text-muted">
                Selecciona otro periodo o usa el primer trimestre para consultar
                datos disponibles.
              </p>
              <button
                type="button"
                onClick={() => applyPreset("quarter")}
                className="mt-5 rounded-xl border border-border bg-purple-400/10 px-5 py-2.5 text-sm font-semibold text-purple-200 hover:bg-purple-400/15"
              >
                Usar periodo con datos
              </button>
            </div>
          )}

          {!report && !noData && !generating && (
            <div className="rounded-2xl border border-border bg-sidebar px-6 py-14 text-center">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600/15 text-purple-300">
                <IcoReportes />
              </span>
              <h2 className="font-display text-base font-semibold text-text-secondary">
                Configura el periodo para generar el reporte
              </h2>
              <p className="mx-auto mt-1 max-w-lg text-sm text-text-muted">
                Obtendrás indicadores consolidados y el detalle por tipo de
                transacción.
              </p>
            </div>
          )}

          {generating && (
            <div className="rounded-2xl border border-border bg-sidebar px-6 py-16 text-center">
              <span className="mx-auto mb-5 block h-10 w-10 animate-spin rounded-full border-4 border-purple-400/20 border-t-purple-400" />
              <h2 className="font-display text-base font-semibold text-text-secondary">
                Consolidando actividad financiera
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                Procesando cuentas, movimientos y montos del periodo...
              </p>
            </div>
          )}

          {report && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 rounded-2xl border border-success/20 bg-success/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success/15 text-emerald-400">
                    <IcoCheck />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-emerald-300">
                      Reporte generado correctamente
                    </div>
                    <div className="mt-0.5 text-xs text-text-muted">
                      {formatDate(report.startDate)} —{" "}
                      {formatDate(report.endDate)} · Procesado en{" "}
                      {report.elapsed}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={exportFormat}
                    onChange={(event) =>
                      setExportFormat(event.target.value as "pdf" | "excel")
                    }
                    aria-label="Formato de exportación"
                    className="rounded-xl border border-border bg-sidebar px-3 py-2.5 text-sm text-text-secondary outline-none"
                  >
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel</option>
                  </select>
                  <button
                    type="button"
                    onClick={exportReport}
                    disabled={exporting}
                    className="flex items-center justify-center gap-2 rounded-xl border border-purple-400/30 bg-purple-600/20 px-4 py-2.5 text-sm font-semibold text-purple-200 transition-all hover:bg-purple-600/30 disabled:opacity-60"
                  >
                    {exporting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-purple-200/30 border-t-purple-200" />
                        Exportando...
                      </>
                    ) : (
                      <>
                        <IcoDownload />
                        Exportar
                      </>
                    )}
                  </button>
                </div>
              </div>

              {exportMessage && (
                <div
                  role="status"
                  className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-semibold text-emerald-300"
                >
                  <IcoCheck />
                  {exportMessage}
                </div>
              )}

              <section className="grid gap-4 md:grid-cols-3">
                <MetricCard
                  icon={<IcoTransfer />}
                  label="Total de transacciones"
                  value={report.totalTransactions.toLocaleString("es-CO")}
                  detail="Operaciones procesadas"
                  color="purple"
                />
                <MetricCard
                  icon={<IcoDatabase />}
                  label="Monto total movido"
                  value={formatCompactCurrency(report.totalAmount)}
                  detail={formatCurrency(report.totalAmount)}
                  color="green"
                />
                <MetricCard
                  icon={<IcoCuentas />}
                  label="Cuentas activas"
                  value={report.activeAccounts.toLocaleString("es-CO")}
                  detail="Al cierre del periodo"
                  color="blue"
                />
              </section>

              <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <section className="rounded-2xl border border-border bg-sidebar p-6">
                  <div className="mb-6 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="font-display text-sm font-semibold text-purple-200">
                        Transacciones por tipo
                      </h2>
                      <p className="mt-1 text-xs text-text-muted">
                        Comparativo de operaciones procesadas.
                      </p>
                    </div>
                    <span className="rounded-lg bg-purple-400/10 px-2.5 py-1 text-xs text-purple-300">
                      {report.rows.length} categorías
                    </span>
                  </div>
                  <div className="flex flex-col gap-5">
                    {report.rows.map((row) => (
                      <div key={row.type}>
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2 font-semibold text-text-secondary">
                            <span
                              className="h-2.5 w-2.5 rounded-sm"
                              style={{ background: TYPE_COLORS[row.type] }}
                            />
                            {row.type}
                          </span>
                          <span className="text-text-muted">
                            {row.count.toLocaleString("es-CO")} ·{" "}
                            {row.share.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-purple-400/10">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${(row.count / maxCount) * 100}%`,
                              background: TYPE_COLORS[row.type],
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-border bg-sidebar">
                  <div className="border-b border-border px-5 py-4">
                    <h2 className="font-display text-sm font-semibold text-purple-200">
                      Montos movilizados
                    </h2>
                    <p className="mt-1 text-xs text-text-muted">
                      Consolidado monetario por categoría.
                    </p>
                  </div>
                  <div className="divide-y divide-border">
                    {report.rows.map((row) => (
                      <div
                        key={row.type}
                        className="flex items-center justify-between gap-4 px-5 py-4"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="h-8 w-1 rounded-full"
                            style={{ background: TYPE_COLORS[row.type] }}
                          />
                          <div>
                            <div className="text-xs font-semibold text-text-secondary">
                              {row.type}
                            </div>
                            <div className="mt-0.5 text-xs text-text-muted">
                              {row.count.toLocaleString("es-CO")} operaciones
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm font-semibold text-text-primary">
                          {formatCompactCurrency(row.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="flex flex-col gap-3 rounded-xl border border-border bg-purple-400/5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-purple-300">
                    <IcoInfo />
                  </span>
                  <p className="text-xs leading-relaxed text-text-muted">
                    Reporte generado por Gestor Rodríguez. Los valores
                    corresponden a operaciones consolidadas del periodo
                    seleccionado.
                  </p>
                </div>
                <span className="shrink-0 text-xs text-text-muted">
                  {report.generatedAt}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function DateField({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: string
  label: string
  value: string
  error: boolean
  onChange: (value: string) => void
}) {
  return (
    <div className="w-full flex-1">
      <label
        htmlFor={id}
        className="mb-2 block font-display text-xs font-semibold uppercase tracking-wide text-purple-200"
      >
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error}
        className={`w-full rounded-xl border bg-purple-400/5 px-4 py-3 text-sm text-text-primary outline-none transition-all focus:ring-4 focus:ring-purple-400/10 ${
          error ? "border-danger" : "border-border focus:border-purple-400/60"
        }`}
      />
    </div>
  )
}

function PresetButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-border bg-purple-400/5 px-3 py-1.5 text-xs font-semibold text-text-muted transition-colors hover:bg-purple-400/10 hover:text-purple-200"
    >
      {label}
    </button>
  )
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  detail: string
  color: "purple" | "green" | "blue"
}) {
  const styles = {
    purple: "bg-purple-600/15 text-purple-300 border-purple-400/20",
    green: "bg-success/10 text-emerald-400 border-success/20",
    blue: "bg-sky-400/10 text-sky-400 border-sky-400/20",
  }
  return (
    <article className="rounded-2xl border border-border bg-sidebar p-5">
      <div className="mb-4 flex items-center justify-between">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${styles[color]}`}
        >
          {icon}
        </span>
        <span className="text-xs text-text-muted">Periodo seleccionado</span>
      </div>
      <div className="text-xs font-medium text-text-muted">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold text-text-primary">
        {value}
      </div>
      <div className="mt-1 truncate text-xs text-text-muted">{detail}</div>
    </article>
  )
}
