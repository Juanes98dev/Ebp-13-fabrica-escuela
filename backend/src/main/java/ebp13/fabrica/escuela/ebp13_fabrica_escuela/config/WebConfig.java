package ebp13.fabrica.escuela.ebp13_fabrica_escuela.config;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.sesion.SesionInterceptor;
import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private static final String[] RUTAS_PUBLICAS = {
        "/api/auth/login",
        "/api/auth/recuperar",
        "/api/auth/verificar-codigo",
        "/api/auth/restablecer"
    };

    private final String[] allowedOriginPatterns;
    private final SesionInterceptor sesionInterceptor;

    public WebConfig(
            @Value("${app.cors.allowed-origin-patterns:http://localhost:5173,http://localhost:8443}") String allowedOriginPatterns,
            SesionInterceptor sesionInterceptor) {
        this.allowedOriginPatterns = Arrays.stream(allowedOriginPatterns.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toArray(String[]::new);
        this.sesionInterceptor = sesionInterceptor;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns(allowedOriginPatterns)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("Content-Disposition");
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(sesionInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns(RUTAS_PUBLICAS);
    }
}
