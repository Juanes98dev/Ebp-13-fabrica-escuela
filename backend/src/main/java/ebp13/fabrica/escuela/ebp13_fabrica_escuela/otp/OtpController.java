package ebp13.fabrica.escuela.ebp13_fabrica_escuela.otp;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class OtpController {
    private final OtpService service;

    public OtpController(OtpService service) {
        this.service = service;
    }

    @PostMapping("/recuperar")
    public ResponseEntity<Map<String, String>> solicitar(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.solicitar(body.get("correo")));
    }

    @PostMapping("/restablecer")
    public ResponseEntity<Map<String, String>> restablecer(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.restablecer(
                body.get("correo"), body.get("codigo"), body.get("password")));
    }
}
