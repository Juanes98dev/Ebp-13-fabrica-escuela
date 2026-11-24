package ebp13.fabrica.escuela.ebp13_fabrica_escuela.sesion;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest body,
                                                     @RequestHeader(value = "User-Agent", required = false) String dispositivo) {
        return ResponseEntity.ok(service.login(body.cedula(), body.password(), dispositivo));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario) {
        service.logout(usuario);
        return ResponseEntity.ok(Map.of("mensaje", "Sesión cerrada"));
    }

    @GetMapping("/sesion")
    public ResponseEntity<Map<String, Object>> sesion(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario) {
        return ResponseEntity.ok(service.sesionActual(usuario));
    }

    @PostMapping("/cambiar-password")
    public ResponseEntity<Map<String, String>> cambiarPassword(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario,
            @Valid @RequestBody CambioPasswordRequest body) {
        service.cambiarPassword(usuario, body.passwordActual(), body.passwordNueva());
        return ResponseEntity.ok(Map.of("mensaje", "Contraseña actualizada correctamente"));
    }

    public record LoginRequest(
            @NotBlank(message = "Ingrese la cédula") String cedula,
            @NotBlank(message = "Ingrese la contraseña") String password) {
    }

    public record CambioPasswordRequest(
            @NotBlank(message = "Ingrese la contraseña actual") String passwordActual,
            @NotBlank(message = "Ingrese la nueva contraseña") String passwordNueva) {
    }
}
