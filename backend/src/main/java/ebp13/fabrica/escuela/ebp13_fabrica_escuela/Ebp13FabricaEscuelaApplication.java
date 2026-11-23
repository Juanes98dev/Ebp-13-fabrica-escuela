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
			var gestor = clientes.findByCedula("9999999999").orElseGet(Cliente::new);
			String gestorPassword = System.getenv("GESTOR_PASSWORD");
			if (gestorPassword == null || gestorPassword.isBlank()) {
				gestorPassword = "gestor123";
			}
			if (gestor.getId() == null) {
				gestor.setIdCliente("BX-GESTOR-001");
				gestor.setCedula("9999999999");
				gestor.setPrimerNombre("Gestor");
				gestor.setPrimerApellido("Banco X");
				gestor.setEmail("gestor@bancox.local");
				gestor.setTelefono("3000000000");
				gestor.setRol("GESTOR");
				gestor.setActivo(true);
			}
			gestor.setRol("GESTOR");
			gestor.setActivo(true);
			gestor.setPasswordHash(BCrypt.hashpw(gestorPassword, BCrypt.gensalt()));
			clientes.save(gestor);
		};
	}

}
