package ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.auditoria.AuditoriaRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.auditoria.RegistroAuditoria;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.CuentaRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.sesion.UsuarioSesion;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception.Sprint3Exception;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReporteService {

    private static final long MAX_DIAS_RANGO = 366;
    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final Map<TipoTransaccion, String> ETIQUETAS = Map.of(
            TipoTransaccion.TRANSFERENCIA, "Transferencias",
            TipoTransaccion.RETIRO, "Retiros",
            TipoTransaccion.CONSIGNACION, "Consignaciones");

    private final TransaccionRepository transacciones;
    private final CuentaRepository cuentas;
    private final AuditoriaRepository auditoria;

    public ReporteService(TransaccionRepository transacciones, CuentaRepository cuentas,
                          AuditoriaRepository auditoria) {
        this.transacciones = transacciones;
        this.cuentas = cuentas;
        this.auditoria = auditoria;
    }

    @Transactional
    public Map<String, Object> generar(UsuarioSesion gestor, LocalDate inicial, LocalDate finalDate) {
        if (inicial == null || finalDate == null || inicial.isAfter(finalDate)) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "El rango de fechas no es válido");
        }
        if (finalDate.isAfter(LocalDate.now())) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "La fecha final no puede ser futura");
        }
        if (ChronoUnit.DAYS.between(inicial, finalDate) > MAX_DIAS_RANGO) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "El rango máximo del reporte es de un año");
        }
        List<Transaccion> datos = transacciones.findByFechaBetweenOrderByFechaAsc(
                LocalDateTime.of(inicial, LocalTime.MIN),
                LocalDateTime.of(finalDate, LocalTime.MAX));
        if (datos.isEmpty()) {
            throw new Sprint3Exception(HttpStatus.NOT_FOUND, "No hay transacciones en el rango seleccionado");
        }
        Map<TipoTransaccion, Integer> conteo = new EnumMap<>(TipoTransaccion.class);
        Map<TipoTransaccion, BigDecimal> montos = new EnumMap<>(TipoTransaccion.class);
        for (TipoTransaccion tipo : TipoTransaccion.values()) {
            conteo.put(tipo, 0);
            montos.put(tipo, BigDecimal.ZERO);
        }
        BigDecimal total = BigDecimal.ZERO;
        for (Transaccion transaccion : datos) {
            TipoTransaccion tipo = transaccion.getTipo();
            conteo.merge(tipo, 1, Integer::sum);
            montos.merge(tipo, transaccion.getMonto(), BigDecimal::add);
            total = total.add(transaccion.getMonto());
        }
        Map<String, Object> porTipo = new LinkedHashMap<>();
        porTipo.put("conteo", conteo);
        porTipo.put("montos", montos);

        Map<String, Object> reporte = new LinkedHashMap<>();
        reporte.put("fechaInicial", inicial);
        reporte.put("fechaFinal", finalDate);
        reporte.put("generadoEn", LocalDateTime.now());
        reporte.put("generadoPor", gestor.nombre());
        reporte.put("totalTransacciones", datos.size());
        reporte.put("montoTotalMovido", total);
        reporte.put("cuentasActivas", cuentas.countByActivaTrue());
        reporte.put("porTipo", porTipo);

        auditoria.save(new RegistroAuditoria(gestor.id(), gestor.rol(), "GENERAR_REPORTE",
                "REPORTE", inicial + "_" + finalDate, null, null));
        return reporte;
    }

    public byte[] pdf(Map<String, Object> reporte) {
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, output);
            document.open();
            Font titulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Font negrita = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            document.add(new Paragraph("Banco X - Reporte de actividad", titulo));
            document.add(new Paragraph(" "));
            for (String[] fila : resumen(reporte)) {
                document.add(new Paragraph(fila[0] + ": " + fila[1]));
            }
            document.add(new Paragraph(" "));
            PdfPTable tabla = new PdfPTable(3);
            tabla.setWidthPercentage(100);
            tabla.addCell(new Paragraph("Tipo", negrita));
            tabla.addCell(new Paragraph("Cantidad", negrita));
            tabla.addCell(new Paragraph("Monto", negrita));
            for (String[] fila : detalle(reporte)) {
                for (String celda : fila) {
                    tabla.addCell(celda);
                }
            }
            document.add(tabla);
            document.close();
            return output.toByteArray();
        } catch (DocumentException | IOException exception) {
            throw new IllegalStateException("No fue posible generar el PDF", exception);
        }
    }

    public byte[] excel(Map<String, Object> reporte) {
        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Reporte");
            int rowIndex = 0;
            sheet.createRow(rowIndex++).createCell(0).setCellValue("Banco X - Reporte de actividad");
            rowIndex++;
            for (String[] fila : resumen(reporte)) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(fila[0]);
                row.createCell(1).setCellValue(fila[1]);
            }
            rowIndex++;
            Row encabezado = sheet.createRow(rowIndex++);
            encabezado.createCell(0).setCellValue("Tipo");
            encabezado.createCell(1).setCellValue("Cantidad");
            encabezado.createCell(2).setCellValue("Monto");
            for (String[] fila : detalle(reporte)) {
                Row row = sheet.createRow(rowIndex++);
                for (int i = 0; i < fila.length; i++) {
                    row.createCell(i).setCellValue(fila[i]);
                }
            }
            for (int i = 0; i < 3; i++) {
                sheet.autoSizeColumn(i);
            }
            workbook.write(output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("No fue posible generar el Excel", exception);
        }
    }

    private List<String[]> resumen(Map<String, Object> reporte) {
        return List.of(
                new String[] {"Periodo", formatoFecha(reporte.get("fechaInicial")) + " a "
                        + formatoFecha(reporte.get("fechaFinal"))},
                new String[] {"Generado por", String.valueOf(reporte.get("generadoPor"))},
                new String[] {"Total de transacciones", String.valueOf(reporte.get("totalTransacciones"))},
                new String[] {"Monto total movido", moneda((BigDecimal) reporte.get("montoTotalMovido"))},
                new String[] {"Cuentas activas", String.valueOf(reporte.get("cuentasActivas"))});
    }

    @SuppressWarnings("unchecked")
    private List<String[]> detalle(Map<String, Object> reporte) {
        Map<String, Object> porTipo = (Map<String, Object>) reporte.get("porTipo");
        Map<TipoTransaccion, Integer> conteo = (Map<TipoTransaccion, Integer>) porTipo.get("conteo");
        Map<TipoTransaccion, BigDecimal> montos = (Map<TipoTransaccion, BigDecimal>) porTipo.get("montos");
        return conteo.keySet().stream()
                .map(tipo -> new String[] {
                    ETIQUETAS.get(tipo), String.valueOf(conteo.get(tipo)), moneda(montos.get(tipo))})
                .toList();
    }

    private String formatoFecha(Object fecha) {
        return fecha instanceof LocalDate local ? local.format(FECHA) : String.valueOf(fecha);
    }

    private String moneda(BigDecimal valor) {
        NumberFormat formato = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("es-CO"));
        formato.setMaximumFractionDigits(0);
        return formato.format(valor == null ? BigDecimal.ZERO : valor);
    }
}
