/**
 * ═══════════════════════════════════════════════════════════════
 *  CLIENTE DA API
 * ═══════════════════════════════════════════════════════════════
 *
 *  Concentra o que estava repetido em cada página: montar a URL, anexar o
 *  token, tratar corpo vazio e transformar erro em algo exibível.
 *
 *  O back-end padronizou o formato de erro em { erro, campos }, então aqui a
 *  falha vira um ErroApi com a mensagem pronta para a tela e o mapa de campos
 *  pronto para o formulário — em vez de cada página inventar a sua tradução.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ErroApi extends Error {
  readonly status: number;
  /** Erros por campo, quando a falha foi de validação. */
  readonly campos: Record<string, string>;

  constructor(status: number, mensagem: string, campos: Record<string, string> = {}) {
    super(mensagem);
    this.name = "ErroApi";
    this.status = status;
    this.campos = campos;
  }

  /** 403 tem tratamento próprio na tela: é falta de permissão, não erro de preenchimento. */
  get semPermissao() {
    return this.status === 403;
  }
}

function token(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function interpretar(res: Response) {
  const texto = await res.text();
  const corpo = texto ? safeJson(texto) : null;

  if (res.ok) return corpo;

  // Formato do TratadorDeErros no back: { erro, campos? }
  const mensagem =
    corpo?.erro ??
    (res.status === 403
      ? "Você não tem permissão para isso."
      : res.status === 404
      ? "Não encontrado."
      : "Não foi possível concluir. Tente novamente.");

  throw new ErroApi(res.status, mensagem, corpo?.campos ?? {});
}

function safeJson(texto: string) {
  try {
    return JSON.parse(texto);
  } catch {
    // Resposta que não é JSON (texto puro de alguns endpoints antigos).
    return { erro: texto };
  }
}

async function requisitar(metodo: string, caminho: string, corpo?: unknown) {
  const cabecalhos: Record<string, string> = {};
  const jwt = token();
  if (jwt) cabecalhos["Authorization"] = `Bearer ${jwt}`;

  let payload: BodyInit | undefined;
  if (corpo instanceof FormData) {
    // Sem Content-Type: o browser precisa definir o boundary do multipart.
    payload = corpo;
  } else if (corpo !== undefined) {
    cabecalhos["Content-Type"] = "application/json";
    payload = JSON.stringify(corpo);
  }

  const res = await fetch(`${BASE}${caminho}`, { method: metodo, headers: cabecalhos, body: payload });
  return interpretar(res);
}

export const api = {
  get:    (caminho: string) => requisitar("GET", caminho),
  post:   (caminho: string, corpo?: unknown) => requisitar("POST", caminho, corpo),
  put:    (caminho: string, corpo?: unknown) => requisitar("PUT", caminho, corpo),
  patch:  (caminho: string, corpo?: unknown) => requisitar("PATCH", caminho, corpo),
  delete: (caminho: string) => requisitar("DELETE", caminho),

  /** Baixa arquivo autenticado (comprovante de residência). */
  async baixar(caminho: string): Promise<{ blob: Blob; nome: string }> {
    const jwt = token();
    const res = await fetch(`${BASE}${caminho}`, {
      headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
    });
    if (!res.ok) {
      const texto = await res.text();
      const corpo = texto ? safeJson(texto) : null;
      throw new ErroApi(res.status, corpo?.erro ?? "Não foi possível baixar o arquivo.");
    }
    const disposicao = res.headers.get("Content-Disposition") ?? "";
    const nome = /filename="([^"]+)"/.exec(disposicao)?.[1] ?? "comprovante";
    return { blob: await res.blob(), nome };
  },
};
