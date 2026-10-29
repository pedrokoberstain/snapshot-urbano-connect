package br.com.urbanoconnect.api.domain.dto.condominio;

import br.com.urbanoconnect.api.domain.model.TipoCondominio;
import jakarta.validation.constraints.*;
import org.hibernate.validator.constraints.br.CNPJ;

/**
 * Entrada do cadastro/atualização de condomínio. Só o nome é obrigatório —
 * o cadastro costuma começar incompleto em visita de campo e ser completado
 * depois. O CNPJ, quando informado, é validado de fato (dígito verificador).
 */
public record DadosCadastroCondominio(

        @NotBlank(message = "O nome do condomínio é obrigatório.")
        @Size(max = 150, message = "O nome deve ter no máximo 150 caracteres.")
        String nome,

        @Size(max = 200, message = "A razão social deve ter no máximo 200 caracteres.")
        String razaoSocial,

        @CNPJ(message = "CNPJ inválido.")
        String cnpj,

        TipoCondominio tipoCondominio,

        @Pattern(regexp = "^$|^\\d{5}-?\\d{3}$", message = "CEP inválido. Use 00000-000 ou 00000000.")
        String cep,

        String rua,
        String numero,
        String complemento,
        String bairro,
        String cidade,

        @Pattern(regexp = "^$|^[A-Za-z]{2}$", message = "UF deve ter 2 letras.")
        String uf,

        @DecimalMin(value = "-90.0",  message = "Latitude fora do intervalo válido.")
        @DecimalMax(value = "90.0",   message = "Latitude fora do intervalo válido.")
        Double latitude,

        @DecimalMin(value = "-180.0", message = "Longitude fora do intervalo válido.")
        @DecimalMax(value = "180.0",  message = "Longitude fora do intervalo válido.")
        Double longitude,

        @Positive(message = "A quantidade de unidades deve ser maior que zero.")
        Integer qtdUnidades,

        @Positive(message = "A quantidade de torres deve ser maior que zero.")
        Integer qtdTorres,

        @Min(value = 1900, message = "Ano de entrega inválido.")
        @Max(value = 2100, message = "Ano de entrega inválido.")
        Integer anoEntrega,

        String construtora,
        String administradora,
        String telefoneContato,

        @Email(message = "E-mail de contato inválido.")
        String emailContato,

        String observacoes
) {}
