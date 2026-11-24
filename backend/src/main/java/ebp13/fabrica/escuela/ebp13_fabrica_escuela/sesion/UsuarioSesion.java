package ebp13.fabrica.escuela.ebp13_fabrica_escuela.sesion;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception.Sprint3Exception;
import org.springframework.http.HttpStatus;

/**
 * Usuario autenticado resuelto por {@link SesionInterceptor} a partir del token de sesión.
 * Los controladores lo reciben con {@code @RequestAttribute(UsuarioSesion.ATRIBUTO)}.
 */
public record UsuarioSesion(Long id, String rol, String cedula, String nombre, String token) {

    public static final String ATRIBUTO = "usuarioSesion";
    public static final String ROL_GESTOR = "GESTOR";

    public boolean esGestor() {
        return ROL_GESTOR.equalsIgnoreCase(rol);
    }

    public void exigirGestor() {
        if (!esGestor()) {
            throw new Sprint3Exception(HttpStatus.FORBIDDEN, "Operación permitida solo para gestores");
        }
    }
}
