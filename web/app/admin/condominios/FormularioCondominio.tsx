"use client";

import { useState } from "react";
import { Loader2, X, Search } from "lucide-react";
import { api, ErroApi } from "@/lib/api";
import type { Condominio } from "@/lib/tipos";

/**
 * Cadastro de condomínio. Só o nome é obrigatório — o cadastro costuma começar
 * incompleto em visita de campo e ser completado depois.
 *
 * Os erros de campo vêm prontos da API, no mapa `campos` do ErroApi, e são
 * exibidos sob o input correspondente em vez de virarem um alerta genérico.
 */

type Props = {
  condominio?: Condominio | null;
  onFechar: () => void;
  onSalvo: () => void;
};

const VAZIO = {
  nome: "", razaoSocial: "", cnpj: "", tipoCondominio: "",
  cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "",
  qtdUnidades: "", qtdTorres: "", anoEntrega: "",
  construtora: "", administradora: "", telefoneContato: "", emailContato: "",
  observacoes: "",
};

export default function FormularioCondominio({ condominio, onFechar, onSalvo }: Props) {
  const editando = Boolean(condominio);

  // O formulário trabalha só com string — números e nulos do DTO viram texto
  // aqui e voltam a ser número na hora de enviar.
  const [form, setForm] = useState<typeof VAZIO>(() => {
    if (!condominio) return VAZIO;
    const dados = condominio as unknown as Record<string, unknown>;
    const preenchido = { ...VAZIO };
    (Object.keys(VAZIO) as (keyof typeof VAZIO)[]).forEach((chave) => {
      const valor = dados[chave];
      preenchido[chave] = valor === null || valor === undefined ? "" : String(valor);
    });
    return preenchido;
  });
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);

  const set = (chave: keyof typeof VAZIO, valor: string) => {
    setForm((f) => ({ ...f, [chave]: valor }));
    // Some com o erro do campo assim que a pessoa mexe nele.
    if (campos[chave]) setCampos((c) => ({ ...c, [chave]: "" }));
  };

  async function buscarCep() {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length !== 8) {
      setCampos((c) => ({ ...c, cep: "Informe os 8 dígitos do CEP." }));
      return;
    }
    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const dados = await res.json();
      if (dados.erro) {
        setCampos((c) => ({ ...c, cep: "CEP não encontrado." }));
      } else {
        setForm((f) => ({
          ...f,
          rua: dados.logradouro || f.rua,
          bairro: dados.bairro || f.bairro,
          cidade: dados.localidade || f.cidade,
          uf: dados.uf || f.uf,
        }));
        setCampos((c) => ({ ...c, cep: "" }));
      }
    } catch {
      setCampos((c) => ({ ...c, cep: "Não foi possível consultar o CEP agora." }));
    } finally {
      setBuscandoCep(false);
    }
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErroGeral("");
    setCampos({});

    // Strings vazias viram null: o back trata ausência, não "".
    const corpo: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(form)) {
      const texto = String(v).trim();
      if (!texto) continue;
      corpo[k] = ["qtdUnidades", "qtdTorres", "anoEntrega"].includes(k) ? Number(texto) : texto;
    }

    try {
      if (editando) await api.put(`/condominios/${condominio!.id}`, corpo);
      else await api.post("/condominios", corpo);
      onSalvo();
    } catch (e) {
      if (e instanceof ErroApi) {
        setCampos(e.campos);
        // Quando o erro é de um campo só, ele já aparece embaixo do input.
        if (Object.keys(e.campos).length === 0) setErroGeral(e.message);
      } else {
        setErroGeral("Falha de conexão. Verifique sua internet.");
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4">
      <form
        onSubmit={salvar}
        className="w-full max-w-3xl my-8 bg-[#12121e] border border-white/10 rounded-2xl shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-[#12121e] rounded-t-2xl">
          <h2 className="text-lg font-black text-white">
            {editando ? "Editar condomínio" : "Novo condomínio"}
          </h2>
          <button type="button" onClick={onFechar} className="p-2 text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          <Secao titulo="Identificação">
            <Campo className="sm:col-span-2" rotulo="Nome do condomínio" obrigatorio erro={campos.nome}>
              <input value={form.nome} onChange={(e) => set("nome", e.target.value)} className={estiloInput(campos.nome)} placeholder="Residencial Parque das Águas" />
            </Campo>
            <Campo rotulo="CNPJ" erro={campos.cnpj} dica="Opcional — nem todo condomínio tem um ativo">
              <input value={form.cnpj} onChange={(e) => set("cnpj", e.target.value)} className={estiloInput(campos.cnpj)} placeholder="00.000.000/0001-00" />
            </Campo>
            <Campo rotulo="Tipologia" erro={campos.tipoCondominio}>
              <select value={form.tipoCondominio} onChange={(e) => set("tipoCondominio", e.target.value)} className={estiloInput(campos.tipoCondominio)}>
                <option value="">Selecione</option>
                <option value="HORIZONTAL">Horizontal</option>
                <option value="VERTICAL">Vertical</option>
                <option value="MISTO">Misto</option>
              </select>
            </Campo>
            <Campo className="sm:col-span-2" rotulo="Razão social" erro={campos.razaoSocial}>
              <input value={form.razaoSocial} onChange={(e) => set("razaoSocial", e.target.value)} className={estiloInput(campos.razaoSocial)} />
            </Campo>
          </Secao>

          <Secao titulo="Endereço">
            <Campo rotulo="CEP" erro={campos.cep}>
              <div className="flex gap-2">
                <input value={form.cep} onChange={(e) => set("cep", e.target.value)} className={estiloInput(campos.cep)} placeholder="78065-000" />
                <button type="button" onClick={buscarCep} disabled={buscandoCep}
                        className="shrink-0 px-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50">
                  {buscandoCep ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              </div>
            </Campo>
            <Campo rotulo="Rua" erro={campos.rua}>
              <input value={form.rua} onChange={(e) => set("rua", e.target.value)} className={estiloInput(campos.rua)} />
            </Campo>
            <Campo rotulo="Número" erro={campos.numero}>
              <input value={form.numero} onChange={(e) => set("numero", e.target.value)} className={estiloInput(campos.numero)} />
            </Campo>
            <Campo rotulo="Complemento" erro={campos.complemento}>
              <input value={form.complemento} onChange={(e) => set("complemento", e.target.value)} className={estiloInput(campos.complemento)} />
            </Campo>
            <Campo rotulo="Bairro" erro={campos.bairro}>
              <input value={form.bairro} onChange={(e) => set("bairro", e.target.value)} className={estiloInput(campos.bairro)} />
            </Campo>
            <Campo rotulo="Cidade" erro={campos.cidade}>
              <input value={form.cidade} onChange={(e) => set("cidade", e.target.value)} className={estiloInput(campos.cidade)} />
            </Campo>
            <Campo rotulo="UF" erro={campos.uf}>
              <input value={form.uf} maxLength={2} onChange={(e) => set("uf", e.target.value.toUpperCase())} className={estiloInput(campos.uf)} placeholder="MT" />
            </Campo>
          </Secao>

          <Secao titulo="Empreendimento">
            <Campo rotulo="Unidades" erro={campos.qtdUnidades}>
              <input type="number" min={1} value={form.qtdUnidades} onChange={(e) => set("qtdUnidades", e.target.value)} className={estiloInput(campos.qtdUnidades)} />
            </Campo>
            <Campo rotulo="Torres" erro={campos.qtdTorres}>
              <input type="number" min={1} value={form.qtdTorres} onChange={(e) => set("qtdTorres", e.target.value)} className={estiloInput(campos.qtdTorres)} />
            </Campo>
            <Campo rotulo="Ano de entrega" erro={campos.anoEntrega}>
              <input type="number" value={form.anoEntrega} onChange={(e) => set("anoEntrega", e.target.value)} className={estiloInput(campos.anoEntrega)} placeholder="2019" />
            </Campo>
            <Campo rotulo="Construtora" erro={campos.construtora}>
              <input value={form.construtora} onChange={(e) => set("construtora", e.target.value)} className={estiloInput(campos.construtora)} />
            </Campo>
            <Campo rotulo="Administradora" erro={campos.administradora}>
              <input value={form.administradora} onChange={(e) => set("administradora", e.target.value)} className={estiloInput(campos.administradora)} />
            </Campo>
          </Secao>

          <Secao titulo="Contato">
            <Campo rotulo="Telefone" erro={campos.telefoneContato}>
              <input value={form.telefoneContato} onChange={(e) => set("telefoneContato", e.target.value)} className={estiloInput(campos.telefoneContato)} />
            </Campo>
            <Campo rotulo="E-mail" erro={campos.emailContato}>
              <input value={form.emailContato} onChange={(e) => set("emailContato", e.target.value)} className={estiloInput(campos.emailContato)} />
            </Campo>
            <Campo className="sm:col-span-2" rotulo="Observações" erro={campos.observacoes}>
              <textarea rows={3} value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} className={estiloInput(campos.observacoes)} />
            </Campo>
          </Secao>

          {erroGeral && (
            <p className="text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {erroGeral}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/5">
          <button type="button" onClick={onFechar}
                  className="px-5 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={salvando}
                  className="px-6 py-3 rounded-xl text-sm font-bold bg-green-500 text-black hover:bg-green-400 transition-colors disabled:opacity-50 flex items-center gap-2">
            {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
            {editando ? "Salvar alterações" : "Cadastrar"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Peças de layout ────────────────────────────────────────

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-black uppercase tracking-widest text-green-500 mb-4">{titulo}</h3>
      <div className="grid sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Campo({ rotulo, obrigatorio, erro, dica, className = "", children }: {
  rotulo: string; obrigatorio?: boolean; erro?: string; dica?: string;
  className?: string; children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-gray-400 mb-1.5">
        {rotulo} {obrigatorio && <span className="text-green-500">*</span>}
      </label>
      {children}
      {erro ? (
        <p className="mt-1.5 text-xs font-bold text-red-400">{erro}</p>
      ) : dica ? (
        <p className="mt-1.5 text-xs text-gray-600">{dica}</p>
      ) : null}
    </div>
  );
}

function estiloInput(erro?: string) {
  return `w-full bg-[#09090f] border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-colors ${
    erro ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-green-500/50"
  }`;
}
