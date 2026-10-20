# RT-116 — Centro Histórico e Cultural do Rio: integração visual local

- Data: 2026-10-17. Branch isolada: `sprint10/centro-historico-media`, base `8a81d10`.
- Escopo: prévia local do terceiro passeio (`cmlibniq40000z4zqkbujnutt`) no RT-114; nenhuma alteração no banco, página pública ou outros passeios.
- Decisão do Owner: o nome **Centro Histórico e Cultural do Rio** substitui **Confeitaria Colombo + City Tour**. A Confeitaria Colombo não é parada obrigatória. Fonte: `REGISTRO_LICENCAS_E_DIREITOS` na pasta Drive `RICARDO TOUR / MIDIAS / 03_CENTRO_HISTORICO_CULTURAL_RIO`.
- Layout: componente RT-114 v2 existente, sem redesenho. Só nome PT e seleção/ordem das fotografias são fatos comerciais afirmados. Preço, duração, operador, formato, ponto de encontro, inclusões e roteiro aguardam RT-112/RT-115.

## Mídias selecionadas pelo Owner

Origem: Drive `03_CENTRO_HISTORICO_CULTURAL_RIO/SELECIONADAS_OWNER`. Cópias WebP locais em `public/media/tours/centro-historico-cultural/`. A dimensão máxima é 2400 px; peso total, 4.73 MB. Arquivos servidos pelo Next.js apenas na prévia. O status de direitos no registro é `UNVERIFIED` para impedir uso público acidental. A seleção editorial do Owner não equivale à liberação comercial.

| Ordem | Arquivo local | Dimensões | Bytes | SHA-256 |
| --- | --- | ---: | ---: | --- |
| Hero | `centro-historico-img-1337.webp` | 1800×2400 | 535094 | `dfbe73d26c3027a11c897f97e5370fb4d9a16f6d937c3ace6d2e2fb34213f952` |
| 1 | `centro-historico-img-1802.webp` | 1800×2400 | 488826 | `80f359a26ffd018ba9ff73bd3e7679ac4b31dd70384ee34750a0dbb41de53e19` |
| 2 | `centro-historico-img-1328.webp` | 1800×2400 | 975050 | `e3feb3730819a07d323bf61e9b5528894f2ddd7ef67dada43115576ad59c59a5` |
| 3 | `centro-historico-img-1321.webp` | 1800×2400 | 971586 | `e5a2caaf37064797521e5d59c42c0abd298b4d5e903c520f5d2680defcd5edb7` |
| 4 | `centro-historico-img-1332.webp` | 1800×2400 | 567158 | `c8f79476ae8240a9545224a979bf668e55dd1ae076e41ae60061853eb6ec55b9` |
| 5 | `centro-historico-img-1136.webp` | 1800×2400 | 897006 | `eaf8859c1253b458d63fe83323045d7173b88540910a28a8534eefda3bb4a651` |
| 6 | `centro-historico-museu-do-amanha.webp` | 2400×1589 | 291518 | `4b1571056a86f017d91f0595208bfbe18456ac3ec83561e022af37461fd346a1` |

Os WebP foram inspecionados com Pillow: dimensões e decodificação válidas; sem EXIF/GPS expostos em `Image.info`. Na inspeção visual, `IMG_1337` mostra a **fachada** do Real Gabinete, corrigindo a descrição inicial incorreta de interior. `IMG_1328` e `IMG_1136` permanecem sem nome de igreja, pois a identificação não foi confirmada.

## Pendências antes de qualquer publicação

- Registro de direitos: uso comercial de fachadas/interior, consentimento das pessoas visíveis em `IMG_1332` e `IMG_1136`, autoria formal e liberação jurídica quando cabível.
- Museu do Amanhã: link da foto original, fotógrafo e licença ainda não verificados.
- Conteúdo comercial PT/EN/ES e informações operacionais ainda pendentes; traduções do nome nesta prévia são provisórias.
- O Jira RT-111/RT-112 ainda usa o nome anterior; alinhar a decisão do Owner antes de atualizar dados ou publicar.

## Prévia

Com as dependências instaladas, iniciar apenas nesta worktree, em porta livre própria:

`$env:REBUILD_LAB_ENABLED='true'; npx next dev --webpack --port 3247`

Abrir `http://127.0.0.1:3247/pt/rebuild-lab/tour-content-preview/cmlibniq40000z4zqkbujnutt?precos=ocultos`. O lab é `noindex` e falha fechado sem `REBUILD_LAB_ENABLED`; não representa autorização de publicação.

## Validação local

- Typecheck com Node 22: passou.
- ESLint dos arquivos alterados: passou.
- Vitest `tests/rt-113-tour-content.test.tsx`: 50/50 passaram. Os testes anteriores que exigiam o nome/fatos antigos do terceiro passeio foram atualizados para a decisão do Owner.
- Playwright `scripts/rt-116-centro-validate.mjs`: desktop 1440×900 e mobile 390×844 passaram, HTTP 200, sete imagens carregadas e com alt, ordem correta, `object-fit: contain`, navegação por teclado, CTA visível na viewport, um `h1`, nenhum botão sem nome, sem overflow ou erros de console. Resultado em `docs/baseline/rt-116-centro-historico/results.json`.
- Capturas da integração inicial, anteriores à correção do ratio e substituídas pelas capturas da revisão final: `docs/baseline/rt-116-centro-historico/desktop-viewport.png` e `mobile-viewport.png`; as versões de página inteira também estão na pasta. Na captura mobile inicial de página inteira, a barra fixa aparece no meio da imagem por um artefato conhecido da captura.
- Performance: os arquivos servidos são WebP, a capa tem 535 KB, a galeria soma 4,73 MB; o componente usa `next/image`, `sizes` responsivo, prioridade apenas na capa e miniaturas de 96 px. A imagem principal seguinte é montada ao selecionar a foto. O Resource Timing do navegador, no momento em que o Hero terminou de decodificar na prévia local, registrou **134.734 bytes desktop** e **50.450 bytes mobile** de transferências `/_next/image`. Esta medição pontual em servidor de desenvolvimento não é uma nota de performance de produção. Lighthouse e dispositivo móvel real ainda não foram medidos neste ambiente.

## Revisão do ratio da galeria — 2026-10-18

- Ajuste restrito ao `tripId` deste passeio: a galeria usa frame vertical **3:4** em desktop e mobile. O ratio padrão da galeria reutilizável não mudou para os demais passeios.
- A imagem principal mantém `object-fit: contain`; os sete arquivos originais, a seleção, a ordem, os textos alternativos e a navegação foram preservados. Como as seis fotos verticais têm proporção 3:4 e a foto do Museu é horizontal, nenhuma apresentou espaço lateral calculado no frame (`maxHorizontalGapRatio: 0`) e nenhuma foi cortada.
- Validação Playwright em 1440×900: frame 727×969, ratio 0,75; em 390×844: frame 350×467, ratio 0,75. Nas duas viewports: HTTP 200, sete imagens carregadas e na ordem aprovada, CTA visível, navegação por teclado, sem overflow ou erros de console.
- Capturas novas, separadas das evidências da revisão anterior: `docs/baseline/rt-116-centro-historico-portrait-revision/desktop-viewport.png`, `mobile-viewport.png` e versões de página inteira. Resultado detalhado em `results.json` na mesma pasta.
- Esta revisão confirma o enquadramento local; Lighthouse e dispositivo móvel real continuam pendentes. A prévia segue isolada e não publicada.

## Aprovação final do Owner — 18/10/2026

**Decisão: APROVADO. Revisão visual encerrada.** O Owner aprovou o Hero do Real Gabinete Português de Leitura, as seis fotografias da galeria, a ordem aprovada, o ratio vertical 3:4, a composição desktop e mobile e o conjunto visual final. Não há nova rodada estética ou de curadoria autorizada para este passeio.

A aprovação confirma somente a revisão visual. Ela não autoriza publicação e não altera direitos de mídia: todas as imagens permanecem `UNVERIFIED`. Continuam pendentes a verificação dos direitos, conteúdo comercial e operacional, traduções, Lighthouse e testes em dispositivo real. Nenhum preço, roteiro, operação ou outro fato comercial foi aprovado por este registro.

Evidências técnicas: Playwright `ok: true` em 1440×900 e 390×844; frames medidos em 727×969 e 350×467 (3:4); sete imagens carregadas na ordem, sem cortes, espaço lateral calculado, overflow ou erros de console; CTA e teclado verificados. Typecheck, ESLint e Vitest (50/50) passaram. Capturas e resultado estão em `docs/baseline/rt-116-centro-historico-portrait-revision/`.

Registro cruzado: comentário 13488 no Jira [RT-116](https://ricardodesouzafrancisco.atlassian.net/browse/RT-116); aprovação visual registrada no [Volume II da Source of Truth](https://docs.google.com/document/d/1SyIWipooyl60lAqqg7DWZx5h6Bw3jcn8kPV17HzuuJw/edit).

## Integração comercial local — 18/10/2026

- Fonte: Ficha Comercial e Operacional v1.0 do Owner, 18/10/2026; decisões registradas no Manual Mestre v0.12 §§12 e 19 e no Volume II da Source of Truth.
- Integração restrita à prévia RT-114: nome PT, conteúdo comercial aprovado em português, modalidades/limites, inclusões/exclusões, dois circuitos e tabelas aprovadas de 4h/6h. O registro continua `DRAFT`; as sete imagens permanecem `UNVERIFIED`; preço e conteúdo não foram gravados no banco nem no catálogo público.
- A tabela completa fica no laboratório de revisão. O modo `?precos=ocultos` retira os dados de preço do objeto antes da renderização; testes também cobrem a apresentação sem números. A tabela aprovada não é chamada de preço provisório.
- A calculadora local cobre faixas de 1–4 turistas, meia tarifa de 0–2 anos, sinal de 30% e R$120 por hora extra/grupo. Não cria reserva nem modifica disponibilidade, Trip, banco ou políticas.
- Os dois roteiros aparecem em linhas do tempo consistentes com a página. Tempos por parada continuam estimativas da Ficha; distâncias, caminhada, estacionamento, funcionamento e retorno ainda precisam de ensaio/confirmação. As versões EN/ES são rascunhos completos para o Owner e não usam fallback em português quando falta um campo localizado; continuam PENDING para publicação.
- Na prévia de revisão, o CTA principal abre uma consulta pré-preenchida para o WhatsApp comercial canônico +55 22 99846-1906. A seção `#solicitar` permanece informativa. O CTA secundário de WhatsApp fica oculto para evitar duplicação; nenhum formulário, API de reserva, pagamento ou gravação foi acionado. A API legada permanece bloqueada por dependência RT-110 registrada no documento de fechamento.
- Bloqueios comerciais preservados: direitos UNVERIFIED, traduções pendentes, termos específicos de cancelamento/clima pendentes e risco jurídico-operacional do veículo alugado. Portaria MTur nº 14/2022, arts. 11–12, exige confirmação jurídica do enquadramento do transporte; nenhuma mudança de modelo foi feita. Ver Manual Mestre §12.2 e Source of Truth Volume II.

### Evidências técnicas

- TypeScript (`pnpm.cmd exec tsc --noEmit --pretty false`): passou.
- ESLint nos arquivos alterados antes da última edição do validador: passou. A execução isolada final do ESLint de `scripts/rt-116-centro-validate.mjs` não retornou e permanece pendente.
- Vitest direcionado (`rt-116-centro-commercial.test.tsx` + `rt-113-tour-content.test.tsx`): 56/56 testes passaram, processo com código 0. TypeScript (`tsc --noEmit`) passou.
- Playwright local em servidor de desenvolvimento isolado, porta 3248, encerrado após a execução: 6 combinações desktop/mobile × PT/EN/ES passaram. Desktop 1440×900 e mobile 390×844; largura do documento igual à viewport; Hero carregado; 2 tabelas e 2 roteiros na visualização PT; CTA WhatsApp canônico; modo sem preços sem valores monetários em EN/ES; rotas continuam visíveis; nenhum erro de console/page. Tabelas mediram 438 px no desktop e 282 px no mobile.
- O validador `scripts/rt-116-centro-validate.mjs` também passou em desktop e mobile: sete imagens carregadas e na ordem esperada, frame 3:4 (727×969 e 350×467), `object-fit: contain`, sem espaço lateral medido, sem overflow, botões nomeados, navegação por teclado e CTA WhatsApp canônico. Transferência inicial das entradas `/_next/image`: 134.734 bytes no desktop e 50.450 no mobile. São bytes de recursos de imagem nesta execução dev, não peso total da página. Capturas adicionais e JSON estão em `docs/baseline/rt-116-centro-commercial-gallery-validation/`.
- As capturas viewport foram refeitas após aguardar `HTMLImageElement.decode()` e dois frames de renderização; inspeção visual confirma o Hero visível no desktop e mobile. Arquivos: `docs/baseline/rt-116-centro-commercial-preview/desktop.png`, `mobile.png` e `results.json`. São evidências locais, não autorização de publicação.
- A execução de desenvolvimento desta revisão confirmou o carregamento do Hero e viu seu preload na resposta HTML. O Next.js também emitiu aviso para explicitar `loading="eager"` na imagem detectada como LCP. A nota anterior citava TTFB 221 ms, LCP/FCP 428 ms, INP 16 ms e CLS 0, mas não há artefato bruto correspondente nesta pasta para revalidar esses números; não são usados como aprovação ou resultado desta execução.
- Lighthouse e teste em dispositivo real continuam pendentes. O servidor local não foi mantido em execução.

## Refinamento visual local solicitado pelo Owner — 18/10/2026

- A seleção, ordem, sete arquivos originais, Hero, textos, preços, CTA e lógica comercial foram preservados. Nenhum arquivo de mídia foi substituído ou publicado; direitos seguem `UNVERIFIED`.
- Tentativas conservadoras de remoção de pessoas/veículos: `IMG_1337` (Hero), `IMG_1328` (igreja externa), `IMG_1321` (Palácio Tiradentes) e `IMG_1136` (interior de igreja). As quatro propostas de edição foram **rejeitadas** na comparação visual porque o modelo também recriou detalhes de arquitetura, pavimento, textura ou enquadramento. Exatamente **zero fotos foram limpas na implementação**. `IMG_1802` não contém sujeitos relevantes para remover. Em `IMG_1332` (SAARA), as pessoas ocupam grande parte da cena; removê-las implicaria reconstrução extensa, então o original foi mantido. A foto do Museu do Amanhã permaneceu intocada, conforme instrução específica.
- O Museu do Amanhã, único arquivo horizontal, agora usa um frame individual com a proporção nativa `2400/1589`; `object-fit: contain` permanece, sem distorção nem corte. As demais seis imagens continuam no frame vertical 3:4. O comportamento é aplicado somente ao `tripId` do Centro Histórico e ao arquivo do Museu; o padrão dos outros passeios não mudou.
- Playwright local: desktop 1440×900 e mobile 390×844, HTTP 200, sete miniaturas, imagem do Museu carregada, sem overflow ou erros de página. Ratio medido da galeria vertical: 0,750 desktop / 0,748 mobile; do frame do Museu: 1,514 desktop / 1,513 mobile, próximo ao ratio nativo da fotografia (1,512 / 1,511 nas variantes otimizadas). `object-fit: contain` confirmado.
- Novas capturas: `docs/baseline/rt-116-centro-visual-final/desktop-viewport.png`, `mobile-viewport.png`, `desktop-full.png`, `mobile-full.png` e `*-museum-viewport.png`. Comparação direta do Museu no frame anterior 3:4 e no novo frame: `*-museum-before-frame.png` / `*-museum-after-frame.png`; o estado anterior foi reproduzido com uma substituição temporária de CSS somente no navegador, sem modificar o código. Medições em `results.json`.
- Esta revisão local pede nova avaliação visual do Owner. Lighthouse, teste em dispositivo real e liberação dos direitos permanecem pendentes; a prévia não autoriza publicação.
- Validação adicional desta revisão: `scripts/rt-116-centro-validate.mjs` passou nas duas viewports, inclusive ordem das sete imagens, teclado, CTA e ausência de overflow; o resultado está em `docs/baseline/rt-116-centro-visual-final/gallery-validation/results.json`. Vitest direcionado: 56/56 passaram na repetição isolada com `--testTimeout 20000`. A primeira tentativa paralela teve 1 timeout na inspeção de mídias da Rocinha e 55 testes aprovados; não houve falha de assertiva. TypeScript passou. `git diff --check` passou.
- ESLint direcionado foi tentado via `pnpm exec` e diretamente com Node, mas não retornou no ambiente e foi interrompido; fica pendente. Nenhuma verificação de Lighthouse ou dispositivo físico foi executada nesta revisão.

## Aprovação final do Owner — TOUR-03, 18/10/2026

**APROVADO:** o Owner revisou a última prévia e encerrou a revisão visual do Centro Histórico e Cultural do Rio. Estão aprovados o design desktop e mobile, o Hero, as seis imagens e sua ordem, o enquadramento individual do Museu do Amanhã e a manutenção de pessoas e veículos nas fotografias originais. A seleção e os arquivos de mídia não foram modificados nesta rodada. Preços e roteiros mantêm as aprovações comerciais anteriores.

Esta aprovação visual não altera o rascunho `DRAFT` nem o estado de direitos `UNVERIFIED`. Permanece proibida a publicação e a abertura de reservas produtivas. Direitos e consentimentos, revisão final EN/ES, termos contratuais/RT-81, documentação operacional e jurídica, Lighthouse, dispositivo físico e gates de reserva continuam pendentes conforme Source of Truth e Manual Mestre. O commit local e os resultados finais dos testes serão registrados no handoff técnico.

O ESLint anteriormente pendente foi concluído em 18/10/2026: execução direta com `--debug` nos componentes da galeria, validador, script de evidências e teste RT-113 terminou com código 0. O carregamento da configuração levou cerca de 75 s; as tentativas anteriores haviam sido interrompidas antes do término. A verificação final completa dos arquivos de código modificados será executada antes do commit.
