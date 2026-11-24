package ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.dto;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.TipoCuenta;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CuentaResponse(
        Long id,
        String numeroCuenta,
        TipoCuenta tipo,
        BigDecimal saldo,
        boolean activa,
        Long clienteId,
        String idCliente,
        String titular,
        LocalDateTime fechaApertura,
        long tarjetasActivas) {
}
