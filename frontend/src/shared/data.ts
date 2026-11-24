import type { Transaccion } from "./types";

export const CEDULAS_EXISTENTES: string[] = [];

export const CLIENTE_ACTIVO = {
  id: "",
  nombre: "Cliente",
  cedula: "",
  email: "",
  estado: "Activo",
  iniciales: "CL",
  cuentas: [],
};

export const CLIENTES_CONSULTA: any[] = [];

export const CUENTAS_SISTEMA: Record<string, { nombre: string; tipo: string; activa: boolean }> = {};

export const HISTORIAL_INICIAL: Transaccion[] = [];

export const CANALES_RETIRO = [
  { id: "cajero", label: "Cajero Automático", desc: "Retira en cualquier ATM Banco X con tu código", icon: "🏧" },
  { id: "ventanilla", label: "Ventanilla", desc: "Presentando tu documento en cualquier sucursal", icon: "🏦" },
  { id: "digital", label: "Billetera Digital", desc: "Transferencia a tu billetera vinculada (Nequi, Daviplata)", icon: "📱" },
];

export const CANALES_CONSIGNACION = [
  { id: "efectivo", label: "Efectivo en sucursal", desc: "Entrega el dinero en cualquier oficina Banco X", icon: "💵" },
  { id: "cheque", label: "Cheque", desc: "Cheques propios o de otros bancos (hasta 24 h hábiles)", icon: "📄" },
  { id: "pse", label: "PSE / Banca virtual", desc: "Desde otro banco directamente a tu cuenta", icon: "🔗" },
  { id: "corresponsal", label: "Corresponsal bancario", desc: "Puntos autorizados Éxito, Olímpica, Supermercados", icon: "🏪" },
];
