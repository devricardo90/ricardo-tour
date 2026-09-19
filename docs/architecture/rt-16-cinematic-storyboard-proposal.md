# RT-16 — Storyboard da jornada cinematográfica

**Status:** Owner approved for initial prototype parameters; documentation finalized for controlled closure

**Data da proposta:** 19/09/2026

**Modo:** HYBRID — documentação e revisão do Owner; sem implementação

**Jira:** RT-16 / RT-RB-S2-01 (`BACKLOG / READY`)

Este documento define os estados, textos e progresso de scroll da jornada cinematográfica da Home. O Owner aprovou os parâmetros iniciais em 19/09/2026. Ele não implementa motion nem altera a prévia aprovada; percentuais, duração e distância física continuam sujeitos a refinamento após os testes.

## 1. Critério de aceite e fontes consultadas

### Critério exato do Jira

> **Estados, textos e percentuais de scroll definidos.**

RT-16 também registra que a validação é storyboard + Owner review, que a evidência deve ser uma referência Jira/Source of Truth, e que a dependência é o Sprint 1 Owner Visual Gate. O ticket permanece `BACKLOG / READY`; a proposta não o transiciona.

### Fontes

- [Source of Truth local](visual-rebuild-source-of-truth.md), especialmente os princípios da seção 3, o registro de Sprint 2 e o índice canônico RT-RB-S2-01…06/GATE.
- [Home consolidada aprovada](../baseline/rt-home-design-approved/README.md), incluindo a prévia permanente, captura 1440×900, captura 390×844, validação Playwright, limitações e proveniência.
- [Tokens RT-10](rt-10-design-tokens.md).
- [Sistema tipográfico RT-11](rt-11-typography-system.md).
- [RT-16 no Jira](https://ricardodesouzafrancisco.atlassian.net/browse/RT-16): objetivo, critério, validação e dependência.
- RT-17, RT-18, RT-19, RT-20, RT-21 e RT-22 no Jira, consultados em 19/09/2026.

### Decisões já aprovadas

- A Home consolidada e a identidade RT-10/RT-11 permanecem a base; não há redesign nesta tarefa.
- A jornada representa uma aproximação cinematográfica, não a ordem nem a disponibilidade dos produtos do catálogo.
- A sequência canônica é **Globo → América do Sul → Brasil → Rio de Janeiro → Helicóptero → Cristo Redentor**.
- O Owner Visual Gate RT-15 foi aprovado em 19/09/2026 para avançar à Sprint 2, com possibilidade de refinamentos após o protótipo de motion.
- O headline aprovado da Home, **“Rio From Another Perspective”**, continua preservado.
- O primeiro quadro deve ter um momento de estabilidade; Rio e Cristo devem ter tempo de contemplação suficiente.

Os itens marcados como **proposta inicial** são hipóteses para o protótipo e podem ser refinados após os testes; não são masters finais nem autorização de publicação.

### Alinhamento com a Sprint 2

O registro canônico identifica **Sprint 2 — Cinematic Motion Prototype** (alias Jira: **Sprint 2 — Cinematic Prototype**, id 104) como futura no índice local. O objetivo operacional registrado nos tickets é **provar sticky scroll, progress, mouse parallax e fallback mobile com mídia temporária**. Esta proposta cobre a definição necessária para esse objetivo, mas não transforma nenhum ticket em execução nem altera o Source of Truth.

O `README.md` do pacote permanente foi fechado em 18/09 e conserva o estado histórico daquele pacote, no qual RT-15 ainda aparece como gate separado. A aprovação de RT-15 em 19/09 é tratada aqui como decisão posterior do Owner/Jira; o pacote não é reescrito nesta etapa.

## 2. Modelo de progresso

O progresso `p` é normalizado de `0` a `1` ao longo do trecho sticky da jornada (equivalente a `0%`–`100%`). O documento usa intervalos de responsabilidade sem lacunas nem sobreposição: a transição visual pode fazer crossfade dentro da fronteira, mas cada estado tem um intervalo de entrada e saída determinístico.

| Estado | Faixa de `p` | Progresso local | Intenção da faixa |
| --- | ---: | ---: | --- |
| 01 — Globo | **0–12%** | 0→1 | Apresentar o mundo e segurar o primeiro quadro antes do movimento. |
| 02 — América do Sul | **12–28%** | 0→1 | Aproximar e orientar a geografia da viagem. |
| 03 — Brasil | **28–44%** | 0→1 | Destacar o país sem transformar o mapa em informação operacional. |
| 04 — Rio de Janeiro | **44–62%** | 0→1 | Chegar ao destino protagonista e desacelerar para contemplação. |
| 05 — Helicóptero | **62–78%** | 0→1 | Fazer a ponte aérea narrativa até a vista do Cristo. |
| 06 — Cristo Redentor | **78–100%** | 0→1 | Concluir a aproximação, contemplar e liberar a próxima seção. |

**Nota de estabilidade (proposta):** manter o Globo praticamente estável entre `0–8%`; o movimento controlado por scroll começa em `8%`. Em cada fronteira, reservar aproximadamente os últimos/primeiros 2 pontos percentuais para interpolação de escala, posição e opacidade, sem alterar a propriedade do estado nem criar lacuna.

## 3. Storyboard dos seis estados

### 01 — Globo

- **Objetivo narrativo:** estabelecer escala, origem e expectativa antes de pedir movimento ao visitante.
- **Composição:** fundo escuro e iluminação do hero RT-10; globo/planeta central ou no enquadramento já aprovado; headline “Rio From Another Perspective” preservado; jornada visual discreta.
- **Câmera/movimento:** `0–8%` hold; de `8–12%`, zoom/translate muito sutil em direção à América do Sul. Pointer parallax, se usado depois, é apenas uma profundidade leve e não inicia a jornada.
- **Entram/saem:** entram globo e marca de origem; na saída, o globo perde dominância por crossfade/scale, sem corte abrupto.
- **Texto:** label curto **Globo** (PT), **Globe** (EN), **Globo** (ES); headline aprovado permanece. Nenhum claim novo.
- **Entrada/saída:** entrada no carregamento do hero; saída ao atingir `12%`.
- **Transição:** dissolução curta + transformação contínua de escala/posição.
- **Mídia:** tratamento de planeta já presente na referência visual; mídia definitiva de abertura ainda não é um master de motion.
- **Fallback:** still do hero aprovado com label acessível e jornada estática; sem dependência de vídeo.

### 02 — América do Sul

- **Objetivo narrativo:** transformar a escala global em direção regional, mantendo a sensação de viagem contínua.
- **Composição:** América do Sul ganha presença no centro do enquadramento; preservar carvão, dourado fosco, contraste e tipografia RT-11.
- **Câmera/movimento:** aproximação progressiva com leve deslocamento para o leste/sudeste; velocidade limitada para evitar sensação de mapa acelerado.
- **Entram/saem:** contorno/área regional entra durante o crossfade; globo permanece como camada de contexto e sai até `28%`.
- **Texto:** **América do Sul** / **South America** / **América del Sur**.
- **Entrada/saída:** entrada em `12%`; saída em `28%`.
- **Transição:** morph ou crossfade de camadas geográficas; não trocar por uma tela independente.
- **Mídia:** keyframe geográfico provisório; arte cartográfica definitiva e direitos de uso ainda precisam ser definidos.
- **Fallback:** imagem estática com região destacada e texto equivalente.

### 03 — Brasil

- **Objetivo narrativo:** situar o visitante no país antes de revelar o Rio.
- **Composição:** Brasil ocupa progressivamente o foco; nenhum preço, produto ou promessa é associado ao mapa.
- **Câmera/movimento:** zoom contínuo e discreta rotação/translate, com easing suave; não usar movimento que prejudique leitura do headline.
- **Entram/saem:** contorno do Brasil e ponto de direção entram; América do Sul recua como contexto até `44%`.
- **Texto:** **Brasil** / **Brazil** / **Brasil**.
- **Entrada/saída:** entrada em `28%`; saída em `44%`.
- **Transição:** continuidade de escala e máscara de foco, sem hard cut.
- **Mídia:** keyframe/ilustração geográfica provisória; versão de alta resolução ainda necessária para publicação.
- **Fallback:** still de Brasil com foco textual, mantendo o próximo estado alcançável.

### 04 — Rio de Janeiro

- **Objetivo narrativo:** fazer a chegada emocional ao destino protagonista da marca.
- **Composição:** vista do Rio/baía e ponto de destino em linguagem coerente com o hero aprovado; headline pode continuar visível, com label menor para não competir.
- **Câmera/movimento:** zoom desacelera entre `44–56%`; estabiliza para contemplação em `56–62%`; o ponto do Rio se torna a âncora visual.
- **Entram/saem:** cidade, horizonte e ponto luminoso entram; mapa do Brasil reduz opacidade; a camada seguinte só ganha dominância no final do intervalo.
- **Texto:** **Rio de Janeiro** / **Rio de Janeiro** / **Río de Janeiro**.
- **Entrada/saída:** entrada em `44%`; saída em `62%`.
- **Transição:** parallax atmosférico + crossfade lento para a vista aérea; sem flash ou corte brusco.
- **Mídia:** `public/videos/imagem-rio-perfil.jpg` está preservada no pacote como imagem real da referência; sua adequação como frame de motion ainda é **provisória** e requer validação de crop/direitos.
- **Fallback:** imagem estática aprovada do Rio, sem movimento, com contraste suficiente para o texto.

### 05 — Helicóptero

- **Objetivo narrativo:** ligar a chegada ao Rio a uma sensação de sobrevoo, sem prometer que o passeio está disponível ou integrado.
- **Composição:** perspectiva interna do helicóptero, olhando através da cabine para o Rio e aproximando-se do Cristo; manter a sequência como narrativa cinematográfica, não card de produto.
- **Câmera/movimento:** câmera subjetiva dentro da cabine; de `62–70%`, aceleração moderada e deslocamento aéreo; de `70–78%`, desaceleração e orientação para o Cristo.
- **Entram/saem:** vista aérea entra; a paisagem do Rio permanece como camada de contexto e dissolve ao final.
- **Texto:** **Helicóptero** / **Helicopter** / **Helicóptero**. O texto deve ser entendido como capítulo visual, não disponibilidade de catálogo.
- **Entrada/saída:** entrada em `62%`; saída em `78%`.
- **Transição:** deslocamento aéreo simulado por transform/crossfade; nunca autoplay de vídeo com áudio.
- **Mídia:** **definitiva ainda necessária**: cena autêntica pela perspectiva interna do helicóptero, com origem, autorização e enquadramento aprovados. Não usar imagem externa de helicóptero nem imagem gerada por IA como fotografia real.
- **Fallback:** still do Rio visto de uma janela/cabine ou frame neutro escuro com label; não fabricar helicóptero.

### 06 — Cristo Redentor

- **Objetivo narrativo:** entregar a chegada icônica e um ponto de contemplação antes de sair para planejamento/experiências.
- **Composição:** Cristo ocupa o foco final com iluminação e contraste RT-10; evitar que o estado pareça um novo card do catálogo.
- **Câmera/movimento:** de `78–90%`, aproximação final controlada; `90–100%` mantém o enquadramento estável, com microparallax opcional e leitura completa do headline/CTA.
- **Entram/saem:** Cristo e horizonte tornam-se dominantes; o estado de helicóptero desaparece gradualmente, sem apagar a continuidade da viagem.
- **Texto:** **Cristo Redentor** / **Christ the Redeemer** / **Cristo Redentor**.
- **Entrada/saída:** entrada em `78%`; saída em `100%`, liberando a seção “Planeje sua viagem”/próxima seção no fluxo normal.
- **Transição:** settle cinematográfico; a saída é um release do sticky, não uma nova troca de página.
- **Mídia:** fotografia autêntica e autorizada do Cristo ainda precisa ser confirmada para o motion; os cards de experiências da Home continuam independentes desta narrativa.
- **Fallback:** still escuro/aprovado do hero com tratamento de foco e alt text; nunca deixar um bloco vazio.

## 4. Textos e localização

O único texto de marca já aprovado para permanecer no hero é **“Rio From Another Perspective”**, em todos os idiomas. Os labels abaixo são **propostos** apenas para orientar o storyboard e devem ser mantidos curtos para não competir com a imagem.

| Estado | PT | EN | ES |
| --- | --- | --- | --- |
| 01 | Globo | Globe | Globo |
| 02 | América do Sul | South America | América del Sur |
| 03 | Brasil | Brazil | Brasil |
| 04 | Rio de Janeiro | Rio de Janeiro | Río de Janeiro |
| 05 | Helicóptero | Helicopter | Helicóptero |
| 06 | Cristo Redentor | Christ the Redeemer | Cristo Redentor |

Não adicionar descrições de produto, preços, disponibilidade, atendimento automático ou promessas de resultado. Se o estado for apresentado sem label no protótipo, o nome deve permanecer em `aria-label`/texto acessível equivalente.

## 5. Comportamento de scroll — desktop

**Proposta para RT-17, não implementação nesta tarefa:**

1. O documento mantém o fluxo normal até o hero; ao entrar no trecho de jornada, o shell fica `position: sticky` por uma altura controlada. A página não captura nem bloqueia o scroll do usuário.
2. O primeiro frame é visível antes do movimento (`0–8%`); o scroll seguinte controla um progresso monotônico `p` e os estados interpolam a partir dele.
3. As transformações devem ser limitadas por velocidade visual: usar easing e clamp de delta por frame, evitando saltos quando o usuário rolar rapidamente.
4. Cada fronteira usa continuidade de escala, posição, opacidade e luz. Não substituir imagens desconectadas em um único frame.
5. Entre `44–62%` e `78–100%`, reduzir a velocidade aparente para permitir leitura e contemplação.
6. Ao chegar a `100%`, manter o Cristo estável por um curto settle e liberar o sticky; a seção “Planeje sua viagem” continua no fluxo documentado da Home.
7. Pointer parallax é camada opcional e subordinada ao scroll. Ele não inicia o estado 02, em conformidade com RT-19.

## 6. Comportamento de scroll — mobile (390px)

- Usar enquadramento vertical, com safe area e `object-position` por estado; não simplesmente reduzir o canvas desktop.
- Manter o primeiro quadro estável por mais tempo perceptual (`0–12%`); simplificar escala e deslocamento para não criar enjoo ou cortes de rosto/ponto de interesse.
- Em dispositivos capazes, usar sticky de uma única coluna com altura moderada; o texto fica em uma faixa fixa/legível e a mídia ocupa o restante sem overflow horizontal.
- Em dispositivos limitados, conexão lenta ou baixa memória, trocar para sequência de stills/pôsteres com crossfade simples e sem vídeo. O visitante continua vendo todos os seis labels em ordem.
- Não exigir reprodução automática, áudio, gesto horizontal ou rolagem capturada.
- Teclado percorre a página na ordem DOM normal; foco nunca fica preso no hero. Um controle de “pular a jornada” pode ser adicionado em RT-17 se o Owner aprovar, sem tornar o indicador uma navegação pesada.
- Sem JavaScript: mostrar o primeiro still, título, labels acessíveis e a seção seguinte no fluxo normal. O conteúdo não pode depender de script para ficar alcançável.
- Em `prefers-reduced-motion: reduce`, remover parallax, zoom e crossfade animado; apresentar o still final/hero aprovado e os seis labels como lista estática.

## 7. Acessibilidade, desempenho e fallbacks

- Respeitar `prefers-reduced-motion`; a redução é uma variação funcional, não apenas uma troca de duração.
- Garantir contraste de texto com os tokens RT-10 e fonte Inter para labels; não usar o brilho de media-only hero como cor de UI.
- Fornecer `alt`/nome acessível para cada cena, ou marcar a camada puramente decorativa como `aria-hidden` quando o texto equivalente estiver presente.
- Manter leitura do headline e CTA por leitor de tela mesmo quando a câmera muda.
- Não usar `aria-live` para cada frame; no máximo, atualizar um indicador de estado de forma discreta se a necessidade for comprovada.
- Carregar primeiro o poster/primeiro still; pré-carregar apenas a próxima cena; lazy-load das demais. Usar WebP/AVIF/derivados responsivos quando a mídia definitiva existir.
- Não autoplay de vídeo com áudio; qualquer vídeo deve ser muted, sem autoplay obrigatório, com poster e fallback.
- A meta de validação de RT-17 é ausência de overflow, console errors, clipping e regressões de leitura em PT/EN/ES nos viewports 1440×900 e 390×844. Métricas de peso e frame time devem ser registradas no protótipo, não inventadas como evidência desta RT-16.

## 8. Inventário preliminar de mídia e proveniência

| Categoria | Mídia / origem | Uso no storyboard | Situação |
| --- | --- | --- | --- |
| Real disponível | `public/videos/imagem-rio-perfil.jpg`, copiado no pacote permanente | Referência de Rio / fallback visual | Real no repositório; adequação e direitos para motion ainda precisam de validação. |
| Real disponível | Fotos e vídeo aprovados de Rio Story no pacote (`rio-story-owner-approved.mp4`, poster, pôr do sol, igreja) | Referência editorial/fallback, não substitui automaticamente as seis cenas | Owner-aprovados para a seção editorial; uso na jornada depende de enquadramento e proveniência da cena. |
| Real disponível | Fotos dos cards e retrato provisório do pacote | Não reutilizar automaticamente no motion | Aprovados para suas áreas; retrato permanece provisório para publicação. |
| Provisória | Tratamento de planeta, ponto de Rio, iluminação e composição da prévia Home | Prototipagem de escala/posição | Evidência visual, não master final; HTML/CSS da prévia não são aplicação de produção. |
| Definitiva necessária | Globo→América do Sul→Brasil→Rio como arte/mídia contínua | Estados 01–04 | Criar/autorizar keyframes e derivatives, preservando continuidade e direitos. |
| Definitiva necessária | Cena autêntica de helicóptero | Estado 05 | Confirmar origem, autorização comercial, enquadramento e compatibilidade editorial. Não substituir por IA. |
| Definitiva necessária | Cristo Redentor em enquadramento final | Estado 06 | Confirmar fotografia/filmagem real e autorização; não confundir com card de produto. |

Masters finais, color grade definitivo e derivados de produção pertencem à Sprint 3 e não são produzidos em RT-16.

## 9. Opções técnicas para o protótipo

| Opção | Vantagens | Limitações / riscos | Adequação inicial |
| --- | --- | --- | --- |
| Sequência de imagens | Scrub determinístico, fallback simples, controle fino por estado | Muitos arquivos, peso de rede, exige keyframes coerentes e otimização | Boa para validar progressão se houver stills autorizados. |
| Vídeo controlado por progresso | Continuidade visual e poucos pontos de montagem | Seeking irregular em mobile, codecs/memória, peso, poster obrigatório | Adiar até existir master temporário confiável; não é requisito de RT-16. |
| Camadas com crossfade/transform | Implementação isolada simples, acessível, funciona sem vídeo | Pode parecer troca de imagens se os keyframes não forem coerentes | Boa base de fallback e teste inicial. |
| **Híbrida (proposta)** | Seis keyframes/camadas para validar narrativa + vídeo opcional depois; fallback compartilhado | Exige disciplina para não manter vídeo e imagens pesados ao mesmo tempo | **Recomendada para RT-17**, sem instalar biblioteca nova nesta fase. |

## 10. Abordagem proposta para RT-17

RT-17 é o primeiro trabalho de implementação do motion, separado desta especificação. A proposta é um protótipo isolado/lab com abordagem híbrida:

1. Implementar um shell sticky e um `progress` normalizado, sem alterar a Home de produção.
2. Usar seis camadas de still/keyframe ou media temporária, com CSS custom properties para escala, translate, opacity e foco; `requestAnimationFrame` somente para coalescer atualizações se a medição mostrar necessidade.
3. Não instalar GSAP/ScrollTrigger sem justificar a necessidade. Se uma biblioteca existente for usada no lab, isolar sua carga e documentar o fallback sem ela.
4. Testar primeiro `0%`, as cinco fronteiras e `100%`; depois testar rolagem rápida, pausa, retorno e saída para o planner.
5. Validar RT-17 contra RT-17 (scroll sem troca de página), RT-18 (indicador de etapa leve), RT-19 (pointer não inicia jornada) e RT-20 (mobile/reduced-motion). RT-21 só entra após esses quatro comportamentos estarem testáveis.
6. Entregar preview/browser evidence e reduced-scope motion evidence para revisão do Owner; não produzir masters finais antes do RT-22 Owner Motion Gate.

## 11. Dependências e próximos tickets

| Ticket | Critério consultado | Relação com RT-16 |
| --- | --- | --- |
| RT-17 | Scroll controla narrativa sem trocar de página. | Primeiro protótipo técnico da proposta; depende do gate visual da Sprint 1. |
| RT-18 | Indicador reflete etapa ativa sem virar navegação pesada. | Usa as seis fronteiras; deve seguir o progresso de RT-17. |
| RT-19 | Movimento do mouse cria profundidade sem iniciar a jornada sozinho. | Camada opcional sobre o estado 01; não deve alterar `p` sozinho. |
| RT-20 | Experiência funcional em dispositivos limitados e acessível. | Implementa mobile, fallback, reduced-motion e sem JS conforme §6–7. |
| RT-21 | Ritmo aprovado no navegador real. | Depende de RT-17, RT-18, RT-19 e RT-20; requer teste do Owner. |
| RT-22 | Não gerar masters finais antes do gate; validação = Owner Motion Gate. | Gate da Sprint 2 antes da produção de mídia final e dos trabalhos posteriores. |

## 12. Questões para o Owner

Estas perguntas foram resolvidas pela decisão de 19/09/2026: o mapa percentual inicial, a abordagem híbrida, o headline, os labels discretos, a continuidade entre cenas, a perspectiva interna do helicóptero e a saída natural para “Planeje sua viagem” estão aprovados para o protótipo. Permanecem abertas apenas a seleção/autorização das mídias definitivas e os refinamentos que surgirem dos testes.

## 13. Limites desta entrega

- Nenhum motion foi implementado.
- A Home aprovada, RT-10, RT-11, Jira, Google Doc, banco e produção não foram alterados.
- RT-17 não foi iniciado; a conclusão documental de RT-16 não autoriza sua execução antecipada.
- Não foram produzidos masters finais nem novas mídias.
- A exclusão preexistente `public/images/seals/cadastur-official.png` não foi restaurada, modificada ou incluída.

## 14. Decisão do Owner — 19/09/2026

Ricardo aprovou o storyboard para o protótipo inicial com os seguintes parâmetros:

- sequência **Globo → América do Sul → Brasil → Rio → Helicóptero → Cristo Redentor**;
- faixas `0–12%`, `12–28%`, `28–44%`, `44–62%`, `62–78%` e `78–100%`, com estabilidade aproximada do Globo nos primeiros `8%`;
- abordagem híbrida com imagens/camadas, transformações e transições controladas pelo progresso do scroll;
- headline **“Rio From Another Perspective”** preservado, com labels discretos em PT/EN/ES;
- continuidade visual progressiva entre as seis cenas; crossfade é auxiliar e não substitui a aproximação;
- cena do helicóptero pela perspectiva interna, olhando para o Rio e aproximando-se do Cristo;
- chegada contemplativa ao Cristo, liberação do sticky e saída natural para **“Planeje sua viagem”**;
- percentuais, duração e distância são parâmetros iniciais e poderão ser refinados após os testes.

Esta aprovação autoriza a preparação do RT-17, não a implementação nesta tarefa, a produção de masters ou a publicação.

## 15. Distância física proposta para o sticky (hipótese de protótipo)

As distâncias abaixo são aproximações de CSS e relacionam diretamente o intervalo percentual ao comprimento total do trecho sticky. Devem ser validadas em navegador real; não representam duração definitiva nem promessa de performance.

| Ambiente | Comprimento sticky proposto | Conversão aproximada | 01 Globo | 02 América do Sul | 03 Brasil | 04 Rio | 05 Helicóptero | 06 Cristo |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Desktop 1440×900 | `320vh` | ≈ 2.880px; 1% ≈ 28,8px | ≈ 346px | ≈ 461px | ≈ 461px | ≈ 518px | ≈ 461px | ≈ 634px |
| Mobile 390×844 | `280vh` | ≈ 2.363px; 1% ≈ 23,6px | ≈ 284px | ≈ 378px | ≈ 378px | ≈ 425px | ≈ 378px | ≈ 520px |

O hold inicial de `0–8%` corresponde aproximadamente a 230px no desktop e 189px no mobile. O mobile é mais curto para reduzir fadiga, peso de mídia e risco de aprisionamento; suas transformações também devem ser simplificadas.

**Critério de validação:** medir a distância a partir da entrada no sticky até a liberação após `100%`, verificar que cada fronteira é alcançável com rolagem lenta e rápida, e confirmar que Rio/Cristo têm tempo perceptual suficiente sem exigir uma sequência excessivamente longa. Usar `svh`/`dvh` e limites mínimos/máximos para compensar barras de navegador móveis.

**Riscos:** uma distância menor pode produzir saltos e pouca contemplação; uma distância maior pode cansar, retardar o acesso ao planner e aumentar custo de mídia. A hipótese deve ser recalibrada em RT-17/RT-21 após teste no navegador real.
