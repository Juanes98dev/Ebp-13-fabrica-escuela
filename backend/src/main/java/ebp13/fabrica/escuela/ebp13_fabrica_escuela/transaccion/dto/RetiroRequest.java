package ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record RetiroRequest(
        @NotBlank(message = "Seleccione la cuenta") String numeroCuenta,
        @NotNull(message = "Ingrese el monto")
        @DecimalMin(value = "0.01", message = "El monto debe ser mayor que cero")
        @Digits(integer = 13, fraction = 2, message = "El monto no es válido")
        BigDecimal monto,
        @Size(max = 120, message = "El concepto no puede superar 120 caracteres") String concepto) {
}
