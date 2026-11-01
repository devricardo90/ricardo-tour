# RT-S11 — Procedimento do release do catálogo (TOUR-01, TOUR-02, TOUR-03)

Owner, 01/11/2026: propostas A (dados na origem) e B (gate obrigatório) aprovadas; proteção C (estado neutro) autorizada
para preparação local. Nada aqui foi executado no banco hospedado. Cada passo hospedado exige autorização escrita do Owner.

## Ordem obrigatória (validada em ensaio local em 01/11/2026)

1. **Backup** do banco de produção (Neon) antes de qualquer escrita.
2. **Migrations pendentes** (9, todas aditivas, incluindo `20261031120000_rt81_terms_acceptance`).
3. **Carga do conteúdo aprovado** dos três passeios nas tabelas RT-113 (sempre como DRAFT).
   - Atenção: o carregador `scripts/rt-119-load-content.ts` hoje prepara **só a Rocinha**. TOUR-01 e TOUR-03 precisam de
     registro de carga equivalente antes do release (o ensaio local usou um auxiliar temporário).
4. **Plano A — títulos e descrições dos cards** (`scripts/s11-launch-trip-copy.ts`): dry run revisado, depois `--apply`.
   Escreve só `Trip.title` e `Trip.description` dos três passeios (PT/EN/ES), a partir do conteúdo aprovado.
5. **Ato de aprovação do Owner** no banco (`approveTourContent`, um por passeio).
   - **Precisa vir depois do passo 4.** Qualquer mudança de campo público do `Trip` depois da aprovação a invalida
     automaticamente ("Trip public field changed after approval"); no ensaio, isso devolveu os três passeios ao estado neutro.
6. **Deploy de Preview** do candidato a release (sem promover).
7. **Gate B** contra a Preview: `npx tsx scripts/s11-release-gate.ts http <url-da-preview>`. Qualquer FAIL = NO-GO.
8. **Conferência visual do Owner** na Preview (o gate não substitui o olhar do Owner).
9. **Promoção/merge** somente com autorização expressa do Owner.

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
- Depois dos passos 3, 4 e 5: Home, listagem, sitemap, TOUR-04, preços e mídias OK; 5 de 9 páginas com o design
  aprovado. Falham TOUR-01 e TOUR-03 em EN/ES: título e chamada marcados `PENDING` no código, embora o Owner tenha aprovado
  PT/EN/ES no gate de 30/10. Corrigir esses status é decisão do Owner (proposta no relatório de 01/11).
