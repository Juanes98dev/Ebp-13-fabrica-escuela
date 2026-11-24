package ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.dto;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.TipoCuenta;
import jakarta.validation.constraints.NotNull;

/**
 * {@code clienteId} solo lo usa el gestor; un cliente siempre abre cuentas a su nombre.
 */
public record CuentaRequest(
        Long clienteId,
        @NotNull(message = "El tipo de cuenta es obligatorio") TipoCuenta tipo) {
}
