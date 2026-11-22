package ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.CuentaRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception.Sprint3Exception;
import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class ReporteService {
    private final TransaccionRepository transacciones;
    private final CuentaRepository cuentas;

    public ReporteService(TransaccionRepository transacciones, CuentaRepository cuentas) {
        this.transacciones = transacciones;
        this.cuentas = cuentas;
    }

    public Map<String, Object> generar(String rol, LocalDate inicial, LocalDate finalDate) {
        if (!"GESTOR".equalsIgnoreCase(rol)) {
            throw new Sprint3Exception(HttpStatus.FORBIDDEN, "Solo disponible para gestor");
        }
        if (inicial == null || finalDate == null || inicial.isAfter(finalDate)) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "El rango de fechas no es válido");
        }
        List<Transaccion> datos = transacciones.findByFechaBetween(
                LocalDateTime.of(inicial, LocalTime.MIN),
                LocalDateTime.of(finalDate, LocalTime.MAX));
        if (datos.isEmpty()) {
            throw new Sprint3Exception(HttpStatus.NOT_FOUND,
                    "No hay transacciones en el rango seleccionado");
        }
        Map<TipoTransaccion, Integer> conteo = new EnumMap<>(TipoTransaccion.class);
        Map<TipoTransaccion, BigDecimal> montos = new EnumMap<>(TipoTransaccion.class);
        BigDecimal total = BigDecimal.ZERO;
        for (TipoTransaccion tipo : TipoTransaccion.values()) {
            conteo.put(tipo, 0);
            montos.put(tipo, BigDecimal.ZERO);
        }
        for (Transaccion transaccion : datos) {
            TipoTransaccion tipo = transaccion.getTipo();
            conteo.put(tipo, conteo.get(tipo) + 1);
            montos.put(tipo, montos.get(tipo).add(transaccion.getMonto()));
            total = total.add(transaccion.getMonto());
        }
        Map<String, Object> reporte = new LinkedHashMap<>();
        reporte.put("fechaInicial", inicial);
        reporte.put("fechaFinal", finalDate);
        reporte.put("totalTransacciones", datos.size());
        reporte.put("montoTotalMovido", total);
        reporte.put("cuentasActivas", cuentas.findAll().stream().filter(c -> c.isActiva()).count());
        reporte.put("porTipo", Map.of(
                "conteo", conteo,
                "montos", montos));
        return reporte;
    }

    public byte[] pdf(Map<String, Object> reporte) {
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, output);
            document.open();
            document.add(new Paragraph("Reporte de actividad"));
            reporte.forEach((key, value) -> {
                try {
                    document.add(new Paragraph(key + ": " + value));
                } catch (Exception ignored) {
                }
            });
            document.close();
            return output.toByteArray();
        } catch (Exception exception) {
            throw new IllegalStateException("No fue posible generar el PDF", exception);
        }
    }

    public byte[] excel(Map<String, Object> reporte) {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            var sheet = workbook.createSheet("Reporte");
            int rowIndex = 0;
            for (Map.Entry<String, Object> entry : reporte.entrySet()) {
                var row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(entry.getKey());
                row.createCell(1).setCellValue(String.valueOf(entry.getValue()));
            }
            workbook.write(output);
            return output.toByteArray();
        } catch (Exception exception) {
            throw new IllegalStateException("No fue posible generar el Excel", exception);
        }
    }
}
