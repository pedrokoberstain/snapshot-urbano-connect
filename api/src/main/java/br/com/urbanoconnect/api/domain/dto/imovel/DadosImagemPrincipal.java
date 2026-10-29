package br.com.urbanoconnect.api.domain.dto.imovel;

import jakarta.validation.constraints.NotBlank;

/** Payload para marcar uma foto (da galeria) como a imagem principal/capa do anúncio. */
public record DadosImagemPrincipal(
        @NotBlank(message = "A URL da imagem principal é obrigatória")
        String imagemPrincipal
) {}
