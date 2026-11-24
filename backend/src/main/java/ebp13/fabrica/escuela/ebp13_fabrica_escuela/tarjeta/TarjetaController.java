package ebp13.fabrica.escuela.ebp13_fabrica_escuela.tarjeta;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.sesion.UsuarioSesion;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tarjetas")
public class TarjetaController {
    private final TarjetaService service;

    public TarjetaController(TarjetaService service) {
        this.service = service;
    }

    /** El cliente ve sus tarjetas; el gestor puede consultar las de un cliente con {@code clienteId}. */
    @GetMapping
    public ResponseEntity<List<TarjetaResponse>> listar(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario,
            @RequestParam(required = false) Long clienteId) {
        return ResponseEntity.ok(service.listar(usuario, clienteId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TarjetaResponse> consultar(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario,
            @PathVariable Long id) {
        return ResponseEntity.ok(service.consultar(usuario, id));
    }

    @PostMapping("/solicitudes")
    public ResponseEntity<TarjetaResponse> solicitar(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario,
            @Valid @RequestBody SolicitudTarjetaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.solicitar(usuario, request));
    }

    @PostMapping("/{id}/bloquear")
    public ResponseEntity<Map<String, String>> bloquear(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario,
            @PathVariable Long id) {
        return ResponseEntity.ok(service.bloquear(usuario, id));
    }

    @PostMapping("/{id}/desbloquear")
    public ResponseEntity<Map<String, String>> desbloquear(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario,
            @PathVariable Long id) {
        return ResponseEntity.ok(service.desbloquear(usuario, id));
    }

    @PostMapping("/{id}/eliminar")
    public ResponseEntity<Map<String, String>> eliminar(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario,
            @PathVariable Long id) {
        return ResponseEntity.ok(service.eliminar(usuario, id));
    }

    @GetMapping("/solicitudes")
    public ResponseEntity<List<TarjetaResponse>> solicitudes(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario) {
        usuario.exigirGestor();
        return ResponseEntity.ok(service.solicitudes());
    }

    @PostMapping("/solicitudes/{id}/aprobar")
    public ResponseEntity<Map<String, String>> aprobar(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario,
            @PathVariable Long id) {
        usuario.exigirGestor();
        return ResponseEntity.ok(service.aprobar(usuario, id));
    }

    @PostMapping("/solicitudes/{id}/rechazar")
    public ResponseEntity<Map<String, String>> rechazar(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario,
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        usuario.exigirGestor();
        return ResponseEntity.ok(service.rechazar(usuario, id, body == null ? null : body.get("motivo")));
    }
}
