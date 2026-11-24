package ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception.Sprint3Exception;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;

public final class PasswordPolicy {

    private static final Pattern MAYUSCULA = Pattern.compile("[A-Z]");
    private static final Pattern NUMERO = Pattern.compile("\\d");
    private static final Pattern ESPECIAL = Pattern.compile("[^A-Za-z0-9]");

    private PasswordPolicy() {
    }

    public static void validar(String password) {
        if (password == null
                || password.length() < 8
                || password.length() > 64
                || !MAYUSCULA.matcher(password).find()
                || !NUMERO.matcher(password).find()
                || !ESPECIAL.matcher(password).find()) {
            throw new Sprint3Exception(HttpStatus.BAD_REQUEST,
                    "La contraseña debe tener entre 8 y 64 caracteres, una mayúscula, un número y un carácter especial");
        }
    }
}
