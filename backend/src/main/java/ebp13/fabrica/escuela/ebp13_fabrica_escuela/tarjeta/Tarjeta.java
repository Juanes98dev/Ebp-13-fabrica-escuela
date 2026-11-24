package ebp13.fabrica.escuela.ebp13_fabrica_escuela.tarjeta;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.Cliente;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.Cuenta;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
public class Tarjeta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String numero;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoTarjeta tipo;

    @Column(nullable = false)
    private String estado = EstadoTarjeta.PENDIENTE;

    private String bloqueadaPor;
    private String motivoRechazo;
    private BigDecimal cupoTotal;
    private BigDecimal cupoDisponible;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cuenta_id")
    private Cuenta cuenta;

    private LocalDateTime fechaSolicitud;
    private LocalDateTime fechaResolucion;

    @PrePersist
    private void alCrear() {
        if (fechaSolicitud == null) {
            fechaSolicitud = LocalDateTime.now();
        }
    }

    public LocalDateTime getFechaSolicitud() { return fechaSolicitud; }
    public LocalDateTime getFechaResolucion() { return fechaResolucion; }
    public void setFechaResolucion(LocalDateTime fechaResolucion) { this.fechaResolucion = fechaResolucion; }

    public Long getId() { return id; }
    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }
    public TipoTarjeta getTipo() { return tipo; }
    public void setTipo(TipoTarjeta tipo) { this.tipo = tipo; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getBloqueadaPor() { return bloqueadaPor; }
    public void setBloqueadaPor(String bloqueadaPor) { this.bloqueadaPor = bloqueadaPor; }
    public String getMotivoRechazo() { return motivoRechazo; }
    public void setMotivoRechazo(String motivoRechazo) { this.motivoRechazo = motivoRechazo; }
    public BigDecimal getCupoTotal() { return cupoTotal; }
    public void setCupoTotal(BigDecimal cupoTotal) { this.cupoTotal = cupoTotal; }
    public BigDecimal getCupoDisponible() { return cupoDisponible; }
    public void setCupoDisponible(BigDecimal cupoDisponible) { this.cupoDisponible = cupoDisponible; }
    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }
    public Cuenta getCuenta() { return cuenta; }
    public void setCuenta(Cuenta cuenta) { this.cuenta = cuenta; }
}
