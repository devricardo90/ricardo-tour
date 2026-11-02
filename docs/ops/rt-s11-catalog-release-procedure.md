# RT-S11 — Procedimento do release do catálogo (TOUR-01, TOUR-02, TOUR-03)

Owner, 01/11/2026: propostas A (dados na origem) e B (gate obrigatório) aprovadas; proteção C (estado neutro) autorizada
para preparação local; **opção R** autorizada localmente na revisão final (nenhuma escrita em `Trip` no release). Nada
aqui foi executado no banco hospedado. Cada passo hospedado exige autorização escrita do Owner. Pacote completo:
`docs/ops/rt-s11-release-package-2026-11-01.md`.

## Opção R: por que não há mais passo em `Trip`

O site em produção lê `Trip.title`, `Trip.description`, `Trip.imageUrl` e `Trip.priceCents`. Escrever títulos novos
nessas linhas antes do merge exibiria, no site antigo, título novo com preço antigo. Com a opção R, o catálogo novo mostra
o nome e o resumo aprovados que estão no código (`lib/catalog/launch-trip-copy.ts`) e a capa própria de cada passeio
(`OWN_TOUR_COVERS`); as linhas de `Trip` não são alteradas pelo release. O antigo "plano A"
(`scripts/s11-launch-trip-copy.ts`) foi removido.

## Ordem obrigatória (ensaio local em 01/11/2026, só com os scripts oficiais)

1. **Backup** do banco de produção (Neon) antes de qualquer escrita, com teste de restauração.
2. **Migrations pendentes** (9), na ordem dos nomes. Revisão individual no pacote de release, seção 6.
3. **Carga do conteúdo aprovado dos três passeios** nas tabelas RT-113, sempre como DRAFT:
   `scripts/rt-119-load-content.ts` (simulação; depois `--apply`). Escreve só `TripContent`, `TripItineraryStop`,
   `TripFaqItem` e `TripImage`; nunca `Trip`.
4. **Ato de aprovação do Owner**: `scripts/s11-approve-launch-content.ts` (simulação; depois
   `--apply --confirm-owner-approval`). Não escreve `Trip`; compara um hash dos campos de `Trip` lidos pelo site atual
   antes e depois da aprovação e falha se forem diferentes.
5. **Conferência de leitura**: os 3 registros de `Trip` idênticos à cópia feita no passo 1.
6. **Deploy de Preview** do candidato a release (sem promover), contra o banco de Preview preparado com os passos 2 a 4.
7. **Gate B** contra a Preview: `npx tsx scripts/s11-release-gate.ts http <url-da-preview>`. Qualquer FAIL = NO-GO.
8. **Conferência visual do Owner** na Preview (o gate não substitui o olhar do Owner).
9. **Merge em main** (deploy automático de produção) somente com autorização expressa do Owner; depois, gate B contra
   `https://www.ricardotour.com`.

Os scripts dos passos 3 e 4 recusam hoje qualquer banco que não seja local descartável. Rodá-los num banco hospedado
exigirá autorização escrita do Owner e uma liberação explícita da trava no momento do release; a trava não é removida
automaticamente.

Regra operacional depois do release: não editar no admin título, descrição, destaques, imagem, cidade, local, duração,
nível físico, crianças ou lotação dos três passeios. O banco rebaixa a aprovação (gatilho da migration
`20261017220000`) e a página volta ao estado neutro até nova aprovação.

## O que o gate B verifica

- Cada passeio em PT/EN/ES responde 200 com o design aprovado (não o estado neutro, sem banner de mock) e com o título aprovado.
- TOUR-01 cita Cristo, Selarón e Pão de Açúcar; TOUR-02, Rocinha; TOUR-03, Centro Histórico (modo `code`).
- Home e listagem nas três línguas mostram exatamente os três passeios; o sitemap também.
- TOUR-04 responde 404 nas três línguas.
- Preços (Owner, 01/11/2026: exibição pública autorizada): na página de cada passeio, os totais por tamanho de grupo e
  duração iguais à tabela do Owner (digitada no gate), nenhum valor fora dos aprovados, nenhum preço antigo de `Trip`,
  JSON-LD sem Offer, nenhuma forma de pagamento e nenhum formulário de reserva (documentos jurídicos não publicados);
  nos cartões de Home e listagem, a linha de preço aprovada de cada passeio (× 4 = total de 4 pessoas da tabela) e
  nenhum outro valor; nenhuma forma de pagamento nem selo de laboratório em nenhuma página verificada.
- TOUR-01 com o vídeo do Pão de Açúcar (Owner, 01/11/2026).
- Nenhum nome ou texto da oferta antiga, nenhum aviso de laboratório, nenhuma mídia antiga (`/images/trips/`, `/videos/`,
  `/avatars/`, depoimentos).

## Resultado dos ensaios locais (01/11/2026)

- Antes da carga (igual à produção hoje, código antigo): NO-GO. Páginas com os títulos e preços antigos.
- Ensaio da opção R (banco novo `rt_s11_optr` com as 9 migrations e as linhas antigas de produção, TOUR-04 e um produto
  aposentado): carga dos três passeios; aprovação sem nenhum passo em `Trip`; **hash dos campos de `Trip` idêntico antes
  e depois** (incluindo `updatedAt`); build de produção; **gate B por HTTP: GO 9/9**; Home, listagem e sitemap só com os
  três passeios e com os nomes aprovados; TOUR-04 e o produto aposentado com 404; nenhum preço, texto ou mídia antiga.
- EN/ES de TOUR-01 e TOUR-03 confirmados pelo Owner em 01/11/2026 (status por língua igual ao PT).
- Decisões do Owner de 01/11/2026 (preços públicos, vídeo do TOUR-01, local traduzido nos cartões): novo ensaio no mesmo
  banco, build de produção, **gate B por HTTP com os critérios novos: GO 9/9**; hash de `Trip` idêntico (`bc709e45…`).
