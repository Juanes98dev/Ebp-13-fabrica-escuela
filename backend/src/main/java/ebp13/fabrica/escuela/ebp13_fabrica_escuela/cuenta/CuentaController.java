package ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.dto.CuentaRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.dto.CuentaResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestHeader;

@RestController
@RequestMapping("/api/cuentas")
public class CuentaController {

    private final CuentaService cuentaService;

    public CuentaController(CuentaService cuentaService) {
        this.cuentaService = cuentaService;
    }

    @PostMapping
    public ResponseEntity<CuentaResponse> crear(@RequestBody CuentaRequest request) {
        CuentaResponse response = cuentaService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{numero}")
    public ResponseEntity<CuentaResponse> consultarPorNumero(
            @PathVariable String numero) {
        return ResponseEntity.ok(cuentaService.consultarPorNumero(numero));
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<CuentaResponse>> listarPorCliente(
            @PathVariable Long clienteId) {
        return ResponseEntity.ok(cuentaService.listarPorCliente(clienteId));
    }

    @PatchMapping("/{numero}/desactivar")
    public ResponseEntity<CuentaResponse> desactivar(
            @PathVariable String numero,
            @RequestHeader(value = "X-Rol", defaultValue = "") String rol,
            @RequestHeader(value = "X-Usuario-Id", defaultValue = "0") Long gestorId) {
        return ResponseEntity.ok(cuentaService.desactivar(numero, rol, gestorId));
    }
}
