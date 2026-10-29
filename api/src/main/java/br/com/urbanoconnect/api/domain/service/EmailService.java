package br.com.urbanoconnect.api.domain.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.UnsupportedEncodingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String mailFrom;

    public void enviarEmailRecuperacao(String nome, String destinatario, String link) {
        try {
            String primeiroNome = (nome != null && !nome.isBlank()) ? nome.split(" ")[0] : "usuário";
            String html = """
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
                <body style="margin:0;padding:0;background:#09090f;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#09090f;">
                    <tr><td align="center" style="padding:40px 20px;">
                      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%%;">

                        <!-- Logo -->
                        <tr><td align="center" style="padding-bottom:32px;">
                          <table cellpadding="0" cellspacing="0">
                            <tr><td style="background:#12121e;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:16px 32px;text-align:center;">
                              <span style="font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-1px;font-family:Arial,sans-serif;">urbano</span><span style="font-size:26px;font-weight:900;color:#22c55e;letter-spacing:-1px;font-family:Arial,sans-serif;">connect</span>
                              <p style="margin:6px 0 0;font-size:10px;font-weight:700;color:#22c55e;letter-spacing:0.25em;text-transform:uppercase;font-family:Arial,sans-serif;">Mato Grosso · Imóveis</p>
                            </td></tr>
                          </table>
                        </td></tr>

                        <!-- Card -->
                        <tr><td style="background:#12121e;border-radius:16px;padding:40px 36px;border:1px solid rgba(255,255,255,0.06);">

                          <!-- Ícone -->
                          <div style="text-align:center;margin-bottom:24px;">
                            <div style="display:inline-block;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:50%%;width:64px;height:64px;line-height:64px;font-size:28px;">🔑</div>
                          </div>

                          <h2 style="margin:0 0 8px;text-align:center;color:#ffffff;font-family:Arial,sans-serif;font-size:22px;font-weight:700;">Recuperação de senha</h2>
                          <p style="margin:0 0 24px;text-align:center;color:#6b7280;font-family:Arial,sans-serif;font-size:14px;">Recebemos um pedido para redefinir sua senha</p>

                          <p style="color:#d1d5db;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;margin:0 0 28px;">
                            Olá, <strong style="color:#ffffff;">%s</strong>!<br><br>
                            Recebemos uma solicitação para redefinir a senha da sua conta na <strong style="color:#22c55e;">Urbano Connect</strong>.
                            Clique no botão abaixo para criar uma nova senha:
                          </p>

                          <!-- Botão -->
                          <div style="text-align:center;margin:0 0 28px;">
                            <a href="%s" target="_blank"
                               style="display:inline-block;background:#22c55e;color:#000000;font-family:Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:10px;">
                              Redefinir minha senha →
                            </a>
                          </div>

                          <!-- Link alternativo -->
                          <p style="color:#6b7280;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;margin:0 0 8px;">
                            Se o botão não funcionar, copie e cole o link abaixo no navegador:
                          </p>
                          <p style="background:#0d0d1a;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:12px;font-family:monospace;font-size:11px;color:#9ca3af;word-break:break-all;margin:0 0 24px;">%s</p>

                          <!-- Aviso -->
                          <div style="background:rgba(234,179,8,0.08);border:1px solid rgba(234,179,8,0.2);border-radius:10px;padding:14px 18px;">
                            <p style="margin:0;color:#fbbf24;font-family:Arial,sans-serif;font-size:13px;">
                              ⚠️ Este link expira em <strong>1 hora</strong>. Se você não solicitou a redefinição de senha, ignore este e-mail.
                            </p>
                          </div>

                        </td></tr>

                        <!-- Divider -->
                        <tr><td style="padding:28px 0 0;">
                          <table width="100%%" cellpadding="0" cellspacing="0">
                            <tr><td style="height:1px;background:rgba(34,197,94,0.15);"></td></tr>
                          </table>
                        </td></tr>

                        <!-- Footer -->
                        <tr><td align="center" style="padding:24px 0 40px;">
                          <p style="color:#374151;font-family:Arial,sans-serif;font-size:12px;margin:0 0 4px;">Este e-mail foi enviado automaticamente. Por favor, não responda.</p>
                          <p style="color:#374151;font-family:Arial,sans-serif;font-size:11px;margin:0;">© %d Urbano Connect · Mato Grosso, Brasil</p>
                        </td></tr>

                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(primeiroNome, link, link, java.time.Year.now().getValue());

            enviarEmailHtml(destinatario, "Redefinição de senha — Urbano Connect", html);
        } catch (Exception e) {
            throw new RuntimeException("Falha ao enviar e-mail de recuperação", e);
        }
    }

    public void enviarEmailHtml(String destinatario, String assunto, String htmlBody) throws MessagingException, UnsupportedEncodingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(mailFrom, "Urbano Connect");
        helper.setTo(destinatario);
        helper.setSubject(assunto);
        helper.setText(htmlBody, true);
        mailSender.send(message);
    }

    public static String montarTemplateNewsletter(
            String assunto,
            String conteudoHtml,
            String urlBotao,
            String textoBotao,
            String linkCancelamento) {

        String secaoBotao = "";
        if (urlBotao != null && !urlBotao.isBlank()) {
            String texto = (textoBotao != null && !textoBotao.isBlank()) ? textoBotao : "Ver conteúdo completo";
            secaoBotao = """
                <!-- CTA Button -->
                <div style="text-align:center;margin:32px 0 8px;">
                  <!--[if mso]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="%s"
                    style="height:48px;v-text-anchor:middle;width:240px;" arcsize="21%%"
                    fillcolor="#22c55e" strokecolor="#22c55e">
                    <w:anchorlock/>
                    <center style="color:#000000;font-family:Arial,sans-serif;font-size:15px;font-weight:700;">%s</center>
                  </v:roundrect>
                  <![endif]-->
                  <!--[if !mso]><!-->
                  <a href="%s" target="_blank"
                     style="display:inline-block;background:#22c55e;color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;letter-spacing:0.01em;mso-hide:all;">
                    %s &nbsp;→
                  </a>
                  <!--<![endif]-->
                </div>
                """.formatted(urlBotao, texto, urlBotao, texto);
        }

        return """
            <!DOCTYPE html>
            <html lang="pt-BR" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta http-equiv="X-UA-Compatible" content="IE=edge">
              <title>%s</title>
              <!--[if mso]>
              <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
              <![endif]-->
            </head>
            <body style="margin:0;padding:0;background:#09090f;-webkit-text-size-adjust:100%%;-ms-text-size-adjust:100%%;">
              <table width="100%%" cellpadding="0" cellspacing="0" role="presentation" style="background:#09090f;">
                <tr><td align="center" style="padding:40px 20px;">
                  <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%%;">

                    <!-- Logo -->
                    <tr><td align="center" style="padding-bottom:36px;">
                      <table cellpadding="0" cellspacing="0" role="presentation">
                        <tr><td style="background:#12121e;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:16px 32px;text-align:center;">
                          <span style="font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-1px;font-family:Arial,sans-serif;">urbano</span><span style="font-size:26px;font-weight:900;color:#22c55e;letter-spacing:-1px;font-family:Arial,sans-serif;">connect</span>
                          <p style="margin:6px 0 0;font-size:10px;font-weight:700;color:#22c55e;letter-spacing:0.25em;text-transform:uppercase;font-family:Arial,sans-serif;">Mato Grosso · Newsletter</p>
                        </td></tr>
                      </table>
                    </td></tr>

                    <!-- Corpo -->
                    <tr><td style="background:#12121e;border-radius:16px;padding:36px;border:1px solid rgba(255,255,255,0.06);">
                      <div style="color:#e2e8f0;font-size:15px;line-height:1.75;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
                        %s
                      </div>
                      %s
                    </td></tr>

                    <!-- Divider -->
                    <tr><td style="padding:32px 0;">
                      <table width="100%%" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td style="height:1px;background:rgba(34,197,94,0.2);"></td>
                        </tr>
                      </table>
                    </td></tr>

                    <!-- Footer -->
                    <tr><td align="center" style="padding-bottom:40px;">
                      <p style="color:#6b7280;font-size:12px;margin:0 0 8px;font-family:Arial,sans-serif;">Você está recebendo este e-mail porque se inscreveu na Urbano Connect.</p>
                      <a href="%s" style="color:#22c55e;font-size:12px;font-weight:600;text-decoration:none;font-family:Arial,sans-serif;">Cancelar inscrição</a>
                      <p style="color:#374151;font-size:11px;margin:16px 0 0;font-family:Arial,sans-serif;">© %d Urbano Connect · Mato Grosso, Brasil</p>
                    </td></tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(
                assunto,
                conteudoHtml,
                secaoBotao,
                linkCancelamento,
                java.time.Year.now().getValue()
            );
    }
}