package br.com.urbanoconnect.api.domain.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * ══════════════════════════════════════════════════════════════
 *  OPINIÃO DO MORADOR — os 10% do IQC
 * ══════════════════════════════════════════════════════════════
 *
 *  Uma por pessoa por condomínio, editável. As respostas ficam em jsonb
 *  chaveadas pela chave da pergunta (ver CatalogoOpiniaoMorador).
 *
 *  Os dois comentários são opcionais e NÃO entram no cálculo. Ficam só no
 *  laudo privado: texto livre sobre síndico e vizinho é passivo de difamação e
 *  carrega dado pessoal de terceiro, e quem responde por publicar é a
 *  plataforma. O admin pode ocultar sem apagar.
 */
@Data
@Entity
@Table(
        name = "opinioes_morador",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_opiniao_condominio_usuario",
                columnNames = {"condominio_id", "usuario_id"})
)
public class OpiniaoMorador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "condominio_id", nullable = false)
    @JsonIgnore
    private Condominio condominio;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    @JsonIgnore
    private Usuario usuario;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> respostas = new HashMap<>();

    // ── Comentários (fora do cálculo) ───────────────────────
    @Column(name = "comentario_para_interessado", columnDefinition = "TEXT")
    private String comentarioParaInteressado;

    @Column(name = "comentario_o_que_mudaria", columnDefinition = "TEXT")
    private String comentarioOQueMudaria;

    /** Moderação: esconde os comentários do laudo sem destruir o registro. */
    @Column(name = "comentarios_ocultos", nullable = false)
    private Boolean comentariosOcultos = false;

    /**
     * O morador escolhe assinar a opinião ou permanecer anônimo.
     *
     * O padrão é anônimo, e não por acaso: identificar-se tem de ser um ato
     * deliberado, porque é irreversível na prática — quem leu o nome não
     * deslê. O caminho contrário é livre; o morador pode voltar ao anonimato
     * a qualquer momento reeditando a opinião.
     *
     * O DEFAULT no columnDefinition não é decoração: com ddl-auto=update, um
     * ALTER TABLE ADD COLUMN NOT NULL falha em tabela que já tem linhas, e o
     * Hibernate desiste sem interromper o boot — a aplicação sobe e só quebra
     * na primeira consulta. Com default, a coluna nasce preenchida.
     */
    @Column(name = "identificar_autor", nullable = false,
            columnDefinition = "boolean not null default false")
    private Boolean identificarAutor = false;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "data_criacao", updatable = false)
    private LocalDateTime dataCriacao;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "data_atualizacao")
    private LocalDateTime dataAtualizacao;

    @PrePersist
    protected void prePersist() {
        if (dataCriacao == null) dataCriacao = LocalDateTime.now();
        dataAtualizacao = dataCriacao;
        if (comentariosOcultos == null) comentariosOcultos = false;
        if (identificarAutor == null) identificarAutor = false;
    }

    @PreUpdate
    protected void preUpdate() {
        dataAtualizacao = LocalDateTime.now();
    }
}
