import type { Transaccion } from "./types";

export const CEDULAS_EXISTENTES = ["1234567890", "9876543210", "1111111111"];

export const CLIENTE_ACTIVO = {
  id: "BX-M9K3A2-X7F",
  nombre: "Valentina Morales",
  cedula: "1023456789",
  email: "v.morales@email.com",
  estado: "Activo",
  iniciales: "VM",
  cuentas: [
    { numero: "301-847-2291-05", tipo: "Ahorros", saldo: 4_820_500 },
    { numero: "501-293-8841-17", tipo: "Corriente", saldo: 1_250_000 },
  ],
};

export const CLIENTES_CONSULTA = [
  {
    id: "BX-C10-20304050",
    document: "1020304050",
    formattedDocument: "1.020.304.050",
    name: "Laura Sofía Mendoza Ruiz",
    initials: "LM",
    status: "Activo",
    customerSince: "2021",
    personal: [
      { label: "Tipo de documento", value: "Cédula de ciudadanía" },
      { label: "Número de documento", value: "1.020.304.050" },
      { label: "Fecha de nacimiento", value: "18 de mayo de 1991" },
      { label: "Correo electrónico", value: "laura.mendoza@email.com" },
      { label: "Teléfono", value: "+57 310 456 7890" },
      { label: "Ciudad", value: "Bogotá D.C." },
      { label: "Dirección", value: "Carrera 18 # 82-45" },
      { label: "Vinculación", value: "12 de febrero de 2021" },
    ],
    accounts: [
      { type: "Cuenta de ahorros", number: "•••• 4812", balance: "$ 8.450.320", status: "Activa" },
      { type: "Cuenta corriente", number: "•••• 9036", balance: "$ 2.180.000", status: "Activa" },
    ],
    cards: [
      { type: "Tarjeta débito", number: "•••• 2841", detail: "Vence 08/29", status: "Activa" },
      { type: "Tarjeta crédito", number: "•••• 7164", detail: "Cupo $ 6.000.000", status: "Bloqueada" },
    ],
  },
  {
    id: "BX-C79-45612308",
    document: "7945612308",
    formattedDocument: "7.945.612.308",
    name: "Carlos Andrés Herrera",
    initials: "CH",
    status: "Activo",
    customerSince: "2019",
    personal: [
      { label: "Tipo de documento", value: "Cédula de ciudadanía" },
      { label: "Número de documento", value: "7.945.612.308" },
      { label: "Fecha de nacimiento", value: "3 de noviembre de 1984" },
      { label: "Correo electrónico", value: "carlos.herrera@email.com" },
      { label: "Teléfono", value: "+57 315 204 1187" },
      { label: "Ciudad", value: "Medellín" },
      { label: "Dirección", value: "Calle 10 # 34-21" },
      { label: "Vinculación", value: "6 de agosto de 2019" },
    ],
    accounts: [
      { type: "Cuenta de ahorros", number: "•••• 1988", balance: "$ 3.275.900", status: "Activa" },
    ],
    cards: [
      { type: "Tarjeta débito", number: "•••• 6103", detail: "Vence 11/28", status: "Activa" },
    ],
  },
  {
    id: "BX-C52-78903416",
    document: "5278903416",
    formattedDocument: "5.278.903.416",
    name: "Ana Lucía Torres",
    initials: "AT",
    status: "Inactivo",
    customerSince: "2023",
    personal: [
      { label: "Tipo de documento", value: "Cédula de ciudadanía" },
      { label: "Número de documento", value: "5.278.903.416" },
      { label: "Fecha de nacimiento", value: "27 de enero de 1995" },
      { label: "Correo electrónico", value: "ana.torres@email.com" },
      { label: "Teléfono", value: "+57 300 882 4071" },
      { label: "Ciudad", value: "Cali" },
      { label: "Dirección", value: "Avenida 6N # 24-18" },
      { label: "Vinculación", value: "20 de marzo de 2023" },
    ],
    accounts: [
      { type: "Cuenta corriente", number: "•••• 0099", balance: "$ 940.000", status: "Inactiva" },
    ],
    cards: [
      { type: "Tarjeta débito", number: "•••• 4430", detail: "Vence 03/29", status: "Bloqueada" },
    ],
  },
];

export const CUENTAS_SISTEMA: Record<string, { nombre: string; tipo: string; activa: boolean }> = {
  "301-847-2291-05": { nombre: "Valentina Morales", tipo: "Ahorros", activa: true },
  "501-293-8841-17": { nombre: "Valentina Morales", tipo: "Corriente", activa: true },
  "301-002-4419-88": { nombre: "Carlos Herrera", tipo: "Ahorros", activa: true },
  "501-774-3310-22": { nombre: "Lucía Fernández", tipo: "Corriente", activa: true },
  "301-558-7764-03": { nombre: "Jorge Medina", tipo: "Ahorros", activa: false },
  "501-001-0000-99": { nombre: "Ana Torres", tipo: "Corriente", activa: true },
};

export const HISTORIAL_INICIAL: Transaccion[] = [
  { id: "tx-001", fecha: "2026-09-08T14:23:00", tipo: "recibida", descripcion: "Transferencia de Carlos Herrera", monto: 500_000, cuentaOrigen: "301-002-4419-88", cuentaDestino: "301-847-2291-05", referencia: "REF-8812KA" },
  { id: "tx-002", fecha: "2026-09-07T09:10:00", tipo: "enviada", descripcion: "Pago a Lucía Fernández", monto: 120_000, cuentaOrigen: "301-847-2291-05", cuentaDestino: "501-774-3310-22", referencia: "REF-7741MX" },
  { id: "tx-003", fecha: "2026-09-05T18:45:00", tipo: "recibida", descripcion: "Transferencia de Ana Torres", monto: 800_000, cuentaOrigen: "501-001-0000-99", cuentaDestino: "501-293-8841-17", referencia: "REF-3309ZQ" },
];

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
