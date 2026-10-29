import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade | Urbano Connect",
  description:
    "Saiba como a Urbano Connect coleta, usa e protege os seus dados pessoais, em conformidade com a LGPD.",
};

const ATUALIZACAO = "11 de junho de 2026";
const VERSAO = "1.0";

export default function PoliticaPrivacidade() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 text-zinc-800">
      <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
      <p className="text-sm text-zinc-500 mb-8">
        Versão {VERSAO} — última atualização em {ATUALIZACAO}
      </p>

      <section className="space-y-6 leading-relaxed">
        <p>
          A <strong>Urbano Connect</strong> (&quot;nós&quot;) leva a sua privacidade a sério.
          Esta política explica, em conformidade com a{" "}
          <strong>Lei Geral de Proteção de Dados — Lei nº 13.709/2018 (LGPD)</strong>, quais
          dados pessoais coletamos, por que coletamos, com quem compartilhamos e quais são os
          seus direitos como titular.
        </p>

        <h2 className="text-xl font-semibold mt-8">1. Dados que coletamos</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Cadastro:</strong> nome, e-mail, CPF, data de nascimento, telefone e
            endereço (CEP, rua, número, bairro, cidade, UF). Para corretores, também o CRECI.
          </li>
          <li>
            <strong>Contato com anunciante (lead):</strong> nome, e-mail, telefone e a mensagem
            enviada ao demonstrar interesse em um imóvel.
          </li>
          <li>
            <strong>Newsletter:</strong> e-mail informado na inscrição.
          </li>
          <li>
            <strong>Pagamento:</strong> os dados de cartão e PIX são processados diretamente
            pelo <strong>Mercado Pago</strong> — não armazenamos dados de cartão. Guardamos
            apenas o identificador e o status da assinatura.
          </li>
          <li>
            <strong>Navegação:</strong> cookies essenciais (sessão de login e preferências) e,
            apenas com o seu consentimento, cookies de análise de uso.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8">2. Finalidades do tratamento</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Criar e gerenciar a sua conta na plataforma;</li>
          <li>Conectar interessados a corretores anunciantes (envio de leads);</li>
          <li>Processar assinaturas do plano PRO via Mercado Pago;</li>
          <li>Enviar e-mails transacionais (recuperação de senha, confirmações);</li>
          <li>Enviar a newsletter, quando você se inscreve (consentimento — Art. 7º, I);</li>
          <li>Cumprir obrigações legais e regulatórias;</li>
          <li>Melhorar a plataforma com dados de uso agregados.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8">3. Bases legais</h2>
        <p>
          Tratamos os seus dados com base na <strong>execução de contrato</strong> (conta e
          assinatura), no <strong>consentimento</strong> (newsletter, cookies de análise, envio
          de leads), no <strong>cumprimento de obrigação legal</strong> e no{" "}
          <strong>legítimo interesse</strong> (segurança e prevenção a fraudes), sempre nos
          limites do Art. 7º da LGPD.
        </p>

        <h2 className="text-xl font-semibold mt-8">4. Compartilhamento</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Corretores anunciantes:</strong> ao enviar um lead, o seu nome, e-mail,
            telefone e mensagem são compartilhados com o corretor responsável pelo imóvel;
          </li>
          <li>
            <strong>Mercado Pago:</strong> processamento de pagamentos e assinaturas;
          </li>
          <li>
            <strong>Provedores de infraestrutura:</strong> hospedagem do site (Vercel), da API
            (Microsoft Azure) e de imagens (Cloudinary);
          </li>
          <li>
            <strong>Autoridades:</strong> quando exigido por lei ou ordem judicial.
          </li>
        </ul>
        <p>Não vendemos os seus dados pessoais a terceiros.</p>

        <h2 className="text-xl font-semibold mt-8">5. Cookies</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Essenciais:</strong> necessários para login e funcionamento — não dependem
            de consentimento;
          </li>
          <li>
            <strong>Análise:</strong> usados apenas se você aceitar no banner de cookies. Você
            pode revogar a escolha limpando os dados do site no navegador.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8">6. Retenção e segurança</h2>
        <p>
          Mantemos os seus dados enquanto a sua conta estiver ativa ou pelo prazo necessário às
          finalidades descritas. Adotamos medidas técnicas como criptografia de senhas
          (bcrypt), comunicação exclusivamente via HTTPS, controle de acesso por perfil e
          monitoramento contra abusos.
        </p>

        <h2 className="text-xl font-semibold mt-8">7. Seus direitos (Art. 18 da LGPD)</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Confirmar a existência de tratamento e acessar os seus dados;</li>
          <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
          <li>
            <strong>Exportar os seus dados</strong> (portabilidade) — disponível na página{" "}
            <em>Minha Conta</em>;
          </li>
          <li>
            <strong>Excluir a sua conta</strong> e ter os dados pessoais anonimizados —
            disponível na página <em>Minha Conta</em>;
          </li>
          <li>Revogar consentimentos (ex.: cancelar a newsletter pelo link no e-mail);</li>
          <li>Peticionar perante a ANPD.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8">8. Contato do encarregado (DPO)</h2>
        <p>
          Para exercer os seus direitos ou tirar dúvidas sobre esta política, entre em contato:{" "}
          <a
            href="mailto:privacidade@urbanoconnect.com.br"
            className="text-green-600 underline"
          >
            privacidade@urbanoconnect.com.br
          </a>
        </p>

        <h2 className="text-xl font-semibold mt-8">9. Alterações</h2>
        <p>
          Esta política pode ser atualizada. Mudanças relevantes serão comunicadas na
          plataforma e a versão vigente estará sempre disponível nesta página.
        </p>

        <p className="mt-8">
          Veja também os nossos{" "}
          <Link href="/termos" className="text-green-600 underline">
            Termos de Uso
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
