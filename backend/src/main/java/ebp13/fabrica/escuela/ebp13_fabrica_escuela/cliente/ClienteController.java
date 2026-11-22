package ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.dto.ClienteRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.dto.ClienteResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    @PostMapping
    public ResponseEntity<ClienteResponse> crear(
            @Valid @RequestBody ClienteRequest request
    ) {
        ClienteResponse response = clienteService.crear(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping
    public ResponseEntity<List<ClienteResponse>> listar() {
        return ResponseEntity.ok(clienteService.listar());
    }

    @GetMapping("/buscar/{valor}")
    public ResponseEntity<ClienteResponse> buscar(@PathVariable String valor) {
        return ResponseEntity.ok(clienteService.buscar(valor));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClienteResponse> modificar(
            @PathVariable Long id,
            @RequestHeader(value = "X-Rol", defaultValue = "") String rol,
            @RequestHeader(value = "X-Usuario-Id", defaultValue = "0") Long gestorId,
            @RequestBody ClienteRequest request) {
        return ResponseEntity.ok(clienteService.modificar(id, rol, gestorId, request));
    }

    @PatchMapping("/{id}/desactivar")
    public ResponseEntity<ClienteResponse> desactivar(
            @PathVariable Long id,
            @RequestHeader(value = "X-Rol", defaultValue = "") String rol,
            @RequestHeader(value = "X-Usuario-Id", defaultValue = "0") Long gestorId) {
        return ResponseEntity.ok(clienteService.desactivar(id, rol, gestorId));
    }
}