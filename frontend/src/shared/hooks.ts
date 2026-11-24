import { useCallback, useEffect, useState } from "react"
import { apiRequest, errorMessage } from "./api"
import type { CuentaApi, TarjetaApi, TransaccionApi } from "./types"

type Resource<T> = {
  data: T
  loading: boolean
  error: string
  reload: () => Promise<void>
}

function useResource<T>(path: string | null, initial: T, fallbackError: string): Resource<T> {
  const [data, setData] = useState<T>(initial)
  const [loading, setLoading] = useState(Boolean(path))
  const [error, setError] = useState("")

  const reload = useCallback(async () => {
    if (!path) return
    setLoading(true)
    setError("")
    try {
      setData(await apiRequest<T>(path))
    } catch (err) {
      setError(errorMessage(err, fallbackError))
    } finally {
      setLoading(false)
    }
  }, [path, fallbackError])

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, loading, error, reload }
}

const SIN_CUENTAS: CuentaApi[] = []
const SIN_TRANSACCIONES: TransaccionApi[] = []
const SIN_TARJETAS: TarjetaApi[] = []

export function useMisCuentas() {
  const resource = useResource("/api/cuentas/mias", SIN_CUENTAS, "No fue posible cargar sus cuentas")
  return { ...resource, cuentas: resource.data }
}

export function useHistorial(numeroCuenta: string | null) {
  const resource = useResource(
    numeroCuenta ? `/api/transacciones/cuenta/${encodeURIComponent(numeroCuenta)}` : null,
    SIN_TRANSACCIONES,
    "No fue posible cargar los movimientos",
  )
  return { ...resource, transacciones: numeroCuenta ? resource.data : SIN_TRANSACCIONES }
}

export function useMisTarjetas() {
  const resource = useResource("/api/tarjetas", SIN_TARJETAS, "No fue posible cargar sus tarjetas")
  return { ...resource, tarjetas: resource.data }
}
