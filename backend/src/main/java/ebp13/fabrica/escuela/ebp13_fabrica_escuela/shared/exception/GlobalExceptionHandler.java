package ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.CedulaDuplicadaException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.CedulaInvalidaException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.ClienteInactivoException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.ClienteNoEncontradoException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.exception.CuentaNoEncontradaException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.ServletRequestBindingException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger LOG = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(Sprint3Exception.class)
    public ResponseEntity<ErrorResponse> handleSprint3(Sprint3Exception exception) {
        return response(exception.getStatus(), exception.getStatus().name(), exception.getMessage());
    }

    @ExceptionHandler(ClienteNoEncontradoException.class)
    public ResponseEntity<ErrorResponse> handleClienteNoEncontrado(ClienteNoEncontradoException exception) {
        return response(HttpStatus.NOT_FOUND, "CLIENTE_NO_ENCONTRADO", exception.getMessage());
    }

    @ExceptionHandler(CuentaNoEncontradaException.class)
    public ResponseEntity<ErrorResponse> handleCuentaNoEncontrada(CuentaNoEncontradaException exception) {
        return response(HttpStatus.NOT_FOUND, "CUENTA_NO_ENCONTRADA", exception.getMessage());
    }

    @ExceptionHandler(CedulaDuplicadaException.class)
    public ResponseEntity<ErrorResponse> handleDuplicada(CedulaDuplicadaException exception) {
        return response(HttpStatus.CONFLICT, "CEDULA_DUPLICADA", exception.getMessage());
    }

    @ExceptionHandler(CedulaInvalidaException.class)
    public ResponseEntity<ErrorResponse> handleCedulaInvalida(CedulaInvalidaException exception) {
        return response(HttpStatus.BAD_REQUEST, "CEDULA_INVALIDA", exception.getMessage());
    }

    @ExceptionHandler(ClienteInactivoException.class)
    public ResponseEntity<ErrorResponse> handleClienteInactivo(ClienteInactivoException exception) {
        return response(HttpStatus.BAD_REQUEST, "CLIENTE_INACTIVO", exception.getMessage());
    }

    @ExceptionHandler(CuentaInactivaException.class)
    public ResponseEntity<ErrorResponse> handleCuentaInactiva(CuentaInactivaException exception) {
        return response(HttpStatus.BAD_REQUEST, "CUENTA_INACTIVA", exception.getMessage());
    }

    @ExceptionHandler(SaldoInsuficienteException.class)
    public ResponseEntity<ErrorResponse> handleSaldoInsuficiente(SaldoInsuficienteException exception) {
        return response(HttpStatus.BAD_REQUEST, "SALDO_INSUFICIENTE", exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidacion(MethodArgumentNotValidException exception) {
        String mensaje = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(FieldError::getDefaultMessage)
                .orElse("Los datos enviados no son válidos");
        return response(HttpStatus.BAD_REQUEST, "VALIDACION", mensaje);
    }

    @ExceptionHandler({
        HttpMessageNotReadableException.class,
        MethodArgumentTypeMismatchException.class,
        MissingServletRequestParameterException.class,
        IllegalArgumentException.class
    })
    public ResponseEntity<ErrorResponse> handleSolicitudInvalida(Exception exception) {
        return response(HttpStatus.BAD_REQUEST, "SOLICITUD_INVALIDA",
                "La solicitud contiene datos inválidos o incompletos");
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ErrorResponse> handleHeader(MissingRequestHeaderException exception) {
        return response(HttpStatus.BAD_REQUEST, "SOLICITUD_INVALIDA", "Falta la cabecera " + exception.getHeaderName());
    }

    @ExceptionHandler(ServletRequestBindingException.class)
    public ResponseEntity<ErrorResponse> handleBinding(ServletRequestBindingException exception) {
        return response(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Debe iniciar sesión para continuar");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMetodo(HttpRequestMethodNotSupportedException exception) {
        return response(HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED", "Método no permitido");
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoEncontrado(NoResourceFoundException exception) {
        return response(HttpStatus.NOT_FOUND, "NOT_FOUND", "Recurso no encontrado");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleIntegridad(DataIntegrityViolationException exception) {
        LOG.warn("Violación de integridad de datos", exception);
        return response(HttpStatus.CONFLICT, "CONFLICTO", "La operación entra en conflicto con datos existentes");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception exception) {
        LOG.error("Error no controlado", exception);
        return response(HttpStatus.INTERNAL_SERVER_ERROR, "ERROR_INTERNO",
                "Ocurrió un error inesperado. Intente nuevamente");
    }

    private ResponseEntity<ErrorResponse> response(HttpStatus status, String error, String mensaje) {
        return ResponseEntity.status(status).body(new ErrorResponse(error, mensaje));
    }

    public record ErrorResponse(String error, String mensaje) {
    }
}
