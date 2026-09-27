# RT-24 — Seleção de mídia final do Hero (audit + candidatos)

**Status:** Em andamento → aguarda seleção visual e confirmação de proveniência do Owner. Nenhum asset foi promovido a final. Nenhum código, WebGL ou Version C foi alterado.

**Data:** 27/09/2026

**Jira:** RT-24 / RT-RB-S3-02 (`Em andamento`), Sprint 3 — Media & Final Hero

**Depende de:** RT-23 (`docs/architecture/rt-23-final-hero-media-shot-list.md`, commit `d607c56`)

## 1. Referência RT-23

Alvos de produção desta tarefa (RT-23 §6): SHOT-T-0304 (transição Brasil→Rio), SHOT-04 (Rio), SHOT-05 (Helicóptero), SHOT-06 (Cristo Redentor). Estágios 1–3 permanecem WebGL, não tocados. Nenhuma geração de vídeo é considerada — apenas still/camada/composite, conforme a arquitetura aprovada no Sprint 2.

**Limitação de execução registrada:** este ambiente de execução não tem acesso a uma ferramenta de geração de imagem, a serviços de banco de imagens licenciáveis, nem à biblioteca de fotografia privada real do Owner além do que já está versionado neste repositório. Por isso, esta tarefa é um **audit do inventário real do repositório** e uma proposta de candidatos — não uma produção fotográfica nova. Onde nenhum candidato adequado existe, isso é registrado como `NEW ASSET REQUIRED`, para ação humana (compra/licenciamento/sessão de fotos) ou uso futuro de uma ferramenta de geração, não resolvido aqui.

## 2. Auditoria de assets existentes

Inspeção do repositório (`public/images/`, `public/videos/`, `docs/baseline/.../assets/`, `app/[locale]/rebuild-lab/cinematic-3d-poc/assets/`) e de seu uso real no código (`components/hero-section.tsx`, `data/real-trips.json`, `prisma/seed.ts`).

**Nota histórica relevante:** `docs/validation/home-video-removal-001f.md` (16/06/2026) documenta que o vídeo do hero de produção foi **deliberadamente removido** e substituído por uma imagem estática leve, por performance/UX. Isso reforça, com precedente interno, a decisão de não reintroduzir vídeo no Hero cinematográfico.

| Arquivo | Localização | Papel atual no site | Conteúdo observado |
| --- | --- | --- | --- |
| `imagem-rio-perfil.jpg` | `public/videos/` | Hero de produção atual (`components/hero-section.tsx`) | Vista da baía/montanhas a partir de um mirante; turista e estrutura de teleférico em primeiro plano |
| `imagem-helicoptero-cristo.jpg` | `public/images/trips/` | Produto "passeio de helicóptero" (`prisma/seed.ts`, `IMAGE_HELICOPTERO_CRISTO`) | Tríptico de 3 fotos empilhadas: turistas dentro de cabine de helicóptero, Cristo visível pelo para-brisa em 2 dos 3 painéis |
| `imagem-pao-de-acucar.jpg` | `public/images/trips/` | Produto de trip real (`data/real-trips.json`) | Vista do topo do Pão de Açúcar para o centro/baía/ponte Rio–Niterói; turista e guarda-corpo no terço esquerdo |
| `imagem-morro-pao-de-acucar.jpg` | `public/images/trips/` | Usado em baseline anterior (RT-9) | Vista do Pão de Açúcar a partir do bondinho; cabos e estrutura do bondinho cruzam o quadro |
| `rio-story-sunset-owner-approved.jpeg` | `docs/baseline/.../assets/` | Seção editorial "Rio Story" (nome de arquivo indica aprovação do Owner) | Pôr do sol em praia, palmeiras em silhueta, montanhas distantes; sem baía/cidade |
| `rio-story-church-interior-owner-approved.jpeg` | `docs/baseline/.../assets/` | Seção editorial "Rio Story" | Interior de igreja histórica; assunto não relacionado a nenhum shot-alvo do RT-24 |
| `rio-story-video-poster.jpeg` + `rio-story-owner-approved.mp4` | `docs/baseline/.../assets/` | Poster/vídeo da seção editorial "Rio Story" | Guarda-sol de praia/chinelos, estética de turismo genérico; assunto e estilo não compatíveis com a bíblia visual (RT-23 §4) |
| `rio-aerial-arrival.webp`, `rio-helicopter-cockpit.webp`, `rio-christ-finale.webp` | `app/[locale]/rebuild-lab/cinematic-3d-poc/assets/` | Camadas temporárias do protótipo aceito (RT-17/RT-19/RT-20/RT-21/RT-22) | Composições de aparência profissional/editorial; nenhum registro de proveniência encontrado em nenhum lugar do repositório |

Nenhum desses arquivos tem metadado de licença/autor no repositório (nenhum arquivo `LICENSE`, `credits` ou `provenance` foi encontrado associado a eles). Isso não significa que sejam inadequados — significa que **nenhum pode ser marcado como `FINAL — VERIFIED` sem confirmação explícita do Owner** sobre autoria e direitos de uso.

## 3. Owner photos / fotografia licenciada verificada

**OWNER_PHOTOS_FOUND:** 4 candidatos relevantes com framing de turista real (não stock): `imagem-helicoptero-cristo.jpg`, `imagem-rio-perfil.jpg`, `imagem-pao-de-acucar.jpg`, `imagem-morro-pao-de-acucar.jpg`. Autoria não confirmada no repositório — presumivelmente fotos de cliente/equipe já usadas comercialmente no site, mas isso precisa de confirmação do Owner antes de status `VERIFIED`.

**LICENSED_VERIFIED_ASSETS:** NONE encontrados. Nenhum arquivo de licença comercial ou nota de banco de imagens foi localizado no repositório para nenhum candidato.

## 4. Matriz de candidatos por shot-alvo

### SHOT-T-0304 — Transição Brasil → Rio

| Candidato | Classificação | Observação |
| --- | --- | --- |
| Nenhum asset dedicado existe | **NEW ASSET REQUIRED** | Nenhuma imagem no repositório foi produzida para servir como camada de ponte atmosférica. A RT-23 (§8) especifica que essa transição deve ser derivada do frame final do WebGL + uma camada atmosférica + o primeiro frame do asset de Rio finalmente escolhido — portanto, esta transição só pode ser finalizada depois que a SHOT-04 (Rio) for decidida. Não é um asset independente a ser buscado agora. |

### SHOT-04 — Rio

| Candidato | Classificação | Observação |
| --- | --- | --- |
| `imagem-pao-de-acucar.jpg` | **USABLE WITH EDITING** | Terço direito/central (baía, ponte, cidade, montanhas distantes) tem boa profundidade topográfica real e é geograficamente coerente com o handoff do WebGL (visão de cima, direção sudeste). Precisa de crop para remover a pessoa/guarda-corpo do terço esquerdo. |
| `imagem-morro-pao-de-acucar.jpg` | **REFERENCE ONLY** | Boa geografia de referência (baía, litoral, Pão de Açúcar), mas cabos/estrutura do bondinho dominam o quadro de forma não removível sem reconstrução pesada — não recomendado como base direta. |
| `imagem-rio-perfil.jpg` (asset do hero de produção atual) | **REFERENCE ONLY** | Mesma geografia de referência; pessoa + estrutura de mirante em primeiro plano tornam o crop limpo difícil; também já é o hero de produção atual, o que pede avaliação de redundância editorial. |
| `rio-aerial-arrival.webp` (temporário atual) | **PENDING VERIFICATION** | Visualmente adequado à composição pedida (vista aérea da baía), mas sem proveniência registrada — não pode ser promovido sem confirmação do Owner. |

**Recomendação para revisão do Owner (2–4 candidatos, não uma decisão já tomada):**
1. `imagem-pao-de-acucar.jpg` cortado (terço direito) — geografia real, precisa de edição.
2. `rio-aerial-arrival.webp` atual — já testado no protótipo, mas precisa de proveniência confirmada.
3. Opção combinada: usar (1) como base e (2) como referência de luz/atmosfera.

### SHOT-05 — Helicóptero

| Candidato | Classificação | Observação |
| --- | --- | --- |
| `imagem-helicoptero-cristo.jpg`, painel superior (turista com fone verde, Cristo visível pelo para-brisa) | **USABLE WITH EDITING** | É a composição mais próxima do que a RT-23 pede: moldura de cabine real + Cristo/Corcovado através do vidro. Precisa de crop para isolar apenas este painel do tríptico e avaliação de privacidade/uso de imagem de pessoa reconhecível (já publicada comercialmente no site, mas confirmar com o Owner antes de reuso editorial). |
| `imagem-helicoptero-cristo.jpg`, painel inferior (pessoa com boné, fotografando o Cristo entre nuvens) | **USABLE WITH EDITING** | Alternativa ao painel superior; Cristo mais distante e parcialmente entre nuvens — pode funcionar melhor no início do estágio (62%) antes da aproximação final. |
| `imagem-helicoptero-cristo.jpg`, painel do meio (vista costeira geral, sem Cristo) | **NOT SUITABLE** para este shot específico | Não mostra Corcovado/Cristo; poderia servir como referência de luz/textura de cabine apenas. |
| `rio-helicopter-cockpit.webp` (temporário atual) | **PENDING VERIFICATION** | Visualmente plausível, mas sem proveniência — não promovido. |

**Recomendação para revisão do Owner:**
1. Painel superior de `imagem-helicoptero-cristo.jpg`, recortado — real, geometria de cabine crível, mas com pessoa reconhecível.
2. Painel inferior do mesmo arquivo, recortado — mesma origem, Cristo mais distante.
3. `rio-helicopter-cockpit.webp` atual — já testado no protótipo, proveniência pendente.

### SHOT-06 — Cristo Redentor

| Candidato | Classificação | Observação |
| --- | --- | --- |
| `rio-christ-finale.webp` (temporário atual) | **PENDING VERIFICATION** | Visualmente é exatamente o que a RT-23 pede (contemplativo, golden-hour, profundidade forte, Pão de Açúcar visível), mas a qualidade e o enquadramento sugerem fotografia profissional/stock — precisamente por isso não pode ser assumido como Owner original nem promovido sem prova de origem. |
| Painéis de `imagem-helicoptero-cristo.jpg` (Cristo visto de dentro da cabine) | **REFERENCE ONLY** | Mostra o Cristo, mas do ângulo de dentro da cabine (consistente com SHOT-05, não com a composição contemplativa final de SHOT-06). |
| Nenhum outro candidato de "Cristo isolado, contemplativo" foi encontrado no inventário | **NEW ASSET REQUIRED** se `rio-christ-finale.webp` não puder ser verificado | — |

**Recomendação para revisão do Owner:** confirmar a origem de `rio-christ-finale.webp` é o passo de maior prioridade desta tarefa — se confirmado (fotografia licenciada ou do Owner), resolve SHOT-06 sem produção nova; se não, é `NEW ASSET REQUIRED`.

## 5. Status dos WebPs temporários

`rio-aerial-arrival.webp`, `rio-helicopter-cockpit.webp`, `rio-christ-finale.webp` permanecem **PENDING VERIFICATION**, exatamente como o RT-17 e o RT-23 já registravam. Eles **não foram promovidos** a asset final por esta tarefa, mesmo sendo visualmente adequados — nenhum deles tem proveniência documentada. Eles continuam a servir apenas como placeholders funcionais do protótipo aceito.

## 6. Novos assets necessários

- **SHOT-T-0304 (transição):** camada de ponte atmosférica dedicada — depende da decisão de SHOT-04.
- **SHOT-04 (Rio):** nenhum asset limpo e pronto foi encontrado; `imagem-pao-de-acucar.jpg` precisa de edição (crop) na melhor hipótese encontrada.
- **SHOT-05 (Helicóptero):** nenhuma foto de cabine "limpa" (sem necessidade de crop de tríptico) foi encontrada; ambos os painéis candidatos exigem edição e confirmação de uso de imagem de pessoa.
- **SHOT-06 (Cristo):** condicional à verificação de proveniência do asset temporário atual.

## 7. Camadas candidatas a extrair (se os candidatos acima forem aprovados)

Usando a especificação de camadas da RT-23 §7 como referência, aplicada aos candidatos reais:

**Rio (`imagem-pao-de-acucar.jpg` cortado):** L0 céu (recorte do terço superior), L1 montanhas distantes, L2 baía/ponte/cidade (camada principal), L3 opcional se um elemento de vegetação de primeiro plano puder ser extraído do canto inferior direito.

**Helicóptero (`imagem-helicoptero-cristo.jpg`, painel superior):** L2 Cristo/Corcovado (recorte da porção visível pelo para-brisa), L3 moldura de cabine/vidro (a estrutura preta do para-brisa e o fone de ouvido, como elemento fixo de primeiro plano) — a separação L2/L3 exigirá máscara manual, já que estão na mesma fotografia original.

**Cristo (`rio-christ-finale.webp`, se verificado):** já apresenta profundidade suficiente (Cristo, baía, Pão de Açúcar, ilhas) para os L0–L4 descritos na RT-23; L5 (luz/haze) pode ser um overlay adicional, não extraído da própria foto.

Nenhuma extração de camada foi executada nesta tarefa — isso é trabalho de edição posterior à seleção do Owner.

## 8. Avaliação desktop/mobile

Nenhum candidato foi cortado ou testado em viewport real ainda. Observações preliminares de enquadramento:

- `imagem-pao-de-acucar.jpg`: o terço direito (a parte utilizável) tem proporção aproximadamente quadrada; um crop vertical para mobile precisaria cortar mais do céu do que da baía, para manter a ponte/cidade visível.
- `imagem-helicoptero-cristo.jpg` (painéis): já são fotos em proporção retrato (celular), o que favorece o enquadramento mobile natural; o desktop exigirá decidir se a moldura de cabine se estende ou se ganha padding lateral.
- `rio-christ-finale.webp`: proporção paisagem; um crop vertical para mobile precisa preservar o Cristo inteiro (regra da RT-23 §10 — nunca cortar braços/cabeça), o que provavelmente exige perder parte do Pão de Açúcar/ilhas nas bordas.

Avaliação definitiva requer os arquivos reais em um teste de crop, não realizado aqui.

## 9. Registros de imagem gerada

**GENERATED_STILLS: 0.** Nenhuma imagem foi gerada nesta tarefa — este ambiente de execução não dispõe de uma ferramenta de geração de imagem. As especificações condicionais da RT-23 §12 permanecem como brief pronto para uso, caso a auditoria acima (após confirmação do Owner) conclua que algum shot precisa mesmo de imagem gerada.

**GENERATED_VIDEO: NONE.** Não considerado nesta tarefa, conforme a arquitetura aprovada.

## 10. Riscos abertos

- Nenhuma proveniência documentada existe para qualquer candidato encontrado; toda a matriz acima depende de confirmação do Owner antes de qualquer asset virar `FINAL — VERIFIED`.
- `rio-christ-finale.webp` "parece bom demais para ser um telefone de turista" — risco real de ser stock não licenciado; precisa de verificação antes de qualquer coisa, não apenas aceitação visual.
- Reuso de `imagem-helicoptero-cristo.jpg` envolve pessoas reconhecíveis; precisa de confirmação de que o uso editorial no Hero está coberto pelos mesmos direitos do uso comercial atual (produto de passeio).
- Nenhum candidato limpo foi encontrado para a transição Brasil→Rio como asset independente — isso pode exigir composição nova, não apenas seleção.
- `imagem-rio-perfil.jpg` é o hero de produção atual; substituí-lo/reutilizá-lo no Hero cinematográfico tem implicação de escopo para RT-27 (fora do escopo desta tarefa, mas registrado aqui).

## 11. Handoff para RT-25

RT-25 ("Analisar takes e pedir correções necessárias") depende desta tarefa. Como a seleção visual do Owner ainda não ocorreu, RT-25 não deve iniciar antes que:

1. O Owner escolha entre os candidatos apresentados em §4 (ou rejeite todos, exigindo `NEW ASSET REQUIRED` em algum shot).
2. A proveniência de `rio-christ-finale.webp` seja confirmada ou descartada.
3. O uso de pessoas reconhecíveis em `imagem-helicoptero-cristo.jpg` seja aprovado para este novo contexto editorial.

Este documento permanece a fonte de candidatos; nenhuma decisão final foi tomada.
