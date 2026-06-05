# Session Handoff - Rick Travel

Data: 2026-05-14 (atualizado por RT-FINAL-04C2 - Add Final Catalog Assets and Seed Definition)

## Contexto

Sessao atualizada ate a Fase 3 - Operacao publica controlada do MVP seguindo o Protocolo Rick.
RT-FINAL-DG aprovada. RT-FINAL-00 concluida como auditoria pura. RT-FINAL-00A Remote DONE confirmado. RT-FINAL-03A executada manualmente em producao pelo Trigger. RT-FINAL-04B Remote DONE (commit c7a1d47). RT-FINAL-04C1 CLOSED (Discussion Gate). RT-FINAL-04C2 Remote DONE (commit dfa7489). RT-FINAL-04C2B executada localmente; blocos `update` dos 6 schedules corrigidos para incluir `capacity` e `pricePerPersonCents`; aguardando aprovacao do Trigger para commit; seed nao executado em producao.

## RT-023A Portfolio README Showcase

Estado: DONE remoto - commit `67584b6 docs: create Rick Travel portfolio README showcase` publicado em `origin/main` em 2026-05-06.

Nota de reconciliacao (RT-FINAL-00A): este registro declarava "REVIEW local, aguardando autorizacao de commit". O Git prova que o commit foi publicado.

Resultado:
- README principal reescrito em ingles como vitrine profissional de portfolio.
- Imagem principal copiada para `docs/assets/rick-travel-hero.png`.
- README usa apenas caminho relativo `docs/assets/rick-travel-hero.png`.
- Conteudo cobre overview, capacidades do produto, status de producao, fluxos validados, live demo, stack, arquitetura, Protocolo Rick, desenvolvimento local, comandos uteis, limitacoes e autor.
- Validacao local concluida com diff restrito aos arquivos autorizados e `git diff --check` PASS com avisos LF/CRLF conhecidos.

Restricoes mantidas:
- Nenhum codigo, schema, migration, seed, env, banco, deploy, `package.json` ou lockfile foi alterado.

RT-015A DONE: auditoria de catalogo concluida.
RT-015B DONE: seed de producao criado e executado manualmente.
RT-015C-FIX DONE: bug critico de click interception corrigido.
RT-015C DONE: smoke completo de producao validado pelo Trigger.
RT-016A DONE remoto + production smoke validated: polish do fluxo de confirmacao de reserva do usuario implementado sem gateway.
RT-016B DONE remoto + production smoke validated: Home consolidada no catalogo real; package cards antigos removidos da renderizacao; commit `5e120a4`.
RT-016C DONE remoto + production smoke validated: seed controlado executado; imagem real aplicada ao tour existente; agenda renovada; smoke PASS em producao.
RT-017A DONE: regras e fatiamento do Admin Tour Manager MVP documentados em `docs/ops/admin-tour-manager-rules.md`.
RT-017B DONE remoto + production smoke validated: listagem somente leitura de tours implementada e validada visualmente em producao; link "Tours" ativo; tour real exibido com contagem de agendas.
RT-017C DONE remoto + production smoke manual validated: criacao de novos tours (rascunho) via formulario em `/[locale]/admin/tours/new` funcional e validada em producao pelo Trigger.

RT-018A DONE: Production Product Smoke Check executado em producao no commit `6b59c92`; fluxo publico PASS; admin anonimo PASS; admin non-admin FAIL; login ADMIN BLOCKED por ausencia de credencial no ambiente.
RT-018B DONE remoto + production non-admin smoke validated: Fix Admin Non-Admin Authorization Handling publicado no commit `bcf8119`; usuario comum recebe "Acesso negado" nas rotas admin, sem 500.
RT-018C DONE remoto + production admin smoke validated: Production Admin Access validation concluida via RT-018D.
RT-018D DONE: Validate Existing Production Admin User executado em producao; login ADMIN PASS; rotas admin PASS; booking de auditoria visivel PASS.
## RT-019A DONE: Publicar Pao de Acucar com caminho controlado de dados
Estado: Remote DONE + Production Seed/Smoke PASS
Objetivo: Fazer o tour Pao de Acucar aparecer no catalogo publico de forma controlada, segura e reproduzivel.
Evidencias:
- Seed executado em producao: detectou tour existente pelo titulo e reutilizou ID `cmolfs9eu000004l2trz4q8bf`.
- `/pt/tours`: 2 tours visiveis (Cristo e Pao de Acucar).
- Pao de Acucar: publicado, imagem correta aplicada, agenda futura ativa (`03/08/2026`).
- Fluxo de reserva: validado ate tela de confirmacao.
- Cristo Redentor: mantida imagem atual para evitar regressao visual de placeholder.
- Commit final remoto/documental: `8f4061b docs: record RT-019A production seed validation`.

## RT-018E: Fix Logout Flow
- Causa raiz: `app/api/auth/sign-out/route.ts` interceptava POST `/api/auth/sign-out` antes do handler `[...all]` do Better Auth; apenas limpava cookies sem invalidar sessao no banco.
- Solucao: rota removida; `authClient.signOut()` agora atinge `[...all]` (Better Auth nativo) que invalida a sessao no banco e limpa cookies via `nextCookies()`.
- `components/auth-status.tsx`: `const locale = useLocale()` adicionado; redirect corrigido para `/${locale}`.
- `components/mobile-menu.tsx`: `const locale = useLocale()` adicionado no componente; redirect corrigido de `"/"` para `` `/${locale}` ``; import nao utilizado `ShieldCheck` removido.
- Validacoes locais: lint PASS, typecheck PASS, test PASS (4 arquivos, 15 testes), build PASS, git diff --check PASS.
- Commit: `837694b fix: correct logout flow` publicado em `origin/main`.
- Deploy automatico Vercel validado com Production Smoke PASS (RT-018E); nenhuma validacao adicional pendente para encerrar RT-018E.


- RT-018D: validacao de acesso ADMIN em producao.
  - Credenciais fornecidas manualmente pelo Trigger (nao expostas em logs/docs).
  - Login ADMIN PASS (200 OK).
  - `/pt/admin`, `/pt/admin/tours`, `/pt/admin/bookings`, `/pt/admin/contacts` PASS (200 OK).
  - Booking `cmoli78ld000204js1agra4il` visivel em `/pt/admin/bookings` PASS.
  - Sem alteracao de codigo, banco, schema ou deploy manual.
- RT-018C desbloqueada e concluida.

- RT-017C: criada `createTripAction` protegida em `admin.ts`; implementada pagina de criacao com formulario, validacao de Titulo PT e conversao de preco; botao "Novo Tour" adicionado a listagem; commit remoto `4c3e3fe`.
- RT-017C production smoke manual: Vercel production estava no commit `4c3e3fe`; Trigger executou o smoke com credencial ADMIN privada; credenciais nao foram compartilhadas com o agente; tour real "Pao de Acucar ao Entardecer" criado como rascunho com ID `cmolfs9eu000004l2trz4q8bf`, cidade `rio de janeiro`, preco R$ 245,00, status RASCUNHO / `isPublished=false` e 0 agendas; tour aparece em `/pt/admin/tours`; tour nao aparece em `/pt/tours`, que exibe apenas "Cristo Redentor + Mirante Dona Marta"; nenhum deploy manual, migration, seed ou alteracao direta no banco foi executado pelo agente.
- Observacoes do smoke RT-017C: preco planejado anteriormente era R$ 295,00, mas o tour foi criado com R$ 245,00; cidade ficou em minusculo (`rio de janeiro`); nao corrigir agora; ajustes futuros devem aguardar task de edicao/admin update.
- RT-018A production product smoke:
  - URL testada: `https://rick-travel.vercel.app/pt`.
  - Commit em producao: `6b59c92`, Vercel Ready, branch `main`.
  - Git antes/final do smoke: working tree limpa; `main...origin/main`.
  - Public flow: Home PASS; `/pt/tours` PASS; `/pt/tours/seed-001-cristo-dona-marta` PASS; `/pt/login` PASS; `/pt/register` PASS; reserva publica PASS ate confirmacao manual.
  - Booking criado por fluxo publico normal: `cmoli78ld000204js1agra4il`; pagina final `/pt/reservas/cmoli78ld000204js1agra4il`; status Pendente; total R$ 245,00; pagamento "A combinar com a equipe"; nenhum checkout externo/pagamento online iniciado.
  - Tour principal: "Cristo Redentor + Mirante Dona Marta"; preco R$ 245,00; duracao "Aprox. 4 horas"; descricao, CTA e agenda/select PASS.
  - Content WARN: imagem real exibida (`/images/trips/imagem-morro-pao-de-acucar.jpg`) parece Pao de Acucar, nao Cristo/Dona Marta.
  - Catalogo WARN: apenas 1 tour publico; "Pao de Acucar ao Entardecer" permanece rascunho corretamente fora do publico.
  - Admin anonymous protection PASS: `/pt/admin`, `/pt/admin/tours`, `/pt/admin/bookings` e `/pt/admin/contacts` sem sessao redirecionam para `/pt/login`.
  - Admin real login BLOCKED: credencial ADMIN nao estava disponivel no ambiente.
  - Admin non-admin authorization FAIL: usuario comum autenticado recebeu 500 nas rotas admin; erro de producao `ERROR 2933230167`; esperado e bloqueio controlado, redirect ou 403.
  - React hydration WARN: minified React error `#418` observado durante navegacao/auth; nao bloqueou reserva.
  - Nenhum codigo, schema, seed, migration, deploy ou alteracao manual de banco foi executado; usuario e booking foram criados somente pelo fluxo publico normal do produto.
- RT-018B:
  - Causa provavel do 500: `requireAdminSession()` lancava `DomainError` `FORBIDDEN`, mas o `AdminLayout` so tratava `UNAUTHENTICATED`; o `FORBIDDEN` era relancado e virava erro 500 em producao.
  - Solucao aplicada: tratamento centralizado de `FORBIDDEN` em `app/[locale]/admin/layout.tsx`, renderizando tela controlada "Acesso negado" com retorno ao site.
  - Protecao preservada: `requireAdminSession()` continua sendo a entrada central; paginas e actions admin nao receberam duplicacao de RBAC.
  - Validacao local: `tests/admin-layout.test.tsx` cobre anonimo -> redirect para login, USER -> acesso negado controlado, ADMIN -> conteudo renderizado.
  - Sem alteracao em regras de booking, tour, contact, schema, seed, migration, deploy manual ou banco manual.
- RT-018C:
  - Git antes da validacao: working tree limpa; `main...origin/main`; topo `bcf8119`.
  - Producao confirmada: Vercel Ready, branch `main`, commit `bcf8119`.
  - Credencial ADMIN: BLOCKED; variaveis `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_USER` e `ADMIN_USERNAME` ausentes no processo e env local pesquisado.
  - Rotas admin com ADMIN real: NOT TESTED/BLOCKED (`/pt/admin`, `/pt/admin/tours`, `/pt/admin/bookings`, `/pt/admin/contacts`).
  - Booking `cmoli78ld000204js1agra4il` no admin: BLOCKED porque login ADMIN real nao foi possivel.
  - Sem promocao manual de usuario; sem alteracao direta no banco; sem schema, seed, migration, deploy manual ou codigo nesta RT.
  - Metodo controlado recomendado: promover usuario existente conhecido para ADMIN via Neon SQL Editor somente com autorizacao explicita do Trigger, ou criar task separada para fluxo seguro de promocao ADMIN.

- RT-017B: adicionado `listAllTrips` em `trip.service.ts`; adicionado link "Tours" no menu admin; criada pagina `/[locale]/admin/tours` com listagem read-only; validado que apenas admins acessam via `AdminLayout`; smoke visual PASS em producao via deploy automatico Vercel.
- RT-017D/E permanecem PLANNED; nenhuma READY aberta.

- RT-015A: auditoria confirmou 0 trips em Neon production; causa do vazio: ausencia de dados (schema correto, filtro correto); campo `slug` inexistente em `Trip`.
- RT-015B: criado `prisma/seed.ts` com IDs deterministicos (`seed-001-cristo-dona-marta`, `seed-001-schedule-001`); adicionado `prisma.seed` em `package.json`; commit `cf0f96f feat: add idempotent minimal seed for RT-015B` publicado; seed executado manualmente pelo Trigger contra Neon production.
- RT-015C-FIX: diagnosticado bug critico - `MobileMenu` bottom sheet com `position: fixed; z-index: 50; opacity: 0` interceptava cliques em toda a regiao inferior de cada pagina publica porque nao tinha `pointer-events: none`; a GSAP nao setava `sheet.style.pointerEvents = "none"` no branch de fechar; fix: (1) `pointer-events-none` no className inicial do sheet, (2) `sheet.style.pointerEvents = "auto"` no branch open, (3) `sheet.style.pointerEvents = "none"` no branch close; lint PASS, typecheck PASS, build PASS antes do commit; commit `fa83e02 fix: prevent invisible mobile menu sheet from intercepting page clicks (RT-015C)` publicado.
- RT-015C smoke completo validado em producao pelo Trigger:
  - `/pt/tours`: tour Cristo Redentor + Mirante Dona Marta visivel.
  - Tour detail: abre corretamente apos fix.
  - Schedule selector: funcional (data 29/07/2026).
  - Booking criado: Ricardo / ricardo@gmail.com, R$ 245,00, 1 hospede.
  - `/pt/admin/bookings`: reserva aparece na listagem.
  - Detalhe admin `/pt/admin/bookings/[id]`: dados corretos.
  - Cancelamento admin: status = CANCELED confirmado (visivel na listagem).
  - Detalhe pos-cancelamento: Hospedes: 1; Total: R$ 245,00; Data: 29/07/2026; "Nenhuma tentativa de pagamento registrada."
  - Payment attempts remained absent; no payment gateway/refund/payment mutation was triggered in the MVP flow. Nenhum campo `paymentStatus` exposto diretamente pela UI do detalhe.
- RT-016A:
  - adicionada rota `/[locale]/reservas/[bookingId]` para confirmacao/detalhe da reserva do usuario;
  - adicionada protecao de ownership via `getBookingForUser(bookingId, userId)`;
  - criacao de booking no detalhe do tour redireciona para `/reservas/{bookingId}` somente quando a API devolve `id`;
  - `/reservas` agora lista reservas com status e pagamento legiveis, link de detalhe e copy de pre-reserva/manual confirmation flow;
  - nenhum gateway, schema, migration, seed, env, Neon/provider/auth ou regra de cancelamento admin foi alterado;
  - validacoes locais: `npm.cmd run lint` PASS com warning pre-existente em `components/mobile-menu.tsx`; `npm.cmd run typecheck` PASS; `npm.cmd run build` PASS fora do sandbox; `git diff --check` PASS com avisos LF/CRLF.
  - commit publicado: `799698c feat: polish booking confirmation flow`;
  - smoke de producao validado pelo Trigger: `/pt/tours`, detalhe do tour, criacao de booking, redirect para `/pt/reservas/{bookingId}`, pagina de confirmacao, mensagem de pre-reserva/manual confirmation, listagem `/pt/reservas`, link "Ver detalhes", payment status sem enum cru e listagem admin de bookings funcional.
- RT-016B:
  - removida da Home a renderizacao da secao legada que continha package cards apontando para contato;
  - componente legado removido por nao estar mais referenciado e conter os cards antigos;
  - `ReservationsSection`/`Passeios disponiveis` permanece como catalogo real principal;
  - `/pt/tours` segue como catalogo oficial completo;
  - seed preparado para usar `/images/trips/imagem-morro-pao-de-acucar.jpg` no tour existente;
  - seed nao executado; Neon nao tocado; sem schema, migration, gateway, admin, auth/env/provider;
  - validacoes locais: `npm.cmd run lint` PASS com warning pre-existente em `components/mobile-menu.tsx`; `npm.cmd run typecheck` PASS; `npm.cmd run build` PASS fora do sandbox; build local registrou `ECONNREFUSED` Prisma em `/api/trips`/sitemap por DB local indisponivel, com exit code 0.

## Estado atual do repositorio

- GitHub `main`: `67584b6 docs: create Rick Travel portfolio README showcase` (topo real em 2026-05-13).
- RT-021A: Remote DONE + Production UX Smoke PASS no commit `69379fe fix: polish public tour navigation UX`.
- RT-022A: DONE remoto - commit `b0e4d4a feat: add admin booking confirm and cancel flow` publicado em `origin/main` em 2026-05-01. Smoke mutavel de confirmacao admin (PENDING -> CONFIRMED) em producao ainda pendente de validacao.
- RT-023A: DONE remoto - commit `67584b6 docs: create Rick Travel portfolio README showcase` publicado em `origin/main` em 2026-05-06.
- RT-FINAL-00: DONE (auditoria pura, 2026-05-13) - nenhum arquivo alterado.
- RT-FINAL-00A: Local DONE - commit documental autorizado pelo Trigger.
- RT-FINAL-03A: Manual production validation DONE by Trigger - admin login PASS; admin booking list PASS; status CONFIRMED/PENDING/CANCELED visiveis; confirm/cancel admin flow validated manually by Trigger; nenhum erro visivel reportado no navegador; screenshot nao commitado por conter dados pessoais/e-mails.
- RT-FINAL-04B: Remote DONE - commit `c7a1d47 feat: improve public trust and manual booking copy` publicado em `origin/main`.
- RT-FINAL-04C1: CLOSED (Discussion Gate) - catalogo final de 6 tours aprovado pelo Trigger; pacote de decisao sem execucao de repositorio.
- RT-FINAL-04C2: Local REVIEW - 2 assets JPEG adicionados (`imagem-helicoptero-cristo.jpg`, `imagem-floresta-tijuca.jpg`); `prisma/seed.ts` reescrito com catalogo final de 6 tours; seed NAO executado; aguardando aprovacao do Trigger para commit.
- Vercel production: ativo; healthcheck database ok; 2 tours publicados; RT-018E Production Smoke PASS; RT-019A Production Seed/Smoke PASS.
- Neon production: 2 Trips publicadas no catalogo (`Cristo Redentor + Mirante Dona Marta` e `Pao de Acucar ao Entardecer`), agendas futuras ativas, sem duplicacao de Pao de Acucar, 1 Booking de teste (CANCELED) e 1 booking de auditoria criado pelo fluxo publico normal (`cmoli78ld000204js1agra4il`).
- Dominio proprio: nao configurado.

## Evidencias importantes

- `components/mobile-menu.tsx`: fix de `pointer-events` em 3 pontos; unico arquivo alterado na RT-015C-FIX.
- `prisma/seed.ts`: seed idempotente com `upsert` em IDs fixos; sem `deleteMany`; sem migration.
- `paymentStatus` nao e alterado pelo cancelamento admin (confirmado em smoke).
- RT-016A nao inicia checkout nem promete pagamento online; pagamento aparece como etapa manual a combinar com a equipe.
- RT-016B nao executou seed; apenas preparou `prisma/seed.ts` para proxima execucao autorizada.
- RT-018B corrigiu o bug P1 identificado na RT-018A; smoke em producao confirmou usuario comum com "Acesso negado" e sem 500.
- Nenhuma migration executada.
- Seed de RT-019A executado uma unica vez; nao foi executado novamente apos a documentacao.
- RT-021A corrigiu UX publica: Hero Search locale-aware sem locale duplicado, busca real por `search`, Nossos Tours sem filtro lateral, card levando ao detalhe/agenda, footer sem links falsos; lint/typecheck/test/build/git diff --check PASS; Production UX Smoke PASS.
- RT-022A DONE remoto (reconciliado por RT-FINAL-00A): commit `b0e4d4a` publicado em `origin/main`; adiciona `confirmBookingByAdmin` e `confirmBookingByAdminAction`; botao de confirmacao no detalhe admin; labels legiveis de status e paymentStatus; testes unitarios; E2E spec com guard local.
- RT-FINAL-03A manual production validation: admin booking actions validated manually by Trigger; lista admin mostrou reservas CONFIRMED/PENDING/CANCELED e fluxo confirm/cancel foi considerado funcional, sem erro visivel reportado.
- RT-FINAL-04B Remote DONE: commit `c7a1d47`; link "Reservas" removido do footer; WhatsApp e formulario destacados; copy de pre-reserva manual aplicada.
- RT-FINAL-04C2 Remote DONE (commit dfa7489): assets JPEG adicionados; `prisma/seed.ts` reescrito com 6 tours finais + despublicacao de seed-001 via updateMany.
- RT-FINAL-04C2B local: blocos `update` dos 6 schedules corrigidos para incluir `capacity` e `pricePerPersonCents`; seed nao executado.

## O que continua pendente

- Janela controlada para o residual de `npm audit` em Prisma dev tooling.
- Dominio proprio nao configurado.
- Guia de operacao para o dono (handoff operacional) nao existe.
- Imagem do tour Cristo Redentor usa asset do Pao de Acucar - conteudo comercial incorreto.
- Minimo de 4 tours reais segue pendente; RT-FINAL-04C nao foi aberta.
- E-mail publico direto e redes sociais reais seguem pendentes de confirmacao do owner.
- React hydration error #418 sem task de investigacao aberta.
- Observacao futura opcional: empty state de busca sem resultado usa copy generica aceitavel; nao corrigir microcopy agora.

## Proximas candidatas (sem READY automatica)

- RT-FINAL-01 - Define Delivery Scope and Acceptance Criteria
- RT-FINAL-02 - Stabilize Public Tour and Booking Flow
- RT-FINAL-04 - Polish Commercial Content and Trust Layer
- RT-FINAL-05 - Configure Custom Domain and Final Production Smoke
- RT-FINAL-06 - Owner Handoff Package

## RT-AI-001 REVIEW - AI Concierge Scope and Safety Rules

Estado: REVIEW em 2026-06-03.

Objetivo: definir documentacao de escopo, arquitetura inicial e regras de seguranca para o Rick Travel AI Concierge, um agente publico para turistas interessados no Rio de Janeiro.

Resultado local:
- `docs/product/ai-concierge-scope.md` criado com visao de produto, objetivo, usuarios-alvo, casos de uso, intencoes, respostas permitidas/bloqueadas, regras comerciais, seguranca turistica, handoff humano, limites contra alucinacao, separacao com RIC Studio, MVP inicial e criterios de sucesso.
- `docs/architecture/ai-concierge-rag-strategy.md` criado com arquitetura inicial, justificativa de RAG controlado, fontes permitidas, tipos de conteudo, chunking, recuperacao, embeddings/vector search futuros, relacao futura com LangChain/LangGraph/RIC Studio, guardrails, riscos e etapas futuras.

Arquivos criados:
- `docs/product/ai-concierge-scope.md`
- `docs/architecture/ai-concierge-rag-strategy.md`

Docs operacionais atualizados:
- `docs/ops/backlog.md`
- `docs/ops/status.md`
- `docs/ops/session-handoff.md`
- `docs/ops/execution-log.md`

Criterios de validacao da futura task:
- Definir objetivo do agente.
- Definir usuarios-alvo.
- Definir intencoes principais.
- Definir fontes permitidas.
- Definir limites do agente.
- Definir riscos de alucinacao.
- Definir regras comerciais.
- Definir regras de seguranca turistica.
- Definir quando encaminhar para humano.
- Definir arquitetura inicial RAG.
- Definir relacao futura com LangChain.
- Definir relacao futura com LangGraph.
- Definir separacao entre AI Concierge publico e RIC Studio interno.
- Nao alterar codigo, frontend, backend, schema, seed, admin, reservas, pagamentos ou producao.

Restricoes mantidas na execucao documental:
- Nenhum `STATUS.md` ou `backlog.md` criado na raiz.
- Nenhuma dependencia instalada.
- Nenhum chat, rota API, banco vetorial, schema, seed, frontend, admin, pagamento, reserva, login ou producao alterado.
- Nenhum commit ou push executado.

## RT-AI-002 REVIEW - AI Concierge Knowledge Base Inventory

Estado: REVIEW em 2026-06-04.

Resultado local: `docs/product/ai-concierge-knowledge-base-inventory.md` criado para inventariar fontes existentes e classifica-las como ALLOWED, CONDITIONAL ou BLOCKED antes de qualquer etapa tecnica de RAG.

Arquivos da execucao:
- `docs/product/ai-concierge-knowledge-base-inventory.md`
- `docs/ops/backlog.md`
- `docs/ops/status.md`
- `docs/ops/session-handoff.md`
- `docs/ops/execution-log.md`

Conteudo registrado no inventario:
- caminho ou origem, tipo, prioridade, autoridade e idiomas;
- classificacao publico versus interno e responsavel pela aprovacao;
- risco de desatualizacao, gatilho de revisao e relacao com futuras etapas RAG;
- precedencia entre fontes, resolucao de conflitos, lacunas e aprovacoes pendentes.

Regras registradas:
- Catalogo publico publicado prevalece; somente `isPublished=true` e elegivel para resposta publica.
- `TripSchedule` nao confirma disponibilidade e seed e apenas referencia secundaria.
- `data/real-trips.json` e bloqueado ou legado divergente ate revisao futura.
- `docs/ops/*` nao deve ser ingerido integralmente.
- Dados privados, bookings, pagamentos, contatos, admin, analytics, e-mails, logs, `.env`, segredos e backups sao bloqueados.
- Claims sem evidencia e politicas de pagamento, cancelamento, reembolso ou disponibilidade sem aprovacao explicita nao entram na base.

Proximos passos:
- Revisar e aprovar o inventario antes de qualquer formato canonico ou prototipo de retrieval.
- Resolver politicas comerciais, claims e FAQ pendentes com o owner.

Restricoes da execucao:
- Nenhuma implementacao tecnica, dependencia, base vetorial, embedding, chat ou rota API.
- Nenhuma alteracao em frontend, backend, schema, seed, admin, reservas, pagamentos, login ou producao.
- Nenhum commit ou push.

## RT-AI-003 REVIEW - Approved FAQ and Answer Matrix

Estado: REVIEW em 2026-06-04.

Objetivo: criar uma matriz documental aprovada de perguntas, respostas esperadas, respostas bloqueadas e criterios de handoff humano para validar futuramente o Rick Travel AI Concierge.

Arquivo de produto permitido:
- `docs/product/ai-concierge-answer-matrix.md`

Docs operacionais permitidos:
- `docs/ops/backlog.md`
- `docs/ops/status.md`
- `docs/ops/session-handoff.md`
- `docs/ops/execution-log.md`

Nao criar:
- `docs/product/ai-concierge-approved-faq.md`.

Escopo da futura matriz:
- Registrar por cenario identificador, intencao, idioma, pergunta, fonte autorizada, comportamento esperado, respostas bloqueadas, esclarecimentos permitidos, handoff, aprovacao e validacao.
- Cobrir os 20 cenarios minimos registrados em `docs/ops/backlog.md`.
- Incluir exemplos em portugues, ingles e espanhol com os mesmos guardrails.
- Exigir handoff para decisoes comerciais, seguranca, acessibilidade, baixa confianca, conflito entre fontes e pedido explicito de humano.
- Manter conflitos comerciais sem resolucao como `PENDING_OWNER_APPROVAL`, nunca como FAQ factual aprovada.

Resultado local:
- Matriz de cenários criada em `docs/product/ai-concierge-answer-matrix.md`.
- `docs/product/ai-concierge-approved-faq.md` não foi criado.
- 20 cenários mínimos estabelecidos com critérios claros de respostas esperadas, bloqueadas e handoff.
- Conflitos mantidos como PENDING_OWNER_APPROVAL.
- RT-AI-003 movida para REVIEW.

Proximos passos:
- Revisar a matriz antes de qualquer prototipo de RAG, chat ou agente.

Restricoes desta execucao:
- Nenhuma implementacao tecnica, dependencia, base vetorial, embedding, chat ou rota API.
- Nenhuma alteracao em frontend, backend, schema, seed, admin, reservas, pagamentos, login, producao, `package.json` ou lockfiles.
- Nenhum commit ou push executado.

## RT-AI-004 REVIEW - Prompt and Guardrail Contract

Estado: REVIEW em 2026-06-05.

Objetivo: definir o contrato operacional do futuro Rick Travel AI Concierge antes de qualquer implementacao tecnica de chat, rota API, RAG, LangChain ou LangGraph.

Arquivo de produto permitido na futura execucao:
- `docs/product/ai-concierge-prompt-contract.md`

Docs operacionais permitidos:
- `docs/ops/backlog.md`
- `docs/ops/status.md`
- `docs/ops/session-handoff.md`
- `docs/ops/execution-log.md`

Escopo da futura task:
- Definir persona publica: Rick Travel AI Concierge.
- Definir papel do agente, tom de voz e idioma de resposta.
- Exigir uso de fontes aprovadas ou contexto recuperado.
- Definir regra de nao invencao, baixa confianca e conflito entre fontes.
- Definir regras comerciais, seguranca turistica, handoff humano, recusas e bloqueios.
- Definir formato esperado e formato bloqueado de resposta.
- Registrar que RIC Studio nao deve ser mencionado no fluxo publico.
- Criar contrato minimo para futura implementacao tecnica de system/developer prompt, sem criar codigo.

Regras criticas:
- Pagamento, cancelamento e reembolso continuam `PENDING_OWNER_APPROVAL`.
- Baixa confianca deve gerar "nao tenho informacao aprovada" e encaminhamento humano.
- O agente deve responder no idioma do usuario quando possivel.
- O agente deve ser curto, claro e comercialmente seguro.
- O agente nao deve prometer acao operacional.

Restricoes da abertura READY:
- `docs/product/ai-concierge-prompt-contract.md` ainda nao foi criado.
- Nenhum prompt em codigo, chat, rota API, base vetorial, embedding, LangChain ou LangGraph.
- Nenhuma alteracao em frontend, backend, schema, seed, admin, reservas, pagamentos, login, producao, `package.json` ou lockfiles.
- Nenhum `STATUS.md` ou `backlog.md` criado na raiz.
- Nenhum commit ou push executado.

Resultado local:
- `docs/product/ai-concierge-prompt-contract.md` criado.
- Contrato cobre objetivo, relacao com RT-AI-001/002/003, persona, papel, tom, idioma, fontes, nao invencao, baixa confianca, conflito entre fontes, regras comerciais, seguranca turistica, favela/comunidade, acessibilidade, criancas, idosos, necessidades especiais, pagamento/cancelamento/reembolso, handoff, recusas, formato de resposta e limite sobre RIC Studio.
- RT-AI-004 movida para REVIEW.

Proximos passos:
- Revisar o contrato antes de qualquer prototipo tecnico.
- Nao abrir chat, rota API, RAG tecnico, LangChain, LangGraph, embeddings ou base vetorial ate o contrato ser aprovado.
- Manter pagamento, cancelamento e reembolso como `PENDING_OWNER_APPROVAL` ate politica final.

Restricoes desta execucao:
- Nenhum prompt em codigo, chat, rota API, base vetorial, embedding, LangChain ou LangGraph.
- Nenhuma alteracao em frontend, backend, schema, seed, admin, reservas, pagamentos, login, producao, `package.json` ou lockfiles.
- Nenhum `STATUS.md` ou `backlog.md` criado na raiz.
- Nenhum commit ou push executado.
