package ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.dto.ClienteRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.dto.ClienteResponse;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.CedulaDuplicadaException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.CedulaInvalidaException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.ClienteInactivoException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.ClienteNoEncontradoException;
import java.security.SecureRandom;
import java.util.List;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.auditoria.AuditoriaRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.auditoria.RegistroAuditoria;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.CuentaRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.sesion.SesionRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.sesion.SesionActiva;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception.Sprint3Exception;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClienteService {

    private static final String RANDOM_CHARACTERS =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    private static final SecureRandom RANDOM = new SecureRandom();

    private final ClienteRepository clienteRepository;
    private CuentaRepository cuentaRepository;
    private AuditoriaRepository auditoriaRepository;
    private SesionRepository sesionRepository;

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
    public ClienteResponse crear(ClienteRequest request) {
        validarCedula(request.getCedula());

        if (clienteRepository.existsByCedula(request.getCedula())) {
            throw new CedulaDuplicadaException(
                    "La cédula ya está registrada"
            );
        }

        Cliente cliente = new Cliente();

        cliente.setIdCliente(generarIdCliente());
        cliente.setCedula(request.getCedula());
        cliente.setPrimerNombre(request.getPrimerNombre());
        cliente.setSegundoNombre(request.getSegundoNombre());
        cliente.setPrimerApellido(request.getPrimerApellido());
        cliente.setSegundoApellido(request.getSegundoApellido());
        cliente.setFechaNacimiento(request.getFechaNacimiento());
        cliente.setGenero(request.getGenero());
        cliente.setEmail(request.getEmail());
        cliente.setTelefono(request.getTelefono());
        cliente.setDireccion(request.getDireccion());
        cliente.setCiudad(request.getCiudad());
        cliente.setDepartamento(request.getDepartamento());
        cliente.setActivo(true);

        return toResponse(clienteRepository.save(cliente));
    }

    @Transactional(readOnly = true)
    public List<ClienteResponse> listar() {
        return clienteRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClienteResponse buscar(String valor) {
        String normalized = valor == null ? "" : valor.trim();
        Cliente cliente = clienteRepository.findByCedula(normalized)
                .or(() -> clienteRepository.findAll().stream()
                        .filter(item -> normalized.equalsIgnoreCase(item.getIdCliente()))
                        .findFirst())
                .orElseThrow(() -> new ClienteNoEncontradoException(
                        "No existe el cliente con criterio " + normalized));
        return toResponse(cliente);
    }

    @Transactional
    public ClienteResponse modificar(Long id, String rol, Long gestorId, ClienteRequest request) {
        validarGestor(rol);
        Cliente cliente = clienteRepository.findById(id).orElseThrow(
                () -> new ClienteNoEncontradoException("No existe el cliente con id " + id));
        if (!cliente.isActivo()) {
            throw new ClienteInactivoException("El cliente está inactivo");
        }
        if (request.getEmail() == null || !request.getEmail().matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "Correo electrónico inválido");
        }
        if (request.getTelefono() == null || !request.getTelefono().matches("^[0-9+() -]{7,20}$")) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST, "Teléfono inválido");
        }
        String anterior = cliente.getEmail() + "|" + cliente.getTelefono() + "|" + cliente.getDireccion();
        cliente.setEmail(request.getEmail());
        cliente.setTelefono(request.getTelefono());
        cliente.setDireccion(request.getDireccion());
        cliente = clienteRepository.save(cliente);
        String nuevo = cliente.getEmail() + "|" + cliente.getTelefono() + "|" + cliente.getDireccion();
        auditoriaRepository.save(new RegistroAuditoria(gestorId, "GESTOR", "MODIFICAR_CLIENTE",
                "CLIENTE", id.toString(), anterior, nuevo));
        return toResponse(cliente);
    }

    @Transactional
    public ClienteResponse desactivar(Long id, String rol, Long gestorId) {
        validarGestor(rol);
        Cliente cliente = clienteRepository.findById(id).orElseThrow(
                () -> new ClienteNoEncontradoException("No existe el cliente con id " + id));
        if (!cliente.isActivo()) {
            throw new ClienteInactivoException("El cliente ya está inactivo");
        }
        boolean cuentasActivas = cuentaRepository.findByCliente_Id(id).stream().anyMatch(c -> c.isActiva());
        if (cuentasActivas) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST,
                    "No es posible desactivar un cliente con cuentas activas");
        }
        cliente.setActivo(false);
        cliente = clienteRepository.save(cliente);
        for (SesionActiva sesion : sesionRepository.findByUsuarioIdAndActivaTrue(id)) {
            sesion.setActiva(false);
            sesionRepository.save(sesion);
        }
        auditoriaRepository.save(new RegistroAuditoria(gestorId, "GESTOR", "DESACTIVAR_CLIENTE",
                "CLIENTE", id.toString(), "activo", "inactivo"));
        return toResponse(cliente);
    }

    private void validarGestor(String rol) {
        if (!"GESTOR".equalsIgnoreCase(rol)) {
            throw new Sprint3Exception(HttpStatus.FORBIDDEN, "Solo disponible para gestor");
        }
    }

    private void validarCedula(String cedula) {
        if (cedula == null || !cedula.matches("\\d{6,10}")) {
            throw new CedulaInvalidaException(
                    "La cédula debe contener entre 6 y 10 dígitos"
            );
        }
    }

    private String generarIdCliente() {
        String idCliente;

        do {
            idCliente = "BX-"
                    + Long.toString(System.currentTimeMillis(), 36)
                    + "-"
                    + generarSufijoAleatorio();
        } while (clienteRepository.existsByIdCliente(idCliente));

        return idCliente;
    }

    private String generarSufijoAleatorio() {
        StringBuilder sufijo = new StringBuilder(3);

        for (int i = 0; i < 3; i++) {
            sufijo.append(
                    RANDOM_CHARACTERS.charAt(
                            RANDOM.nextInt(RANDOM_CHARACTERS.length())
                    )
            );
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
        response.setFechaNacimiento(cliente.getFechaNacimiento());
        response.setGenero(cliente.getGenero());
        response.setEmail(cliente.getEmail());
        response.setTelefono(cliente.getTelefono());
        response.setDireccion(cliente.getDireccion());
        response.setCiudad(cliente.getCiudad());
        response.setDepartamento(cliente.getDepartamento());
        response.setActivo(cliente.isActivo());

        return response;
    }
}