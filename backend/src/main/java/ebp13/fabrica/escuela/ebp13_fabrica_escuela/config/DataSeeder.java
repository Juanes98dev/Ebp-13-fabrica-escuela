package ebp13.fabrica.escuela.ebp13_fabrica_escuela.config;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.Cliente;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.ClienteRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.sesion.UsuarioSesion;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Garantiza que exista el usuario gestor inicial. Nunca borra datos y solo reescribe la
 * contraseña del gestor cuando {@code GESTOR_PASSWORD} está definida explícitamente.
 */
@Component
public class DataSeeder implements ApplicationRunner {

    private static final Logger LOG = LoggerFactory.getLogger(DataSeeder.class);
    private static final String CONTRASENA_POR_DEFECTO = "gestor123";

    private final ClienteRepository clientes;
    private final String gestorCedula;
    private final String gestorPassword;

    public DataSeeder(ClienteRepository clientes,
                      @Value("${app.seed.gestor-cedula:9999999999}") String gestorCedula,
                      @Value("${GESTOR_PASSWORD:}") String gestorPassword) {
        this.clientes = clientes;
        this.gestorCedula = gestorCedula;
        this.gestorPassword = gestorPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Cliente gestor = clientes.findByCedula(gestorCedula).orElse(null);
        boolean passwordExplicita = gestorPassword != null && !gestorPassword.isBlank();
        if (gestor == null) {
            gestor = new Cliente();
            gestor.setIdCliente("BX-GESTOR-001");
            gestor.setCedula(gestorCedula);
            gestor.setPrimerNombre("Gestor");
            gestor.setPrimerApellido("Banco X");
            gestor.setEmail("gestor@bancox.local");
            gestor.setTelefono("3000000000");
            gestor.setPasswordHash(BCrypt.hashpw(
                    passwordExplicita ? gestorPassword : CONTRASENA_POR_DEFECTO, BCrypt.gensalt()));
            if (!passwordExplicita) {
                LOG.warn("Gestor inicial creado con la contraseña por defecto. Defina GESTOR_PASSWORD en producción.");
            }
        } else if (passwordExplicita && !BCrypt.checkpw(gestorPassword, gestor.getPasswordHash())) {
            gestor.setPasswordHash(BCrypt.hashpw(gestorPassword, BCrypt.gensalt()));
        }
        gestor.setRol(UsuarioSesion.ROL_GESTOR);
        gestor.setActivo(true);
        clientes.save(gestor);

        for (Cliente cliente : clientes.findAll()) {
            if (cliente.getPasswordHash() == null && cliente.getCedula() != null) {
                cliente.setPasswordHash(BCrypt.hashpw(cliente.getCedula(), BCrypt.gensalt()));
            }
        }
    }
}
