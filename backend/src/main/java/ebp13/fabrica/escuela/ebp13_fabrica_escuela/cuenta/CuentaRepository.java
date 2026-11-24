package ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CuentaRepository extends JpaRepository<Cuenta, Long> {

    boolean existsByNumeroCuenta(String numero);

    boolean existsByCliente_IdAndActivaTrue(Long clienteId);

    long countByActivaTrue();

    Optional<Cuenta> findByNumeroCuenta(String numero);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Cuenta c where c.numeroCuenta = :numero")
    Optional<Cuenta> findByNumeroCuentaParaActualizar(@Param("numero") String numero);

    List<Cuenta> findByCliente_IdOrderByIdAsc(Long clienteId);
}
