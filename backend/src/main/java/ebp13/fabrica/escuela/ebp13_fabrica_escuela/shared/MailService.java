package ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class MailService {
    private static final Logger LOG = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender mailSender;
    private final String smtpHost;
    private final String from;

    public MailService(Optional<JavaMailSender> mailSender,
                       @Value("${SMTP_HOST:}") String smtpHost,
                       @Value("${SMTP_FROM:no-reply@bancox.local}") String from) {
        this.mailSender = mailSender.orElse(null);
        this.smtpHost = smtpHost;
        this.from = from;
    }

    /**
     * Envía una notificación en segundo plano y sin propagar fallos: un SMTP lento o caído
     * no debe demorar ni revertir la operación bancaria.
     */
    @Async
    public void send(String to, String subject, String text) {
        if (to == null || to.isBlank()) {
            return;
        }
        if (smtpHost == null || smtpHost.isBlank() || mailSender == null) {
            LOG.info("SMTP no configurado. Correo omitido para {}: {} - {}", to, subject, text);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        try {
            mailSender.send(message);
        } catch (MailException exception) {
            LOG.warn("No fue posible enviar el correo '{}' a {}: {}", subject, to, exception.getMessage());
        }
    }
}
