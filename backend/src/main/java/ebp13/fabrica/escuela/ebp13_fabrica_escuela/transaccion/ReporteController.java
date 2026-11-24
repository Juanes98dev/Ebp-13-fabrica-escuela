package ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.sesion.UsuarioSesion;
import java.time.LocalDate;
import java.util.Map;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reportes")
public class ReporteController {
    private static final MediaType XLSX =
            MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    private final ReporteService service;

    public ReporteController(ReporteService service) {
        this.service = service;
    }

    @GetMapping("/actividad")
    public ResponseEntity<?> actividad(
            @RequestAttribute(UsuarioSesion.ATRIBUTO) UsuarioSesion usuario,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicial,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFinal,
            @RequestParam(defaultValue = "json") String formato) {
        usuario.exigirGestor();
        Map<String, Object> reporte = service.generar(usuario, fechaInicial, fechaFinal);
        String nombre = "reporte-actividad_" + fechaInicial + "_" + fechaFinal;
        if ("pdf".equalsIgnoreCase(formato)) {
            return archivo(service.pdf(reporte), MediaType.APPLICATION_PDF, nombre + ".pdf");
        }
        if ("xlsx".equalsIgnoreCase(formato)) {
            return archivo(service.excel(reporte), XLSX, nombre + ".xlsx");
        }
        return ResponseEntity.ok(reporte);
    }

    private ResponseEntity<byte[]> archivo(byte[] contenido, MediaType tipo, String nombre) {
        return ResponseEntity.ok()
                .contentType(tipo)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(nombre).build().toString())
                .body(contenido);
    }
}
