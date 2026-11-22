package ebp13.fabrica.escuela.ebp13_fabrica_escuela.tarjeta;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.auditoria.AuditoriaRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.auditoria.RegistroAuditoria;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.MailService;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception.Sprint3Exception;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TarjetaService {
    private final TarjetaRepository repository;
    private final AuditoriaRepository auditoria;
    private final MailService mail;

    public TarjetaService(TarjetaRepository repository, AuditoriaRepository auditoria, MailService mail) {
        this.repository = repository;
        this.auditoria = auditoria;
        this.mail = mail;
    }

    @Transactional(readOnly = true)
    public List<TarjetaResponse> listar(Long clienteId) {
        return repository.findByCliente_Id(clienteId).stream()
                .filter(t -> !"eliminada".equals(t.getEstado()))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TarjetaResponse consultar(Long id, Long clienteId) {
        Tarjeta tarjeta = repository.findById(id).orElseThrow(
                () -> new Sprint3Exception(HttpStatus.NOT_FOUND, "Tarjeta no encontrada"));
        if (!tarjeta.getCliente().getId().equals(clienteId)) {
            throw new Sprint3Exception(HttpStatus.NOT_FOUND, "Tarjeta no encontrada");
        }
        return toResponse(tarjeta);
    }

    @Transactional
    public Map<String, String> bloquear(Long id, Long clienteId) {
        Tarjeta tarjeta = repository.findById(id).orElseThrow(
                () -> new Sprint3Exception(HttpStatus.NOT_FOUND, "Tarjeta no encontrada"));
        if (!tarjeta.getCliente().getId().equals(clienteId)) {
            throw new Sprint3Exception(HttpStatus.NOT_FOUND, "Tarjeta no encontrada");
        }
        if ("bloqueada".equals(tarjeta.getEstado())) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "La tarjeta está bloqueada");
        }
        if (!"activa".equals(tarjeta.getEstado())) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "La tarjeta no está activa");
        }
        tarjeta.setEstado("bloqueada");
        tarjeta.setBloqueadaPor("cliente");
        repository.save(tarjeta);
        auditoria.save(new RegistroAuditoria(clienteId, "CLIENTE", "BLOQUEAR_TARJETA",
                "TARJETA", id.toString(), "activa", "bloqueada"));
        return Map.of("mensaje", "Tarjeta bloqueada exitosamente");
    }

    @Transactional
    public Map<String, String> desbloquear(Long id, Long clienteId) {
        Tarjeta tarjeta = repository.findById(id).orElseThrow(
                () -> new Sprint3Exception(HttpStatus.NOT_FOUND, "Tarjeta no encontrada"));
        if (!tarjeta.getCliente().getId().equals(clienteId)) {
            throw new Sprint3Exception(HttpStatus.NOT_FOUND, "Tarjeta no encontrada");
        }
        if ("gestor".equals(tarjeta.getBloqueadaPor())) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST,
                    "Esta tarjeta fue bloqueada por el banco, comuníquese con un gestor");
        }
        if ("activa".equals(tarjeta.getEstado())) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "La tarjeta ya está activa");
        }
        tarjeta.setEstado("activa");
        tarjeta.setBloqueadaPor(null);
        repository.save(tarjeta);
        auditoria.save(new RegistroAuditoria(clienteId, "CLIENTE", "DESBLOQUEAR_TARJETA",
                "TARJETA", id.toString(), "bloqueada", "activa"));
        return Map.of("mensaje", "Tarjeta desbloqueada correctamente");
    }

    @Transactional
    public Map<String, String> eliminar(Long id, Long clienteId) {
        Tarjeta tarjeta = repository.findById(id).orElseThrow(
                () -> new Sprint3Exception(HttpStatus.NOT_FOUND, "Tarjeta no encontrada"));
        if (!tarjeta.getCliente().getId().equals(clienteId)) {
            throw new Sprint3Exception(HttpStatus.NOT_FOUND, "Tarjeta no encontrada");
        }
        if (tarjeta.getTipo() == TipoTarjeta.CREDITO
                && tarjeta.getCupoDisponible() != null
                && tarjeta.getCupoTotal() != null
                && tarjeta.getCupoDisponible().compareTo(tarjeta.getCupoTotal()) < 0) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST,
                    "No es posible eliminar la tarjeta: tiene movimientos pendientes");
        }
        tarjeta.setEstado("eliminada");
        repository.save(tarjeta);
        auditoria.save(new RegistroAuditoria(clienteId, "CLIENTE", "ELIMINAR_TARJETA",
                "TARJETA", id.toString(), "activa", "eliminada"));
        return Map.of("mensaje", "Tarjeta eliminada exitosamente");
    }

    @Transactional(readOnly = true)
    public List<TarjetaResponse> solicitudes(String rol) {
        validarGestor(rol);
        return repository.findByEstado("pendiente").stream().map(this::toResponse).toList();
    }

    @Transactional
    public Map<String, String> aprobar(Long id, String rol, Long gestorId) {
        validarGestor(rol);
        Tarjeta tarjeta = repository.findById(id).orElseThrow(
                () -> new Sprint3Exception(HttpStatus.NOT_FOUND, "Tarjeta no encontrada"));
        tarjeta.setEstado("activa");
        tarjeta.setMotivoRechazo(null);
        repository.save(tarjeta);
        auditoria.save(new RegistroAuditoria(gestorId, "GESTOR", "APROBAR_TARJETA",
                "TARJETA", id.toString(), "pendiente", "activa"));
        mail.send(tarjeta.getCliente().getEmail(), "Solicitud de tarjeta aprobada",
                "Su solicitud de tarjeta fue aprobada.");
        return Map.of("mensaje", "Solicitud aprobada");
    }

    @Transactional
    public Map<String, String> rechazar(Long id, String rol, Long gestorId, String motivo) {
        validarGestor(rol);
        if (motivo == null || motivo.isBlank()) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "Debe ingresar el motivo del rechazo");
        }
        Tarjeta tarjeta = repository.findById(id).orElseThrow(
                () -> new Sprint3Exception(HttpStatus.NOT_FOUND, "Tarjeta no encontrada"));
        tarjeta.setEstado("rechazada");
        tarjeta.setMotivoRechazo(motivo.trim());
        repository.save(tarjeta);
        auditoria.save(new RegistroAuditoria(gestorId, "GESTOR", "RECHAZAR_TARJETA",
                "TARJETA", id.toString(), "pendiente", "rechazada"));
        mail.send(tarjeta.getCliente().getEmail(), "Solicitud de tarjeta rechazada",
                "Motivo: " + motivo.trim());
        return Map.of("mensaje", "Solicitud rechazada");
    }

    private void validarGestor(String rol) {
        if (!"GESTOR".equalsIgnoreCase(rol)) {
            throw new Sprint3Exception(HttpStatus.FORBIDDEN, "Solo disponible para gestor");
        }
    }

    private TarjetaResponse toResponse(Tarjeta tarjeta) {
        String digits = tarjeta.getNumero() == null ? "" : tarjeta.getNumero();
        String last4 = digits.length() > 4 ? digits.substring(digits.length() - 4) : digits;
        return new TarjetaResponse(
                tarjeta.getId(), "**** **** **** " + last4, tarjeta.getTipo(), tarjeta.getEstado(),
                tarjeta.getBloqueadaPor(), tarjeta.getMotivoRechazo(),
                tarjeta.getCupoTotal(), tarjeta.getCupoDisponible(),
                tarjeta.getCuenta() == null ? null : tarjeta.getCuenta().getNumeroCuenta());
    }
}
