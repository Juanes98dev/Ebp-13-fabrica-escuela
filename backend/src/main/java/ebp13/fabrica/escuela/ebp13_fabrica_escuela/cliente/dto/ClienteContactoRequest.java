package ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ClienteContactoRequest(
        @NotBlank(message = "El correo electrónico es obligatorio")
        @Email(message = "Correo electrónico inválido")
        @Size(max = 150, message = "El correo no puede superar 150 caracteres")
        String email,

        @NotBlank(message = "El teléfono es obligatorio")
        @Pattern(regexp = "^[0-9+() -]{7,20}$", message = "Teléfono inválido")
        String telefono,

        @Size(max = 200, message = "La dirección no puede superar 200 caracteres")
        String direccion) {
}
