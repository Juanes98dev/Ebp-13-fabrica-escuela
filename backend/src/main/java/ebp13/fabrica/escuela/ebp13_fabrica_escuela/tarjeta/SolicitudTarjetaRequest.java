package ebp13.fabrica.escuela.ebp13_fabrica_escuela.tarjeta;

import jakarta.validation.constraints.NotNull;

/**
 * {@code numeroCuenta} es obligatoria para débito; para crédito es opcional (cuenta de pago).
 */
public record SolicitudTarjetaRequest(
        @NotNull(message = "Seleccione el tipo de tarjeta") TipoTarjeta tipo,
        String numeroCuenta) {
}
