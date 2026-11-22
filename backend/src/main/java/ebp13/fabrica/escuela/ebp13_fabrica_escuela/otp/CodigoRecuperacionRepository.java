package ebp13.fabrica.escuela.ebp13_fabrica_escuela.otp;

import java.util.Optional;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CodigoRecuperacionRepository extends JpaRepository<CodigoRecuperacion, Long> {
    Optional<CodigoRecuperacion> findTopByCorreoOrderByExpiraEnDesc(String correo);
    List<CodigoRecuperacion> findByCorreoAndCreadoEnAfter(String correo, LocalDateTime desde);
}
