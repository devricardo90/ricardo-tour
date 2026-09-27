# RT-28 — Otimização de preload, lazy load e conexão lenta do Hero

**Status:** Engenharia concluída, validada contra a mídia de teste atual. Recalibração de peso contra mídia final é tarefa de prontidão de lançamento, pendente de RT-24/RT-25.

**Data:** 27/09/2026

**Jira:** RT-28 / RT-RB-S3-06, Sprint 3 — Media & Final Hero

## 1. Estado anterior (o problema real)

Antes desta tarefa, `globe-journey.tsx` atribuía `backgroundImage` a **todas** as três camadas fotográficas (Rio, Helicóptero, Cristo) diretamente no JSX inicial, independentemente do modo (`motion` ou `static`) e da posição de scroll. Na prática, isso significava:

- As três imagens eram baixadas assim que o componente montava, mesmo que Helicóptero só apareça em 58% e Cristo em 75% de uma jornada de scroll longa.
- No modo `static` (reduced-motion/data-saver), as mesmas três imagens **também** eram baixadas, apesar de nunca serem exibidas nesse caminho — um desperdício direto que a RT-20 não cobria, porque a RT-20 trata do comportamento do WebGL/pointer, não do carregamento das imagens.

Confirmado por medição direta (Playwright + interceptação de rede) antes da mudança.

## 2. Arquitetura de carregamento

Nenhum timer de wall-clock. Cada camada com imagem real (`hero-media.ts`) ganhou um campo `prepareAt` — um limiar de **progresso de scroll** (o mesmo `p` normalizado que já dirige toda a jornada) a partir do qual a imagem começa a ser buscada:

| Camada | Primeiro uso (keyframe) | `prepareAt` | Margem |
| --- | ---: | ---: | --- |
| Rio | 0.44 | 0.30 | ~14 pontos percentuais dentro do Brasil |
| Helicóptero | 0.58 | 0.48 | ~10 pontos percentuais, logo após o Rio dominar |
| Cristo | 0.75 | 0.65 | ~10 pontos percentuais, dentro do Helicóptero |

`update(p)` (a mesma função que já roda a cada tick do ScrollTrigger) verifica `p >= layer.prepareAt` e dispara `prepareLayer(scene, layer)` — nenhum novo loop de RAF, nenhuma nova assinatura de scroll.

`prepareLayer`:
1. Marca a camada como `"requested"` (`data-media-state`, ver §5).
2. Cria um `new Image()`, aponta para o derivado correto (mobile ou desktop, ver §4) e aguarda `onload`/`onerror`.
3. Só ao terminar o carregamento (sucesso ou falha) o estado avança — nunca duas vezes para a mesma camada (`layerMediaState.has(key)` guarda contra requisição duplicada).
4. Em sucesso, atribui `layerEl.style.backgroundImage = url(...)` — como a URL já está no cache HTTP do navegador (mesmo `Image()` que acabou de buscar), essa atribuição é instantânea, sem nova requisição de rede.
5. Em falha, **não atribui nada** — o `background-color:#080c11` já definido em `.scene` (a mesma cor de fundo de toda a jornada) permanece visível. Como a arquitetura usa `background-image` em `<div>`, nunca `<img>`, um ícone de imagem quebrada é estruturalmente impossível aqui.

## 3. Preload

**Nenhum preload explícito foi adicionado.** Investigação: o único conteúdo da visualização inicial (Globo) é 100% procedural — a esfera é WebGL real e as texturas (`world-atlas.ts`) são desenhadas em canvas em tempo de execução, não carregadas de arquivo. Não há nada de peso relevante para pré-carregar na visualização inicial além do que o Next.js já resolve (CSS, fontes, JS). Forçar um preload aqui violaria "não pré-carregue toda a mídia do Hero" sem nenhum ganho real.

## 4. Seleção de derivado mobile

A RT-26 já tinha a ferramenta (`scripts/media-pipeline/run.mjs`); faltava um derivado real e implantado. Esta tarefa rodou o pipeline contra os três masters temporários e comitou os resultados em `app/.../cinematic-3d-poc/assets/derivatives/{rio-04,helicopter-05,christ-06}/mobile.webp` (720px de largura, ~45–62 KB cada, contra ~116–154 KB do master em resolução quase nativa — redução real de ~60–70% no peso mobile).

Cada `HeroLayer` ganhou um campo opcional `srcMobile`. `prepareLayer` escolhe:

```ts
const preferMobileDerivative = mobile || slowConnection;
const url = preferMobileDerivative && layer.srcMobile ? layer.srcMobile : layer.src;
```

`slowConnection` lê `navigator.connection?.effectiveType` (quando o navegador expõe a Network Information API) e também prefere o derivado leve em conexões `slow-2g`/`2g`/`3g`, mesmo em viewport desktop — seleção por banda, não só por largura de tela.

**Proveniência:** os derivados são gerados a partir dos MESMOS masters `PROTOTYPE_ONLY` / `RIGHTS_NOT_VERIFIED` de sempre. Por design da RT-26, um derivado herda o status do seu master — nenhum arquivo aqui é mídia final, nenhuma arte nova foi criada, apenas uma recodificação menor do mesmo conteúdo temporário.

## 5. Observabilidade em desenvolvimento

Cada camada base expõe `data-media-state` (`idle` → `requested` → `loaded` | `failed`) no DOM — inspecionável via devtools/testes, nunca um rótulo visível ao usuário público. Nenhum framework de debug foi construído; é um atributo de dados simples, atualizado imperativamente junto com `backgroundImage`.

## 6. Conexão lenta / data-saver / reduced-motion

- **Data-saver:** decisão da RT-20 preservada sem alteração — `saveData` continua entrando no modo `static` antes de qualquer configuração de mídia rodar. Confirmado por medição: **zero** requisições de imagem sob `saveData`.
- **Reduced-motion:** mesma preservação; **zero** requisições de imagem confirmadas por medição — uma melhoria real em relação ao estado anterior (§1), onde as três imagens eram baixadas mesmo nesse caminho.
- **Conexão lenta sem saveData:** ver §4 — usa o derivado mobile mais leve, sem alterar a narrativa de seis estágios nem cair para o modo estático (essa decisão pertence à RT-20, não foi reaberta aqui).

## 7. Comportamento de falha

Testado explicitamente com interceptação de rede (Playwright `route().abort()`) simulando falha de Rio e Helicóptero: ambos marcam `data-media-state="failed"`, mantêm `background-image:none` (mostrando o fundo carvão em vez de um frame quebrado/transparente), e a jornada continua funcionando normalmente — progresso, estágio, ausência de overflow e liberação do sticky não são afetados. Nenhuma exceção não tratada ocorre (`pageerror` permanece zero); as únicas mensagens de console observadas são os avisos nativos do navegador para a requisição abortada (`net::ERR_FAILED`), não erros do código.

## 8. Análise de requisições (medição real, não apenas inspeção de código)

Medido via interceptação de rede do Playwright contra o servidor de desenvolvimento real:

- **Estado inicial (p=0):** 0 requisições de imagem fotográfica.
- **Jornada completa para frente:** exatamente 3 requisições (uma por cena), cada uma disparada exatamente ao cruzar o `prepareAt` da cena.
- **Scroll reverso:** 0 requisições adicionais (tudo já carregado).
- **Scroll rápido (saltos diretos):** ainda exatamente 3 requisições, sem duplicação.
- **Mobile (390×844):** as 3 requisições usam o arquivo `mobile.*.webp`, não o master desktop.
- **saveData / reduced-motion:** 0 requisições em ambos.

## 9. Validação

Gate dedicado: `node scripts/rt-28-media-loading-validation.mjs` — cobre os 14 itens de aceite do RT-28. **PASS.**

Também executados: `tsc --noEmit` (pass), `eslint` (pass, 0 avisos), `vitest run` (34/34), `rt-17-3d-poc-validation.mjs` (pass), `rt-19-pointer-parallax-validation.mjs` (pass, T1–T10), `rt-20-fallback-validation.mjs` (pass, A–G), `rt-26-media-pipeline-validation.mjs` (pass — corrigido um bug real: o validador tentava ler a nova subpasta `derivatives/` como se fosse um arquivo; corrigido para pular diretórios), `rt-27-hero-media-integration-validation.mjs` (pass), `git diff --check` (limpo).

## 10. Limites conhecidos / recalibração pendente

- **Os pesos medidos aqui são os do master temporário**, não da mídia final. Quando a RT-24/RT-25 resolverem a mídia final, o pipeline (RT-26) precisa rodar de novo contra os masters reais, e os limiares `prepareAt`/tamanhos-alvo devem ser reavaliados contra o peso real — isso é uma tarefa de prontidão de lançamento, não um bloqueio de conclusão desta engenharia.
- O derivado mobile usa a largura padrão de 720px da RT-26; ajuste fino (por exemplo, para telas de alta densidade) é trivial de mudar no manifesto quando necessário, mas não foi feito aqui sem evidência de necessidade.
- Nenhuma camada de layers[] adicional (ainda inexistente, ver RT-27 §4) precisou de estratégia de carregamento própria — quando RT-24/RT-25 introduzirem camadas reais de primeiro plano/atmosfera, cada uma herda o mesmo mecanismo (`prepareAt`, `srcMobile`) sem mudança de arquitetura.
