# RT-27 — Arquitetura de mídia 2.5D no cinematic Hero

**Status:** Parte A (implementação) concluída. Parte B (aceite de mídia final) pendente de RT-24/RT-25.

**Data:** 27/09/2026

**Jira:** RT-27 / RT-RB-S3-05, Sprint 3 — Media & Final Hero

## 1. Escopo desta tarefa

O título original ("Integrar mídia final ao cinematic hero") pressupunha mídia final já existente. Ela não existe (RT-24 continua em Revisar). Esta tarefa foi dividida:

- **A — Implementação (esta tarefa):** construir a arquitetura real de camadas/contrato de cena, usando os assets temporários atuais como conteúdo de teste.
- **B — Aceite final (fora desta tarefa):** trocar os assets temporários por mídia final verificada e revalidar. Depende de RT-24/RT-25.

Nenhuma mídia final foi produzida ou aprovada aqui.

## 2. O que mudou e o que não mudou

**Preservado byte-a-byte:** os seis limites do RT-16 (`[0, 0.12, 0.28, 0.44, 0.62, 0.78]`), a câmera/timeline do WebGL (Globo/América do Sul/Brasil), o rail de progresso do RT-18, o pointer depth do RT-19, a arquitetura de fallback do RT-20, e todos os valores numéricos de opacidade/escala/translação das cenas Rio/Helicóptero/Cristo — apenas a **origem** desses valores mudou, de literais inline para um módulo de dados.

**Adicionado:** um contrato de mídia declarativo (`hero-media.ts` + `hero-media-status.ts`) e uma camada extra ("bridge") para o handoff Brasil→Rio.

## 3. Contrato de mídia em runtime

```
app/[locale]/rebuild-lab/cinematic-3d-poc/
  hero-media-status.ts  — status de proveniência/produção, sem imports (Node/tsx-safe)
  hero-media.ts          — cenas + camadas + keyframes; importa os .webp e o status acima
  globe-journey.tsx       — consome buildHeroScenes(mobile); nenhum caminho de arquivo hardcoded
```

`scripts/media-pipeline/manifest.json` (RT-26) é uma configuração de **build-time** (usa caminhos de sistema de arquivos e campos específicos do sharp) — não é importada no bundle do cliente. A relação entre os dois lados é o `mediaId` (`rio-04`, `helicopter-05`, `christ-06`), o mesmo id usado nas duas pontas:

```
SOURCE MASTER (arquivo real)
  -> RT-26 pipeline (scripts/media-pipeline) -> derivados desktop/mobile/layer
  -> HERO SCENE (hero-media.ts, por mediaId)
  -> HERO LAYERS (renderizadas por globe-journey.tsx)
```

`hero-media-status.ts` foi separado de `hero-media.ts` porque este último importa os três `.webp` estaticamente — resolução que só funciona dentro do pipeline webpack do Next, não em um script Node/tsx simples. O status (usado pelo gate de prontidão, §6) precisa ser importável dos dois lados.

### Modelo de cena/camada

```ts
type HeroLayer = {
  id: string;
  type: "base" | "bridge" | "atmosphere" | "foreground";
  src?: string;                 // ausente para camadas só-CSS (ex.: bridge)
  focal: { x: number; y: number };
  initial: Record<string, number>;
  keyframes: { at: number; vars: Record<string, number | string> }[];
  loadPriority: "immediate" | "near" | "later";
};

type HeroScene = {
  id: "rio" | "flight" | "finale";   // contrato DOM existente, preservado
  mediaId: "rio-04" | "helicopter-05" | "christ-06"; // chave com o manifesto RT-26
  stage: number;
  mediaStatus: MediaStatus;           // de hero-media-status.ts
  layers: HeroLayer[];
};
```

`globe-journey.tsx` renderiza `heroScenesForRender.map(scene => scene.layers.map(layer => <div data-scene data-layer data-media-status .../>))` e, no efeito, monta a timeline com um laço genérico:

```ts
for (const scene of heroScenes) {
  for (const layer of scene.layers) {
    const el = heroLayerElements.get(`${scene.id}:${layer.id}`);
    if (!el) continue; // camada ausente não derruba o Hero
    for (const kf of layer.keyframes) timeline.to(el, kf.vars, kf.at);
  }
}
```

Nenhum nome de arquivo temporário aparece em `globe-journey.tsx` — os três `import ... from "./assets/*.webp"` agora vivem só em `hero-media.ts`.

## 4. Nenhuma camada fabricada

Cada uma das três cenas tem **uma única camada real de imagem** (`base`), porque é a única imagem real que existe hoje por cena. A cena "rio" tem uma segunda camada, "bridge" — **sem imagem**, um gradiente CSS — para o handoff (§5). Nenhuma camada de primeiro plano/atmosfera fabricada foi criada para simular suporte a L0–L5; o suporte de engenharia para múltiplas camadas existe (o laço acima já funciona com N camadas), mas as camadas em si só existem quando há imagem real por trás.

## 5. Handoff Brasil → Rio

Implementada apenas a técnica placeholder-safe da RT-23 §8 que não exige mídia nova: uma camada "bridge" (gradiente radial dourado, `mix-blend-mode:screen`, mesma paleta do halo do WebGL) que pulsa brevemente entre 0.40 e 0.53 — sobe a 0.5 de opacidade em 0.44, desce a 0 logo em seguida — sobreposta exatamente à janela em que `globeWrap` (não tocado) já desvanece e a camada `rio/base` (não tocada) já aparece. Isso reduz a sensação de corte sem tocar em câmera, escala ou luz do WebGL, e sem nenhuma imagem nova.

As demais técnicas da RT-23 §8 (correspondência de topografia, blur controlado na imagem em si, vetor de movimento compartilhado no nível de composição fotográfica) dependem da imagem final do Rio e não foram implementadas — ficam para a RT-27 "parte B" ou para revisão futura, quando houver asset real para calibrar contra elas.

## 6. Segurança de produção

- `data-media-status` é escrito no DOM de cada camada base (`PROTOTYPE_ONLY` hoje) — inspecionável via devtools/código, **não é um aviso visível ao usuário público**.
- `scripts/rt-27-media-readiness-check.ts` (via `tsx`) falha (`exit 1`) se qualquer cena não estiver `PRODUCTION_APPROVED` + `RIGHTS_VERIFIED`. Executado agora, ele falha corretamente para as três cenas — prova de que o gate funciona. **Não está** ligado a `npm run build`, `preflight:staging` ou qualquer caminho normal de desenvolvimento; existe para a RT-29 (Owner Hero Gate), sob demanda.

## 7. Prioridade de carregamento (dado, não comportamento)

Cada camada tem um `loadPriority` (`immediate` | `near` | `later`) — `rio.base` = `near`, `flight.base`/`finale.base` = `later`, `bridge` = `immediate`. Isso é só metadado; **nenhum comportamento de carregamento foi alterado** nesta tarefa (os três `.webp` continuam import estático como antes). A RT-28 decide o que fazer com essa categorização.

## 8. Validação

Gate dedicado: `node scripts/rt-27-hero-media-integration-validation.mjs` — cobre os 16 itens do escopo (seis stages/limites inalterados, RT-18/19/20 preservados, as três cenas usam o novo contrato, proveniência inalterada e nunca reportada como aprovada, desktop/mobile sem overflow em 1440/768/390/360, scroll reverso e rápido, sem frame em branco no handoff, camada ausente não derruba o Hero). **PASS** em execução limpa.

Também executados: `tsc --noEmit` (pass), `eslint` (pass, 0 avisos), `vitest run` (34/34), `rt-17-3d-poc-validation.mjs` (pass, 12 comparações + 8 fallbacks — Version A/B intocadas, RT-18 sincronizado), `rt-19-pointer-parallax-validation.mjs` (pass, T1–T10), `rt-20-fallback-validation.mjs` (pass, matriz A–G), `rt-26-media-pipeline-validation.mjs` (pass), `git diff --check` (limpo).

## 9. O que a Owner review desta tarefa cobre

Uma nova revisão visual da Version C é esperada, mas é sobre **arquitetura/sensação** (a nova camada de handoff, se a estrutura de camadas preserva/melhora a experiência) — **não é aprovação de mídia final**. Essas duas coisas continuam distintas: a mídia usada é a mesma temporária de sempre.

## 10. Limites conhecidos

- Nenhuma camada de primeiro plano/atmosfera real foi adicionada a Helicóptero/Cristo — apenas a estrutura para recebê-las quando existir imagem real (RT-24/RT-25).
- A técnica de handoff implementada é a única placeholder-safe da lista da RT-23 §8; as demais dependem de calibração contra a imagem final do Rio.
- `loadPriority` é metadado sem efeito de carregamento ainda — isso é trabalho da RT-28.
