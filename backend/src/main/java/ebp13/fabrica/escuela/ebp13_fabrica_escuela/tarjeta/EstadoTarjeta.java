package ebp13.fabrica.escuela.ebp13_fabrica_escuela.tarjeta;

import java.util.List;

public final class EstadoTarjeta {
    public static final String PENDIENTE = "pendiente";
    public static final String ACTIVA = "activa";
    public static final String BLOQUEADA = "bloqueada";
    public static final String RECHAZADA = "rechazada";
    public static final String ELIMINADA = "eliminada";

    /** Estados en los que la tarjeta sigue vinculada al cliente y a su cuenta. */
    public static final List<String> VIGENTES = List.of(PENDIENTE, ACTIVA, BLOQUEADA);

    private EstadoTarjeta() {
    }
}
