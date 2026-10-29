"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CldUploadWidget } from "next-cloudinary";
import {
  ImagePlus,
  X,
  AlertCircle,
  Star,
  UploadCloud,
  Tractor,
  Home,
  Building2,
  Trees,
  Landmark,
  Store,
  Loader2,
  ArrowLeft,
  BarChart3,
} from "lucide-react";

// ── Tipos ─────────────────────────────────────────────────
type DadosRural = {
  tipoSolo: string;
  percentualArgila: string;
  fertilidadeSolo: string;
  nivelNutrientes: string;
  necessidadeCorrecaoSolo: string;
  areaUtil: string;
  areaReservaLegal: string;
  areaApp: string;
  areaDegradada: string;
  usoAtual: string;
  usoPotencial: string;
  coberturaVegetal: string;
  estadoConservacao: string;
  produtividadeSoja: string;
  produtividadeMilho: string;
  produtividadePastagem: string;
  aptidaoAgricola: string;
  aptidaoPecuaria: string;
  disponibilidadeAgua: boolean;
  tipoFonteAgua: string;
  volumeAgua: string;
  perenidadeAgua: boolean;
  irrigacao: boolean;
  distanciaRodovia: string;
  distanciaPorto: string;
  distanciaCentroConsumidor: string;
  qualidadeAcesso: string;
  sede: boolean;
  energiaEletrica: boolean;
  mecanizacaoViavel: boolean;
  casaFuncionarios: boolean;
  curral: boolean;
  galpao: boolean;
  matriculaRegular: boolean;
  georreferenciamento: boolean;
  car: boolean;
  ccir: boolean;
  itrRegular: boolean;
  existenciaOnus: boolean;
};

export interface FormularioImovelProps {
  dadosIniciais?: any;
  isEdit?: boolean;
  imovelId?: string | number;
}

// ── Configuração dos tipos de imóvel (Dark Mode) ──────────
const TIPOS_IMOVEL = [
  { value: "CASA", label: "Casa", icon: Home, unidade: "m²", cor: "blue" },
  {
    value: "APARTAMENTO",
    label: "Apartamento",
    icon: Building2,
    unidade: "m²",
    cor: "purple",
  },
  {
    value: "TERRENO",
    label: "Terreno",
    icon: Trees,
    unidade: "m²",
    cor: "yellow",
  },
  {
    value: "COMERCIAL",
    label: "Comercial",
    icon: Store,
    unidade: "m²",
    cor: "orange",
  },
  {
    value: "RURAL",
    label: "Rural / Fazenda",
    icon: Tractor,
    unidade: "ha",
    cor: "green",
  },
  {
    value: "URBANO",
    label: "Urbano",
    icon: Landmark,
    unidade: "m²",
    cor: "emerald",
  },
];

const COR_MAP: Record<string, string> = {
  blue: "border-blue-500/50 bg-blue-500/10 text-blue-400",
  purple: "border-purple-500/50 bg-purple-500/10 text-purple-400",
  yellow: "border-yellow-500/50 bg-yellow-500/10 text-yellow-400",
  orange: "border-orange-500/50 bg-orange-500/10 text-orange-400",
  green: "border-green-500/50 bg-green-500/10 text-green-400",
  emerald: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
};

// ── Helpers ────────────────────────────────────────────────
function formatarMoeda(valor: string): string {
  const nums = valor.replace(/\D/g, "");
  if (!nums) return "";
  const numero = parseInt(nums, 10) / 100;
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function desformatarMoeda(valor: string): string {
  return valor.replace(/\D/g, "");
}

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-1">
      {children}
      {required && <span className="text-green-500">*</span>}
    </label>
  );
}

const inputClass =
  "w-full bg-[#09090f] border border-white/10 rounded-xl p-4 text-white font-medium focus:bg-[#12121e] focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all placeholder-gray-600 disabled:opacity-50 disabled:cursor-not-allowed appearance-none";

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-sm font-bold outline-none ${
        checked
          ? "border-green-500/50 bg-green-500/10 text-green-400"
          : "border-white/10 bg-[#09090f] text-gray-500 hover:border-white/20 hover:text-gray-300"
      }`}
    >
      <span
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
          checked
            ? "border-green-400 bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
            : "border-gray-600"
        }`}
      >
        {checked && <span className="w-1.5 h-1.5 rounded-full bg-[#09090f]" />}
      </span>
      {label}
    </button>
  );
}

function Escala({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(String(n))}
            className={`flex-1 py-3 rounded-xl border text-sm font-black transition-all outline-none ${
              value === String(n)
                ? "border-green-500 bg-green-500 text-[#09090f] shadow-[0_0_15px_rgba(34,197,94,0.3)] scale-105"
                : "border-white/10 bg-[#09090f] text-gray-500 hover:border-green-500/50 hover:text-green-400"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-gray-600 font-bold uppercase tracking-widest px-1">
        <span>Ruim</span>
        <span>Excelente</span>
      </div>
    </div>
  );
}

/**
 * Resumo visual da ficha do imóvel no cadastro municipal (BCI + IPTU 2014).
 * Aparece quando o corretor puxa dados pela inscrição imobiliária.
 */
function FichaResumo({ ficha }: { ficha: any }) {
  const chip = (label: string, ok: boolean | null | undefined) => {
    if (ok == null) return null;
    return (
      <span
        key={label}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${
          ok
            ? "border-green-500/40 bg-green-500/10 text-green-300"
            : "border-white/10 bg-white/5 text-gray-500 line-through"
        }`}
      >
        {ok ? "✓" : "✗"} {label}
      </span>
    );
  };
  const dado = (rotulo: string, valor: any) => {
    if (valor == null || valor === "") return null;
    return (
      <div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{rotulo}</div>
        <div className="text-sm text-white font-semibold">{valor}</div>
      </div>
    );
  };
  return (
    <div className="mt-4 border border-green-500/20 bg-[#09090f] rounded-xl p-4 space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-xs font-black text-green-400 uppercase tracking-wider">
          Ficha oficial · Prefeitura de Tangará da Serra
        </div>
        {ficha.endereco && (
          <div className="text-xs text-gray-400">{ficha.endereco}{ficha.bairro ? ` · ${ficha.bairro}` : ""}</div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {dado("Tipo", ficha.caracterizacao)}
        {dado("Construção", ficha.tipoConstrucao)}
        {dado("Estado", ficha.estadoConservacao)}
        {dado("Cobertura", ficha.cobertura)}
        {dado("Área construída", ficha.areaConstruida != null ? `${ficha.areaConstruida} m²` : null)}
        {dado("Área terreno", ficha.areaTerreno != null ? `${ficha.areaTerreno} m²` : null)}
        {dado("Testada", ficha.testada != null ? `${ficha.testada} m` : null)}
        {dado("Pavimentos", ficha.numeroPavimentos)}
        {dado("Terreno", ficha.situacaoTerreno)}
        {dado("Topografia", ficha.topografia)}
        {dado("Posição", ficha.posicao)}
        {dado("Revestimento", ficha.revestimento)}
      </div>

      <div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
          Infraestrutura da rua
        </div>
        <div className="flex flex-wrap gap-1.5">
          {chip("Água", ficha.temAgua)}
          {chip("Esgoto", ficha.temEsgoto)}
          {chip("Iluminação", ficha.temIluminacaoPublica)}
          {chip("Calçamento", ficha.temCalcamento)}
          {chip("Galeria pluvial", ficha.temGaleriaPluvial)}
          {chip("Coleta de lixo", ficha.temColetaLixo)}
          {chip("Rede telefônica", ficha.temRedeTelefonica)}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
          Serviços e amenidades na unidade
        </div>
        <div className="flex flex-wrap gap-1.5">
          {chip("Água ligada", ficha.aguaNaUnidade)}
          {chip("Esgoto ligado", ficha.esgotoNaUnidade)}
          {chip("Poço", ficha.pocoNaUnidade)}
          {chip("Piscina", ficha.temPiscina)}
          {chip("Sauna", ficha.temSauna)}
        </div>
      </div>
    </div>
  );
}

/**
 * Lista de candidatos quando o match por bairro + número retorna mais de um imóvel.
 * O corretor escolhe qual é o certo — clique aplica os dados no formulário.
 */
function ListaCandidatos({
  candidatos,
  onSelecionar,
}: {
  candidatos: any[];
  onSelecionar: (f: any) => void;
}) {
  return (
    <div className="mt-4 border border-yellow-500/30 bg-yellow-500/5 rounded-xl p-4 space-y-2">
      <div className="text-xs font-black text-yellow-400 uppercase tracking-wider">
        {candidatos.length} imóveis com esse número — escolha o correto
      </div>
      <div className="space-y-2 mt-2">
        {candidatos.map((c) => (
          <button
            key={c.inscricao}
            type="button"
            onClick={() => onSelecionar(c)}
            className="w-full text-left border border-white/10 hover:border-yellow-500/50 hover:bg-yellow-500/5 rounded-lg p-3 transition-all"
          >
            <div className="flex flex-wrap gap-3 items-baseline">
              <span className="text-sm font-bold text-white">
                {c.endereco || "sem número"} · {c.bairro}
              </span>
              <span className="text-[10px] text-gray-500 font-mono">insc. {c.inscricao}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {c.caracterizacao || "tipo desconhecido"}
              {c.tipoConstrucao ? ` · ${c.tipoConstrucao}` : ""}
              {c.areaConstruida != null ? ` · ${c.areaConstruida} m² construídos` : ""}
              {c.areaTerreno != null ? ` · terreno ${c.areaTerreno} m²` : ""}
              {c.valorVenal != null ? ` · venal R$ ${Number(c.valorVenal).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}` : ""}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Card com o perfil médio do bairro (médias e percentuais de infraestrutura).
 * Aparece quando não achamos imóvel específico — ajuda o corretor a validar
 * preço e entender a região sem depender de dados individuais.
 */
function CardPerfilBairro({ perfil }: { perfil: any }) {
  const stat = (label: string, valor: any) => {
    if (valor == null || valor === "") return null;
    return (
      <div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</div>
        <div className="text-sm text-white font-semibold">{valor}</div>
      </div>
    );
  };
  const pct = (label: string, valor: number | null) => {
    if (valor == null) return null;
    const cor = valor >= 80 ? "text-green-400" : valor >= 40 ? "text-yellow-400" : "text-red-400";
    return (
      <div className="flex items-center justify-between border-b border-white/5 py-1.5">
        <span className="text-xs text-gray-400">{label}</span>
        <span className={`text-sm font-bold ${cor}`}>{valor}%</span>
      </div>
    );
  };
  return (
    <div className="mt-4 border border-blue-500/20 bg-blue-500/5 rounded-xl p-4 space-y-4">
      <div>
        <div className="text-xs font-black text-blue-400 uppercase tracking-wider">
          Perfil médio do bairro · {perfil.bairro}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Baseado em {perfil.totalImoveis} imóveis do cadastro municipal
          {perfil.totalComBci !== perfil.totalImoveis ? ` (${perfil.totalComBci} com dados BCI)` : ""}.
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stat(
          "Valor venal médio",
          perfil.valorVenalMedio != null
            ? `R$ ${Number(perfil.valorVenalMedio).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`
            : null,
        )}
        {stat(
          "Área construída média",
          perfil.areaConstruidaMedio != null ? `${perfil.areaConstruidaMedio} m²` : null,
        )}
        {stat(
          "Área terreno médio",
          perfil.areaTerrenoMedio != null ? `${perfil.areaTerrenoMedio} m²` : null,
        )}
      </div>
      <div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
          Cobertura de infraestrutura
        </div>
        {pct("Água encanada", perfil.percentualComAgua)}
        {pct("Esgoto", perfil.percentualComEsgoto)}
        {pct("Iluminação pública", perfil.percentualComIluminacaoPublica)}
        {pct("Calçamento", perfil.percentualComCalcamento)}
        {pct("Coleta de lixo", perfil.percentualComColetaLixo)}
        {pct("Galeria pluvial", perfil.percentualComGaleriaPluvial)}
        {pct("Rede telefônica", perfil.percentualComRedeTelefonica)}
      </div>
    </div>
  );
}

// ── Componente Principal ───────────────────────────────────
export default function FormularioImovel({
  dadosIniciais = null,
  isEdit = false,
  imovelId,
}: FormularioImovelProps) {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState({ texto: "", tipo: "" });

  const fotosIniciais = dadosIniciais?.galeria
    ? dadosIniciais.galeria
    : dadosIniciais?.imagemPrincipal
      ? [dadosIniciais.imagemPrincipal]
      : [];
  const [fotos, setFotos] = useState<string[]>(fotosIniciais);
  const [erroArea, setErroArea] = useState("");

  const [estados, setEstados] = useState<{ sigla: string; nome: string }[]>([]);
  const [cidades, setCidades] = useState<{ nome: string }[]>([]);
  const [ufSelecionada, setUfSelecionada] = useState("");
  /** Cidade que veio do CEP, aguardando a lista do IBGE para ser resolvida. */
  const [cidadeDoCep, setCidadeDoCep] = useState<string | null>(null);

  // Cloudinary widget sets body overflow:hidden when open; reset on unmount to avoid scroll lock
  useEffect(() => () => { document.body.style.overflow = ""; }, []);

  useEffect(() => {
    fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome",
    )
      .then((res) => res.json())
      .then((data) => setEstados(data));
  }, []);

  useEffect(() => {
    if (!ufSelecionada) {
      setCidades([]);
      return;
    }
    fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufSelecionada}/municipios?orderBy=nome`,
    )
      .then((res) => res.json())
      .then((data) => setCidades(data));
  }, [ufSelecionada]);

  /**
   * Casa a cidade do CEP com a lista oficial do IBGE.
   *
   * Compara sem acento e sem caixa porque o ViaCEP e o IBGE nem sempre grafam
   * igual; o nome gravado é sempre o do IBGE, que é o que o select conhece.
   * Sem isso, o valor ficaria fora das opções e o campo apareceria vazio.
   */
  useEffect(() => {
    if (!cidadeDoCep || cidades.length === 0) return;
    const chave = (t: string) =>
      t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
    const achada = cidades.find((c) => chave(c.nome) === chave(cidadeDoCep));
    setDados((prev) => ({ ...prev, cidade: achada ? achada.nome : cidadeDoCep }));
    setCidadeDoCep(null);
  }, [cidades, cidadeDoCep]);

  const precoStringInicial = dadosIniciais?.preco
    ? String((dadosIniciais.preco * 100).toFixed(0))
    : "";
  const [precoFormatado, setPrecoFormatado] = useState(
    precoStringInicial ? formatarMoeda(precoStringInicial) : "",
  );

  const [dados, setDados] = useState({
    titulo: dadosIniciais?.titulo || "",
    cidade: dadosIniciais?.cidade || "",
    bairro: dadosIniciais?.bairro || "",
    cep: dadosIniciais?.cep || "",
    logradouro: dadosIniciais?.logradouro || "",
    numero: dadosIniciais?.numero || "",
    complemento: dadosIniciais?.complemento || "",
    tipo: dadosIniciais?.tipo || "CASA",
    preco: precoStringInicial,
    areaTotal: dadosIniciais?.areaTotal ? String(dadosIniciais.areaTotal) : "",
    descricao: dadosIniciais?.descricao || "",
  });

  // ── ESTADOS DO MOTOR HEDÔNICO E ESTRUTURAIS ──
  const [quartos, setQuartos] = useState<number>(dadosIniciais?.quartos || 0);
  const [banheiros, setBanheiros] = useState<number>(
    dadosIniciais?.banheiros || 0,
  );
  const [vagasGaragem, setVagasGaragem] = useState<number>(
    dadosIniciais?.vagasGaragem || 0,
  );
  const [valorVenalCentavos, setValorVenalCentavos] = useState<number>(
    dadosIniciais?.valorVenal ? Math.round(dadosIniciais.valorVenal * 100) : 0,
  );
  const handleValorVenal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitos = e.target.value.replace(/\D/g, '');
    setValorVenalCentavos(parseInt(digitos || '0', 10));
  };
  const [distanciaCentro, setDistanciaCentro] = useState<string>(
    dadosIniciais?.distanciaCentro ? String(dadosIniciais.distanciaCentro) : "",
  );
  const [precoM2Bairro, setPrecoM2Bairro] = useState<string>(
    dadosIniciais?.precoM2Bairro ? String(dadosIniciais.precoM2Bairro) : "",
  );
  const [areaConstruida, setAreaConstruida] = useState<string>(
    dadosIniciais?.areaConstruida ? String(dadosIniciais.areaConstruida) : "",
  );

  // ── Inscrição imobiliária + busca de valor venal na base IPTU ──
  const [inscricao, setInscricao] = useState<string>(dadosIniciais?.inscricao ?? "");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [cepInfo, setCepInfo] = useState<{ ok: boolean; msg: string } | null>(null);
  const [buscandoVenal, setBuscandoVenal] = useState(false);
  const [venalInfo, setVenalInfo] = useState<{ ok: boolean; msg: string } | null>(null);

  /** Ficha do imóvel devolvida pela prefeitura (BCI + IPTU 2014), quando o corretor
   *  informa a inscrição imobiliária e o backend acha a linha correspondente. */
  type FichaImovel = {
    inscricao?: string;
    bairro?: string | null;
    endereco?: string | null;
    valorVenal?: number | null;
    aliquota?: number | null;
    areaTerreno?: number | null;
    areaConstruida?: number | null;
    testada?: number | null;
    numeroPavimentos?: number | null;
    caracterizacao?: string | null;
    tipoConstrucao?: string | null;
    estadoConservacao?: string | null;
    cobertura?: string | null;
    revestimento?: string | null;
    piso?: string | null;
    posicao?: string | null;
    instalacaoSanitaria?: string | null;
    situacaoTerreno?: string | null;
    topografia?: string | null;
    temEsgoto?: boolean | null;
    temAgua?: boolean | null;
    temIluminacaoPublica?: boolean | null;
    temCalcamento?: boolean | null;
    temGaleriaPluvial?: boolean | null;
    temColetaLixo?: boolean | null;
    temRedeTelefonica?: boolean | null;
    esgotoNaUnidade?: boolean | null;
    aguaNaUnidade?: boolean | null;
    pocoNaUnidade?: boolean | null;
    temPiscina?: boolean | null;
    temSauna?: boolean | null;
  };
  const [ficha, setFicha] = useState<FichaImovel | null>(null);

  /** Candidatos encontrados por bairro + número quando o corretor não informou inscrição.
   *  Em cidade pequena o mesmo número aparece em várias ruas — corretor escolhe. */
  const [candidatos, setCandidatos] = useState<FichaImovel[] | null>(null);

  /** Perfil agregado do bairro (médias e percentuais de infraestrutura). Aparece
   *  como fallback quando não achamos imóvel específico. */
  type PerfilBairro = {
    cidade: string;
    bairro: string;
    totalImoveis: number;
    totalComBci: number;
    valorVenalMedio: number | null;
    areaTerrenoMedio: number | null;
    areaConstruidaMedio: number | null;
    percentualComAgua: number | null;
    percentualComEsgoto: number | null;
    percentualComCalcamento: number | null;
    percentualComColetaLixo: number | null;
    percentualComIluminacaoPublica: number | null;
    percentualComGaleriaPluvial: number | null;
    percentualComRedeTelefonica: number | null;
    percentualComPiscina: number | null;
  };
  const [perfilBairro, setPerfilBairro] = useState<PerfilBairro | null>(null);

  /** 00000-000 enquanto digita; guarda só os 8 dígitos para consultar. */
  const mascararCep = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  };

  /**
   * Barra qualquer caractere que nao seja digito ANTES de ele entrar no campo.
   *
   * Rejeitar depois nao funciona: quando o texto limpo coincide com o que ja
   * esta no estado, o React nao re-renderiza e o caractere recusado fica na
   * tela. Colagem com pontuacao ainda passa — os digitos sao extraidos dela.
   */
  const aoInserirNoCep = (e: React.FormEvent<HTMLInputElement>) => {
    const texto = (e.nativeEvent as InputEvent).data ?? "";
    if (!texto) return;                       // apagar, mover cursor: segue
    const digitos = texto.replace(/\D/g, "");
    if (digitos === texto) return;            // so digitos: deixa passar

    e.preventDefault();
    if (!digitos) return;                     // era so pontuacao: ignora

    const el = e.currentTarget;
    const ini = el.selectionStart ?? el.value.length;
    const fim = el.selectionEnd ?? ini;
    const m = mascararCep(el.value.slice(0, ini) + digitos + el.value.slice(fim));
    el.value = m;
    setDados((p) => ({ ...p, cep: m }));
    if (m.replace(/\D/g, "").length === 8) buscarCep(m);
  };

  /**
   * Consulta o ViaCEP e preenche rua e bairro.
   *
   * Os campos continuam editáveis de propósito: em cidade pequena o CEP
   * genérico cobre várias ruas e às vezes traz a errada. E a cidade só é
   * sobrescrita se vier vazia — quem já escolheu UF e município não deve
   * ver a seleção mudar sozinha.
   */
  /**
   * Trata a digitação do CEP.
   *
   * Duas armadilhas de campo mascarado, as duas sentidas na prática:
   *
   * 1. Quando o texto limpo é IGUAL ao que já está no estado — digitar "-"
   *    com 5 dígitos devolve "78301", que era o valor anterior —, o React não
   *    re-renderiza e o DOM fica exibindo o caractere recusado. Traço após
   *    traço o campo enche de "-" que o backspace não apaga, porque o estado
   *    nunca mudou. Daí o valor do elemento ser escrito à mão aqui.
   *
   * 2. Reescrever o valor joga o cursor para o fim. Guardo quantos DÍGITOS
   *    havia antes do cursor e o reposiciono depois do mesmo dígito, para que
   *    corrigir o meio do CEP funcione como em qualquer campo.
   */
  const aoDigitarCep = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target;
    const ateOCursor = el.value.slice(0, el.selectionStart ?? el.value.length);
    const digitosAntes = ateOCursor.replace(/\D/g, "").length;

    const m = mascararCep(el.value);
    el.value = m;
    setDados((p) => ({ ...p, cep: m }));

    let pos = 0;
    for (let vistos = 0; pos < m.length && vistos < digitosAntes; pos++) {
      if (/\d/.test(m[pos])) vistos++;
    }
    el.setSelectionRange(pos, pos);

    if (m.replace(/\D/g, "").length === 8) buscarCep(m);
  };

  const buscarCep = async (cepMascarado: string) => {
    const digitos = cepMascarado.replace(/\D/g, "");
    if (digitos.length !== 8) { setCepInfo(null); return; }

    setBuscandoCep(true);
    setCepInfo(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
      const d = await res.json();
      if (d.erro) {
        setCepInfo({ ok: false, msg: "CEP não encontrado. Preencha o endereço à mão." });
        return;
      }
      setDados((prev) => ({
        ...prev,
        logradouro: d.logradouro || prev.logradouro,
        bairro: d.bairro || prev.bairro,
      }));

      // A cidade é um select em cascata com a UF: primeiro troca o estado, o
      // que dispara o carregamento dos municípios no IBGE, e só depois dá para
      // selecionar. O nome fica pendente até a lista chegar.
      if (d.uf) setUfSelecionada(d.uf);
      if (d.localidade) setCidadeDoCep(d.localidade);
      const achou = [d.logradouro, d.bairro].filter(Boolean).join(", ");
      setCepInfo({
        ok: true,
        msg: achou ? `${achou} — confira e ajuste se precisar.`
                   : "CEP válido, mas sem rua cadastrada. Preencha à mão.",
      });
    } catch {
      setCepInfo({ ok: false, msg: "Não foi possível consultar o CEP agora." });
    } finally {
      setBuscandoCep(false);
    }
  };

  /**
   * Aplica uma ficha ao formulário: preenche valor venal (sempre) e áreas
   * (só quando vazias, pra não sobrescrever o que o corretor já digitou).
   * Usado tanto por /ficha quanto quando o corretor escolhe um candidato.
   */
  const aplicaFicha = (f: FichaImovel) => {
    setFicha(f);
    setCandidatos(null);
    if (f.valorVenal != null) setValorVenalCentavos(Math.round(Number(f.valorVenal) * 100));
    if (f.areaTerreno != null && !dados.areaTotal) {
      setDados((p) => ({ ...p, areaTotal: String(f.areaTerreno) }));
    }
    if (f.areaConstruida != null && !areaConstruida) {
      setAreaConstruida(String(f.areaConstruida));
    }
  };

  /**
   * Cascata da consulta ao cadastro municipal (do mais específico ao mais geral):
   *   1. Se tem inscrição → /ficha (traz tudo do imóvel exato)
   *   2. Se tem bairro + número → /buscar (candidatos por match textual)
   *      - 1 candidato → aplica automaticamente
   *      - N candidatos → mostra lista pra corretor escolher
   *      - 0 candidatos → cai no perfil do bairro
   *   3. Se tem só bairro → /perfil-bairro (médias e infraestrutura da região)
   *   4. Nada disso → /venal (estimativa PGV antiga)
   */
  const buscarVenal = async () => {
    setBuscandoVenal(true);
    setVenalInfo(null);
    setFicha(null);
    setCandidatos(null);
    setPerfilBairro(null);
    const tk = localStorage.getItem("token") ?? "";
    const base = process.env.NEXT_PUBLIC_API_URL;
    const auth = { Authorization: `Bearer ${tk}` };
    const cidade = dados.cidade?.trim() || "Tangará da Serra";
    const bairro = dados.bairro?.trim() ?? "";
    const numero = dados.numero?.trim() ?? "";
    const logradouro = dados.logradouro?.trim() ?? "";
    try {
      // 1. Ficha por inscrição — caminho mais preciso.
      if (inscricao.trim()) {
        const url = `${base}/cadastro-iptu/ficha/${encodeURIComponent(inscricao.trim())}?cidade=${encodeURIComponent(cidade)}`;
        const res = await fetch(url, { headers: auth });
        if (res.ok) {
          aplicaFicha(await res.json());
          setVenalInfo({ ok: true, msg: "Ficha do cadastro municipal encontrada pela inscrição." });
          return;
        }
        if (res.status !== 404) {
          setVenalInfo({ ok: false, msg: "Não foi possível consultar a ficha." });
          return;
        }
        setVenalInfo({ ok: false, msg: "Inscrição não encontrada. Tentando pelo endereço…" });
      }

      // 1.5. Correspondência orgânica: outro corretor já cadastrou imóvel
      //      neste endereço COM inscrição — usamos a inscrição para trazer a
      //      ficha exata, sem passar pelo match textual (que erra).
      if (logradouro && numero) {
        const url = `${base}/cadastro-iptu/por-endereco?cidade=${encodeURIComponent(cidade)}&logradouro=${encodeURIComponent(logradouro)}&numero=${encodeURIComponent(numero)}`;
        const res = await fetch(url, { headers: auth });
        if (res.ok) {
          aplicaFicha(await res.json());
          setVenalInfo({
            ok: true,
            msg: "Ficha encontrada — endereço já mapeado por outro cadastro.",
          });
          return;
        }
        // 404: nenhum cadastro anterior neste endereço. Segue pra /buscar.
      }

      // 2. Match por bairro + número.
      if (bairro && numero) {
        const url = `${base}/cadastro-iptu/buscar?cidade=${encodeURIComponent(cidade)}&bairro=${encodeURIComponent(bairro)}&numero=${encodeURIComponent(numero)}`;
        const res = await fetch(url, { headers: auth });
        if (res.ok) {
          const lista: FichaImovel[] = await res.json();
          if (lista.length === 1) {
            aplicaFicha(lista[0]);
            setVenalInfo({ ok: true, msg: "Único imóvel encontrado neste bairro + número — dados aplicados." });
            return;
          }
          if (lista.length > 1) {
            setCandidatos(lista);
            setVenalInfo({ ok: true, msg: `Encontramos ${lista.length} imóveis com este número. Escolha o correto abaixo.` });
            return;
          }
          // 0 candidatos — segue para perfil do bairro.
        }
      }

      // 3. Perfil do bairro.
      if (bairro) {
        const url = `${base}/cadastro-iptu/perfil-bairro?cidade=${encodeURIComponent(cidade)}&bairro=${encodeURIComponent(bairro)}`;
        const res = await fetch(url, { headers: auth });
        if (res.ok) {
          const p: PerfilBairro = await res.json();
          setPerfilBairro(p);
          if (p.valorVenalMedio != null) {
            setValorVenalCentavos(Math.round(p.valorVenalMedio * 100));
          }
          setVenalInfo({
            ok: true,
            msg: `Sem imóvel específico. Aplicamos o venal médio do bairro (${p.totalImoveis} imóveis).`,
          });
          return;
        }
      }

      // 4. Fallback antigo: /venal com PGV.
      const params = new URLSearchParams();
      if (inscricao.trim()) params.set("inscricao", inscricao.trim());
      if (bairro) params.set("bairro", bairro);
      params.set("cidade", cidade);
      if (dados.areaTotal) params.set("areaTerreno", dados.areaTotal);
      if (areaConstruida) params.set("areaConstruida", areaConstruida);
      params.set("padrao", String(padraoCalculado));
      const res = await fetch(`${base}/cadastro-iptu/venal?${params}`, { headers: auth });
      const d = await res.json();
      if (res.ok && d.encontrado && d.valorVenal != null) {
        setValorVenalCentavos(Math.round(Number(d.valorVenal) * 100));
        setVenalInfo({ ok: true, msg: d.mensagem ?? "Valor venal preenchido." });
      } else {
        setVenalInfo({ ok: false, msg: d.mensagem ?? "Nenhum dado encontrado no cadastro municipal." });
      }
    } catch {
      setVenalInfo({ ok: false, msg: "Erro ao consultar a base IPTU." });
    } finally {
      setBuscandoVenal(false);
    }
  };

  // ── ESTADOS DAS CALCULADORAS (Qualitativas) ──
  const [piso, setPiso] = useState<number>(1);
  const [teto, setTeto] = useState<number>(1);
  const [esquadrias, setEsquadrias] = useState<number>(1);
  const [bancadas, setBancadas] = useState<number>(1);
  const [padraoCalculado, setPadraoCalculado] = useState<number>(1);

  const [proximidadeRodovia, setProximidadeRodovia] = useState<number>(1);
  const [crescimentoBairro, setCrescimentoBairro] = useState<number>(1);
  const [novosLoteamentos, setNovosLoteamentos] = useState<number>(1);
  const [sprawlCalculado, setSprawlCalculado] = useState<number>(1.0);

  // Calcula Padrão e Sprawl em tempo real na raiz do componente (Regra dos Hooks OK)
  useEffect(() => {
    const mediaPadrao =
      (Number(piso) + Number(teto) + Number(esquadrias) + Number(bancadas)) / 4;
    setPadraoCalculado(Math.round(mediaPadrao));

    const mediaSprawl =
      (Number(proximidadeRodovia) +
        Number(crescimentoBairro) +
        Number(novosLoteamentos)) /
      3;
    setSprawlCalculado(Number(mediaSprawl.toFixed(1)));
  }, [
    piso,
    teto,
    esquadrias,
    bancadas,
    proximidadeRodovia,
    crescimentoBairro,
    novosLoteamentos,
  ]);

  // ── ESTADOS RURAIS ──
  const r = dadosIniciais?.rural || {};
  const [rural, setRural] = useState<DadosRural>({
    tipoSolo: r.tipoSolo || "",
    percentualArgila: r.percentualArgila ? String(r.percentualArgila) : "",
    fertilidadeSolo: r.fertilidadeSolo ? String(r.fertilidadeSolo) : "",
    nivelNutrientes: r.nivelNutrientes ? String(r.nivelNutrientes) : "",
    necessidadeCorrecaoSolo: r.necessidadeCorrecaoSolo
      ? String(r.necessidadeCorrecaoSolo)
      : "",
    areaUtil: r.areaUtil ? String(r.areaUtil) : "",
    areaReservaLegal: r.areaReservaLegal ? String(r.areaReservaLegal) : "",
    areaApp: r.areaApp ? String(r.areaApp) : "",
    areaDegradada: r.areaDegradada ? String(r.areaDegradada) : "",
    usoAtual: r.usoAtual || "",
    usoPotencial: r.usoPotencial || "",
    coberturaVegetal: r.coberturaVegetal || "",
    estadoConservacao: r.estadoConservacao ? String(r.estadoConservacao) : "",
    produtividadeSoja: r.produtividadeSoja ? String(r.produtividadeSoja) : "",
    produtividadeMilho: r.produtividadeMilho
      ? String(r.produtividadeMilho)
      : "",
    produtividadePastagem: r.produtividadePastagem
      ? String(r.produtividadePastagem)
      : "",
    aptidaoAgricola: r.aptidaoAgricola ? String(r.aptidaoAgricola) : "",
    aptidaoPecuaria: r.aptidaoPecuaria ? String(r.aptidaoPecuaria) : "",
    disponibilidadeAgua: !!r.disponibilidadeAgua,
    tipoFonteAgua: r.tipoFonteAgua || "",
    volumeAgua: r.volumeAgua ? String(r.volumeAgua) : "",
    perenidadeAgua: !!r.perenidadeAgua,
    irrigacao: !!r.irrigacao,
    distanciaRodovia: r.distanciaRodovia ? String(r.distanciaRodovia) : "",
    distanciaPorto: r.distanciaPorto ? String(r.distanciaPorto) : "",
    distanciaCentroConsumidor: r.distanciaCentroConsumidor
      ? String(r.distanciaCentroConsumidor)
      : "",
    qualidadeAcesso: r.qualidadeAcesso ? String(r.qualidadeAcesso) : "",
    sede: !!r.sede,
    energiaEletrica: !!r.energiaEletrica,
    mecanizacaoViavel: !!r.mecanizacaoViavel,
    casaFuncionarios: !!r.casaFuncionarios,
    curral: !!r.curral,
    galpao: !!r.galpao,
    matriculaRegular: !!r.matriculaRegular,
    georreferenciamento: !!r.georreferenciamento,
    car: !!r.car,
    ccir: !!r.ccir,
    itrRegular: !!r.itrRegular,
    existenciaOnus: !!r.existenciaOnus,
  });

  const tipoConfig =
    TIPOS_IMOVEL.find((t) => t.value === dados.tipo) || TIPOS_IMOVEL[0];
  const isRural = dados.tipo === "RURAL";

  const handleTipo = (tipo: string) => {
    setDados((prev) => ({ ...prev, tipo, areaTotal: "" }));
    setErroArea("");
  };

  const handlePreco = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = desformatarMoeda(e.target.value);
    setPrecoFormatado(formatarMoeda(raw));
    setDados((prev) => ({ ...prev, preco: raw }));
  };

  const handleArea = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDados((prev) => ({ ...prev, areaTotal: val }));

    if (
      isRural &&
      rural.areaUtil &&
      parseFloat(rural.areaUtil) > parseFloat(val)
    ) {
      setErroArea("Área útil não pode ser maior que a área total.");
    } else {
      setErroArea("");
    }
  };

  const handleAreaUtil = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRural((prev) => ({ ...prev, areaUtil: val }));
    if (dados.areaTotal && parseFloat(val) > parseFloat(dados.areaTotal)) {
      setErroArea("Área útil não pode ser maior que a área total.");
    } else {
      setErroArea("");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setDados((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRuralChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setRural((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUploadSuccess = (result: any) => {
    setFotos((prev) => [...prev, result.info.secure_url]);
  };

  // Reordena a galeria para colocar a foto escolhida como capa (índice 0)
  const definirComoCapa = (url: string) => {
    setFotos((prev) => [url, ...prev.filter((f) => f !== url)]);
  };

  // ── SUBMIT PRINCIPAL ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (fotos.length === 0) {
      setMensagem({
        texto: "Adicione pelo menos 1 foto do imóvel.",
        tipo: "erro",
      });
      return;
    }

    const precoNumerico = parseFloat(dados.preco) / 100;
    if (precoNumerico < 1000) {
      setMensagem({ texto: "O preço mínimo é R$ 1.000,00.", tipo: "erro" });
      return;
    }

    if (erroArea) {
      setMensagem({ texto: erroArea, tipo: "erro" });
      return;
    }

    setSalvando(true);
    setMensagem({ texto: "", tipo: "" });
    const token = localStorage.getItem("token");

    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const urlPrincipal = isEdit
      ? `${baseUrl}/imoveis/${imovelId}`
      : `${baseUrl}/imoveis`;
    const metodoPrincipal = isEdit ? "PUT" : "POST";

    try {
      // 1. Salva os dados Principais do Imóvel
      const res = await fetch(urlPrincipal, {
        method: metodoPrincipal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...dados,
          preco: precoNumerico,
          areaTotal: parseFloat(dados.areaTotal),
          areaConstruida: areaConstruida ? parseFloat(areaConstruida) : null,
          imagemPrincipal: fotos[0],
          galeria: fotos,
          ativo: true,
          // Novos Campos do Motor
          quartos: Number(quartos),
          banheiros: Number(banheiros),
          vagasGaragem: Number(vagasGaragem),
          inscricao: inscricao.trim() || null,
          valorVenal: valorVenalCentavos > 0 ? valorVenalCentavos / 100 : null,
          distanciaCentro: distanciaCentro ? parseFloat(distanciaCentro) : null,
          precoM2Bairro: precoM2Bairro ? parseFloat(precoM2Bairro) : null,
        }),
      });

      if (!res.ok) {
        setMensagem({
          texto: `Erro ao ${isEdit ? "atualizar" : "cadastrar"} imóvel no servidor.`,
          tipo: "erro",
        });
        setSalvando(false);
        return;
      }

      const imovelRetornado = await res.json();
      const idParaSubmissao = isEdit ? imovelId : imovelRetornado.id;

      // 2. Chama a Precificação Inteligente
      try {
        await fetch(`${baseUrl}/imoveis/${idParaSubmissao}/precificar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            piso: Number(piso),
            teto: Number(teto),
            esquadrias: Number(esquadrias),
            bancadas: Number(bancadas),
            proximidadeRodovia: Number(proximidadeRodovia),
            crescimentoBairro: Number(crescimentoBairro),
            novosLoteamentos: Number(novosLoteamentos),
          }),
        });
      } catch (precError) {
        console.error("Erro na precificação:", precError);
        // Não quebramos a execução, pois o imóvel em si já foi salvo.
      }

      // 3. Salva os dados Rurais (Se aplicável)
      if (isRural && idParaSubmissao) {
        const ruralPayload = {
          ...rural,
          percentualArgila: rural.percentualArgila
            ? parseFloat(rural.percentualArgila)
            : null,
          fertilidadeSolo: rural.fertilidadeSolo
            ? parseFloat(rural.fertilidadeSolo)
            : null,
          nivelNutrientes: rural.nivelNutrientes
            ? parseFloat(rural.nivelNutrientes)
            : null,
          necessidadeCorrecaoSolo: rural.necessidadeCorrecaoSolo
            ? parseFloat(rural.necessidadeCorrecaoSolo)
            : null,
          areaUtil: rural.areaUtil ? parseFloat(rural.areaUtil) : null,
          areaReservaLegal: rural.areaReservaLegal
            ? parseFloat(rural.areaReservaLegal)
            : null,
          areaApp: rural.areaApp ? parseFloat(rural.areaApp) : null,
          areaDegradada: rural.areaDegradada
            ? parseFloat(rural.areaDegradada)
            : null,
          estadoConservacao: rural.estadoConservacao
            ? parseInt(rural.estadoConservacao)
            : null,
          produtividadeSoja: rural.produtividadeSoja
            ? parseFloat(rural.produtividadeSoja)
            : null,
          produtividadeMilho: rural.produtividadeMilho
            ? parseFloat(rural.produtividadeMilho)
            : null,
          produtividadePastagem: rural.produtividadePastagem
            ? parseFloat(rural.produtividadePastagem)
            : null,
          aptidaoAgricola: rural.aptidaoAgricola
            ? parseInt(rural.aptidaoAgricola)
            : null,
          aptidaoPecuaria: rural.aptidaoPecuaria
            ? parseInt(rural.aptidaoPecuaria)
            : null,
          volumeAgua: rural.volumeAgua ? parseFloat(rural.volumeAgua) : null,
          distanciaRodovia: rural.distanciaRodovia
            ? parseFloat(rural.distanciaRodovia)
            : null,
          distanciaPorto: rural.distanciaPorto
            ? parseFloat(rural.distanciaPorto)
            : null,
          distanciaCentroConsumidor: rural.distanciaCentroConsumidor
            ? parseFloat(rural.distanciaCentroConsumidor)
            : null,
          qualidadeAcesso: rural.qualidadeAcesso
            ? parseInt(rural.qualidadeAcesso)
            : null,
        };

        const resRural = await fetch(
          `${baseUrl}/imoveis/${idParaSubmissao}/rural`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(ruralPayload),
          },
        );

        if (!resRural.ok) {
          throw new Error("Erro ao salvar laudo rural");
        }
      }

      setMensagem({
        texto: `Imóvel ${isEdit ? "atualizado" : "cadastrado"} com sucesso! Redirecionando...`,
        tipo: "sucesso",
      });
      setTimeout(() => router.push("/admin/imoveis"), 2000);
    } catch (error) {
      setMensagem({ texto: "Erro de conexão com o servidor.", tipo: "erro" });
      setSalvando(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pt-10 pb-20 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans relative">
      <div className="absolute top-0 right-[-10%] w-96 h-96 bg-green-500/10 rounded-full filter blur-[100px] pointer-events-none"></div>

      <div className="mb-8 relative z-10">
        <Link
          href="/admin/imoveis"
          className="text-sm font-bold text-gray-500 hover:text-green-400 transition-colors flex items-center gap-2 mb-2 outline-none"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Meus Imóveis
        </Link>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
          {isEdit ? `Editar Anúncio #${imovelId}` : "Cadastrar Novo Imóvel"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
        {/* ── TIPO DO IMÓVEL ────────────── */}
        <div className="bg-[#12121e]/80 backdrop-blur-md rounded-[2rem] shadow-xl border border-white/5 p-8 space-y-4">
          <h2 className="text-lg font-black text-white border-b border-white/10 pb-4">
            Qual tipo de imóvel você está anunciando?
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
            {TIPOS_IMOVEL.map(({ value, label, icon: Icon, cor }) => {
              const selecionado = dados.tipo === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleTipo(value)}
                  className={`flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all font-bold text-sm outline-none ${selecionado ? `${COR_MAP[cor]} shadow-[0_0_20px_rgba(34,197,94,0.1)] scale-105` : "border-white/5 bg-[#09090f] text-gray-500 hover:border-white/20 hover:text-gray-300"}`}
                >
                  <Icon
                    className={`w-7 h-7 ${selecionado ? "" : "opacity-60"}`}
                  />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── INFORMAÇÕES PRINCIPAIS ────────────────────── */}
        <div className="bg-[#12121e]/80 backdrop-blur-md rounded-[2rem] shadow-xl border border-white/5 p-8 space-y-6">
          <h2 className="text-lg font-black text-white border-b border-white/10 pb-4">
            Informações Principais
          </h2>

          <div className="space-y-2">
            <Label required>
              {isRural ? "Nome da Propriedade / Fazenda" : "Título do Anúncio"}
            </Label>
            <input
              required
              type="text"
              name="titulo"
              value={dados.titulo}
              onChange={handleChange}
              placeholder={
                isRural
                  ? "Ex: Fazenda São João — 320ha em Cáceres"
                  : "Ex: Casa com 3 quartos no Jardim Florisa"
              }
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <Label required>Preço</Label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={precoFormatado}
                onChange={handlePreco}
                placeholder="R$ 0,00"
                required
                className={`${inputClass} pl-4 text-lg font-black text-green-400`}
              />
            </div>
            {dados.preco && parseFloat(dados.preco) / 100 < 1000 && (
              <p className="text-xs text-red-400 font-medium mt-1">
                Valor mínimo: R$ 1.000,00
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label required>Área Total</Label>
            <div className="flex gap-3">
              <input
                required
                type="number"
                step="0.1"
                value={dados.areaTotal}
                onChange={handleArea}
                placeholder={isRural ? "Ex: 320" : "Ex: 150"}
                className={`${inputClass} flex-1`}
              />
              <div
                className={`px-5 py-4 rounded-xl border font-black text-sm flex items-center shadow-inner ${isRural ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-blue-500/30 bg-blue-500/10 text-blue-400"}`}
              >
                {tipoConfig.unidade}
              </div>
            </div>
            {erroArea && (
              <p className="text-xs text-red-400 font-medium mt-1">
                {erroArea}
              </p>
            )}
          </div>

          {!isRural && dados.tipo !== "TERRENO" && (
            <div className="space-y-2">
              <Label>Área Construída</Label>
              <div className="flex gap-3">
                <input
                  type="number"
                  step="0.1"
                  value={areaConstruida}
                  onChange={(e) => setAreaConstruida(e.target.value)}
                  placeholder="Ex: 120"
                  className={`${inputClass} flex-1`}
                />
                <div className="px-5 py-4 rounded-xl border font-black text-sm flex items-center shadow-inner border-blue-500/30 bg-blue-500/10 text-blue-400">
                  m²
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Área edificada da casa/imóvel. Entra na estimativa de valor venal
                (terreno + construção).
              </p>
            </div>
          )}

          {/* ── CEP primeiro: é ele que preenche estado, cidade, rua e bairro ── */}
          {!isRural && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
              <div className="space-y-2">
                <Label>CEP</Label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={dados.cep}
                    onBeforeInput={aoInserirNoCep}
                    onChange={aoDigitarCep}
                    placeholder="00000-000"
                    maxLength={9}
                    className={inputClass}
                    autoFocus={!dadosIniciais}
                  />
                  {buscandoCep && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-green-400 font-bold">
                      buscando…
                    </span>
                  )}
                </div>
              </div>

              <div className="md:col-span-3 md:pt-9">
                {cepInfo && (
                  <p className={`text-xs font-semibold ${cepInfo.ok ? "text-green-400" : "text-yellow-400"}`}>
                    {cepInfo.msg}
                  </p>
                )}
              </div>
            </div>
          )}

          <div
            className={`grid gap-6 ${isRural ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3"}`}
          >
            <div className="space-y-2">
              <Label required>Estado (UF)</Label>
              <select
                required
                value={ufSelecionada}
                onChange={(e) => {
                  setUfSelecionada(e.target.value);
                  setDados((prev) => ({ ...prev, cidade: "" }));
                }}
                className={inputClass}
              >
                <option value="" className="bg-[#12121e] text-gray-400">
                  Selecione...
                </option>
                {estados.map((est) => (
                  <option
                    key={est.sigla}
                    value={est.sigla}
                    className="bg-[#12121e] text-white"
                  >
                    {est.nome} ({est.sigla})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label required>Cidade / Município</Label>
              <select
                required
                name="cidade"
                value={dados.cidade}
                onChange={handleChange}
                disabled={!ufSelecionada || cidades.length === 0}
                className={`${inputClass}`}
              >
                <option value="" className="bg-[#12121e] text-gray-400">
                  {cidades.length > 0
                    ? "Selecione a cidade..."
                    : "Aguardando estado..."}
                </option>
                {cidades.map((cid) => (
                  <option
                    key={cid.nome}
                    value={cid.nome}
                    className="bg-[#12121e] text-white"
                  >
                    {cid.nome}
                  </option>
                ))}
              </select>
            </div>

            {!isRural && (
              <div className="space-y-2">
                <Label>Bairro</Label>
                <input
                  type="text"
                  name="bairro"
                  value={dados.bairro}
                  onChange={handleChange}
                  placeholder="Ex: Jardim das Américas"
                  className={inputClass}
                />
              </div>
            )}
          </div>

          {/* ── Rua e número: o CEP já trouxe a rua, o número é digitado ── */}
          {!isRural && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Logradouro</Label>
                <input
                  type="text"
                  name="logradouro"
                  value={dados.logradouro}
                  onChange={handleChange}
                  placeholder="Rua, avenida, travessa…"
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <Label>Número</Label>
                <input
                  type="text"
                  name="numero"
                  value={dados.numero}
                  onChange={handleChange}
                  placeholder="Ex: 1447-W"
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <Label>Complemento</Label>
                <input
                  type="text"
                  name="complemento"
                  value={dados.complemento}
                  onChange={handleChange}
                  placeholder="Apto, quadra, lote…"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Helper: puxar dados da base IPTU/BCI logo depois do endereço,
              onde o corretor acabou de digitar CEP + rua + número. */}
          {!isRural && (dados.cidade || "").toLowerCase().includes("tangar") && (
            <div className="border border-green-500/20 bg-green-500/5 rounded-xl p-4">
              <Label>Puxar dados da base IPTU (Tangará da Serra)</Label>
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <input
                  type="text"
                  value={inscricao}
                  onChange={(e) => setInscricao(e.target.value)}
                  placeholder="Inscrição imobiliária — está no carnê do IPTU (opcional)"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={buscarVenal}
                  disabled={buscandoVenal || (!inscricao.trim() && !dados.bairro?.trim())}
                  className="shrink-0 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-xl transition-all text-sm outline-none"
                >
                  {buscandoVenal ? "Buscando..." : "Puxar dados"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                {inscricao.trim()
                  ? "Buscamos a ficha exata pela inscrição. Se não achar, cai automaticamente para o endereço."
                  : dados.bairro?.trim() && dados.numero?.trim()
                    ? "Buscamos os imóveis com este bairro + número. Se aparecer mais de um, você escolhe. Se não achar nenhum, mostramos o perfil médio do bairro."
                    : dados.bairro?.trim()
                      ? "Sem número, mostramos o perfil médio do bairro. Preencha o número acima para tentar o imóvel específico."
                      : "Preencha o CEP + rua + número para buscar por endereço, ou informe a inscrição imobiliária (no carnê do IPTU) para trazer a ficha exata."}
              </p>
              {venalInfo && (
                <p className={`text-xs font-semibold mt-1.5 ${venalInfo.ok ? "text-green-400" : "text-yellow-400"}`}>
                  {venalInfo.msg}
                </p>
              )}

              {/* Ficha do imóvel específico (via inscrição ou candidato único) */}
              {ficha && <FichaResumo ficha={ficha} />}

              {/* Lista de candidatos quando bairro+número casou com mais de um imóvel */}
              {candidatos && candidatos.length > 0 && (
                <ListaCandidatos candidatos={candidatos} onSelecionar={aplicaFicha} />
              )}

              {/* Perfil médio do bairro (fallback quando não achamos imóvel específico) */}
              {perfilBairro && <CardPerfilBairro perfil={perfilBairro} />}
            </div>
          )}

          {isRural && (
            <div className="space-y-2">
              <Label>Localidade / Referência</Label>
              <input
                type="text"
                name="bairro"
                value={dados.bairro}
                onChange={handleChange}
                placeholder="Ex: Estrada MT-060, km 12 — Zona Rural Norte"
                className={inputClass}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label required>Descrição Detalhada</Label>
            <textarea
              required
              name="descricao"
              value={dados.descricao}
              onChange={handleChange}
              rows={5}
              placeholder={
                isRural
                  ? "Descreva a fazenda: histórico de produção, estrutura, diferenciais..."
                  : "Descreva os diferenciais do imóvel..."
              }
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        {/* ── SESSÃO: DADOS ESTRUTURAIS & MOTOR HEDÔNICO ── */}
        <div className="bg-[#12121e]/80 backdrop-blur-md rounded-[2rem] shadow-xl border border-white/5 p-8 space-y-6">
          <h2 className="text-xl font-bold text-green-400 flex items-center gap-2 border-b border-white/10 pb-4">
            <BarChart3 className="w-6 h-6 text-green-400" /> Inteligência de
            Mercado & Estrutura
          </h2>
          {/* Básicos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <Label>Quartos</Label>
              <input
                type="number"
                value={quartos}
                onChange={(e) => setQuartos(Number(e.target.value))}
                className={`${inputClass} mt-2`}
              />
            </div>
            <div>
              <Label>Banheiros</Label>
              <input
                type="number"
                value={banheiros}
                onChange={(e) => setBanheiros(Number(e.target.value))}
                className={`${inputClass} mt-2`}
              />
            </div>
            <div>
              <Label>Vagas Garagem</Label>
              <input
                type="number"
                value={vagasGaragem}
                onChange={(e) => setVagasGaragem(Number(e.target.value))}
                className={`${inputClass} mt-2`}
              />
            </div>
            <div>
              <Label>Valor Venal IPTU (R$)</Label>
              <input
                type="text"
                inputMode="numeric"
                value={valorVenalCentavos > 0 ? formatarMoeda(String(valorVenalCentavos)) : ""}
                onChange={handleValorVenal}
                placeholder="R$ 0,00"
                className={`${inputClass} mt-2`}
              />
            </div>
          </div>

          {/* Espaciais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-white/10 pb-6">
            <div>
              <Label>Distância do Centro (km)</Label>
              <input
                type="number"
                step="0.1"
                value={distanciaCentro}
                onChange={(e) => setDistanciaCentro(e.target.value)}
                placeholder="Ex: 5.5"
                className={`${inputClass} mt-2`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 mt-2 md:mt-0">
                <Label>Preço Médio do Bairro (R$/m²)</Label>
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest border border-gray-700 px-2 py-0.5 rounded">
                  Opcional
                </span>
              </div>
              <input
                type="number"
                value={precoM2Bairro}
                onChange={(e) => setPrecoM2Bairro(e.target.value)}
                placeholder="Se vazio, a IA calcula sozinha"
                className={`${inputClass} mt-0`}
              />
            </div>
          </div>{" "}
          {/* <--- O ERRO ESTAVA AQUI! Essa div estava faltando no seu código */}
          {/* CALCULADORA DE ACABAMENTO */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                Calculadora de Acabamento
              </h3>
              <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Score:{" "}
                {padraoCalculado === 0
                  ? "Baixo"
                  : padraoCalculado === 1
                    ? "Médio"
                    : padraoCalculado === 2
                      ? "Alto"
                      : "Luxo"}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={piso}
                onChange={(e) => setPiso(Number(e.target.value))}
                className={inputClass}
              >
                <option value={0}>Piso: Cerâmica Comum / Contrapiso</option>
                <option value={1}>
                  Piso: Porcelanato Comercial / Laminado
                </option>
                <option value={2}>
                  Piso: Porcelanato Grandes Formatos / Vinílico
                </option>
                <option value={3}>Piso: Mármore / Madeira Maciça</option>
              </select>
              <select
                value={teto}
                onChange={(e) => setTeto(Number(e.target.value))}
                className={inputClass}
              >
                <option value={0}>Teto: Laje / Pintura Padrão</option>
                <option value={1}>Teto: Rebaixamento em Gesso Simples</option>
                <option value={2}>Teto: Gesso com Projeto Luminotécnico</option>
                <option value={3}>Teto: Acústico / Automação</option>
              </select>
              <select
                value={esquadrias}
                onChange={(e) => setEsquadrias(Number(e.target.value))}
                className={inputClass}
              >
                <option value={0}>Janelas: Ferro / Alumínio Popular</option>
                <option value={1}>Janelas: Alumínio Padrão</option>
                <option value={2}>Janelas: Linha Suprema / PVC</option>
                <option value={3}>Janelas: Minimalista Piso-Teto</option>
              </select>
              <select
                value={bancadas}
                onChange={(e) => setBancadas(Number(e.target.value))}
                className={inputClass}
              >
                <option value={0}>Bancadas: Inox / Granito Sintético</option>
                <option value={1}>
                  Bancadas: Granito Comum (Ubatuba, etc)
                </option>
                <option value={2}>Bancadas: Quartzo / Metais Premium</option>
                <option value={3}>Bancadas: Mármore Importado</option>
              </select>
            </div>
          </div>
          {/* CALCULADORA DE SPRAWL */}
          <div className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                Expansão Urbana (Sprawl)
              </h3>
              <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Índice: {sprawlCalculado.toFixed(1)}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={proximidadeRodovia}
                onChange={(e) => setProximidadeRodovia(Number(e.target.value))}
                className={inputClass}
              >
                <option value={0}>Acesso: Longe de Rodovias</option>
                <option value={1}>Acesso: Moderado / Intermediário</option>
                <option value={2}>Acesso: Próximo (menos de 2km)</option>
                <option value={3}>Acesso: Margem de Eixo Logístico</option>
              </select>
              <select
                value={crescimentoBairro}
                onChange={(e) => setCrescimentoBairro(Number(e.target.value))}
                className={inputClass}
              >
                <option value={0}>Bairro: Estagnado / Consolidado</option>
                <option value={1}>Bairro: Crescimento Lento</option>
                <option value={2}>Bairro: Expansão Acelerada</option>
                <option value={3}>Bairro: Novo Polo Direcional</option>
              </select>
              <select
                value={novosLoteamentos}
                onChange={(e) => setNovosLoteamentos(Number(e.target.value))}
                className={inputClass}
              >
                <option value={0}>Loteamentos: Nenhum no entorno</option>
                <option value={1}>Loteamentos: 1 a 2 novos</option>
                <option value={2}>Loteamentos: Vários projetos</option>
                <option value={3}>Loteamentos: Grande concentração</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── DADOS RURAIS ──────────────────────────────── */}
        {isRural && (
          <div className="bg-[#12121e]/80 backdrop-blur-md rounded-[2rem] shadow-xl border border-green-500/20 p-8 space-y-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full filter blur-[80px] pointer-events-none"></div>

            <div className="flex items-center gap-4 border-b border-white/10 pb-4 relative z-10">
              <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center">
                <Tractor className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">
                  Dados Técnicos Rurais
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  Informações essenciais para compradores e investidores.
                </p>
              </div>
            </div>

            {/* SOLO */}
            <div className="space-y-4 relative z-10">
              <h3 className="text-sm font-black text-green-500 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{" "}
                Solo
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Tipo de Solo</Label>
                  <select
                    name="tipoSolo"
                    value={rural.tipoSolo}
                    onChange={handleRuralChange}
                    className={inputClass}
                  >
                    <option value="" className="bg-[#12121e]">
                      Selecione...
                    </option>
                    <option value="Latossolo Vermelho" className="bg-[#12121e]">
                      Latossolo Vermelho
                    </option>
                    <option
                      value="Latossolo Vermelho-Amarelo"
                      className="bg-[#12121e]"
                    >
                      Latossolo Vermelho-Amarelo
                    </option>
                    <option value="Argissolo" className="bg-[#12121e]">
                      Argissolo
                    </option>
                    <option value="Neossolo" className="bg-[#12121e]">
                      Neossolo
                    </option>
                    <option value="Gleissolo" className="bg-[#12121e]">
                      Gleissolo
                    </option>
                    <option value="Outros" className="bg-[#12121e]">
                      Outros
                    </option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Teor de Argila (%)</Label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    name="percentualArgila"
                    value={rural.percentualArgila}
                    onChange={handleRuralChange}
                    placeholder="Ex: 45.5"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Necessidade de Correção (ton/ha)</Label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    name="necessidadeCorrecaoSolo"
                    value={rural.necessidadeCorrecaoSolo}
                    onChange={handleRuralChange}
                    placeholder="Ex: 2.5"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nível de Nutrientes (mg/dm³)</Label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    name="nivelNutrientes"
                    value={rural.nivelNutrientes}
                    onChange={handleRuralChange}
                    placeholder="Ex: 3.8"
                    className={inputClass}
                  />
                </div>
              </div>
              <Escala
                label="Fertilidade do Solo (1 a 5)"
                value={rural.fertilidadeSolo}
                onChange={(v) =>
                  setRural((prev) => ({
                    ...prev,
                    fertilidadeSolo: v,
                    estadoConservacao: v,
                  }))
                }
              />
            </div>

            {/* USO DA TERRA */}
            <div className="space-y-4 relative z-10">
              <h3 className="text-sm font-black text-green-500 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{" "}
                Uso da Terra
              </h3>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-400 font-medium flex items-start gap-3">
                <span className="text-xl leading-none">💡</span>
                <span>
                  A área total informada é{" "}
                  <strong>{dados.areaTotal || "—"} ha</strong>. A soma das
                  sub-áreas não deve ultrapassar esse valor.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Área Útil (ha)</Label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={rural.areaUtil}
                    onChange={handleAreaUtil}
                    placeholder="Ex: 280"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Área Degradada (ha)</Label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    name="areaDegradada"
                    value={rural.areaDegradada}
                    onChange={handleRuralChange}
                    placeholder="Ex: 12"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reserva Legal (ha)</Label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    name="areaReservaLegal"
                    value={rural.areaReservaLegal}
                    onChange={handleRuralChange}
                    placeholder="Ex: 80"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label>APP — Preservação Permanente (ha)</Label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    name="areaApp"
                    value={rural.areaApp}
                    onChange={handleRuralChange}
                    placeholder="Ex: 40"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Uso Atual</Label>
                  <select
                    name="usoAtual"
                    value={rural.usoAtual}
                    onChange={handleRuralChange}
                    className={inputClass}
                  >
                    <option value="" className="bg-[#12121e]">
                      Selecione...
                    </option>
                    <option value="Soja" className="bg-[#12121e]">
                      Soja
                    </option>
                    <option value="Milho" className="bg-[#12121e]">
                      Milho
                    </option>
                    <option value="Pastagem" className="bg-[#12121e]">
                      Pastagem
                    </option>
                    <option
                      value="Misto (Soja + Pecuária)"
                      className="bg-[#12121e]"
                    >
                      Misto (Soja + Pecuária)
                    </option>
                    <option value="Vegetação Nativa" className="bg-[#12121e]">
                      Vegetação Nativa
                    </option>
                    <option value="Sem uso" className="bg-[#12121e]">
                      Sem uso
                    </option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Uso Potencial</Label>
                  <select
                    name="usoPotencial"
                    value={rural.usoPotencial}
                    onChange={handleRuralChange}
                    className={inputClass}
                  >
                    <option value="" className="bg-[#12121e]">
                      Selecione...
                    </option>
                    <option value="Grãos (Soja/Milho)" className="bg-[#12121e]">
                      Grãos (Soja/Milho)
                    </option>
                    <option value="Pecuária" className="bg-[#12121e]">
                      Pecuária
                    </option>
                    <option value="Misto" className="bg-[#12121e]">
                      Misto
                    </option>
                    <option value="Reflorestamento" className="bg-[#12121e]">
                      Reflorestamento
                    </option>
                    <option
                      value="Agricultura Familiar"
                      className="bg-[#12121e]"
                    >
                      Agricultura Familiar
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* PRODUTIVIDADE */}
            <div className="space-y-4 relative z-10">
              <h3 className="text-sm font-black text-green-500 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{" "}
                Produtividade
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Soja (sacas/ha)</Label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    name="produtividadeSoja"
                    value={rural.produtividadeSoja}
                    onChange={handleRuralChange}
                    placeholder="Ex: 58"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Milho (sacas/ha)</Label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    name="produtividadeMilho"
                    value={rural.produtividadeMilho}
                    onChange={handleRuralChange}
                    placeholder="Ex: 120"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pastagem (UA/ha)</Label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    name="produtividadePastagem"
                    value={rural.produtividadePastagem}
                    onChange={handleRuralChange}
                    placeholder="Ex: 1.8"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                <Escala
                  label="Aptidão Agrícola (1 a 5)"
                  value={rural.aptidaoAgricola}
                  onChange={(v) =>
                    setRural((prev) => ({ ...prev, aptidaoAgricola: v }))
                  }
                />
                <Escala
                  label="Aptidão Pecuária (1 a 5)"
                  value={rural.aptidaoPecuaria}
                  onChange={(v) =>
                    setRural((prev) => ({ ...prev, aptidaoPecuaria: v }))
                  }
                />
              </div>
            </div>

            {/* ÁGUA */}
            <div className="space-y-4 relative z-10">
              <h3 className="text-sm font-black text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block shadow-[0_0_8px_rgba(96,165,250,0.5)]" />{" "}
                Recursos Hídricos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <Toggle
                  label="Acesso a Água"
                  checked={rural.disponibilidadeAgua}
                  onChange={(v) =>
                    setRural((prev) => ({ ...prev, disponibilidadeAgua: v }))
                  }
                />
                <Toggle
                  label="Água Perene"
                  checked={rural.perenidadeAgua}
                  onChange={(v) =>
                    setRural((prev) => ({ ...prev, perenidadeAgua: v }))
                  }
                />
                <Toggle
                  label="Sistema Irrigação"
                  checked={rural.irrigacao}
                  onChange={(v) =>
                    setRural((prev) => ({ ...prev, irrigacao: v }))
                  }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Fonte de Água</Label>
                  <select
                    name="tipoFonteAgua"
                    value={rural.tipoFonteAgua}
                    onChange={handleRuralChange}
                    className={inputClass}
                  >
                    <option value="" className="bg-[#12121e]">
                      Selecione...
                    </option>
                    <option value="Rio perene" className="bg-[#12121e]">
                      Rio perene
                    </option>
                    <option value="Rio intermitente" className="bg-[#12121e]">
                      Rio intermitente
                    </option>
                    <option value="Córrego" className="bg-[#12121e]">
                      Córrego
                    </option>
                    <option value="Nascente" className="bg-[#12121e]">
                      Nascente
                    </option>
                    <option value="Represa / Açude" className="bg-[#12121e]">
                      Represa / Açude
                    </option>
                    <option value="Poço artesiano" className="bg-[#12121e]">
                      Poço artesiano
                    </option>
                    <option value="Sem fonte" className="bg-[#12121e]">
                      Sem fonte
                    </option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Volume estimado (m³/h)</Label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    name="volumeAgua"
                    value={rural.volumeAgua}
                    onChange={handleRuralChange}
                    placeholder="Ex: 50"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* LOGÍSTICA */}
            <div className="space-y-4 relative z-10">
              <h3 className="text-sm font-black text-orange-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400 inline-block shadow-[0_0_8px_rgba(251,146,60,0.5)]" />{" "}
                Logística e Acesso
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Dist. da Rodovia</Label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      name="distanciaRodovia"
                      value={rural.distanciaRodovia}
                      onChange={handleRuralChange}
                      placeholder="Ex: 12"
                      className={`${inputClass} flex-1`}
                    />
                    <span className="px-5 py-4 bg-[#12121e] border border-white/10 rounded-xl text-sm font-bold text-gray-500">
                      km
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Dist. do Porto</Label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      name="distanciaPorto"
                      value={rural.distanciaPorto}
                      onChange={handleRuralChange}
                      placeholder="Ex: 380"
                      className={`${inputClass} flex-1`}
                    />
                    <span className="px-5 py-4 bg-[#12121e] border border-white/10 rounded-xl text-sm font-bold text-gray-500">
                      km
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Centro Consumidor</Label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      name="distanciaCentroConsumidor"
                      value={rural.distanciaCentroConsumidor}
                      onChange={handleRuralChange}
                      placeholder="Ex: 45"
                      className={`${inputClass} flex-1`}
                    />
                    <span className="px-5 py-4 bg-[#12121e] border border-white/10 rounded-xl text-sm font-bold text-gray-500">
                      km
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Escala
                  label="Qualidade do Acesso (1 a 5)"
                  value={rural.qualidadeAcesso}
                  onChange={(v) =>
                    setRural((prev) => ({ ...prev, qualidadeAcesso: v }))
                  }
                />
              </div>
            </div>

            {/* INFRAESTRUTURA */}
            <div className="space-y-4 relative z-10">
              <h3 className="text-sm font-black text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block shadow-[0_0_8px_rgba(129,140,248,0.5)]" />{" "}
                Infraestrutura
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Toggle
                  label="Sede / Casa"
                  checked={rural.sede}
                  onChange={(v) => setRural((p) => ({ ...p, sede: v }))}
                />
                <Toggle
                  label="Energia Elétrica"
                  checked={rural.energiaEletrica}
                  onChange={(v) =>
                    setRural((p) => ({ ...p, energiaEletrica: v }))
                  }
                />
                <Toggle
                  label="Mecanização Viável"
                  checked={rural.mecanizacaoViavel}
                  onChange={(v) =>
                    setRural((p) => ({ ...p, mecanizacaoViavel: v }))
                  }
                />
                <Toggle
                  label="Casa Funcionários"
                  checked={rural.casaFuncionarios}
                  onChange={(v) =>
                    setRural((p) => ({ ...p, casaFuncionarios: v }))
                  }
                />
                <Toggle
                  label="Curral"
                  checked={rural.curral}
                  onChange={(v) => setRural((p) => ({ ...p, curral: v }))}
                />
                <Toggle
                  label="Galpão"
                  checked={rural.galpao}
                  onChange={(v) => setRural((p) => ({ ...p, galpao: v }))}
                />
              </div>
            </div>

            {/* DOCUMENTAÇÃO */}
            <div className="space-y-4 relative z-10">
              <h3 className="text-sm font-black text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400 inline-block shadow-[0_0_8px_rgba(156,163,175,0.5)]" />{" "}
                Documentação
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Toggle
                  label="Matrícula Regular"
                  checked={rural.matriculaRegular}
                  onChange={(v) =>
                    setRural((p) => ({ ...p, matriculaRegular: v }))
                  }
                />
                <Toggle
                  label="Georreferenciamento"
                  checked={rural.georreferenciamento}
                  onChange={(v) =>
                    setRural((p) => ({ ...p, georreferenciamento: v }))
                  }
                />
                <Toggle
                  label="CAR Regularizado"
                  checked={rural.car}
                  onChange={(v) => setRural((p) => ({ ...p, car: v }))}
                />
                <Toggle
                  label="CCIR Regular"
                  checked={rural.ccir}
                  onChange={(v) => setRural((p) => ({ ...p, ccir: v }))}
                />
                <Toggle
                  label="ITR em Dia"
                  checked={rural.itrRegular}
                  onChange={(v) => setRural((p) => ({ ...p, itrRegular: v }))}
                />
                <Toggle
                  label="Livre de Ônus"
                  checked={!rural.existenciaOnus}
                  onChange={(v) =>
                    setRural((p) => ({ ...p, existenciaOnus: !v }))
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* ── MÍDIA ─────────────────────────────────────── */}
        <div className="bg-[#12121e]/80 backdrop-blur-md rounded-[2rem] shadow-xl border border-white/5 p-8 space-y-6 relative z-10">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-black text-white">Mídia do Imóvel</h2>
              <p className="text-sm text-gray-400 font-medium mt-1">
                Passe o mouse sobre uma foto e clique na{" "}
                <Star className="w-3.5 h-3.5 inline text-green-400 fill-green-400 -mt-0.5" />{" "}
                para escolher a capa do anúncio na vitrine.
              </p>
            </div>
            <span className="text-xs font-bold text-green-400 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">
              {fotos.length} adicionadas
            </span>
          </div>

          <CldUploadWidget
            uploadPreset="imoveis_preset"
            onSuccess={handleUploadSuccess}
            options={{ multiple: true, maxFiles: 15, resourceType: "image" }}
          >
            {({ open }) =>
              fotos.length === 0 ? (
                <div
                  onClick={() => open()}
                  className="w-full h-64 border-2 border-dashed border-white/20 rounded-[2rem] flex flex-col items-center justify-center gap-4 bg-[#09090f] hover:bg-green-500/5 hover:border-green-500/50 transition-all cursor-pointer group outline-none"
                >
                  <div className="w-16 h-16 bg-white/5 rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform border border-white/10 group-hover:border-green-500/30">
                    <UploadCloud className="w-8 h-8 text-gray-500 group-hover:text-green-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-lg group-hover:text-green-400 transition-colors">
                      Clique para procurar fotos
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      Formatos suportados: JPG, PNG, WEBP
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {fotos.map((url, index) => (
                    <div
                      key={url}
                      className={`relative group rounded-2xl overflow-hidden border border-white/10 shadow-sm bg-[#09090f] ${index === 0 ? "col-span-2 row-span-2 aspect-auto" : "aspect-square"}`}
                    >
                      <img
                        src={url}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                      />
                      {index === 0 && (
                        <div className="absolute top-4 left-4 bg-[#12121e]/90 backdrop-blur-md text-white text-xs font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg border border-white/10">
                          <Star className="w-3.5 h-3.5 text-green-400 fill-green-400" />{" "}
                          Capa
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        {index !== 0 && (
                          <button
                            type="button"
                            onClick={() => definirComoCapa(url)}
                            title="Definir como capa"
                            className="bg-green-500 hover:bg-green-400 text-[#09090f] p-3 rounded-full transform scale-0 group-hover:scale-100 transition-transform shadow-[0_0_15px_rgba(34,197,94,0.5)] outline-none"
                          >
                            <Star className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setFotos(fotos.filter((f) => f !== url))
                          }
                          title="Remover foto"
                          className="bg-red-500 hover:bg-red-400 text-[#09090f] p-3 rounded-full transform scale-0 group-hover:scale-100 transition-transform shadow-[0_0_15px_rgba(239,68,68,0.5)] outline-none"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => open()}
                    className="aspect-square flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/20 rounded-2xl bg-[#09090f] hover:bg-green-500/5 hover:border-green-500/50 transition-all text-gray-500 hover:text-green-400 outline-none group"
                  >
                    <ImagePlus className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold">Adicionar Mais</span>
                  </button>
                </div>
              )
            }
          </CldUploadWidget>
        </div>

        {/* ── FEEDBACK ──────────────────────────────────── */}
        {mensagem.texto && (
          <div
            className={`p-5 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in border relative z-10 ${mensagem.tipo === "sucesso" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}
          >
            {mensagem.tipo === "erro" && <AlertCircle className="w-5 h-5" />}
            {mensagem.texto}
          </div>
        )}

        {/* ── SUBMIT ────────────────────────────────────── */}
        <div className="pt-6 flex justify-end relative z-10 pb-10">
          <button
            type="submit"
            disabled={salvando}
            className="bg-green-600 text-white font-black text-sm uppercase tracking-widest px-12 py-5 rounded-[2rem] hover:bg-green-500 hover:shadow-[0_0_25px_rgba(34,197,94,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 outline-none active:scale-95"
          >
            {salvando ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                Processando...
              </span>
            ) : isEdit ? (
              "Atualizar Anúncio"
            ) : (
              "Publicar Anúncio"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
