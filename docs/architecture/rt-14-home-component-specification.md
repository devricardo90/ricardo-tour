# RT-14 — Especificação de componentes da Home

- **Status:** especificação documental local consolidada conforme as decisões do Owner de 18/09/2026; sincronização com o Source of Truth e encerramento no Jira permanecem pendentes.
- **Ticket:** RT-14 / RT-RB-S1-05 — Sprint 1, Design Foundation
- **Base visual:** Home consolidada aprovada em 18/09/2026; opção B
**Limite:** especificação e inventário somente. Não implementa componentes nem decide o gate RT-15.

## 1. Critério canônico, dependências e autoridade

O Jira RT-14 está em **BACKLOG / READY**. Seu critério de aceite publicado é: **“Component inventory e estados definidos.”** A validação pede evidência do design system; o Jira não declara dependências nem possui issue links para RT-14. O critério foi relido durante esta execução e não diverge do rascunho.

O Source of Truth atribui a RT-14 a especificação de componentes (seção 9, decisão RT-12/RT-13, 18/09/2026) e lista RT-RB-S1-05 como “Especificar componentes: nav, buttons, cards, fields e badges”, com modo AGENT e DoD “Component inventory e estados definidos” (seção 4, Sprint 1 — Design Foundation). RT-10 e RT-11 são as bases precedentes, ambas concluídas. RT-12 e RT-13 foram confirmadas como **Concluído** no Jira e fornecem a Home desktop/mobile aprovada.

Dependência de governança: o gate separado RT-15 / RT-RB-S1-GATE continua em **BACKLOG / READY**. Seu critério é “Ricardo aprova base antes de motion implementation”. Esta especificação registra as decisões de sistema e interação que o Owner aprovou; não registra o resultado final do gate, não transiciona RT-15 e não autoriza motion ou implementação da Home.

### Decisões do Owner — aprovadas em 18/09/2026

| Decisão | Regra aprovada | Justificativa e impacto | Limite desta especificação |
|---|---|---|---|
| Tokens interativos dourados da Home | Criar tokens semânticos escopados à Home, derivados dos estados dourados RT-10. Preservar `--primary: #123A28` global e todos os consumidores existentes fora da Home. | Mantém continuidade com as CTAs aprovadas sem regressão em áreas existentes. Variantes, foregrounds, hover, pressed, foco e disabled são mapeados na seção 6. | Só documentação; não alterar `app/globals.css`, Tailwind nem componentes compartilhados. |
| Menu mobile | Especificar navegação compacta expansível e localizada PT/EN/ES, incluindo abertura/fechamento, teclado, foco, Escape, semântica e responsividade. | Corrige a lacuna do preview consolidado, que oculta a navegação em mobile sem representar o menu expansível aprovado. Detalhes estão em 3.1 e na matriz da seção 4. | Só especificação; não implementar menu, não alterar o preview e não escolher comportamento modal não aprovado. |
| Legibilidade | Metadados secundários: referência mínima 12px. Texto de controles: referência mínima 14px. Manter a escala RT-11 dos cards, que já respeita o mínimo de 12px. | Exige reflow e ajustes localizados em textos pequenos e controles antes da implementação; a relação de exceções está na seção 5. | Não redesenhar a Home nem alterar seus screenshots nesta tarefa. Medir o contraste final por estado e superfície na implementação. |

### Fontes verificadas

- Source of Truth: seções 1 (governança e princípios), 2 (conceito e sequência da Home), 4 (sprints e RT-RB-S1-05), 6 (execution gate), 7 (decisões RT-10/RT-11), 9 (reconciliações RT-10 a RT-13, opção B, RT-14 e RT-15).
- Jira: RT-14, descrição, Acceptance Criteria, Validation, Evidence, Dependencies e status; RT-15, gate e critério de aceite. RT-12 e RT-13 foram relidas para confirmar o status atual.
- RT-10: docs/architecture/rt-10-design-tokens.md e docs/baseline/rt-home-design-approved/references/rt-10-design-tokens.md.
- RT-11: docs/architecture/rt-11-typography-system.md e docs/baseline/rt-home-design-approved/references/rt-11-typography-system.md.
- Home aprovada: docs/baseline/rt-home-design-approved/preview/complete-home/phase-b-ai-concierge-refined-preview.html, folhas CSS referenciadas, capturas desktop/mobile, OWNER-APPROVAL.md, MANIFEST.md e validation/playwright-validation.md.

**Nota de reconciliação documental:** o registro da opção B na seção 9 preserva o status “BACKLOG / READY” de RT-12/RT-13 vigente quando aquela entrada foi escrita. O Jira agora mostra ambos como Concluído. A linha é histórica e não foi alterada nesta execução.

## 2. Contrato visual aprovado

Esta especificação descreve a composição e medidas observadas no HTML consolidado; medidas observadas são referência de implementação, não novas decisões de design. Preservar RT-10, RT-11 e as proporções desktop/mobile aprovadas. A tipografia de card não pode ficar abaixo do mínimo do Owner.

### Tokens RT-10

| Papel | Valor aprovado |
|---|---|
| Charcoal / fundo escuro | #0B0E11 |
| Superfície escura | #15191D |
| Elevada | #1C2227 |
| Superfície muted | #232A30 |
| Texto primário escuro | #F4F0E8 |
| Texto secundário escuro | #CAC7BF |
| Texto muted | #9DA3A5 |
| Off-white | #F3EFE6 |
| Superfície clara | #FCF9F2 |
| Texto primário claro | #171A1E |
| Texto secundário claro | #53565A |
| Borda escura / clara | #3A4147 / #CFC7BA |
| Dourado fosco / dourado claro | #C8A86B / #E8C780 |
| Núcleo luminoso (mídia cinematográfica) | #FFF1CC |
| Foco em superfície clara | #8A6A2B |

Escala de spacing aprovada: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 112 px. Gutters: mobile 20 px, tablet 32 px, desktop 48 px. Conteúdo: largura máxima 1280 px. Grid base: 4 colunas/gap 16 px em mobile, 8/gap 20 px em tablet, 12/gap 24 px em desktop. Comportamentos específicos (por exemplo, trilho horizontal de experiências no mobile) preservam a composição RT-12/13 em vez de forçar todos os componentes ao grid abstrato.

Raios: 6, 12, 16, 24, 28 px; pill somente para elementos semanticamente apropriados. Sombras low, medium e high conforme RT-10: 0 8px 24px rgba(0,0,0,.14), 0 16px 44px rgba(0,0,0,.24), 0 28px 70px rgba(0,0,0,.34). Usar os tratamentos específicos do preview para não alterar a aparência aprovada.

Os valores de halo, rim glow e raios do planeta são efeitos exclusivos da mídia hero definidos em RT-10; não aplicá-los a botões, cartões ou bordas de interface.

### Tipografia RT-11

| Uso | Família/peso | Desktop | Mobile | Observação |
|---|---|---:|---:|---|
| H1 hero | Cormorant Garamond 500 | 68px / .82 | 48px / .88 | Display |
| Linha secundária do H1 | Cormorant Garamond 500 | 35px / .82 | 25px / .88 | Display |
| H2 principal | Cormorant Garamond 500 | 32px / 1.02 | 29px / 1.02 | Display |
| AI Concierge H2 | Cormorant Garamond 500 | 54px / 1.02 | 40px / 1.0 | Variação específica da seção no preview |
| Título de card de experiência | Inter 600 | 20px / 1.10 | 20px / 1.10 | Owner: card nunca abaixo de 12px |
| Título de diferencial | Inter 600 | 16px / 1.30 | 14px / 1.30 | Card institucional igual |
| Descrição de card | Inter 400 | 13px / 1.45 | 13px / 1.45 | Preferido pelo Owner |
| Preço/badge compacto de card | Inter 700 | 12px / 1.20 | 12px / 1.20 | Não abaixo de 12px |
| Body de apoio | Inter 400 | 13px / 1.50 | 13px / 1.50 | Mobile PT/EN/ES deve reflow |

Cormorant Garamond é restrita a títulos display/headings principais. Inter é usada em navegação, formulários, botões, cards, textos funcionais e body copy. Pesos aprovados e licenças estão na RT-11; os tamanhos acima são candidatos/valores do preview, sem autorização de produção.

## 3. Inventário e especificação por componente

### 3.1 Skip link, header e navegação

- **Finalidade:** chegar às áreas principais e dar acesso às seções da Home.
- **Variantes:** skip link; marca/link inicial; navegação desktop; disclosure compacto mobile/tablet; CTA “Planeje sua viagem”. O preview consolidado não contém o controle nem o painel de menu; ambos são especificados aqui como comportamento aprovado, não como estado já implementado.
- **Geometria observada:** header com largura máxima 1280 px, altura 92 px desktop, três áreas em grid e gap 30 px; logo 156 px. Em viewport até 620 px, altura 78 px, logo 134 px e CTA 38 px; a navegação desktop é ocultada.
- **Tokens/tipo:** superfície charcoal/transparente e borda dourada translúcida; links Inter 11 px/700 e CTA Inter 11 px/750 no desktop; CTA mobile Inter 9 px. São medidas observadas, abaixo do padrão Owner para controles, e não devem ser levadas à implementação sem ajuste para pelo menos 14 px. Estados visuais dourados seguem o mapeamento escopado da seção 6.
- **Estados reais no preview:** links em default/hover; CTAs em default/hover/active/focus-visible; skip link torna-se visível ao receber foco. Não há estados open/closed de menu no HTML.
- **Estados especificados para a implementação futura:** `closed` (painel oculto e fora da ordem de tabulação) e `open` (links localizados visíveis). Um `<button>` nativo com nome acessível localizado controla o painel via `aria-expanded` e `aria-controls`; o painel contém uma navegação `<nav aria-label>` com links comuns e destinos existentes. Ao abrir, o foco permanece no botão; Enter/Espaço acionam-no nativamente; Tab/Shift+Tab seguem a ordem natural; Escape fecha e devolve foco ao botão; nova ativação fecha; ativar um link fecha o painel e navega para a âncora. Como disclosure não modal, não prender foco, bloquear rolagem nem aplicar `role="menu"`/`menuitem`. Focus-visible precisa permanecer evidente.
- **Responsividade:** acima de 980 px manter os quatro links do preview. Entre 621–980 px, preservar os dois links visíveis e disponibilizar os links ocultados por um disclosure compacto. Em até 620 px, substituir a navegação oculta pelo acionador de menu e expor os quatro destinos localizados; conservar a marca e CTA atuais, ajustando somente o necessário para acomodar controle e texto de 14 px sem overflow. A organização é uma regra de comportamento, não autorização para redesenhar o header.
- **Acessibilidade:** manter nome acessível da marca, `nav` nomeado, skip link, labels localizadas PT/EN/ES, ordem de foco, `aria-expanded` sincronizado com visibilidade e foco visível. O CTA de 38 px é somente geometria observada; verificar tamanho de alvo e reflow na implementação sem alegar conformidade baseada no protótipo.
- **Origem:** HTML aprovado, linhas 243–255; concept.css, regras .site-header, nav e .header-cta; screenshot Home mobile 390 px.

### 3.2 Hero, planeta e jornada de seis estágios

- **Finalidade:** inspiração e narrativa cinematográfica; não é o catálogo de produtos.
- **Variantes/estrutura:** hero com imagem atmosférica, planeta, ponto do Rio, texto, CTA e lista ordenada: Globo → América do Sul → Brasil → Rio → Helicóptero → Cristo.
- **Geometria observada:** hero min-height 710 px desktop e 690 px mobile; heading central; jornada horizontal com seis etapas; mobile usa labels quebráveis/compactas.
- **Tokens/tipo:** RT-10 mídia carvão/dourada e iluminação aprovada; RT-11 H1 Cormorant Garamond. Não introduzir novas luzes em controles.
- **Estados reais:** preview estático; stage 03 aparece como ativo. Não existe sincronização de scroll/progress ou interação clicável nesta referência consolidada.
- **Estados propostos:** nenhum comportamento interativo é assumido nesta especificação. Scroll-scrub/sticky/parallax são trabalho posterior da Sprint 2 e seus próprios critérios/gate; não tratar como implementação existente nem transformar a jornada em navegação de catálogo.
- **Responsividade:** dimensão e crop de mídia mudam conforme CSS do preview; os seis rótulos permanecem representados no mobile.
- **Acessibilidade:** ordem semântica de lista, labels legíveis/localizados e texto de jornada acessível; elementos puramente decorativos ficam ocultos à tecnologia assistiva. Os rótulos de etapa observados em 9px desktop/7px mobile são abaixo do mínimo secundário de 12px: elevar na implementação, preservando as seis etapas, e validar quebra/encaixe PT/EN/ES. Considerar prefers-reduced-motion quando o motion for especificado em seu ticket.
- **Origem:** HTML aprovado, linhas 240–274; concept.css; RT-10; capturas desktop e mobile.

### 3.3 Botões, CTAs e links reutilizáveis

- **Finalidade:** navegação para âncoras e rotas existentes; não prometer resultados/serviços fora do alvo real.
- **Variantes observadas:** CTA de header, CTA primário do hero, tabs do planner, busca visual, link editorial “Conheça nossa história”, links do footer e poster do vídeo.
- **Geometria/tipo:** CTA de header/hero min-height 42 px desktop (38 px no header mobile), padding horizontal 18 px desktop; hero e header têm borda 1 px/radius 6 px. A referência usa texto Inter de 9–13 px conforme a variante; textos de botões e links interativos precisam chegar a pelo menos 14 px, sem alterar a identidade ou o destino aprovado.
- **Tokens:** gold e gold-light no preview; estados RT-10 na tabela de interação abaixo; foco claro/escuro conforme o fundo.
- **Estados reais:** hover, active e focus-visible nos CTAs; hover/focus-visible em links do footer/About; o poster de vídeo é âncora e abre o asset local em nova aba. Links de cards de experiência não existem. Loading não aparece.
- **Estados especificados:** disabled apenas quando uma operação realmente não está disponível, com semântica nativa e tokens RT-10; a busca do preview não se torna operação. Loading só se aplica a ação assíncrona real definida em ticket funcional próprio; nenhum spinner ou resposta é criado nesta especificação.
- **Responsividade:** manter área clicável sem clipping e destino em todas as traduções; evitar que conteúdo longo quebre CTA.
- **Acessibilidade:** usar elemento âncora para navegação e elemento botão para ações, nome acessível específico, foco sempre visível e estado disabled verdadeiro quando aplicável. Não usar link sem destino como se fosse página publicada.
- **Origem:** concept.css, seletores .header-cta/.primary-cta; phase-b-lower.css, about/footer/story; markup do preview aprovado.

### 3.4 Trip Planner — tabs, campos e submit visual

- **Finalidade:** superfície de planejamento visual. A busca de voos é **não operacional**, sem API, resultado ou disponibilidade real.
- **Variantes:** tablist com Voos selecionada e Experiências no Rio não selecionada; campos Origem, Destino, Partida, Retorno, Viajantes; CTA visual “Em avaliação”.
- **Geometria observada:** intro e formulário lado a lado (coluna de 220 px + formulário, gap 40 px) desktop; painel radius 12 px; fields em seis colunas visuais com padding 16 px. Inputs com 34 px de altura; labels observados em 8 px uppercase e valores em 11 px. Em largura ≤980 px intro/form empilham e fields ficam em duas colunas; ≤620 px fields ficam em uma coluna, labels com min-height 62 px e submit com altura mínima 58 px. Estas alturas são da prévia, não garantia de encaixe após aplicar o texto mínimo de controles.
- **Tokens/tipo:** superfície clara RT-10, Inter; CTA visual dourado (#C8A86B) com texto escuro; foco #8A6A2B no claro. Campos/controlos serão no mínimo 14 px e labels/metadados no mínimo 12 px; ajustar altura/reflow somente para acomodar esse requisito sem alterar a estrutura aprovada. Descrição/campos são dados ilustrativos do preview, não dados preenchidos por usuário.
- **Estados reais:** campos em default/filled/placeholder; select mostra 1 viajante; tab Voos contém classe active e aria-selected=true; a outra false. Não existe JS de troca de tabs/painel, validação, loading, erro ou resultados. Form bloqueia submit via onsubmit=false. Botão recebe aria-disabled=true, mas não o atributo disabled nativo e continua focável; registrar como ressalva semântica do protótipo.
- **Estados especificados:** default/filled/placeholder no protótipo; implementação futura acrescenta focus-visible perceptível. `disabled` só para controle indisponível de verdade; `invalid`/`aria-invalid` e mensagem associada somente após regra de validação definida no contrato funcional. Loading/erro/resultados não existem nem podem ser simulados pela RT-14. Se tabs vierem a ser funcionais, expor painel e seleção coerente; comportamento e conteúdo ficam em escopo funcional próprio.
- **Responsividade:** no mobile, manter todos os campos em uma coluna, ordem estável e CTA visível; permitir tradução longa sem largura mínima fixa.
- **Acessibilidade:** labels explicitamente associados, nunca depender de placeholder como label, foco perceptível e tablist somente se houver interação real de tabs. O CTA “Em avaliação” está `aria-disabled=true` e continua focável no protótipo; definir sua apresentação sem sugerir ação operacional e usar semântica/estado inativo coerentes na implementação. Labels 8 px e valores 11 px são exceções observadas: ajustar para metadados ≥12 px e controles ≥14 px; validar reflow no mobile sem propor nova composição.
- **Origem:** HTML aprovado, linhas 276–295; concept.css, regras .planner/.planner-tabs/.planner-fields/.search-button; RT-10/RT-11.

### 3.5 Experience Card e trilho de experiências

- **Finalidade:** catálogo visual de seis experiências, cada card com fotografia, título e descrição. Búzios é Rio e arredores, não município do Rio; manter a distinção editorial aprovada.
- **Variantes atuais:** seis dados/cards na ordem do HTML aprovado; a referência não mostra preço, badge de preço, CTA individual ou disponibilidade. Não converter artigo estático em link sem destino aprovado.
- **Geometria observada:** desktop 3 colunas, gap 16 px, altura mínima 290 px, radius 12 px; imagens cobrem o card com crops por imagem. Mobile é trilho horizontal snap, cada card ocupa 82% do grid e tem min-height 320 px. Tablet em duas colunas.
- **Tokens/tipo:** imagem + gradiente carbón; título Inter 600 20/1.10; descrição Inter 400 13/1.45; preço/badge, se vier a existir, Inter 700 12/1.20. O Owner estabeleceu 12 px como mínimo absoluto de texto de card e 13 px como preferido para descrição.
- **Estados reais:** somente default estático; sem hover/focus/selected/disabled/loading definidos para cards porque não são controles. Crops são imagem específica e devem permanecer conforme a evidência aprovada.
- **Estados candidatos:** se card se tornar link em um ticket futuro, fornecer foco e estado hover, manter destino único e definir nome acessível sem repetir conteúdo. Nenhum estado de disponibilidade/booking é inferido.
- **Responsividade:** conservar seis cards, ordem, trilho horizontal mobile e scroll-snap; overflow interno do trilho é intencional, sem overflow horizontal do documento.
- **Acessibilidade:** texto alternativo descreve a fotografia, heading do card permanece no heading tree e descrição não é incorporada apenas em imagem. Scroll horizontal testável por teclado/gesto se mantido.
- **Origem:** HTML aprovado, linhas 297–327; concept.css .experience-grid/.experience-card; typography.css; RT-11.

### 3.6 Cards de diferenciais e faixa institucional

- **Finalidade:** três diferenciais de serviço em cards e um bloco institucional independente; não criar claims além da copy aprovada.
- **Variantes:** cards 01 orientação personalizada, 02 turismo local, 03 atendimento em três idiomas; bloco 04 “Referência institucional” com a composição completa de cinco marcas. Copy sem registro/número/certificação.
- **Geometria observada:** desktop três colunas de cards e faixa institucional 04 abaixo, full width; cards min-height 212 px, padding 22×20 px, radius 16 px, gap 16 px. Tablet duas colunas. Mobile: 01/02 lado a lado, 03 ocupa linha inteira, 04 ocupa linha inteira; card 04 empilha copy e marcas. Marcas mobile em 3+2, recorte visual individual via viewBox sem alterar o asset-fonte; desktop mostra a composição horizontal integral.
- **Tokens/tipo:** fundo carvão, superfície #15191D, borda dourada translúcida; headings Inter 600 16 px desktop/14 px mobile, body Inter 400 13 px. Índices são decorativos e aria-hidden.
- **Estados reais:** default; as marcas não são links nem ações. Não há estado de credencial verificada; “Referência institucional” é apresentação visual neutra.
- **Estados candidatos:** nenhum estado de interação. Não usar aparência de badge como prova de afiliacão, avaliação ou certificação individual.
- **Acessibilidade:** alt/nomes acessíveis preservam a identificação de cada marca sem anunciar claim; asset completo no desktop e sequência legível no mobile. Garantir leitura e proporção de cada SVG/recorte. Eyebrows são metadados e devem atingir pelo menos 12 px.
- **Origem:** HTML aprovado, seção #why-rick-travel; regras inline institucionais no HTML e phase-b-lower.css; asset public/logos/logo-turismo.webp.

### 3.7 Rio Story — mídia editorial

- **Finalidade:** contar a história do destino por vídeo e duas fotografias editoriais; não duplicar o hero.
- **Variantes:** poster/vídeo com play visual; foto de pôr do sol; foto do interior da igreja, cada uma com legenda.
- **Geometria observada:** desktop grid 1.55:1:1, gap 18 px, slots min-height 300 px, radius 16 px. Mobile: vídeo primeiro, full width, ratio 1.62; as duas fotos abaixo em duas colunas, ratio .78, gap 12 px.
- **Tokens/tipo:** seção clara RT-10, bordas/sombras discretas; títulos editoriais em Cormorant Garamond 24 px desktop/19 px mobile; eyebrow/metadata em Inter, no mínimo 12 px conforme decisão do Owner.
- **Estados reais:** poster em default; hover e focus-visible alteram play/poster; âncora abre arquivo MP4 em nova aba. Não há player complexo ou loading/error state na Home.
- **Estados candidatos:** ao manter link de vídeo, não representar play como controle que inicia inline playback. Loading não aplicável ao poster estático. Erros de mídia pertencem à publicação/QA, não inventar mensagem nesta proposta.
- **Acessibilidade:** figure/figcaption, alt de fotos, poster com alt vazio quando a âncora tem nome acessível, foco visível e reduced-motion respeitado. A âncora do poster é controle e deve usar texto acessível equivalente ≥14 px quando visível; microcopy de imagem é metadado ≥12 px.
- **Origem:** HTML aprovado, #rio-story; phase-b-lower.css; assets locais enumerados no manifesto.

### 3.8 AI Concierge — conceito visual não operacional

- **Finalidade:** representar visualmente uma entrada conversacional para descoberta; não é atendimento automatizado ativo.
- **Variantes/estrutura:** copy curta à esquerda com até três bullets e selo “Prévia conceitual · não operacional”; mockup de chat à direita com uma mensagem ilustrativa, campo e botão desabilitados.
- **Geometria observada:** desktop em duas colunas .9fr/1.1fr, gap responsivo clamp 46–82 px; chat max-width 570 px. Empilha em largura ≤820 px. No mobile a seção tem padding vertical 62/66 px, card padding 18×17 px e input min-height 54 px.
- **Tokens/tipo:** fundo charcoal com brilho dourado discreto; título Cormorant 54 px desktop/40 px mobile; body Inter 14 px desktop/13 px mobile; mensagem Inter 13 px desktop/12 px mobile; input observado 12 px desktop/10 px mobile, abaixo do requisito de controle 14 px; microcopy observado 10 px desktop/9 px mobile, abaixo do requisito de metadado 12 px.
- **Estados reais:** input e botão possuem disabled nativo; mensagem ilustrativa fixa; selo conceitual. Não há estado online, typing, envio, resposta, loading, erro ou disponibilidade.
- **Estados candidatos:** nenhuma resposta/estado de operação é especificado aqui. Interação, loading e erro dependem do trabalho de produto/backend relacionado (incluindo RT-RB-S4-04) e de autorização própria; não simular nesta interface.
- **Responsividade:** texto primeiro e chat abaixo; manter a indicação não operacional visível em PT/EN/ES, input inteiro na viewport e sem overflow.
- **Acessibilidade:** nome de demonstração conceitual em card, campo e botão nativamente disabled com labels claras; não colocar “online agora”; anunciar mensagem fixa sem live region de chat ativo. Antes da implementação, elevar input para ≥14 px, metadado para ≥12 px e corpo/mensagem curta para o candidato RT-11 (preferência 13 px); revisar expansão das traduções e contraste real. O estado não operacional deve continuar inequívoco.
- **Origem:** HTML aprovado, #ai-concierge; phase-b-ai-concierge-refinement.css; validação responsiva da Home.

### 3.9 About / Quem Somos

- **Finalidade:** identidade e história institucional Rick Travel, conforme copy aprovada.
- **Variantes:** copy/CTA e fotografia provisória em quadro editorial.
- **Geometria observada:** desktop duas colunas, texto e imagem; mobile empilhado. Imagem em frame ratio 5:6 com object-fit cover e object-position 50% 18%; largura máxima 460 px desktop/390 px mobile.
- **Tokens/tipo:** fundo light-surface, heading Cormorant; body Inter; CTA em dourado escuro compatível com superfície clara.
- **Estados reais:** CTA como link para /quem-somos, hover/focus-visible; fotografia estática.
- **Estados candidatos:** sem loading/disabled. Validar destino de rota e texto localizado quando o componente for integrado.
- **Acessibilidade:** copy não depende da fotografia; alt descreve sujeito/contexto, sem credencial; a própria referência registra fotografia provisória e necessidade de substituição antes da publicação.
- **Origem:** HTML aprovado, #about-rick-travel; regras inline do frame; OWNER-APPROVAL.md.

### 3.10 Footer

- **Finalidade:** contato, navegação, redes sociais, presença Cadastur e informações legais.
- **Variantes/estrutura:** desktop com quatro grupos (marca, contato, navegação, redes); linha institucional separada com Cadastur individual e informação legal; copyright e localidade. Mobile em uma coluna; Cadastur/legal em blocos próprios.
- **Geometria observada:** desktop footer charcoal, quatro colunas 1.2fr/1.25fr/.9fr/1fr e gap 34 px. Até 900 px, duas colunas e marca full-width. Até 620 px, uma coluna e gaps 26 px; marca 174×54 px; bloco institucional em uma coluna; copyright empilhado.
- **Tokens/tipo:** texto primário/secundário RT-10; headings Inter 13/600; links 12/400; logo Rick Travel original. Cadastur usa asset individual, não composição completa de cinco marcas.
- **Estados reais:** links com hover e focus-visible; WhatsApp/e-mail/redes são anchors; texto de Política, Termos e informação legal no HTML atual é <span>, não página navegável. Links observados em 12 px são controles e devem atingir 14 px na implementação; informações secundárias ficam no mínimo em 12 px.
- **Estados candidatos:** manter conteúdo legal sem link enquanto os documentos não existirem; não transformar spans em links falsos. Loading/disabled não se aplicam a links.
- **Acessibilidade:** headings por grupo, nav nomeado, ícones sociais ocultos ao leitor quando texto fornece o nome, telefone sem quebra, e-mail wrap seguro; logos não distorcidos.
- **Origem:** HTML aprovado, #phase-b-footer; regras inline de layout/footer; README do pacote lista dados legais, Política, Termos e Cadastur como pendências de publicação.

### 3.11 Badges, labels e metadados

- **Badge de conceito:** “Prévia conceitual · não operacional” do AI Concierge. Faz parte da comunicação visual aprovada; mantê-lo se a superfície continuar sendo demo.
- **Índices 01–04:** guiam os diferenciais; decoração sem interação, aria-hidden.
- **Marcas institucionais:** imagens/recortes visuais autorizados pelo Owner; não inferir vínculo legal, certificação ou avaliação.
- **Labels do formulário:** labels de campo, tabs e estados; nomeiam controles, não são badges promocionais.
- **Elementos internos de revisão:** aside “PRÉVIA INTERNA · FASE B · OWNER REVIEW”, status-strip e etiqueta de mídia pendente servem à revisão do protótipo e não são componentes comerciais aprovados para produção.
- **Não presentes na Home final aprovada:** badge comercial de preço/disponibilidade nos seis cards, selo de reserva ou status de voo. Regras CSS antigas para preço/pending-flag no arquivo de proposta não justificam implementá-los.

### 3.12 Elementos reutilizáveis identificados

Os itens abaixo são padrões visuais observados e especificados, não uma afirmação de que já existam como componentes React no produto:

- **Section container / section intro:** largura máxima e gutters RT-10; título, eyebrow e copy com reflow independente da seção.
- **Action link / button:** comportamento por semântica (âncora navega, botão aciona), variantes escopadas à Home, foco visível e escala mínima de controle.
- **Surface/card shell:** superfície, borda e raio derivados de RT-10; o conteúdo determina a variante. Cards estáticos não ganham estados interativos sem destino/ação.
- **Media frame:** crop/ratio da fotografia, poster editorial ou logo com proporção preservada, texto alternativo e foco quando a mídia for link.
- **Field + label:** label persistente associada ao controle, valor/placeholder separado e estados nativos; erros somente com regra funcional aprovada.
- **Disclosure header navigation:** acionador, painel e nav nomeado descritos em 3.1; não compartilhado com widgets operacionais sem análise própria.
- **Focus indicator:** anel RT-10 de 3 px/offset de 3 px, validado contra cada superfície real.

## 4. Estados — existente versus candidato

| Componente | Representado no preview aprovado | A especificar somente se houver implementação funcional |
|---|---|---|
| Links e CTAs | Default, hover, active e focus-visible onde aplicável | Reflow e foco mantidos; links não recebem `disabled`; loading não se aplica à navegação |
| Botões | CTAs exibem default/hover/active/focus-visible; CTA de busca visual tem `aria-disabled=true` e segue focável | Usar disabled nativo quando inativo de fato e tokens RT-10; loading apenas para operação assíncrona real descrita por ticket próprio |
| Navegação responsiva | Desktop tem quatro links; ≤980 px a referência esconde links a partir do terceiro; ≤620 px oculta toda a nav | Disclosure especificado closed/open; toggle nativo, `aria-expanded`/`aria-controls`, Escape fecha e restaura foco, ativar link fecha; sem focus trap porque não é modal |
| Tabs do planner | “Voos” ativo/`aria-selected=true`; “Experiências no Rio” inativo; conteúdo é estático | Troca/painel/teclado de tabs somente quando contrato funcional existir; não simular resultados |
| Campos do planner | Valor ilustrativo, placeholder, select default; regras de foco aparecem no CSS base | Focus-visible; disabled/invalid/error somente conforme disponibilidade e regras/API futuras; loading/resultados não se aplicam ao preview |
| Cards de experiências/diferenciais | Default e conteúdo estático; marcas são apresentação, não ações | Hover/focus só se futuramente houver destino/ação aprovados; não inferir seleção, reserva ou disponibilidade |
| Poster do Rio Story | Default, hover/focus-visible; link abre MP4 | Não representar player, loading ou erro que não existe no mockup |
| AI Concierge | Mensagem ilustrativa fixa; input e envio disabled nativamente; selo conceitual visível | Sem resposta, typing, erro, loading ou estado online; qualquer ativação depende de escopo funcional futuro |
| Links About/Footer | Default, hover/focus-visible; destinos válidos no preview | `disabled`/loading não aplicáveis a navegação; não criar links sem página/destino existente |
| Badges e labels | Conteúdo estático; metadados e badges de card respeitam 12 px; itens internos de revisão não são comerciais | Sem interação. Não criar status, preço, credencial ou certificação sem fonte autorizada |

No conjunto da Home, não há estado ativo de formulário real nem estado assíncrono. “Loading” não é um estado visual em falta para este protótipo; adicioná-lo agora poderia sugerir uma funcionalidade que não existe. O menu `closed/open` e o comportamento de teclado são requisitos especificados para implementação, não evidência de interação já existente.

## 5. Acessibilidade e robustez responsiva

Requisitos para implementação futura; nenhuma regra abaixo altera a prévia nesta tarefa:

1. Preservar landmarks, hierarquia de headings, links com destinos válidos, labels associados, nomes acessíveis e textos alternativos.
2. Manter foco visível por teclado; não depender somente de cor, hover ou ícone. Aplicar o contrato do menu em 3.1.
3. Respeitar `prefers-reduced-motion` quando motion for especificado em seu ticket; o HTML consolidado não comprova animação do hero.
4. Manter PT/EN/ES e validar a tradução mais longa em 390 px. Evitar larguras fixas que impeçam reflow.
5. Distinguir o overflow intencional do trilho de experiências de overflow horizontal do documento.
6. Preservar proporção e identificação acessível de cada marca (3+2 no mobile).
7. Não usar a busca visual como promessa de pesquisa; não expor o AI Concierge como atendimento operacional.

### Limites de legibilidade aprovados

Os pisos abaixo são decisão de legibilidade do Owner para esta Home. Body copy continua seguindo os candidatos RT-11; campos e ações permanecem em 14 px no mínimo mesmo quando ficam desabilitados no conceito. As medidas da coluna “referência observada” são diagnóstico documental do pacote, não proposta de redesign:

| Local / texto | Referência observada | Ajuste requerido antes da implementação |
|---|---:|---|
| Links de navegação / CTA de header e hero | links 11 px; CTA 11 px desktop / 9 px mobile | controles ≥14 px; validar largura, wrapping e header nas traduções |
| Eyebrows de hero e seções | 10–11 px | metadados ≥12 px |
| Labels da jornada de seis estágios | 9 px desktop / 7 px mobile | rótulos ≥12 px; manter os seis estágios e validar reflow sem redesenhar o hero |
| Campos do planejador: labels, valores e ação | 8 px / 11 px / botão 10 px | labels ≥12 px; input/select/botão ≥14 px; revalidar alturas e grid |
| Microcopy de confiança e nota de experiências | 10–10,5 px | metadados ≥12 px; copy de apoio manter pelo menos o candidato body RT-11 (13 px quando aplicável) |
| Eyebrow de diferenciais e selo pendente de foto | 11 px; selo mobile 11 px | metadados/badge ≥12 px |
| Rio Story: eyebrow/kicker de mídia | 11 px desktop / 10 px mobile em kicker | metadados ≥12 px |
| AI Concierge: benefícios, balão, selo, campo e microcopy | benefícios 12/11 px; balão 13/12 px; selo 10/9 px; input 12/10 px; nota 12/9 px | body/mensagem acompanhar RT-11 (preferência 13 px); selo/nota ≥12 px; input ≥14 px |
| Quem Somos: link CTA e kicker de mídia | CTA 13 px; kicker 11 px | link ≥14 px; metadado ≥12 px |
| Footer: links e texto secundário | links 12 px; texto 12–13 px | links ≥14 px; metadados ≥12 px; body copy seguir RT-11 |
| Cards de experiências | título 20 px; descrição 13 px; badge/preço 12 px | já respeita o mínimo de 12 px aprovado em RT-11; manter sem redução |
| Avisos “PRÉVIA INTERNA / OWNER REVIEW” | varia abaixo de 12 px | não é UI para visitante e não deve ser implementado comercialmente; manter apenas no contexto de revisão |

### Requisitos e conferência preliminar de contraste

Usar WCAG 2.2 AA como alvo: texto normal ≥4.5:1, texto grande ≥3:1; informação visual necessária para identificar controles/estados ≥3:1 contra cores adjacentes. Componentes inativos são exceção normativa de contraste de texto, mas continuam sujeitos ao piso tipográfico do Owner e devem permanecer discerníveis. Fontes: [WCAG 2.2, SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum) e [SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast).

Rácios abaixo foram calculados a partir dos valores hex opacos do contrato RT-10 (luminância relativa sRGB); são conferência de pares-token, não auditoria de contraste da Home renderizada:

| Par foreground / background | Ratio | Resultado / uso |
|---|---:|---|
| #F4F0E8 / #0B0E11; #CAC7BF / #0B0E11; #9DA3A5 / #0B0E11 | 17.03:1; 11.46:1; 7.57:1 | texto primário, secundário e muted escuro: acima de 4.5:1 |
| #171A1E / #F3EFE6; #53565A / #F3EFE6; #6B6B68 / #F3EFE6 | 15.21:1; 6.43:1; 4.66:1 | texto primário, secundário e muted claro: acima de 4.5:1 |
| #0B0E11 / #C8A86B, #E8C780, #A9864E | 8.54:1; 11.90:1; 5.72:1 | foreground escuro nos estados CTA default/hover/pressed: acima de 4.5:1 |
| #171A1E / #C8A86B, #B99559, #A98448 | 7.71:1; 6.24:1; 5.06:1 | foreground claro nos estados CTA default/hover/pressed: acima de 4.5:1 |
| #E8C780 / #0B0E11; #8A6A2B / #F3EFE6 | 11.90:1; 4.38:1 | anéis de foco escuro/claro: acima de 3:1 para indicador não textual; usar 3 px com offset RT-10 e verificar a cor realmente adjacente |
| #C8A86B / #F3EFE6 | 1.97:1 | falha como texto/link em fundo claro; não usar o dourado de marca sozinho como foreground nesse par |
| #3A4147 / #0B0E11; #CFC7BA / #F3EFE6 | 1.87:1; 1.46:1 | abaixo de 3:1 se essas bordas forem o único sinal que identifica um controle; reforçar com token RT-10 adjacente que passe, ou propor derivação e validar antes de adotar |
| #767D82 / #252B30; #686863 / #E3DFD6 | 3.43:1; 4.21:1 | texto disabled; componentes inativos têm exceção no SC 1.4.3, mas manter leitura perceptível e fonte de 14 px nos controles |

Na implementação, medir cada estado sobre a cor adjacente real, incluindo imagens, gradientes, transparências e contornos. A borda de formulário pode não ser o único indicador, mas isso precisa ser demonstrado; o Playwright arquivado não valida contraste. Não afirmar conformidade WCAG a partir desta tabela de tokens.

## 6. Tokens interativos escopados da Home — decisão aprovada

### Decisão e limite de impacto

Em 18/09/2026 o Owner aprovou a direção de tokens dourados específicos da Home, derivados dos estados RT-10, e determinou que `--primary: #123A28` permaneça verde global. Consumidores atuais fora da Home não devem mudar. O escopo mantém a cor existente para o produto atual e reproduz as CTAs douradas aprovadas sem reinterpretar o token global.

Read-only no código antes desta proposta: `app/globals.css` define `--primary: #123A28` e exporta o token semântico global; seus consumidores incluem UI compartilhada, menu mobile existente, AI Concierge, About, controles e áreas administrativas. A Home consolidada usa a paleta/estados RT-10 e não prova que substituir o token global seja local. Este documento não altera CSS ou esses consumidores.

### Mapeamento semântico aprovado para futura implementação

Os nomes abaixo são aliases candidatos para manter a implementação local; os valores e estados vêm diretamente do contrato RT-10. A equipe pode escolher nomenclatura equivalente se a semântica e o isolamento forem preservados.

| Token/variante Home (candidato) | Escuro RT-10 | Claro RT-10 | Comportamento |
|---|---|---|---|
| `--home-action-bg` | #C8A86B | #C8A86B | CTA default |
| `--home-action-fg` | #0B0E11 | #171A1E | texto do CTA default |
| `--home-action-hover-bg` | #E8C780 | #B99559 | hover; lift -1 px e shadow low |
| `--home-action-pressed-bg` | #A9864E | #A98448 | active/pressed; sem lift |
| `--home-focus` | #E8C780 | #8A6A2B | `:focus-visible`, anel 3 px e offset 3 px |
| `--home-action-disabled-bg / fg / border` | #252B30 / #767D82 / #343B42 | #E3DFD6 / #686863 / #CBC5BB | disabled verdadeiro; sem hover/lift/shadow ativo |

`--primary` permanece #123A28 em sua definição global; não mapear tokens Home para `--primary`, não substituir sua cor, nem mudar consumidores existentes. Loading não é uma variante deste CTA estático; só especificar em trabalho funcional assíncrono próprio. Evitar dourado de marca como texto em fundo claro quando o par não alcançar contraste; ver seção 5.

Esta decisão não encerra nem aprova automaticamente RT-15: o gate continua exigindo registro do resultado Owner para a base antes de motion implementation. A aprovação específica de tokens e a documentação de RT-14 são evidências de entrada, não transição do gate.

## 7. Limites funcionais

- Flight Planner: formulário apenas visual, sem busca, API, disponibilidade, resultados ou integração da consolidadora.
- AI Concierge: demonstração conceitual estática; sem respostas geradas, backend, sessão online ou ação de envio.
- Jornada: narrativa de seis estágios; sem progresso de scroll implementado no pacote.
- About: fotografia atual provisória; deve ser substituída por fotografia autêntica aprovada antes de publicação.
- Cadastur e textos legais: não inferir situação cadastral; Política de Privacidade, Termos de Uso e informação legal permanecem pendentes de publicação.

Esses limites não invalidam a especificação visual. Eles impedem que estados funcionais sejam representados como existentes.

## 8. Validação de RT-14 contra as fontes

| Critério/entrada | Resultado da revisão |
|---|---|
| Jira RT-14: “Component inventory e estados definidos” | Critério atual relido sem divergência. Inventário inclui nav/menu, botões/links, cards, campos, badges, AI Concierge e padrões reutilizáveis; matriz separa estado observado de comportamento especificado/proposto. |
| Decisões do Owner (18/09/2026) | Tokens dourados locais com `--primary` global preservado, menu mobile expansível acessível e limites de legibilidade 12/14 px estão documentados; nenhuma decisão implementada. |
| RT-10 | Paleta, spacing, grid, radius, elevação, estados e iluminação transcritos; a escolha local dourada está aprovada e global `--primary` permanece intocado. |
| RT-11 | Cormorant Garamond/Inter e escala aprovada dos cards preservadas; desvios tipográficos do preview ficam listados para ajuste futuro, sem alterar a composição aprovada. |
| RT-12/RT-13 | Home desktop/mobile aprovada usada como baseline; Jira confirma ambos Concluído |
| Pacote permanente | HTML consolidado e dependências relativas, capturas 1440/390, Owner approval, manifesto/proveniência e relatório Playwright consultados |
| Contraste | Pares de token foram calculados; combinações de texto/CTA indicadas passam nos alvos aplicáveis. Texto dourado em fundo claro e algumas bordas neutras não passam; ajustes estão registrados. Não é auditoria visual/WCAG do DOM renderizado. |
| RT-15 | Continua em BACKLOG / READY e não foi alterada. As decisões específicas de hoje não constituem resultado/transição do Owner Visual Gate. |
| Funcionalidade | Nenhuma integração ou estado operacional inventado |

O relatório Playwright arquivado registra seis combinações PT/EN/ES × 1440/390, 90 assertions, 0 falhas, 0 issues, 0 erros de navegador e 0 imagens não carregadas. Ele comprova a renderização do pacote, não comportamento real de tabs, busca, IA, contraste ou menu mobile.

## 9. Pendências e estado de revisão

- **Implementação / legibilidade:** corrigir os tamanhos abaixo dos limites 12/14 px listados na seção 5; rever quebra de linha e dimensões sem redesenhar a Home.
- **Implementação / contraste:** comprovar 4.5:1 para texto normal e 3:1 para informação de controle/estado em cada combinação realmente renderizada. Não usar #C8A86B como texto em superfície clara nem bordas neutras de baixo contraste como único indicador de controle; qualquer novo token deve ser conferido com RT-10 e encaminhado ao Owner quando não derivar claramente dos valores aprovados.
- **Menu mobile:** implementar somente em trabalho autorizado posterior, seguindo 3.1, com teste de teclado, Escape/foco de retorno, navegação PT/EN/ES, pontos de quebra e overflow. O preview não tem esse comportamento implementado.
- **RT-15:** resultado formal do Owner Visual Gate continua pendente. Esta especificação não transiciona RT-14 ou RT-15 nem autoriza motion/implementação.
- **Source of Truth / governança:** sincronizar futuramente este resultado documental local com o Google Doc canônico; Google Doc não foi acessado nem atualizado nesta execução. Jira permanece inalterado em BACKLOG / READY para RT-14.
- **Comportamento futuro:** especificar busca, tabs operacionais e AI Concierge nos tickets próprios; a RT-14 não cria integrações, resultados ou estados ativos.
- **Publicação:** foto autêntica de Quem Somos, Cadastur/dados legais, Política de Privacidade e Termos de Uso continuam fora da RT-14 e pendentes conforme o README do pacote.

**Resultado local:** inventário e estados exigidos pelo critério publicado de RT-14 estão especificados, incluindo estados observados, estados aprovados para futura implementação e estados não aplicáveis. Este arquivo é evidência documental local; não sincroniza o Google Doc, não transiciona nem encerra Jira e não autoriza implementação na aplicação, produção ou banco, nem aprova RT-15.
