package ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.auditoria.AuditoriaRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.auditoria.RegistroAuditoria;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.dto.ClienteContactoRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.dto.ClienteRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.dto.ClienteResponse;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.CedulaDuplicadaException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.CedulaInvalidaException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.ClienteInactivoException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.ClienteNoEncontradoException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.CuentaRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.sesion.SesionActiva;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.sesion.SesionRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.sesion.UsuarioSesion;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception.Sprint3Exception;
import java.security.SecureRandom;
import java.util.List;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClienteService {

    private static final String ROL_CLIENTE = "CLIENTE";
    private static final String RANDOM_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final ClienteRepository clienteRepository;
    private final CuentaRepository cuentaRepository;
    private final AuditoriaRepository auditoriaRepository;
    private final SesionRepository sesionRepository;

    public ClienteService(ClienteRepository clienteRepository,
                          CuentaRepository cuentaRepository,
                          AuditoriaRepository auditoriaRepository,
                          SesionRepository sesionRepository) {
        this.clienteRepository = clienteRepository;
        this.cuentaRepository = cuentaRepository;
        this.auditoriaRepository = auditoriaRepository;
        this.sesionRepository = sesionRepository;
    }

    @Transactional
    public ClienteResponse crear(UsuarioSesion gestor, ClienteRequest request) {
        String cedula = request.getCedula() == null ? "" : request.getCedula().trim();
        validarCedula(cedula);
        if (clienteRepository.existsByCedula(cedula)) {
            throw new CedulaDuplicadaException("La cédula ya está registrada");
        }
        String email = request.getEmail().trim().toLowerCase();
        if (clienteRepository.existsByEmailIgnoreCase(email)) {
            throw new Sprint3Exception(HttpStatus.CONFLICT, "El correo electrónico ya está registrado");
        }

        Cliente cliente = new Cliente();
        cliente.setIdCliente(generarIdCliente());
        cliente.setCedula(cedula);
        cliente.setPrimerNombre(request.getPrimerNombre().trim());
        cliente.setSegundoNombre(limpiar(request.getSegundoNombre()));
        cliente.setPrimerApellido(request.getPrimerApellido().trim());
        cliente.setSegundoApellido(limpiar(request.getSegundoApellido()));
        cliente.setFechaNacimiento(request.getFechaNacimiento());
        cliente.setGenero(limpiar(request.getGenero()));
        cliente.setEmail(email);
        cliente.setTelefono(limpiar(request.getTelefono()));
        cliente.setDireccion(limpiar(request.getDireccion()));
        cliente.setCiudad(limpiar(request.getCiudad()));
        cliente.setDepartamento(limpiar(request.getDepartamento()));
        cliente.setActivo(true);
        cliente.setRol(ROL_CLIENTE);
        // Contraseña inicial: la cédula. El cliente debe cambiarla desde "Seguridad".
        cliente.setPasswordHash(BCrypt.hashpw(cedula, BCrypt.gensalt()));

        cliente = clienteRepository.save(cliente);
        auditoriaRepository.save(new RegistroAuditoria(gestor.id(), gestor.rol(), "CREAR_CLIENTE",
                "CLIENTE", cliente.getId().toString(), null, cliente.getIdCliente()));
        return toResponse(cliente);
    }

    @Transactional(readOnly = true)
    public List<ClienteResponse> listar() {
        return clienteRepository.findByRolOrderByPrimerApellidoAscPrimerNombreAsc(ROL_CLIENTE)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ClienteResponse buscar(UsuarioSesion gestor, String valor) {
        String criterio = valor == null ? "" : valor.trim().replaceAll("\\s+", "");
        Cliente cliente = clienteRepository.findByCedula(criterio)
                .or(() -> clienteRepository.findByIdClienteIgnoreCase(criterio))
                .filter(item -> ROL_CLIENTE.equalsIgnoreCase(item.getRol()))
                .orElseThrow(() -> new ClienteNoEncontradoException(
                        "No existe un cliente con la cédula o identificador " + criterio));
        auditoriaRepository.save(new RegistroAuditoria(gestor.id(), gestor.rol(), "CONSULTAR_CLIENTE",
                "CLIENTE", cliente.getId().toString(), null, null));
        return toResponse(cliente);
    }

    @Transactional
    public ClienteResponse modificar(UsuarioSesion gestor, Long id, ClienteContactoRequest request) {
        Cliente cliente = buscarCliente(id);
        if (!cliente.isActivo()) {
            throw new ClienteInactivoException("El cliente está inactivo");
        }
        String email = request.email().trim().toLowerCase();
        if (clienteRepository.existsByEmailIgnoreCaseAndIdNot(email, id)) {
            throw new Sprint3Exception(HttpStatus.CONFLICT, "El correo electrónico ya está registrado por otro cliente");
        }
        String telefono = request.telefono().trim();
        String direccion = limpiar(request.direccion());
        if (Objects.equals(email, cliente.getEmail())
                && Objects.equals(telefono, cliente.getTelefono())
                && Objects.equals(direccion, cliente.getDireccion())) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "No hay cambios para guardar");
        }
        String anterior = contacto(cliente);
        cliente.setEmail(email);
        cliente.setTelefono(telefono);
        cliente.setDireccion(direccion);
        auditoriaRepository.save(new RegistroAuditoria(gestor.id(), gestor.rol(), "MODIFICAR_CLIENTE",
                "CLIENTE", id.toString(), anterior, contacto(cliente)));
        return toResponse(cliente);
    }

    @Transactional
    public ClienteResponse desactivar(UsuarioSesion gestor, Long id) {
        Cliente cliente = buscarCliente(id);
        if (!cliente.isActivo()) {
            throw new ClienteInactivoException("El cliente ya está inactivo");
        }
        if (cuentaRepository.existsByCliente_IdAndActivaTrue(id)) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST,
                    "No es posible desactivar un cliente con cuentas activas");
        }
        cliente.setActivo(false);
        for (SesionActiva sesion : sesionRepository.findByUsuarioIdAndActivaTrue(id)) {
            sesion.cerrar("Cliente desactivado");
        }
        auditoriaRepository.save(new RegistroAuditoria(gestor.id(), gestor.rol(), "DESACTIVAR_CLIENTE",
                "CLIENTE", id.toString(), "activo", "inactivo"));
        return toResponse(cliente);
    }

    private Cliente buscarCliente(Long id) {
        return clienteRepository.findById(id)
                .filter(item -> ROL_CLIENTE.equalsIgnoreCase(item.getRol()))
                .orElseThrow(() -> new ClienteNoEncontradoException("No existe el cliente con id " + id));
    }

    private void validarCedula(String cedula) {
        if (!cedula.matches("\\d{6,10}")) {
            throw new CedulaInvalidaException("La cédula debe contener entre 6 y 10 dígitos");
        }
    }

    private String contacto(Cliente cliente) {
        return cliente.getEmail() + "|" + cliente.getTelefono() + "|" + cliente.getDireccion();
    }

    private String limpiar(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }

    private String generarIdCliente() {
        String idCliente;
        do {
            idCliente = "BX-" + Long.toString(System.currentTimeMillis(), 36).toUpperCase()
                    + "-" + generarSufijoAleatorio();
        } while (clienteRepository.existsByIdCliente(idCliente));
        return idCliente;
    }

    private String generarSufijoAleatorio() {
        StringBuilder sufijo = new StringBuilder(3);
        for (int i = 0; i < 3; i++) {
            sufijo.append(RANDOM_CHARACTERS.charAt(RANDOM.nextInt(RANDOM_CHARACTERS.length())));
        }
        return sufijo.toString();
    }

    private ClienteResponse toResponse(Cliente cliente) {
        ClienteResponse response = new ClienteResponse();
        response.setId(cliente.getId());
        response.setIdCliente(cliente.getIdCliente());
        response.setCedula(cliente.getCedula());
        response.setPrimerNombre(cliente.getPrimerNombre());
        response.setSegundoNombre(cliente.getSegundoNombre());
        response.setPrimerApellido(cliente.getPrimerApellido());
        response.setSegundoApellido(cliente.getSegundoApellido());
        response.setNombreCompleto(cliente.getNombreCompleto());
        response.setFechaNacimiento(cliente.getFechaNacimiento());
        response.setGenero(cliente.getGenero());
        response.setEmail(cliente.getEmail());
        response.setTelefono(cliente.getTelefono());
        response.setDireccion(cliente.getDireccion());
        response.setCiudad(cliente.getCiudad());
        response.setDepartamento(cliente.getDepartamento());
        response.setActivo(cliente.isActivo());
        response.setFechaRegistro(cliente.getFechaRegistro());
        return response;
    }
}
