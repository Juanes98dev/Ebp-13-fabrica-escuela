package ebp13.fabrica.escuela.ebp13_fabrica_escuela;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

@SpringBootTest
@AutoConfigureMockMvc
class FlujoBancarioIntegrationTest {

    private static final String TOKEN = "X-Session-Token";

    @Autowired
    private MockMvc mvc;

    @Test
    void flujoPrincipalDeClienteYGestor() throws Exception {
        String gestor = login("9999999999", "gestor123");

        long clienteId = crearCliente(gestor, "1012345678", "laura@test.com");
        long otroId = crearCliente(gestor, "1098765432", "pedro@test.com");
        assertThat(otroId).isNotEqualTo(clienteId);

        String cliente = login("1012345678", "1012345678");
        String otro = login("1098765432", "1098765432");

        mvc.perform(get("/api/clientes").header(TOKEN, cliente)).andExpect(status().isForbidden());

        String ahorros = abrirCuenta(cliente, "AHORROS");
        String corriente = abrirCuenta(cliente, "CORRIENTE");
        String cuentaOtro = abrirCuenta(otro, "AHORROS");

        mvc.perform(json(post("/api/transacciones/consignacion"), cliente,
                        "{\"cuentaDestino\":\"" + ahorros + "\",\"monto\":100000,\"concepto\":\"Nómina\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.descripcion").value("Nómina"));

        String referencia = JsonPath.read(mvc.perform(json(post("/api/transacciones/transferencia"), cliente,
                        "{\"cuentaOrigen\":\"" + ahorros + "\",\"cuentaDestino\":\"" + cuentaOtro
                                + "\",\"monto\":30000,\"concepto\":\"Arriendo\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.titularDestino").value("Cliente T."))
                .andReturn().getResponse().getContentAsString(), "$.referencia");

        mvc.perform(json(post("/api/transacciones/transferencia"), cliente,
                        "{\"cuentaOrigen\":\"" + ahorros + "\",\"cuentaDestino\":\"" + corriente + "\",\"monto\":999999}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("SALDO_INSUFICIENTE"));

        mvc.perform(json(post("/api/transacciones/retiro"), cliente,
                        "{\"numeroCuenta\":\"" + ahorros + "\",\"monto\":5000}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("El monto mínimo de retiro es $10.000"));
        mvc.perform(json(post("/api/transacciones/consignacion"), cliente,
                        "{\"cuentaDestino\":\"" + ahorros + "\",\"monto\":60000000}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("El monto máximo por consignación es $50.000.000"));

        mvc.perform(json(post("/api/transacciones/retiro"), cliente,
                        "{\"numeroCuenta\":\"" + ahorros + "\",\"monto\":10000}"))
                .andExpect(status().isCreated());

        mvc.perform(get("/api/cuentas/" + ahorros).header(TOKEN, cliente))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.saldo").value(60000));

        mvc.perform(get("/api/transacciones/cuenta/" + ahorros).header(TOKEN, cliente))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3));

        mvc.perform(get("/api/transacciones/referencia/" + referencia).header(TOKEN, otro))
                .andExpect(status().isOk());

        // Un tercero no puede mover ni consultar fondos ajenos.
        mvc.perform(json(post("/api/transacciones/transferencia"), otro,
                        "{\"cuentaOrigen\":\"" + ahorros + "\",\"cuentaDestino\":\"" + cuentaOtro + "\",\"monto\":1000}"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/transacciones/cuenta/" + ahorros).header(TOKEN, otro))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/cuentas/" + ahorros + "/destino").header(TOKEN, otro))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.saldo").doesNotExist())
                .andExpect(jsonPath("$.titular").value("Cliente T."));

        long tarjetaId = ((Number) JsonPath.read(mvc.perform(json(post("/api/tarjetas/solicitudes"), cliente,
                        "{\"tipo\":\"DEBITO\",\"numeroCuenta\":\"" + ahorros + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado").value("pendiente"))
                .andReturn().getResponse().getContentAsString(), "$.id")).longValue();

        mvc.perform(post("/api/tarjetas/" + tarjetaId + "/desbloquear").header(TOKEN, cliente))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/tarjetas/solicitudes").header(TOKEN, gestor))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].clienteCedula").value("1012345678"));
        mvc.perform(post("/api/tarjetas/solicitudes/" + tarjetaId + "/aprobar").header(TOKEN, gestor))
                .andExpect(status().isOk());
        mvc.perform(post("/api/tarjetas/solicitudes/" + tarjetaId + "/aprobar").header(TOKEN, gestor))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/tarjetas/" + tarjetaId + "/bloquear").header(TOKEN, cliente))
                .andExpect(status().isOk());
        mvc.perform(post("/api/tarjetas/" + tarjetaId + "/bloquear").header(TOKEN, otro))
                .andExpect(status().isNotFound());

        mvc.perform(json(put("/api/clientes/" + clienteId), gestor,
                        "{\"email\":\"laura.nueva@test.com\",\"telefono\":\"3001234567\",\"direccion\":\"Calle 1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("laura.nueva@test.com"));
        mvc.perform(patch("/api/clientes/" + clienteId + "/desactivar").header(TOKEN, gestor))
                .andExpect(status().isBadRequest());

        String hoy = LocalDate.now().toString();
        mvc.perform(get("/api/reportes/actividad?fechaInicial=" + hoy + "&fechaFinal=" + hoy).header(TOKEN, gestor))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalTransacciones").value(3))
                .andExpect(jsonPath("$.porTipo.conteo.TRANSFERENCIA").value(1));
        mvc.perform(get("/api/reportes/actividad?fechaInicial=" + hoy + "&fechaFinal=" + hoy).header(TOKEN, cliente))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/auth/logout").header(TOKEN, cliente)).andExpect(status().isOk());
        mvc.perform(get("/api/cuentas/mias").header(TOKEN, cliente)).andExpect(status().isUnauthorized());
    }

    @Test
    void rechazaPeticionesSinSesionYBloqueaTrasIntentosFallidos() throws Exception {
        mvc.perform(get("/api/clientes")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/cuentas/mias").header(TOKEN, "token-falso")).andExpect(status().isUnauthorized());

        String gestor = login("9999999999", "gestor123");
        crearCliente(gestor, "1055555555", "bloqueo@test.com");

        for (int intento = 0; intento < 2; intento++) {
            mvc.perform(json(post("/api/auth/login"), null, "{\"cedula\":\"1055555555\",\"password\":\"mala\"}"))
                    .andExpect(status().isUnauthorized());
        }
        mvc.perform(json(post("/api/auth/login"), null, "{\"cedula\":\"1055555555\",\"password\":\"mala\"}"))
                .andExpect(status().isLocked());
        mvc.perform(json(post("/api/auth/login"), null, "{\"cedula\":\"1055555555\",\"password\":\"1055555555\"}"))
                .andExpect(status().isLocked());
    }

    private String login(String cedula, String password) throws Exception {
        String body = mvc.perform(json(post("/api/auth/login"), null,
                        "{\"cedula\":\"" + cedula + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.sessionToken");
    }

    private long crearCliente(String gestor, String cedula, String email) throws Exception {
        String body = mvc.perform(json(post("/api/clientes"), gestor, """
                        {"cedula":"%s","primerNombre":"Cliente","primerApellido":"Test",
                         "fechaNacimiento":"1995-05-10","email":"%s","telefono":"3001112233"}
                        """.formatted(cedula, email)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    private String abrirCuenta(String token, String tipo) throws Exception {
        String body = mvc.perform(json(post("/api/cuentas"), token, "{\"tipo\":\"" + tipo + "\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.numeroCuenta");
    }

    private MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder builder, String token, String body) {
        builder.contentType(MediaType.APPLICATION_JSON).content(body);
        return token == null ? builder : builder.header(TOKEN, token);
    }
}
