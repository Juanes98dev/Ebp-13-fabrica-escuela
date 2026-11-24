package ebp13.fabrica.escuela.ebp13_fabrica_escuela.tarjeta;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TarjetaRepository extends JpaRepository<Tarjeta, Long> {
    List<Tarjeta> findByCliente_IdAndEstadoNotOrderByIdDesc(Long clienteId, String estado);
    List<Tarjeta> findByEstadoOrderByIdAsc(String estado);
    long countByCuenta_IdAndEstadoIn(Long cuentaId, Collection<String> estados);
    boolean existsByCuenta_IdAndTipoAndEstadoIn(Long cuentaId, TipoTarjeta tipo, Collection<String> estados);
    boolean existsByCliente_IdAndTipoAndEstadoIn(Long clienteId, TipoTarjeta tipo, Collection<String> estados);
    boolean existsByNumero(String numero);
}
