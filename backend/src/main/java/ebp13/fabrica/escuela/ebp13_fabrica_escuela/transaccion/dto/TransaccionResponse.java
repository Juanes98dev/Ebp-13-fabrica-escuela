package ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.TipoTransaccion;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransaccionResponse(
        Long id,
        String referencia,
        TipoTransaccion tipo,
        BigDecimal monto,
        String cuentaOrigen,
        String cuentaDestino,
        String titularOrigen,
        String titularDestino,
        LocalDateTime fecha,
        String descripcion,
        String estado) {
}
