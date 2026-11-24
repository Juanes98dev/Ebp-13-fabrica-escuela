package ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.sesion.UsuarioSesion;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto.ConsignacionRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto.RetiroRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto.TransaccionResponse;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto.TransferenciaRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/transacciones")
public class TransaccionController {

    private final TransaccionService transaccionService;

    public TransaccionController(TransaccionService transaccionService) {
        this.transaccionService = transaccionService;
    }

    @PostMapping("/transferencia")
    public ResponseEntity<TransaccionResponse> transferir(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario,
            @Valid @RequestBody TransferenciaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(transaccionService.transferir(usuario, request));
    }

    @PostMapping("/retiro")
    public ResponseEntity<TransaccionResponse> retirar(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario,
            @Valid @RequestBody RetiroRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(transaccionService.retirar(usuario, request));
    }

    @PostMapping("/consignacion")
    public ResponseEntity<TransaccionResponse> consignar(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario,
            @Valid @RequestBody ConsignacionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(transaccionService.consignar(usuario, request));
    }

    @GetMapping("/cuenta/{numero}")
    public ResponseEntity<List<TransaccionResponse>> historial(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario,
            @PathVariable String numero) {
        return ResponseEntity.ok(transaccionService.historial(usuario, numero));
    }

    @GetMapping("/referencia/{referencia}")
    public ResponseEntity<TransaccionResponse> detalle(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario,
            @PathVariable String referencia) {
        return ResponseEntity.ok(transaccionService.detalle(usuario, referencia));
    }
}
