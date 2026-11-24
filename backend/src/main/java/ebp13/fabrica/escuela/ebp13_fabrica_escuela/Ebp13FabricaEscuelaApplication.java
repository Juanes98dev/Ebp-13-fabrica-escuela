package ebp13.fabrica.escuela.ebp13_fabrica_escuela;

import java.util.TimeZone;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Ebp13FabricaEscuelaApplication {

	public static void main(String[] args) {
		// Las fechas se guardan como LocalDateTime: sin una zona fija, un servidor en UTC
		// registraría las operaciones con 5 horas de diferencia respecto a Colombia.
		String zona = System.getenv().getOrDefault("APP_TIMEZONE", "America/Bogota");
		TimeZone.setDefault(TimeZone.getTimeZone(zona));
		SpringApplication.run(Ebp13FabricaEscuelaApplication.class, args);
	}

}
