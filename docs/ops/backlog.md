# Backlog Canonico - Protocolo Rick

Estados permitidos: READY, IN_PROGRESS, REVIEW, DONE, BLOCKED.

## RT-001 Descoberta e contexto do produto

Estado: DONE

Objetivo: consolidar visao de produto, contexto tecnico e operacao real.

Tarefas:

- RT-001.1 Inventariar docs, configs, rotas, modelos e scripts. Estado: DONE.
- RT-001.2 Separar evidencias reais de assumptions/unknowns. Estado: DONE.
- RT-001.3 Validar decisoes de negocio com owner. Estado: PLANNED.

Criterios de aceite: status, backlog, handoff, resume pack e matriz de versoes existem e refletem o repositorio.
Dependencias: nenhuma.
Risco: medio.
Evidencia esperada: `docs/ops/status.md`, `docs/ops/resume-pack.md`.

## RT-002 Arquitetura base

Estado: REVIEW

Objetivo: manter arquitetura Next + services + Prisma consistente.

Tarefas:

- RT-002.1 Confirmar qual `package.json` e fonte de verdade. Estado: DONE.
- RT-002.2 Resolver duplicatas `(2)` sem apagar contexto valido. Estado: DONE.
- RT-002.3 Corrigir typecheck global. Estado: DONE.
- RT-002.4 Manter build sem dependencia de fonte remota. Estado: DONE.
- RT-002.5 Revisar E2E autenticado remanescente. Estado: PLANNED.

Criterios de aceite: lint, typecheck, build e unit tests verdes.
Dependencias: RT-001.
Risco: medio.
Evidencia esperada: comandos verdes e package canonico.

## RT-003 Ambiente local

Estado: REVIEW

Objetivo: garantir setup local reproduzivel.

Tarefas:

- RT-003.1 Criar/atualizar `.env.example` sem segredos. Estado: DONE.
- RT-003.2 Documentar uso de `npm.cmd`/`npx.cmd` no Windows. Estado: DONE.
- RT-003.3 Confirmar fluxo Docker PostgreSQL em `localhost:5433`. Estado: PLANNED.
- RT-003.4 Congelar Node em `.nvmrc`. Estado: DONE.

Criterios de aceite: novo dev consegue subir app com Postgres local e Prisma.
Dependencias: RT-002.
Risco: medio.
Evidencia esperada: healthcheck e dev server ok.

## RT-004 Autenticacao

Estado: PLANNED

Objetivo: validar auth usuario/admin.

Tarefas:

- RT-004.1 Validar login/registro com Better Auth. Estado: PLANNED.
- RT-004.2 Validar protecao de `/reservas` e `/admin`. Estado: PLANNED.
- RT-004.3 Revisar rotas debug para ambiente nao desenvolvimento. Estado: PLANNED.

Criterios de aceite: usuarios anonimos nao acessam areas privadas; admin comum nao executa actions restritas.
Dependencias: RT-003.
Risco: alto.
Evidencia esperada: E2E auth verde.

## RT-005 Base de dados

Estado: PLANNED

Objetivo: estabilizar Prisma/PostgreSQL.

Tarefas:

- RT-005.1 Validar migrations em banco limpo. Estado: PLANNED.
- RT-005.2 Criar seed controlado para dev/E2E. Estado: PLANNED.
- RT-005.3 Validar indices e integridade para booking/schedule/payment. Estado: PLANNED.

Criterios de aceite: `prisma migrate deploy` e seed rodam em ambiente limpo.
Dependencias: RT-003.
Risco: alto.
Evidencia esperada: banco local recriado e healthcheck ok.

## RT-006 Fluxos principais do app

Estado: IN_PROGRESS

Objetivo: estabilizar o fluxo publico ja deployado.

Tarefas:

- RT-006.1 Home/listagem/detalhe de tour em runtime publicado. Estado: PLANNED.
- RT-006.2 Reserva autenticada com agenda/capacidade em runtime publicado. Estado: PLANNED.
- RT-006.3 Minhas reservas com status e polling em runtime publicado. Estado: PLANNED.
- RT-006.4 Rodar smoke pos-deploy nos fluxos publicos prioritarios. Estado: PLANNED.
- RT-006.5 Registrar gaps reais encontrados no runtime publicado. Estado: PLANNED.

Criterios de aceite: MVP publico permanece acessivel e sem regressao critica nos fluxos publicos.
Dependencias: RT-004, RT-005.
Risco: alto.
Evidencia esperada: smoke pos-deploy e registro objetivo de ocorrencias.

## RT-007 Painel/admin

Estado: PLANNED

Objetivo: reconstruir o Admin MVP de forma controlada e segura.

Tarefas:

- RT-007.1 Reativar protecao de rotas e auth skeleton. Estado: PLANNED.
- RT-007.2 Dashboard simples com stats basicos. Estado: PLANNED.
- RT-007.3 Listagem e visualizacao de bookings. Estado: PLANNED.
- RT-007.4 Listagem e triagem de contatos. Estado: PLANNED.

Criterios de aceite: acesso restrito a role ADMIN; codigo reconstruido com auditoria; sem regressao de seguranca.
Dependencias: RT-013A.
Risco: alto.
Evidencia esperada: painel admin funcional e seguro.

## RT-008 Integracoes

Estado: BLOCKED

Objetivo: manter integracoes externas congeladas fora do escopo atual.

Tarefas:

- RT-008.1 Mercado Pago sandbox/producao: token, Pix e webhook publico. Estado: BLOCKED.
- RT-008.2 Resend: dominio/remetente e email de confirmacao. Estado: PLANNED.
- RT-008.3 MyMemory/traducao: validar limite/fallback. Estado: PLANNED.
- RT-008.4 WhatsApp: confirmar numero e mensagem comercial. Estado: PLANNED.

Criterios de aceite: nenhuma retomada de Mercado Pago sem justificativa operacional especifica.
Dependencias: decisao de escopo e credenciais externas.
Risco: alto.
Evidencia esperada: nao aplicavel nesta fase para Mercado Pago.

## RT-009 Testes

Estado: DONE

Objetivo: recuperar suite automatizada.

Tarefas:

- RT-009.1 Restaurar `vitest` e `@playwright/test` no package ativo. Estado: DONE.
- RT-009.2 Rodar unit tests. Estado: DONE.
- RT-009.3 Rodar E2E publico. Estado: DONE.
- RT-009.4 Rodar E2E autenticado. Estado: DONE.
- RT-009.5 Adicionar scripts `test` e `test:e2e`. Estado: DONE.

Criterios de aceite: lint, typecheck, build, unit e E2E verdes.
Dependencias: RT-002.
Risco: medio.
Evidencia esperada: `npm.cmd run test:e2e` 5/5 verde.

## RT-010 Deploy/staging

Estado: DONE

Objetivo: concluir deploy tecnico e publicacao inicial.

Tarefas:

- RT-010.1 Definir provider de deploy. Estado: DONE.
- RT-010.2 Definir banco staging. Estado: DONE.
- RT-010.3 Configurar env vars staging/deploy inicial. Estado: DONE.
- RT-010.4 Resolver build offline/fonts. Estado: DONE.
- RT-010.5 Criar checklist operacional de staging. Estado: DONE.
- RT-010.6 Criar preflight de staging. Estado: DONE.
- RT-010.7 Criar healthcheck profundo com DB. Estado: DONE.
- RT-010.8 Criar/importar projeto Rick Travel na Vercel. Estado: DONE.
- RT-010.9 Publicar projeto na Vercel. Estado: DONE.
- RT-010.10 Validar runtime inicial ate o ponto atual. Estado: DONE.
- RT-010.11 Permitir `BETTER_AUTH_URL` em `trustedOrigins` para ambiente publicado. Estado: DONE.

Criterios de aceite: deploy tecnico concluido, app publicada e runtime inicial validado ate o ponto atual.
Dependencias: RT-002, RT-003.
Risco: medio.
Evidencia esperada: `vercel inspect` do alias publico, healthchecks `200` e validacao objetiva da URL publicada.

## RT-011 Pos-deploy/estabilizacao

Estado: IN_PROGRESS

Objetivo: estabilizar o MVP publico apos a publicacao.

Tarefas:

- RT-011.1 Executar smoke pos-deploy focado no fluxo publico. Estado: DONE.
- RT-011.2 Revisar logs, healthchecks e erros do ambiente publicado. Estado: DONE.
- RT-011.3 Registrar incidentes e regressoes reais observadas apos deploy. Estado: DONE.
- RT-011.4 Alinhar dominio canonico publico com a URL operacional real. Estado: DONE.
- RT-011.5 Diagnosticar catalogo publico vazio. Estado: DONE.
- RT-011.6 Corrigir exposicao publica do catalogo se houver incidente funcional. Estado: BLOCKED.
- RT-011.7 Registrar vazio operacional como estado esperado. Estado: DONE.
- RT-011.8 Formalizar checklist minima de validacao pos-publicacao e rollback. Estado: DONE.

Criterios de aceite: fase atual com leitura objetiva do runtime publicado e sem reabertura indevida de escopo congelado.
Dependencias: RT-010.
Risco: alto.
Evidencia esperada: smoke em `rick-travel.vercel.app`, healthchecks `200`, amostra de logs Vercel e ocorrencias reais documentadas.

Notas operacionais:

- RT-011.4 validado em producao com `GET /robots.txt = 200`, `GET /sitemap.xml = 200` e artefatos publicos apontando para `https://rick-travel.vercel.app`.
- RT-011.5 concluiu `EXPECTED_EMPTY_STATE`.
- RT-011.6 permanece bloqueado porque a dependencia `FUNCTIONAL_INCIDENT` nao ocorreu.
- RT-011.7 documenta que o vazio atual decorre de ausencia de conteudo publicavel: banco validado com `0` trips e `0` trips publicadas.
- RT-011.8 formalizou o runbook minimo em `docs/ops/release-rollback-runbook.md`, com validacao local, smoke pos-deploy, rollback e regra de `EXPECTED_EMPTY_STATE`.
- Slice atual ja foi publicado em `main`.
- Sincronizacao Git concluida com `git pull --rebase origin main` sem conflito e `git push origin main` com sucesso.

## RT-012 Observabilidade

Estado: PLANNED

Objetivo: ter visibilidade minima.

Tarefas:

- RT-012.1 Healthcheck com banco. Estado: PLANNED.
- RT-012.2 Logs estruturados para webhook/pagamento. Estado: PLANNED.
- RT-012.3 Monitoramento de erro. Estado: BLOCKED.

Criterios de aceite: falhas criticas aparecem em logs/alertas.
Dependencias: ambiente publicado.
Risco: medio.
Evidencia esperada: painel/logs acessiveis.

## RT-012A Remove unsafe hardcoded admin bootstrap

Estado: DONE

Objetivo: remover ou neutralizar risco de credencial hardcoded em bootstrap de ADMIN.

Tarefas:

- RT-012A.1 Inspecionar `scripts/create-admin.ts`. Estado: DONE.
- RT-012A.2 Procurar credenciais hardcoded relacionadas a admin/setup. Estado: DONE.
- RT-012A.3 Remover script inseguro nao referenciado pelo `package.json`. Estado: DONE.
- RT-012A.4 Remover fallback hardcoded de credenciais ADMIN E2E. Estado: DONE.
- RT-012A.5 Registrar regra operacional para bootstrap futuro de ADMIN. Estado: DONE.
- RT-012A.6 Publicar commit de contencao no remoto. Estado: DONE.

Criterios de aceite: nenhuma credencial real de bootstrap admin versionada; admin continua congelado; checks seguros passam.
Dependencias: auditoria tecnica do admin.
Risco: alto.
Evidencia esperada: commit `128e095 security: remove hardcoded admin bootstrap credentials` publicado em `origin/main`; `lint` PASS com warnings existentes; `typecheck` PASS; `test` PASS; `build` PASS; `git diff --check` PASS com warnings LF/CRLF.

Notas operacionais:

- A credencial removida deve ser considerada potencialmente exposta.
- Recomenda-se rotacao manual da senha em qualquer ambiente onde ela tenha sido usada.
- A senha removida nao deve ser repetida em documentacao.

## RT-012B Align admin E2E with frozen admin scope

Estado: DONE

Objetivo: resolver o desalinhamento entre o escopo atual do MVP e `e2e/admin.spec.ts`, que espera `/pt/admin` com dashboard ativo.

Tarefas:

- RT-012B.1 Auditar `e2e/admin.spec.ts`. Estado: DONE.
- RT-012B.2 Confirmar admin fora de escopo/congelado no MVP. Estado: DONE.
- RT-012B.3 Neutralizar, remover ou marcar como skipped o teste admin de forma explicita e documentada. Estado: DONE.
- RT-012B.4 Atualizar backlog, status e handoff com a decisao. Estado: DONE.

Criterios de aceite: teste admin nao falha por esperar funcionalidade fora do escopo; documentacao explica que admin esta congelado no MVP; lint, typecheck, test e build passam; git status final limpo; commit separado.
Dependencias: RT-012A.
Risco: medio.
Evidencia esperada: `e2e/admin.spec.ts` marcado como skipped explicitamente porque admin esta congelado fora do MVP publico; `npx.cmd playwright test e2e/admin.spec.ts --list` lista 1 teste coletavel; `npm.cmd run lint` PASS com warnings existentes; `npm.cmd run typecheck` PASS; `npm.cmd run test` PASS fora do sandbox; `npm.cmd run build` PASS fora do sandbox; commit separado da RT-012B.

## RT-013 Seguranca

Estado: REVIEW

Objetivo: reduzir risco pos-publicacao.

Tarefas:

- RT-013.1 Rotacionar segredos locais se necessario. Estado: PLANNED.
- RT-013.2 Criar `.env.example`. Estado: DONE.
- RT-013.3 Revisar webhook secret Mercado Pago. Estado: BLOCKED.
- RT-013.4 Revisar dados sensiveis em logs. Estado: PLANNED.
- RT-013.5 Classificar audit moderado remanescente em Prisma dev tooling. Estado: DONE.
- RT-013.6 Resolver audit moderado remanescente em janela controlada. Estado: PLANNED.
- RT-013.7 Documentar contrato de secrets por ambiente. Estado: DONE.

Criterios de aceite: nenhum segredo versionado; logs revisados; escopo congelado preservado.
Dependencias: RT-003.
Risco: alto.
Evidencia esperada: checklist seguranca e plano de janela controlada.

## RT-014 UX/UI polish

Estado: PLANNED

Objetivo: melhorar conversao sem mexer no core.

Tarefas:

- RT-014.1 Revisar responsividade dos fluxos publicos. Estado: PLANNED.
- RT-014.2 Revisar acessibilidade basica. Estado: PLANNED.
- RT-014.3 Validar assets reais e performance. Estado: PLANNED.

Criterios de aceite: smoke visual desktop/mobile sem overlap critico.
Dependencias: core estavel.
Risco: medio.
Evidencia esperada: screenshots e checklist UX.

## RT-015 Conteudo/comercial

Estado: PLANNED

Objetivo: consolidar proposta comercial e canais sem ampliar escopo tecnico atual.

Tarefas:

- RT-015.1 Definir persona primaria. Estado: BLOCKED.
- RT-015.2 Definir MVP comercial e metricas. Estado: BLOCKED.
- RT-015.3 Confirmar monetizacao e operacao de suporte. Estado: BLOCKED.

Criterios de aceite: jornada e metricas aprovadas pelo owner.
Dependencias: input de negocio.
Risco: medio.
Evidencia esperada: documento de produto validado.

## RT-013A Admin MVP Scope and Guardrails

Estado: DONE

Objetivo: definir escopo, guardrails e plano tecnico do Admin MVP antes de qualquer implementacao.

Tarefas:

- RT-013A.1 Registrar decisao formal de reconstrucao do Admin MVP. Estado: DONE.
- RT-013A.2 Definir escopo permitido e proibido do Admin MVP. Estado: DONE.
- RT-013A.3 Definir regras de seguranca para auth/RBAC/bootstrap. Estado: DONE.
- RT-013A.4 Atualizar documentacao operacional (backlog, status, handoff). Estado: DONE.

Criterios de aceite: documentacao reflete a decisao; guardrails claros; sem alteracao de codigo de aplicacao.
Dependencias: decisao do owner no Admin Discussion Gate.
Risco: baixo.
Evidencia esperada: `docs/ops/backlog.md`, `docs/ops/status.md` e `docs/ops/session-handoff.md` atualizados.

## RT-013B Admin MVP Route Protection Skeleton

Estado: DONE

Objetivo: implementar o esqueleto de protecao de rotas para o novo Admin MVP.

Tarefas:

- RT-013B.1 Criar esqueleto de rota `/[locale]/admin`. Estado: DONE.
- RT-013B.2 Garantir protecao em layout/page com `requireAdminSession()`. Estado: DONE.
- RT-013B.3 Validar que usuarios sem role ADMIN sao bloqueados. Estado: DONE.

Criterios de aceite: rota `/admin` existe mas e inacessivel para nao-admins; sem dashboard ou logica complexa ainda.
Dependencias: RT-013A.
Risco: medio.
Evidencia esperada: smoke test de acesso negado para usuario comum.

## RT-013C Admin Bookings Read-Only

Estado: DONE

Objetivo: implementar listagem e visualizacao somente leitura de reservas no Admin MVP.

Tarefas:

- RT-013C.1 Criar service `listAllBookings` em `booking.service.ts`. Estado: DONE.
- RT-013C.2 Criar server action `getBookingsAction` em `app/actions/admin.ts` protegida. Estado: DONE.
- RT-013C.3 Criar pagina `/[locale]/admin/bookings` com listagem em tabela. Estado: DONE.
- RT-013C.4 Tratar empty state e erros basicos. Estado: DONE.

Criterios de aceite: admins conseguem listar todas as reservas; dados do cliente e viagem visiveis; sem mutacao permitida.
Dependencias: RT-013B.
Risco: baixo.
Evidencia esperada: pagina `/admin/bookings` funcional para admins.

## RT-013D Admin Contacts Read-Only

Estado: DONE

Objetivo: implementar listagem e visualizacao somente leitura de contatos/mensagens no Admin MVP.

Tarefas:

- RT-013D.1 Criar service `listAllContacts` em `contact.service.ts`. Estado: DONE.
- RT-013D.2 Criar server action `getContactsAction` em `app/actions/admin.ts` protegida. Estado: DONE.
- RT-013D.3 Criar pagina `/[locale]/admin/contacts` com listagem em tabela. Estado: DONE.
- RT-013D.4 Tratar empty state e erros basicos. Estado: DONE.

Criterios de aceite: admins conseguem listar todas as mensagens de contato; dados do remetente e mensagem visiveis; sem mutacao permitida.
Dependencias: RT-013B.
Risco: baixo.
Evidencia esperada: pagina `/admin/contacts` funcional para admins.

## RT-013E Admin Contact Mark as Read

Estado: DONE

Objetivo: adicionar acao para marcar mensagem de contato como lida no Admin MVP.

Tarefas:

- RT-013E.1 Adicionar `markContactAsRead` em `contact.service.ts`. Estado: DONE.
- RT-013E.2 Adicionar `markContactAsReadAction` em `app/actions/admin.ts`. Estado: DONE.
- RT-013E.3 Adicionar botao de acao na pagina de contatos. Estado: DONE.

Criterios de aceite: admins podem marcar mensagens como lidas; status visual atualiza; protecao de rota mantida.
Dependencias: RT-013D.
Risco: baixo.
Evidencia esperada: botao funcional na listagem de contatos.

## RT-013F Admin Navigation and Dashboard Minimal Polish

Estado: DONE

Objetivo: melhorar a navegacao e a pagina inicial do Admin MVP.

Tarefas:

- RT-013F.1 Adicionar menu de navegacao no `AdminLayout`. Estado: DONE.
- RT-013F.2 Implementar hub de links rapidos na `AdminPage`. Estado: DONE.
- RT-013F.3 Atualizar copy de status do MVP. Estado: DONE.

Criterios de aceite: navegacao clara entre Dashboard, Reservas e Contatos; dashboard util com cards clicaveis.
Dependencias: RT-013E.
Risco: baixo.
Evidencia esperada: menu funcional e dashboard populado.

## RT-013G Admin Booking Detail Read-Only

Estado: DONE

Objetivo: criar pagina protegida de detalhe de reserva no admin, somente leitura.

Tarefas:

- RT-013G.1 Adicionar `getBookingById` em `lib/services/booking.service.ts`. Estado: DONE.
- RT-013G.2 Adicionar `getBookingByIdAction` em `app/actions/admin.ts` protegida por `requireAdminSession`. Estado: DONE.
- RT-013G.3 Criar pagina `/[locale]/admin/bookings/[id]` com dados completos da reserva. Estado: DONE.
- RT-013G.4 Adicionar link "Ver detalhes" na listagem de bookings. Estado: DONE.

Criterios de aceite: pagina de detalhe existe; rota protegida por admin; listagem aponta para detalhe; nenhuma mutation criada.
Dependencias: RT-013F.
Risco: baixo.
Evidencia esperada: rota `/[locale]/admin/bookings/[id]` no build; commit `09ffcb0` em `origin/main`.

## RT-014A Admin Booking Cancellation Rules

Estado: DONE

Objetivo: definir a regra minima de cancelamento de reservas pelo admin antes de implementar qualquer mutation.

Tarefas:

- RT-014A.1 Decidir status cancelaveis pelo admin. Estado: DONE.
- RT-014A.2 Decidir comportamento de `paymentStatus` no cancelamento admin. Estado: DONE.
- RT-014A.3 Decidir sobre envio de e-mail no cancelamento admin. Estado: DONE.
- RT-014A.4 Decidir sobre motivo de cancelamento (`cancelReason`). Estado: DONE.
- RT-014A.5 Decidir sobre analytics/log de cancelamento admin. Estado: DONE.
- RT-014A.6 Registrar autorizacao e separacao tecnica da funcao admin. Estado: DONE.
- RT-014A.7 Atualizar documentacao operacional. Estado: DONE.

Criterios de aceite: todas as dimensoes de regra decididas e registradas; nenhum arquivo de codigo alterado; documento serve de especificacao direta para RT-014B.
Dependencias: RT-013G.
Risco: baixo.
Evidencia esperada: este registro em `docs/ops/backlog.md`; commit documental em `origin/main`.

Notas operacionais - Regras decididas pelo Trigger:

Status cancelaveis pelo admin:
- PENDING: permitido.
- CONFIRMED: permitido.
- CANCELED: tratar como idempotente/no-op (reserva ja cancelada).
- Qualquer outro status (COMPLETED, EXPIRED, REFUNDED ou futuro): bloqueado ate existir regra explicita.

Janela de 24h:
- Admin nao esta sujeito a janela de 24h aplicada ao usuario.
- A funcao `cancelBookingForUser` permanece separada e intacta.
- A futura RT-014B deve criar funcao admin separada (`cancelBookingByAdmin`) sem contaminar a logica do usuario.

paymentStatus:
- A acao admin NAO deve alterar `paymentStatus`.
- Reserva PAID cancelada pelo admin: `booking.status` muda para CANCELED; `paymentStatus` permanece PAID.
- Reembolso nao e automatico.
- Reembolso via Mercado Pago fica fora do MVP e deve virar task futura especifica.

Motivo de cancelamento:
- Nao adicionar `cancelReason` agora.
- Schema Prisma nao deve ser alterado nesta serie de tasks.
- Motivo persistido pode ser avaliado em task futura com migration propria.

E-mail:
- Nao enviar e-mail automatico no MVP.
- Nao criar template BOOKING_CANCELED agora.
- Comunicacao ao cliente fica manual por enquanto.

Analytics/log:
- Nao adicionar `AnalyticsEvent` de cancelamento admin nesta task.
- Nao existe tipo `BOOKING_CANCELED` no schema atual; nao criar agora.

Autorizacao:
- Somente ADMIN pode cancelar via `requireAdminSession` (padrao ja existente).

Separacao tecnica para RT-014B:
- Criar funcao `cancelBookingByAdmin(bookingId)` em `booking.service.ts`.
- Criar server action `cancelBookingByAdminAction(id)` em `app/actions/admin.ts`.
- Adicionar botao de cancelar na pagina de detalhe `/admin/bookings/[id]` com confirmacao simples.
- Nao alterar `cancelBookingForUser`.
- Nao alterar schema Prisma.
- Nao criar migration.

## RT-014B Admin Booking Cancellation Action

Estado: DONE

Objetivo: implementar acao de cancelamento de reserva pelo admin usando as regras documentadas em RT-014A.

Tarefas:

- RT-014B.1 Criar `cancelBookingByAdmin` em `lib/services/booking.service.ts`. Estado: DONE.
- RT-014B.2 Criar `cancelBookingByAdminAction` em `app/actions/admin.ts` protegida por `requireAdminSession`. Estado: DONE.
- RT-014B.3 Criar `CancelBookingButton` client component em `app/[locale]/admin/bookings/[id]/cancel-booking-button.tsx`. Estado: DONE.
- RT-014B.4 Integrar botao na pagina de detalhe, exibindo somente para PENDING/CONFIRMED. Estado: DONE.

Criterios de aceite: cancelamento altera apenas `booking.status`; `paymentStatus` nao e alterado; `cancelBookingForUser` permanece intacto; botao exibido apenas para status permitidos; schema Prisma nao alterado.
Dependencias: RT-014A.
Risco: baixo.
Evidencia esperada: commit `08a3de2 feat: implement admin booking cancellation action (RT-014B)` em `origin/main`; Vercel Production Deployment `Ready`; admin production validado; bookings admin empty state validado.

Notas operacionais:

- GitHub `main` aponta para `08a3de2`.
- Vercel production esta `Ready` com `08a3de2`.
- Admin acessado com sucesso em `https://rick-travel.vercel.app/pt/admin`.
- Bookings admin carregou `https://rick-travel.vercel.app/pt/admin/bookings` com empty state: nenhuma reserva encontrada.
- Neon production: usuario `ricardo@gmail.com` promovido manualmente para `ADMIN` e `emailVerified = true`; alteracao feita no banco, nao no codigo.
- Proximo passo: criar booking de teste pelo fluxo publico em producao e validar listagem, detalhe e cancelamento admin apenas nessa reserva de teste.

## RT-015A Catalog Model Audit

Estado: DONE

Objetivo: auditar por que `/tours` nao exibe nada em producao, sem alterar codigo ou banco.

Tarefas:

- RT-015A.1 Confirmar filtro `isPublished: true` em `trip-list.tsx`. Estado: DONE.
- RT-015A.2 Confirmar que Neon production tem 0 trips publicadas. Estado: DONE.
- RT-015A.3 Confirmar que schema `Trip` nao tem campo `slug`. Estado: DONE.
- RT-015A.4 Registrar causa raiz do vazio: ausencia de registros, nao bug de codigo. Estado: DONE.

Criterios de aceite: causa do vazio identificada sem mudanca de codigo ou banco.
Dependencias: RT-014B.
Risco: baixo.
Evidencia esperada: registro documental da auditoria.

Notas operacionais:

- Neon production: 0 trips, 0 trips publicadas.
- Filtro `isPublished: true` em `trip-list.tsx` e correto; o problema e ausencia de dados.
- Schema `Trip` nao tem campo `slug`; id e o unico campo unico.

## RT-015B Minimal Production Tour Seed

Estado: DONE

Objetivo: criar seed idempotente para 1 Trip publicada + 1 TripSchedule OPEN em producao.

Tarefas:

- RT-015B.1 Criar `prisma/seed.ts` com Trip e TripSchedule usando IDs deterministicos. Estado: DONE.
- RT-015B.2 Adicionar `prisma.seed` em `package.json`. Estado: DONE.
- RT-015B.3 Commitar e publicar `prisma/seed.ts` em `origin/main`. Estado: DONE.
- RT-015B.4 Executar seed manualmente contra Neon production (pelo Trigger). Estado: DONE.

Criterios de aceite: seed idempotente; sem `deleteMany`; sem migration; sem alteracao de schema; `/tours` exibe 1 tour apos seed.
Dependencias: RT-015A.
Risco: baixo.
Evidencia esperada: commit `cf0f96f` em `origin/main`; seed executado manualmente; tour visivel em `/pt/tours`.

Notas operacionais:

- IDs deterministicos: `seed-001-cristo-dona-marta` (Trip), `seed-001-schedule-001` (TripSchedule).
- Trip: Cristo Redentor + Mirante Dona Marta, R$ 245,00, physicalLevel MODERATE, i18n pt/en/es/sv.
- Schedule: startAt = 90 dias a partir da execucao (dinamico), capacity = 10, status = OPEN.
- Seed executado manualmente pelo Trigger contra Neon production apos push de `cf0f96f`.
- Tour visivel em `/pt/tours` apos seed.

## RT-015C End-to-End Booking and Admin Validation

Estado: DONE

Objetivo: validar o fluxo completo de reserva, visualizacao admin e cancelamento admin em producao com o tour semeado.

Tarefas:

- RT-015C.1 Verificar `/pt/tours` exibe o tour semeado. Estado: DONE.
- RT-015C.2 Diagnosticar e corrigir click interception do mobile-menu (RT-015C-FIX). Estado: DONE.
- RT-015C.3 Verificar tour detail abre corretamente. Estado: DONE.
- RT-015C.4 Verificar schedule selector funcional. Estado: DONE.
- RT-015C.5 Criar reserva de teste pelo fluxo publico autenticado. Estado: DONE.
- RT-015C.6 Verificar reserva aparece em `/pt/admin/bookings`. Estado: DONE.
- RT-015C.7 Verificar detalhe da reserva no admin. Estado: DONE.
- RT-015C.8 Cancelar reserva de teste e confirmar status = CANCELED e ausencia de tentativas de pagamento. Estado: DONE.

Criterios de aceite: fluxo completo publico -> admin -> cancelamento validado em producao sem regressao.
Dependencias: RT-015B, RT-015C-FIX.
Risco: medio.
Evidencia esperada: reserva de teste com Ricardo / ricardo@gmail.com; R$ 245,00; 1 hospede; data 29/07/2026; status CANCELED apos cancelamento admin; nenhuma tentativa de pagamento registrada.

Notas operacionais:

- Bloqueio inicial: click interception por bottom sheet do mobile-menu invisivel com `opacity: 0` mas sem `pointer-events: none`.
- RT-015C-FIX: commit `fa83e02 fix: prevent invisible mobile menu sheet from intercepting page clicks (RT-015C)` em `origin/main`.
- Fix: (1) `pointer-events-none` no className inicial do sheet; (2) `sheet.style.pointerEvents = "auto"` no branch open; (3) `sheet.style.pointerEvents = "none"` no branch close.
- Smoke final confirmado pelo Trigger em producao:
  - `/pt/tours`: tour Cristo Redentor + Mirante Dona Marta visivel.
  - Tour detail: abre corretamente apos fix.
  - Schedule selector: funcional apos fix.
  - Reserva criada: Ricardo / ricardo@gmail.com, R$ 245,00, 1 hospede, 29/07/2026.
  - `/pt/admin/bookings`: reserva aparece na listagem com status CANCELED apos cancelamento.
  - Detalhe admin apos cancelamento: Hospedes: 1; Total: R$ 245,00; Data: 29/07/2026; "Nenhuma tentativa de pagamento registrada."
  - Payment attempts remained absent; no payment gateway/refund/payment mutation was triggered in the MVP flow.
- Lint, typecheck e build passaram antes do commit da fix.

## RT-016A Booking Confirmation and User Reservation Flow Polish

Estado: DONE

Objetivo: melhorar o fluxo do usuario apos criar uma reserva, deixando explicito que a reserva nasce como pre-reserva pendente com confirmacao manual, sem gateway de pagamento.

Tarefas:

- RT-016A.1 Criar rota `/[locale]/reservas/[bookingId]`. Estado: DONE.
- RT-016A.2 Criar componente de confirmacao de reserva. Estado: DONE.
- RT-016A.3 Adicionar `getBookingForUser(bookingId, userId)` com validacao de ownership. Estado: DONE.
- RT-016A.4 Redirecionar o usuario apos criacao para `/reservas/{bookingId}` somente quando a API retorna `booking.id`. Estado: DONE.
- RT-016A.5 Melhorar `/reservas` com status/pagamento legiveis e link "Ver detalhes". Estado: DONE.
- RT-016A.6 Adicionar traducoes minimas pt/en/es/sv. Estado: DONE.
- RT-016A.7 Atualizar documentacao operacional. Estado: DONE.

Criterios de aceite: user-side de reserva fica compreensivel; usuario so ve a propria reserva; nenhum gateway foi adicionado; schema/migration/env/admin cancellation permanecem intactos.
Dependencias: RT-015C.
Risco: baixo.
Evidencia esperada: `/pt/reservas/[bookingId]` no build; `getBookingForUser` filtra por `id` e `userId`; listagem nao mostra enum cru de pagamento.

Notas operacionais:

- `getBookingForUser` usa `findFirst` com `id` e `userId`; reserva inexistente ou de outro usuario cai em `notFound()` na pagina.
- `components/trips/tour-actions.tsx` preserva o tratamento de erro atual e so redireciona se `data.id` for string nao vazia.
- `components/my-bookings.tsx` removeu CTAs/fluxo visual de checkout e mostra pagamento como etapa manual.
- Nenhuma alteracao feita em `schema.prisma`, migrations, seed, Neon/env/provider/auth ou regras admin.
- Validacoes locais: `npm.cmd run lint` PASS com warning pre-existente em `components/mobile-menu.tsx`; `npm.cmd run typecheck` PASS; `npm.cmd run build` PASS fora do sandbox; `git diff --check` PASS com avisos LF/CRLF.
- Commit publicado: `799698c feat: polish booking confirmation flow`.
- Production smoke validado pelo Trigger:
  - `/pt/tours` abre corretamente;
  - detalhe do tour abre corretamente;
  - criacao de booking funciona;
  - usuario e redirecionado para `/pt/reservas/{bookingId}`;
  - pagina de confirmacao funciona;
  - mensagem de pre-reserva/confirmacao manual esta clara;
  - `/pt/reservas` lista a reserva;
  - "Ver detalhes" abre o detalhe da reserva;
  - payment status nao aparece mais como enum cru `UNPAID`;
  - listagem admin de bookings permanece funcional.

## RT-016B Remove Confusing Package Cards and Promote Real Catalog

Estado: DONE

Objetivo: remover da Home os cards comerciais antigos que pareciam tours reais, mas apontavam para contato, mantendo `Passeios disponiveis` como caminho principal para catalogo real, detalhe e reserva.

Tarefas:

- RT-016B.1 Remover renderizacao da secao legada de package cards na Home e excluir o componente legado nao referenciado. Estado: DONE.
- RT-016B.2 Manter `ReservationsSection` e `Passeios disponiveis` como catalogo real principal. Estado: DONE.
- RT-016B.3 Preparar seed do tour existente para usar imagem real local. Estado: DONE.
- RT-016B.4 Atualizar documentacao operacional. Estado: DONE.

Criterios de aceite: Home nao mostra mais os cards comerciais antigos apontando para contato; `/tours` segue como catalogo oficial; seed fica preparado com imagem real sem execucao; nenhuma mudanca de schema/migration/gateway/admin/auth/env.
Dependencias: RT-016A.
Risco: baixo.
Evidencia esperada: commit `5e120a4`.

## RT-016C Controlled Production Seed for Existing Tour Image

Estado: DONE

Objetivo: executar o seed controlado em producao apenas para aplicar a imagem real ao tour semeado anteriormente e renovar a agenda.

Tarefas:

- RT-016C.1 Validar existencia da imagem real em `public/images/trips/`. Estado: DONE.
- RT-016C.2 Auditar `prisma/seed.ts` para garantir idempotencia e ausencia de operacoes destrutivas. Estado: DONE.
- RT-016C.3 Executar seed manualmente contra Neon production (Trigger). Estado: DONE.
- RT-016C.4 Validar imagem real renderizada na Home e `/tours` em producao. Estado: DONE.
- RT-016C.5 Atualizar documentacao operacional. Estado: DONE.

Criterios de aceite: imagem real aplicada; agenda renovada; nenhum novo tour adicionado; sem code change ou migration.
Dependencias: RT-016B.
Risco: baixo.
Evidencia esperada: smoke PASS em producao; tour exibe imagem `/images/trips/imagem-morro-pao-de-acucar.jpg`.

## RT-017A Admin Tour Manager Rules and Scope

Estado: DONE

Objetivo: registrar as regras funcionais e tecnicas do Admin Tour Manager MVP antes de implementar codigo.

Tarefas:

- RT-017A.1 Criar documento de regras para Admin Tour Manager MVP. Estado: DONE.
- RT-017A.2 Definir diretrizes de integridade, imagens e i18n. Estado: DONE.
- RT-017A.3 Fatiar o backlog de implementacao em tarefas granulares. Estado: DONE.
- RT-017A.4 Atualizar documentacao operacional. Estado: DONE.

Criterios de aceite: documento `docs/ops/admin-tour-manager-rules.md` existe; regras aprovadas; tarefas subsequentes mapeadas.
Dependencias: RT-016C.
Risco: baixo.
Evidencia esperada: este registro e o arquivo de regras.

## RT-017B Admin Tour List

Estado: DONE

Objetivo: implementar listagem somente leitura de tours no admin.

Tarefas:

- RT-017B.1 Adicionar `listAllTrips` em `trip.service.ts`. Estado: DONE.
- RT-017B.2 Adicionar `listAllTripsAction` em `app/actions/admin.ts`. Estado: PLANNED (Substituida por chamada direta ao service no Server Component).
- RT-017B.3 Criar pagina `/[locale]/admin/tours` com tabela de listagem. Estado: DONE.

Criterios de aceite: admins conseguem ver todos os tours; link de navegacao no admin layout funciona.
Dependencias: RT-017A.

## RT-017C Admin Tour Create

Estado: DONE

Objetivo: implementar criacao de novos tours via admin como rascunho.

Tarefas:

- RT-017C.1 Criar Server Action de criacao protegida forcando `isPublished: false`. Estado: DONE.
- RT-017C.2 Criar formulario em `/[locale]/admin/tours/new` com validacao de campos Json. Estado: DONE.
- RT-017C.3 Adicionar botao "Novo Tour" na listagem. Estado: DONE.

Criterios de aceite: novo tour criado com `isPublished: false`; campos i18n persistidos corretamente; redirect funciona.
Dependencias: RT-017B.

## RT-017D Admin Tour Edit & Visibility

Estado: PLANNED

Objetivo: implementar edicao e controle de publicacao de tours.

Tarefas:

- RT-017D.1 Criar Server Action de edicao protegida. Estado: PLANNED.
- RT-017D.2 Criar pagina de edicao `/[locale]/admin/tours/[id]`. Estado: PLANNED.
- RT-017D.3 Implementar toggle de `isPublished`. Estado: PLANNED.

Criterios de aceite: edicao nao afeta bookings historicos; tour aparece/some do publico conforme status.
Dependencias: RT-017C.

## RT-017E Admin Tour Basic Schedule Management

Estado: PLANNED

Objetivo: permitir controle basico de agendas vinculadas a um tour no admin.

Tarefas:

- RT-017E.1 Listar schedules dentro do detalhe do tour. Estado: PLANNED.
- RT-017E.2 Implementar acao para abrir/fechar (`status`) de um schedule. Estado: PLANNED.

Criterios de aceite: admin consegue bloquear datas sem excluir o registro.
Dependencias: RT-017D.

## RT-018A Production Product Smoke Check

Estado: DONE

Objetivo: auditar o produto em producao como usuario real, validando descoberta de tour, reserva, confirmacao manual e protecoes admin.

Tarefas:

- RT-018A.1 Validar Git limpo e sincronizado antes do smoke. Estado: DONE.
- RT-018A.2 Confirmar commit Vercel em producao. Estado: DONE.
- RT-018A.3 Validar Home, catalogo, detalhe, login e registro. Estado: DONE.
- RT-018A.4 Criar reserva pelo fluxo publico normal ate confirmacao manual. Estado: DONE.
- RT-018A.5 Validar protecao admin sem sessao. Estado: DONE.
- RT-018A.6 Validar comportamento admin com usuario comum autenticado. Estado: DONE.
- RT-018A.7 Registrar bugs, bloqueios e proximas candidatas sem alterar codigo. Estado: DONE.

Criterios de aceite: resultado objetivo em PASS/FAIL/BLOCKED/WARN; nenhuma alteracao de codigo, schema, seed, migration, deploy ou banco manual; nenhuma nova READY aberta automaticamente.
Dependencias: RT-017C.
Risco: medio.
Evidencia: commit de producao `6b59c92`; booking publico `cmoli78ld000204js1agra4il`; public flow PASS; admin anonymous PASS; admin non-admin FAIL com `ERROR 2933230167`; admin real login BLOCKED; checkout externo NOT TESTED/nao iniciado; content image alignment WARN; React hydration `#418` WARN.

Notas operacionais:

- O booking de auditoria foi criado apenas pelo fluxo publico normal do produto.
- O segundo tour "Pao de Acucar ao Entardecer" permanece rascunho corretamente fora do catalogo publico.
- O catalogo publico tem apenas 1 tour publicado; isso e aceitavel para o smoke, mas e uma limitacao de produto.
- Proxima candidata recomendada, sem READY automatica: RT-018B - Fix Admin Non-Admin Authorization Handling.

## RT-018B Fix Admin Non-Admin Authorization Handling

Estado: DONE

Objetivo: corrigir o tratamento de autorizacao das rotas admin para usuario autenticado sem role ADMIN, substituindo erro 500 por bloqueio controlado.

Tarefas:

- RT-018B.1 Reproduzir localmente o acesso non-admin a `/[locale]/admin`. Estado: DONE.
- RT-018B.2 Ajustar tratamento de `FORBIDDEN`/non-admin no AdminLayout ou boundary apropriado. Estado: DONE.
- RT-018B.3 Validar `/pt/admin`, `/pt/admin/tours`, `/pt/admin/bookings` e `/pt/admin/contacts` para anonimo, USER e ADMIN. Estado: DONE via teste unitario do layout central.
- RT-018B.4 Registrar evidencias sem expor credenciais. Estado: DONE.

Criterios de aceite: anonimo redireciona para login; USER autenticado recebe bloqueio controlado ou redirect previsto, nunca 500; ADMIN continua acessando painel; sem schema, migration, seed ou deploy manual.
Dependencias: RT-018A.
Risco: alto.
Evidencia: `AdminLayout` agora trata `DomainError` `FORBIDDEN` com tela controlada "Acesso negado"; `UNAUTHENTICATED` segue redirecionando para login; ADMIN segue renderizando o painel; `tests/admin-layout.test.tsx` cobre os tres cenarios; lint PASS, typecheck PASS, tests PASS, build PASS, `git diff --check` PASS.

Notas operacionais:

- Causa provavel do 500: `requireAdminSession()` lancava `DomainError` com `code = FORBIDDEN`, mas o `AdminLayout` so tratava `UNAUTHENTICATED` e relancava `FORBIDDEN`, gerando erro 500 em Server Components no runtime publicado.
- A correcao ficou centralizada no `AdminLayout`; paginas e actions admin continuam usando a protecao existente.
- Nenhuma regra de booking, tour, contact, schema, seed, migration, banco manual ou deploy manual foi alterada.

## RT-018C Validate Production Admin Access

Estado: DONE

Objetivo: validar acesso ADMIN real em producao e confirmar que o painel administrativo renderiza para leitura/gestao basica.

Tarefas:

- RT-018C.1 Validar Git limpo e sincronizado. Estado: DONE.
- RT-018C.2 Confirmar Vercel production Ready no commit esperado. Estado: DONE.
- RT-018C.3 Verificar existencia de credencial ADMIN utilizavel sem expor segredo. Estado: DONE via RT-018D.
- RT-018C.4 Login ADMIN em producao. Estado: DONE via RT-018D.
- RT-018C.5 Validar `/pt/admin`, `/pt/admin/tours`, `/pt/admin/bookings` e `/pt/admin/contacts`. Estado: DONE via RT-018D.
- RT-018C.6 Verificar booking `cmoli78ld000204js1agra4il` no admin. Estado: DONE via RT-018D.

Criterios de aceite: ADMIN real consegue acessar painel e rotas principais; booking de smoke fica visivel em admin bookings ou detalhe equivalente; nenhuma acao destrutiva executada.
Dependencias: RT-018D.
Risco: medio.
Evidencia: login ADMIN PASS; rotas admin PASS; booking visivel PASS em producao.

## RT-018D Validate Existing Production Admin User

Estado: DONE

Objetivo: validar o usuario administrador existente em producao utilizando as credenciais fornecidas pelo Trigger.

Tarefas:

- RT-018D.1 Verificar estado Git. Estado: DONE.
- RT-018D.2 Confirmar producao acessivel. Estado: DONE.
- RT-018D.3 Validar login ADMIN sem expor credenciais. Estado: DONE.
- RT-018D.4 Testar rotas `/pt/admin`, `/pt/admin/tours`, `/pt/admin/bookings`, `/pt/admin/contacts`. Estado: DONE.
- RT-018D.5 Validar visibilidade do booking `cmoli78ld000204js1agra4il`. Estado: DONE.
- RT-018D.6 Registrar resultados e atualizar documentacao operacional. Estado: DONE.

Criterios de aceite: Todas as validacoes concluidas com sucesso (PASS); nenhuma exposicao de credenciais; nenhuma alteracao destrutiva ou no banco realizada.
Dependencias: RT-018B.
Risco: baixo.
Evidencia: Login Status 200; Rotas Status 200; Booking visivel: True.

## RT-019A Publicar Pao de Acucar com caminho controlado de dados
Estado: DONE
Objetivo: Fazer o tour Pao de Acucar aparecer no catalogo publico de forma controlada, segura e reproduzivel.
Criterios de aceite: seed atualizado de forma idempotente com logica de Semantic Match para evitar duplicacao; Pao de Acucar publicado com imagem correta e agenda futura; Cristo Redentor mantido com imagem atual (sem placeholder); lint/typecheck/build PASS; producao validada com 2 tours no catalogo.
Evidencia: Remote DONE + Production Seed/Smoke PASS; seed detectou tour existente `cmolfs9eu000004l2trz4q8bf` pelo titulo; Pao de Acucar publicado em producao; `/pt/tours` validado com 2 tours; sem duplicacao; seed executado uma unica vez e nao executado novamente apos documentacao; commit topo `8f4061b`.

## RT-018E Fix Logout Flow

Estado: DONE

Objetivo: corrigir o fluxo de logout que nao encerrava a sessao corretamente.

Tarefas:

- RT-018E.1 Auditar rota customizada `app/api/auth/sign-out/route.ts` e identificar conflito com Better Auth. Estado: DONE.
- RT-018E.2 Remover rota customizada incorreta. Estado: DONE.
- RT-018E.3 Corrigir redirect locale-aware em `auth-status.tsx`. Estado: DONE.
- RT-018E.4 Corrigir wiring de `useLocale` e redirect em `mobile-menu.tsx`. Estado: DONE.
- RT-018E.5 Validar localmente e publicar commit. Estado: DONE.

Criterios de aceite: logout invalida sessao no banco; cookie limpo; redirect para locale correto; `/pt/admin` apos logout redireciona para login; refresh nao restaura sessao.
Dependencias: RT-018D.
Risco: alto.
Evidencia: commit `837694b fix: correct logout flow`; lint/typecheck/test/build PASS; push para `origin/main`; Production Smoke PASS validado em producao.

Notas operacionais:

- Causa raiz: rota `app/api/auth/sign-out/route.ts` interceptava POST `/api/auth/sign-out` antes do handler `[...all]` do Better Auth, limpando apenas cookies sem invalidar a sessao no banco. Com a rota customizada removida, `authClient.signOut()` chama o handler Better Auth que invalida a sessao no banco via `nextCookies()`.
- Nenhum schema, seed, migration, deploy manual, banco manual, imagem, tour ou checkout foi alterado.

## RT-021A Revisao de UX, Navegacao e Busca Publica

Estado: DONE
Objetivo: corrigir pequenos problemas publicos de UX/navegacao sem redesign e sem tocar em areas sensiveis.
Escopo executado:
- Hero Search corrigida para nao passar URL com locale duplicado ao router locale-aware.
- Busca do catalogo corrigida de forma minima: `?search=` agora filtra titulo, descricao, cidade e localizacao.
- Filtro lateral da pagina Nossos Tours removido do MVP com 2 tours.
- CTA principal do card de tour agora leva ao detalhe/selecionar data, sem tentar criar booking sem `scheduleId`.
- Footer sem `href="#"` visivel; redes sociais sem destino real foram removidas e "Precos" removido.

Criterios de aceite: logo, contato, tours, cards e detalhe preservam locale; Hero Search nao gera locale duplicado; busca falsa removida/corrigida; Nossos Tours sem filtro inutil; card nao tenta reservar sem data; footer sem controles falsos; lint/typecheck/test/build/git diff --check PASS. Production UX Smoke PASS em `69379fe`: Hero Search sem `/pt/pt`, `?search=Pao` filtra Pao de Acucar e exclui Cristo, busca sem resultado mostra empty state generico aceitavel, detalhes dos 2 tours `200`, CTA de reserva anonima redireciona para login com redirect seguro sem criar booking, menu desktop/mobile preserva locale.
Restricoes mantidas: sem admin, auth/logout, seed, banco, migration, pagamento, schema, deploy manual ou regra de booking.

## RT-022A Admin Booking Actions

Estado: DONE remoto

Commit: `b0e4d4a feat: add admin booking confirm and cancel flow` - publicado em `origin/main` em 2026-05-01.

Nota de reconciliacao (RT-FINAL-00A): este registro declarava "Estado: REVIEW" e "implementacao local sem commit/push". O Git prova que o commit `b0e4d4a` foi publicado. Status corrigido para DONE remoto.

Objetivo: tornar o fluxo operacional basico de reservas no admin seguro para o ciclo PENDING -> CONFIRMED/CANCELED, sem tocar em checkout, pagamento, schema, seed, tour ou schedule.

Decisao: implementar acoes de reserva primeiro. Admin tour edit/publish, schedule management e hard delete ficam fora desta task.

Tarefas:

- RT-022A.1 Promover a task como unica ativa e confirmar repo limpo/sincronizado. Estado: DONE.
- RT-022A.2 Adicionar `confirmBookingByAdmin` no service central de reservas. Estado: DONE remoto.
- RT-022A.3 Adicionar Server Action admin protegida por `requireAdminSession()`. Estado: DONE remoto.
- RT-022A.4 Exibir no detalhe apenas acoes validas por status. Estado: DONE remoto.
- RT-022A.5 Alinhar copy/listagem/status do admin. Estado: DONE remoto.
- RT-022A.6 Adicionar/atualizar testes aplicaveis. Estado: DONE remoto.
- RT-022A.7 Rodar lint/typecheck/test/build/git diff --check e smoke admin possivel. Estado: DONE automatizado; smoke manual mutavel de confirmacao admin (PENDING -> CONFIRMED) em producao PENDENTE - sem evidencia registrada de smoke mutavel real em producao.

Criterios de aceite: ADMIN confirma apenas reserva PENDING; ADMIN cancela apenas PENDING/CONFIRMED; CANCELED nao mostra acoes; CONFIRMED nao mostra confirmar novamente; transicoes invalidas bloqueadas server-side; confirmar nao altera `paymentStatus`; cancelar nao aciona refund; sem schema, migration, seed, banco manual, auth, payment, checkout, tour, schedule ou deploy manual.

Evidencia: commit `b0e4d4a` publicado em `origin/main`; lint/typecheck/test/build/git diff --check PASS; smoke mutavel de confirmacao admin em producao pendente de validacao (candidata RT-FINAL-03A).

## RT-023A Create Rick Travel Portfolio README Showcase

Estado: DONE remoto

Commit: `67584b6 docs: create Rick Travel portfolio README showcase` - publicado em `origin/main` em 2026-05-06.

Nota de reconciliacao (RT-FINAL-00A): este registro declarava "Estado: REVIEW local" e "Restricoes: sem commit ate autorizacao explicita". O Git prova que o commit `67584b6` foi publicado. Status corrigido para DONE remoto.

Objetivo: criar/atualizar o `README.md` principal como vitrine profissional de portfolio do Rick Travel, seguindo o padrao Protocolo Rick.

Tarefas:

- RT-023A.1 Confirmar diretorio, repositorio, `.git`, status, branch e historico antes de editar. Estado: DONE.
- RT-023A.2 Confirmar que `main` esta sincronizada com a referencia local `origin/main`. Estado: DONE.
- RT-023A.3 Copiar imagem principal para `docs/assets/rick-travel-hero.png`. Estado: DONE remoto.
- RT-023A.4 Reescrever `README.md` em ingles com visao de produto, status, fluxos, demo, stack, arquitetura, Protocolo Rick, desenvolvimento local, comandos uteis, limitacoes e autor. Estado: DONE remoto.
- RT-023A.5 Atualizar documentacao operacional permitida. Estado: DONE remoto.
- RT-023A.6 Validar diff, escopo e checks documentais. Estado: DONE remoto.

Criterios de aceite: README renderiza com imagem relativa; sem caminho local Windows; sem segredos; sem claims exagerados; comandos documentados refletem `package.json`; somente arquivos autorizados alterados/adicionados; nenhum codigo, schema, migration, seed, env, deploy, package ou lockfile alterado.

Evidencia: commit `67584b6` publicado em `origin/main`; diff restrito a `README.md`, `docs/assets/rick-travel-hero.png` e docs operacionais; nenhum arquivo de aplicacao alterado.

## RT-FINAL-00 Audit Current Production State

Estado: DONE (auditoria pura, 2026-05-13)

Objetivo: auditar o estado real do Rick Travel em producao e no repositorio para preparar a entrega final.

Evidencia: relatorio de auditoria retornado em 2026-05-13; divergencia documental RT-022A/RT-023A identificada; estado de producao verificado (2 tours, healthcheck ok, rotas publicas 200, admin anonimo protegido); nenhum arquivo alterado durante a task.

## RT-FINAL-00A Align Operational Docs With Remote Reality

Estado: Local DONE - commit documental autorizado pelo Trigger.

Objetivo: corrigir documentacao operacional para refletir o estado real do Git apos auditoria RT-FINAL-00.

Tarefas:

- RT-FINAL-00A.1 Atualizar `docs/ops/status.md`. Estado: DONE local.
- RT-FINAL-00A.2 Atualizar `docs/ops/backlog.md`. Estado: DONE local.
- RT-FINAL-00A.3 Atualizar `docs/ops/session-handoff.md`. Estado: DONE local.
- RT-FINAL-00A.4 Atualizar `docs/ops/execution-log.md`. Estado: DONE local.

## RT-FINAL-03A Validate Admin Booking Actions in Production

Estado: Manual production validation DONE by Trigger; documentacao local pendente de commit autorizado.

Objetivo: validar em producao que o admin minimo consegue operar reservas controladas sem erro visivel.

Resultado observado pelo Trigger:
- Admin login PASS.
- Admin booking list PASS.
- Lista de reservas visivel PASS.
- Status CONFIRMED/PENDING/CANCELED visiveis PASS.
- Confirm/cancel admin flow validated manually by Trigger.
- Nenhum erro visivel reportado no navegador.

Evidencia: validacao manual em navegador executada pelo Trigger. Evidencia visual fornecida, mas screenshot nao deve ser commitado sem redigir dados pessoais/e-mails.

Restricoes mantidas: sem codigo, README, imagem, schema, migration, seed, deploy, env, banco manual pelo agente, commit, push ou nova READY automatica.

## RT-FINAL-04B Public Commercial Trust Baseline

Estado: Local REVIEW - aguardando revisao do Trigger; sem commit e sem push.

Objetivo: melhorar confianca publica, clareza comercial e contato direto sem criar tours, banco, pagamento ou deploy.

Tarefas:
- RT-FINAL-04B.1 Revisar footer e remover link publico confuso para `Reservas`. Estado: executada localmente; aguardando aprovacao do Trigger para commit.
- RT-FINAL-04B.2 Destacar WhatsApp oficial e formulario seguro como canais de atendimento. Estado: executada localmente; aguardando aprovacao do Trigger para commit.
- RT-FINAL-04B.3 Explicar pre-reserva com confirmacao manual e sem pagamento online. Estado: executada localmente; aguardando aprovacao do Trigger para commit.
- RT-FINAL-04B.4 Revisar copy de login/register para nao prometer pagamento online. Estado: executada localmente; aguardando aprovacao do Trigger para commit.
- RT-FINAL-04B.5 Registrar pendencias de e-mail publico direto e redes sociais sem inventar dados. Estado: executada localmente; aguardando aprovacao do Trigger para commit.

Restricoes mantidas: nenhum tour criado; sem banco, seed, migration, pagamento, Mercado Pago, Stripe, auth, admin flow, deploy, commit, push ou RT-FINAL-04C.

## RT-FINAL-04C2B Reconcile Final Catalog Schedule Updates

Estado: Remote DONE — commit `0d9e0c5 fix: reconcile final catalog schedule updates` publicado em `origin/main`; smoke de producao completo PASS pelo Trigger; P2 registrado; documentacao de closure Local DONE — push pendente.

Objetivo: corrigir os 6 blocos `update` de TripSchedule em `prisma/seed.ts` para incluir `capacity` e `pricePerPersonCents`.

Tarefas:
- RT-FINAL-04C2B.1 Corrigir bloco `update` dos 6 schedules em `prisma/seed.ts`. Estado: DONE — commit `0d9e0c5`.
- RT-FINAL-04C2B.2 Atualizar documentacao operacional com smoke completo e P2 registrado. Estado: Local DONE — push pendente.

Smoke de producao completo validado pelo Trigger (RT-FINAL-04C3, 2026-05-14):
- Seed executado em producao sem erro PASS.
- /pt/tours exibe exatamente 6 tours publicados PASS.
- seed-001-cristo-dona-marta ausente do catalogo publico e de /api/trips PASS.
- Todos os 6 detalhes de tour publicado retornam HTTP 200 PASS.
- Todos os 6 precos e imagens corretos PASS.
- Assets de imagem retornam HTTP 200 PASS.
- /pt/admin anonimo redireciona para login PASS.
- /pt/login retorna HTTP 200 PASS.
- /pt/register retorna HTTP 200 PASS.
- /pt/contato retorna HTTP 200 PASS.
- /pt/quem-somos retorna HTTP 200 PASS.
- Mobile catalog layout com 6 cards sem quebra visual (manual Trigger) PASS.
- Booking publico submetido com sucesso de tour publicado (manual Trigger) PASS.
- Booking submetido visivel no admin (manual Trigger) PASS.

Pendencia P2: `TourDetailsPage` usa `findUnique` sem filtro `isPublished` — URL direta de tour despublicado retorna HTTP 200 e exibe CTA. Tour nao aparece em nenhuma superficie navegavel publica. Registrado para RT-FINAL-HARDENING-01; nao corrigir dentro desta closure.

## RT-FINAL-04D Block Direct Access to Unpublished Public Tour Details

Estado: Local REVIEW — implementacao e validacao local concluidas; aguardando autorizacao do Trigger para commit.

Objetivo: impedir que tours despublicados sejam acessiveis via URL direta no detalhe publico.

Causa raiz: `TourDetailsPage` usava `findUnique({ where: { id } })` sem filtrar `isPublished: true`, permitindo HTTP 200 para tours despublicados.

Tarefas:
- RT-FINAL-04D.1 Substituir `findUnique` por `findFirst` com `isPublished: true` em `generateMetadata` de `app/[locale]/(public)/tours/[id]/page.tsx`. Estado: executada localmente; aguardando commit.
- RT-FINAL-04D.2 Substituir `findUnique` por `findFirst` com `isPublished: true` em `TourDetailsPage` de `app/[locale]/(public)/tours/[id]/page.tsx`. Estado: executada localmente; aguardando commit.
- RT-FINAL-04D.3 Atualizar documentacao operacional. Estado: executada localmente; aguardando commit.

Validacao local:
- lint PASS.
- typecheck PASS.
- test PASS (4 arquivos, 18 testes).
- build PASS (`/[locale]/tours/[id]` compilada como rota dinamica).

Validacao de rota (estatica/por codigo):
- Tours publicados: `findFirst` com `{ id, isPublished: true }` retorna o tour — HTTP 200 preservado.
- Tours despublicados: `findFirst` com `{ id, isPublished: true }` retorna `null` — `notFound()` chamado — comportamento Next.js 404.
- Catalogo publico `/pt/tours`: sem alteracao (query de listagem nao foi tocada).
- Validacao manual em producao: pendente de commit autorizado e deploy Vercel automatico.

Restricoes mantidas: seed nao executado; banco nao alterado; schema nao alterado; nenhuma migration; nenhum deploy; nenhum commit; nenhum push; nenhuma logica admin ou booking alterada.

## RT-FINAL-05A Clean Public Home and Trust UI Polish

Estado: Local REVIEW — implementacao e validacao local concluidas; aguardando autorizacao do Trigger para commit.

Objetivo: simplificar homepage para Hero + Passeios + 3 Depoimentos + Footer; melhorar visual cards e testimonials para direcao luxury concierge.

Tarefas:
- RT-FINAL-05A.1 Remover FAQsTwo da homepage. Estado: DONE local.
- RT-FINAL-05A.2 Remover MyBookings da homepage (rota /reservas preservada). Estado: DONE local.
- RT-FINAL-05A.3 Atualizar badge de secao de "Reservas e planejamento" para "Passeios disponíveis". Estado: DONE local.
- RT-FINAL-05A.4 Reduzir testimonials de 6 para 3 cards; polish visual (quote mark maior, opacidade de texto, hover gold border). Estado: DONE local.
- RT-FINAL-05A.5 Simplificar bloco de preco do TripCard (remover box-in-box; remover link duplicado "Ver detalhes"). Estado: DONE local.
- RT-FINAL-05A.6 Atualizar documentacao operacional. Estado: DONE local.

Arquivos alterados:
- `app/[locale]/(public)/page.tsx`
- `components/reservations-section.tsx`
- `components/reservation-headers.tsx`
- `components/testimonials.tsx`
- `components/trips/trip-card.tsx`

Validacao local:
- lint PASS.
- typecheck PASS.
- test PASS (4 arquivos, 18 testes).
- build PASS.

Restricoes mantidas: sem seed; sem banco; sem schema; sem migration; sem deploy; sem commit; sem push; sem logica admin, booking, auth ou pagamento alterada; sem nova dependencia; sem fake links; /reservas route preservada.

## RT-FINAL-05B Remove Unsupported Public Trust Claims

Estado: Local REVIEW — implementacao e validacao local concluidas; aguardando autorizacao do Trigger para commit.

Objetivo: remover claims publicos nao suportados pela operacao atual — "24/7", "100% roteiro privado", "time local" — por honestidade comercial e credibilidade.

Claims encontrados e removidos:
- hero-section.tsx: array `highlights` com 3 badges por locale (24/7, 100%, Rio/time-local) — grid inteiro removido.
- messages/pt.json: "Atendimento profissional 24/7" → "Atendimento profissional".
- messages/en.json: "Professional 24/7 service" → "Professional service".

Claims mantidos (fora do escopo):
- data/real-trips.json: "guia privado", "tour-privado-rio" — nome de produto real.
- messages/pt.json e es.json FAQ L73: "24 horas" — tempo de confirmacao de reserva (processo operacional, nao claim de atendimento).
- app/page.tsx: "Tours privados en Rio de Janeiro" — titulo SEO de produto.
- contato/page.tsx: "grupos privados" — descricao de tipo de tour.

Arquivos alterados:
- `components/hero-section.tsx`
- `messages/en.json`
- `messages/pt.json`

Validacao local:
- lint PASS.
- typecheck PASS.
- test PASS (4 arquivos, 18 testes).
- build PASS.

Restricoes mantidas: sem seed; sem banco; sem schema; sem migration; sem deploy; sem commit; sem push; sem logica admin, booking, auth ou pagamento alterada; sem nova dependencia; sem badge de redes sociais, Cadastur ou CNPJ adicionado.

## RT-FINAL-05C Polish About Page and Real Credibility Layout

Estado: Local REVIEW — implementacao e validacao local concluidas; aguardando autorizacao do Trigger para commit.

Objetivo: lapidar pagina Quem Somos; remover claim "10 anos de experiencia" sem evidencia; reduzir repeticao em story; adicionar bloco de identificacao e contato com dados reais; remover numeros fake de Cadastur; preparar secao de credibilidade oficial.

Discovery:
- Pagina: app/[locale]/(public)/quem-somos/page.tsx
- Componentes ativos: OurStory, MissionVisionValues, SecuritySection
- Componentes existentes mas nao usados na pagina: AboutHero, WhyChooseUs, CtaFinal
- Assets encontrados: public/cadastro/cadastur.png, public/images/seals/cadastur-official.png, public/images/about/guide-ricardo.jpg, public/images/about/founder-team.jpg

Tarefas:
- RT-FINAL-05C.1 Remover linha JSX Cadastur do card de certificacao. Estado: DONE local.
- RT-FINAL-05C.2 Remover linhas JSX de cadasturNumber e credential do card do guia. Estado: DONE local.
- RT-FINAL-05C.3 Limpar valores placeholder em messages/pt.json e messages/en.json. Estado: DONE local.
- RT-FINAL-05C.4 Remover claim "mais de 10 anos de experiencia" de story.paragraph1 (PT/EN); substituir por texto neutro. Estado: DONE local.
- RT-FINAL-05C.5 Reduzir repeticao em story.paragraph2 (PT/EN). Estado: DONE local.
- RT-FINAL-05C.6 Adicionar bloco identidade/contato em security-section com CNPJ, Instagram, WhatsApp, Email, Idiomas, Horario. Estado: DONE local.
- RT-FINAL-05C.7 Mover todos os textos hardcoded do bloco identidade para chaves em messages (identity.*). Estado: DONE local.
- RT-FINAL-05C.8 Corrigir encoding informa��es → informações em ctaFinal.subtitle (pt.json). Estado: DONE local.
- RT-FINAL-05C.9 Corrigir claim plural "nossos guias" → singular em whyChoose.certified (PT/EN). Estado: DONE local.
- RT-FINAL-05C.10 Atualizar documentacao operacional. Estado: DONE local.

Arquivos alterados:
- `components/about/security-section.tsx`
- `messages/pt.json`
- `messages/en.json`
- `docs/ops/backlog.md`
- `docs/ops/status.md`

Dados reais adicionados (autorizados pelo Trigger):
- CNPJ: 49.142.341/0001-90
- Instagram: @ricktravelbrasil
- WhatsApp: +55 21 97116-8114
- Email: contact@travelrick.com
- Idiomas: Portugues, Ingles e Espanhol
- Atendimento: Diario, 08h as 18h

Pendencias para o Trigger:
- public/cadastro/cadastur.png: arquivo existe; pode ser o documento real de Cadastur. Trigger deve revisar se e seguro exibir publicamente.
- Numeros reais de Cadastur da empresa e do guia a fornecer para as chaves vazias em messages (certification.cadasturNumber, guide.cadasturNumber, guide.credential).

Validacao local:
- lint PASS.
- typecheck PASS.
- test PASS (4 arquivos, 18 testes).
- build PASS.

Restricoes mantidas: sem seed; sem banco; sem schema; sem migration; sem deploy; sem commit; sem push; sem logica admin, booking, auth ou pagamento alterada; sem nova dependencia; sem numero inventado; nenhum dado sensivel adicionado; public/cadastro/cadastur.png nao exibido.

## RT-FINAL-05D Simplify About Page to Minimal Story Layout

Estado: Local REVIEW — implementacao concluida; aguardando autorizacao do Trigger para commit.

Objetivo: remover SecuritySection da pagina Quem Somos; pagina deve renderizar apenas hero inline + OurStory + MissionVisionValues.

Tarefas:
- RT-FINAL-05D.1 Remover import SecuritySection de quem-somos/page.tsx. Estado: DONE local.
- RT-FINAL-05D.2 Remover uso <SecuritySection /> do JSX da pagina. Estado: DONE local.
- RT-FINAL-05D.3 Atualizar documentacao operacional. Estado: DONE local.

Arquivos alterados:
- `app/[locale]/(public)/quem-somos/page.tsx`
- `docs/ops/backlog.md`
- `docs/ops/status.md`

Validacao local:
- lint PASS.
- typecheck PASS.

Restricoes mantidas: sem seed; sem banco; sem schema; sem migration; sem deploy; sem commit; sem push; sem logica admin, booking, auth ou pagamento alterada; sem nova dependencia; sem novo card ou claim adicionado; SecuritySection nao deletada, apenas removida da renderizacao.

## RT-FINAL-05E Simplify Contact Page Layout

Estado: Local REVIEW — implementacao concluida; aguardando autorizacao do Trigger para commit.

Objetivo: remover cards explicativos da pagina Contatos; pagina deve renderizar apenas hero "Fale com a Rick Travel sobre sua viagem no Rio" + formulario ContactForm.

Tarefas:
- RT-FINAL-05E.1 Remover array trustItems e grid de 3 cards da pagina. Estado: DONE local.
- RT-FINAL-05E.2 Remover secao "Como o atendimento funciona" e seus 4 cards. Estado: DONE local.
- RT-FINAL-05E.3 Atualizar documentacao operacional. Estado: DONE local.

Arquivos alterados:
- `app/[locale]/(public)/contato/page.tsx`
- `docs/ops/backlog.md`
- `docs/ops/status.md`

Validacao local:
- lint PASS.
- typecheck PASS.

Restricoes mantidas: sem alteracao em ContactForm, server actions, validacao de formulario, logica de envio, banco, schema, auth, admin, booking, tours, pagamento ou deploy; nenhum card novo adicionado.

## RT-FINAL-05F Add Real About Photo and Testimonial Photos

Estado: Local REVIEW — implementacao concluida; aguardando autorizacao do Trigger para commit.

Objetivo: substituir foto placeholder na pagina Quem Somos pela foto real do guia com cracha; atualizar nomes e fotos dos 3 depoimentos; adicionar selos Cadastur e logo-turismo ao footer global.

Tarefas:
- RT-FINAL-05F.1 Copiar 4 imagens de Downloads para public/. Estado: DONE local.
- RT-FINAL-05F.2 Atualizar our-story.tsx: src → ricardo-guia-cracha.webp; aspect-ratio portrait-friendly; object-top. Estado: DONE local.
- RT-FINAL-05F.3 Atualizar testimonials.tsx: Danyela Viana/Carlos Moura/Beyjamin Bonfim com fotos reais; remover Camila Ferraz e Julia Cortez. Estado: DONE local.
- RT-FINAL-05F.4 Atualizar footer.tsx: Image import; selos cadastur.png e logo-turismo.webp no rodape. Estado: DONE local.
- RT-FINAL-05F.5 Atualizar documentacao operacional. Estado: DONE local.

Arquivos alterados:
- `public/images/about/ricardo-guia-cracha.webp` (novo)
- `public/images/testimonials/danyela-viana.webp` (novo)
- `public/images/testimonials/carlos-moura.webp` (novo)
- `public/images/testimonials/beyjamin-bonfim.webp` (novo)
- `components/about/our-story.tsx`
- `components/testimonials.tsx`
- `components/footer.tsx`
- `docs/ops/backlog.md`
- `docs/ops/status.md`

Validacao local:
- lint PASS.
- typecheck PASS.
- test PASS.
- build PASS.

Restricoes mantidas: sem Cadastur numerico; sem CNPJ; sem badge de rede social; sem claims novas; sem alteracao em admin, booking, auth, pagamento, banco, schema, seed, migration ou deploy.

## RT-FINAL-HARDENING-01 Filter isPublished in Tour Detail Page

Estado: SUPERSEDED — corrigido em RT-FINAL-04D.

## RT-FINAL-04C2 Add Final Catalog Assets and Seed Definition

Estado: Local REVIEW - aguardando aprovacao do Trigger para commit; seed nao executado em producao.

Objetivo: adicionar os 2 assets obrigatorios e preparar seed definitivo do catalogo final de 6 tours.

Tarefas:
- RT-FINAL-04C2.1 Converter e salvar `imagem-helicoptero-cristo.jpg` em `public/images/trips/`. Estado: executada localmente; aguardando aprovacao do Trigger para commit.
- RT-FINAL-04C2.2 Converter e salvar `imagem-floresta-tijuca.jpg` em `public/images/trips/`. Estado: executada localmente; aguardando aprovacao do Trigger para commit.
- RT-FINAL-04C2.3 Reescrever `prisma/seed.ts` com catalogo final de 6 tours e despublicacao de seed-001. Estado: executada localmente; aguardando aprovacao do Trigger para commit.
- RT-FINAL-04C2.4 Atualizar documentacao operacional. Estado: executada localmente; aguardando aprovacao do Trigger para commit.

Restricoes mantidas: seed NAO executado; DATABASE_URL producao NAO usada; banco NAO alterado; schema NAO alterado; nenhuma migration; nenhuma UI alterada; nenhum deploy; nenhum commit; nenhum push; RT-FINAL-04C3 nao aberta automaticamente.

## RT-FINAL-04C3 Run Production Catalog Seed and Smoke

Estado: Production DONE by Trigger (2026-05-14) — seed executado; /pt/tours exibe 6 tours publicados; seed-001-cristo-dona-marta despublicado e ausente do catalogo; smoke completo PASS.

Objetivo: executar seed em producao, despublicar seed-001, validar catalogo de 6 tours em /pt/tours.

Resultado:
- Seed executado pelo Trigger contra Neon producao sem erro.
- 6 tours publicados: Pao de Acucar, Selaron + Lapa, Centro Historico + Porto Maravilha, Favela Rocinha, Floresta da Tijuca, Helicoptero com Cristo.
- seed-001-cristo-dona-marta: isPublished=false; ausente do catalogo publico e de /api/trips.
- Smoke completo PASS — ver RT-FINAL-04C2B para lista detalhada.

## Proximas candidatas (sem READY automatica)

- RT-FINAL-04C3 - Run Production Catalog Seed and Smoke
- RT-FINAL-01 - Define Delivery Scope and Acceptance Criteria
- RT-FINAL-05 - Configure Custom Domain and Final Production Smoke
- RT-FINAL-06 - Owner Handoff Package

## RT-AI-001 Define Rick Travel AI Concierge Scope and Safety Rules

Estado: REVIEW.

Objetivo: definir documentacao de escopo, arquitetura inicial e regras de seguranca para o Rick Travel AI Concierge, um agente publico para turistas interessados no Rio de Janeiro.

Tipo: DISCOVERY/ARCHITECTURE. Esta task nao implementa chatbot, rota, banco vetorial, dependencia de IA ou alteracao de produto.

Arquivos permitidos na futura execucao:
- `docs/product/ai-concierge-scope.md`
- `docs/architecture/ai-concierge-rag-strategy.md`
- `docs/ops/backlog.md`
- `docs/ops/status.md`
- `docs/ops/session-handoff.md`
- `docs/ops/execution-log.md`

Escopo permitido:
- Definir objetivo do agente.
- Definir usuarios-alvo.
- Definir intencoes principais.
- Definir fontes permitidas de conhecimento.
- Definir limites do agente.
- Definir riscos de alucinacao.
- Definir regras comerciais.
- Definir regras de seguranca turistica.
- Definir quando encaminhar para atendimento humano.
- Definir arquitetura inicial RAG.
- Definir relacao futura com LangChain.
- Definir relacao futura com LangGraph.
- Definir separacao entre AI Concierge publico e RIC Studio interno.

Fora de escopo:
- Nao instalar LangChain.
- Nao instalar LangGraph.
- Nao criar chat.
- Nao criar rota API.
- Nao criar banco vetorial.
- Nao alterar schema Prisma.
- Nao alterar seed.
- Nao alterar frontend.
- Nao alterar admin.
- Nao alterar pagamento, reserva, login ou producao.
- Nao criar `STATUS.md` ou `backlog.md` na raiz.

Criterios de aceite: documentacao futura define escopo, fontes, limites, riscos, regras comerciais, seguranca turistica, handoff humano, arquitetura RAG inicial e separacao entre Rick Travel AI Concierge publico e RIC Studio interno; nenhum codigo, frontend, backend, schema, seed, admin, reservas, pagamentos ou producao alterado.

Risco: medio, principalmente por alucinacao, promessa comercial indevida, orientacao turistica insegura e mistura indevida entre produto publico e governanca interna futura.

Evidencia criada: `docs/product/ai-concierge-scope.md`, `docs/architecture/ai-concierge-rag-strategy.md` e documentacao operacional atualizada.

Estado de execucao: documentacao criada localmente; aguardando revisao. Nenhum codigo, dependencia, schema, seed, frontend, admin, reservas, pagamentos, login ou producao foi alterado.

## RT-AI-002 Define AI Concierge Knowledge Base Inventory

Estado: REVIEW.

Objetivo: criar um inventario documental das fontes existentes que poderao ou nao alimentar futuramente o Rick Travel AI Concierge, sem criar base de conhecimento executavel, retrieval, embeddings, chat ou runtime.

Tipo: DISCOVERY/PRODUCT DOCUMENTATION. Esta task deve classificar fontes como `permitidas`, `condicionais` ou `bloqueadas`.

Arquivo de produto permitido na futura execucao:
- `docs/product/ai-concierge-knowledge-base-inventory.md`

Docs operacionais permitidos:
- `docs/ops/backlog.md`
- `docs/ops/status.md`
- `docs/ops/session-handoff.md`
- `docs/ops/execution-log.md`

Escopo permitido:
- Registrar caminho ou origem de cada fonte.
- Definir tipo de conteudo, prioridade e autoridade.
- Classificar conteudo publico versus interno.
- Registrar idiomas disponiveis e responsavel pela aprovacao.
- Registrar risco de desatualizacao e gatilho de revisao.
- Definir relacao da fonte com futuras etapas RAG.
- Definir precedencia entre fontes e resolucao de conflitos.
- Registrar lacunas de conteudo e aprovacoes pendentes.

Regras obrigatorias:
- O catalogo publico publicado tem prioridade sobre seed e arquivos legados.
- Somente tours com `isPublished=true` podem ser considerados para respostas publicas.
- Agenda ou `TripSchedule` nao representa disponibilidade confirmada.
- Seed e referencia secundaria e nao supera o catalogo publico publicado.
- `data/real-trips.json` deve ser classificado como bloqueado ou legado divergente, salvo revisao futura aprovada.
- `docs/ops/*` nao deve ser ingerido integralmente.
- Dados privados, bookings, pagamentos, contatos, admin, analytics, e-mails, logs, `.env`, segredos e backups sao bloqueados.
- Claims como `500+ tours`, avaliacao `4,9`, resposta em minutos, Cadastur, seguros e cobertura completa exigem evidencia aprovada antes de uso.
- Politicas de pagamento, cancelamento, reembolso e disponibilidade exigem aprovacao explicita antes de entrar na base.

Fora de escopo:
- Nao criar ainda `docs/product/ai-concierge-knowledge-base-inventory.md` nesta abertura de READY.
- Nao criar base vetorial, embeddings, chat ou rota API.
- Nao instalar LangChain ou LangGraph.
- Nao alterar frontend, backend, schema Prisma, seed, admin, reservas, pagamentos, login ou producao.
- Nao instalar dependencias.
- Nao fazer commit ou push nesta abertura de READY.

Criterios de aceite da futura task:
- Inventario criado somente com fontes existentes e verificaveis.
- Cada fonte classificada como permitida, condicional ou bloqueada.
- Precedencia, conflitos, lacunas, aprovacoes pendentes e riscos documentados.
- Separacao entre conteudo publico e interno preservada.
- Nenhum dado privado ou fonte bloqueada promovido para uso publico.
- Nenhuma implementacao tecnica, dependencia ou alteracao de produto realizada.

Risco: medio, principalmente por divergencia entre fontes, conteudo legado, claims sem evidencia, regras comerciais contraditorias, desatualizacao e exposicao acidental de dados internos ou privados.

Evidencia criada: `docs/product/ai-concierge-knowledge-base-inventory.md` e documentacao operacional atualizada.

Estado de execucao: inventario documental criado localmente; aguardando revisao. Nenhuma base vetorial, dependencia, embedding, chat, rota API, codigo, frontend, backend, schema, seed, admin, reservas, pagamentos, login ou producao foi alterado.

## RT-AI-003 Define Approved FAQ and Answer Examples

Estado: REVIEW.

Objetivo: definir uma matriz documental aprovada de perguntas, respostas esperadas, respostas bloqueadas e criterios de handoff humano para o futuro Rick Travel AI Concierge, antes de qualquer implementacao tecnica de RAG, chat ou agente.

Tipo: DISCOVERY/PRODUCT DOCUMENTATION. Esta task deve produzir um unico artefato de validacao e nao deve implementar runtime.

Arquivo de produto permitido na futura execucao:
- `docs/product/ai-concierge-answer-matrix.md`

Docs operacionais permitidos:
- `docs/ops/backlog.md`
- `docs/ops/status.md`
- `docs/ops/session-handoff.md`
- `docs/ops/execution-log.md`

Nao criar:
- `docs/product/ai-concierge-approved-faq.md`, para evitar duplicacao e divergencia de respostas.

Campos obrigatorios por cenario:
- Identificador.
- Intencao.
- Idioma.
- Pergunta do usuario.
- Fonte autorizada necessaria.
- Resposta esperada ou comportamento esperado.
- Exemplos de respostas bloqueadas.
- Perguntas de esclarecimento permitidas.
- Necessidade e motivo de handoff.
- Estado de aprovacao pelo responsavel.
- Criterios de validacao.

Cenarios minimos obrigatorios:
1. Primeira viagem ao Rio.
2. Comparacao entre Cristo Redentor e Pao de Acucar.
3. Passeio para familia.
4. Passeio para casal.
5. Meio dia disponivel.
6. Roteiro de 1 dia no Rio.
7. Tour privado.
8. Duvida sobre preco.
9. Duvida sobre disponibilidade.
10. Duvida sobre pagamento.
11. Duvida sobre cancelamento.
12. Duvida sobre seguranca.
13. Duvida sobre favela/comunidade.
14. Duvida sobre acessibilidade.
15. Cliente pedindo algo que o agente nao pode confirmar.
16. Cliente pedindo contato humano.
17. Cliente em ingles.
18. Cliente em espanhol.
19. Pergunta fora do escopo do Rio/Rick Travel.
20. Pergunta com risco de alucinacao.

Respostas bloqueadas obrigatorias:
- Confirmar reserva ou disponibilidade.
- Informar preco final de grupo, desconto ou condicao especial.
- Afirmar politicas nao aprovadas de pagamento, cancelamento ou reembolso.
- Garantir seguranca ou acessibilidade.
- Recomendar tours inexistentes ou nao publicados.
- Usar dados privados, administrativos, bookings ou pagamentos.
- Repetir claims sem evidencia aprovada.
- Inventar horarios, condicoes, duracao ou fatos ausentes.
- Fornecer orientacao medica, legal, policial ou emergencial alem de encaminhamento oficial.

Handoff humano obrigatorio:
- Disponibilidade, reserva, preco final e condicoes especiais.
- Pagamento, cancelamento, reembolso ou reagendamento.
- Tours privados, grupos e roteiros personalizados.
- Acessibilidade, criancas, idosos ou necessidades especificas.
- Seguranca, favela/comunidade, periodo noturno e clima severo.
- Conflito entre fontes, baixa confianca ou ausencia de fonte aprovada.
- Solicitacao explicita de contato humano.

Regra critica:
- Conflitos comerciais ainda nao resolvidos devem aparecer como `PENDING_OWNER_APPROVAL` e exigir handoff.
- Conflitos comerciais nao podem ser tratados como FAQ factual aprovada.

Fora de escopo:
- Nao criar ainda `docs/product/ai-concierge-answer-matrix.md` nesta abertura de READY.
- Nao criar `docs/product/ai-concierge-approved-faq.md`.
- Nao criar chat, rota API, base vetorial ou embeddings.
- Nao instalar LangChain ou LangGraph.
- Nao alterar frontend, backend, schema Prisma, seed, admin, reservas, pagamentos, login ou producao.
- Nao alterar `package.json` ou lockfiles.
- Nao criar `STATUS.md` ou `backlog.md` na raiz.
- Nao fazer commit ou push nesta abertura de READY.

Criterios de aceite da futura task:
- Um unico documento de matriz criado e rastreavel a RT-AI-001 e RT-AI-002.
- Todos os 20 cenarios minimos representados.
- Cada cenario registra resposta esperada, bloqueios, handoff, fonte, aprovacao, idioma e validacao.
- Exemplos em portugues, ingles e espanhol preservam os mesmos guardrails.
- Nenhum conflito comercial pendente e promovido a fato aprovado.
- Nenhum tour nao publicado, dado privado ou claim sem evidencia e usado.
- Agenda ou `TripSchedule` nao e tratada como disponibilidade confirmada.
- Nenhuma implementacao tecnica, dependencia ou alteracao de produto realizada.

Risco: medio, principalmente por aprovar acidentalmente informacao comercial conflitante, enfraquecer guardrails em traducoes, criar respostas desatualizadas ou induzir excesso de confianca.

## RT-AI-004 Define AI Concierge Prompt and Guardrail Contract

Estado: REVIEW.

Objetivo: definir o contrato operacional do futuro Rick Travel AI Concierge, incluindo prompt behavior, guardrails, recusas, handoff humano e formato de resposta antes de qualquer implementacao tecnica.

Tipo: DISCOVERY/PRODUCT DOCUMENTATION. Esta task deve criar um unico documento contratual e nao deve implementar runtime.

Arquivo de produto permitido na futura execucao:
- `docs/product/ai-concierge-prompt-contract.md`

Docs operacionais permitidos:
- `docs/ops/backlog.md`
- `docs/ops/status.md`
- `docs/ops/session-handoff.md`
- `docs/ops/execution-log.md`

Conteudo obrigatorio do contrato:
- persona publica: Rick Travel AI Concierge;
- papel do agente;
- tom de voz;
- idioma de resposta;
- uso obrigatorio de fontes aprovadas ou contexto recuperado;
- regra de nao invencao;
- regras de baixa confianca;
- regras de conflito entre fontes;
- regras comerciais;
- regras de seguranca turistica;
- regras de handoff humano;
- recusas e bloqueios;
- formato esperado de resposta;
- formato bloqueado de resposta;
- limite explicito para nao mencionar RIC Studio no fluxo publico;
- contrato minimo para futura implementacao tecnica de system/developer prompt, sem criar codigo.

Regras criticas:
- Pagamento, cancelamento e reembolso continuam `PENDING_OWNER_APPROVAL`.
- Baixa confianca deve gerar resposta do tipo "nao tenho informacao aprovada" e encaminhamento humano.
- O agente deve responder no idioma do usuario quando possivel.
- O agente deve ser curto, claro e comercialmente seguro.
- O agente nao deve prometer acao operacional.
- O agente nao deve mencionar RIC Studio no fluxo publico.

Riscos que a futura task deve bloquear:
- Confirmar reserva, disponibilidade, pagamento ou preco final.
- Inventar tours, horarios, politicas, duracao, claims ou descontos.
- Usar fontes bloqueadas ou condicionais sem curadoria.
- Responder com confianca quando houver baixa evidencia.
- Prometer seguranca absoluta.
- Dar veredito sobre favela/comunidade, acessibilidade, criancas, idosos ou necessidades especiais sem humano.
- Citar RIC Studio como parte da experiencia publica.
- Transformar o concierge em chatbot open-domain.
- Criar dependencia prematura de LangChain, LangGraph, embeddings ou banco vetorial.

Fora de escopo:
- Nao criar prompt em codigo.
- Nao criar chat.
- Nao criar rota API.
- Nao criar base vetorial.
- Nao criar embeddings.
- Nao instalar LangChain.
- Nao instalar LangGraph.
- Nao alterar frontend, backend, schema Prisma, seed, admin, reservas, pagamentos, login ou producao.
- Nao alterar `package.json` ou lockfiles.
- Nao criar `STATUS.md` ou `backlog.md` na raiz.
- Nao fazer commit ou push nesta abertura de READY.

Criterios de aceite da futura task:
- `docs/product/ai-concierge-prompt-contract.md` criado como documento contratual unico.
- Contrato rastreavel a RT-AI-001, RT-AI-002 e RT-AI-003.
- Persona, papel, tom, idioma, fontes, nao invencao, baixa confianca, conflito entre fontes, handoff, recusas e formato de resposta definidos.
- Bloqueios comerciais, seguranca turistica e limites sobre RIC Studio preservados.
- Nenhum codigo, dependencia, runtime, chat, API, RAG tecnico, frontend, backend, schema, seed, admin, reserva, pagamento, login ou producao alterado.

Risco: medio, principalmente por transformar exemplos da matriz em comportamento excessivamente aberto, enfraquecer bloqueios comerciais, permitir confianca indevida ou antecipar implementacao tecnica antes do contrato documental.

Evidencia criada: `docs/product/ai-concierge-prompt-contract.md` e documentacao operacional atualizada.

Estado de execucao: contrato operacional criado localmente; aguardando revisao. Nenhum prompt em codigo, chat, rota API, RAG tecnico, dependencia, frontend, backend, schema, seed, admin, reservas, pagamentos, login ou producao foi alterado.

## RT-AI-005 Define Curated Knowledge Base Format

Estado: REVIEW.

Objetivo: definir o formato canonico e versionavel da futura base de conhecimento curada do Rick Travel AI Concierge.

Tipo: DISCOVERY/PRODUCT DOCUMENTATION. Esta task deve produzir um unico documento de formato e nao deve criar base real, seed, runtime, retrieval, embeddings ou agente.

Arquivo de produto permitido na futura execucao:
- `docs/product/ai-concierge-knowledge-base-format.md`

Docs operacionais permitidos:
- `docs/ops/backlog.md`
- `docs/ops/status.md`
- `docs/ops/session-handoff.md`
- `docs/ops/execution-log.md`

Conteudo obrigatorio do formato:
- objetivo da base curada;
- relacao com RT-AI-001, RT-AI-002, RT-AI-003 e RT-AI-004;
- tipos de registros permitidos;
- campos obrigatorios;
- campos opcionais;
- metadados;
- idiomas;
- status de aprovacao;
- fonte de origem;
- data de atualizacao;
- regras de validade;
- regras para conteudo publico versus interno;
- regras para conteudo bloqueado;
- formato para tours;
- formato para destinos/atracoes;
- formato para regras comerciais;
- formato para regras de seguranca;
- formato para FAQ/matriz de respostas;
- relacao futura com RAG, embeddings e LangChain;
- criterios de validacao.

Tipos minimos de conteudo:
- `tour`
- `destination`
- `attraction`
- `commercial_rule`
- `safety_rule`
- `handoff_rule`
- `faq_answer`
- `blocked_claim`

Campos obrigatorios minimos:
- `id`
- `type`
- `locale`
- `title`
- `content`
- `source`
- `sourceAuthority`
- `approvalStatus`
- `owner`
- `updatedAt`
- `publicAllowed`
- `ragAllowed`

Campos opcionais minimos:
- `tourId`
- `relatedTourIds`
- `city`
- `neighborhood`
- `tags`
- `riskLevel`
- `handoffRequired`
- `expiresAt`
- `notes`

Estados de aprovacao:
- `APPROVED`
- `CONDITIONAL`
- `PENDING_OWNER_APPROVAL`
- `BLOCKED`

Regras criticas:
- Somente conteudo `APPROVED` pode ser usado em resposta factual.
- Conteudo `CONDITIONAL` exige regra explicita.
- Conteudo `PENDING_OWNER_APPROVAL` deve gerar handoff.
- Conteudo `BLOCKED` nunca deve ser usado para resposta publica.
- Tours exigem `isPublished=true`.
- Agenda nao significa disponibilidade confirmada.
- Preco final, pagamento, cancelamento e reembolso nao devem ser inferidos.
- Claims como Cadastur, avaliacao, seguros e "500+ tours" exigem evidencia aprovada.
- Portugues, ingles e espanhol sao prioridade inicial.
- Sueco somente se houver conteudo aprovado.
- Nao misturar idiomas divergentes sem revisao.

Fora de escopo:
- Nao criar arquivos JSON/YAML de base real.
- Nao criar seed.
- Nao alterar `data/`.
- Nao criar base vetorial.
- Nao criar embeddings.
- Nao instalar LangChain.
- Nao instalar LangGraph.
- Nao criar chat.
- Nao criar rota API.
- Nao alterar frontend.
- Nao alterar backend.
- Nao alterar schema Prisma.
- Nao alterar admin.
- Nao alterar reservas.
- Nao alterar pagamentos.
- Nao alterar login.
- Nao alterar producao.
- Nao alterar `package.json` ou lockfiles.
- Nao criar `STATUS.md` ou `backlog.md` na raiz.
- Nao fazer commit ou push nesta abertura de READY.

Criterios de aceite da futura task:
- `docs/product/ai-concierge-knowledge-base-format.md` criado como documento de formato canonico unico.
- Formato rastreavel a RT-AI-001, RT-AI-002, RT-AI-003 e RT-AI-004.
- Tipos, campos obrigatorios, campos opcionais, metadados, idiomas, aprovacao, origem, atualizacao, validade e publico versus interno definidos.
- Regras para tours, destinos/atracoes, regras comerciais, seguranca, handoff, FAQ/matriz de respostas e claims bloqueados definidas.
- Relacao futura com RAG, embeddings e LangChain documentada sem implementacao tecnica.
- Nenhum arquivo JSON/YAML de base real, seed, `data/`, base vetorial, embedding, chat, API, dependencia, frontend, backend, schema, admin, reserva, pagamento, login ou producao alterado.

Risco: medio, principalmente por promover conteudo condicional ou pendente a fato aprovado, misturar idiomas sem revisao, permitir claims sem evidencia ou antecipar formato executavel antes da curadoria documental.

Evidencia criada: `docs/product/ai-concierge-knowledge-base-format.md` e documentacao operacional atualizada.

Estado de execucao: formato canonico criado localmente; aguardando revisao. Nenhum arquivo JSON/YAML de base real, seed, `data/`, base vetorial, embedding, chat, rota API, dependencia, frontend, backend, schema, admin, reservas, pagamentos, login ou producao foi alterado.

## RT-AI-006 Define First Curated Knowledge Base Seed Scope

Estado: REVIEW.

Objetivo: definir o primeiro escopo editorial da Curated Knowledge Base Seed do Rick Travel AI Concierge antes de qualquer criacao de base real.

Tipo: DISCOVERY/PRODUCT DOCUMENTATION. Esta task deve produzir um unico documento de escopo editorial e nao deve criar JSON/YAML, seed, runtime, retrieval, embeddings, chat, API ou agente.

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

Conteudo obrigatorio da futura task:
- definir quais tipos de conteudo entram no primeiro pacote curado;
- definir quais fontes ficam condicionais;
- definir quais fontes ficam bloqueadas;
- definir criterios editoriais antes de qualquer criacao de base real;
- registrar precedencia entre fontes aprovadas, condicionais e bloqueadas;
- registrar criterios por idioma e por aprovacao de owner;
- registrar lacunas que devem permanecer como handoff ou `PENDING_OWNER_APPROVAL`;
- registrar criterios de validacao do primeiro escopo editorial.

Escopo conceitual minimo:
- catalogo publico publicado pode ser fonte primaria somente para tours com `isPublished=true`;
- campos publicos de tours podem ser considerados apenas quando vierem do catalogo publicado ou de fonte aprovada;
- paginas publicas podem ser usadas somente por secao aprovada;
- documentos de governanca AI ja aprovados podem sustentar guardrails, handoff, bloqueios e precedencia;
- `prisma/seed.ts` permanece fonte secundaria/condicional, nunca superior ao catalogo publicado;
- `messages/*.json` permanecem condicionais por chave revisada, sem ingestao integral;
- `docs/ops/*` permanece evidencia operacional pontual, nunca corpus integral;
- `data/real-trips.json` permanece bloqueado enquanto legado/divergente;
- `TripSchedule` nao confirma disponibilidade;
- claims como Cadastur, guias credenciados, seguro, avaliacoes, suporte rapido e seguranca dependem de evidencia e aprovacao explicita;
- pagamento, cancelamento, reembolso, preco final, disponibilidade e confirmacao de reserva permanecem fora de resposta factual sem politica aprovada.

Fora de escopo:
- Nao criar `docs/product/ai-concierge-first-kb-seed-scope.md` nesta abertura de READY.
- Nao criar arquivos JSON.
- Nao criar arquivos YAML.
- Nao criar ou alterar `data/`.
- Nao criar seed real.
- Nao alterar `prisma/seed.ts`.
- Nao alterar `messages/*.json`.
- Nao alterar frontend.
- Nao alterar backend.
- Nao alterar API.
- Nao criar chat.
- Nao criar embeddings.
- Nao instalar LangChain.
- Nao instalar LangGraph.
- Nao alterar schema Prisma.
- Nao alterar banco.
- Nao alterar admin.
- Nao alterar bookings.
- Nao alterar pagamentos.
- Nao alterar usuarios.
- Nao alterar contatos privados.
- Nao alterar analytics.
- Nao alterar logs.
- Nao alterar `.env`, backups ou deploy.
- Nao alterar `package.json` ou lockfiles.
- Nao criar `STATUS.md` ou `backlog.md` na raiz.
- Nao fazer commit ou push nesta abertura de READY.
- Nao abrir RT-AI-007.

Criterios de aceite da futura task:
- `docs/product/ai-concierge-first-kb-seed-scope.md` criado como documento unico de escopo editorial.
- Documento rastreavel a RT-AI-001, RT-AI-002, RT-AI-003, RT-AI-004 e RT-AI-005.
- Primeiro pacote curado definido por tipo de conteudo, fonte, status de aprovacao, idioma, owner, risco e criterio de entrada.
- Fontes condicionais e bloqueadas registradas explicitamente.
- Tours restritos a `isPublished=true`; `TripSchedule` tratado como nao confirmatorio de disponibilidade.
- Claims sem evidencia/aprovacao explicita mantidos fora do pacote aprovado.
- Nenhum JSON/YAML de base real, seed, `data/`, embeddings, chat, API, dependencia, frontend, backend, schema, banco, admin, bookings, pagamentos, usuarios, contatos privados, analytics, logs, `.env`, backups ou deploy alterado.

Risco: medio, principalmente por promover conteudo condicional a aprovado, usar mensagens i18n conflitantes como fonte integral, tratar agenda como disponibilidade, aceitar claims sem evidencia ou antecipar criacao de base real antes da curadoria editorial.

Evidencia criada: `docs/product/ai-concierge-first-kb-seed-scope.md` e documentacao operacional atualizada.

Estado de execucao: product scope document created locally; RT-AI-006 moved to REVIEW. No KB records, JSON/YAML, seed, `data/`, `prisma/seed.ts`, `messages/*.json`, code, API, embeddings, LangChain, LangGraph, schema, database, admin, bookings, payments, users, private contacts, analytics, logs, `.env`, backups, packages, lockfiles, or deployment were changed.

## RT-AI-007 Define First Curated KB Records Content

State: REVIEW.

Objective: define the first curated editorial knowledge base records for the Rick Travel AI Concierge, based on RT-AI-006.

Type: PRODUCT DOCUMENTATION. This task must define editorial records only. It must not create machine-readable KB data, JSON/YAML seed files, embeddings, RAG runtime, LangChain, LangGraph, API routes, chat UI, code, or deployment changes.

Product file allowed in the future execution:
- `docs/product/ai-concierge-first-curated-kb-records.md`

Operational docs allowed:
- `docs/ops/backlog.md`
- `docs/ops/status.md`
- `docs/ops/session-handoff.md`
- `docs/ops/execution-log.md`

Required future record groups:
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

Required future record fields:
- `id`
- `type`
- `locale`
- `title`
- `content`
- `source`
- `sourceAuthority`
- `approvalStatus`
- `owner`
- `updatedAt`
- `reviewedAt`
- `publicAllowed`
- `ragAllowed`
- `handoffRequired`
- `riskLevel`
- `notes`

Allowed approval statuses:
- `APPROVED`
- `CONDITIONAL`
- `PENDING_OWNER_APPROVAL`
- `BLOCKED`

Out of scope:
- Do not create `docs/product/ai-concierge-first-curated-kb-records.md` in this READY opening.
- Do not edit code.
- Do not edit frontend.
- Do not edit backend/API.
- Do not edit Prisma/schema.
- Do not edit `data/`.
- Do not create JSON/YAML seed files.
- Do not create embeddings.
- Do not implement RAG.
- Do not install or configure LangChain.
- Do not install or configure LangGraph.
- Do not create chat UI.
- Do not edit package or lockfiles.
- Do not edit environment or deployment files.
- Do not add real payment information.
- Do not invent Cadastur/CNPJ numbers, phone, email, opening hours, response time, ratings, reviews, safety, insurance, or certification claims.
- Do not commit or push in this READY opening.

Acceptance criteria for the future task:
- Creates only `docs/product/ai-concierge-first-curated-kb-records.md` plus allowed ops docs.
- Defines editorial records, not machine-readable KB data.
- Every proposed record has all required fields.
- Records use only `APPROVED`, `CONDITIONAL`, `PENDING_OWNER_APPROVAL`, or `BLOCKED`.
- Tour records are restricted to public tours with `isPublished=true`.
- Payment, cancellation, refund, Cadastur, CNPJ, trust, rating, safety, insurance, and certification claims remain blocked or pending unless evidence is explicitly approved.
- Handoff rules are present before any future implementation.
- No technical implementation artifacts are created.

Risk: medium. The main risk is accidentally turning conditional or blocked claims into approved facts, especially payment, cancellation/refund, Cadastur, CNPJ, trust, ratings, safety, insurance, certification, or availability claims.

Evidence created: `docs/product/ai-concierge-first-curated-kb-records.md` and operational documentation updated.

Execution state: product records document created locally; RT-AI-007 moved to REVIEW. The records are editorial examples and approval-controlled content only, not machine-readable KB data. No code, frontend, backend/API, Prisma/schema, `data/`, JSON/YAML seed files, embeddings, RAG, LangChain, LangGraph, chat UI, package, lockfile, environment, deployment, real payment information, invented Cadastur/CNPJ numbers, invented contact details, opening hours, response times, ratings, reviews, safety, insurance, certification claims, commit, or push was created or changed.

## RT-AI-008 Define Verified Rick Travel Business Evidence Records

State: REVIEW.

Objective: define a documentation-only evidence governance layer for real Rick Travel business data before any real business evidence is treated as public, website-safe, or AI Concierge-safe.

Type: PRODUCT DOCUMENTATION. This task must prepare a future evidence record document only. It must not ingest real business data into runtime, create machine-readable KB data, JSON/YAML seed files, embeddings, RAG runtime, LangChain, LangGraph, API routes, chat UI, code, deploy, or publication changes.

Product file allowed in the future execution:
- `docs/product/ai-concierge-verified-business-evidence-records.md`

Operational docs allowed:
- `docs/ops/backlog.md`
- `docs/ops/status.md`
- `docs/ops/session-handoff.md`
- `docs/ops/execution-log.md`

Required future scope:
- define evidence format;
- define source/evidence requirement;
- define owner approval requirement;
- define `reviewedAt`;
- define `approvalStatus`;
- define `publicAllowed`;
- define `aiAllowed`;
- define `websiteAllowed`;
- define `riskLevel`;
- define that no data is public by default;
- define that sensitive data must not be published without explicit owner approval.

Evidence categories for the future task:
- CNPJ / razao social / nome fantasia;
- Cadastur da empresa;
- credencial de guia;
- WhatsApp publico aprovado;
- e-mail publico aprovado;
- redes sociais oficiais;
- horario de atendimento;
- politica de reserva;
- politica de pagamento;
- politica de cancelamento/reembolso;
- tours reais publicados;
- fotos oficiais;
- avaliacoes/reviews, se houver fonte verificavel;
- certificados, seguros ou credenciais, se houver evidencia real.

Required future evidence fields:
- dado informado;
- fonte/evidencia;
- owner responsavel;
- data de revisao / `reviewedAt`;
- status: `APPROVED`, `CONDITIONAL`, `PENDING_OWNER_APPROVAL`, or `BLOCKED`;
- `publicAllowed`;
- `aiAllowed`;
- `websiteAllowed`;
- `riskLevel`: `low`, `medium`, `high`, or `critical`;
- observacoes de limite.

Out of scope:
- Do not create `docs/product/ai-concierge-verified-business-evidence-records.md` in this READY opening.
- Do not create JSON.
- Do not create YAML.
- Do not create seed.
- Do not alter `data/`.
- Do not alter `prisma/`.
- Do not alter API.
- Do not alter frontend.
- Do not alter backend.
- Do not alter schema.
- Do not alter package or lockfiles.
- Do not create embeddings.
- Do not implement RAG.
- Do not install or configure LangChain.
- Do not install or configure LangGraph.
- Do not add chatbot.
- Do not deploy.
- Do not ingest real business data.
- Do not publish sensitive data without explicit approval.
- Do not commit or push in this READY opening.

Acceptance criteria for the future task:
- Creates only `docs/product/ai-concierge-verified-business-evidence-records.md` plus allowed ops docs.
- Defines evidence governance records, not machine-readable KB data.
- No real data is public by default.
- Every real data item requires source/evidence, owner, `reviewedAt`, approval status, explicit usage permissions, risk level, and limitation notes.
- `publicAllowed`, `aiAllowed`, and `websiteAllowed` are explicit and never inferred.
- Sensitive data remains `BLOCKED` or `PENDING_OWNER_APPROVAL` unless explicit source and owner approval exist.
- The document prepares a future technical KB path without implementing it.

Validation required before REVIEW:
- `git status --short --untracked-files=all`
- `git status -sb`
- `git diff --name-only`
- `git diff --stat`
- `git diff --check`
- `git diff --cached --name-only`

Risk: high. The main risk is accidentally publishing or approving real business identifiers, contact channels, payment/cancellation policies, trust claims, safety claims, reviews, certifications, insurance, or credentials without explicit evidence and owner approval.

Evidence created: `docs/product/ai-concierge-verified-business-evidence-records.md` and operational documentation updated.

Execution state: product evidence governance document created locally; RT-AI-008 moved to REVIEW. The document defines placeholder and blocking evidence records only, not approved real business facts. No JSON, YAML, seed, `data/`, `prisma/`, API, frontend, backend, schema, package, lockfile, embeddings, RAG, LangChain, LangGraph, chatbot, deploy, real business data runtime ingestion, commit, or push was created or changed. No sensitive data was made public by default.

## RT-AI-009 Define Approved Public Business Evidence Values

State: DONE

Objective: create a separate approved-values register for real Rick Travel business evidence values that the owner explicitly approves for public, website, and/or future AI Concierge use.

Type: PRODUCT DOCUMENTATION. This task produced a separate approved-values register.

Product file created:
- `docs/product/ai-concierge-approved-public-business-evidence-values.md`

Result:
- Separate approved-values register created from the RT-AI-008 evidence governance document.
- Sections created for public website use, future AI Concierge use, internal/handoff use, pending owner confirmation, and blocked/sensitive values.
- No real approved business values were added.
- Pending owner confirmation records created for CNPJ/legal identity, Cadastur, guide credential, public WhatsApp, public email, social links, service hours, booking policy, payment policy, cancellation/refund policy, published tours, official photos, reviews/testimonials, and insurance/certificates/licenses/safety claims.
- Blocked records created for private personal data, operational/customer/payment/admin data, and unsupported public claims.
- Runtime and technical implementation remain blocked without a separate task.

Evidence: commit `a4668a7c8d61619561cff883526e895359b8000b` pushed to `origin/main`.

## RT-AI-010 Add First Owner-Approved Public Business Evidence Values

State: DONE

Objective: add the first owner-approved public business evidence values to the existing approved business evidence document.

Type: PRODUCT DOCUMENTATION.

Result:
- Added 10 approved records to Section 5 (Public Website Use) and Section 6 (Future AI Concierge Use).
- Approved values include: Brand Name (Rick Travel), Short Description, Service Base (Rio de Janeiro, Brazil), Service Regions, Service Languages (PT, EN, ES), General Services, Public WhatsApp (+55 21 96681-9928), Public Email (contact@travelrick.com), Official Social Media (@ricktravelbrasil), and Institutional Website Text.
- Added 2 approved AI Concierge rules: Allowed Automatic Answers and Mandatory Human Handoff rules.
- Pending placeholders for WhatsApp, Email, and Social Media removed from Section 8.
- Remaining pending records in Section 8 renumbered (1 to 11).
- Section 11 (Non-Goals) updated to reflect the presence of approved values.
- No sensitive data (CNPJ, Cadastur, prices, etc.) added.
- No code or runtime changes.

Evidence: task executed locally; REVIEW pending before commit.

## RT-AI-011 Define Public Credibility Evidence Approval Scope

State: REVIEW

Objective: define a documentation-only approval scope for public credibility evidence before any website expansion, AI Concierge use, ingestion, runtime, or implementation work.

Type: PRODUCT DOCUMENTATION. This future task must define approval rules and safe usage boundaries only. It must not add real credential values, real legal identifiers, customer data, payment data, testimonials, prices, availability, guarantees, runtime files, or implementation artifacts.

Product documentation scope allowed in the future execution:
- Define rules for CNPJ / legal entity references.
- Define rules for Cadastur company registration references.
- Define rules for guide credentials, handled separately from company credentials.
- Define rules for official public business identity and trust badges.
- Define rules for testimonials, social proof, ratings, rankings, and customer quotes.
- Define rules for verified, certified, licensed, registered, insured, or similar claims.
- Define what the future AI Concierge may or may not say about credentials.

Operational docs allowed in the future execution:
- `docs/ops/backlog.md`
- `docs/ops/status.md`
- `docs/ops/session-handoff.md`
- `docs/ops/execution-log.md`

Required future rules:
- CNPJ and Cadastur remain `PENDING_OWNER_APPROVAL` or `BLOCKED` by default until exact official evidence and explicit owner approval are recorded.
- CNPJ and Cadastur should be treated as verification-first values by default; public display requires a separate owner-approved decision on exact value, source, wording, review date, and usage flags.
- Guide credentials must be handled separately from company credentials because they may involve named people, validity, assignment, language coverage, privacy, and operational availability.
- Website approval must not automatically imply future AI Concierge approval.
- Public permission, website permission, and AI permission must remain separate explicit decisions.
- The AI Concierge must hand off legal, tax, credential, document, stale evidence, missing evidence, conflicting evidence, and named guide certification questions.
- Missing, stale, private, conflicting, or unsupported credibility evidence must remain blocked or require human handoff.

Out of scope:
- Do not add an actual CNPJ value.
- Do not add a Cadastur numeric value.
- Do not add guide documents, credential numbers, personal documents, private addresses, customer data, payment data, testimonial text, prices, availability, guarantees, or credential values.
- Do not modify `docs/product/ai-concierge-approved-public-business-evidence-values.md` in this READY opening.
- Do not modify `docs/product/ai-concierge-verified-business-evidence-records.md` in this READY opening.
- Do not create or modify JSON, YAML, seed, `data/`, `prisma/`, API, frontend, backend, database, schema, package files, lockfiles, RAG, embeddings, LangChain, LangGraph, chatbot, deploy, runtime files, or implementation files.
- Do not create root `STATUS.md` or root `backlog.md`.
- Do not commit or push in this READY opening.

Acceptance criteria for the future task:
- Creates or updates only an approved product documentation file plus allowed ops docs when explicitly authorized.
- Defines public credibility evidence approval scope without publishing actual credential values.
- Keeps CNPJ, Cadastur, guide credentials, trust badges, testimonials, reviews, safety, insurance, certification, verified, licensed, registered, and similar claims blocked or pending unless exact evidence and owner approval exist.
- Separates company credentials from guide credentials.
- Separates public, website, and AI approval flags.
- Defines mandatory human handoff for legal/tax/credential disputes, document requests, stale evidence, missing evidence, conflicting evidence, and named guide certification questions.
- Does not define or implement schema, chatbot, ingestion, RAG, runtime, API, frontend, backend, database, seed, package, lockfile, or deployment work.

Validation required before REVIEW:
- `git status --short --untracked-files=all`
- `git status -sb`
- `git diff --name-only`
- `git diff --stat`
- `git diff --check`
- Forbidden reference search across allowed ops docs.

Risk: high. The main risk is accidentally turning legal identity, Cadastur, guide credentials, testimonials, trust badges, certification, insurance, safety, or verified claims into public facts without exact evidence and owner approval.

Evidence created: `docs/product/ai-concierge-public-credibility-evidence-approval-scope.md` and operational documentation updated.

Execution state: product credibility evidence approval scope document created locally; RT-AI-011 moved to REVIEW. The document defines approval scope and blocking/handoff rules only. No actual CNPJ value, Cadastur number, guide credential identifier, personal document, private address, customer data, payment data, testimonial, price, availability, guarantee, actual credential value, runtime file, implementation file, JSON, YAML, seed, API, frontend, backend, database, RAG, embeddings, LangChain, LangGraph, chatbot, deploy, package file, lockfile, commit, or push was created or changed.

## RT-AI-012 Audit Website Against Approved Public Values

State: REVIEW

Objective: define a documentation-only audit of current website copy and content against approved public business values, public credibility evidence scope, blocked/pending credibility claims, and AI/human handoff rules.

Type: PRODUCT/CONTENT AUDIT DOCUMENTATION. This future task must inspect website content and produce an audit note only. It must not modify website code, components, app files, message files, product documents, architecture documents, runtime files, implementation files, data files, dependencies, deploy configuration, or package metadata.

Audit scope allowed in the future execution:
- Identify website content that is safe and already approved.
- Identify website content that should be removed.
- Identify website content that should be rewritten.
- Identify website content that must remain blocked or pending.
- Identify website areas that may need later implementation only after separate review and approval.
- Compare website copy against `docs/product/ai-concierge-approved-public-business-evidence-values.md`.
- Compare website credibility claims against `docs/product/ai-concierge-public-credibility-evidence-approval-scope.md`.
- Preserve AI/human handoff rules already approved in the evidence documents.

Operational docs allowed in the future execution:
- `docs/ops/backlog.md`
- `docs/ops/status.md`
- `docs/ops/session-handoff.md`
- `docs/ops/execution-log.md`

Required future rules:
- The audit must be documentation-only.
- The audit must not change code, UI, messages, data, product documents, or architecture documents.
- Existing approved public values may be marked safe for website use only when the approval record explicitly allows website use.
- CNPJ, Cadastur, guide credentials, trust badges, testimonials, ratings, review counts, rankings, prices, availability, guarantees, safety claims, insurance claims, and certification-style claims must remain blocked or pending unless already explicitly approved in current governance documents.
- Website approval and future AI Concierge approval remain separate explicit decisions.
- Any website content touching missing, stale, disputed, pending, blocked, private, legal, tax, credential, safety, insurance, payment, price, or availability evidence must be marked for human review or removal/rewrite.

Out of scope:
- Do not modify website code, components, app files, message files, product documents, architecture documents, runtime files, implementation files, JSON, YAML, seed, API, frontend, backend, database, package files, lockfiles, deploy configuration, or AI technical assets.
- Do not add actual CNPJ values, Cadastur numeric values, guide credential identifiers, personal documents, private addresses, customer information, payment information, testimonials, ratings, review counts, rankings, prices, availability statements, guarantees, or credential values.
- Do not add new approvals for verified, certified, licensed, registered, insured, safe, or official claims unless those claims already have explicit approval in current governance documents.
- Do not commit or push in this READY opening.

Acceptance criteria for the future task:
- Produces a documentation-only audit note plus allowed ops updates when explicitly authorized.
- Lists approved website-safe content and the source approval record.
- Lists blocked, pending, risky, stale, unsupported, or rewrite-needed website content.
- Confirms no website implementation or content changes were made during the audit.
- Confirms no product document, architecture document, runtime file, implementation file, data file, package file, lockfile, or deploy file was changed.

Validation required before REVIEW:
- `git status --short --untracked-files=all`
- `git status -sb`
- `git diff --name-only`
- `git diff --stat`
- `git diff --check`
- Forbidden scope search across allowed ops docs.

Risk: medium. The main risk is accidentally turning an audit finding into a website change or treating blocked credibility claims as approved public content.

Execution state: RT-AI-012 opened as READY in operational documentation only. No website file, product document, architecture document, runtime file, implementation file, JSON, YAML, seed, API, frontend, backend, database, AI technical asset, deploy file, package file, lockfile, commit, or push was created or changed.

Evidence created: `docs/product/ai-concierge-website-approved-values-audit.md` and operational documentation updated.

Execution result: website approved-values audit created locally; RT-AI-012 moved to REVIEW. The audit result is `PASS_WITH_REVIEW_ITEMS`: the website contains approved low-risk public values, but also contains blocked or pending Cadastur, credential, safety, testimonial, rating, price, availability, payment, guarantee, and trust-claim content that requires review or rewrite before any future website sync. No website code, component, app file, message file, style file, JSON, YAML, seed, API, frontend, backend, database, package file, lockfile, runtime file, implementation file, actual CNPJ value, Cadastur number, guide credential identifier, testimonial text, rating approval, price approval, availability approval, guarantee, customer data, payment data, private address, personal document, commit, or push was created or changed.

## RT-AI-013 Remove Unsupported Website Credibility Claims

State: REVIEW

Objective: remove or neutralize unsupported public credibility claims from the current website and align public copy with owner-approved values from RT-AI-010 and credibility rules from RT-AI-011.

Type: UI/UX + CONTENT SAFETY. This future task is a small correction-only website task. It must not add new public credibility evidence, new testimonials, new ratings, new prices, new availability statements, new payment details, new guarantees, customer data, private addresses, personal documents, technical AI work, or data/model/backend scope.

Future implementation files allowed:
- `app/[locale]/layout.tsx`
- `app/[locale]/(public)/page.tsx`
- `components/testimonials.tsx`
- `components/about/security-section.tsx`
- `messages/en.json`
- `messages/pt.json`
- `messages/es.json`
- `messages/sv.json`
- `docs/ops/backlog.md`
- `docs/ops/execution-log.md`
- `docs/ops/session-handoff.md`
- `docs/ops/status.md`

Future correction scope:
- Remove or neutralize Cadastur claims.
- Remove or neutralize accredited, credentialed, licensed, or certified guide/team claims.
- Remove CNPJ-like public display.
- Remove hard-coded testimonials, customer names, customer quotes, star ratings, and review/rating labels.
- Remove or neutralize safety, insured, official, registered, guaranteed, or "safer" claims unless already approved.
- Remove fast-response claims if phrased as a guarantee.

Approved neutral wording allowed:
- "Rick Travel offers guided tours, local tourism experiences, personalized travel orientation, and traveler support in Rio de Janeiro, Brazil."
- "Support is available in Portuguese, Spanish, and English."
- "For quotes, reservations, schedules, payment, and final confirmation, contact the Rick Travel team through the approved public channels."

Rules:
- Testimonials must be removed entirely for this task, not replaced with testimonial-like placeholders.
- A neutral traveler-support section is allowed only if it contains no customer quote, rating, review count, ranking, or satisfaction claim.
- Cadastur and CNPJ-like content must be removed or hidden until credential validation and explicit owner approval exist.
- Public copy must stay aligned with approved brand, service base, languages, contact channels, general guided tours, local tourism experiences, and traveler support.

Out of scope:
- Do not add actual CNPJ values, Cadastur numeric values, guide credential identifiers, testimonials, ratings, prices, availability statements, payment details, guarantees, customer data, private addresses, personal documents, AI data-model work, chatbot work, RAG work, embeddings work, LangChain work, LangGraph work, API work, backend work, database work, seed files, JSON/YAML files, package files, lockfiles, or release/deployment scope.
- Do not modify website files during this READY opening.
- Do not modify product documents during this READY opening.
- Do not commit or push in this READY opening.

Validation required before REVIEW:
- `git status --short --untracked-files=all`
- `git status -sb`
- `git diff --name-only`
- `git diff --stat`
- `git diff --check`
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- Targeted forbidden-content search across changed public files for `CNPJ|Cadastur|credential|certified|licensed|registered|insured|official|safe|guarantee|testimonial|review|rating`.

Acceptance criteria:
- Unsupported Cadastur, CNPJ-like, credential, certification, testimonial, rating, safety, guarantee, and similar public credibility claims are removed or neutralized only within the allowed future files.
- Public copy uses approved neutral wording or existing owner-approved values only.
- No testimonials, customer names, customer quotes, star ratings, review counts, rankings, prices, availability confirmations, payment details, guarantees, customer data, private addresses, personal documents, or unapproved credential values are added.
- No app implementation beyond copy/content correction is introduced.
- No product document, package, lockfile, JSON/YAML, seed, API, backend, database, runtime, or technical AI file is changed.

Risk: medium. The main risk is accidentally replacing blocked claims with new unsupported claims instead of neutral approved wording.

Execution state: RT-AI-013 opened as READY in operational documentation only. No website file, product document, runtime file, implementation file, JSON, YAML, seed, API, backend, database, package file, lockfile, commit, or push was created or changed.

Evidence created: unsupported website credibility claims were removed or neutralized in the allowed website/content files, and operational documentation was updated.

Execution result: RT-AI-013 moved to REVIEW. Metadata, homepage copy, traveler-support section, security/support section, and locale messages were updated to remove or neutralize unsupported Cadastur, CNPJ-like, guide credential, certification, testimonial, rating, review, safety, insurance, guarantee, and related trust-claim wording. The public copy now uses neutral approved positioning around guided tours, local tourism experiences, personalized travel orientation, traveler support, approved public contact channels, and support in Portuguese, Spanish, and English. No product document, architecture document, package file, lockfile, JSON/YAML seed file, API, backend, database, technical AI file, actual CNPJ value, Cadastur numeric value, guide credential identifier, testimonial, rating, review, price, availability confirmation, payment detail, guarantee, customer data, private address, personal document, commit, or push was created or changed.

## RT-AI-015 Audit Remaining Public Risky Claims

State: READY

Objective: audit and clean remaining public-visible risky claims on the Rick Travel website after RT-AI-014 polished the public trust localization copy.

Type: MIXED, mostly code/copy. This READY opening is documentation-only.

Context:
- RT-AI-014 is Remote DONE at commit `b06b680c96ba23aacae4bbb2174705f0abade043`.
- RT-AI-014 changed only `messages/en.json`, `messages/es.json`, `messages/pt.json`, and `messages/sv.json`.
- The RT-AI-014 validation scan found remaining public-visible risky claims outside that task scope.

Future implementation files allowed:
- `components/hero-section.tsx`
- `components/footer.tsx`
- `components/trips/tour-detail-client.tsx`
- `components/trips/tour-media-badges.tsx`
- `components/trips/trip-card.tsx`
- `app/[locale]/(public)/page.tsx`
- `app/[locale]/(public)/contato/page.tsx`
- `messages/en.json`
- `messages/pt.json`
- `messages/es.json`
- `messages/sv.json`
- Optional: `components/about/why-choose-us.tsx` only for source hygiene if no public behavior changes are needed.

Known risky surfaces to audit:
- Hero badges and support copy that mention ratings, licensed guides, guide credentials, fast response, private tours, secure operation, or volume claims.
- Footer images, alt text, and card copy that mention Cadastur, official channels, secure forms, or safety-style wording.
- Contact page metadata and visible body copy that mention Cadastur, credentialed guides, local team, or safety-style wording.
- Home metadata that mentions private tours.
- Tour detail confidence copy that mentions licensed, certified, accredited, credentialed, or similar guide operations.
- Tour list card badges that render ratings, reviews, or booking-count social proof.

Future forbidden scope:
- No AI concierge, RAG, embeddings, LangChain, or LangGraph.
- No backend/API changes.
- No database changes.
- No schema/migration/seed changes.
- No package or lockfile changes.
- No deploy.
- No CNPJ, Cadastur number, credential number, testimonials, reviews, ratings, fake names, prices, availability guarantees, payment guarantees, "certified", "licensed", "official", "credentialed/credenciado", or equivalent credibility claims unless explicitly verified and approved in project docs.

Future validation criteria:
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- Repeat risky-term scan over `app components messages`.
- Confirm remaining hits are only internal/key-only or acceptable factual/service copy.
- Verify public home, contact, tour list cards, and tour detail no longer show unsupported credibility or social-proof claims.
- `git diff --check`
- Final evidence with changed files and confirmation no forbidden scope was touched.

Acceptance criteria:
- Remaining public-visible Cadastur, credential, certified, licensed, official, testimonial, review, rating, social-proof, guarantee, safety-style, fast-response, private-tour, and similar unsupported claims are removed or neutralized in the allowed future files only.
- Public copy remains commercially useful using approved neutral service wording only.
- No new unsupported credibility, social-proof, price, availability, payment, guarantee, customer, legal, or credential claim is introduced.
- Any remaining risky-term scan hits are explicitly classified as internal/key-only or acceptable factual/service copy.
- No implementation outside the allowed future files is introduced.

Risk: medium. The main risk is replacing unsupported public claims with different unsupported credibility or social-proof wording instead of neutral approved service copy.

Execution state: RT-AI-015 opened as READY in operational documentation only. No app file, component file, message file, product document, runtime file, implementation file, JSON, YAML, seed, API, backend, database, package file, lockfile, deploy, commit, or push was created or changed in this READY opening.

## RT-AI-016 Restore Approved Cadastur Trust Mark

State: READY

Objective: restore the owner-approved Cadastur trust mark in the footer without reverting RT-AI-015 and without changing broader public UI.

Type: RECOVERY UI/COPY. This READY opening is documentation-only.

Context:
- RT-AI-015 is Remote DONE at commit `782285aee0a0bc1db384ded060cf4b04954c135c`.
- RT-AI-015 removed remaining public risky claims, including the footer Cadastur mark.
- Owner feedback clarified that the Cadastur logo should not have been removed and is considered an important credibility asset for Rick Travel.
- Existing Cadastur assets are present at `public/cadastro/cadastur.png` and `public/images/seals/cadastur-official.png`.

Future implementation files allowed:
- `components/footer.tsx` only.

Future asset usage allowed:
- Use existing asset `public/cadastro/cadastur.png`; or
- Use existing asset `public/images/seals/cadastur-official.png`.

Future implementation scope:
- Restore Cadastur as a neutral trust mark in the footer trust area.
- Use neutral alt/copy such as "Cadastur", "Cadastro turistico", or "Registro turistico informado pela Rick Travel".
- Keep the RT-AI-015 cleanup intact for reviews, ratings, fake counters, "500+", testimonials, guarantees, and unsupported social proof.

Future forbidden scope:
- No hero redesign.
- No home layout changes.
- No contact page changes.
- No tour card changes.
- No tour detail changes.
- No booking flow changes.
- No admin changes.
- No messages changes unless separately authorized.
- No backend/API changes.
- No database changes.
- No schema/migration/seed changes.
- No AI Concierge, RAG, embeddings, LangChain, or LangGraph.
- No package or lockfile changes.
- No deploy.
- No fake Cadastur number.
- No reviews, ratings, fake counters, testimonials, guarantees, "500+", or unsupported social proof.
- No Ministerio do Turismo wording unless explicitly owner-approved.
- No "oficial", "licenciado", "certificado", "garantido", or equivalent expanded legal/credential claim unless explicitly owner-approved.

Future validation criteria:
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `git diff --check`
- Confirm changed files are limited to `components/footer.tsx`.
- Confirm the restored footer mark uses an existing Cadastur asset and neutral approved wording only.
- Confirm no RT-AI-015 removed risky claims were restored.

Acceptance criteria:
- Footer displays the approved Cadastur trust mark again.
- No broader UI, route, booking, admin, data, package, database, AI, or deploy scope is changed.
- No Cadastur number, fake credential, legal expansion, official/ministry wording, certification/licensing claim, guarantee, testimonial, review, rating, fake counter, or social-proof claim is added.

Risk: low to medium. The main risk is restoring the mark with expanded unsupported legal or official wording instead of a neutral owner-approved trust mark.

Execution state: RT-AI-016 opened as READY in operational documentation only. No app file, component file, message file, image asset, product document, runtime file, implementation file, JSON, YAML, seed, API, backend, database, schema, package file, lockfile, deploy, commit, or push was created or changed in this READY opening.

## RT-UX-001D Auditar rotas/locales e SEO multilingue

State: REVIEW

Objective: audit public multilingual routes and SEO structure before typography, visual hierarchy, design polish, route fixes, or metadata fixes.

Type: DOCUMENTATION-ONLY AUDIT.

Evidence file:
- `docs/validation/multilingual-routes-seo-audit-001d.md`

Scope executed:
- Audited `/pt`, `/en`, `/es`, `/sv`, `/sitemap.xml`, and `/robots.txt`.
- Inspected `app/[locale]`, `proxy.ts`, `i18n/routing.ts`, `i18n/request.ts`, `messages/*.json`, `app/sitemap.ts`, `app/robots.ts`, and relevant metadata/link usage.
- Ran local route checks through `http://127.0.0.1:3217`.
- Ran production route checks against `https://rick-travel.vercel.app`.
- Inspected rendered production HTML for `lang`, `title`, `description`, canonical, Open Graph URL, and alternate links.
- Inspected rendered production internal hrefs for locale preservation.

Execution result:
- Local and production home routes for `pt`, `en`, `es`, and `sv` return `200`.
- Production `/en` 404 was not reproducible in this audit; current `/en` returns `200` with no redirect.
- Sitemap and robots return `200` in local and production.
- Sitemap includes static and tour URLs for all four locales.
- Canonicals are present per locale.
- `hreflang`, `alternates.languages`, and `x-default` are missing.
- Some public code still uses raw `next/link` with unprefixed hrefs.
- Non-PT locales use Portuguese slugs for static pages.

Recommended future task when explicitly authorized:
- Fix multilingual SEO and locale-link consistency by adding shared canonical/alternate helpers, `hreflang`/`x-default`, page-level metadata gaps, contact metadata localization, and locale-aware links where needed. Do not open that task automatically.

Restrictions preserved:
- No design, typography, hero/card/footer visual, copy polish, route fix, metadata fix, package, lockfile, dependency, deployment, database, READY task, commit, or push was performed.

## RT-UX-001E Corrigir SEO multilingue basico

State: REVIEW

Objective: implement the minimal multilingual SEO correction for Rick Travel without changing visual design, Home video, route architecture, package files, deployment configuration, or product flows.

Evidence file:
- `docs/validation/multilingual-seo-fix-001e.md`

Scope executed:
- Added canonical/alternate helpers in `i18n/routing.ts`.
- Added `alternates.languages` and `x-default` to public page metadata.
- Added sitemap alternate language links with absolute URLs.
- Added minimal `quem-somos` metadata for canonical, alternates, and `og:url`.
- Replaced minimal raw public `next/link` usages with the existing locale-aware `Link` wrapper.
- Documented that PT slugs in non-PT locales remain unchanged in this task.

Validation:
- Starting HEAD and `origin/main`: `f42c707`.
- `npm.cmd run lint`: PASS.
- `npm.cmd run typecheck`: PASS.
- Local `/pt`, `/en`, `/es`, `/sv`, `/sitemap.xml`, and `/robots.txt`: PASS `200`.
- Rendered metadata includes canonical, alternates for `en`, `pt`, `es`, `sv`, and `x-default`.
- Sitemap XML includes `xhtml:link` alternate URLs for all locales and `x-default`.
- `git diff --check`: PASS with known LF/CRLF warnings only.

Decision:
- Keep existing slugs such as `/en/quem-somos` and `/en/contato` because localized slugs require a route architecture and redirect strategy outside RT-UX-001E.

Restrictions preserved:
- No Home video removal, typography, visual hierarchy, hero/card/footer design, broad copy rewrite, package/lockfile, dependency install, deploy, AI Concierge, booking/payment/user/admin, `.agents/`, `skills-lock.json`, new READY task, commit, or push.

## RT-UX-001F Remover video da Home e substituir por visual leve

State: REVIEW

Objective: remove the Home hero video and replace it with a lightweight visual solution while preserving the current layout and premium tourism positioning.

Evidence file:
- `docs/validation/home-video-removal-001f.md`

Scope executed:
- Removed Home hero `<video>` usage from `components/hero-section.tsx`.
- Replaced it with `next/image` using the existing static asset `public/videos/imagem-rio-perfil.jpg`.
- Preserved Home copy, CTA behavior, routes, SEO metadata, locale behavior, and layout structure.
- Kept video files in place; no asset deletion was performed.

Validation:
- Starting HEAD and `origin/main`: `b4bc556`.
- Local `/pt`, `/en`, `/es`, `/sv`: PASS `200`.
- Desktop Playwright smoke: video count `0`, hero image loaded, no horizontal overflow, H1 and primary CTA visible.
- Mobile Playwright smoke: video count `0`, hero image loaded, no horizontal overflow, H1 and primary CTA visible.
- `npm.cmd run lint`: PASS.
- `npm.cmd run typecheck`: PASS.
- `git diff --check`: PASS with known LF/CRLF warnings only.

Restrictions preserved:
- No multilingual SEO changes, route/locale changes, typography overhaul, full Home redesign, package/lockfile changes, dependency install, deploy, `.agents/`, `skills-lock.json`, commit, or push.

## RT-UX-001G Simplificar Hero da Home

State: REVIEW

Objective: Simplify the Home hero visually by removing redundant badges and improving copy clarity across all supported languages.

Evidence file:
- `docs/validation/home-hero-simplification-001g.md`

Scope executed:
- Removed top "Atendimento humano" badge from `components/hero-section.tsx`.
- Removed `SupportBar` and its three bottom badges from `components/hero-section.tsx`.
- Shortened search helper text in `components/hero-search.tsx`.
- Improved H1 description and button copy in `messages/*.json` for better clarity and less repetition.
- Maintained commercial intent (guided tours, human support, WhatsApp).
- Fixed unused imports (`ShieldCheck`, `MapPin`) in `components/hero-section.tsx`.

Validation:
- Starting HEAD and `origin/main`: `d7142b6`.
- Local `/pt`, `/en`, `/es`, `/sv`: PASS `200`.
- `npm.cmd run lint`: PASS.
- `npm.cmd run typecheck`: PASS.
- Playwright desktop 1440x900: PASS (badges removed, H1/CTA/Search visible, no overflow).
- Playwright mobile 390x844: PASS (badges removed, H1/CTA/Search visible, no overflow).
- `git diff --check`: PASS with known LF/CRLF warnings only.

Restrictions preserved:
- No changes to `.agents/` or `skills-lock.json`.
- No route, SEO metadata, sitemap, locale config, or auth changes.
- No package/lockfile changes or new dependencies.
- No commit or push performed.
