/** Tipos espelhando os DTOs da API do IQC. */

export type TipoCondominio = "HORIZONTAL" | "VERTICAL" | "MISTO";
export type PapelAcesso = "AVALIADOR" | "MORADOR";
export type StatusAcesso = "PENDENTE" | "APROVADO" | "RECUSADO" | "REVOGADO";
export type VinculoMorador = "PROPRIETARIO" | "INQUILINO";
export type FaixaMoradia =
  | "MENOS_DE_6_MESES"
  | "DE_6_MESES_A_1_ANO"
  | "DE_1_A_3_ANOS"
  | "DE_3_A_5_ANOS"
  | "MAIS_DE_5_ANOS";

export interface Condominio {
  id: number;
  nome: string;
  razaoSocial?: string | null;
  cnpj?: string | null;
  tipoCondominio?: TipoCondominio | null;
  cep?: string | null;
  rua?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  qtdUnidades?: number | null;
  qtdTorres?: number | null;
  anoEntrega?: number | null;
  construtora?: string | null;
  administradora?: string | null;
  telefoneContato?: string | null;
  emailContato?: string | null;
  observacoes?: string | null;
  ativo: boolean;
  criadoPorNome?: string | null;
  dataCriacao?: string;
  dataAtualizacao?: string;
}

export interface CondominioResumo {
  id: number;
  nome: string;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  tipoCondominio?: TipoCondominio | null;
}

export interface AcessoCondominio {
  id: number;
  condominioId: number;
  condominioNome: string;
  usuarioId: number;
  usuarioNome: string;
  usuarioEmail: string;
  papel: PapelAcesso;
  status: StatusAcesso;
  unidade?: string | null;
  vinculo?: VinculoMorador | null;
  moradorDesde?: string | null;
  mesesDeMoradia?: number | null;
  opiniaoContaNoCalculo: boolean;
  comprovanteDisponivel: boolean;
  comprovanteNomeOriginal?: string | null;
  comprovanteRemovidoEm?: string | null;
  motivoRecusa?: string | null;
  analisadoPorNome?: string | null;
  dataSolicitacao?: string;
  dataAnalise?: string | null;
}

export interface PerguntaMorador {
  chave: string;
  enunciado: string;
  tipo: "ESCALA" | "FREQUENCIA";
  ancoraZero?: string | null;
  ancoraDez?: string | null;
  opcoes?: string[] | null;
  permiteNaoSeAplica: boolean;
  dimensao: string;
}

export interface CatalogoOpiniao {
  telas: { titulo: string; perguntas: PerguntaMorador[] }[];
  minimoDeOpinioes: number;
  mesesMinimosDeMoradia: number;
  pesoPercentual: number;
}

export interface OpiniaoMorador {
  id: number;
  condominioId: number;
  condominioNome: string;
  autorNome?: string | null;
  identificada: boolean;
  vinculo?: VinculoMorador | null;
  mesesDeMoradia?: number | null;
  faixaDeMoradia?: FaixaMoradia | null;
  contaNoCalculo: boolean;
  respostas: Record<string, unknown>;
  comentarioParaInteressado?: string | null;
  comentarioOQueMudaria?: string | null;
  comentariosOcultos: boolean;
  dataCriacao?: string;
  dataAtualizacao?: string;
}

// ── Rótulos para exibição ──────────────────────────────────

export const ROTULO_FAIXA: Record<FaixaMoradia, string> = {
  MENOS_DE_6_MESES: "Menos de 6 meses",
  DE_6_MESES_A_1_ANO: "De 6 meses a 1 ano",
  DE_1_A_3_ANOS: "De 1 a 3 anos",
  DE_3_A_5_ANOS: "De 3 a 5 anos",
  MAIS_DE_5_ANOS: "Mais de 5 anos",
};

export const ROTULO_STATUS: Record<StatusAcesso, string> = {
  PENDENTE: "Em análise",
  APROVADO: "Aprovado",
  RECUSADO: "Recusado",
  REVOGADO: "Revogado",
};

/** Opções de frequência do questionário, na ordem do catálogo (melhor → pior). */
export const ROTULO_FREQUENCIA: Record<string, string> = {
  NUNCA: "Nunca",
  UMA_VEZ: "1 vez",
  DUAS_A_TRES: "2 a 3 vezes",
  MAIS_DE_TRES: "Mais de 3 vezes",
  NENHUM: "Nenhum",
  UM_NO_ANO: "1 no ano",
  DOIS_A_TRES: "2 a 3",
  VARIOS: "Vários",
};
