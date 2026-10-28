# RT-116 — Inventário de mídias dos três passeios (28/10/2026)

**Declaração do Owner (28/10/2026), registrada uma única vez e que não deve ser pedida de novo:** as fotos e os vídeos
próprios da Ricardo Tour estão autorizados para uso comercial, incluindo a autorização das pessoas que aparecem
neles. Essa declaração substitui a regra de 17/10/2026, segundo a qual "declaração não é prova". Materiais com autoria
ou direitos incertos continuam **bloqueados**.

No código, toda mídia própria passa a `OWNER_ATTESTED`, e as exceções continuam `UNVERIFIED`, que nunca são públicas
(`lib/catalog/mock/tour-content.mock.ts`, `lib/catalog/drafts/centro-historico-media.ts`, `lib/catalog/content-load.ts`).
Nada fica público sem o ato de aprovação do conteúdo (RT-119) e sem a autorização de publicação.

## TOUR-01 — Cristo Redentor + Escadaria Selarón + Pão de Açúcar (`public/media/tours/cristo-pao-selaron/`)

| Arquivo web | Original (Drive `MIDIAS/01_CRISTO_PAO_DE_ACUCAR_SELARON`) | Estado |
|---|---|---|
| `pao-01-IMG_1162-mirante.webp` (capa provisória) | IMG_1162 (via `img1-pao-de-acucar.webp`) | **LIBERADA**: própria, com visitantes cobertos pela declaração |
| `pao-02-IMG_1171-bondinho-cume.webp` | IMG_1171 | **LIBERADA** |
| `pao-03-IMG_1163-mirante-baia.webp` | IMG_1163 | **LIBERADA**: visitante coberto pela declaração |
| `pao-04-IMG_1181-visitante-deck.webp` | IMG_1181 | **LIBERADA**: visitante coberto pela declaração |
| `pao-bondinho-41-58.mp4` / `-mobile.mp4` / `-poster.jpg` | IMG_1157.MOV, trecho 41–58 s | **LIBERADO** (direitos). A aprovação editorial do clipe ainda está PROVISÓRIA: o Owner não revisou a reprodução |
| `terceiros-cristo-redentor.jpg` | `img-cristo-redentor1.jpg`: origem desconhecida, não é a foto do Pexels citada | **BLOQUEADA** (fora da galeria) |
| `terceiros-escadaria-selaron.jpg` | `img-escadaria-selarao1.jpg`: origem desconhecida | **BLOQUEADA** (fora da galeria) |

Lacunas que não são de direitos:
- A galeria **não tem foto própria do Cristo nem da Selarón**.
- A 5ª foto aprovada (IMG_1179) não está no Drive; o arquivo encontrado é a IMG_1180, que não foi usada.
- Os originais HEIC de maior qualidade estão só no iCloud do Owner.

## TOUR-02 — Favela Rocinha (`public/media/tours/favela-rocinha/`)

| Arquivo web | Original (Drive `MIDIAS/02_FAVELA_ROCINHA/ORIGINAIS`) | Estado |
|---|---|---|
| `rocinha-01-panorama-bandeira.jpg` (capa confirmada) | IMG_1243.HEIC | **LIBERADA** |
| `rocinha-02-beco.jpg` | IMG_1253.HEIC | **LIBERADA** |
| `rocinha-03-mural.jpg` | IMG_1252.HEIC | **BLOQUEADA**: a foto é própria, mas o mural mostrado é obra de terceiro, com autoria e direitos não verificados. Confirmar com o jurídico se a Lei 9.610/1998, art. 48 (obras em logradouros públicos), se aplica |
| `rocinha-04-mirante-deck.jpg` | img-favela-deck.HEIC | **LIBERADA** |
| `rocinha-05-panorama.jpg` | IMG_1247.HEIC | **LIBERADA** |
| `rocinha-praca-movimento.mp4` / `-mobile.mp4` / `-poster.jpg` | IMG_1256.MOV, 6,5–22 s | **LIBERADO**, com o clipe confirmado pelo Owner em 23/10 |

Enquanto o mural estiver bloqueado, a galeria pública mostra 4 fotos.

## TOUR-03 — Centro Histórico e Cultural do Rio (`public/media/tours/centro-historico-cultural/`)

| Arquivo web | Origem | Estado |
|---|---|---|
| `centro-historico-img-1337.webp` (capa, Real Gabinete) | Seleção do Owner, Drive `03_CENTRO_HISTORICO_CULTURAL_RIO/SELECIONADAS_OWNER` | **LIBERADA** |
| `centro-historico-img-1802.webp` (Candelária) | idem | **LIBERADA** |
| `centro-historico-img-1328.webp` (igreja histórica) | idem | **LIBERADA**. Falta identificar qual igreja aparece (legenda) |
| `centro-historico-img-1321.webp` (Palácio Tiradentes) | idem | **LIBERADA** |
| `centro-historico-img-1332.webp` (SAARA) | idem | **LIBERADA** |
| `centro-historico-img-1136.webp` (interior de igreja) | idem | **LIBERADA**. Falta identificar qual igreja aparece (legenda) |
| `centro-historico-museu-do-amanha.webp` | Pexels; página original, fotógrafo e licença não verificados | **BLOQUEADA** |

## Fora das galerias, mas acessíveis por URL ou usadas no catálogo atual

| Arquivo | Situação | Ação antes do lançamento |
|---|---|---|
| `public/images/trips/imagem-pao-de-acucar.jpg`, `imagem-tour-favela-rocinha.jpg`, `imagem-igreja-centro-rio.jpg` | Capas atuais dos cards (`Trip.imageUrl`) dos três passeios; **origem desconhecida** (inventário RT-79) | **BLOQUEADAS**: trocar `Trip.imageUrl` pela capa própria de cada passeio na carga RT-119 |
| `public/media/tours/cristo-pao-selaron/terceiros-*.jpg` | Fora da galeria, mas publicados e acessíveis por URL | Remover do repositório antes do deploy de lançamento |
| Outros `public/images/trips/*` (Búzios, Tijuca, helicóptero etc.) | Origem desconhecida, passeios fora do lançamento | Fora do escopo; limpeza no RT-79 |
