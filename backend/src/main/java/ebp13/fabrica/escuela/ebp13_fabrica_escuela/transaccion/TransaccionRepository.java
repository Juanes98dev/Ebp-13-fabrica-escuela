package ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransaccionRepository extends JpaRepository<Transaccion, Long> {

    boolean existsByReferencia(String referencia);

    List<Transaccion> findByFechaBetween(LocalDateTime inicio, LocalDateTime fin);

    List<Transaccion> findByCuentaOrigenOrCuentaDestinoOrderByFechaDesc(
            String cuentaOrigen, String cuentaDestino);
}
