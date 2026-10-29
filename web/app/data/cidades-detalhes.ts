// Dados ricos extraídos dos HTMLs de referência (city001–city010)
// Para cities sem entrada aqui a página exibe gracefully o layout básico

export interface HeroStat {
  val: string;
  lbl: string;
}

export interface CardAnalise {
  titulo: string;
  acento: string; // tailwind bg class para o dot/border colorido
  itens: string[];
}

export interface CidadeDetalhe {
  slug: string;
  heroTitle: string;
  heroSub: string;
  heroStats: HeroStat[];
  pullQuote: string;
  descricao: string;
  tabelaIdentidade: { label: string; valor: string }[];
  analise: CardAnalise[];
  manifestoQuote: string;
}

const DETALHES: CidadeDetalhe[] = [

  // ─── CUIABÁ ──────────────────────────────────────────────────────────
  {
    slug: "cuiaba",
    heroTitle: "Cuiabá é o coração logístico de Mato Grosso. Com contradições à altura.",
    heroSub: "IDH 0,785 — a melhor capital do estado. Crise fiscal decretada em 2025. Saneamento que avança. Espraiamento que não para. Esta é a cidade real.",
    heroStats: [
      { val: "691 mil", lbl: "Habitantes 2025" },
      { val: "0,785",   lbl: "IDH — Alto" },
      { val: "R$ 59,9k", lbl: "PIB per capita" },
      { val: "88%",     lbl: "Rede de esgoto" },
      { val: "#1 MT",   lbl: "Cidade mais inovadora" },
      { val: "R$ 2,5 bi", lbl: "Dívida fiscal 2025" },
    ],
    pullQuote: "Cuiabá é o nó de toda a rede mato-grossense. Saúde, educação, comércio, política — tudo passa por aqui antes de chegar nos outros 141 municípios.",
    descricao: "Fundada às margens do Rio Cuiabá durante o ciclo do ouro, em 1719, a capital mato-grossense carrega séculos de história e concentra, hoje, as contradições de uma metrópole regional em plena transformação. Com quase 692 mil habitantes e crescimento acelerado, Cuiabá enfrenta o desafio clássico das capitais do Centro-Oeste: crescer sem espraiamento, investir sem déficit, modernizar sem excluir.",
    tabelaIdentidade: [
      { label: "Código IBGE",        valor: "5103403" },
      { label: "Gentílico",          valor: "Cuiabano (Papa-peixe)" },
      { label: "Fundação",           valor: "1º de Janeiro de 1719" },
      { label: "Área territorial",   valor: "3.495 km²" },
      { label: "Bioma",              valor: "Cerrado 96% · Pantanal 4%" },
      { label: "Polo regional de",   valor: "142 municípios de MT" },
      { label: "Região Metropolitana", valor: "Vale do Rio Cuiabá" },
      { label: "Prefeito (2025–28)", valor: "Abilio Brunini" },
    ],
    analise: [
      { titulo: "Infraestrutura Urbana", acento: "bg-blue-600",   itens: ["Água potável: 98,1% da população", "Rede de esgoto implantada: 88%", "Coleta de resíduos: 98,32%", "Perdas na distribuição: ~55% ⚠️", "580 domicílios em risco de inundação"] },
      { titulo: "Mobilidade e Transporte", acento: "bg-green-600", itens: ["Sistema de ônibus municipais operante", "BRT — legado Copa 2014 (parcial)", "Aeroporto Marechal Rondon (Várzea Grande)", "Alta dependência do automóvel particular", "Ciclovias insuficientes para o porte"] },
      { titulo: "Saúde", acento: "bg-red-600",    itens: ["Polo de saúde de referência estadual", "HGU, Hospital Júlio Müller, HCT ativos", "Queda de 93% nas internações por saneamento", "Dengue endêmica — vigilância permanente", "26 profissionais Mais Médicos em atuação"] },
      { titulo: "Educação", acento: "bg-orange-500", itens: ["UFMT — principal universidade pública do MT", "Taxa de alfabetização: 96,7%", "IDEB Anos Iniciais: 5,8 · Anos Finais: 5,0", "Mais de 20 instituições de ensino superior", "Meta IDEB 6,0 ainda não atingida nos finais"] },
      { titulo: "Economia", acento: "bg-yellow-600", itens: ["PIB per capita: R$ 59.997 (IBGE 2023)", "131.571 empresas ativas (Receita Federal)", "+6.438 empregos líquidos gerados em 2025", "Calamidade fiscal — dívida R$ 2,5 bi", "IFGF Liquidez: nota zero — pior capital BR"] },
      { titulo: "Segurança", acento: "bg-purple-600", itens: ["Criminalidade acima da média nacional", "RM Cuiabá-Várzea Grande: índices elevados", "PM-MT, PC-MT e GM Municipal ativos", "Alta sinistralidade nas rodovias de acesso", "Novo Plano Diretor inclui segurança urbana"] },
    ],
    manifestoQuote: "Cuiabá não é apenas a maior cidade de Mato Grosso — é o nó que conecta tudo o que o estado é e o que ainda será.",
  },

  // ─── VÁRZEA GRANDE ───────────────────────────────────────────────────
  {
    slug: "varzea-grande",
    heroTitle: "A cidade que o MT usa mas raramente celebra.",
    heroSub: "2ª maior cidade do estado. 4ª economia do MT. Sede do único aeroporto internacional da capital. Lugar de indústria, passagem e potencial ainda não realizado plenamente.",
    heroStats: [
      { val: "318 mil",  lbl: "Habitantes 2025" },
      { val: "R$ 14 bi", lbl: "PIB municipal — 4ª MT" },
      { val: "0,734",    lbl: "IDH — Médio" },
      { val: "R$ 1 bi+", lbl: "Investimentos Estado 2022–25" },
      { val: "29 km",    lbl: "Corredor BRT em implantação" },
      { val: "#2 MT",    lbl: "2ª maior cidade do estado" },
    ],
    pullQuote: "Várzea Grande é a segunda maior cidade do Mato Grosso, mas vive à sombra da capital que abriga seu próprio aeroporto. Quando MT decola — literalmente — é do solo várzea-grandense que parte.",
    descricao: "Fundada em 15 de maio de 1867, às margens do Rio Cuiabá, Várzea Grande cresceu ao longo do século XX como cidade industrial e dormitório da capital. Hoje, com mais de 318 mil habitantes e a 4ª maior economia do estado, a cidade acumula investimentos históricos e começa a escrever um capítulo próprio de desenvolvimento urbano — impulsionada pelo BRT metropolitano, pelo Parque Tecnológico e por R$ 1 bilhão+ em obras estruturantes do Governo do Estado.",
    tabelaIdentidade: [
      { label: "Código IBGE",        valor: "5108402" },
      { label: "Gentílico",          valor: "Várzea-grandense" },
      { label: "Fundação",           valor: "15 de Maio de 1867" },
      { label: "Área territorial",   valor: "939,89 km²" },
      { label: "Bioma",              valor: "Cerrado / Pantanal" },
      { label: "Distância de Cuiabá", valor: "~8 km" },
      { label: "Região Metropolitana", valor: "Vale do Rio Cuiabá" },
      { label: "Prefeita (2025–28)", valor: "Flávia Moretti (PL)" },
    ],
    analise: [
      { titulo: "Polo Industrial",    acento: "bg-blue-600",   itens: ["Maior polo industrial da Região Metropolitana", "Setor de confecções com expressão nacional", "Parque Industrial do Coxipó do Ouro", "Agroindústrias e processamento de carnes", "VAB industrial em crescimento contínuo"] },
      { titulo: "Logística e Acesso", acento: "bg-green-600",  itens: ["Aeroporto Internacional Marechal Rondon", "BR-364 e MT-040 cortam o município", "BRT metropolitano — 29 km em implantação", "Armazéns e transporte de grãos", "Ponte sobre o Rio Cuiabá — acesso à capital"] },
      { titulo: "Urbanização",        acento: "bg-orange-500", itens: ["Crescimento populacional acelerado", "Bairros novos surgindo ao sul da cidade", "Loteamentos próximos ao aeroporto em alta", "R$ 1 bi+ em obras estaduais 2022–2025", "Parque Tecnológico em implantação"] },
      { titulo: "Economia",           acento: "bg-yellow-600", itens: ["4ª maior economia do MT", "Serviços e comércio crescendo com a RM", "IDH 0,734 — margem de melhora relevante", "Empregos formais concentrados em indústria e comércio", "Setor de construção civil em expansão"] },
    ],
    manifestoQuote: "Várzea Grande tem o chão onde os aviões pousam, o solo onde as fábricas produzem e o rio que separa as duas cidades — mas une a mesma metrópole.",
  },

  // ─── RONDONÓPOLIS ────────────────────────────────────────────────────
  {
    slug: "rondonopolis",
    heroTitle: "Rondonópolis não espera a colheita chegar. Ela já está processando o futuro.",
    heroSub: "2ª maior economia do MT. Saneamento que supera capitais. PIB per capita acima de Cuiabá. A cidade que o Brasil subestima é a mesma que lidera onde os dados realmente importam.",
    heroStats: [
      { val: "240 mil",   lbl: "Habitantes 2025" },
      { val: "R$ 17,3 bi", lbl: "PIB municipal" },
      { val: "2ª maior",  lbl: "Economia do MT" },
      { val: "99,8%",     lbl: "Água potável" },
      { val: "91,6%",     lbl: "Rede de esgoto" },
      { val: "R$ 1,88 bi", lbl: "Receitas municipais 2024" },
    ],
    pullQuote: "O maior crescimento de PIB em valores absolutos de todo o Mato Grosso em um único ano — R$ 4,44 bilhões a mais em 2021. Rondonópolis não estava na sala. Agora ela puxa a cadeira.",
    descricao: "A vocação econômica que começou com o boi e a soja evoluiu para processamento, beneficiamento e industrialização. Com PIB de R$ 17,3 bilhões e receitas municipais de R$ 1,88 bilhão em 2024, Rondonópolis é hoje a cidade onde Mato Grosso agrega valor — e onde o cerrado se converte em óleo, ração, aço, confecção e divisas.",
    tabelaIdentidade: [
      { label: "Código IBGE",        valor: "5107602" },
      { label: "Gentílico",          valor: "Rondonopolitano" },
      { label: "Área territorial",   valor: "4.824,5 km²" },
      { label: "Bioma",              valor: "100% Cerrado" },
      { label: "Rio principal",      valor: "Rio Vermelho" },
      { label: "Posição MT (pop.)",  valor: "3ª cidade mais populosa" },
      { label: "Posição MT (PIB)",   valor: "2ª maior economia" },
      { label: "Prefeito (2025–28)", valor: "Claudio Ferreira de Souza" },
    ],
    analise: [
      { titulo: "Agroindustria",     acento: "bg-green-700",  itens: ["Maior polo de esmagamento de soja do Brasil", "Maior polo misturador de fertilizantes do interior", "Maior produção estadual de ração animal", "Frigoríficos com padrão de exportação internacional", "VAB industrial de R$ 4,18 bi — 2º do MT"] },
      { titulo: "Saneamento Modelo", acento: "bg-teal-600",   itens: ["Água potável: 99,8% da população", "Esgoto adequado: 91,6% — supera Cuiabá", "Coleta de lixo: 97,5%", "Supera Goiânia e Campo Grande no Censo 2022", "Internações por saneamento caíram 93% desde 2012"] },
      { titulo: "Nó Logístico",      acento: "bg-orange-500", itens: ["Cruzamento das BRs 163 e 364 — artérias do MT", "Principal hub de distribuição do sul do estado", "Corredor de escoamento: MT → Porto de Santos", "Capital do Bitrem — frota pesada estrutural", "Acesso ferroviário em planejamento avançado"] },
    ],
    manifestoQuote: "Rondonópolis não está na sombra de Cuiabá. Está construindo sua própria luz.",
  },

  // ─── SINOP ───────────────────────────────────────────────────────────
  {
    slug: "sinop",
    heroTitle: "Sinop não espera Cuiabá lembrar dela. Ela já é a capital do Nortão.",
    heroSub: "500 km de distância. 600 mil pessoas na macro-região. 638 estabelecimentos de saúde. R$ 1,7 bilhão em obras. A cidade que mais cresce sem pedir licença.",
    heroStats: [
      { val: "210 mil",  lbl: "Habitantes 2025" },
      { val: "R$ 59,8k", lbl: "PIB per capita 2023" },
      { val: "56 mun.",  lbl: "Polo da macro-região" },
      { val: "638",      lbl: "Est. de saúde ativos" },
      { val: "8,45",     lbl: "Mort. infantil/mil — baixa" },
      { val: "R$ 206 mi", lbl: "Superávit fiscal 2024" },
    ],
    pullQuote: "Sinop polariza uma macro-região de 56 municípios e mais de 600 mil habitantes. É para cá que o norte do MT converge em busca de comércio, educação, saúde, serviços jurídicos e financeiros.",
    descricao: "Com superávit fiscal de R$ 206 milhões em 2024 e receitas de R$ 1,37 bi contra despesas de R$ 1,16 bi, Sinop apresenta um dos perfis fiscais mais saudáveis entre os grandes municípios do MT. Em menos de 50 anos de existência, tornou-se o principal centro de convergência do norte mato-grossense.",
    tabelaIdentidade: [
      { label: "Código IBGE",        valor: "5107206" },
      { label: "Gentílico",          valor: "Sinopense" },
      { label: "Fundação",           valor: "15 de Setembro de 1979" },
      { label: "Área territorial",   valor: "3.942 km²" },
      { label: "Bioma",              valor: "Amazônia / Cerrado (transição)" },
      { label: "Localização",        valor: "BR-163, km 500 de Cuiabá" },
      { label: "Polo de",            valor: "56 municípios · 600 mil hab." },
      { label: "Prefeito (2025–28)", valor: "Marani Salete Marin" },
    ],
    analise: [
      { titulo: "Hub Regional",       acento: "bg-blue-600",   itens: ["Polo de 56 municípios e 600 mil habitantes", "Maior concentração de serviços do norte de MT", "Clínicas e hospitais de referência para o Pará sul", "Shopping, universidades, atacados servem a região", "População flutuante 3× maior que a residente"] },
      { titulo: "Polo de Saúde",      acento: "bg-red-600",    itens: ["638 estabelecimentos de saúde (2023)", "+50 novos estabelecimentos a cada 11 meses", "Mortalidade infantil: 8,45/mil — excelente", "Referência para o sul do Pará", "Hospital Regional em expansão permanente"] },
      { titulo: "Corredor BR-163",    acento: "bg-green-600",  itens: ["40 km de travessia urbana da maior rodovia do Brasil", "Toda a produção do Norte de MT ruma ao Porto de Santarém", "Ativo logístico estratégico para o século XXI", "Comércio madeireiro e de insumos agrícolas concentrado", "Superávit fiscal de R$ 206 mi em 2024"] },
    ],
    manifestoQuote: "Sinop não espera Cuiabá lembrar dela. Ela já é a capital do Nortão.",
  },

  // ─── LUCAS DO RIO VERDE ──────────────────────────────────────────────
  {
    slug: "lucas-do-rio-verde",
    heroTitle: "Aqui, o Brasil provou que crescer rápido e crescer bem não se excluem.",
    heroSub: "1.152% de crescimento em 31 anos. IFDM 0,816 — 1º do MT. Superávit fiscal. UFMT chegando. Lucas do Rio Verde não é apenas a cidade que mais cresceu — é a que melhor cresceu.",
    heroStats: [
      { val: "95.792",   lbl: "Habitantes 2025" },
      { val: "R$ 98,3k", lbl: "PIB per capita — 2º MT" },
      { val: "0,816",    lbl: "IFDM FIRJAN — 1º MT" },
      { val: "1.152%",   lbl: "Crescimento desde 1991" },
      { val: "99,13%",   lbl: "Escolarização 6–14 anos" },
      { val: "140+",     lbl: "Países que importam" },
    ],
    pullQuote: "De 6.693 habitantes em 1991 para 95.792 em 2025: crescimento de 1.152% — o maior do Brasil entre municípios com mais de 50 mil habitantes nas últimas três décadas.",
    descricao: "Lucas do Rio Verde é uma anomalia positiva no mapa urbano brasileiro: cresceu mais que qualquer outra cidade do país nas últimas três décadas e, ao mesmo tempo, manteve e melhorou seus indicadores sociais. A BRF (Sadia e Perdigão), Bunge, ADM e Cargill instalaram plantas industriais que processam soja, milho e proteína animal em escala global.",
    tabelaIdentidade: [
      { label: "Código IBGE",        valor: "5105259" },
      { label: "Gentílico",          valor: "Lucas-verde-rioense" },
      { label: "Fundação",           valor: "13 de Maio de 1987" },
      { label: "Área territorial",   valor: "3.662 km²" },
      { label: "Bioma",              valor: "Cerrado / Amazônia (transição)" },
      { label: "Localização",        valor: "BR-163, 336 km de Cuiabá" },
      { label: "IFDM FIRJAN",        valor: "0,816 — 1º MT, 1º Centro-Oeste" },
      { label: "Prefeito (2025–28)", valor: "Miguel Vaz (PSD)" },
    ],
    analise: [
      { titulo: "Capital da Agroindústria", acento: "bg-green-700", itens: ["BRF (Sadia/Perdigão) — maior planta do Centro-Oeste", "Bunge, ADM e Cargill com plantas industriais", "270 mil hectares cultivados", "690 mil toneladas/ano de carnes processadas", "Exporta alimentos para mais de 140 países"] },
      { titulo: "Crescimento Recorde",      acento: "bg-blue-600",  itens: ["1.152% de crescimento em 31 anos — maior do Brasil", "3,83% de crescimento em 2025 — 2º nacional", "4.000 moradias entregues pelo programa habitacional", "UFMT confirmada com início em 2026", "Receitas brutas de R$ 821 mi em 2024"] },
      { titulo: "Desenvolvimento Humano",   acento: "bg-purple-600",itens: ["IFDM 0,816 — entre os 4,6% mais desenvolvidos do Brasil", "1º MT e 1º Centro-Oeste entre municípios acima de 50 mil", "Escolarização 6–14 anos: 99,13%", "Mortalidade infantil entre as menores de MT", "IDH Alto — entre os melhores do estado"] },
    ],
    manifestoQuote: "Aqui, o Brasil provou que crescer rápido e crescer bem não se excluem.",
  },

  // ─── SORRISO ─────────────────────────────────────────────────────────
  {
    slug: "sorriso",
    heroTitle: "O município que produz mais do que qualquer outro no Brasil.",
    heroSub: "R$ 8,3 bilhões em produção agrícola. 1% de todo o agro nacional. Maior produtor de soja e milho do país em valor. Uma cidade pequena com impacto gigantesco.",
    heroStats: [
      { val: "124,7 mil", lbl: "Habitantes 2025" },
      { val: "R$ 124 mil", lbl: "PIB per capita — 3º MT" },
      { val: "0,744",     lbl: "IDH — Alto" },
      { val: "R$ 8,3 bi", lbl: "Produção agrícola — 1º BR" },
      { val: "US$ 2,6 bi", lbl: "Exportações — líder MT" },
      { val: "#5 MT",     lbl: "5ª cidade mais populosa" },
    ],
    pullQuote: "Sorriso é o paradoxo perfeito do Brasil agrário: uma cidade de 125 mil pessoas que alimenta o mundo. Seu território produz mais do que muitos estados inteiros.",
    descricao: "Fundada em 13 de maio de 1986 como projeto de colonização planejada às margens da BR-163, Sorriso nasceu do sul e cresceu para o norte junto com a fronteira agrícola brasileira. Em menos de 40 anos, transformou-se na maior produtora agrícola do Brasil, com R$ 8,3 bilhões em valor de produção (2023) — liderando o ranking nacional pelo quinto ano consecutivo.",
    tabelaIdentidade: [
      { label: "Código IBGE",        valor: "5107925" },
      { label: "Gentílico",          valor: "Sorrisiense" },
      { label: "Fundação",           valor: "13 de Maio de 1986" },
      { label: "Área territorial",   valor: "9.293,63 km²" },
      { label: "Bioma",              valor: "Cerrado / Amazônia (transição)" },
      { label: "Localização",        valor: "BR-163, km 742 — Norte do MT" },
      { label: "Distância de Cuiabá", valor: "398 km" },
      { label: "Prefeito (2025–28)", valor: "Alei Fernandes (UNIÃO)" },
    ],
    analise: [
      { titulo: "Capital Nacional do Agronegócio", acento: "bg-yellow-600", itens: ["R$ 8,3 bi em produção agropecuária — 1º do Brasil (2023)", "2,08 mi de ton. de soja + 2,4 bi de milho", "Líder nacional pelo 5º ano consecutivo", "Posição de destaque em algodão e feijão", "1% de todo o agronegócio nacional"] },
      { titulo: "Corredor de Exportação",          acento: "bg-green-700",  itens: ["Km 742 da BR-163 — ponto central do maior corredor de grãos", "Rota para os portos do Pará (Santarém) e Santos", "Trading companies, armazéns e logística multimodal", "US$ 2,6 bi em exportações — líder do estado", "Infraestrutura de armazenagem de padrão internacional"] },
      { titulo: "Cidade que se Descobre",          acento: "bg-blue-600",   itens: ["Novos hospitais, shoppings, universidades", "A icônica Kasbier — símbolo da nova identidade urbana", "IDH 0,744 — Alto desenvolvimento", "PIB per capita R$ 124 mil — 3º maior do MT", "Qualidade de vida crescendo junto com o skyline"] },
    ],
    manifestoQuote: "Sorriso prova que o Brasil rural pode ser também o Brasil moderno.",
  },

  // ─── TANGARÁ DA SERRA ────────────────────────────────────────────────
  {
    slug: "tangara-da-serra",
    heroTitle: "Agro, água e cultura no coração do Sudoeste.",
    heroSub: "Divisor de duas bacias. Cachoeiras e Serra dos Parecis. Polo de saúde regional com R$ 995 mi em investimentos desde 2019.",
    heroStats: [
      { val: "114,6 mil", lbl: "Habitantes 2025" },
      { val: "R$ 52,6k", lbl: "PIB per capita 2023" },
      { val: "0,729",    lbl: "IDH — Médio alto" },
      { val: "R$ 171 mi", lbl: "Investimentos Estado 2026" },
      { val: "R$ 995 mi", lbl: "Total invest. desde 2019" },
      { val: "#6 MT",    lbl: "6ª cidade mais populosa" },
    ],
    pullQuote: "Tangará da Serra é a cidade que ninguém esperava encontrar no cerrado mato-grossense: produtiva como o campo, rica como uma metrópole regional — e bela como as cachoeiras que esconde na Serra dos Parecis.",
    descricao: "Emancipada em 13 de maio de 1976, Tangará da Serra cresceu sobre a Serra Tapirapuã e a Serra dos Parecis, no divisor de águas entre as bacias Amazônica e do Prata. Com 51% do território ocupado pela Terra Indígena Parecis, é uma cidade de contrastes: agronegócio exportador e floresta preservada convivendo lado a lado.",
    tabelaIdentidade: [
      { label: "Código IBGE",        valor: "5107958" },
      { label: "Gentílico",          valor: "Tangaraense" },
      { label: "Fundação",           valor: "13 de Maio de 1976" },
      { label: "Área territorial",   valor: "11.636,26 km²" },
      { label: "Bioma",              valor: "Cerrado / Amazônia (transição)" },
      { label: "Localização",        valor: "Sudoeste de MT — 240 km de Cuiabá" },
      { label: "Terra Indígena",     valor: "~51% do território (Parecis)" },
      { label: "Prefeito (2025–28)", valor: "Vander Alberto Masson" },
    ],
    analise: [
      { titulo: "Agronegócio Diversificado", acento: "bg-green-700", itens: ["Soja, milho, algodão, cana-de-açúcar e pecuária de corte", "28 mil empregos formais · 2 mil novas empresas em 2022", "Sem dependência de uma única cultura — resiliência ao mercado", "Usinas de etanol e biodiesel em operação", "Exportações crescentes para o mercado global"] },
      { titulo: "Ecoturismo e Natureza",     acento: "bg-teal-600",  itens: ["Cachoeiras do Rio Sepotuba — destino ecoturístico", "Mirante do Centro Geodésico — ponto único do Brasil", "Comunidades indígenas Parecis com turismo cultural", "Divisor entre as bacias Amazônica e do Prata", "Serra dos Parecis — único planalto da região"] },
      { titulo: "Polo Regional de Serviços", acento: "bg-blue-600",  itens: ["Capital não oficial do Sudoeste mato-grossense", "Hospital Regional — R$ 139 mi, 53% concluído", "UNEMAT campus Tangará — polo de ensino regional", "100 mil estudantes regionais dependem dos serviços", "R$ 995 mi investidos pelo Estado desde 2019"] },
    ],
    manifestoQuote: "Tangará está no divisor de águas entre dois dos maiores sistemas hidrográficos do mundo: Amazônia e Prata. Sua posição geográfica é única no Brasil — e poucos sabem disso.",
  },

  // ─── PRIMAVERA DO LESTE ──────────────────────────────────────────────
  {
    slug: "primavera-do-leste",
    heroTitle: "Uma cidade pequena com PIB de metrópole.",
    heroSub: "PIB per capita R$ 100.664 — o maior do MT. 7ª maior economia do estado com apenas 96 mil habitantes. Irrigação, agroindústria, bioenergia e inovação no coração do cerrado.",
    heroStats: [
      { val: "96 mil",    lbl: "Habitantes 2025" },
      { val: "R$ 100,7k", lbl: "PIB per capita — 1º MT" },
      { val: "0,752",     lbl: "IDH — Alto" },
      { val: "40 mil ha", lbl: "Área irrigada — 1º MT" },
      { val: "R$ 57,5 mi", lbl: "Superávit fiscal 2024" },
      { val: "7,59",      lbl: "Mort. infantil/mil — baixa" },
    ],
    pullQuote: "A 7ª maior economia de um estado que é o maior produtor agrícola do Brasil. Isso, com menos de 100 mil habitantes, diz tudo sobre Primavera do Leste.",
    descricao: "Primavera do Leste é um paradoxo virtuoso: com menos de 100 mil habitantes, sustenta o maior PIB per capita do Mato Grosso — R$ 100.664 em 2023. Isso só é possível graças a uma agricultura altamente tecnificada, com a maior área irrigada do estado, e à presença de gigantes da agroindústria como Cargill, FS Bioenergia e LongPing High-Tech.",
    tabelaIdentidade: [
      { label: "Código IBGE",        valor: "5106752" },
      { label: "Gentílico",          valor: "Primarosense" },
      { label: "Fundação",           valor: "17 de Março de 1986" },
      { label: "Área territorial",   valor: "5.470,38 km²" },
      { label: "Bioma",              valor: "Cerrado" },
      { label: "Localização",        valor: "Leste de MT — 236 km de Cuiabá" },
      { label: "Área irrigada",      valor: "40 mil ha — 1º do MT" },
      { label: "Prefeito (2025–28)", valor: "Julio Campos (PL)" },
    ],
    analise: [
      { titulo: "PIB per Capita #1 MT",   acento: "bg-yellow-600", itens: ["R$ 100.664 — maior PIB per capita do Mato Grosso", "7ª maior economia do estado com 96 mil hab.", "+2.027 empregos formais líquidos em 2025", "14 mil empresas ativas · +300 abertas em 2025", "Salário médio: 3,7 salários mínimos"] },
      { titulo: "Agroindústria de Ponta", acento: "bg-green-700", itens: ["Cargill — beneficiamento algodão e insumos", "FS Bioenergia — etanol e proteína de milho", "LongPing High-Tech — sementes e P&D", "4º maior exportador do MT — US$ 965 mi (2020)", "558 mil ha agricultáveis · 40 mil ha irrigados"] },
      { titulo: "Finanças Municipais",    acento: "bg-blue-600",  itens: ["Superávit fiscal 2024: +R$ 57,5 mi", "Receitas R$ 772,8 mi × Despesas R$ 715,3 mi", "Crescimento 2022–2025: +12,8%", "95,8% da população em zona urbana", "IDHM 0,752 — Alto desenvolvimento"] },
    ],
    manifestoQuote: "A terra mais produtiva do cerrado não está aqui por acaso — está aqui por tecnologia e visão.",
  },

  // ─── CÁCERES ─────────────────────────────────────────────────────────
  {
    slug: "caceres",
    heroTitle: "O rio não separa — o rio conecta. E em Cáceres, o rio é tudo.",
    heroSub: "Capital Nacional da Pesca Esportiva, sede da UNEMAT, porta do Pantanal e cidade com 245 anos de história.",
    heroStats: [
      { val: "90 mil",    lbl: "Habitantes 2025" },
      { val: "245 anos",  lbl: "De história — fundada 1780" },
      { val: "R$ 31,2k",  lbl: "PIB per capita" },
      { val: "Guinness",  lbl: "FIPe — maior pesca do mundo" },
      { val: "+R$ 19,2 mi", lbl: "Superávit fiscal 2024" },
      { val: "24.499 km²", lbl: "Área territorial" },
    ],
    pullQuote: "O FIPe é reconhecido pelo Guinness Book como o maior festival de pesca embarcada motorizada em água doce do mundo. Cáceres não é apenas uma cidade no mapa — é um evento que para o Brasil inteiro.",
    descricao: "Cáceres é uma das cidades mais singulares do Brasil. Com 245 anos de história, guarda uma identidade cultural profunda ligada ao Rio Paraguai e ao Pantanal. A UNEMAT — universidade estadual de MT — tem sua reitoria aqui, e o FIPe coloca a cidade no mapa internacional do turismo, movimentando economicamente toda a região.",
    tabelaIdentidade: [
      { label: "Código IBGE",        valor: "5101803" },
      { label: "Gentílico",          valor: "Caceresense" },
      { label: "Fundação",           valor: "6 de Outubro de 1780" },
      { label: "Área territorial",   valor: "24.499,56 km²" },
      { label: "Bioma",              valor: "Cerrado / Pantanal" },
      { label: "Rio principal",      valor: "Rio Paraguai" },
      { label: "Fronteira",          valor: "Bolívia — San Matías" },
      { label: "Prefeito (2025–28)", valor: "Antonio Rolim de Moura (UNIÃO)" },
    ],
    analise: [
      { titulo: "Turismo e Pesca Esportiva", acento: "bg-teal-600",   itens: ["FIPe — maior festival de pesca do mundo (Guinness)", "42ª edição em 2025 — 150 mil visitantes", "14 mil embarcações regularizadas no Rio Paraguai", "Rede de pousadas em 200 km do rio", "Capital Nacional da Pesca Esportiva — oficial"] },
      { titulo: "Educação e UNEMAT",         acento: "bg-purple-600", itens: ["Sede da Reitoria da UNEMAT — fundada em 1978", "Escolarização 6–14 anos: 97,14%", "Centro de Inovação RISC — tecnologia aplicada", "Laboratório de Ictiologia do Pantanal", "Polo regional de ensino superior do oeste de MT"] },
      { titulo: "Pantanal e Meio Ambiente",  acento: "bg-green-600",  itens: ["Porta de entrada do Pantanal mato-grossense", "Fauna rica: dourado, pacu, jacaré, onça, aves", "Ecoturismo com pousadas especializadas", "Fronteira internacional com a Bolívia", "Porto fluvial — navegação pelo Rio Paraguai"] },
    ],
    manifestoQuote: "O rio não separa — o rio conecta. E em Cáceres, o rio é tudo.",
  },

  // ─── BARRA DO GARÇAS ─────────────────────────────────────────────────
  {
    slug: "barra-do-garcas",
    heroTitle: "Onde a água ferve, o rio brilha e o cerrado ainda guarda segredos.",
    heroSub: "Termas naturais de 31°C a 43°C, praias de rio, Serra Azul e o maior rebanho de novilho precoce do MT. Com R$ 100 mi em obras para 2026.",
    heroStats: [
      { val: "65 mil",    lbl: "Habitantes 2025" },
      { val: "R$ 51,1k",  lbl: "PIB per capita 2023" },
      { val: "0,748",     lbl: "IDH" },
      { val: "R$ 100 mi", lbl: "Obras planejadas 2026" },
      { val: "+R$ 16,6 mi", lbl: "Superávit fiscal 2024" },
      { val: "31°C–43°C", lbl: "Termas naturais" },
    ],
    pullQuote: "A gestão prevê R$ 100 milhões em investimentos para 2026 — saneamento, escolas, parques, asfalto e a orla Beira Rio com 1 km de lazer no Araguaia. Barra do Garças está construindo sua próxima versão.",
    descricao: "Barra do Garças é uma cidade em aceleração. Com superávit fiscal de R$ 16,6 milhões em 2024 e um pacote de R$ 100 milhões em obras previstas para 2026, a gestão municipal demonstra capacidade de planejamento pouco comum em cidades de mesmo porte. Localizada na divisa MT-GO, é portal para o Araguaia e para a chapada leste.",
    tabelaIdentidade: [
      { label: "Código IBGE",        valor: "5101902" },
      { label: "Gentílico",          valor: "Barragarçense" },
      { label: "Fundação",           valor: "11 de Outubro de 1953" },
      { label: "Área territorial",   valor: "9.078,57 km²" },
      { label: "Bioma",              valor: "Cerrado" },
      { label: "Rio principal",      valor: "Rio Araguaia" },
      { label: "Divisa",             valor: "Mato Grosso — Goiás" },
      { label: "Prefeito (2025–28)", valor: "João Gandarela (PSD)" },
    ],
    analise: [
      { titulo: "Infraestrutura e Obras",  acento: "bg-blue-600",  itens: ["R$ 100 mi em 15 obras previstas para 2026", "Orla Beira Rio — 1 km de lazer no Araguaia", "Superávit fiscal 2024: +R$ 16,6 mi", "Rebanho bovino: +1 milhão de cabeças", "Saneamento no distrito industrial — R$ 13,5 mi"] },
      { titulo: "Turismo e Natureza",      acento: "bg-orange-500",itens: ["Termas naturais de 31°C a 43°C — únicas no MT", "Praias fluviais do Rio Araguaia", "Serra Azul — trilhas e natureza preservada", "2.600 regularizações fundiárias concluídas", "Maior rebanho de novilho precoce do MT"] },
      { titulo: "Educação e Social",       acento: "bg-green-600", itens: ["Escolarização 6–14 anos: 97,77%", "IDEB anos iniciais: 5,3", "Reconstrução da Escola Dom José — R$ 7,9 mi", "Escola nova no Jd. dos Ipês — R$ 20 mi", "Hidroginástica e natação para idosos — ativo"] },
    ],
    manifestoQuote: "Onde a água ferve, o rio brilha e o cerrado ainda guarda segredos.",
  },

  // ─── NOVA MUTUM ──────────────────────────────────────────────────────
  {
    slug: "nova-mutum",
    heroTitle: "37 anos de história. R$ 136 mil de PIB per capita. Um bilhão exportado.",
    heroSub: "Um dos casos mais impressionantes de desenvolvimento planejado do interior brasileiro. Agronegócio de alto valor, superávit fiscal e crescimento contínuo.",
    heroStats: [
      { val: "63.455",    lbl: "Habitantes 2025" },
      { val: "+3,64%",    lbl: "Crescimento 2024–25" },
      { val: "R$ 136,9k", lbl: "PIB per capita — topo BR" },
      { val: "US$ 1 bi",  lbl: "Exportações 2025" },
      { val: "R$ 627,9 mi", lbl: "Receitas municipais 2024" },
      { val: "+R$ 87,7 mi", lbl: "Superávit fiscal 2024" },
    ],
    pullQuote: "Em apenas 37 anos de emancipação, Nova Mutum construiu um PIB per capita de R$ 136.949 — entre os maiores do Brasil para cidades de médio porte.",
    descricao: "Nova Mutum é um dos casos mais impressionantes de desenvolvimento planejado do interior brasileiro. Sustentado por um complexo agroindustrial que inclui Perdigão, Bunge, Excelência e dezenas de empresas que somam R$ 5 bilhões em investimentos, a cidade desafia o Brasil a repensar o que é possível em 37 anos.",
    tabelaIdentidade: [
      { label: "PIB per capita (2023)", valor: "R$ 136.949 — topo BR" },
      { label: "Receitas municipais",   valor: "R$ 627,9 mi (2024)" },
      { label: "Superávit fiscal",      valor: "+R$ 87,7 mi (2024)" },
      { label: "Salário médio",         valor: "R$ 3.387,86 (2024)" },
      { label: "Exportações",           valor: "US$ 1,045 bi (2025)" },
      { label: "Ranking exportador MT", valor: "6º lugar" },
      { label: "Pop. Censo 2022",       valor: "55.839 hab." },
      { label: "Posição MT (pop.)",     valor: "11º município" },
    ],
    analise: [
      { titulo: "Agroindústria de Alto Valor", acento: "bg-green-700", itens: ["PIB per capita R$ 136.949 — entre os maiores do Brasil", "Perdigão, Bunge, Excelência e R$ 5 bi em investimentos", "US$ 1 bilhão exportado em 2025 — 6º exportador do MT", "Superávit fiscal de R$ 87,7 mi em 2024", "Salário médio de R$ 3.387,86 — acima da média MT"] },
    ],
    manifestoQuote: "37 anos de história. R$ 136 mil de PIB per capita. Um bilhão exportado. Nova Mutum não teve sorte — teve planejamento.",
  },

  // ─── ALTA FLORESTA ───────────────────────────────────────────────────
  {
    slug: "alta-floresta",
    heroTitle: "Aqui vivem 593 espécies de aves — e uma delas foi descoberta em 2025.",
    heroSub: "Portal da Amazônia Legal mato-grossense. A maior riqueza ecológica do estado, pecuária de qualidade e turismo na floresta.",
    heroStats: [
      { val: "62.158",   lbl: "Habitantes 2025" },
      { val: "+1,4%",    lbl: "Crescimento 2024–25" },
      { val: "593 sp.",  lbl: "Espécies de aves — #1 MT" },
      { val: "R$ 51,8k", lbl: "PIB per capita 2023" },
      { val: "0,714",    lbl: "IDH Municipal" },
      { val: "700 mil",  lbl: "Cabeças de gado" },
    ],
    pullQuote: "Alta Floresta tem a maior riqueza ecológica de Mato Grosso — 593 espécies de aves, Cristalino Lodge, Parque do Cristalino — mas ainda não converteu esse patrimônio natural em riqueza econômica proporcional.",
    descricao: "Alta Floresta carrega uma dualidade única: é a porta de entrada da Amazônia Legal mato-grossense, com floresta preservada e biodiversidade de classe mundial, mas enfrenta o desafio de equilibrar desenvolvimento econômico e conservação ambiental. Com PIB per capita de R$ 51.773 e IDH de 0,714, ainda há muito potencial a ser realizado.",
    tabelaIdentidade: [
      { label: "Pop. Censo 2022",    valor: "58.613 hab." },
      { label: "PIB per capita",     valor: "R$ 51.773 (2023)" },
      { label: "IDH Municipal",      valor: "0,714 — médio" },
      { label: "Mortalidade infantil", valor: "9,04 — baixa (2023)" },
      { label: "Espécies de aves",   valor: "593 — #1 MT" },
      { label: "Rebanho bovino",     valor: "700 mil cabeças" },
      { label: "Nova espécie",       valor: "Torom-de-AF — descoberta 2025" },
      { label: "Bioma",              valor: "100% Amazônia" },
    ],
    analise: [
      { titulo: "Ecoturismo e Biodiversidade", acento: "bg-green-800", itens: ["593 espécies de aves — maior diversidade do MT", "Cristalino Lodge — referência mundial de ecoturismo", "Parque Estadual do Cristalino — floresta preservada", "Nova espécie descoberta em 2025 (Torom-de-AF)", "Turismo de observação de aves em expansão global"] },
      { titulo: "Amazônia e Preservação",     acento: "bg-teal-700",  itens: ["Portal da Amazônia Legal mato-grossense", "Floresta com alta pressão de desmatamento histórico", "Pecuária com 700 mil cabeças de gado", "Mortalidade infantil 9,04 — uma das mais baixas do MT", "Potencial turístico ainda subaproveitado"] },
    ],
    manifestoQuote: "Aqui vivem 593 espécies de aves — e uma delas foi descoberta em 2025. A Amazônia de Alta Floresta ainda tem segredos.",
  },

  // ─── PONTES E LACERDA ────────────────────────────────────────────────
  {
    slug: "pontes-e-lacerda",
    heroTitle: "A porta do extremo oeste. Fronteira viva com a Bolívia.",
    heroSub: "37.058 km² de fronteira agrícola. Pecuária extensiva, soja em expansão e comércio de fronteira internacional.",
    heroStats: [
      { val: "~55 mil",  lbl: "Habitantes" },
      { val: "37.058 km²", lbl: "Área territorial" },
      { val: "~R$ 34,2k", lbl: "PIB per capita" },
      { val: "0,650",    lbl: "IDH Municipal" },
      { val: "Bolívia",  lbl: "Fronteira — San Matías" },
      { val: "1976",     lbl: "Fundação" },
    ],
    pullQuote: "Pontes e Lacerda é o principal município da faixa de fronteira no extremo oeste mato-grossense — onde a agropecuária, o comércio de fronteira e a logística internacional se encontram.",
    descricao: "Fundada em 1976 no contexto da colonização do oeste brasileiro, a cidade cresceu impulsionada pela agropecuária, pelo comércio de fronteira com a Bolívia e pela chegada de migrantes do sul do país. Com 37.058 km² de área territorial, é um dos maiores municípios de MT em extensão.",
    tabelaIdentidade: [
      { label: "Fundação",           valor: "1976" },
      { label: "Área territorial",   valor: "37.058 km²" },
      { label: "PIB per capita",     valor: "~R$ 34.200" },
      { label: "IDH Municipal",      valor: "0,650" },
      { label: "Fronteira",          valor: "Bolívia — San Matías" },
      { label: "Vocação",            valor: "Pecuária · Soja · Comércio" },
    ],
    analise: [
      { titulo: "Fronteira e Comércio", acento: "bg-red-700", itens: ["Fronteira internacional com a Bolívia (San Matías)", "Comércio bilateral em crescimento", "Pecuária extensiva — principal atividade econômica", "Soja em expansão desde os anos 2000", "37.058 km² — um dos maiores municípios do MT"] },
    ],
    manifestoQuote: "Na fronteira do extremo oeste, onde o Brasil encontra a Bolívia, Pontes e Lacerda guarda o último portal da fronteira agrícola.",
  },

  // ─── CAMPO NOVO DO PARECIS ───────────────────────────────────────────
  {
    slug: "campo-novo-do-parecis",
    heroTitle: "75% do milho-pipoca que o Brasil consome vem daqui.",
    heroSub: "Capital mundial do milho-pipoca. 9ª economia do MT. Girassol #1 do Brasil. Etanol de milho e sementes de soja de alta performance.",
    heroStats: [
      { val: "~50 mil", lbl: "Habitantes" },
      { val: "R$ 2,9 bi", lbl: "PIB Municipal" },
      { val: "9ª MT",   lbl: "Maior economia" },
      { val: "75%",     lbl: "Pipoca do Brasil" },
      { val: "#1 BR",   lbl: "Girassol" },
      { val: "~R$ 57k", lbl: "PIB per capita" },
    ],
    pullQuote: "Campo Novo do Parecis não é apenas mais uma cidade do agronegócio — é a capital mundial do milho-pipoca e o maior produtor de girassol do Brasil.",
    descricao: "Fundada em 1986 por migrantes do sul do país que enxergaram no cerrado mato-grossense uma oportunidade única, Campo Novo do Parecis transformou-se em menos de quatro décadas em um dos municípios mais produtivos do Brasil — não apenas em volume, mas em diversificação e tecnologia agrícola.",
    tabelaIdentidade: [
      { label: "Fundação",         valor: "1986" },
      { label: "Área Territorial", valor: "9.448 km²" },
      { label: "PIB Municipal",    valor: "R$ 2,9 bi" },
      { label: "PIB per capita",   valor: "~R$ 57.000" },
      { label: "IDH Municipal",    valor: "0,718" },
      { label: "Ranking MT",       valor: "9ª economia" },
      { label: "Milho-Pipoca",     valor: "#1 do Brasil (75%)" },
      { label: "Girassol",         valor: "#1 do Brasil" },
    ],
    analise: [
      { titulo: "Agronegócio Diversificado", acento: "bg-yellow-600", itens: ["75% do milho-pipoca consumido no Brasil produzido aqui", "#1 produtor de girassol do Brasil", "Maior produtor de sementes de soja de MT", "Etamil Bioenergia — etanol de milho em operação", "9ª maior economia do estado"] },
    ],
    manifestoQuote: "75% do milho-pipoca que o Brasil consome vem daqui. Campo Novo do Parecis alimenta o cinema de uma nação.",
  },

  // ─── JUÍNA ───────────────────────────────────────────────────────────
  {
    slug: "juina",
    heroTitle: "Antes chamada de Terra Esquecida. Hoje, polo do noroeste.",
    heroSub: "Cidade planejada no meio da selva amazônica. Garimpo de diamantes, floresta, pecuária e serviços em expansão.",
    heroStats: [
      { val: "~48 mil", lbl: "Habitantes" },
      { val: "R$ 1,8 bi", lbl: "PIB Municipal" },
      { val: "26.251 km²", lbl: "Área territorial" },
      { val: "~720 km", lbl: "De Cuiabá" },
      { val: "0,716",   lbl: "IDH — Alto" },
      { val: "~9.500",  lbl: "Empregos formais" },
    ],
    pullQuote: "O Projeto Juína, de 1976, foi idealizado para criar uma cidade planejada no meio da selva amazônica — com módulos urbanísticos definidos antes dos primeiros moradores chegarem.",
    descricao: "Antes de se tornar cidade, a região era chamada de 'Terra Esquecida'. Emancipada em 1982, Juína cresceu como polo do noroeste mato-grossense, combinando garimpo de diamantes, pecuária extensiva, floresta amazônica e serviços para uma vasta região de difícil acesso.",
    tabelaIdentidade: [
      { label: "Emancipação",      valor: "09/05/1982" },
      { label: "Área Territorial", valor: "26.251 km²" },
      { label: "PIB per capita",   valor: "~R$ 40 mil" },
      { label: "IDH Municipal",    valor: "0,716 — Alto" },
      { label: "Empregos formais", valor: "~9.500" },
      { label: "Garimpo",          valor: "Diamantes — ativo" },
      { label: "Aeroporto",        valor: "Azul Conecta operante" },
      { label: "Distância Cuiabá", valor: "~720 km" },
    ],
    analise: [
      { titulo: "Polo do Noroeste", acento: "bg-cyan-700", itens: ["Maior cidade do noroeste mato-grossense", "Aeroporto com linha comercial (Azul Conecta)", "Garimpo de diamantes — ativo e regulamentado", "IDH 0,716 — Alto (acima da média MT)", "Centro de serviços para região remota de ~720 km de Cuiabá"] },
    ],
    manifestoQuote: "Antes era Terra Esquecida. Hoje é polo do noroeste. Juína prova que distância não é destino.",
  },

  // ─── CONFRESA ────────────────────────────────────────────────────────
  {
    slug: "confresa",
    heroTitle: "Portal do MATOPIBA mato-grossense. Fronteira agrícola do Araguaia.",
    heroSub: "O município mais populoso da microrregião Norte Araguaia. Soja em expansão, pecuária extensiva e crescimento urbano de 4,7% ao ano.",
    heroStats: [
      { val: "~38.500", lbl: "Habitantes" },
      { val: "R$ 2 bi", lbl: "PIB Municipal" },
      { val: "4,7%",    lbl: "Crescimento urbano a.a." },
      { val: "~R$ 56k", lbl: "PIB per capita" },
      { val: "99 pts",  lbl: "Score crescimento Caravela" },
      { val: "~6.600",  lbl: "Empregos formais" },
    ],
    pullQuote: "O nome vem da Colonizadora Frenova Sapeva — empresa que detinha as Fazendas Reunidas Nova Amazônia. Em três décadas, tornou-se o município mais populoso da microrregião.",
    descricao: "Tornou-se distrito em 1990 e município autônomo em 1991. Em pouco mais de três décadas, cresceu para se tornar o município mais populoso da microrregião Norte Araguaia, com crescimento urbano de 4,7% ao ano segundo a UFMT e um dos maiores scores de crescimento do Brasil.",
    tabelaIdentidade: [
      { label: "Emancipação",      valor: "20/12/1991" },
      { label: "Área Territorial", valor: "5.796 km²" },
      { label: "PIB per capita",   valor: "~R$ 56 mil" },
      { label: "Crescimento urbano", valor: "4,7% a.a. (UFMT)" },
      { label: "Empregos formais", valor: "~6.600" },
      { label: "Score Caravela",   valor: "99 pontos" },
      { label: "Fronteira",        valor: "Pará · Tocantins" },
      { label: "Distância Cuiabá", valor: "~1.165 km" },
    ],
    analise: [
      { titulo: "Crescimento Acelerado", acento: "bg-yellow-700", itens: ["4,7% de crescimento urbano ao ano — acima da média MT", "99 pontos no Score de Crescimento Caravela", "Município mais populoso da microrregião Norte Araguaia", "Soja em expansão desde 2010 — fronteira agrícola ativa", "PIB per capita de ~R$ 56 mil — acima da média MT"] },
    ],
    manifestoQuote: "Na fronteira entre o cerrado e a Amazônia, no limite de três estados, Confresa cresce sem parar.",
  },

  // ─── PEIXOTO DE AZEVEDO ──────────────────────────────────────────────
  {
    slug: "peixoto-de-azevedo",
    heroTitle: "Não foi colonizada — foi garimpada.",
    heroSub: "Polo regional do extremo norte. De garimpo de ouro a cidade de serviços e agronegócio em expansão.",
    heroStats: [
      { val: "~33.754", lbl: "Habitantes 2025" },
      { val: "R$ 35 mil", lbl: "PIB per capita" },
      { val: "14.433 km²", lbl: "Área territorial" },
      { val: "0,649",    lbl: "IDH Municipal" },
      { val: "+R$ 13,9 mi", lbl: "Superávit 2024" },
      { val: "136 km",   lbl: "De Alta Floresta" },
    ],
    pullQuote: "No final dos anos 1970, a corrida pelo ouro no norte de Mato Grosso atraiu milhares de pessoas para a região do Rio Peixoto. Garimpeiros de todo o Brasil chegaram com bateia, picareta e esperança.",
    descricao: "Peixoto de Azevedo não foi colonizada — foi garimpada. A história do ouro moldou sua identidade e sua população. Hoje, com a fronteira agrícola chegando, a cidade transiciona para um novo ciclo — mas ainda carrega os desafios de seu passado.",
    tabelaIdentidade: [
      { label: "Identidade Histórica", valor: "Garimpo de ouro" },
      { label: "Área Territorial",    valor: "14.433 km²" },
      { label: "PIB per capita",      valor: "R$ 35.042 (2023)" },
      { label: "IDHM",               valor: "0,649" },
      { label: "Mortalidade infantil", valor: "15,72 / mil nascidos" },
      { label: "Superávit 2024",      valor: "R$ 13,9 mi" },
      { label: "Bioma",              valor: "Amazônia / Cerrado" },
      { label: "Distância Cuiabá",   valor: "~788 km" },
    ],
    analise: [
      { titulo: "Transição Econômica", acento: "bg-amber-700", itens: ["De garimpo de ouro a polo de serviços regionais", "Fronteira agrícola chegando à região", "Superávit fiscal de R$ 13,9 mi em 2024", "Agropecuária em expansão junto com a BR-163", "Cidade de 33 mil hab. serve região ampla"] },
    ],
    manifestoQuote: "Nasceu do garimpo, cresceu com o agro. Peixoto de Azevedo ainda está escrevendo sua história.",
  },

  // ─── ÁGUA BOA ────────────────────────────────────────────────────────
  {
    slug: "agua-boa",
    heroTitle: "Referência estadual em educação pública. Polo do médio leste.",
    heroSub: "3º em telediagnósticos no SUS de MT. Escolarização 99,2%. Polo regional de comércio e serviços para 30+ municípios.",
    heroStats: [
      { val: "32.099", lbl: "Habitantes" },
      { val: "0,729",  lbl: "IDH — Médio-Alto" },
      { val: "R$ 42k", lbl: "PIB per capita" },
      { val: "99,2%",  lbl: "Escolarização 6–14 anos" },
      { val: "3º MT",  lbl: "Telediagnósticos SUS" },
      { val: "30+",    lbl: "Municípios atendidos" },
    ],
    pullQuote: "Água Boa conquistou a 3ª colocação em MT no uso de telediagnósticos em 2025 — sistema que permite que pacientes do SUS realizem exames especializados sem se deslocar centenas de quilômetros.",
    descricao: "Água Boa é referência estadual em educação pública e polo regional de comércio e serviços para mais de 30 municípios vizinhos. Com escolarização de 99,2% na faixa de 6 a 14 anos e um aeroporto municipal com pista pavimentada, a cidade demonstra que boas políticas públicas fazem diferença mesmo em localizações remotas.",
    tabelaIdentidade: [
      { label: "IDH Municipal",      valor: "0,729 — Médio-Alto" },
      { label: "PIB per capita",     valor: "R$ 41.982" },
      { label: "Receitas (2024)",    valor: "R$ 100,99 mi" },
      { label: "Despesas (2024)",    valor: "R$ 86,72 mi" },
      { label: "Mortalidade infantil", valor: "18,78 por mil nascidos" },
      { label: "Escolarização 6–14", valor: "99,2%" },
      { label: "Telediagnóstico MT", valor: "3º lugar (2025)" },
      { label: "Aeroporto",         valor: "Pista pavimentada operativa" },
    ],
    analise: [
      { titulo: "Polo Regional de Serviços", acento: "bg-sky-600", itens: ["Polo regional para 30+ municípios do médio leste", "3º lugar em MT no uso de telediagnósticos SUS (2025)", "Escolarização 6–14 anos: 99,2% — elite nacional", "Aeroporto com pista pavimentada operativa", "IDH 0,729 — Médio-Alto, acima de várias cidades maiores"] },
    ],
    manifestoQuote: "Polo do médio leste, referência em educação e inovação no SUS. Água Boa prova que tamanho não é documento.",
  },

  // ─── COLÍDER ─────────────────────────────────────────────────────────
  {
    slug: "colider",
    heroTitle: "Polo de saúde e educação do Vale do Teles Pires.",
    heroSub: "Microrregião de 11 municípios. Centro regional de serviços, educação técnica e atendimento de saúde especializado.",
    heroStats: [
      { val: "32.054", lbl: "Habitantes" },
      { val: "0,713",  lbl: "IDH Municipal" },
      { val: "R$ 62,4k", lbl: "PIB per capita 2023" },
      { val: "11 mun.", lbl: "Microrregião atendida" },
      { val: "R$ 192,9 mi", lbl: "Receitas 2024" },
      { val: "1976",   lbl: "Emancipação" },
    ],
    pullQuote: "Colíder exerce função de polo de saúde regional, atendendo demandas dos 11 municípios da microrregião do Vale do Teles Pires.",
    descricao: "Fundada em 7 de maio de 1974 e emancipada em 1976, Colíder cresceu como centro regional do Vale do Teles Pires. Conta com infraestrutura de educação técnica e faculdades que atendem toda a área de influência, reforçando seu papel como polo educacional e de saúde do norte mato-grossense.",
    tabelaIdentidade: [
      { label: "Fundação",           valor: "7 de maio de 1974" },
      { label: "Emancipação",        valor: "18 de junho de 1976" },
      { label: "Pop. Censo 2022",    valor: "32.054 hab." },
      { label: "IDH Municipal",      valor: "0,713" },
      { label: "PIB per capita",     valor: "R$ 62.423 (2023)" },
      { label: "Receitas brutas",    valor: "R$ 192,93 mi (2024)" },
      { label: "Despesas",           valor: "R$ 177,12 mi (2024)" },
      { label: "Mortalidade infantil", valor: "22,09 por mil (2023)" },
    ],
    analise: [
      { titulo: "Polo do Vale do Teles Pires", acento: "bg-stone-600", itens: ["Polo de saúde regional para 11 municípios", "Educação técnica e faculdades atendendo toda a microrregião", "PIB per capita R$ 62.423 — acima de cidades maiores", "Receitas brutas R$ 192,9 mi com superávit fiscal", "Agropecuária e madeireiro como base econômica"] },
    ],
    manifestoQuote: "Entre o cerrado e a Amazônia, Colíder serve como âncora de serviços para todo o Vale do Teles Pires.",
  },

  // ─── GUARANTÃ DO NORTE ───────────────────────────────────────────────
  {
    slug: "guarantã-do-norte",
    heroTitle: "Último município de MT antes do Pará. Epicentro do debate: desenvolvimento ou floresta?",
    heroSub: "100% Amazônia. Ponto crítico da BR-163 — o maior corredor logístico do Brasil Central.",
    heroStats: [
      { val: "31.209", lbl: "Habitantes" },
      { val: "0,703",  lbl: "IDH Municipal" },
      { val: "R$ 41,5k", lbl: "PIB per capita 2023" },
      { val: "100%",   lbl: "Bioma Amazônia" },
      { val: "R$ 255,2 mi", lbl: "Receitas 2024" },
      { val: "231",    lbl: "Alertas desmat./semestre" },
    ],
    pullQuote: "Guarantã é ponto crítico do maior corredor logístico do Brasil Central — epicentro do debate entre desenvolvimento econômico e preservação da Floresta Amazônica.",
    descricao: "Fundada em 2 de junho de 1981, o município nasceu no contexto da abertura e pavimentação da BR-163, que transformou o extremo norte mato-grossense em zona de colonização acelerada. Hoje, é o último município de MT antes da fronteira com o Pará, posição estratégica que implica tanto oportunidades logísticas quanto responsabilidades ambientais.",
    tabelaIdentidade: [
      { label: "Fundação",           valor: "2 de junho de 1981" },
      { label: "Bioma",              valor: "100% Amazônia" },
      { label: "Altitude",           valor: "345 metros" },
      { label: "IDH Municipal",      valor: "0,703" },
      { label: "PIB per capita",     valor: "R$ 41.462 (2023)" },
      { label: "Receitas brutas",    valor: "R$ 255,2 mi (2024)" },
      { label: "Alertas desmatam.",  valor: "231 / 51 km² por semestre" },
      { label: "Fronteira",         valor: "Pará — BR-163" },
    ],
    analise: [
      { titulo: "Corredor BR-163 e Amazônia", acento: "bg-blue-800", itens: ["Último município de MT na BR-163 antes do Pará", "100% de bioma Amazônia — responsabilidade ambiental máxima", "231 alertas de desmatamento por semestre — pressão real", "Receitas brutas R$ 255,2 mi em 2024", "Logística regional estratégica no norte do estado"] },
    ],
    manifestoQuote: "Na fronteira da Amazônia, onde o asfalto acaba e a floresta começa, Guarantã do Norte guarda o portal mais sensível do MT.",
  },
];

// Map slug → detalhe para lookup O(1)
const MAPA = new Map(DETALHES.map(d => [d.slug, d]));

export function getCidadeDetalhe(slug: string): CidadeDetalhe | null {
  return MAPA.get(slug) ?? null;
}
