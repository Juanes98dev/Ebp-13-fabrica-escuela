package ebp13.fabrica.escuela.ebp13_fabrica_escuela.tarjeta;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TarjetaRepository extends JpaRepository<Tarjeta, Long> {
    List<Tarjeta> findByCliente_Id(Long clienteId);
    List<Tarjeta> findByEstado(String estado);
    List<Tarjeta> findByCuenta_IdAndEstadoNot(Long cuentaId, String estado);
}
