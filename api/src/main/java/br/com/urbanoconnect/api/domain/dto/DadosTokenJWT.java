package br.com.urbanoconnect.api.domain.dto;

public record DadosTokenJWT(
        String token,
        String tipo,
        String cidade // <--- Adicione isso aqui
) {}