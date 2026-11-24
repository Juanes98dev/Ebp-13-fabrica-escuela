package ebp13.fabrica.escuela.ebp13_fabrica_escuela.sesion;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.cors.CorsUtils;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class SesionInterceptor implements HandlerInterceptor {

    public static final String HEADER_TOKEN = "X-Session-Token";

    private final AuthService authService;

    public SesionInterceptor(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (CorsUtils.isPreFlightRequest(request)) {
            return true;
        }
        UsuarioSesion usuario = authService.autenticar(request.getHeader(HEADER_TOKEN));
        request.setAttribute(UsuarioSesion.ATRIBUTO, usuario);
        return true;
    }
}
