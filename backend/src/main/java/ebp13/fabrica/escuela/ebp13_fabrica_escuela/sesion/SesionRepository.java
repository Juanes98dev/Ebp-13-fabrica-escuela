package ebp13.fabrica.escuela.ebp13_fabrica_escuela.sesion;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SesionRepository extends JpaRepository<SesionActiva, Long> {
    List<SesionActiva> findByUsuarioIdAndActivaTrue(Long usuarioId);
    Optional<SesionActiva> findBySessionTokenIdAndActivaTrue(String sessionTokenId);
}
