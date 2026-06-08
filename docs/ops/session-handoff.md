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

## RT-AI-005 REVIEW - Curated Knowledge Base Format

Estado: REVIEW em 2026-06-05.

Objetivo: definir o formato canonico e versionavel da futura base de conhecimento curada do Rick Travel AI Concierge.

Arquivo de produto criado:
- `docs/product/ai-concierge-knowledge-base-format.md`

Docs operacionais permitidos:
- `docs/ops/backlog.md`
- `docs/ops/status.md`
- `docs/ops/session-handoff.md`
- `docs/ops/execution-log.md`

Escopo executado:
- Definir objetivo da base curada e relacao com RT-AI-001, RT-AI-002, RT-AI-003 e RT-AI-004.
- Definir tipos de registros permitidos, campos obrigatorios, campos opcionais, metadados, idiomas, status de aprovacao, fonte, atualizacao e validade.
- Definir regras para conteudo publico versus interno e conteudo bloqueado.
- Definir formatos para tours, destinos/atracoes, regras comerciais, regras de seguranca, handoff, FAQ/matriz de respostas e claims bloqueados.
- Registrar relacao futura com RAG, embeddings e LangChain sem criar implementacao tecnica.
- Definir criterios de validacao.

Tipos minimos:
- `tour`
- `destination`
- `attraction`
- `commercial_rule`
- `safety_rule`
- `handoff_rule`
- `faq_answer`
- `blocked_claim`

Campos obrigatorios minimos:
- `id`, `type`, `locale`, `title`, `content`, `source`, `sourceAuthority`, `approvalStatus`, `owner`, `updatedAt`, `publicAllowed`, `ragAllowed`.

Campos opcionais minimos:
- `tourId`, `relatedTourIds`, `city`, `neighborhood`, `tags`, `riskLevel`, `handoffRequired`, `expiresAt`, `notes`.

Regras criticas:
- Somente `APPROVED` pode ser usado em resposta factual.
- `CONDITIONAL` exige regra explicita.
- `PENDING_OWNER_APPROVAL` deve gerar handoff.
- `BLOCKED` nunca deve ser usado para resposta publica.
- Tours exigem `isPublished=true`.
- Agenda nao significa disponibilidade confirmada.
- Preco final, pagamento, cancelamento e reembolso nao devem ser inferidos.
- Claims como Cadastur, avaliacao, seguros e "500+ tours" exigem evidencia aprovada.
- Portugues, ingles e espanhol sao prioridade inicial; sueco somente se houver conteudo aprovado.
- Nao misturar idiomas divergentes sem revisao.

Resultado local:
- `docs/product/ai-concierge-knowledge-base-format.md` criado.
- Documento define formato canonico, campos, estados, tipos, precedencia, validade, idioma e relacao futura com RAG sem criar implementacao.
- RT-AI-005 movida para REVIEW.

Restricoes desta execucao:
- Nenhum JSON/YAML de base real, seed, `data/`, base vetorial, embedding, chat, rota API, LangChain ou LangGraph.
- Nenhuma alteracao em frontend, backend, schema, admin, reservas, pagamentos, login, producao, `package.json` ou lockfiles.
- Nenhum `STATUS.md` ou `backlog.md` criado na raiz.
- Nenhum commit ou push executado.

Proximos passos:
- Revisar o formato canonico antes de qualquer prototipo tecnico.
- Nao criar base real, seed, embeddings, retrieval, chat, rota API, LangChain ou LangGraph sem nova task explicita.
- Manter politicas comerciais pendentes como `PENDING_OWNER_APPROVAL` e claims sem evidencia como `blocked_claim`.

## RT-AI-006 READY - First Curated Knowledge Base Seed Scope

Estado: READY em 2026-06-06.

Objetivo: definir o primeiro escopo editorial da Curated Knowledge Base Seed do Rick Travel AI Concierge antes de qualquer criacao de base real.

Arquivo de produto permitido na futura execucao:
- `docs/product/ai-concierge-first-kb-seed-scope.md`

Docs operacionais permitidos:
- `docs/ops/backlog.md`
- `docs/ops/status.md`
- `docs/ops/session-handoff.md`
- `docs/ops/execution-log.md`

Fontes documentais permitidas para referencia:
- `docs/product/ai-concierge-scope.md`
- `docs/architecture/ai-concierge-rag-strategy.md`
- `docs/product/ai-concierge-knowledge-base-inventory.md`
- `docs/product/ai-concierge-answer-matrix.md`
- `docs/product/ai-concierge-prompt-contract.md`
- `docs/product/ai-concierge-knowledge-base-format.md`

Escopo READY:
- Definir quais tipos de conteudo entram no primeiro pacote curado.
- Definir quais fontes ficam condicionais.
- Definir quais fontes ficam bloqueadas.
- Definir criterios editoriais antes de qualquer criacao de base real.
- Manter catalogo publico publicado como fonte primaria somente para tours com `isPublished=true`.
- Registrar que `TripSchedule` nao confirma disponibilidade.
- Registrar que claims como Cadastur, guias credenciados, seguro, avaliacoes, suporte rapido e seguranca dependem de evidencia/aprovacao explicita.
- Manter pagamento, cancelamento, reembolso, preco final, disponibilidade e confirmacao de reserva fora de resposta factual sem politica aprovada.

Restricoes desta abertura:
- `docs/product/ai-concierge-first-kb-seed-scope.md` nao foi criado.
- Nenhum JSON/YAML de base real, seed, `data/`, `prisma/seed.ts`, `messages/*.json`, base vetorial, embedding, chat, API, LangChain ou LangGraph.
- Nenhuma alteracao em frontend, backend, schema, banco, admin, bookings, pagamentos, usuarios, contatos privados, analytics, logs, `.env`, backups, deploy, `package.json` ou lockfiles.
- Nenhum `STATUS.md` ou `backlog.md` criado na raiz.
- Nenhum commit ou push executado.
- RT-AI-007 nao foi aberta.

Proximos passos:
- Executar RT-AI-006 somente quando autorizado, criando `docs/product/ai-concierge-first-kb-seed-scope.md`.
- Nao criar base real, JSON/YAML, seed, embeddings, retrieval, chat, rota API, LangChain ou LangGraph sem nova task explicita.

## RT-AI-006 REVIEW - First Knowledge Base Seed Scope

State: REVIEW on 2026-06-06.

Objective: define the first approved knowledge base seed scope for the Rick Travel AI Concierge before any real KB records or technical implementation exist.

Product file created:
- `docs/product/ai-concierge-first-kb-seed-scope.md`

Operational docs updated:
- `docs/ops/backlog.md`
- `docs/ops/status.md`
- `docs/ops/session-handoff.md`
- `docs/ops/execution-log.md`

Scope executed:
- Defined the purpose of the first KB seed.
- Defined included and excluded categories.
- Defined approved source hierarchy.
- Defined required fields for future KB records.
- Defined initial content groups: company identity, contact channels, trust and credibility, Cadastur/CNPJ references, tour catalog basics, booking rules, payment rules, cancellation/refund boundaries, customer support escalation, and language support.
- Defined what the AI Concierge may answer and must not answer.
- Defined WhatsApp/human support redirect rules.
- Defined validation criteria before any implementation task.

Restrictions preserved:
- No KB records, JSON/YAML, seed implementation, `data/`, `prisma/seed.ts`, `messages/*.json`, frontend, backend, API, Prisma schema, database, admin, bookings, payments, users, private contacts, analytics, logs, environment, package, lockfile, deployment, embeddings, LangChain, LangGraph, RAG implementation, or chat UI were changed.
- No commit or push was executed.
- RT-AI-007 was not opened.

Next step:
- Review `docs/product/ai-concierge-first-kb-seed-scope.md`.
- Do not create real KB records, JSON/YAML, seed files, embeddings, RAG, API routes, chat UI, LangChain, or LangGraph without a new explicit task.

## RT-AI-007 READY - First Curated KB Records Content

State: READY on 2026-06-06.

Objective: define the first curated editorial KB records for the Rick Travel AI Concierge, based on RT-AI-006.

Product file allowed in the future execution:
- `docs/product/ai-concierge-first-curated-kb-records.md`

Allowed future record groups:
- Company identity.
- Contact channels.
- Trust and credibility boundaries.
- Cadastur/CNPJ pending or blocked unless exact evidence is approved.
- Tour catalog basics from public published tours only.
- Booking as assisted/manual-confirmed flow.
- Payment as blocked/handoff unless approved policy exists.
- Cancellation/refund as blocked/handoff unless approved policy exists.
- Human support escalation.
- Language support for PT, EN, and ES.

Required fields for every future record:
- `id`, `type`, `locale`, `title`, `content`, `source`, `sourceAuthority`, `approvalStatus`, `owner`, `updatedAt`, `reviewedAt`, `publicAllowed`, `ragAllowed`, `handoffRequired`, `riskLevel`, `notes`.

Restrictions for this READY opening:
- `docs/product/ai-concierge-first-curated-kb-records.md` was not created.
- No code, frontend, backend/API, Prisma/schema, `data/`, JSON/YAML seed files, embeddings, RAG implementation, LangChain, LangGraph, chat UI, package, lockfile, environment, deployment, commit, or push.
- No real payment information or invented Cadastur/CNPJ, phone, email, opening hours, response time, ratings, reviews, safety, insurance, or certification claims.

Next step:
- Execute RT-AI-007 only when explicitly authorized, creating `docs/product/ai-concierge-first-curated-kb-records.md`.
- Keep the future task documentation-only and do not create machine-readable KB data or implementation artifacts.

## RT-AI-007 REVIEW - First Curated KB Records Content

State: REVIEW on 2026-06-08.

Objective: define the first curated editorial KB records for the Rick Travel AI Concierge, based on RT-AI-006.

Product file created:
- `docs/product/ai-concierge-first-curated-kb-records.md`

Operational docs updated:
- `docs/ops/backlog.md`
- `docs/ops/status.md`
- `docs/ops/session-handoff.md`
- `docs/ops/execution-log.md`

Scope executed:
- Defined the editorial record format and required metadata fields.
- Created first editorial records for company identity, contact channels, trust boundaries, Cadastur/CNPJ boundaries, tour catalog basics, manual booking, payment boundary, cancellation/refund boundary, human support escalation, safety/accessibility boundaries, and language support for PT, EN, and ES.
- Kept tour facts restricted to public published tours with `isPublished=true`.
- Kept `TripSchedule` from being treated as confirmed availability.
- Kept payment, cancellation, refund, Cadastur, CNPJ, trust, ratings, safety, insurance, and certification claims blocked or pending unless exact evidence is approved.

Restrictions preserved:
- No machine-readable KB data, JSON/YAML seed files, code, frontend, backend/API, Prisma/schema, `data/`, embeddings, RAG implementation, LangChain, LangGraph, chat UI, package, lockfile, environment, deployment, commit, or push.
- No real payment information or invented Cadastur/CNPJ, phone, email, opening hours, response time, ratings, reviews, safety, insurance, or certification claims.

Next step:
- Review `docs/product/ai-concierge-first-curated-kb-records.md`.
- Do not create technical KB data, JSON/YAML, seeds, embeddings, RAG, API routes, chat UI, LangChain, or LangGraph without a new explicit implementation task.

## RT-AI-008 READY - Verified Business Evidence Records

State: READY on 2026-06-08.

Objective: define a documentation-only evidence governance layer for real Rick Travel business data before any data is treated as public, website-safe, or AI Concierge-safe.

Product file allowed in the future execution:
- `docs/product/ai-concierge-verified-business-evidence-records.md`

Operational docs allowed:
- `docs/ops/backlog.md`
- `docs/ops/status.md`
- `docs/ops/session-handoff.md`
- `docs/ops/execution-log.md`

Future scope:
- Define evidence format, source/evidence requirement, owner approval, `reviewedAt`, `approvalStatus`, `publicAllowed`, `aiAllowed`, `websiteAllowed`, `riskLevel`, no-data-public-by-default rule, and sensitive-data approval rule.
- Cover CNPJ / razao social / nome fantasia, Cadastur, guide credential, approved public WhatsApp, approved public email, official social networks, service hours, booking policy, payment policy, cancellation/refund policy, real published tours, official photos, reviews if verifiable, and certificates/insurance/credentials if real evidence exists.

Restrictions for this READY opening:
- `docs/product/ai-concierge-verified-business-evidence-records.md` was not created.
- No JSON, YAML, seed, `data/`, `prisma/`, API, frontend, backend, schema, package, lockfile, embeddings, RAG, LangChain, LangGraph, chatbot, deploy, real business data ingestion, commit, or push.
- No sensitive data was published or treated as public by default.

Next step:
- Execute RT-AI-008 only when explicitly authorized, creating `docs/product/ai-concierge-verified-business-evidence-records.md`.
- Keep the future task documentation-only and do not create machine-readable KB data or implementation artifacts.

## RT-AI-008 REVIEW - Verified Business Evidence Records

State: REVIEW on 2026-06-08.

Objective: define how real Rick Travel business evidence must be recorded, reviewed, approved, blocked, and later used safely by the website or AI Concierge.

Product file created:
- `docs/product/ai-concierge-verified-business-evidence-records.md`

Operational docs updated:
- `docs/ops/backlog.md`
- `docs/ops/status.md`
- `docs/ops/session-handoff.md`
- `docs/ops/execution-log.md`

Scope executed:
- Defined evidence record format and approval states.
- Defined default rule that no real data is public, website-safe, or AI-safe by default.
- Created placeholder/blocking records for CNPJ/legal identity, Cadastur, guide credential, public WhatsApp, public email, official social media, service hours, booking policy, payment policy, cancellation/refund policy, published tours, official photos, reviews/testimonials, and insurance/certificates/licenses/safety claims.
- Kept sensitive business evidence `PENDING_OWNER_APPROVAL` or `BLOCKED` unless exact evidence and owner approval exist.
- Blocked future technical conversion without a separate task.

Restrictions preserved:
- No JSON, YAML, seed, `data/`, `prisma/`, API, frontend, backend, schema, package, lockfile, embeddings, RAG, LangChain, LangGraph, chatbot, deploy, real business data runtime ingestion, commit, or push.
- No real sensitive data was made public by default.

Next step:
- Review `docs/product/ai-concierge-verified-business-evidence-records.md`.
- Do not convert evidence records into JSON/YAML, seed, database, embeddings, RAG, API, chat UI, LangChain, or LangGraph without a new explicit implementation task.

## RT-AI-009 READY - Approved Public Business Evidence Values

State: READY on 2026-06-08.

Objective: create a separate approved-values register for real Rick Travel business evidence values that the owner explicitly approves for public, website, and/or future AI Concierge use.

Product file allowed in the future execution:
- `docs/product/ai-concierge-approved-public-business-evidence-values.md`

Operational docs allowed:
- `docs/ops/backlog.md`
- `docs/ops/status.md`
- `docs/ops/session-handoff.md`
- `docs/ops/execution-log.md`

Future scope:
- Record only explicitly owner-approved values using the RT-AI-008 evidence format.
- Require exact value, evidence source, source type, source authority, owner approval, `reviewedAt`, `updatedAt`, `approvalStatus`, `publicAllowed`, `websiteAllowed`, `aiAllowed`, `handoffRequired`, `riskLevel`, and limitation notes.
- Default `publicAllowed`, `websiteAllowed`, and `aiAllowed` to `false`.
- Treat screenshots alone as insufficient for high-risk categories.
- Keep runtime usage blocked until a future technical implementation task.

Restrictions for this READY opening:
- `docs/product/ai-concierge-approved-public-business-evidence-values.md` was not created.
- No real business values, CPF, private address, private phone, private email, signatures, QR codes, document scans, payment keys, passwords, tokens, `.env`, admin data, booking data, payment data, contact submissions, analytics, logs, credentials, JSON, YAML, seed, `data/`, `prisma/`, API, frontend, backend, schema, package, lockfile, embeddings, RAG, LangChain, LangGraph, chatbot, deploy, database change, runtime ingestion, commit, or push.

Next step:
- Execute RT-AI-009 only when explicitly authorized, creating `docs/product/ai-concierge-approved-public-business-evidence-values.md`.
- Keep the future task documentation-only and do not create runtime ingestion or technical implementation artifacts.

## RT-AI-009 DONE - Approved Public Business Evidence Values

State: Remote DONE on 2026-06-08 (commit `a4668a7`).

Result:
- Product file `docs/product/ai-concierge-approved-public-business-evidence-values.md` created.
- Approved-values register structure established with all required governance sections and fields.
- No real business values added yet.
- Runtime and technical implementation remain blocked.

## RT-AI-010 READY - Add First Owner-Approved Public Business Evidence Values

State: READY on 2026-06-08.

Objective: add the first owner-approved public business evidence values for Rick Travel to the existing approved business evidence document.

Proposed values:
- Brand name, description, regions, languages, and general services.
- Approved contact channels (WhatsApp, Email, Instagram) with IA rules.
- AI Concierge allowed answers and handoff rules.

Restrictions preserved:
- `docs/product/ai-concierge-approved-public-business-evidence-values.md` was not modified yet.
- No real business values (CNPJ, Cadastur, prices) were added to the product document.
- No code, API, frontend, backend, database, JSON, YAML, or seed changes.
- No commit or push performed for RT-AI-010.
