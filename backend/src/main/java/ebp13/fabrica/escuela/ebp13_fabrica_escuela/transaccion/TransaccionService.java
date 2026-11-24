package ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.Cuenta;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.CuentaRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.CuentaService;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.exception.CuentaNoEncontradaException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.sesion.UsuarioSesion;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception.CuentaInactivaException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception.SaldoInsuficienteException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception.Sprint3Exception;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto.ConsignacionRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto.RetiroRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto.TransaccionResponse;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto.TransferenciaRequest;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TransaccionService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String ESTADO_EXITOSA = "EXITOSA";
    private static final BigDecimal MIN_TRANSFERENCIA = new BigDecimal("1000");
    private static final BigDecimal MIN_RETIRO = new BigDecimal("10000");
    private static final BigDecimal MAX_RETIRO = new BigDecimal("3000000");
    private static final BigDecimal MIN_CONSIGNACION = new BigDecimal("1000");
    private static final BigDecimal MAX_CONSIGNACION = new BigDecimal("50000000");

    private final CuentaRepository cuentaRepository;
    private final CuentaService cuentaService;
    private final TransaccionRepository transaccionRepository;

    public TransaccionService(
            CuentaRepository cuentaRepository,
            CuentaService cuentaService,
            TransaccionRepository transaccionRepository) {
        this.cuentaRepository = cuentaRepository;
        this.cuentaService = cuentaService;
        this.transaccionRepository = transaccionRepository;
    }

    @Transactional
    public TransaccionResponse transferir(UsuarioSesion usuario, TransferenciaRequest request) {
        String numeroOrigen = request.cuentaOrigen().trim();
        String numeroDestino = request.cuentaDestino().trim();
        if (numeroOrigen.equals(numeroDestino)) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "Las cuentas de origen y destino deben ser distintas");
        }
        validarRango(request.monto(), MIN_TRANSFERENCIA, null, "transferencia");

        // Bloquear siempre en el mismo orden evita interbloqueos entre transferencias cruzadas.
        boolean origenPrimero = numeroOrigen.compareTo(numeroDestino) < 0;
        Cuenta primera = bloquearCuenta(origenPrimero ? numeroOrigen : numeroDestino);
        Cuenta segunda = bloquearCuenta(origenPrimero ? numeroDestino : numeroOrigen);
        Cuenta origen = origenPrimero ? primera : segunda;
        Cuenta destino = origenPrimero ? segunda : primera;

        validarTitular(usuario, origen);
        validarCuentaActiva(origen);
        validarCuentaActiva(destino);
        validarSaldo(origen, request.monto());

        origen.setSaldo(origen.getSaldo().subtract(request.monto()));
        destino.setSaldo(destino.getSaldo().add(request.monto()));

        Transaccion transaccion = nuevaTransaccion(usuario, TipoTransaccion.TRANSFERENCIA, request.monto(),
                textoOpcional(request.concepto(), "Transferencia"));
        transaccion.setCuentaOrigen(origen.getNumeroCuenta());
        transaccion.setTitularOrigen(CuentaService.enmascararNombre(origen.getCliente()));
        transaccion.setCuentaDestino(destino.getNumeroCuenta());
        transaccion.setTitularDestino(CuentaService.enmascararNombre(destino.getCliente()));
        return toResponse(transaccionRepository.save(transaccion));
    }

    @Transactional
    public TransaccionResponse retirar(UsuarioSesion usuario, RetiroRequest request) {
        validarRango(request.monto(), MIN_RETIRO, MAX_RETIRO, "retiro");
        Cuenta cuenta = bloquearCuenta(request.numeroCuenta().trim());
        validarTitular(usuario, cuenta);
        validarCuentaActiva(cuenta);
        validarSaldo(cuenta, request.monto());

        cuenta.setSaldo(cuenta.getSaldo().subtract(request.monto()));

        Transaccion transaccion = nuevaTransaccion(usuario, TipoTransaccion.RETIRO, request.monto(),
                textoOpcional(request.concepto(), "Retiro en efectivo"));
        transaccion.setCuentaOrigen(cuenta.getNumeroCuenta());
        transaccion.setTitularOrigen(CuentaService.enmascararNombre(cuenta.getCliente()));
        transaccion.setCuentaDestino("EFECTIVO");
        return toResponse(transaccionRepository.save(transaccion));
    }

    @Transactional
    public TransaccionResponse consignar(UsuarioSesion usuario, ConsignacionRequest request) {
        validarRango(request.monto(), MIN_CONSIGNACION, MAX_CONSIGNACION, "consignación");
        Cuenta destino = bloquearCuenta(request.cuentaDestino().trim());
        validarCuentaActiva(destino);

        destino.setSaldo(destino.getSaldo().add(request.monto()));

        Transaccion transaccion = nuevaTransaccion(usuario, TipoTransaccion.CONSIGNACION, request.monto(),
                textoOpcional(request.concepto(), "Consignación"));
        transaccion.setCuentaOrigen("EFECTIVO");
        transaccion.setTitularOrigen(textoOpcional(request.remitente(), usuario.nombre()));
        transaccion.setCuentaDestino(destino.getNumeroCuenta());
        transaccion.setTitularDestino(CuentaService.enmascararNombre(destino.getCliente()));
        return toResponse(transaccionRepository.save(transaccion));
    }

    @Transactional(readOnly = true)
    public List<TransaccionResponse> historial(UsuarioSesion usuario, String numeroCuenta) {
        Cuenta cuenta = cuentaRepository.findByNumeroCuenta(numeroCuenta)
                .orElseThrow(() -> new CuentaNoEncontradaException("No existe la cuenta con número " + numeroCuenta));
        cuentaService.validarAcceso(usuario, cuenta);
        return transaccionRepository
                .findByCuentaOrigenOrCuentaDestinoOrderByFechaDesc(numeroCuenta, numeroCuenta)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TransaccionResponse detalle(UsuarioSesion usuario, String referencia) {
        Transaccion transaccion = transaccionRepository.findByReferenciaIgnoreCase(referencia.trim())
                .orElseThrow(() -> new Sprint3Exception(HttpStatus.NOT_FOUND,
                        "No se encontró una transacción con la referencia " + referencia));
        if (!usuario.esGestor() && !participa(usuario, transaccion)) {
            // Se responde 404 para no revelar la existencia de transacciones de terceros.
            throw new Sprint3Exception(HttpStatus.NOT_FOUND,
                    "No se encontró una transacción con la referencia " + referencia);
        }
        return toResponse(transaccion);
    }

    private boolean participa(UsuarioSesion usuario, Transaccion transaccion) {
        return esPropia(usuario, transaccion.getCuentaOrigen()) || esPropia(usuario, transaccion.getCuentaDestino());
    }

    private boolean esPropia(UsuarioSesion usuario, String numeroCuenta) {
        return numeroCuenta != null && cuentaRepository.findByNumeroCuenta(numeroCuenta)
                .map(cuenta -> cuenta.perteneceA(usuario.id()))
                .orElse(false);
    }

    private Cuenta bloquearCuenta(String numero) {
        return cuentaRepository.findByNumeroCuentaParaActualizar(numero)
                .orElseThrow(() -> new CuentaNoEncontradaException("No existe la cuenta con número " + numero));
    }

    private void validarTitular(UsuarioSesion usuario, Cuenta cuenta) {
        if (!cuenta.perteneceA(usuario.id())) {
            throw new Sprint3Exception(HttpStatus.FORBIDDEN,
                    "Solo puede operar con fondos de cuentas propias");
        }
    }

    private void validarCuentaActiva(Cuenta cuenta) {
        if (!cuenta.isActiva()) {
            throw new CuentaInactivaException("La cuenta " + cuenta.getNumeroCuenta() + " está inactiva");
        }
    }

    private void validarRango(BigDecimal monto, BigDecimal minimo, BigDecimal maximo, String operacion) {
        if (monto.compareTo(minimo) < 0) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST,
                    "El monto mínimo de " + operacion + " es $" + formatoPesos(minimo));
        }
        if (maximo != null && monto.compareTo(maximo) > 0) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST,
                    "El monto máximo por " + operacion + " es $" + formatoPesos(maximo));
        }
    }

    private static String formatoPesos(BigDecimal valor) {
        return String.format(Locale.ROOT, "%,d", valor.longValue()).replace(',', '.');
    }

    private void validarSaldo(Cuenta cuenta, BigDecimal monto) {
        if (cuenta.getSaldo().compareTo(monto) < 0) {
            throw new SaldoInsuficienteException("Saldo insuficiente en la cuenta " + cuenta.getNumeroCuenta());
        }
    }

    private Transaccion nuevaTransaccion(UsuarioSesion usuario, TipoTransaccion tipo, BigDecimal monto,
                                         String descripcion) {
        Transaccion transaccion = new Transaccion();
        transaccion.setReferencia(generarReferencia());
        transaccion.setTipo(tipo);
        transaccion.setMonto(monto);
        transaccion.setDescripcion(descripcion);
        transaccion.setRealizadaPorId(usuario.id());
        return transaccion;
    }

    private String textoOpcional(String valor, String porDefecto) {
        return valor == null || valor.isBlank() ? porDefecto : valor.trim();
    }

    private String generarReferencia() {
        String referencia;
        do {
            referencia = "REF-%08d".formatted(RANDOM.nextInt(100_000_000));
        } while (transaccionRepository.existsByReferencia(referencia));
        return referencia;
    }

    private TransaccionResponse toResponse(Transaccion transaccion) {
        return new TransaccionResponse(
                transaccion.getId(),
                transaccion.getReferencia(),
                transaccion.getTipo(),
                transaccion.getMonto(),
                transaccion.getCuentaOrigen(),
                transaccion.getCuentaDestino(),
                transaccion.getTitularOrigen(),
                transaccion.getTitularDestino(),
                transaccion.getFecha(),
                transaccion.getDescripcion(),
                ESTADO_EXITOSA);
    }
}
