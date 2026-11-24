import { useMemo, useState } from "react"
import Sidebar from "../shared/Sidebar"
import { ApiError, apiDownload, apiRequest, errorMessage } from "../shared/api"
import { fmtCOP } from "../shared/helpers"
import {
  IcoAlert,
  IcoCalendar,
  IcoCheck,
  IcoChevron,
  IcoClock,
  IcoCuentas,
  IcoDatabase,
  IcoDownload,
  IcoInfo,
  IcoReportes,
  IcoShield,
  IcoTransfer,
} from "../shared/icons"

type TransactionType = "Transferencias" | "Retiros" | "Consignaciones"

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
  generatedBy: string
  elapsed: string
}

type ApiReport = {
  fechaInicial: string
  fechaFinal: string
  generadoPor: string
  totalTransacciones: number
  montoTotalMovido: number
  cuentasActivas: number
  porTipo: {
    conteo: Record<string, number>
    montos: Record<string, number>
  }
}

const TIPOS: { type: TransactionType; clave: string }[] = [
  { type: "Transferencias", clave: "TRANSFERENCIA" },
  { type: "Retiros", clave: "RETIRO" },
  { type: "Consignaciones", clave: "CONSIGNACION" },
]

const TYPE_COLORS: Record<TransactionType, string> = {
  Transferencias: "#8b5cf6",
  Retiros: "#f59e0b",
  Consignaciones: "#10b981",
}

const formatCurrency = fmtCOP

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

function isoLocal(date: Date) {
  const mes = String(date.getMonth() + 1).padStart(2, "0")
  const dia = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${mes}-${dia}`
}

type Preset = "month" | "quarter" | "year"

function rangoPreset(preset: Preset): [string, string] {
  const hoy = new Date()
  const inicio = new Date(hoy)
  if (preset === "month") inicio.setDate(1)
  else if (preset === "quarter") inicio.setMonth(hoy.getMonth() - 3)
  else inicio.setFullYear(hoy.getFullYear() - 1)
  return [isoLocal(inicio), isoLocal(hoy)]
}

export default function ActivityReportView() {
  const [initialStart, initialEnd] = rangoPreset("month")
  const [startDate, setStartDate] = useState(initialStart)
  const [endDate, setEndDate] = useState(initialEnd)
  const [error, setError] = useState("")
  const [generating, setGenerating] = useState(false)
  const [report, setReport] = useState<Report | null>(null)
  const [noData, setNoData] = useState(false)
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("pdf")
  const [exporting, setExporting] = useState(false)
  const [exportResult, setExportResult] = useState<{ ok: boolean; message: string } | null>(null)
  const today = isoLocal(new Date())

  const maxCount = useMemo(
    () => Math.max(1, ...(report?.rows.map((row) => row.count) ?? [])),
    [report],
  )

  async function generateReport(event?: React.FormEvent) {
    event?.preventDefault()
    setExportResult(null)
    setNoData(false)
    setReport(null)

    if (!startDate || !endDate || startDate > endDate) {
      setError("El rango de fechas no es válido")
      return
    }
    if (endDate > today) {
      setError("La fecha final no puede ser futura")
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
      const rows: ReportRow[] = TIPOS.map(({ type, clave }) => {
        const count = data.porTipo.conteo[clave] ?? 0
        return {
          type,
          count,
          amount: Number(data.porTipo.montos[clave] ?? 0),
          share: data.totalTransacciones > 0 ? (count / data.totalTransacciones) * 100 : 0,
        }
      })
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
        generatedBy: data.generadoPor,
        elapsed: `${((performance.now() - startedAt) / 1000).toFixed(1)} s`,
      })
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 404) {
        setNoData(true)
      } else {
        setError(errorMessage(caught, "No fue posible generar el reporte"))
      }
    } finally {
      setGenerating(false)
    }
  }

  function applyPreset(preset: Preset) {
    const [inicio, fin] = rangoPreset(preset)
    setError("")
    setNoData(false)
    setReport(null)
    setExportResult(null)
    setStartDate(inicio)
    setEndDate(fin)
  }

  async function exportReport() {
    if (!report) return
    setExporting(true)
    setExportResult(null)
    const format = exportFormat === "excel" ? "xlsx" : "pdf"
    try {
      await apiDownload(
        `/api/reportes/actividad?fechaInicial=${report.startDate}&fechaFinal=${report.endDate}&formato=${format}`,
        `reporte-actividad_${report.startDate}_${report.endDate}.${format}`,
      )
      setExportResult({
        ok: true,
        message: `Reporte exportado correctamente en formato ${exportFormat === "pdf" ? "PDF" : "Excel"}.`,
      })
    } catch (caught) {
      setExportResult({ ok: false, message: errorMessage(caught, "No fue posible exportar el reporte") })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex h-full overflow-hidden bg-bg-base">
      <Sidebar variant="gestor" />

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
                  label="Mes actual"
                  onClick={() => applyPreset("month")}
                />
                <PresetButton
                  label="Últimos 3 meses"
                  onClick={() => applyPreset("quarter")}
                />
                <PresetButton
                  label="Último año"
                  onClick={() => applyPreset("year")}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <DateField
                id="report-start-date"
                label="Fecha inicial"
                value={startDate}
                max={endDate || today}
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
                max={today}
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
                Selecciona otro periodo o amplía el rango de fechas.
              </p>
              <button
                type="button"
                onClick={() => applyPreset("year")}
                className="mt-5 rounded-xl border border-border bg-purple-400/10 px-5 py-2.5 text-sm font-semibold text-purple-200 hover:bg-purple-400/15"
              >
                Usar el último año
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

              {exportResult && (
                <div
                  role={exportResult.ok ? "status" : "alert"}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
                    exportResult.ok
                      ? "border-success/20 bg-success/10 text-emerald-300"
                      : "border-danger/25 bg-danger/10 text-red-300"
                  }`}
                >
                  {exportResult.ok ? <IcoCheck /> : <IcoAlert />}
                  {exportResult.message}
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
                  detail="Estado actual del banco"
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
                    Reporte generado por {report.generatedBy}. Los valores
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
  max,
  error,
  onChange,
}: {
  id: string
  label: string
  value: string
  max: string
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
        max={max}
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
