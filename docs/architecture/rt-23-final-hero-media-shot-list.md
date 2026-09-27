# RT-23 — Shot list e especificação final de mídia para o Hero scroll-driven

**Status:** Planning / art direction. Nenhum código, WebGL, mídia ou Version C foi alterado nesta tarefa.

**Data:** 27/09/2026

**Jira:** RT-23 / RT-RB-S3-01 (`Em andamento`), Sprint 3 — Media & Final Hero

**Modo:** Documentação e especificação. Não implementa, não gera imagem, não gera vídeo, não modifica `app/[locale]/rebuild-lab/cinematic-3d-poc/`.

## 1. Propósito

Definir exatamente quais ativos visuais, camadas e composições são necessários para transformar o protótipo aceito do Sprint 2 (RT-17, RT-18, RT-19, RT-20, aprovado no RT-22 Owner Motion Gate) no Hero final da Home. Este documento é o brief de produção que a RT-24 ("Gerar e selecionar takes finais") usa para produzir e selecionar mídia real; ele não produz mídia.

Esta tarefa corrige um desalinhamento herdado: o título original do RT-23 ("Criar shot list e prompts finais para Seedance") referenciava geração de vídeo por IA como método de produção. Essa referência é anterior às decisões de arquitetura do Sprint 2 e foi substituída no Jira (ver comentário de correção de escopo no RT-23). Este documento reflete a arquitetura efetivamente aprovada.

## 2. Decisão do Owner — arquitetura scroll-driven

A arquitetura aprovada é:

- **0–44%: WebGL real, controlado por scroll.** Globo → América do Sul → Brasil. Isso já está implementado (RT-17 Version C) e não é reaberto por esta tarefa.
- **44–100%: mídia cinematográfica controlada por scroll.** Rio → Helicóptero → Cristo Redentor, usando imagens estáticas de alta qualidade, separadas em camadas onde útil, com profundidade 2.5D: escala, translação, paralaxe, opacidade e blur controlado, além de movimento tipo câmera. **Não é reprodução de vídeo.** O navegador controla a experiência; o usuário controla a progressão via scroll.

**Seedance e vídeo gerado não são um requisito desta arquitetura.** Vídeo gerado só pode ser considerado depois como mídia de suporte **opcional/excepcional**, mediante necessidade de produção concreta e aprovação explícita do Owner. Nenhuma especificação de vídeo é produzida neste documento.

## 3. Baseline aceito do Sprint 2

Fonte: RT-16 (`rt-16-cinematic-storyboard-proposal.md`), RT-17 (`rt-17-3d-poc-evidence.md`), RT-22 (Owner Motion Gate — APPROVED FOR ROADMAP PROGRESSION).

- Seis estágios canônicos e faixas de progresso `p` — **preservados, não alterados por esta tarefa**:

| Estágio | Faixa | Técnica atual |
| --- | ---: | --- |
| 01 — Globo | 0–12% | WebGL real (`globe-3d.ts`) |
| 02 — América do Sul | 12–28% | WebGL real |
| 03 — Brasil | 28–44% | WebGL real |
| 04 — Rio de Janeiro | 44–62% | Camada estática (`rio-aerial-arrival.webp`, temporária) |
| 05 — Helicóptero | 62–78% | Camada estática (`rio-helicopter-cockpit.webp`, temporária) |
| 06 — Cristo Redentor | 78–100% | Camada estática (`rio-christ-finale.webp`, temporária) |

- Distância física do sticky: `320svh` desktop, `280svh` mobile (RT-16 §15). **Não alterada.**
- RT-18: rail de progresso sincronizado às seis faixas. **Não alterado.**
- RT-19: pointer parallax sutil no estado inicial (0–8% hold, fade até 12%, apenas fine pointer). **Não alterado.**
- RT-20: fallback mobile/reduced-motion/WebGL-unavailable/data-saver. **Não alterado.**
- RT-21: Owner aprovou o timing atual sem ajuste. RT-22: gate aprovado para progressão do roadmap, sem certificar mídia final, fidelidade geográfica ou performance de produção.

Débito de refinamento do RT-17, não resolvido aqui (ver §14):

- Fidelidade geográfica de América do Sul/Brasil e refinamento de coastline no WebGL.
- Proveniência/licenciamento de `rio-aerial-arrival.webp`, `rio-helicopter-cockpit.webp`, `rio-christ-finale.webp` — **PENDING VERIFICATION**, não promovidas a final por este documento.
- Refinamento visual adicional de Rio/helicóptero/Cristo.
- Teste de performance/mobile em dispositivo real.

## 4. Bíblia visual

Direção Rick Travel, válida para todas as cenas 04–06 (e para a leitura do handoff 03→04):

**Buscar:** premium; cinematográfico; realista; contido; base carvão escuro; dourado quente e fosco; iluminação atmosférica; geografia crível; saturação controlada; qualidade fotográfica alta, consistente com os tokens RT-10 e a paleta já usada no WebGL (dourado `#d7ba79`/`#e8c780`, fundo `#080c11`/`#28323a`).

**Evitar:** publicidade turística genérica; laranja/teal excessivo; neon; estética sci-fi; geografia fantasiosa; oversaturação; HDR artificial; lens flare pesado; artefatos óbvios de IA; texto falso; logotipos falsos; estilos visuais desconectados entre cenas.

Continuidade cromática entre estágios: o dourado do WebGL (Fresnel rim, filamentos de costa) deve reaparecer como luz de contorno/atmosfera nas cenas 04–06, para que a mudança de técnica não seja também uma mudança de paleta.

## 5. Arquitetura de mídia por estágio

### Estágios 1–3 (0–44%) — WebGL, não substituir

Papel atual (`globe-3d.ts`, inalterado por este documento):

- **Ativo atual:** esfera UV real (128×64), atlas equirretangular autoral (`world-atlas.ts`), textura regional para o destaque do Brasil, halo atmosférico (segunda esfera aditiva), Fresnel dourado, terminador Lambert.
- **Requisitos de textura/coastline:** os contornos são esquemáticos (baixa contagem de vértices), não dados cartográficos de referência — débito conhecido e registrado no RT-17. Melhorar a fidelidade da costa da América do Sul/Brasil e a resolução da textura regional é trabalho futuro, fora do escopo do RT-23.
- **Tratamento dourado:** filamentos de costa + destaque de rota do Brasil, já implementados; manter proporção atual (`coastline`, `brazilEdge`, `approach` no fragment shader) até que haja decisão de refinamento.
- **Atmosfera:** halo por shell aditivo, já implementado; qualquer mudança de intensidade é decisão de RT-17-refinamento, não de RT-23.
- **Profundidade:** real (câmera 3D órbita/dolly); não precisa de simulação de camadas.
- **Requisito de transição:** ver §8 (handoff crítico). Nenhuma mudança de câmera/percentual é proposta aqui.

### Estágios 4–6 (44–100%) — mídia cinematográfica em camadas

Ver shot list completa (§6) e especificação de camadas (§7).

## 6. Shot list canônica

Cada shot corresponde a um estágio da jornada. Um shot de transição adicional (T-03/04) documenta o handoff crítico Brasil→Rio (§8). Nenhuma imagem ou vídeo é gerado; todos os campos "SOURCE / PRODUCTION METHOD" e "PROVENANCE_REQUIREMENT" descrevem requisitos que a RT-24 deve satisfazer, não decisões já tomadas.

---

### SHOT-01 — Globo

- **STAGE:** 01 — Globo
- **TIMELINE_RANGE:** 0–12%
- **PURPOSE:** Estabelecer escala planetária e expectativa antes do movimento.
- **VISUAL_SOURCE_TYPE:** WebGL
- **SUBJECT:** Planeta Terra estilizado, marca de origem
- **CAMERA_POSITION:** Órbita alta (`dist 4.6→4.15`), `lat 4`, `lon -52`
- **LENS_FEEL:** Grande-angular controlado (FOV 34°, ajustado ao eixo mais estreito)
- **COMPOSITION:** Planeta centralizado com margem; headline sobreposto à esquerda
- **DEPTH_LAYERS:** N/A (3D real; ver §7 para a camada de estrelas que acompanha)
- **LIGHT_DIRECTION:** Luz a leste-superior de Corcovado (`direction(18, -6)`)
- **COLOR_TEMPERATURE:** Fria/neutra no oceano, quente no rim dourado
- **ATMOSPHERE:** Halo aditivo (Fresnel), campo de estrelas de fundo
- **SCROLL_BEHAVIOR:** Hold 0–8%, aproximação sutil 8–12%
- **PARALLAX_BEHAVIOR:** RT-19 pointer depth (±1.1° lon / ±0.7° lat), full strength 0–8%, fade a zero em 12%
- **SCALE_BEHAVIOR:** Nenhuma (distância de câmera, não escala CSS)
- **TRANSITION_IN:** Carregamento do hero (fade-in do frame estático → motion)
- **TRANSITION_OUT:** Crossfade/scale contínuo para SHOT-02 (mesma câmera, sem corte)
- **DESKTOP_FRAMING:** Globo à direita (`left:22%; right:-6%`), headline à esquerda
- **MOBILE_FRAMING:** Globo centralizado, topo (`top:6%; bottom:10%`), headline reduzido
- **TYPOGRAPHY_SAFE_AREA:** Faixa esquerda (desktop) / faixa superior (mobile) reservada para headline + badge
- **SOURCE / PRODUCTION METHOD:** WEBGL (já implementado)
- **PROVENANCE_REQUIREMENT:** N/A — arte autoral processual, sem fotografia
- **KNOWN_RISKS:** Fidelidade geográfica esquemática (débito RT-17, não resolvido aqui)

---

### SHOT-02 — América do Sul

- **STAGE:** 02 — América do Sul
- **TIMELINE_RANGE:** 12–28%
- **PURPOSE:** Transformar escala global em direção regional.
- **VISUAL_SOURCE_TYPE:** WebGL
- **SUBJECT:** Continente sul-americano, limbo do planeta ainda legível
- **CAMERA_POSITION:** `dist → 2.8`, `lat -14`, `lon -60`
- **LENS_FEEL:** Mesmo FOV; aproximação contínua, sem corte de lente
- **COMPOSITION:** Continente ocupa o quadro sem achatar (limite de `dist 2.8`)
- **DEPTH_LAYERS:** N/A (3D real)
- **LIGHT_DIRECTION:** Mesma luz da cena 01 (continuidade)
- **COLOR_TEMPERATURE:** Igual à cena 01
- **ATMOSPHERE:** Halo mantém-se; leve aumento de escala/opacidade do starfield
- **SCROLL_BEHAVIOR:** Aproximação progressiva, velocidade limitada (sem sensação de "mapa acelerado")
- **PARALLAX_BEHAVIOR:** Zero (RT-19 já expirou em 12%)
- **SCALE_BEHAVIOR:** Distância de câmera apenas
- **TRANSITION_IN:** Continuação direta do dolly da cena 01
- **TRANSITION_OUT:** Continuação direta do dolly para SHOT-03
- **DESKTOP_FRAMING:** Igual à cena 01
- **MOBILE_FRAMING:** Igual à cena 01
- **TYPOGRAPHY_SAFE_AREA:** Igual à cena 01 (label "América do Sul" substitui "Globo")
- **SOURCE / PRODUCTION METHOD:** WEBGL (já implementado)
- **PROVENANCE_REQUIREMENT:** N/A
- **KNOWN_RISKS:** Contorno esquemático do continente (débito RT-17)

---

### SHOT-03 — Brasil

- **STAGE:** 03 — Brasil
- **TIMELINE_RANGE:** 28–44%
- **PURPOSE:** Situar o visitante no país antes de revelar o Rio; preparar o handoff.
- **VISUAL_SOURCE_TYPE:** WebGL
- **SUBJECT:** Brasil em destaque, textura regional (`detailMix`) ativa
- **CAMERA_POSITION:** `dist → 2.3 → 1.95 → 1.72`, `lat -12→-17`, `lon -52→-47`, fechando sobre a âncora do Rio
- **LENS_FEEL:** Mesmo FOV; fechamento final mais rápido (38–44%) para já enquadrar o destino
- **COMPOSITION:** Brasil ocupa o quadro; âncora do Rio se aproxima do centro
- **DEPTH_LAYERS:** N/A (3D real)
- **LIGHT_DIRECTION:** Igual às cenas anteriores
- **COLOR_TEMPERATURE:** Igual; destaque dourado do Brasil (`brazilEdge`) mais intenso
- **ATMOSPHERE:** Halo; `copy` (headline) recua para 0.22 de opacidade
- **SCROLL_BEHAVIOR:** Zoom contínuo, leve rotação, sem prejudicar leitura do headline
- **PARALLAX_BEHAVIOR:** Zero
- **SCALE_BEHAVIOR:** Distância de câmera; globo desvanece (`opacity 0`) exatamente em 44%
- **TRANSITION_IN:** Continuação do dolly da cena 02
- **TRANSITION_OUT:** Ver SHOT-T-0304 (handoff crítico, §8)
- **DESKTOP_FRAMING:** Igual às cenas anteriores
- **MOBILE_FRAMING:** Igual às cenas anteriores
- **TYPOGRAPHY_SAFE_AREA:** Igual; label "Brasil"
- **SOURCE / PRODUCTION METHOD:** WEBGL (já implementado)
- **PROVENANCE_REQUIREMENT:** N/A
- **KNOWN_RISKS:** Fidelidade de coastline (débito RT-17); ver risco de handoff em §8/§14

---

### SHOT-T-0304 — Transição Brasil → Rio (handoff crítico)

Ver especificação completa em §8. Resumo de shot list:

- **STAGE:** Fronteira 03→04
- **TIMELINE_RANGE:** ~38–48% (sobreposição controlada; a fronteira de estado permanece 44%)
- **PURPOSE:** Fazer a mudança de técnica (WebGL → mídia estática) ler como continuidade de aproximação, não como corte de meio
- **VISUAL_SOURCE_TYPE:** COMPOSITE (WebGL final frame + camada atmosférica + imagem de abertura do Rio)
- **SCROLL_BEHAVIOR / TRANSITION:** crossfade curto como ferramenta secundária; a ferramenta primária é continuidade de câmera, escala e luz (§8)
- **KNOWN_RISKS:** maior risco de produção de todo o Hero — ver §8, §14

---

### SHOT-04 — Rio de Janeiro

- **STAGE:** 04 — Rio de Janeiro
- **TIMELINE_RANGE:** 44–62%
- **PURPOSE:** Chegada emocional ao destino protagonista.
- **VISUAL_SOURCE_TYPE:** LAYERED STATIC / 2.5D (ver §7 para camadas L0–L4)
- **SUBJECT:** Baía de Guanabara, skyline do Rio, Pão de Açúcar/horizonte como âncora
- **CAMERA_POSITION:** Vista aérea alta, ângulo de aproximação consistente com a última posição de câmera do WebGL (ver §8)
- **LENS_FEEL:** Teleobjetiva moderada, compressão suave de plano (não grande-angular de drone extremo)
- **COMPOSITION:** Regra dos terços; horizonte na faixa superior; baía ocupando o terço inferior/médio
- **DEPTH_LAYERS:** L0 céu/atmosfera, L1 horizonte/montanhas distantes, L2 baía/geografia urbana, L3 elemento de primeiro plano (opcional), ver §7
- **LIGHT_DIRECTION:** Luz quente lateral/alta, continuando a direção estabelecida no WebGL
- **COLOR_TEMPERATURE:** Quente, dourado-âmbar, consistente com a bíblia visual
- **ATMOSPHERE:** Neblina/haze atmosférico leve na baía, para profundidade e para mascarar costura de camadas
- **SCROLL_BEHAVIOR:** Desaceleração 44–56%, estabilização 56–62% (contemplação)
- **PARALLAX_BEHAVIOR:** Diferencial entre L1/L2 (mais lento) e L3 (mais rápido), ver §7
- **SCALE_BEHAVIOR:** Leve scale-in contínuo (`~1.01–1.03`), sem zoom abrupto
- **TRANSITION_IN:** Handoff §8
- **TRANSITION_OUT:** Crossfade + continuidade de movimento para SHOT-05 (câmera "entra" na cabine)
- **DESKTOP_FRAMING:** Wide cinematográfico, baía ocupando ~60% da largura
- **MOBILE_FRAMING:** Recorte vertical, foco no ponto do Rio (ver §10); descartar bordas laterais primeiro
- **TYPOGRAPHY_SAFE_AREA:** Terço inferior reservado para label/readout; headline permanece à esquerda com opacidade reduzida
- **SOURCE / PRODUCTION METHOD:** A DEFINIR — ver §11 (classificação depende de auditoria de fotografia do Owner, não decidida aqui)
- **PROVENANCE_REQUIREMENT:** Ver §13 (template completo por asset)
- **KNOWN_RISKS:** `rio-aerial-arrival.webp` atual é temporário/PENDING VERIFICATION; não promovido por este documento

---

### SHOT-05 — Helicóptero

- **STAGE:** 05 — Helicóptero
- **TIMELINE_RANGE:** 62–78%
- **PURPOSE:** Ponte aérea narrativa até o Cristo, sem prometer disponibilidade de passeio.
- **VISUAL_SOURCE_TYPE:** LAYERED STATIC / 2.5D (ver §7 para camadas L0–L5)
- **SUBJECT:** Interior de cabine (perspectiva subjetiva), paisagem do Rio através do vidro, Corcovado se aproximando
- **CAMERA_POSITION:** Subjetiva, de dentro da cabine, olhando através do para-brisa
- **LENS_FEEL:** Perspectiva natural de cabine (não fisheye de câmera de ação)
- **COMPOSITION:** Moldura da cabine/vidro como enquadramento natural; Cristo/Corcovado no terço central-superior
- **DEPTH_LAYERS:** L0 atmosfera, L1 paisagem distante, L2 Corcovado/Cristo (foco), L3 moldura da cabine/vidro, L4 primeiro plano de cabine (opcional), ver §7
- **LIGHT_DIRECTION:** Continuidade com SHOT-04; luz podendo mudar de ângulo (voo), mas não de temperatura
- **COLOR_TEMPERATURE:** Quente, consistente
- **ATMOSPHERE:** Reflexo controlado no vidro (sutil, não distrativo); leve haze na paisagem distante
- **SCROLL_BEHAVIOR:** Aceleração moderada 62–70%, desaceleração e orientação ao Cristo 70–78%
- **PARALLAX_BEHAVIOR:** Diferencial forte entre L3 (moldura, quase fixa) e L1/L2 (movimento de aproximação)
- **SCALE_BEHAVIOR:** Scale-in moderado (`~1.04–1.08`), maior que SHOT-04 (sensação de velocidade contida)
- **TRANSITION_IN:** Crossfade de SHOT-04 (baía recua como contexto, dissolve ao final)
- **TRANSITION_OUT:** Moldura da cabine "cai" (opacity/scale) revelando SHOT-06
- **DESKTOP_FRAMING:** Wide; moldura da cabine nas bordas, paisagem central
- **MOBILE_FRAMING:** Moldura vertical mais fechada; Corcovado/Cristo sempre visível (ver §10)
- **TYPOGRAPHY_SAFE_AREA:** Headline reduzido a 0.22 opacidade desktop, 0.06 mobile (não competir com a cena)
- **SOURCE / PRODUCTION METHOD:** A DEFINIR — ver §11
- **PROVENANCE_REQUIREMENT:** Ver §13
- **KNOWN_RISKS:** Maior risco de geometria implausível (cabine distorcida, instrumentos falsos, estrutura de helicóptero impossível) se a fonte for gerada; `rio-helicopter-cockpit.webp` atual é temporário/PENDING VERIFICATION

---

### SHOT-06 — Cristo Redentor

- **STAGE:** 06 — Cristo Redentor
- **TIMELINE_RANGE:** 78–100%
- **PURPOSE:** Chegada icônica e contemplação antes da liberação do sticky.
- **VISUAL_SOURCE_TYPE:** LAYERED STATIC / 2.5D (ver §7 para camadas L0–L5)
- **SUBJECT:** Cristo Redentor em primeiro plano/foco, Rio ao fundo
- **CAMERA_POSITION:** Aproximação final controlada, quadro estabiliza nos últimos 10%
- **LENS_FEEL:** Teleobjetiva, compressão que aproxima o Cristo do horizonte sem distorcer a escala
- **COMPOSITION:** Cristo centralizado/levemente deslocado, braços não cortados pela margem
- **DEPTH_LAYERS:** L0 céu atmosférico, L1 paisagem distante do Rio, L2 profundidade de montanha, L3 vegetação/primeiro plano, L4 Cristo (foco), L5 luz/haze controlado, ver §7
- **LIGHT_DIRECTION:** Luz quente, podendo simular fim de tarde/golden hour; continuidade com cenas anteriores
- **COLOR_TEMPERATURE:** Mais quente que as cenas anteriores (clímax); ainda dentro da paleta contida
- **ATMOSPHERE:** Haze/luz controlada ao redor do Cristo; sem lens flare pesado
- **SCROLL_BEHAVIOR:** Aproximação 78–90%, estabilização/contemplação 90–100%
- **PARALLAX_BEHAVIOR:** Diferencial forte L1 (lento) vs. L3/L4 (mais rápido), reforçando profundidade final
- **SCALE_BEHAVIOR:** Scale-in final (`~1.02→1.08`), settle sem overshoot
- **TRANSITION_IN:** Crossfade de SHOT-05 (moldura de cabine desaparece)
- **TRANSITION_OUT:** Settle cinematográfico → release do sticky → seção "Planeje sua viagem" (ver §9)
- **DESKTOP_FRAMING:** Wide; Cristo ocupa o terço direito/central, headline final mais visível (opacidade 0.88)
- **MOBILE_FRAMING:** Vertical, Cristo sempre no enquadramento (ver §10)
- **TYPOGRAPHY_SAFE_AREA:** Headline final ganha opacidade (0.88 desktop) sem sobrepor o Cristo
- **SOURCE / PRODUCTION METHOD:** A DEFINIR — ver §11
- **PROVENANCE_REQUIREMENT:** Ver §13
- **KNOWN_RISKS:** `rio-christ-finale.webp` atual é temporário/PENDING VERIFICATION; risco de "carão de anúncio de turismo" se saturação/luz não seguirem a bíblia visual (§4)

## 7. Especificação de camadas / profundidade (2.5D)

Camadas nomeadas sem exigir seis por cena — usar o mínimo que produz profundidade convincente. `L*` menor = mais distante/mais lento; `L*` maior = mais próximo/mais rápido (relação inversa à distância, consistente com como paralaxe funciona na prática).

### SHOT-04 — Rio (3–4 camadas)

| Camada | Conteúdo | Fonte pretendida | Máscara/transparência | Movimento de scroll | Velocidade relativa | Escala | Prioridade de profundidade | Recorte |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L0 | Céu/atmosfera | Foto/still | Gradiente, sem borda dura | Quase estático | 0.2× | Fixa | Fundo | Cobre todo o frame |
| L1 | Horizonte/montanhas distantes | Foto/still | Silhueta suave | Translação lenta | 0.4× | Leve scale-in | Fundo-médio | Full-bleed |
| L2 | Baía/geografia urbana | Foto/still | Nenhuma (camada base) | Translação + scale | 0.7× | Scale-in `1.01–1.03` | Foco principal | Full-bleed, atenção ao ponto do Rio (ver §10) |
| L3 (opcional) | Elemento de primeiro plano (ex.: vegetação de mirante) | Foto/still ou composto | Máscara recortada | Translação mais rápida | 1.1× | Leve scale | Primeiro plano | Cortável nas bordas |

### SHOT-05 — Helicóptero (4–5 camadas)

| Camada | Conteúdo | Fonte pretendida | Máscara/transparência | Movimento de scroll | Velocidade relativa | Escala | Prioridade de profundidade | Recorte |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L0 | Atmosfera/haze distante | Foto/still ou gerado | Gradiente | Quase estático | 0.2× | Fixa | Fundo | Full-bleed |
| L1 | Paisagem distante do Rio | Foto/still | Silhueta suave | Translação lenta | 0.4× | Scale-in leve | Fundo-médio | Full-bleed |
| L2 | Corcovado/Cristo ao longe (foco de chegada) | Foto/still | Nenhuma | Translação + scale | 0.7× | Scale-in moderado | Foco secundário | Centralizado |
| L3 | Moldura de cabine/vidro | Foto/still (referência real de cabine) | Máscara com furo central (o "olho" do vidro) | Quase fixa (ancorada ao viewport) | 0.05× | Fixa | Primeiro plano | Fixo nas bordas |
| L4 (opcional) | Reflexo/brilho no vidro | Overlay sutil (CSS/gradiente, não fotografia separada) | Blend mode | Reage a pointer/scroll levemente | 0.1× | Fixa | Sobre L3 | N/A |

**Restrição de credibilidade:** L3 (moldura de cabine) deve vir de referência real de interior de helicóptero (foto ou desenho técnico), nunca gerada livremente — é o elemento com maior risco de "geometria impossível" citado pelo Owner.

### SHOT-06 — Cristo (4–5 camadas)

| Camada | Conteúdo | Fonte pretendida | Máscara/transparência | Movimento de scroll | Velocidade relativa | Escala | Prioridade de profundidade | Recorte |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L0 | Céu atmosférico | Foto/still | Gradiente | Quase estático | 0.2× | Fixa | Fundo | Full-bleed |
| L1 | Paisagem distante do Rio | Foto/still | Silhueta suave | Translação lenta | 0.4× | Scale leve | Fundo | Full-bleed |
| L2 | Profundidade de montanha | Foto/still | Silhueta | Translação | 0.6× | Scale leve | Fundo-médio | Full-bleed |
| L3 (opcional) | Vegetação/primeiro plano | Foto/still ou composto | Máscara recortada | Translação mais rápida | 1.0× | Leve scale | Primeiro plano | Cortável |
| L4 | Cristo (foco) | Foto/still | Nenhuma (ou recorte preciso se composto) | Aproximação final + settle | 0.8× | Scale-in `1.02→1.08` | Foco principal | Nunca cortar braços/cabeça |
| L5 | Luz/haze controlado | Overlay (gradiente/blend) | Blend mode (screen/soft-light) | Reage a `p` (mais forte perto de 100%) | N/A | N/A | Sobre L4 | N/A |

## 8. Handoff crítico: Brasil (WebGL) → Rio (mídia)

Este é o ponto de maior risco de produção de todo o Hero: a mudança de técnica (3D real → imagem estática) não pode ler como "o 3D acabou e uma foto apareceu".

**Estado atual (RT-17, inalterado):** em 44%, `globeWrap` desvanece (`opacity 0`, 0.09s) enquanto `rioScene` aparece (`opacity 1`, 0.1s) com um scale-in leve; a câmera WebGL continua o dolly (`dist → 1.72`) durante o crossfade, para que o "encaixe" pareça aproximação contínua, não corte.

**Técnicas de produção recomendadas para o asset final** (nenhuma delas exige vídeo):

1. **Direção de câmera equivalente:** o primeiro frame do SHOT-04 deve ter um ângulo de câmera compatível com a última posição de câmera do WebGL sobre o Brasil/Rio (`lat -17`, `lon -47`, olhando para a âncora do Rio) — mesma altitude aparente, mesma orientação.
2. **Escala compatível:** o tamanho aparente da baía/geografia no primeiro frame do SHOT-04 deve corresponder à escala que a câmera WebGL alcançaria naquele ponto (nem "zoom para fora" nem "zoom para dentro" perceptível no corte).
3. **Correspondência de topografia/costa:** os contornos de costa visíveis no frame final do WebGL (mesmo esquemáticos) devem apontar na mesma direção geral que a foto real da baía — nunca uma rotação de 90°+ entre os dois.
4. **Continuidade de luz:** a direção de luz estabelecida no shader (`direction(18, -6)`, leste-superior) deve ser respeitada no still do Rio — mesmo lado iluminado, mesma temperatura de cor.
5. **Sobreposição atmosférica:** uma camada de neblina/haze dourada, com opacidade decrescente, pode ser renderizada por cima do frame final do WebGL E por baixo do primeiro frame do still, para que ambos "respirem" na mesma névoa — mascarando a costura sem escondê-la atrás de um corte seco.
6. **Blur controlado na transição:** um blur muito leve e breve (poucos frames de progresso) no exato ponto de crossfade pode suavizar a diferença de nitidez entre render 3D e fotografia, sem borrar a cena de forma perceptível fora da transição.
7. **Vetor de movimento comum:** a direção de translação/scale do WebGL (aproximação para sudeste, na direção do Rio) deve continuar como a direção de scale-in inicial do SHOT-04 — o olho não deve perceber uma mudança de direção de movimento no ponto de corte.
8. **Crossfade como ferramenta secundária:** usado apenas para ocultar a transição de técnica, nunca como o único recurso de continuidade — os itens 1–7 fazem o trabalho principal.

Nenhuma dessas técnicas requer vídeo, apenas: (a) direção de arte cuidadosa na escolha/edição do still do Rio, e (b) ajuste fino de crossfade/blur na integração (RT-27), que já usa a arquitetura de camadas existente.

## 9. Mapa de transições

| De → Para | Princípio de continuidade | Âncora visual | Direção de movimento | Mudança de profundidade | Continuidade de luz | Conceito de implementação |
| --- | --- | --- | --- | --- | --- | --- |
| Globo → América do Sul | Aproximação contínua da câmera | Silhueta do continente | Dolly-in, leste-sudeste | Aumenta (menor distância) | Constante | Já implementado (timeline GSAP única) |
| América do Sul → Brasil | Mesmo dolly, sem corte | Contorno do Brasil emergindo | Dolly-in, mesma direção | Aumenta | Constante | Já implementado |
| Brasil → Rio | Ver §8 (handoff crítico) | Âncora do Rio (ponto WebGL) | Dolly-in convergindo para a baía | Aumenta (WebGL→still) | Constante, com camada atmosférica de ponte | A implementar em RT-27, seguindo §8 |
| Rio → Helicóptero | Câmera "entra" na cena (baía recua, cabine aparece) | Ponto de Corcovado/Cristo ao longe | Aproximação + leve mudança de ângulo (voo) | Aumenta (aproximação aérea) | Constante | Crossfade + scale, camadas L3 (moldura) fixa ancora a leitura de "dentro da cabine" |
| Helicóptero → Cristo | Moldura da cabine se abre/desaparece | Cristo em foco crescente | Aproximação final, desaceleração | Aumenta, depois estabiliza | Mais quente (aprox. golden hour) | Opacity/scale da moldura + crossfade para o still final |
| Cristo → próxima seção da Home | Settle cinematográfico, liberação do sticky | Cristo estável no quadro final | Nenhum (settle) | Estável | Constante | Já implementado (release do sticky, sem novo corte de página) |

## 10. Enquadramento desktop + mobile

Definido por shot desde o início, não resolvido depois:

| Shot | Posição do foco (desktop) | Posição do foco (mobile) | Região protegida | Recorte permitido | Recorte proibido | Contexto mínimo visível |
| --- | --- | --- | --- | --- | --- | --- |
| SHOT-04 Rio | Baía ocupa ~60% da largura, à direita/centro | Ponto do Rio centralizado verticalmente | Skyline + ponto de referência do Rio | Bordas laterais (desktop), topo/base (mobile) | Cortar o ponto de referência principal do Rio | Horizonte + baía sempre visíveis |
| SHOT-05 Helicóptero | Moldura de cabine nas bordas, paisagem central | Moldura mais fechada, Corcovado sempre centralizado | Corcovado/Cristo distante | Bordas da moldura de cabine | Cortar o Corcovado/Cristo ao longe | Corcovado sempre visível, mesmo reduzido |
| SHOT-06 Cristo | Cristo no terço direito/central, braços completos | Cristo centralizado, verticalmente dominante | Cristo (cabeça a base), braços completos | Fundo/céu nas bordas | Cortar braços ou cabeça do Cristo | Cristo inteiro sempre visível |

Área segura de tipografia: em todas as cenas 04–06, o terço inferior (desktop) ou a faixa inferior fixa (mobile, já usada por `.bottom` no CSS atual) permanece livre de elementos focais de alto contraste, para não competir com o rail de progresso (RT-18) e o texto do hero.

## 11. Matriz de produção de ativos

| Shot | Classificação de método (obrigatória) | Fonte candidata | Classificação de fotografia do Owner |
| --- | --- | --- | --- |
| SHOT-01–03 | WEBGL | Já implementado | N/A |
| SHOT-T-0304 | COMPOSITE | Frame final do WebGL + camada atmosférica + still do Rio | N/A |
| SHOT-04 Rio | A DEFINIR entre: STATIC IMAGE / LAYERED STATIC (2.5D) / OWNER ORIGINAL PHOTO / LICENSED PHOTO / GENERATED STILL IMAGE | Ver auditoria abaixo | **REFERENCE ONLY** — `imagem-rio-perfil.jpg` e o pacote Rio Story (RT-16 §8) são referências de enquadramento/luz aprovadas para a seção editorial, mas não foram validados para a composição aérea exigida aqui; nenhum uso automático |
| SHOT-05 Helicóptero | A DEFINIR entre as mesmas opções | Nenhuma referência real de cabine identificada no inventário atual | **NEW ASSET REQUIRED** — nenhuma foto de cabine de helicóptero real está no pacote |
| SHOT-06 Cristo | A DEFINIR entre as mesmas opções | Nenhuma referência de Cristo Redentor identificada no inventário atual além do still temporário | **NEW ASSET REQUIRED** |

**Nota sobre `USABLE DIRECTLY` / `USABLE WITH EDITING`:** nenhum ativo do inventário atual (RT-16 §8) foi encontrado com evidência suficiente para essas classificações nas composições exigidas aqui (vista aérea da baía, interior de cabine, Cristo em enquadramento final). A auditoria completa da biblioteca de fotografia do Owner é trabalho da RT-24, não deste documento — RT-23 não assume que fotos existentes bastam nem que geração é necessária.

**GENERATED VIDEO:** não faz parte da matriz. Se uma necessidade concreta surgir depois (ex.: um loop de nuvem/água muito sutil como camada de suporte), isso é **opcional, requer aprovação explícita do Owner** e uma tarefa própria — não está especificado aqui.

## 12. Especificação de imagem gerada (condicional, não executada)

Aplica-se **apenas se** a RT-24 concluir que fotografia do Owner/licenciada não é suficiente para SHOT-05 e/ou SHOT-06 (os dois casos classificados como `NEW ASSET REQUIRED` em §11). Nenhuma imagem é gerada nesta tarefa. Template de especificação a preencher, por shot, se necessário:

- **Subject:** [ex.: interior de cabine de helicóptero, olhando através do para-brisa para o Corcovado ao entardecer]
- **Composição exata:** [ex.: para-brisa ocupando 70% do quadro, Corcovado no terço superior-central]
- **Câmera:** [ex.: subjetiva, altura de olho de piloto, sem distorção de grande-angular]
- **Sensação de lente:** [ex.: 35–50mm equivalente, sem fisheye]
- **Geografia:** [ex.: Baía de Guanabara vista do sudoeste, Corcovado reconhecível]
- **Iluminação:** [ex.: golden hour, luz quente lateral, consistente com §4]
- **Profundidade:** [camadas esperadas, ver §7]
- **Condições atmosféricas:** [ex.: leve neblina na baía, céu limpo com nuvens esparsas]
- **Realismo:** fotorrealista, sem artefatos de IA visíveis, sem geometria impossível de cabine
- **Enquadramento desktop:** [ver §10]
- **Enquadramento seguro para mobile:** [ver §10]
- **Restrições negativas:** sem instrumentos falsos, sem texto/logotipo, sem distorção de Cristo/Corcovado, sem excesso de lens flare, sem estética sci-fi

## 13. Requisitos de proveniência/licenciamento

Para **todo** ativo final proposto (a preencher pela RT-24, não por este documento):

| Campo | Requisito |
| --- | --- |
| SOURCE | Origem exata do arquivo (URL, banco de imagens, câmera do Owner, etc.) |
| OWNER / AUTHOR | Autor/fotógrafo, ou "Rick Travel" se autoral |
| LICENSE | Tipo de licença (própria, licenciada comercial, banco de imagens com termos específicos) |
| USAGE RIGHTS | Uso comercial web confirmado; restrições de território/tempo, se houver |
| ORIGINAL FILE | Caminho/hash do arquivo original antes de qualquer edição |
| PROVENANCE EVIDENCE | Documento, e-mail, contrato ou nota que comprove a origem |
| EDIT HISTORY | Registro de qualquer edição (crop, color grade, composição) |

**Nenhuma mídia sem esses campos preenchidos deve se tornar final.** Os três arquivos temporários atuais (`rio-aerial-arrival.webp`, `rio-helicopter-cockpit.webp`, `rio-christ-finale.webp`) permanecem **PENDING VERIFICATION** e não são promovidos por este documento — eles continuam a servir apenas como placeholders funcionais do protótipo aceito no Sprint 2.

## 14. Riscos conhecidos

- **Handoff Brasil→Rio (§8):** maior risco de produção; se mal executado, reintroduz a sensação de corte que o Owner já notou como perceptível (RT-21) — atualmente aceitável, mas um handoff malfeito pode piorar essa percepção.
- **Débito de fidelidade geográfica do WebGL (RT-17):** contornos esquemáticos podem destacar ainda mais a diferença de fidelidade quando justapostos a fotografia real no handoff.
- **Ausência de fotografia própria para helicóptero e Cristo (§11):** força avaliação entre fotografia licenciada e imagem gerada; ambas trazem exigências de proveniência (licenciamento comercial) ou de credibilidade geométrica (geração), respectivamente.
- **Geometria de cabine implausível:** citado explicitamente pelo Owner como algo a evitar; qualquer fonte gerada para SHOT-05 precisa de referência real de interior de helicóptero.
- **Peso de mídia/performance:** múltiplas camadas de alta resolução por cena (§7) aumentam o peso total; RT-26/RT-28 (fora do escopo do RT-23) precisarão de um pipeline de otimização e carregamento progressivo.
- **Recorte mobile:** perder o Cristo, o Corcovado ou o ponto do Rio no recorte vertical quebraria a legibilidade narrativa — mitigado pelas regras de "contexto mínimo visível" em §10, mas requer validação visual real na RT-27.
- **Deriva de paleta:** risco de a mídia final "photo look" (temperatura/saturação diferente do WebGL) quebrar a continuidade cromática estabelecida na bíblia visual (§4).
- **Reintrodução acidental de vídeo:** como o título original mencionava Seedance, há risco de tickets futuros reintroduzirem vídeo por hábito; este documento e o comentário de correção de escopo no Jira existem para prevenir isso.

## 15. Critérios de aceite

- [x] Seis estágios canônicos e faixas percentuais preservados sem alteração (§3, §6).
- [x] Documento reflete a arquitetura scroll-driven aprovada pelo Owner (§2), não vídeo pré-renderizado.
- [x] Nenhuma dependência acidental de vídeo gerado; Seedance/vídeo explicitamente não-obrigatório (§2, §11).
- [x] Todo shot classificado por método de mídia (§6, §11); nenhum "vídeo" atribuído por padrão.
- [x] Requisitos de camada/profundidade 2.5D documentados por cena não-WebGL (§7).
- [x] Desktop e mobile especificados desde o início para cada shot, não depois (§10).
- [x] Requisitos de proveniência explícitos e aplicáveis a todo ativo futuro (§13).
- [x] Nenhum arquivo de implementação alterado; nenhuma mídia gerada; Version C intocada.
- [x] Handoff crítico Brasil→Rio tratado com técnicas de continuidade, não com automação de vídeo (§8).

## 16. Handoff para a próxima tarefa do Sprint 3

**Próximo ticket canônico:** RT-24 — [RT-RB-S3-02] Gerar e selecionar takes finais (depende de RT-RB-S3-01, ou seja, deste documento).

RT-24 deve:

1. Auditar a biblioteca real de fotografia do Owner contra as classificações "A DEFINIR" da §11.
2. Produzir ou licenciar os ativos que a auditoria concluir como `NEW ASSET REQUIRED`.
3. Preencher a matriz de proveniência (§13) para cada ativo selecionado.
4. Só então avançar para RT-25 (revisão de continuidade) e RT-26 (pipeline de otimização).

Este documento não decide o método final de cada shot (foto do Owner vs. licenciada vs. gerada) — essa decisão pertence à RT-24, informada pela auditoria real de ativos disponíveis, que este documento não teve acesso para realizar.
