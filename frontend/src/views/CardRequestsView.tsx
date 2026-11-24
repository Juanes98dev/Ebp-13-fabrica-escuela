import { useCallback, useEffect, useState, type ReactNode } from "react"
import Sidebar from "../shared/Sidebar"
import { apiRequest, errorMessage } from "../shared/api"
import { fmtCOP, fmtFecha } from "../shared/helpers"
import {
  IcoAlert,
  IcoCard,
  IcoCheck,
  IcoChevron,
  IcoClock,
  IcoClose,
  IcoCuentas,
  IcoInbox,
  IcoInfo,
  IcoLock,
  IcoShield,
} from "../shared/icons"
import { AlertaError } from "../shared/operaciones"
import { getSession, initials } from "../shared/session"
import { etiquetaTipoTarjeta, ultimos4 } from "../shared/tarjetas"
import type { TarjetaApi } from "../shared/types"

type Decision = {
  action: "Aprobada" | "Rechazada"
  request: TarjetaApi
  timestamp: string
  reason?: string
}

export default function CardRequestsView() {
  const gestor = getSession()?.nombre ?? "Gestor"
  const [requests, setRequests] = useState<TarjetaApi[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [approvalOpen, setApprovalOpen] = useState(false)
  const [rejectionOpen, setRejectionOpen] = useState(false)
  const [approvalAccepted, setApprovalAccepted] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [modalError, setModalError] = useState("")
  const [processing, setProcessing] = useState(false)
  const [decision, setDecision] = useState<Decision | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError("")
    try {
      setRequests(await apiRequest<TarjetaApi[]>("/api/tarjetas/solicitudes"))
    } catch (err) {
      setLoadError(errorMessage(err, "No fue posible cargar las solicitudes"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const selectedRequest = requests.find((request) => request.id === selectedId) ?? requests[0] ?? null
  const pendingDebit = requests.filter((request) => request.tipo === "DEBITO").length
  const pendingCredit = requests.length - pendingDebit

  function showApproval() {
    setApprovalAccepted(false)
    setModalError("")
    setDecision(null)
    setApprovalOpen(true)
  }

  function showRejection() {
    setRejectionReason("")
    setModalError("")
    setDecision(null)
    setRejectionOpen(true)
  }

  async function applyDecision(action: "Aprobada" | "Rechazada", reason?: string) {
    if (!selectedRequest || processing) return
    const snapshot = selectedRequest
    setProcessing(true)
    setModalError("")
    try {
      if (action === "Aprobada") {
        await apiRequest(`/api/tarjetas/solicitudes/${snapshot.id}/aprobar`, { method: "POST" })
      } else {
        await apiRequest(`/api/tarjetas/solicitudes/${snapshot.id}/rechazar`, {
          method: "POST",
          body: JSON.stringify({ motivo: reason }),
        })
      }
      setApprovalOpen(false)
      setRejectionOpen(false)
      setSelectedId(null)
      setDecision({ action, request: snapshot, timestamp: new Date().toISOString(), reason })
      await load()
    } catch (err) {
      setModalError(errorMessage(err, "No fue posible aplicar la decisión"))
    } finally {
      setProcessing(false)
    }
  }

  function confirmRejection() {
    if (!rejectionReason.trim()) {
      setModalError("Debe ingresar el motivo del rechazo")
      return
    }
    void applyDecision("Rechazada", rejectionReason.trim())
  }

  return (
    <div className="flex h-full overflow-hidden bg-bg-base">
      <Sidebar variant="gestor" />

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-bg-base/95 px-8 py-5 backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Productos</span><IcoChevron /><span className="text-text-secondary">Solicitudes de tarjetas</span>
          </div>
          <span className="hidden items-center gap-1.5 rounded-lg border border-success/20 bg-success/10 px-3 py-1.5 text-xs text-emerald-400 sm:flex"><IcoShield /> Rol: Gestor</span>
        </header>

        <div className="mx-auto max-w-7xl px-8 py-7">
          <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <span className="mb-2 inline-block rounded-md bg-accent/15 px-2 py-1 font-display text-xs font-semibold uppercase tracking-wider text-purple-300">Control de emisión</span>
              <h1 className="mb-1 font-display text-2xl font-bold text-text-primary">Solicitudes de tarjetas</h1>
              <p className="max-w-2xl text-sm text-text-muted">Revisa los datos del cliente y decide si la tarjeta puede ser emitida.</p>
            </div>
            <button type="button" onClick={() => void load()} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-sidebar px-4 py-3 text-xs font-semibold text-text-muted transition-colors hover:bg-purple-400/5 hover:text-purple-200 disabled:opacity-50">
              <IcoInbox />{loading ? "Actualizando..." : "Actualizar bandeja"}
            </button>
          </div>

          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <SummaryCard label="Solicitudes pendientes" value={requests.length} detail="Requieren decisión" icon={<IcoInbox />} color="purple" />
            <SummaryCard label="Tarjetas de crédito" value={pendingCredit} detail="Solicitudes pendientes" icon={<IcoCard />} color="blue" />
            <SummaryCard label="Tarjetas débito" value={pendingDebit} detail="Solicitudes pendientes" icon={<IcoCuentas />} color="green" />
          </section>

          {loadError && <div className="mb-5"><AlertaError mensaje={loadError} /></div>}

          {decision && (
            <section role="status" className={`mb-5 overflow-hidden rounded-2xl border ${decision.action === "Aprobada" ? "border-success/30 bg-success/5" : "border-warn/30 bg-warn/5"}`}>
              <div className="flex items-start gap-4 p-5">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${decision.action === "Aprobada" ? "border-success/30 bg-success/15 text-emerald-400" : "border-warn/30 bg-warn/15 text-amber-400"}`}>
                  {decision.action === "Aprobada" ? <IcoCheck /> : <IcoClose />}
                </span>
                <div className="flex-1">
                  <h3 className={`font-display text-base font-bold ${decision.action === "Aprobada" ? "text-emerald-300" : "text-amber-300"}`}>Solicitud {decision.action.toLowerCase()} correctamente</h3>
                  <p className="mt-1 text-sm text-text-muted">
                    {decision.action === "Aprobada"
                      ? `La tarjeta •••• ${ultimos4(decision.request.numeroEnmascarado)} quedó activa. Se envió la notificación a ${decision.request.titular}.`
                      : `Se notificó a ${decision.request.titular} el rechazo con el motivo: “${decision.reason}”.`}
                  </p>
                </div>
              </div>
              <div className="grid gap-px border-t border-border bg-border sm:grid-cols-3">
                <AuditCell label="Gestor responsable" value={gestor} />
                <AuditCell label="Fecha y hora" value={fmtFecha(decision.timestamp)} />
                <AuditCell label="Nuevo estado" value={decision.action === "Aprobada" ? "Activa" : "Rechazada"} success={decision.action === "Aprobada"} />
              </div>
            </section>
          )}

          {loading && requests.length === 0 ? (
            <p className="text-sm text-text-muted">Cargando solicitudes...</p>
          ) : requests.length === 0 ? (
            <section className="rounded-2xl border border-border bg-sidebar px-6 py-14 text-center">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600/15 text-purple-300"><IcoInbox /></span>
              <h2 className="font-display text-lg font-bold text-text-primary">No hay solicitudes pendientes</h2>
              <p className="mx-auto mt-1 max-w-lg text-sm text-text-muted">Todas las solicitudes de tarjetas fueron revisadas.</p>
            </section>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
              <section className="overflow-hidden rounded-2xl border border-border bg-sidebar">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                  <div>
                    <h2 className="font-display text-sm font-semibold text-purple-200">Pendientes de revisión</h2>
                    <p className="mt-1 text-xs text-text-muted">Ordenadas desde la más antigua.</p>
                  </div>
                  <span className="rounded-full bg-purple-600/15 px-2.5 py-1 text-xs font-semibold text-purple-300">{requests.length}</span>
                </div>
                <div className="divide-y divide-border">
                  {requests.map((request) => (
                    <button
                      key={request.id}
                      type="button"
                      onClick={() => { setSelectedId(request.id); setDecision(null) }}
                      className={`w-full p-4 text-left transition-colors ${selectedRequest?.id === request.id ? "bg-purple-600/15" : "hover:bg-purple-400/5"}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${request.tipo === "CREDITO" ? "bg-purple-600/20 text-purple-300" : "bg-sky-400/10 text-sky-400"}`}><IcoCard /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold text-text-secondary">{request.titular}</span>
                          <span className="mt-1 block text-xs text-text-muted">{etiquetaTipoTarjeta(request.tipo)} · <span data-i18n-ignore>•••• {ultimos4(request.numeroEnmascarado)}</span></span>
                          <span className="mt-1.5 block text-[10px] text-text-muted">{fmtFecha(request.fechaSolicitud)}</span>
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {selectedRequest && (
                <section className="overflow-hidden rounded-2xl border border-border bg-sidebar">
                  <div className="flex flex-col gap-4 border-b border-border bg-gradient-to-r from-purple-600/15 to-transparent p-6 sm:flex-row sm:items-center">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-accent font-display text-sm font-bold text-white">{initials(selectedRequest.titular)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-lg font-bold text-text-primary">{selectedRequest.titular}</h2>
                        <span className="rounded-full border border-warn/25 bg-warn/10 px-2.5 py-1 text-xs font-semibold text-amber-400">Pendiente</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted" data-i18n-ignore>
                        <span>CC {selectedRequest.clienteCedula}</span>
                        <span>ID {selectedRequest.clienteIdCliente}</span>
                        {selectedRequest.clienteEmail && <span>{selectedRequest.clienteEmail}</span>}
                      </div>
                    </div>
                    <span className="rounded-lg border border-border bg-purple-400/5 px-3 py-2 text-xs font-semibold text-purple-200">Solicitud #{selectedRequest.id}</span>
                  </div>

                  <div className="p-6">
                    <div className="mb-5 grid gap-4 sm:grid-cols-2">
                      <DetailSection title="Solicitud de tarjeta" icon={<IcoCard />}>
                        <DetailRow label="Producto" value={etiquetaTipoTarjeta(selectedRequest.tipo)} />
                        <DetailRow label="Tarjeta preasignada" value={`•••• ${ultimos4(selectedRequest.numeroEnmascarado)}`} protectedValue />
                        <DetailRow label="Fecha de solicitud" value={fmtFecha(selectedRequest.fechaSolicitud)} last />
                      </DetailSection>
                      <DetailSection title={selectedRequest.tipo === "CREDITO" ? "Condiciones" : "Cuenta asociada"} icon={<IcoCuentas />}>
                        {selectedRequest.tipo === "CREDITO" ? (
                          <DetailRow label="Cupo a asignar" value={fmtCOP(Number(selectedRequest.cupoTotal ?? 0))} last />
                        ) : (
                          <DetailRow label="Cuenta" value={selectedRequest.cuentaAsociada ?? "—"} last />
                        )}
                      </DetailSection>
                    </div>

                    <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-2 text-xs text-text-muted"><IcoClock /><span>La decisión queda auditada y se notifica al cliente por correo.</span></div>
                      <div className="flex gap-3">
                        <button type="button" onClick={showRejection} className="flex items-center justify-center gap-2 rounded-xl border border-danger/35 bg-danger/10 px-5 py-2.5 text-sm font-semibold text-red-300 hover:bg-danger/20"><IcoClose />Rechazar</button>
                        <button type="button" onClick={showApproval} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-purple-600 to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 hover:-translate-y-0.5"><IcoCheck />Aprobar</button>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-purple-400/5 px-4 py-3.5">
            <span className="mt-0.5 shrink-0 text-purple-300"><IcoInfo /></span>
            <p className="text-xs leading-relaxed text-text-muted">Solo gestores autorizados pueden tomar decisiones. En pantalla se muestran únicamente los últimos cuatro dígitos de las tarjetas.</p>
          </div>
        </div>
      </main>

      {approvalOpen && selectedRequest && (
        <Modal id="approval-title" title="Confirmar aprobación" description={`La tarjeta •••• ${ultimos4(selectedRequest.numeroEnmascarado)} quedará activa.`} icon={<IcoCheck />} tone="success" onClose={() => setApprovalOpen(false)}>
          <div className="mb-5 rounded-xl border border-border bg-purple-400/5 p-4">
            <DetailRow label="Cliente" value={selectedRequest.titular} />
            <DetailRow label="Producto" value={etiquetaTipoTarjeta(selectedRequest.tipo)} />
            <DetailRow label="Nuevo estado" value="Activa" success last />
          </div>
          <label className="mb-5 flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3.5">
            <input type="checkbox" checked={approvalAccepted} onChange={(event) => setApprovalAccepted(event.target.checked)} className="mt-0.5 h-4 w-4 accent-purple-600" />
            <span className="text-xs leading-relaxed text-text-muted">Confirmo que revisé la información y que el cliente cumple los requisitos de emisión.</span>
          </label>
          {modalError && <p role="alert" className="mb-4 flex items-center gap-1.5 text-xs text-red-400"><IcoAlert />{modalError}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setApprovalOpen(false)} disabled={processing} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-text-secondary hover:bg-purple-400/5 disabled:opacity-50">Cancelar</button>
            <button type="button" onClick={() => void applyDecision("Aprobada")} disabled={!approvalAccepted || processing} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-purple-600 to-accent py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
              {processing ? "Aprobando..." : <><IcoCheck />Aprobar solicitud</>}
            </button>
          </div>
        </Modal>
      )}

      {rejectionOpen && selectedRequest && (
        <Modal id="rejection-title" title="Rechazar solicitud" description={`Indica el motivo para la tarjeta •••• ${ultimos4(selectedRequest.numeroEnmascarado)}.`} icon={<IcoClose />} tone="danger" onClose={() => setRejectionOpen(false)}>
          <label htmlFor="rejection-reason" className="mb-2 block font-display text-xs font-semibold uppercase tracking-wide text-purple-200">Motivo del rechazo <span className="text-accent">*</span></label>
          <textarea
            id="rejection-reason"
            value={rejectionReason}
            onChange={(event) => { setRejectionReason(event.target.value.slice(0, 300)); setModalError("") }}
            rows={4}
            aria-invalid={Boolean(modalError)}
            placeholder="Describe claramente por qué la solicitud no cumple los requisitos..."
            className={`w-full resize-none rounded-xl border bg-purple-400/5 px-4 py-3 text-sm text-text-primary outline-none focus:ring-4 focus:ring-purple-400/10 ${modalError ? "border-danger" : "border-border focus:border-purple-400/60"}`}
          />
          <div className="mt-2 flex items-start justify-between gap-3">
            {modalError ? <span role="alert" className="flex items-center gap-1.5 text-xs text-red-400"><IcoAlert />{modalError}</span> : <span className="text-xs text-text-muted">El cliente recibirá este motivo por correo.</span>}
            <span className="shrink-0 text-xs text-text-muted">{rejectionReason.length}/300</span>
          </div>
          <div className="mt-5 flex gap-3">
            <button type="button" onClick={() => setRejectionOpen(false)} disabled={processing} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-text-secondary hover:bg-purple-400/5 disabled:opacity-50">Cancelar</button>
            <button type="button" onClick={confirmRejection} disabled={processing} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-danger py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50">
              {processing ? "Rechazando..." : <><IcoClose />Confirmar rechazo</>}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function SummaryCard({ label, value, detail, icon, color }: { label: string; value: number; detail: string; icon: ReactNode; color: "purple" | "blue" | "green" }) {
  const styles = {
    purple: "border-purple-400/20 bg-purple-600/15 text-purple-300",
    blue: "border-sky-400/20 bg-sky-400/10 text-sky-400",
    green: "border-success/20 bg-success/10 text-emerald-400",
  }
  return (
    <article className="rounded-2xl border border-border bg-sidebar p-5">
      <div className="flex items-center justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${styles[color]}`}>{icon}</span>
        <span className="font-display text-2xl font-bold text-text-primary">{value}</span>
      </div>
      <div className="mt-4 text-xs font-semibold text-text-secondary">{label}</div>
      <div className="mt-1 text-xs text-text-muted">{detail}</div>
    </article>
  )
}

function DetailSection({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-purple-400/5 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-purple-200">{icon}{title}</div>
      {children}
    </div>
  )
}

function DetailRow({ label, value, protectedValue = false, success = false, last = false }: { label: string; value: string; protectedValue?: boolean; success?: boolean; last?: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-3 py-2.5 text-xs ${last ? "" : "border-b border-border"}`}>
      <span className="text-text-muted">{label}</span>
      <span className={`flex items-center gap-1.5 text-right font-semibold ${success ? "text-emerald-400" : "text-text-secondary"}`} data-i18n-ignore>
        {value}{protectedValue && <IcoLock />}
      </span>
    </div>
  )
}

function Modal({ id, title, description, icon, tone, onClose, children }: { id: string; title: string; description: string; icon: ReactNode; tone: "success" | "danger"; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby={id}>
      <div className={`w-full max-w-md overflow-hidden rounded-2xl border bg-surface shadow-2xl shadow-black/40 ${tone === "success" ? "border-success/30" : "border-danger/30"}`}>
        <div className="flex items-start gap-4 border-b border-border p-6">
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border ${tone === "success" ? "border-success/25 bg-success/10 text-emerald-400" : "border-danger/25 bg-danger/10 text-red-400"}`}>{icon}</span>
          <div className="flex-1">
            <h2 id={id} className="font-display text-lg font-bold text-text-primary">{title}</h2>
            <p className="mt-1 text-sm text-text-muted">{description}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-text-muted hover:text-text-secondary"><IcoClose /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function AuditCell({ label, value, success = false }: { label: string; value: string; success?: boolean }) {
  return (
    <div className="bg-sidebar px-5 py-3">
      <div className="text-xs text-text-muted">{label}</div>
      <div className={`mt-1 truncate text-xs font-semibold ${success ? "text-emerald-400" : "text-text-secondary"}`}>{value}</div>
    </div>
  )
}
