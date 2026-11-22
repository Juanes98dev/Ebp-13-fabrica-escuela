package ebp13.fabrica.escuela.ebp13_fabrica_escuela.sesion;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class SesionActiva {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String sessionTokenId;
    private Long usuarioId;
    private String dispositivo;
    private LocalDateTime fechaInicio = LocalDateTime.now();
    private boolean activa = true;

    public Long getId() { return id; }
    public String getSessionTokenId() { return sessionTokenId; }
    public void setSessionTokenId(String sessionTokenId) { this.sessionTokenId = sessionTokenId; }
    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }
    public String getDispositivo() { return dispositivo; }
    public void setDispositivo(String dispositivo) { this.dispositivo = dispositivo; }
    public LocalDateTime getFechaInicio() { return fechaInicio; }
    public boolean isActiva() { return activa; }
    public void setActiva(boolean activa) { this.activa = activa; }
}
