# RT-10 — Registro permanente da aprovação

## Decisão e escopo

- Task: RT-10 / RT-RB-S1-01 — Design tokens.
- Decisão do Owner: **APPROVED / DONE**, com os ajustes registrados em 2026-09-16.
- Consolidação autorizada pelo Owner em 2026-09-17.
- **Sprint 0 Owner Gate: APPROVED.** Este registro não reabre nem altera a Sprint 0.
- A aprovação não inclui tipografia (RT-11), não aciona nem modifica RT-15, não autoriza implementação da Sprint 1 e não autoriza mudanças na aplicação, no banco ou em produção.

## Evidências preservadas

| Arquivo | Finalidade | Dimensões | Tamanho | SHA-256 |
| --- | --- | ---: | ---: | --- |
| `desktop-approved.png` | Screenshot desktop aprovado | 1440×2621 | 1.685.026 bytes | `f4d9ac7b0ffdb5aa15e94b5f4afcb2811e7706f99aa5515d262d97692237b201` |
| `mobile-approved.png` | Screenshot mobile aprovado | 390×3488 | 412.746 bytes | `90fc26977f819c5cae5bfc90b438c897800e9140d6df1294623404b0fa7520ae` |
| `owner-review.png` | Captura integral da revisão apresentada ao Owner | 1440×7081 | 3.942.576 bytes | `c17dc4dfc218fd506034794ef6207a60474cb0de5e5d17242957c5b601f7cf1a` |

Tamanho total das imagens: 6.040.348 bytes.

Verificação antes do versionamento:

- As três imagens foram abertas e revisadas visualmente; não houve modificação, recompressão ou regeneração.
- A assinatura PNG, a estrutura e a descompressão dos dados foram validadas. Os arquivos contêm apenas os chunks essenciais `IHDR`, `IDAT` e `IEND`, sem chunks textuais ou EXIF.
- A busca por padrões de segredo, chave, token, senha, autorização, chave privada e endereços de e-mail não encontrou ocorrência nos arquivos.
- Os hashes dos arquivos permanentes devem permanecer idênticos aos hashes acima.

## Parâmetros aprovados

### Direção visual

- Paleta A refinada: carvão `#0B0E11`, dourado fosco `#C8A86B`, luz dourada `#E8C780`, núcleo de luz `#FFF1CC` e off-white `#F3EFE6`.
- Alternância entre seções escuras e off-white conforme o Wireframe Cinemático 2.0.
- Logo oficial e suas cores originais preservados; azul, teal e verde permanecem no logo e nas fotografias.
- Novos usos decorativos de azul, teal ou verde na interface exigem justificativa; as cores semânticas permanecem independentes.

### Cores de interface

| Papel | Dark | Light |
| --- | --- | --- |
| Background | `#0B0E11` | `#F3EFE6` |
| Surface | `#15191D` | `#FCF9F2` |
| Raised | `#1C2227` | `#FFFDF8` |
| Muted surface | `#232A30` | `#E9E2D6` |
| Primary text | `#F4F0E8` | `#171A1E` |
| Secondary text | `#CAC7BF` | `#53565A` |
| Muted text | `#9DA3A5` | `#6B6B68` |
| Border | `#3A4147` | `#CFC7BA` |
| Brand gold | `#C8A86B` | `#C8A86B` |
| Focus / bright gold | `#E8C780` | `#8A6A2B` |

### Estados de ação

| Estado | Dark | Light |
| --- | --- | --- |
| CTA default | `#C8A86B` / texto `#0B0E11` | `#C8A86B` / texto `#171A1E` |
| CTA hover | `#E8C780` / lift `-1px` / shadow low | `#B99559` / lift `-1px` / shadow low |
| CTA pressed | `#A9864E` / sem lift | `#A98448` / sem lift |
| Focus ring | `3px #E8C780`, offset `3px` | `3px #8A6A2B`, offset `3px` |
| Disabled | `#252B30` / `#767D82` / border `#343B42` | `#E3DFD6` / `#686863` / border `#CBC5BB` |

### Cores semânticas

| Papel | Dark: texto / fundo | Light: texto / fundo |
| --- | --- | --- |
| Sucesso | `#8FCB9B` / `#1A3324` | `#276A42` / `#E6F3EA` |
| Aviso | `#E5B96A` / `#352915` | `#815E1E` / `#FFF2CF` |
| Erro | `#F28C8C` / `#3A1E22` | `#A52F36` / `#FBE7E8` |

### Spacing, grid, radius e elevation

- Escala: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 112px`.
- Gutters: mobile `20px`, tablet `32px`, desktop `48px`; largura máxima `1280px`.
- Grid: 4 colunas / gap `16px`; 8 colunas / gap `20px`; 12 colunas / gap `24px`.
- Radius: `6, 12, 16, 24, 28px`, mais pill apenas quando necessário.
- Shadow low: `0 8px 24px rgba(0,0,0,.14)`.
- Shadow medium: `0 16px 44px rgba(0,0,0,.24)`.
- Shadow high: `0 28px 70px rgba(0,0,0,.34)`.
- Light surface: `0 18px 45px rgba(23,26,30,.08)`.
- Cinematic media: `0 24px 70px rgba(0,0,0,.42)`.

### Iluminação do hero recalibrada

| Efeito | Antes | Aprovado |
| --- | --- | --- |
| Halo do Rio | `18px / 28%` | `10px / 18%` |
| Borda/rim do planeta | `24px / 20%` | `15px / 13%` |
| Inset dourado interno | `10%` | `8%` |
| Raio de luz desktop | `390px` | `190px` |
| Raio de luz mobile | `210px` | `110px` |
| Núcleo do Rio | `#FFF1CC` | `#FFF1CC` (inalterado) |

O contrato completo e o mapeamento candidato para código permanecem em `docs/architecture/rt-10-design-tokens.md`. Nenhum desses parâmetros foi aplicado à aplicação nesta consolidação.

## Limites e pendências preservados

- Tipografia definitiva permanece na RT-11.
- Planeta e fotografia do hero continuam como mídia provisória; a produção de mídia final não faz parte da RT-10.
- Os cards de Cristo Redentor e Voo de Helicóptero permanecem com fotografia real pendente.
- A montagem de IA usada no passeio Cristo Redentor de Helicóptero foi rejeitada. A investigação e substituição por fotografia real com origem e direitos de uso verificados está registrada exclusivamente como RT-CONTENT-001 no backlog.
- O card Confeitaria Colombo e a evolução futura do AI Concierge vinculada a RT-RB-S4-04 fazem parte do registro aprovado, sem implementação nesta consolidação.
- A decisão sobre substituir ou manter o verde atual de `--primary` permanece aberta para RT-14/RT-15.

## Texto sincronizado com a seção 7 do Google Doc canônico

> 16/09/2026 — RT-10 aprovada com ajustes: paleta A refinada, tokens de superfície/texto/controles/semântica, spacing, grid, radius, shadow e a direção de iluminação do hero (halo e raio recalibrados) aprovados por Ricardo. Logo e cores de logo/fotografia preservados. Cards de Cristo Redentor e Voo de Helicóptero ficam com fotografia pendente — a montagem de helicóptero gerada por IA foi rejeitada e removida da prévia. Card "Confeitaria Colombo" adicionado. Evolução futura do AI Concierge registrada, vinculada a RT-RB-S4-04. Esta aprovação não cobre tipografia (RT-11), não aciona o RT-15 Owner Visual Gate, e não autoriza implementação na Home de produção.
