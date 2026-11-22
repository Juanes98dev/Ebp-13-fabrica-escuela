package ebp13.fabrica.escuela.ebp13_fabrica_escuela.tarjeta;

import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tarjetas")
public class TarjetaController {
    private final TarjetaService service;

    public TarjetaController(TarjetaService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<TarjetaResponse>> listar(@RequestParam Long clienteId) {
        return ResponseEntity.ok(service.listar(clienteId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TarjetaResponse> consultar(@PathVariable Long id, @RequestParam Long clienteId) {
        return ResponseEntity.ok(service.consultar(id, clienteId));
    }

    @PostMapping("/{id}/bloquear")
    public ResponseEntity<Map<String, String>> bloquear(@PathVariable Long id, @RequestParam Long clienteId) {
        return ResponseEntity.ok(service.bloquear(id, clienteId));
    }

    @PostMapping("/{id}/desbloquear")
    public ResponseEntity<Map<String, String>> desbloquear(@PathVariable Long id, @RequestParam Long clienteId) {
        return ResponseEntity.ok(service.desbloquear(id, clienteId));
    }

    @PostMapping("/{id}/eliminar")
    public ResponseEntity<Map<String, String>> eliminar(@PathVariable Long id, @RequestParam Long clienteId) {
        return ResponseEntity.ok(service.eliminar(id, clienteId));
    }

    @GetMapping("/solicitudes")
    public ResponseEntity<List<TarjetaResponse>> solicitudes(@RequestHeader(value = "X-Rol", defaultValue = "") String rol) {
        return ResponseEntity.ok(service.solicitudes(rol));
    }

    @PostMapping("/solicitudes/{id}/aprobar")
    public ResponseEntity<Map<String, String>> aprobar(@PathVariable Long id,
                                                         @RequestHeader(value = "X-Rol", defaultValue = "") String rol,
                                                         @RequestHeader(value = "X-Usuario-Id", defaultValue = "0") Long gestorId) {
        return ResponseEntity.ok(service.aprobar(id, rol, gestorId));
    }

    @PostMapping("/solicitudes/{id}/rechazar")
    public ResponseEntity<Map<String, String>> rechazar(@PathVariable Long id,
                                                         @RequestHeader(value = "X-Rol", defaultValue = "") String rol,
                                                         @RequestHeader(value = "X-Usuario-Id", defaultValue = "0") Long gestorId,
                                                         @RequestBody(required = false) Map<String, String> body) {
        return ResponseEntity.ok(service.rechazar(id, rol, gestorId, body == null ? null : body.get("motivo")));
    }
}
