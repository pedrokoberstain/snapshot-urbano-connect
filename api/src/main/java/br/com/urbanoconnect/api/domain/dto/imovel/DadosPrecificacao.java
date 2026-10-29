package br.com.urbanoconnect.api.domain.dto.imovel;

/**
 * DTO que recebe as respostas qualitativas do corretor
 * para calcular o Padrão de Acabamento e o Índice de Sprawl,
 * e em seguida roda o modelo hedônico de precificação.
 *
 * ── PADRÃO DE ACABAMENTO (0 a 3) ──────────────────────────
 * Calculado como a média inteira de 4 perguntas:
 *   piso:       0=Cerâmica  | 1=Porcelanato | 2=Mármore    | 3=Marble Importado
 *   teto:       0=Laje lisa | 1=Gesso       | 2=Luminotécn.| 3=Automação/Leds
 *   esquadrias: 0=Ferro     | 1=Alumínio    | 2=Suprema PVC| 3=Minimalista
 *   bancadas:   0=Inox      | 1=Granito     | 2=Quartzo    | 3=Mármore Importado
 *
 * ── SPRAWL / ESPRAIAMENTO URBANO (0.0 a 3.0) ─────────────
 * Calculado como a média decimal de 3 perguntas:
 *   proximidadeRodovia:  0=Longe | 1=Moderado | 2=Próximo | 3=Eixo logístico
 *   crescimentoBairro:   0=Estag.| 1=Lento    | 2=Moderado| 3=Expansão rápida
 *   novosLoteamentos:    0=Nenhum| 1=Poucos   | 2=Vários  | 3=Muitos
 */
public record DadosPrecificacao(

        // ── Padrão de Acabamento — 4 perguntas (0 a 3 cada) ──
        Integer piso,
        Integer teto,
        Integer esquadrias,
        Integer bancadas,

        // ── Sprawl — 3 perguntas (0 a 3 cada) ────────────────
        Integer proximidadeRodovia,
        Integer crescimentoBairro,
        Integer novosLoteamentos
) {}