package ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.auditoria.AuditoriaRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.auditoria.RegistroAuditoria;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.Cliente;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.ClienteRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.ClienteInactivoException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.ClienteNoEncontradoException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.dto.CuentaDestinoResponse;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.dto.CuentaRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.dto.CuentaResponse;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.exception.CuentaNoEncontradaException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.sesion.UsuarioSesion;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception.Sprint3Exception;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.tarjeta.EstadoTarjeta;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.tarjeta.TarjetaRepository;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CuentaService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final CuentaRepository cuentaRepository;
    private final ClienteRepository clienteRepository;
    private final TarjetaRepository tarjetaRepository;
    private final AuditoriaRepository auditoriaRepository;

    public CuentaService(
            CuentaRepository cuentaRepository,
            ClienteRepository clienteRepository,
            TarjetaRepository tarjetaRepository,
            AuditoriaRepository auditoriaRepository) {
        this.cuentaRepository = cuentaRepository;
        this.clienteRepository = clienteRepository;
        this.tarjetaRepository = tarjetaRepository;
        this.auditoriaRepository = auditoriaRepository;
    }

    @Transactional
    public CuentaResponse crear(UsuarioSesion usuario, CuentaRequest request) {
        Long clienteId = usuario.esGestor() ? request.clienteId() : usuario.id();
        if (clienteId == null) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "Debe indicar el cliente titular de la cuenta");
        }
        Cliente cliente = clienteRepository.findById(clienteId)
                .filter(item -> !UsuarioSesion.ROL_GESTOR.equalsIgnoreCase(item.getRol()))
                .orElseThrow(() -> new ClienteNoEncontradoException("No existe el cliente con id " + clienteId));
        if (!cliente.isActivo()) {
            throw new ClienteInactivoException("El cliente está inactivo y no puede abrir cuentas");
        }

        Cuenta cuenta = new Cuenta();
        cuenta.setNumeroCuenta(generarNumeroCuenta(request.tipo()));
        cuenta.setTipo(request.tipo());
        cuenta.setSaldo(BigDecimal.ZERO);
        cuenta.setActiva(true);
        cuenta.setCliente(cliente);
        cuenta = cuentaRepository.save(cuenta);
        auditoriaRepository.save(new RegistroAuditoria(usuario.id(), usuario.rol(), "CREAR_CUENTA",
                "CUENTA", cuenta.getId().toString(), null, cuenta.getNumeroCuenta()));
        return toResponse(cuenta);
    }

    @Transactional
    public CuentaResponse desactivar(UsuarioSesion gestor, String numero) {
        Cuenta cuenta = buscar(numero);
        if (!cuenta.isActiva()) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "La cuenta ya está inactiva");
        }
        if (cuenta.getSaldo().compareTo(BigDecimal.ZERO) > 0) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST,
                    "La cuenta tiene saldo disponible; debe retirarse o transferirse antes de desactivarla");
        }
        if (tarjetaRepository.countByCuenta_IdAndEstadoIn(cuenta.getId(), EstadoTarjeta.VIGENTES) > 0) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST,
                    "Debe eliminar las tarjetas asociadas a la cuenta antes de desactivarla");
        }
        cuenta.setActiva(false);
        auditoriaRepository.save(new RegistroAuditoria(gestor.id(), gestor.rol(), "DESACTIVAR_CUENTA",
                "CUENTA", cuenta.getId().toString(), "activa", "inactiva"));
        return toResponse(cuenta);
    }

    @Transactional(readOnly = true)
    public CuentaResponse consultarPorNumero(UsuarioSesion usuario, String numero) {
        Cuenta cuenta = buscar(numero);
        validarAcceso(usuario, cuenta);
        return toResponse(cuenta);
    }

    @Transactional(readOnly = true)
    public CuentaDestinoResponse consultarDestino(UsuarioSesion usuario, String numero) {
        Cuenta cuenta = buscar(numero);
        return new CuentaDestinoResponse(cuenta.getNumeroCuenta(), cuenta.getTipo(), cuenta.isActiva(),
                enmascararNombre(cuenta.getCliente()), cuenta.perteneceA(usuario.id()));
    }

    @Transactional(readOnly = true)
    public List<CuentaResponse> listarPorCliente(UsuarioSesion usuario, Long clienteId) {
        if (!usuario.esGestor() && !usuario.id().equals(clienteId)) {
            throw new Sprint3Exception(HttpStatus.FORBIDDEN, "No tiene permisos para consultar estas cuentas");
        }
        if (!clienteRepository.existsById(clienteId)) {
            throw new ClienteNoEncontradoException("No existe el cliente con id " + clienteId);
        }
        return cuentaRepository.findByCliente_IdOrderByIdAsc(clienteId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Garantiza que el usuario puede ver la cuenta: debe ser su titular o un gestor.
     */
    public void validarAcceso(UsuarioSesion usuario, Cuenta cuenta) {
        if (!usuario.esGestor() && !cuenta.perteneceA(usuario.id())) {
            throw new Sprint3Exception(HttpStatus.FORBIDDEN, "No tiene permisos para consultar esta cuenta");
        }
    }

    private Cuenta buscar(String numero) {
        return cuentaRepository.findByNumeroCuenta(numero == null ? "" : numero.trim())
                .orElseThrow(() -> new CuentaNoEncontradaException("No existe la cuenta con número " + numero));
    }

    private String generarNumeroCuenta(TipoCuenta tipo) {
        String prefijo = tipo == TipoCuenta.AHORROS ? "301" : "501";
        String numero;
        do {
            numero = "%s-%03d-%04d-%02d".formatted(
                    prefijo,
                    RANDOM.nextInt(1_000),
                    RANDOM.nextInt(10_000),
                    RANDOM.nextInt(100));
        } while (cuentaRepository.existsByNumeroCuenta(numero));
        return numero;
    }

    public static String enmascararNombre(Cliente cliente) {
        String nombre = cliente.getPrimerNombre() == null ? "" : cliente.getPrimerNombre().trim();
        String apellido = cliente.getPrimerApellido() == null ? "" : cliente.getPrimerApellido().trim();
        return apellido.isEmpty() ? nombre : nombre + " " + apellido.charAt(0) + ".";
    }

    private CuentaResponse toResponse(Cuenta cuenta) {
        Cliente cliente = cuenta.getCliente();
        return new CuentaResponse(
                cuenta.getId(),
                cuenta.getNumeroCuenta(),
                cuenta.getTipo(),
                cuenta.getSaldo(),
                cuenta.isActiva(),
                cliente.getId(),
                cliente.getIdCliente(),
                cliente.getNombreCompleto(),
                cuenta.getFechaApertura(),
                tarjetaRepository.countByCuenta_IdAndEstadoIn(cuenta.getId(), EstadoTarjeta.VIGENTES));
    }
}
