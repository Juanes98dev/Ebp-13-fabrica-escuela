package ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.dto.CuentaDestinoResponse;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.dto.CuentaRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.dto.CuentaResponse;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.sesion.UsuarioSesion;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cuentas")
public class CuentaController {

    private final CuentaService cuentaService;

    public CuentaController(CuentaService cuentaService) {
        this.cuentaService = cuentaService;
    }

    @PostMapping
    public ResponseEntity<CuentaResponse> crear(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario,
            @Valid @RequestBody CuentaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cuentaService.crear(usuario, request));
    }

    @GetMapping("/mias")
    public ResponseEntity<List<CuentaResponse>> misCuentas(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario) {
        return ResponseEntity.ok(cuentaService.listarPorCliente(usuario, usuario.id()));
    }

    @GetMapping("/{numero}")
    public ResponseEntity<CuentaResponse> consultarPorNumero(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario,
            @PathVariable String numero) {
        return ResponseEntity.ok(cuentaService.consultarPorNumero(usuario, numero));
    }

    @GetMapping("/{numero}/destino")
    public ResponseEntity<CuentaDestinoResponse> consultarDestino(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario,
            @PathVariable String numero) {
        return ResponseEntity.ok(cuentaService.consultarDestino(usuario, numero));
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<CuentaResponse>> listarPorCliente(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario,
            @PathVariable Long clienteId) {
        return ResponseEntity.ok(cuentaService.listarPorCliente(usuario, clienteId));
    }

    @PatchMapping("/{numero}/desactivar")
    public ResponseEntity<CuentaResponse> desactivar(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario,
            @PathVariable String numero) {
        usuario.exigirGestor();
        return ResponseEntity.ok(cuentaService.desactivar(usuario, numero));
    }
}
