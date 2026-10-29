"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Node, mergeAttributes } from "@tiptap/core";
import { useEffect } from "react";
import { CldUploadWidget } from "next-cloudinary";
import {
  Bold, Italic, Underline as UnderlineIcon,
  Heading2, Heading3, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, ImagePlus,
} from "lucide-react";

// ── BLOCOS ESPECIAIS ─────────────────────────────────────────────────────────

const BlocoEspecial = Node.create({
  name: "blocoEspecial",
  group: "block",
  content: "block+",

  addAttributes() {
    return {
      variante: {
        default: "data-box",
        parseHTML: (el) => el.getAttribute("data-variante"),
        renderHTML: (attrs) => ({ "data-variante": attrs.variante }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-variante]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const classes: Record<string, string> = {
      "pull-quote": "artigo-pull-quote",
      "data-box":   "artigo-data-box",
      "alert":      "artigo-alert-strip",
      "conclusion": "artigo-conclusion",
      "info-box":   "artigo-info-box",
    };
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        class: classes[node.attrs.variante] ?? "artigo-data-box",
        "data-variante": node.attrs.variante,
      }),
      0,
    ];
  },
});

// ── EDITOR ────────────────────────────────────────────────────────────────────

interface Props {
  value: string;
  onChange: (html: string) => void;
}

const BLOCOS = [
  { variante: "pull-quote", emoji: "💬", label: "Pull Quote",   cor: "bg-slate-700 hover:bg-slate-600 text-slate-200"    },
  { variante: "data-box",   emoji: "📋", label: "Data Box",    cor: "bg-green-900/50 hover:bg-green-800/60 text-green-300" },
  { variante: "alert",      emoji: "⚠️", label: "Alerta",      cor: "bg-red-900/40 hover:bg-red-800/50 text-red-300"     },
  { variante: "conclusion", emoji: "✅", label: "Conclusão",   cor: "bg-blue-900/40 hover:bg-blue-800/50 text-blue-300"   },
  { variante: "info-box",   emoji: "💡", label: "Info Box",    cor: "bg-yellow-900/30 hover:bg-yellow-800/40 text-yellow-300" },
];

export default function EditorNoticias({ value, onChange }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, blockquote: false }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Escreva o conteúdo da notícia aqui..." }),
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false, allowBase64: false }),
      BlocoEspecial,
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "artigo-editor min-h-[480px] outline-none p-5 text-gray-300" },
    },
  });

  // Sincroniza conteúdo externo (edição de notícia existente)
  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  const inserirBloco = (variante: string) => {
    const placeholders: Record<string, string> = {
      "pull-quote": "✏️ Escreva o destaque editorial aqui — uma frase forte que resume o artigo.",
      "data-box":   "📋 Título do box de dados\n• Ponto chave 1\n• Ponto chave 2\n• Ponto chave 3",
      "alert":      "⚠️ Mensagem de alerta ou aviso importante para o leitor.",
      "conclusion": "✅ Escreva aqui a conclusão do artigo — o que o leitor deve reter.",
      "info-box":   "💡 Informação complementar relevante para o contexto do artigo.",
    };

    editor.chain().focus().insertContent({
      type: "blocoEspecial",
      attrs: { variante },
      content: [{
        type: "paragraph",
        content: [{ type: "text", text: placeholders[variante] ?? "Escreva aqui..." }],
      }],
    }).run();
  };

  // Botão genérico da toolbar
  const Btn = ({ onClick, active, title, children }: {
    onClick: () => void; active?: boolean; title: string; children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-colors ${
        active ? "bg-green-600 text-white" : "text-gray-500 hover:bg-white/5 hover:text-gray-200"
      }`}
    >
      {children}
    </button>
  );

  const Div = () => <div className="w-px bg-white/10 mx-1 self-stretch" />;

  return (
    <div className="rounded-xl border border-white/10 bg-[#09090f] overflow-hidden">
      {/* ── TOOLBAR ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-white/10 p-2 flex flex-wrap items-center gap-0.5">

        {/* Formatação de texto */}
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Negrito (Ctrl+B)">
          <Bold className="w-4 h-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Itálico (Ctrl+I)">
          <Italic className="w-4 h-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Sublinhado">
          <UnderlineIcon className="w-4 h-4" />
        </Btn>

        <Div />

        {/* Títulos */}
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Título H2">
          <Heading2 className="w-4 h-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Subtítulo H3">
          <Heading3 className="w-4 h-4" />
        </Btn>

        <Div />

        {/* Listas */}
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Lista de itens">
          <List className="w-4 h-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Lista numerada">
          <ListOrdered className="w-4 h-4" />
        </Btn>

        <Div />

        {/* Alinhamento */}
        <Btn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Esquerda">
          <AlignLeft className="w-4 h-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Centralizar">
          <AlignCenter className="w-4 h-4" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Direita">
          <AlignRight className="w-4 h-4" />
        </Btn>

        <Div />

        {/* Upload de imagem */}
        <CldUploadWidget
          uploadPreset="imoveis_preset"
          onSuccess={(result: any) => {
            editor.chain().focus().setImage({ src: result.info.secure_url }).run();
          }}
        >
          {({ open }) => (
            <Btn onClick={() => open()} title="Inserir imagem">
              <ImagePlus className="w-4 h-4" />
            </Btn>
          )}
        </CldUploadWidget>

        <Div />

        {/* Blocos especiais */}
        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest px-1">Inserir:</span>
        {BLOCOS.map((b) => (
          <button
            key={b.variante}
            type="button"
            onClick={() => inserirBloco(b.variante)}
            title={`Inserir ${b.label}`}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${b.cor}`}
          >
            {b.emoji} {b.label}
          </button>
        ))}
      </div>

      {/* ── ÁREA DE EDIÇÃO ───────────────────────────────────────────────────── */}
      <EditorContent editor={editor} />

      {/* Dica */}
      <div className="border-t border-white/5 px-4 py-2 text-[10px] text-gray-600 flex gap-4">
        <span>Ctrl+B: negrito</span>
        <span>Ctrl+I: itálico</span>
        <span>Ctrl+Z: desfazer</span>
        <span>Clique em "Inserir" para adicionar blocos visuais</span>
      </div>
    </div>
  );
}
