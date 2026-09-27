# RT-26 — Pipeline de derivados de mídia do Hero

**Status:** Engenharia concluída. Nenhuma mídia final foi produzida; nenhum arquivo do Hero foi alterado.

**Data:** 27/09/2026

**Jira:** RT-26 / RT-RB-S3-04 (`Em andamento` → `Concluído` nesta tarefa), Sprint 3 — Media & Final Hero

## 1. Correção de escopo

O título original ("Criar pipeline FFmpeg: master → desktop/mobile/poster") carregava suposições do plano de mídia antigo (orientado a vídeo). A arquitetura aprovada no Sprint 2 é 0–44% WebGL + 44–100% imagem estática em camadas/2.5D, sem vídeo pré-renderizado. O título e a descrição do RT-26 foram corrigidos no Jira (chave preservada): **"Criar pipeline de derivados de mídia: master → desktop/mobile/layers"**.

## 2. Auditoria de ferramentas

| Ferramenta | Situação no projeto | Adequação para imagem estática |
| --- | --- | --- |
| `sharp` (^0.34.5) | Já é dependência do projeto (`package.json`); já usada em `scripts/optimize-images.js` para resize/recompressão | Nativa para imagem, bindings rápidos, portátil para deploy (pacote npm com binários pré-compilados suportados pela Vercel) |
| FFmpeg | Instalado nesta máquina apenas como binário de sistema (via winget); **não é dependência do projeto** | Ferramenta de vídeo/áudio; sem papel legítimo numa arquitetura 100% still/2.5D; não portátil para deploy sem etapa de build adicional |
| Next.js Image (`next/image`) | Disponível no projeto | Otimiza em tempo de requisição para `<Image>`; não é usado pelo Hero (`globe-journey.tsx` usa `background-image` inline e imports estáticos diretos, não `<Image>`), então não substitui a necessidade de um pipeline de derivados versionados e reproduzíveis |

**Decisão: FFMPEG NÃO É APROPRIADO — usar o pipeline de imagem já existente (`sharp`).** Nenhuma dependência nova foi adicionada.

## 3. Terminologia "poster"

"Poster" (frame de vídeo) não tem papel na arquitetura atual. Redefinido como **"preview"**: um placeholder leve e opcional (24px de largura, qualidade baixa) para carregamento progressivo, gerado pelo pipeline mas **não obrigatório** para a conclusão do RT-26 — seu consumo real (blur-up, LQIP) é decisão da RT-28, não desta tarefa.

## 4. Arquitetura do pipeline

```
scripts/media-pipeline/
  manifest.json   — identidade dos assets do Hero, separada do caminho de arquivo
  run.mjs         — SOURCE MASTER -> PRODUCTION DERIVATIVES
scripts/
  rt-26-media-pipeline-validation.mjs
```

`node scripts/media-pipeline/run.mjs [--manifest <path>] [--out <dir>]`

Para cada asset do manifesto, o pipeline:

1. Valida que o master existe e é uma imagem válida (rejeita com erro claro e código de saída 1 caso contrário, sem interromper o processamento dos demais assets).
2. Gera o derivado **desktop**: mesma proporção do master, largura limitada a `min(1920, larguraOriginal)` — **nunca upscale**.
3. Gera o derivado **mobile**: crop por ponto focal (não center-crop genérico) na proporção 4:5 por padrão, redimensionado para 720px de largura (configurável por asset).
4. Gera opcionalmente um **preview** (24px, qualidade baixa).
5. Gera derivados de **camadas** (`layers[]`), se o asset especificar alguma — nenhum asset atual especifica, mas o código já suporta, para quando a RT-27 precisar de recortes isolados (ex.: uma camada de moldura de cabine com alpha).
6. Escreve um relatório JSON (`report.json`) com dimensões, bytes e formato de cada derivado, e o status de proveniência herdado do master.

### Crop por ponto focal (não center-crop genérico)

Cada asset declara um `focal: {x, y}` normalizado (0–1) no manifesto, conforme a composição definida na RT-23 §10. O pipeline calcula o maior retângulo possível na proporção alvo que mantém esse ponto o mais centralizado possível dentro dos limites da imagem-fonte — não um crop central fixo. Prova prática: os três assets de teste têm pontos focais diferentes (`x = 0.62`, `0.50`, `0.68`) e produziram recortes com posições horizontais diferentes (`left = 660`, `460`, `760`), e o recorte do Cristo preserva a figura inteira (cabeça e braços), o que um center-crop ingênuo não garantiria.

## 5. Manifesto de mídia (identidade separada de caminho de arquivo)

`scripts/media-pipeline/manifest.json` — cada entrada tem:

| Campo | Papel |
| --- | --- |
| `id`, `scene` | Identidade estável (a RT-27 consome por `id`, nunca por nome de arquivo) |
| `master.path` | Único campo que muda quando um asset final substitui o temporário |
| `master.provenanceStatus` | `RIGHTS_NOT_VERIFIED` \| `RIGHTS_VERIFIED` |
| `master.productionStatus` | `PROTOTYPE_ONLY` \| `CANDIDATE` \| `PRODUCTION_APPROVED` |
| `master.replaceBeforeProduction` | Flag explícita de bloqueio de lançamento |
| `master.sourceRef` | Referência de proveniência (ex.: nota da RT-24) |
| `focal` | Ponto focal normalizado, usado no crop mobile |
| `desktop`/`mobile`/`preview` | Overrides opcionais de tamanho/qualidade por asset |
| `layers[]` | Derivados de camada adicionais, se necessário |

Fluxo real de substituição de asset (o objetivo declarado da RT-26):

1. Adicionar o master verificado ao repositório.
2. Atualizar `master.path` (e `provenanceStatus`/`productionStatus`) no manifesto.
3. Rodar `node scripts/media-pipeline/run.mjs`.
4. Os derivados desktop/mobile/layer são gerados automaticamente.
5. Rodar a validação.
6. Revisão visual do Owner.
7. Marcar `PRODUCTION_APPROVED` no manifesto.

Nenhuma reescrita de GSAP/ScrollTrigger/2.5D é necessária nesse fluxo — a RT-27 (quando implementada) deve consumir os derivados pelo `id`, não pelo nome do arquivo temporário atual.

## 6. Contrato de placeholder e herança de proveniência

Os três masters de teste estão marcados `PROTOTYPE_ONLY` / `RIGHTS_NOT_VERIFIED` / `replaceBeforeProduction: true` — os mesmos status já registrados pela RT-17/RT-24. **Todo derivado gerado herda esse status literalmente**; o pipeline não tem nenhum caminho de código que promova um derivado a um status mais alto que o do seu master. Isso foi verificado automaticamente (§8).

Isso significa: os arquivos gerados por esta tarefa em `.tmp/rt-26-media-pipeline/` são, eles próprios, `PROTOTYPE_ONLY` / `RIGHTS_NOT_VERIFIED` — nunca devem ser tratados como aprovados para produção, e vivem em `.tmp/` (não rastreado pelo git), o que evita que sejam confundidos com saída final versionada.

## 7. Saída de teste (assets temporários como master representativo)

| Asset | Master (temporário) | Desktop | Mobile (crop) | Preview |
| --- | --- | --- | --- | --- |
| `rio-04` | `rio-aerial-arrival.webp` (1672×941) | 1672×941, 154 KB | 720×900, 54 KB (crop left=660) | 24×14, 122 B |
| `helicopter-05` | `rio-helicopter-cockpit.webp` (1672×941) | 1672×941, 116 KB | 720×900, 45 KB (crop left=460) | 24×14, 176 B |
| `christ-06` | `rio-christ-finale.webp` (1672×941) | 1672×941, 151 KB | 720×900, 62 KB (crop left=760) | 24×14, 140 B |

Nenhum arquivo original foi sobrescrito; toda saída está em `.tmp/rt-26-media-pipeline/`.

## 8. Validação

`node scripts/rt-26-media-pipeline-validation.mjs` — cobre:

- Derivado desktop e mobile gerados, com dimensões e tamanho em bytes reportados.
- Nenhum upscale (largura do derivado ≤ largura da fonte/crop).
- Crop mobile por ponto focal, não center-crop genérico (três pontos focais diferentes produziram três posições de crop diferentes).
- Execução repetida produz saída **byte-idêntica** (hash SHA-256 comparado entre duas execuções) — determinístico.
- Master ausente/inválido é rejeitado com código de saída 1, sem interromper os demais assets.
- Preservação de canal alpha (testado com uma imagem sintética gerada em memória apenas para este teste — nenhum asset de produção fabricado).
- Status de proveniência/produção herdado literalmente do master para todo derivado.
- Nenhum arquivo temporário de origem foi sobrescrito (hash comparado antes/depois).
- Nenhum arquivo do Hero (`globe-journey.tsx`, `.module.css`, `globe-3d.ts`, `world-atlas.ts`, `page.tsx`) foi alterado (hash comparado antes/depois).
- Diretório de saída claramente não-final (`.tmp/...`).

Resultado: **PASS** em todas as verificações.

Gates adicionais executados: `npx tsc --noEmit` (pass), `npx eslint scripts/media-pipeline/run.mjs scripts/rt-26-media-pipeline-validation.mjs` (pass, 0 avisos), `npx vitest run` (34/34 pass, suíte não relacionada mas confirmada sem regressão), `git diff --check` (limpo).

## 9. O que a RT-27 pode assumir

A RT-27 (integração da mídia final no Hero cinematográfico) pode consumir os assets por `id` do manifesto (`rio-04`, `helicopter-05`, `christ-06`) sem saber se a origem é foto do Owner, licenciada ou gerada — essa informação fica inteiramente em `master.sourceRef`/`provenanceStatus`, fora do caminho de consumo. A RT-27 não é implementada aqui.

## 10. Limites conhecidos

- Nenhuma camada (`layers[]`) foi gerada nesta tarefa — nenhum asset atual define uma; o suporte de código existe para quando for necessário (ex.: uma máscara de moldura de cabine).
- A proporção mobile padrão (4:5) e a largura (720px) são valores de engenharia razoáveis para teste, não a decisão final de recorte — a RT-23 §10 continua sendo a referência de enquadramento; ajustes finos de crop por cena continuam configuráveis por asset no manifesto.
- Este pipeline não substitui a necessidade de licenciamento/verificação de proveniência (RT-24) nem a revisão de continuidade (RT-25) — ele só processa o que o manifesto aponta, com o status que o manifesto declara.
