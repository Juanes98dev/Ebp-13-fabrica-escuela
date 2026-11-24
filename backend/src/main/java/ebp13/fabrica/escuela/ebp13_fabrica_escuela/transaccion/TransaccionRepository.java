package ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransaccionRepository extends JpaRepository<Transaccion, Long> {

    boolean existsByReferencia(String referencia);

    Optional<Transaccion> findByReferenciaIgnoreCase(String referencia);

    List<Transaccion> findByFechaBetweenOrderByFechaAsc(LocalDateTime inicio, LocalDateTime fin);

    List<Transaccion> findByCuentaOrigenOrCuentaDestinoOrderByFechaDesc(
            String cuentaOrigen, String cuentaDestino);
}
