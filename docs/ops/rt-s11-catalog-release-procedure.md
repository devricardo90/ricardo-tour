# RT-S11 — Procedimento do release do catálogo (TOUR-01, TOUR-02, TOUR-03)

Owner, 01/11/2026: propostas A (dados na origem) e B (gate obrigatório) aprovadas; proteção C (estado neutro) autorizada
para preparação local. Nada aqui foi executado no banco hospedado. Cada passo hospedado exige autorização escrita do Owner.

## Ordem obrigatória (validada em ensaio local em 01/11/2026, só com os scripts oficiais)

1. **Backup** do banco de produção (Neon) antes de qualquer escrita.
2. **Migrations pendentes** (9, todas aditivas, incluindo `20261031120000_rt81_terms_acceptance`).
3. **Carga do conteúdo aprovado dos três passeios** nas tabelas RT-113, sempre como DRAFT:
   `scripts/rt-119-load-content.ts` (simulação; depois `--apply`). Cobre TOUR-01, TOUR-02 e TOUR-03
   (`launchLoadRecord`), com o vídeo próprio do passeio quando houver.
4. **Plano A — títulos e descrições dos cards**: `scripts/s11-launch-trip-copy.ts` (simulação com backup; depois
   `--apply`). Escreve só `Trip.title` e `Trip.description` dos três passeios (PT/EN/ES).
5. **Ato de aprovação do Owner**: `scripts/s11-approve-launch-content.ts` (simulação; depois
   `--apply --confirm-owner-approval`).
   - O script **recusa** aprovar enquanto o passo 4 não estiver aplicado: uma mudança de campo público do `Trip`
     depois da aprovação a invalida automaticamente ("Trip public field changed after approval").
6. **Deploy de Preview** do candidato a release (sem promover).
7. **Gate B** contra a Preview: `npx tsx scripts/s11-release-gate.ts http <url-da-preview>`. Qualquer FAIL = NO-GO.
8. **Conferência visual do Owner** na Preview (o gate não substitui o olhar do Owner).
9. **Promoção/merge** somente com autorização expressa do Owner.

Todos os scripts dos passos 3 a 5 recusam hoje qualquer banco que não seja local descartável. Rodá-los no banco
hospedado exigirá autorização escrita do Owner e uma liberação explícita da trava no momento do release.

## O que o gate B verifica

- Cada passeio em PT/EN/ES responde 200 com o design aprovado (não o estado neutro, sem banner de mock) e com o título aprovado.
- TOUR-01 cita Cristo, Selarón e Pão de Açúcar; TOUR-02, Rocinha; TOUR-03, Centro Histórico (modo `code`).
- Home e listagem nas três línguas mostram exatamente os três passeios; o sitemap também.
- TOUR-04 responde 404 nas três línguas.
- Nenhum preço em R$ (publicação de preços não autorizada), nenhum nome ou texto da oferta antiga, nenhuma mídia antiga
  (`/images/trips/`, `/videos/`, `/avatars/`, depoimentos).

## Resultado do ensaio local (01/11/2026)

- Antes da carga (igual à produção hoje): NO-GO. Páginas de passeio no estado neutro (nenhum texto antigo); Home e
  listagem com os títulos antigos do banco (ex.: "Confeitaria Colombo + City Tour Rio").
- Ensaio completo com os scripts oficiais (banco novo com as linhas antigas, TOUR-04 e um produto aposentado):
  carga dos três passeios; aprovação recusada antes do plano A; plano A; aprovação; recarga sem efeito preservando a
  aprovação. **Gate B por HTTP: GO nas 9 páginas** (3 passeios × PT/EN/ES com o design e o título aprovados), Home,
  listagem e sitemap só com os três passeios, TOUR-04 com 404, nenhum preço em R$, nenhum texto ou mídia antiga.
- EN/ES de TOUR-01 e TOUR-03 confirmados pelo Owner em 01/11/2026 (status por língua igual ao PT).
- O vídeo do Pão de Açúcar é carregado, mas continua fora da página pública enquanto seu status for PROVISIONAL.
