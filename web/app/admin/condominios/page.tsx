"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2, Plus, Search, Pencil, Trash2, MapPin, Users2,
  Loader2, Lock, ShieldCheck,
} from "lucide-react";
import { api, ErroApi } from "@/lib/api";
import type { Condominio } from "@/lib/tipos";
import FormularioCondominio from "./FormularioCondominio";

/**
 * Cadastro dos condomínios avaliados pelo IQC.
 *
 * A API já devolve só o que o usuário alcança — ADMIN vê tudo, os demais veem
 * o que cadastraram mais aqueles em que receberam acesso de avaliador. A tela
 * não filtra nada por conta própria.
 */
export default function PainelCondominios() {
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [semPermissao, setSemPermissao] = useState(false);
  const [erro, setErro] = useState("");
  const [editando, setEditando] = useState<Condominio | null | undefined>(undefined);

  const carregar = useCallback(async (termo: string) => {
    setCarregando(true);
    setErro("");
    try {
      const query = termo.trim() ? `?busca=${encodeURIComponent(termo.trim())}` : "";
      setCondominios((await api.get(`/condominios${query}`)) ?? []);
      setSemPermissao(false);
    } catch (e) {
      if (e instanceof ErroApi && e.semPermissao) setSemPermissao(true);
      else setErro(e instanceof ErroApi ? e.message : "Não foi possível carregar os condomínios.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    // Espera a digitação parar antes de consultar.
    const t = setTimeout(() => carregar(busca), busca ? 400 : 0);
    return () => clearTimeout(t);
  }, [busca, carregar]);

  async function desativar(c: Condominio) {
    const ok = confirm(
      `Desativar "${c.nome}"?\n\nEle sai das listagens, mas as avaliações já emitidas continuam íntegras e seguem apontando para ele.`
    );
    if (!ok) return;
    try {
      await api.delete(`/condominios/${c.id}`);
      carregar(busca);
    } catch (e) {
      alert(e instanceof ErroApi ? e.message : "Não foi possível desativar.");
    }
  }

  if (semPermissao) return <SemAcesso />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-green-500" /> Condomínios
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Cadastro dos empreendimentos avaliados pelo IQC.
          </p>
        </div>
        <button
          onClick={() => setEditando(null)}
          className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-green-500 text-black hover:bg-green-400 transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo condomínio
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, bairro ou cidade"
          className="w-full bg-[#12121e] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-green-500/50 transition-colors"
        />
      </div>

      {erro && (
        <p className="text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {erro}
        </p>
      )}

      {carregando ? (
        <div className="flex items-center gap-2 text-gray-500 py-16 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> Carregando…
        </div>
      ) : condominios.length === 0 ? (
        <Vazio buscando={Boolean(busca.trim())} onNovo={() => setEditando(null)} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {condominios.map((c) => (
            <Cartao key={c.id} c={c} onEditar={() => setEditando(c)} onDesativar={() => desativar(c)} />
          ))}
        </div>
      )}

      {editando !== undefined && (
        <FormularioCondominio
          condominio={editando}
          onFechar={() => setEditando(undefined)}
          onSalvo={() => {
            setEditando(undefined);
            carregar(busca);
          }}
        />
      )}
    </div>
  );
}

function Cartao({ c, onEditar, onDesativar }: {
  c: Condominio; onEditar: () => void; onDesativar: () => void;
}) {
  const local = [c.bairro, c.cidade, c.uf].filter(Boolean).join(", ");

  return (
    <div className="bg-[#12121e] border border-white/5 rounded-2xl p-5 flex flex-col gap-4 hover:border-white/10 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-black text-white truncate">{c.nome}</h3>
          {local && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
              <MapPin className="w-3 h-3 shrink-0" /> {local}
            </p>
          )}
        </div>
        {c.tipoCondominio && (
          <span className="shrink-0 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-white/5 text-gray-400">
            {c.tipoCondominio}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {c.qtdUnidades ? <span className="flex items-center gap-1"><Users2 className="w-3 h-3" /> {c.qtdUnidades} unidades</span> : null}
        {c.anoEntrega ? <span>Entrega {c.anoEntrega}</span> : null}
        {c.cnpj ? <span className="font-mono">{formatarCnpj(c.cnpj)}</span> : null}
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-white/5">
        <Link
          href={`/admin/condominios/${c.id}`}
          className="flex-1 text-center px-3 py-2 rounded-lg text-xs font-bold bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
        >
          Acessos e opiniões
        </Link>
        <button onClick={onEditar} title="Editar"
                className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={onDesativar} title="Desativar"
                className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function Vazio({ buscando, onNovo }: { buscando: boolean; onNovo: () => void }) {
  return (
    <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
      <Building2 className="w-10 h-10 text-gray-700 mx-auto mb-3" />
      <p className="text-gray-400 font-bold">
        {buscando ? "Nenhum condomínio encontrado" : "Nenhum condomínio cadastrado ainda"}
      </p>
      <p className="text-sm text-gray-600 mt-1">
        {buscando ? "Tente outro nome, bairro ou cidade." : "Cadastre o primeiro para começar a avaliar."}
      </p>
      {!buscando && (
        <button onClick={onNovo}
                className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-green-500 text-black hover:bg-green-400 transition-colors">
          <Plus className="w-4 h-4" /> Cadastrar condomínio
        </button>
      )}
    </div>
  );
}

function SemAcesso() {
  return (
    <div className="max-w-lg mx-auto text-center py-20">
      <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-5">
        <Lock className="w-7 h-7 text-green-500" />
      </div>
      <h1 className="text-2xl font-black text-white">Recurso do plano PRO</h1>
      <p className="text-gray-500 mt-3 leading-relaxed">
        O cadastro de condomínios faz parte da auditoria IQC, disponível para administradores
        e corretores do plano PRO. Se você foi convidado como avaliador de um condomínio
        específico, ele aparece aqui assim que o convite for concedido.
      </p>
      <Link href="/planos"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-green-500 text-black hover:bg-green-400 transition-colors">
        <ShieldCheck className="w-4 h-4" /> Conhecer o plano PRO
      </Link>
    </div>
  );
}

function formatarCnpj(cnpj: string) {
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}
