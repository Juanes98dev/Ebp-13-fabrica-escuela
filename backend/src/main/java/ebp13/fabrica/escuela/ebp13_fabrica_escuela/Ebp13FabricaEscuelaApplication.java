package ebp13.fabrica.escuela.ebp13_fabrica_escuela;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCrypt;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.Cliente;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.ClienteRepository;

@SpringBootApplication
public class Ebp13FabricaEscuelaApplication {

	public static void main(String[] args) {
		SpringApplication.run(Ebp13FabricaEscuelaApplication.class, args);
	}

	@Bean
	CommandLineRunner seedUsers(ClienteRepository clientes) {
		return args -> {
			if (clientes.findByCedula("9999999999").isEmpty()) {
				Cliente gestor = new Cliente();
				gestor.setIdCliente("BX-GESTOR-001");
				gestor.setCedula("9999999999");
				gestor.setPrimerNombre("Gestor");
				gestor.setPrimerApellido("Banco X");
				gestor.setEmail("gestor@bancox.local");
				gestor.setTelefono("3000000000");
				gestor.setRol("GESTOR");
				gestor.setActivo(true);
				gestor.setPasswordHash(BCrypt.hashpw("GestorBX2026!", BCrypt.gensalt()));
				clientes.save(gestor);
			}
			if (clientes.findByCedula("1023456789").isEmpty()) {
				Cliente cliente = new Cliente();
				cliente.setIdCliente("BX-M9K3A2-X7F");
				cliente.setCedula("1023456789");
				cliente.setPrimerNombre("Valentina");
				cliente.setPrimerApellido("Morales");
				cliente.setEmail("v.morales@email.com");
				cliente.setTelefono("3100000000");
				cliente.setRol("CLIENTE");
				cliente.setActivo(true);
				cliente.setPasswordHash(BCrypt.hashpw("BancoX2026!", BCrypt.gensalt()));
				clientes.save(cliente);
			}
		};
	}

}
