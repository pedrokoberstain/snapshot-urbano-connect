import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Uso | Urbano Connect",
  description: "Condições de uso da plataforma Urbano Connect.",
};

const ATUALIZACAO = "11 de junho de 2026";
const VERSAO = "1.0";

export default function TermosDeUso() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12 text-zinc-800">
      <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
      <p className="text-sm text-zinc-500 mb-8">
        Versão {VERSAO} — última atualização em {ATUALIZACAO}
      </p>

      <section className="space-y-6 leading-relaxed">
        <h2 className="text-xl font-semibold">1. Sobre a plataforma</h2>
        <p>
          A <strong>Urbano Connect</strong> é uma plataforma de inteligência imobiliária que
          conecta interessados a corretores anunciantes de imóveis urbanos e rurais em Mato
          Grosso, oferecendo também dados de mercado, cotações agro e ferramentas de análise.
          Ao criar uma conta ou usar o site, você concorda com estes termos.
        </p>

        <h2 className="text-xl font-semibold mt-8">2. Cadastro e conta</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Você deve fornecer informações verdadeiras, completas e atualizadas;</li>
          <li>Você é responsável pela guarda da sua senha e pelas ações na sua conta;</li>
          <li>Corretores devem possuir registro CRECI válido para anunciar imóveis;</li>
          <li>
            Podemos suspender contas que violem estes termos, a legislação ou que pratiquem
            fraude.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8">3. Anúncios e responsabilidades</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            As informações dos imóveis (preço, área, documentação, fotos) são de
            responsabilidade exclusiva do corretor anunciante;
          </li>
          <li>
            As estimativas de preço e o score de oportunidade são <strong>indicativos
            estatísticos</strong>, não constituem laudo de avaliação nem recomendação de
            investimento;
          </li>
          <li>
            A Urbano Connect não intermedia, não garante e não participa da negociação entre
            interessado e corretor.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8">4. Plano PRO e pagamentos</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            A assinatura PRO é processada pelo <strong>Mercado Pago</strong> (cartão de crédito
            ou PIX);
          </li>
          <li>A cobrança da assinatura por cartão é recorrente até o cancelamento;</li>
          <li>
            O cancelamento pode ser solicitado a qualquer momento e interrompe as cobranças
            futuras;
          </li>
          <li>Os preços podem ser alterados mediante aviso prévio na plataforma.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8">5. Uso aceitável</h2>
        <p>É proibido:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Publicar conteúdo falso, ilegal ou que viole direitos de terceiros;</li>
          <li>Usar robôs, scrapers ou meios automatizados para extrair dados do site;</li>
          <li>Tentar burlar mecanismos de segurança ou acessar contas de terceiros;</li>
          <li>Usar os dados de contato de leads para fins alheios à negociação imobiliária.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8">6. Propriedade intelectual</h2>
        <p>
          A marca, o layout, o código e as bases de dados da Urbano Connect são protegidos. As
          fotos e textos dos anúncios pertencem aos respectivos anunciantes.
        </p>

        <h2 className="text-xl font-semibold mt-8">7. Privacidade</h2>
        <p>
          O tratamento dos seus dados pessoais é regido pela nossa{" "}
          <Link href="/privacidade" className="text-green-600 underline">
            Política de Privacidade
          </Link>
          , em conformidade com a LGPD.
        </p>

        <h2 className="text-xl font-semibold mt-8">8. Limitação de responsabilidade</h2>
        <p>
          A plataforma é fornecida &quot;como está&quot;. Não nos responsabilizamos por
          negociações realizadas entre usuários, por indisponibilidades temporárias do serviço
          nem por decisões tomadas com base nas ferramentas de análise.
        </p>

        <h2 className="text-xl font-semibold mt-8">9. Alterações e foro</h2>
        <p>
          Estes termos podem ser atualizados, com aviso na plataforma. Fica eleito o foro da
          comarca de Cuiabá/MT para dirimir eventuais controvérsias, com renúncia a qualquer
          outro.
        </p>

        <h2 className="text-xl font-semibold mt-8">10. Contato</h2>
        <p>
          Dúvidas sobre estes termos:{" "}
          <a href="mailto:contato@urbanoconnect.com.br" className="text-green-600 underline">
            contato@urbanoconnect.com.br
          </a>
        </p>
      </section>
    </main>
  );
}
