package ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.dto.ClienteContactoRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.dto.ClienteRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.dto.ClienteResponse;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.sesion.UsuarioSesion;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    @PostMapping
    public ResponseEntity<ClienteResponse> crear(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario,
            @Valid @RequestBody ClienteRequest request) {
        usuario.exigirGestor();
        return ResponseEntity.status(HttpStatus.CREATED).body(clienteService.crear(usuario, request));
    }

    @GetMapping
    public ResponseEntity<List<ClienteResponse>> listar(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario) {
        usuario.exigirGestor();
        return ResponseEntity.ok(clienteService.listar());
    }

    @GetMapping("/buscar/{valor}")
    public ResponseEntity<ClienteResponse> buscar(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario,
            @PathVariable String valor) {
        usuario.exigirGestor();
        return ResponseEntity.ok(clienteService.buscar(usuario, valor));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClienteResponse> modificar(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario,
            @PathVariable Long id,
            @Valid @RequestBody ClienteContactoRequest request) {
        usuario.exigirGestor();
        return ResponseEntity.ok(clienteService.modificar(usuario, id, request));
    }

    @PatchMapping("/{id}/desactivar")
    public ResponseEntity<ClienteResponse> desactivar(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario,
            @PathVariable Long id) {
        usuario.exigirGestor();
        return ResponseEntity.ok(clienteService.desactivar(usuario, id));
    }
}
