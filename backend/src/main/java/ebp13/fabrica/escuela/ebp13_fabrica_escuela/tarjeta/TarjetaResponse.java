package ebp13.fabrica.escuela.ebp13_fabrica_escuela.tarjeta;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TarjetaResponse(
        Long id,
        String numeroEnmascarado,
        TipoTarjeta tipo,
        String estado,
        String bloqueadaPor,
        String motivoRechazo,
        BigDecimal cupoTotal,
        BigDecimal cupoDisponible,
        String cuentaAsociada,
        String titular,
        Long clienteId,
        String clienteIdCliente,
        String clienteCedula,
        String clienteEmail,
        LocalDateTime fechaSolicitud,
        LocalDateTime fechaResolucion
) {}
