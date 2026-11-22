package ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion;

import java.time.LocalDate;
import java.util.Map;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reportes")
public class ReporteController {
    private final ReporteService service;

    public ReporteController(ReporteService service) {
        this.service = service;
    }

    @GetMapping("/actividad")
    public ResponseEntity<?> actividad(
            @RequestHeader(value = "X-Rol", defaultValue = "") String rol,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicial,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFinal,
            @RequestParam(defaultValue = "json") String formato) {
        Map<String, Object> reporte = service.generar(rol, fechaInicial, fechaFinal);
        if ("pdf".equalsIgnoreCase(formato)) {
            return ResponseEntity.ok().header("Content-Type", "application/pdf")
                    .body(service.pdf(reporte));
        }
        if ("xlsx".equalsIgnoreCase(formato)) {
            return ResponseEntity.ok().header("Content-Type",
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    .body(service.excel(reporte));
        }
        return ResponseEntity.ok(reporte);
    }
}
