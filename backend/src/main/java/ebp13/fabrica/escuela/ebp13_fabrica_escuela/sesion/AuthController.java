package ebp13.fabrica.escuela.ebp13_fabrica_escuela.sesion;

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
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body,
                                                       @RequestHeader(value = "User-Agent", defaultValue = "Desconocido") String dispositivo) {
        return ResponseEntity.ok(service.login(body.get("cedula"), body.get("password"), dispositivo));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(@RequestHeader("X-Session-Token") String token) {
        service.logout(token);
        return ResponseEntity.ok(Map.of("mensaje", "Sesión cerrada"));
    }
}
