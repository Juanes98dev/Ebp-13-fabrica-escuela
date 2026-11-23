package ebp13.fabrica.escuela.ebp13_fabrica_escuela.sesion;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.Cliente;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.ClienteRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.MailService;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception.Sprint3Exception;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final ClienteRepository clientes;
    private final SesionRepository sesiones;
    private final MailService mail;

    public AuthService(ClienteRepository clientes, SesionRepository sesiones, MailService mail) {
        this.clientes = clientes;
        this.sesiones = sesiones;
        this.mail = mail;
    }

    @Transactional
    public Map<String, Object> login(String cedula, String password, String dispositivo) {
        Cliente cliente = clientes.findByCedula(cedula).orElseThrow(
                () -> new Sprint3Exception(HttpStatus.UNAUTHORIZED, "Credenciales inválidas"));
        if (!cliente.isActivo()) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "El usuario está inactivo");
        }
        if (!"GESTOR".equalsIgnoreCase(cliente.getRol())) {
            throw new Sprint3Exception(HttpStatus.FORBIDDEN,
                    "Solo el perfil de gestor puede iniciar sesión");
        }
        if (cliente.getPasswordHash() == null
                || !BCrypt.checkpw(password == null ? "" : password, cliente.getPasswordHash())) {
            throw new Sprint3Exception(HttpStatus.UNAUTHORIZED, "Credenciales inválidas");
        }
        for (SesionActiva sesion : sesiones.findByUsuarioIdAndActivaTrue(cliente.getId())) {
            sesion.setActiva(false);
            sesiones.save(sesion);
        }
        SesionActiva nueva = new SesionActiva();
        nueva.setUsuarioId(cliente.getId());
        nueva.setSessionTokenId(UUID.randomUUID().toString());
        nueva.setDispositivo(dispositivo == null || dispositivo.isBlank() ? "Dispositivo desconocido" : dispositivo);
        sesiones.save(nueva);
        mail.send(cliente.getEmail(), "Nuevo inicio de sesión",
                "Se inició una sesión el " + LocalDateTime.now() + " desde " + nueva.getDispositivo());
        return Map.of(
                "sessionToken", nueva.getSessionTokenId(),
                "usuarioId", cliente.getId(),
                "rol", cliente.getRol(),
                "idiomaPreferido", cliente.getIdiomaPreferido(),
                "nombre", (cliente.getPrimerNombre() == null ? "" : cliente.getPrimerNombre()));
    }

    @Transactional
    public void logout(String token) {
        sesiones.findBySessionTokenIdAndActivaTrue(token).ifPresent(sesion -> {
            sesion.setActiva(false);
            sesiones.save(sesion);
        });
    }
}
