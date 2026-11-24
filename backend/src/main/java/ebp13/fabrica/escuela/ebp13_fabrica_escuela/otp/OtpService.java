package ebp13.fabrica.escuela.ebp13_fabrica_escuela.otp;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.Cliente;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.ClienteRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.sesion.SesionRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.sesion.SesionActiva;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.MailService;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.PasswordPolicy;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception.Sprint3Exception;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OtpService {
    private static final int MAX_INTENTOS = 3;
    private static final String CODIGO_INVALIDO = "El código no es válido";

    private final ClienteRepository clientes;
    private final CodigoRecuperacionRepository codigos;
    private final SesionRepository sesiones;
    private final MailService mail;
    private final SecureRandom random = new SecureRandom();

    public OtpService(ClienteRepository clientes, CodigoRecuperacionRepository codigos,
                      SesionRepository sesiones, MailService mail) {
        this.clientes = clientes;
        this.codigos = codigos;
        this.sesiones = sesiones;
        this.mail = mail;
    }

    @Transactional
    public Map<String, String> solicitar(String correo) {
        String normalized = normalizar(correo);
        LocalDateTime desde = LocalDateTime.now().minusHours(1);
        if (codigos.findByCorreoAndCreadoEnAfter(normalized, desde).size() >= 3) {
            throw new Sprint3Exception(HttpStatus.TOO_MANY_REQUESTS,
                    "Ha superado el número de solicitudes, intente más tarde");
        }
        Cliente cliente = clientes.findFirstByEmailIgnoreCase(normalized).orElse(null);
        if (cliente != null && cliente.isActivo()) {
            String code = "%06d".formatted(random.nextInt(1_000_000));
            CodigoRecuperacion registro = new CodigoRecuperacion();
            registro.setUsuarioId(cliente.getId());
            registro.setCorreo(normalized);
            registro.setCodigoHash(hash(code));
            registro.setExpiraEn(LocalDateTime.now().plusMinutes(10));
            codigos.save(registro);
            mail.send(normalized, "Código de recuperación", "Su código es: " + code);
        }
        return Map.of("mensaje", "Si el correo está registrado, recibirá un código de verificación");
    }

    @Transactional(noRollbackFor = Sprint3Exception.class)
    public Map<String, String> verificar(String correo, String codigo) {
        validarCodigo(normalizar(correo), codigo);
        return Map.of("mensaje", "Código verificado");
    }

    @Transactional(noRollbackFor = Sprint3Exception.class)
    public Map<String, String> restablecer(String correo, String codigo, String password) {
        CodigoRecuperacion registro = validarCodigo(normalizar(correo), codigo);
        PasswordPolicy.validar(password);
        Cliente cliente = clientes.findById(registro.getUsuarioId()).orElseThrow(
                () -> new Sprint3Exception(HttpStatus.BAD_REQUEST, CODIGO_INVALIDO));
        cliente.setPasswordHash(BCrypt.hashpw(password, BCrypt.gensalt()));
        cliente.setIntentosFallidos(0);
        cliente.setBloqueadoHasta(null);
        registro.setUsado(true);
        for (SesionActiva sesion : sesiones.findByUsuarioIdAndActivaTrue(cliente.getId())) {
            sesion.cerrar("Restablecimiento de contraseña");
        }
        mail.send(cliente.getEmail(), "Su contraseña de Banco X fue restablecida",
                "Su contraseña fue restablecida y todas las sesiones activas fueron cerradas.");
        return Map.of("mensaje", "Contraseña restablecida correctamente");
    }

    private CodigoRecuperacion validarCodigo(String correo, String codigo) {
        CodigoRecuperacion registro = codigos.findTopByCorreoOrderByCreadoEnDesc(correo).orElse(null);
        if (registro == null || registro.isUsado() || registro.getIntentosFallidos() >= MAX_INTENTOS) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST, CODIGO_INVALIDO);
        }
        if (LocalDateTime.now().isAfter(registro.getExpiraEn())) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "El código ha vencido, solicite uno nuevo");
        }
        if (!registro.getCodigoHash().equals(hash(codigo == null ? "" : codigo.trim()))) {
            registro.setIntentosFallidos(registro.getIntentosFallidos() + 1);
            int restantes = MAX_INTENTOS - registro.getIntentosFallidos();
            if (restantes <= 0) {
                registro.setUsado(true);
                throw new Sprint3Exception(HttpStatus.BAD_REQUEST,
                        "El código fue invalidado por exceder los intentos. Solicite uno nuevo");
            }
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST,
                    CODIGO_INVALIDO + ". Intentos restantes: " + restantes);
        }
        return registro;
    }

    private String normalizar(String correo) {
        return correo == null ? "" : correo.trim().toLowerCase();
    }

    private String hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] result = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : result) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (Exception exception) {
            throw new IllegalStateException("No fue posible proteger el código OTP", exception);
        }
    }
}
