package ebp13.fabrica.escuela.ebp13_fabrica_escuela.tarjeta;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.auditoria.AuditoriaRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.auditoria.RegistroAuditoria;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.Cliente;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.ClienteRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.Cuenta;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.CuentaRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.sesion.UsuarioSesion;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.MailService;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception.Sprint3Exception;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TarjetaService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String NO_ENCONTRADA = "Tarjeta no encontrada";

    private final TarjetaRepository repository;
    private final CuentaRepository cuentas;
    private final ClienteRepository clientes;
    private final AuditoriaRepository auditoria;
    private final MailService mail;
    private final BigDecimal cupoCreditoInicial;

    public TarjetaService(TarjetaRepository repository,
                          CuentaRepository cuentas,
                          ClienteRepository clientes,
                          AuditoriaRepository auditoria,
                          MailService mail,
                          @Value("${app.tarjetas.cupo-credito-inicial:3000000}") BigDecimal cupoCreditoInicial) {
        this.repository = repository;
        this.cuentas = cuentas;
        this.clientes = clientes;
        this.auditoria = auditoria;
        this.mail = mail;
        this.cupoCreditoInicial = cupoCreditoInicial;
    }

    @Transactional(readOnly = true)
    public List<TarjetaResponse> listar(UsuarioSesion usuario, Long clienteId) {
        Long titular = usuario.esGestor() && clienteId != null ? clienteId : usuario.id();
        return repository.findByCliente_IdAndEstadoNotOrderByIdDesc(titular, EstadoTarjeta.ELIMINADA).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TarjetaResponse consultar(UsuarioSesion usuario, Long id) {
        return toResponse(buscarPropia(usuario, id));
    }

    @Transactional
    public TarjetaResponse solicitar(UsuarioSesion usuario, SolicitudTarjetaRequest request) {
        if (usuario.esGestor()) {
            throw new Sprint3Exception(HttpStatus.FORBIDDEN, "Las tarjetas las solicita el cliente titular");
        }
        Cliente cliente = clientes.findById(usuario.id()).orElseThrow(
                () -> new Sprint3Exception(HttpStatus.UNAUTHORIZED, "Debe iniciar sesión para continuar"));

        Cuenta cuenta = null;
        if (request.numeroCuenta() != null && !request.numeroCuenta().isBlank()) {
            cuenta = cuentas.findByNumeroCuenta(request.numeroCuenta().trim())
                    .filter(item -> item.perteneceA(usuario.id()))
                    .orElseThrow(() -> new Sprint3Exception(HttpStatus.BAD_REQUEST,
                            "La cuenta seleccionada no existe o no le pertenece"));
            if (!cuenta.isActiva()) {
                throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "La cuenta seleccionada está inactiva");
            }
        }

        Tarjeta tarjeta = new Tarjeta();
        tarjeta.setTipo(request.tipo());
        tarjeta.setCliente(cliente);
        tarjeta.setCuenta(cuenta);
        tarjeta.setEstado(EstadoTarjeta.PENDIENTE);
        if (request.tipo() == TipoTarjeta.DEBITO) {
            if (cuenta == null) {
                throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "Seleccione la cuenta a la que se asociará la tarjeta");
            }
            if (repository.existsByCuenta_IdAndTipoAndEstadoIn(cuenta.getId(), TipoTarjeta.DEBITO, EstadoTarjeta.VIGENTES)) {
                throw new Sprint3Exception(HttpStatus.CONFLICT,
                        "La cuenta ya tiene una tarjeta débito activa o en solicitud");
            }
        } else {
            if (!cuentas.existsByCliente_IdAndActivaTrue(usuario.id())) {
                throw new Sprint3Exception(HttpStatus.BAD_REQUEST,
                        "Debe tener al menos una cuenta activa para solicitar una tarjeta de crédito");
            }
            if (repository.existsByCliente_IdAndTipoAndEstadoIn(usuario.id(), TipoTarjeta.CREDITO, EstadoTarjeta.VIGENTES)) {
                throw new Sprint3Exception(HttpStatus.CONFLICT,
                        "Ya tiene una tarjeta de crédito activa o en solicitud");
            }
            tarjeta.setCupoTotal(cupoCreditoInicial);
            tarjeta.setCupoDisponible(cupoCreditoInicial);
        }
        tarjeta.setNumero(generarNumero(request.tipo()));
        tarjeta = repository.save(tarjeta);
        auditoria.save(new RegistroAuditoria(usuario.id(), usuario.rol(), "SOLICITAR_TARJETA",
                "TARJETA", tarjeta.getId().toString(), null, EstadoTarjeta.PENDIENTE));
        return toResponse(tarjeta);
    }

    @Transactional
    public Map<String, String> bloquear(UsuarioSesion usuario, Long id) {
        Tarjeta tarjeta = buscarPropia(usuario, id);
        if (EstadoTarjeta.BLOQUEADA.equals(tarjeta.getEstado())) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "La tarjeta ya está bloqueada");
        }
        if (!EstadoTarjeta.ACTIVA.equals(tarjeta.getEstado())) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "Solo se pueden bloquear tarjetas activas");
        }
        tarjeta.setEstado(EstadoTarjeta.BLOQUEADA);
        tarjeta.setBloqueadaPor("cliente");
        auditoria.save(new RegistroAuditoria(usuario.id(), usuario.rol(), "BLOQUEAR_TARJETA",
                "TARJETA", id.toString(), EstadoTarjeta.ACTIVA, EstadoTarjeta.BLOQUEADA));
        return Map.of("mensaje", "Tarjeta bloqueada exitosamente");
    }

    @Transactional
    public Map<String, String> desbloquear(UsuarioSesion usuario, Long id) {
        Tarjeta tarjeta = buscarPropia(usuario, id);
        if (EstadoTarjeta.ACTIVA.equals(tarjeta.getEstado())) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "La tarjeta ya está activa");
        }
        if (!EstadoTarjeta.BLOQUEADA.equals(tarjeta.getEstado())) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "Solo se pueden desbloquear tarjetas bloqueadas");
        }
        if ("gestor".equals(tarjeta.getBloqueadaPor())) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST,
                    "Esta tarjeta fue bloqueada por el banco, comuníquese con un gestor");
        }
        tarjeta.setEstado(EstadoTarjeta.ACTIVA);
        tarjeta.setBloqueadaPor(null);
        auditoria.save(new RegistroAuditoria(usuario.id(), usuario.rol(), "DESBLOQUEAR_TARJETA",
                "TARJETA", id.toString(), EstadoTarjeta.BLOQUEADA, EstadoTarjeta.ACTIVA));
        return Map.of("mensaje", "Tarjeta desbloqueada correctamente");
    }

    @Transactional
    public Map<String, String> eliminar(UsuarioSesion usuario, Long id) {
        Tarjeta tarjeta = buscarPropia(usuario, id);
        if (!EstadoTarjeta.ACTIVA.equals(tarjeta.getEstado()) && !EstadoTarjeta.BLOQUEADA.equals(tarjeta.getEstado())) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "Solo se pueden eliminar tarjetas activas o bloqueadas");
        }
        if (tarjeta.getTipo() == TipoTarjeta.CREDITO
                && tarjeta.getCupoDisponible() != null
                && tarjeta.getCupoTotal() != null
                && tarjeta.getCupoDisponible().compareTo(tarjeta.getCupoTotal()) < 0) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST,
                    "No es posible eliminar la tarjeta: tiene saldo pendiente por pagar");
        }
        String anterior = tarjeta.getEstado();
        tarjeta.setEstado(EstadoTarjeta.ELIMINADA);
        auditoria.save(new RegistroAuditoria(usuario.id(), usuario.rol(), "ELIMINAR_TARJETA",
                "TARJETA", id.toString(), anterior, EstadoTarjeta.ELIMINADA));
        return Map.of("mensaje", "Tarjeta eliminada exitosamente");
    }

    @Transactional(readOnly = true)
    public List<TarjetaResponse> solicitudes() {
        return repository.findByEstadoOrderByIdAsc(EstadoTarjeta.PENDIENTE).stream().map(this::toResponse).toList();
    }

    @Transactional
    public Map<String, String> aprobar(UsuarioSesion gestor, Long id) {
        Tarjeta tarjeta = buscarPendiente(id);
        tarjeta.setEstado(EstadoTarjeta.ACTIVA);
        tarjeta.setMotivoRechazo(null);
        tarjeta.setFechaResolucion(LocalDateTime.now());
        auditoria.save(new RegistroAuditoria(gestor.id(), gestor.rol(), "APROBAR_TARJETA",
                "TARJETA", id.toString(), EstadoTarjeta.PENDIENTE, EstadoTarjeta.ACTIVA));
        mail.send(tarjeta.getCliente().getEmail(), "Solicitud de tarjeta aprobada",
                "Su tarjeta " + etiqueta(tarjeta) + " terminada en " + ultimos4(tarjeta) + " fue aprobada y ya está activa.");
        return Map.of("mensaje", "Solicitud aprobada");
    }

    @Transactional
    public Map<String, String> rechazar(UsuarioSesion gestor, Long id, String motivo) {
        if (motivo == null || motivo.isBlank()) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "Debe ingresar el motivo del rechazo");
        }
        Tarjeta tarjeta = buscarPendiente(id);
        tarjeta.setEstado(EstadoTarjeta.RECHAZADA);
        tarjeta.setMotivoRechazo(motivo.trim());
        tarjeta.setFechaResolucion(LocalDateTime.now());
        auditoria.save(new RegistroAuditoria(gestor.id(), gestor.rol(), "RECHAZAR_TARJETA",
                "TARJETA", id.toString(), EstadoTarjeta.PENDIENTE, EstadoTarjeta.RECHAZADA));
        mail.send(tarjeta.getCliente().getEmail(), "Solicitud de tarjeta rechazada",
                "Su solicitud de tarjeta " + etiqueta(tarjeta) + " fue rechazada. Motivo: " + motivo.trim());
        return Map.of("mensaje", "Solicitud rechazada");
    }

    private Tarjeta buscarPropia(UsuarioSesion usuario, Long id) {
        Tarjeta tarjeta = repository.findById(id)
                .orElseThrow(() -> new Sprint3Exception(HttpStatus.NOT_FOUND, NO_ENCONTRADA));
        if (!tarjeta.getCliente().getId().equals(usuario.id())
                || EstadoTarjeta.ELIMINADA.equals(tarjeta.getEstado())) {
            throw new Sprint3Exception(HttpStatus.NOT_FOUND, NO_ENCONTRADA);
        }
        return tarjeta;
    }

    private Tarjeta buscarPendiente(Long id) {
        Tarjeta tarjeta = repository.findById(id)
                .orElseThrow(() -> new Sprint3Exception(HttpStatus.NOT_FOUND, "Solicitud no encontrada"));
        if (!EstadoTarjeta.PENDIENTE.equals(tarjeta.getEstado())) {
            throw new Sprint3Exception(HttpStatus.CONFLICT, "La solicitud ya fue procesada");
        }
        return tarjeta;
    }

    private String generarNumero(TipoTarjeta tipo) {
        String numero;
        do {
            StringBuilder base = new StringBuilder(tipo == TipoTarjeta.DEBITO ? "455701" : "541203");
            while (base.length() < 15) {
                base.append(RANDOM.nextInt(10));
            }
            numero = base.append(digitoLuhn(base)).toString();
        } while (repository.existsByNumero(numero));
        return numero;
    }

    private int digitoLuhn(CharSequence base) {
        int suma = 0;
        for (int i = base.length() - 1, posicion = 0; i >= 0; i--, posicion++) {
            int digito = base.charAt(i) - '0';
            if (posicion % 2 == 0) {
                digito *= 2;
                if (digito > 9) {
                    digito -= 9;
                }
            }
            suma += digito;
        }
        return (10 - suma % 10) % 10;
    }

    private String etiqueta(Tarjeta tarjeta) {
        return tarjeta.getTipo() == TipoTarjeta.DEBITO ? "débito" : "de crédito";
    }

    private String ultimos4(Tarjeta tarjeta) {
        String digits = tarjeta.getNumero() == null ? "" : tarjeta.getNumero();
        return digits.length() > 4 ? digits.substring(digits.length() - 4) : digits;
    }

    private TarjetaResponse toResponse(Tarjeta tarjeta) {
        Cliente cliente = tarjeta.getCliente();
        return new TarjetaResponse(
                tarjeta.getId(),
                "**** **** **** " + ultimos4(tarjeta),
                tarjeta.getTipo(),
                tarjeta.getEstado(),
                tarjeta.getBloqueadaPor(),
                tarjeta.getMotivoRechazo(),
                tarjeta.getCupoTotal(),
                tarjeta.getCupoDisponible(),
                tarjeta.getCuenta() == null ? null : tarjeta.getCuenta().getNumeroCuenta(),
                cliente.getNombreCompleto(),
                cliente.getId(),
                cliente.getIdCliente(),
                cliente.getCedula(),
                cliente.getEmail(),
                tarjeta.getFechaSolicitud(),
                tarjeta.getFechaResolucion());
    }
}
