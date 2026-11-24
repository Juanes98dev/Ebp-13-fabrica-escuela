export type TipoCuenta = "AHORROS" | "CORRIENTE"

export type CuentaApi = {
  id: number
  numeroCuenta: string
  tipo: TipoCuenta
  saldo: number
  activa: boolean
  clienteId: number
  idCliente: string
  titular: string
  fechaApertura: string | null
  tarjetasActivas: number
}

export type CuentaDestinoApi = {
  numeroCuenta: string
  tipo: TipoCuenta
  activa: boolean
  titular: string
  propia: boolean
}

export type TipoTransaccion = "TRANSFERENCIA" | "RETIRO" | "CONSIGNACION"

export type TransaccionApi = {
  id: number
  referencia: string
  tipo: TipoTransaccion
  monto: number
  cuentaOrigen: string | null
  cuentaDestino: string | null
  titularOrigen: string | null
  titularDestino: string | null
  fecha: string
  descripcion: string | null
  estado: string
}

export type EstadoTarjeta =
  | "pendiente"
  | "activa"
  | "bloqueada"
  | "rechazada"
  | "eliminada"

export type TarjetaApi = {
  id: number
  numeroEnmascarado: string
  tipo: "DEBITO" | "CREDITO"
  estado: EstadoTarjeta
  bloqueadaPor: string | null
  motivoRechazo: string | null
  cupoTotal: number | null
  cupoDisponible: number | null
  cuentaAsociada: string | null
  titular: string
  clienteId: number
  clienteIdCliente: string
  clienteCedula: string
  clienteEmail: string | null
  fechaSolicitud: string | null
  fechaResolucion: string | null
}

export type ClienteApi = {
  id: number
  idCliente: string
  cedula: string
  primerNombre: string
  segundoNombre: string | null
  primerApellido: string
  segundoApellido: string | null
  nombreCompleto: string
  fechaNacimiento: string | null
  genero: string | null
  email: string | null
  telefono: string | null
  direccion: string | null
  ciudad: string | null
  departamento: string | null
  activo: boolean
  fechaRegistro: string | null
}

export type ManagerFormData = {
  cedula: string
  primerNombre: string
  segundoNombre: string
  primerApellido: string
  segundoApellido: string
  fechaNacimiento: string
  genero: string
  email: string
  telefono: string
  direccion: string
  ciudad: string
  departamento: string
}

export type ManagerFormErrors = Partial<Record<keyof ManagerFormData, string>>
