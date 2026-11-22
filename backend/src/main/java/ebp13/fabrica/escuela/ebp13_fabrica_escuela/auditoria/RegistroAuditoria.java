package ebp13.fabrica.escuela.ebp13_fabrica_escuela.auditoria;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class RegistroAuditoria {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long usuarioId;
    private String rol;
    private String accion;
    private String entidad;
    private String entidadId;
    @Column(columnDefinition = "text")
    private String valorAnterior;
    @Column(columnDefinition = "text")
    private String valorNuevo;
    @Column(nullable = false)
    private LocalDateTime fechaHora = LocalDateTime.now();

    public RegistroAuditoria() {}
    public RegistroAuditoria(Long usuarioId, String rol, String accion, String entidad, String entidadId, String anterior, String nuevo) {
        this.usuarioId = usuarioId;
        this.rol = rol;
        this.accion = accion;
        this.entidad = entidad;
        this.entidadId = entidadId;
        this.valorAnterior = anterior;
        this.valorNuevo = nuevo;
    }
    public Long getId() { return id; }
    public Long getUsuarioId() { return usuarioId; }
    public String getRol() { return rol; }
    public String getAccion() { return accion; }
    public String getEntidad() { return entidad; }
    public String getEntidadId() { return entidadId; }
    public String getValorAnterior() { return valorAnterior; }
    public String getValorNuevo() { return valorNuevo; }
    public LocalDateTime getFechaHora() { return fechaHora; }
}
