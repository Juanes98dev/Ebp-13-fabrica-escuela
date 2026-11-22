package ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception;

import org.springframework.http.HttpStatus;

public class Sprint3Exception extends RuntimeException {
    private final HttpStatus status;

    public Sprint3Exception(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
