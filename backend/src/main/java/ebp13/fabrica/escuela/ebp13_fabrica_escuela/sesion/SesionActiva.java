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
    private LocalDateTime ultimaActividad = LocalDateTime.now();
    private LocalDateTime fechaCierre;
    private String motivoCierre;
    private boolean activa = true;

    public Long getId() { return id; }
    public String getSessionTokenId() { return sessionTokenId; }
    public void setSessionTokenId(String sessionTokenId) { this.sessionTokenId = sessionTokenId; }
    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }
    public String getDispositivo() { return dispositivo; }
    public void setDispositivo(String dispositivo) { this.dispositivo = dispositivo; }
    public LocalDateTime getFechaInicio() { return fechaInicio; }
    public LocalDateTime getUltimaActividad() {
        return ultimaActividad == null ? fechaInicio : ultimaActividad;
    }
    public void setUltimaActividad(LocalDateTime ultimaActividad) { this.ultimaActividad = ultimaActividad; }
    public LocalDateTime getFechaCierre() { return fechaCierre; }
    public String getMotivoCierre() { return motivoCierre; }
    public boolean isActiva() { return activa; }

    public void cerrar(String motivo) {
        this.activa = false;
        this.fechaCierre = LocalDateTime.now();
        this.motivoCierre = motivo;
    }
}
