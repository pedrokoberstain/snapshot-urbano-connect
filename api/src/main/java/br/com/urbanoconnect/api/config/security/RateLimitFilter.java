package br.com.urbanoconnect.api.config.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Rate limiting simples em memória, por IP + rota, para proteger rotas sensíveis
 * contra brute force (login), bomba de e-mails (esqueci-senha) e spam (leads/newsletter).
 *
 * Janela fixa de 1 minuto. Sem dependências externas — suficiente para uma
 * instância única. Se a aplicação escalar horizontalmente, migrar para Redis/Bucket4j.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    // Rota → máximo de requisições por minuto por IP
    private static final Map<String, Integer> LIMITES = Map.of(
            "POST /login", 10,
            "POST /usuarios/esqueci-senha", 5,
            "POST /usuarios/redefinir-senha", 10,
            "POST /usuarios/registrar", 10,
            "POST /leads", 15,
            "POST /newsletter/inscrever", 10
    );

    private final ConcurrentHashMap<String, Janela> contadores = new ConcurrentHashMap<>();

    private static class Janela {
        final long inicioMinuto;
        final AtomicInteger contagem = new AtomicInteger(0);

        Janela(long inicioMinuto) {
            this.inicioMinuto = inicioMinuto;
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String chaveRota = request.getMethod() + " " + request.getRequestURI();
        Integer limite = LIMITES.get(chaveRota);

        if (limite != null) {
            String ip = extrairIp(request);
            long minutoAtual = System.currentTimeMillis() / 60_000;
            String chave = ip + "|" + chaveRota;

            Janela janela = contadores.compute(chave, (k, atual) ->
                    (atual == null || atual.inicioMinuto != minutoAtual) ? new Janela(minutoAtual) : atual);

            if (janela.contagem.incrementAndGet() > limite) {
                log.warn("Rate limit excedido: {} em {}", ip, chaveRota);
                response.setStatus(429);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"erro\":\"Muitas requisições. Tente novamente em instantes.\"}");
                return;
            }

            // Limpeza oportunista para o mapa não crescer indefinidamente
            if (contadores.size() > 10_000) {
                contadores.entrySet().removeIf(e -> e.getValue().inicioMinuto != minutoAtual);
            }
        }

        filterChain.doFilter(request, response);
    }

    private String extrairIp(HttpServletRequest request) {
        // A API fica atrás do Caddy (proxy reverso) na VPS. O X-Forwarded-For é uma
        // cadeia onde cada proxy acrescenta ao FINAL — logo, o último elemento é o
        // único escrito por infraestrutura nossa. Os anteriores podem ter sido
        // forjados pelo próprio cliente, que é livre para mandar o header que quiser.
        //
        // Pegar o primeiro elemento (como era antes) permitiria a um atacante trocar
        // o valor a cada requisição e nunca bater no limite, anulando a proteção
        // contra força bruta no /login.
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            String[] partes = xff.split(",");
            String ultimo = partes[partes.length - 1].trim();
            if (!ultimo.isEmpty()) {
                return ultimo;
            }
        }
        return request.getRemoteAddr();
    }
}
