package ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
public class Transaccion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, updatable = false)
    private String referencia;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoTransaccion tipo;

    @Column(nullable = false)
    private BigDecimal monto;

    private String cuentaOrigen;
    private String cuentaDestino;

    @Column(nullable = false)
    private LocalDateTime fecha;

    private String descripcion;

    private String titularOrigen;
    private String titularDestino;
    private Long realizadaPorId;

    public Transaccion() {
    }

    @PrePersist
    private void inicializarDatos() {
        if (fecha == null) {
            fecha = LocalDateTime.now();
        }
    }

    public String getTitularOrigen() {
        return titularOrigen;
    }

    public void setTitularOrigen(String titularOrigen) {
        this.titularOrigen = titularOrigen;
    }

    public String getTitularDestino() {
        return titularDestino;
    }

    public void setTitularDestino(String titularDestino) {
        this.titularDestino = titularDestino;
    }

    public Long getRealizadaPorId() {
        return realizadaPorId;
    }

    public void setRealizadaPorId(Long realizadaPorId) {
        this.realizadaPorId = realizadaPorId;
    }

    public Long getId() {
        return id;
    }

    public String getReferencia() {
        return referencia;
    }

    public void setReferencia(String referencia) {
        this.referencia = referencia;
    }

    public TipoTransaccion getTipo() {
        return tipo;
    }

    public void setTipo(TipoTransaccion tipo) {
        this.tipo = tipo;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }

    public String getCuentaOrigen() {
        return cuentaOrigen;
    }

    public void setCuentaOrigen(String cuentaOrigen) {
        this.cuentaOrigen = cuentaOrigen;
    }

    public String getCuentaDestino() {
        return cuentaDestino;
    }

    public void setCuentaDestino(String cuentaDestino) {
        this.cuentaDestino = cuentaDestino;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }
}
