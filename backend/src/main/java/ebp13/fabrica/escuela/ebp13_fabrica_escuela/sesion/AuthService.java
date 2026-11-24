package ebp13.fabrica.escuela.ebp13_fabrica_escuela.sesion;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.auditoria.AuditoriaRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.auditoria.RegistroAuditoria;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.Cliente;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.ClienteRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.MailService;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.PasswordPolicy;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception.Sprint3Exception;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final String CREDENCIALES_INVALIDAS = "Credenciales inválidas";
    private static final DateTimeFormatter FORMATO_FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Duration ACTUALIZACION_ACTIVIDAD = Duration.ofSeconds(30);

    private final ClienteRepository clientes;
    private final SesionRepository sesiones;
    private final AuditoriaRepository auditoria;
    private final MailService mail;
    private final Duration inactividadMaxima;
    private final int intentosMaximos;
    private final Duration duracionBloqueo;

    public AuthService(ClienteRepository clientes,
                       SesionRepository sesiones,
                       AuditoriaRepository auditoria,
                       MailService mail,
                       @Value("${app.session.idle-minutes:10}") long inactividadMinutos,
                       @Value("${app.login.max-attempts:3}") int intentosMaximos,
                       @Value("${app.login.lock-minutes:15}") long bloqueoMinutos) {
        this.clientes = clientes;
        this.sesiones = sesiones;
        this.auditoria = auditoria;
        this.mail = mail;
        this.inactividadMaxima = Duration.ofMinutes(inactividadMinutos);
        this.intentosMaximos = intentosMaximos;
        this.duracionBloqueo = Duration.ofMinutes(bloqueoMinutos);
    }

    @Transactional(noRollbackFor = Sprint3Exception.class)
    public Map<String, Object> login(String cedula, String password, String dispositivo) {
        if (cedula == null || cedula.isBlank() || password == null || password.isEmpty()) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "Ingrese la cédula y la contraseña");
        }
        Cliente cliente = clientes.findByCedula(cedula.trim()).orElseThrow(
                () -> new Sprint3Exception(HttpStatus.UNAUTHORIZED, CREDENCIALES_INVALIDAS));

        LocalDateTime ahora = LocalDateTime.now();
        if (cliente.getBloqueadoHasta() != null && ahora.isBefore(cliente.getBloqueadoHasta())) {
            long minutos = Math.max(1, Duration.between(ahora, cliente.getBloqueadoHasta()).toMinutes() + 1);
            throw new Sprint3Exception(HttpStatus.LOCKED,
                    "Cuenta bloqueada temporalmente por intentos fallidos. Intente de nuevo en " + minutos + " minutos");
        }
        if (cliente.getPasswordHash() == null || !BCrypt.checkpw(password, cliente.getPasswordHash())) {
            registrarIntentoFallido(cliente, ahora);
            throw new Sprint3Exception(HttpStatus.UNAUTHORIZED, CREDENCIALES_INVALIDAS);
        }
        if (!cliente.isActivo()) {
            throw new Sprint3Exception(HttpStatus.FORBIDDEN, "El usuario está inactivo. Comuníquese con su gestor");
        }

        cliente.setIntentosFallidos(0);
        cliente.setBloqueadoHasta(null);
        for (SesionActiva sesion : sesiones.findByUsuarioIdAndActivaTrue(cliente.getId())) {
            sesion.cerrar("Nuevo inicio de sesión en otro dispositivo");
        }
        SesionActiva nueva = new SesionActiva();
        nueva.setUsuarioId(cliente.getId());
        nueva.setSessionTokenId(UUID.randomUUID().toString());
        nueva.setDispositivo(describirDispositivo(dispositivo));
        sesiones.save(nueva);
        mail.send(cliente.getEmail(), "Nuevo inicio de sesión en Banco X",
                "Se inició una sesión el " + ahora.format(FORMATO_FECHA) + " desde " + nueva.getDispositivo()
                        + ". Si no fue usted, cambie su contraseña de inmediato.");

        Map<String, Object> respuesta = new LinkedHashMap<>();
        respuesta.put("sessionToken", nueva.getSessionTokenId());
        respuesta.put("usuarioId", cliente.getId());
        respuesta.put("rol", cliente.getRol());
        respuesta.put("cedula", cliente.getCedula());
        respuesta.put("idiomaPreferido", cliente.getIdiomaPreferido());
        respuesta.put("nombre", cliente.getNombreCompleto());
        respuesta.put("inactividadMinutos", inactividadMaxima.toMinutes());
        return respuesta;
    }

    @Transactional(noRollbackFor = Sprint3Exception.class)
    public UsuarioSesion autenticar(String token) {
        if (token == null || token.isBlank()) {
            throw new Sprint3Exception(HttpStatus.UNAUTHORIZED, "Debe iniciar sesión para continuar");
        }
        SesionActiva sesion = sesiones.findBySessionTokenIdAndActivaTrue(token).orElseThrow(
                () -> new Sprint3Exception(HttpStatus.UNAUTHORIZED, "Su sesión ha finalizado. Inicie sesión nuevamente"));
        LocalDateTime ahora = LocalDateTime.now();
        if (sesion.getUltimaActividad().plus(inactividadMaxima).isBefore(ahora)) {
            sesion.cerrar("Expirada por inactividad");
            throw new Sprint3Exception(HttpStatus.UNAUTHORIZED, "Su sesión ha expirado por inactividad");
        }
        Cliente cliente = clientes.findById(sesion.getUsuarioId()).orElse(null);
        if (cliente == null || !cliente.isActivo()) {
            sesion.cerrar("Usuario inactivo");
            throw new Sprint3Exception(HttpStatus.UNAUTHORIZED, "Su usuario se encuentra inactivo");
        }
        if (sesion.getUltimaActividad().plus(ACTUALIZACION_ACTIVIDAD).isBefore(ahora)) {
            sesion.setUltimaActividad(ahora);
        }
        return new UsuarioSesion(cliente.getId(), cliente.getRol(), cliente.getCedula(),
                cliente.getNombreCompleto(), token);
    }

    @Transactional
    public void logout(UsuarioSesion usuario) {
        sesiones.findBySessionTokenIdAndActivaTrue(usuario.token())
                .ifPresent(sesion -> sesion.cerrar("Cierre de sesión por el usuario"));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> sesionActual(UsuarioSesion usuario) {
        List<Map<String, Object>> historial = sesiones.findTop10ByUsuarioIdOrderByFechaInicioDesc(usuario.id())
                .stream()
                .map(sesion -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", sesion.getId());
                    item.put("dispositivo", sesion.getDispositivo());
                    item.put("fechaInicio", sesion.getFechaInicio());
                    item.put("ultimaActividad", sesion.getUltimaActividad());
                    item.put("fechaCierre", sesion.getFechaCierre());
                    item.put("motivoCierre", sesion.getMotivoCierre());
                    item.put("activa", sesion.isActiva());
                    item.put("actual", usuario.token().equals(sesion.getSessionTokenId()));
                    return item;
                })
                .toList();
        Map<String, Object> respuesta = new LinkedHashMap<>();
        respuesta.put("usuarioId", usuario.id());
        respuesta.put("nombre", usuario.nombre());
        respuesta.put("cedula", usuario.cedula());
        respuesta.put("rol", usuario.rol());
        respuesta.put("inactividadMinutos", inactividadMaxima.toMinutes());
        respuesta.put("sesiones", historial);
        return respuesta;
    }

    @Transactional
    public void cambiarPassword(UsuarioSesion usuario, String actual, String nueva) {
        Cliente cliente = clientes.findById(usuario.id()).orElseThrow(
                () -> new Sprint3Exception(HttpStatus.UNAUTHORIZED, "Debe iniciar sesión para continuar"));
        if (actual == null || cliente.getPasswordHash() == null
                || !BCrypt.checkpw(actual, cliente.getPasswordHash())) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "La contraseña actual no es correcta");
        }
        PasswordPolicy.validar(nueva);
        if (BCrypt.checkpw(nueva, cliente.getPasswordHash())) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "La nueva contraseña debe ser diferente a la actual");
        }
        cliente.setPasswordHash(BCrypt.hashpw(nueva, BCrypt.gensalt()));
        for (SesionActiva sesion : sesiones.findByUsuarioIdAndActivaTrue(cliente.getId())) {
            if (!sesion.getSessionTokenId().equals(usuario.token())) {
                sesion.cerrar("Cambio de contraseña");
            }
        }
        auditoria.save(new RegistroAuditoria(usuario.id(), usuario.rol(), "CAMBIAR_PASSWORD",
                "Cliente", String.valueOf(usuario.id()), null, null));
        mail.send(cliente.getEmail(), "Su contraseña de Banco X fue actualizada",
                "La contraseña de su cuenta fue cambiada el " + LocalDateTime.now().format(FORMATO_FECHA) + ".");
    }

    private void registrarIntentoFallido(Cliente cliente, LocalDateTime ahora) {
        int intentos = cliente.getIntentosFallidos() + 1;
        if (intentos >= intentosMaximos) {
            cliente.setIntentosFallidos(0);
            cliente.setBloqueadoHasta(ahora.plus(duracionBloqueo));
            clientes.save(cliente);
            throw new Sprint3Exception(HttpStatus.LOCKED,
                    "Cuenta bloqueada temporalmente por " + duracionBloqueo.toMinutes()
                            + " minutos tras " + intentosMaximos + " intentos fallidos");
        }
        cliente.setIntentosFallidos(intentos);
        clientes.save(cliente);
    }

    private String describirDispositivo(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return "Dispositivo desconocido";
        }
        String navegador = userAgent.contains("Edg/") ? "Edge"
                : userAgent.contains("Chrome/") ? "Chrome"
                : userAgent.contains("Firefox/") ? "Firefox"
                : userAgent.contains("Safari/") ? "Safari"
                : "Navegador";
        String sistema = userAgent.contains("Windows") ? "Windows"
                : userAgent.contains("Android") ? "Android"
                : userAgent.contains("iPhone") || userAgent.contains("iPad") ? "iOS"
                : userAgent.contains("Mac OS") ? "macOS"
                : userAgent.contains("Linux") ? "Linux"
                : "Sistema desconocido";
        return navegador + " en " + sistema;
    }
}
