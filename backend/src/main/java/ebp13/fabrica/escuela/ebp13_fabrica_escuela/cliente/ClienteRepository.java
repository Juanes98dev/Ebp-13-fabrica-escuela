package ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    boolean existsByCedula(String cedula);

    boolean existsByIdCliente(String idCliente);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    Optional<Cliente> findByCedula(String cedula);

    Optional<Cliente> findByIdClienteIgnoreCase(String idCliente);

    Optional<Cliente> findFirstByEmailIgnoreCase(String email);

    List<Cliente> findByRolOrderByPrimerApellidoAscPrimerNombreAsc(String rol);
}
