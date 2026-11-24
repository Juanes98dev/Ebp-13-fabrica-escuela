package ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.dto;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.TipoCuenta;

/**
 * Datos mínimos de una cuenta de terceros: sin saldo y con el titular enmascarado.
 */
public record CuentaDestinoResponse(
        String numeroCuenta,
        TipoCuenta tipo,
        boolean activa,
        String titular,
        boolean propia) {
}
