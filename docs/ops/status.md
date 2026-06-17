# Status Operacional - Rick Travel

## Update 2026-06-17 - RT-AI-018A Approved AI Knowledge Records Contract

State: REVIEW.

RT-AI-018A created the official documentation-only product contract for approved Rick Travel AI knowledge records.

Product contract:
- `docs/product/ai-concierge-approved-knowledge-records-contract.md`

Result:
- Defined the purpose of approved AI knowledge records.
- Documented websiteAllowed vs aiAllowed vs ragAllowed distinctions.
- Defined source authority, record identity, locale/language handling, topic/category classification, approval status, risk level, usage permissions, blocked content, human handoff rules, and source grounding requirements.
- Documented handling of volatile facts: prices, availability, schedules, guarantees, payments, and commercial promises.
- Defined behavior for unknown or unsupported answers.
- Defined migration path to future structured records without implementing JSON/YAML/database records.
- Aligned the contract with future retrieval, evaluation, and AI Backend architecture from RT-AI-017.

Restrictions preserved:
- No backend, API route, database schema, migration, seed, JSON/YAML data file, dependency, package file, lockfile, LangChain, LangGraph, embedding, vector store, frontend, app, component, message, public asset, Prisma, config, deploy, `.agents/`, `skills-lock.json`, broad git add, commit, or push change was made.

---

## Update 2026-06-17 - RT-AI-018A Approved AI Knowledge Records Contract READY

State: READY.

RT-AI-018A was opened as a documentation-only contract task to define approved AI knowledge record rules before any structured records, retrieval, embeddings, or runtime implementation.

Future objective:
- Define the contract for approved AI knowledge records that the future Rick Travel AI Concierge may use for answers, retrieval, source grounding, evaluation, and human handoff rules.

Future contract focus:
- Source authority, locale, topic/category, approval status, risk level, usage permissions, blocked content, and source references.
- Explicit permission distinctions: websiteAllowed, aiAllowed, ragAllowed, handoffRequired, sourceRequired, and ownerReviewRequired.
- Handling of volatile facts such as price, schedule, availability, guarantees, commercial promises, booking confirmation, safety, cancellation, accessibility, private tours, and WhatsApp handoff.
- Migration path to future JSON/YAML/database records without implementing those records now.

Restrictions preserved in this READY opening:
- No product contract document, backend, API route, database schema, migration, seed, JSON/YAML data file, dependency, package file, lockfile, LangChain, LangGraph, embedding, vector store, frontend, app, component, message, deploy, `.agents/`, `skills-lock.json`, commit, or push changes were made beyond allowed operational documentation.

---

## Update 2026-06-17 - RT-AI-017 Robust AI Concierge Architecture

State: REVIEW.

RT-AI-017 created the documentation-only architecture for the Rick Travel AI Concierge robust backend and learning path.

Architecture document:
- `docs/architecture/ai-concierge-robust-backend-learning-architecture.md`

Result:
- Justified a separate AI Backend and separate AI Database.
- Recommended Python + FastAPI over Node.js + NestJS for this project, while preserving the current Next.js site as the product frontend.
- Defined conceptual topology with future vector store, WhatsApp handoff, and logs/evaluations layer.
- Defined conceptual AI data entities without creating a real schema.
- Documented RAG vs fine-tuning, human curation, evaluation datasets, LangChain/LangGraph positioning, API contract, safety rules, and phased roadmap.

Restrictions preserved:
- No backend, API route, database, migration, seed, embedding, dependency install, package file, lockfile, frontend file, app file, component, message, public asset, Prisma file, config file, JSON/YAML data file, deploy, commit, push, `.agents/`, or `skills-lock.json` change was made by this execution.

---

## Update 2026-06-16 - RT-AI-017 Robust AI Concierge Architecture READY

State: READY.

RT-AI-017 was opened as a documentation-only architecture task to define a robust technical scaffold for the Rick Travel AI Concierge.

Future objective:
- Define the robust architecture with separate backend, separate database, API contract, and a clear learning path (RAG first, potential fine-tuning later).

Future architecture focus:
- Topology: separate AI backend and database.
- Stack: Python/FastAPI vs Node/NestJS evaluation.
- Learning: RAG + curation + logs + evaluation datasets.
- Orchestration: LangChain and LangGraph positioning.
- API: Conceptual contract for site-agent communication.
- Safety: Technical guardrails against hallucinations and data exposure.

Restrictions preserved in this READY opening:
- No app, component, message, image, product document, runtime, implementation, JSON, YAML, seed, API, backend, database, schema, package, lockfile, deploy, commit, or push changes were made beyond allowed operational documentation.

---

## Update 2026-06-16 - RT-UX-001G Home Hero Simplification

State: REVIEW.

RT-UX-001G simplified the Home hero visually by removing redundant badges and improving copy clarity across all supported languages.

Evidence file:
- `docs/validation/home-hero-simplification-001g.md`

Result:
- Removed top "Atendimento humano" badge from `components/hero-section.tsx`.
- Removed `SupportBar` and its three bottom badges from `components/hero-section.tsx`.
- Shortened search helper text in `components/hero-search.tsx`.
- Improved H1 description and button copy in `messages/*.json` for better clarity and less repetition.
- Maintained commercial intent (guided tours, human support, WhatsApp).
- Preserved route behavior, SEO metadata, locale behavior, and static hero image structure.

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

---

## Update 2026-06-16 - RT-UX-001F Home Video Removal

State: REVIEW.

RT-UX-001F removed the public Home hero video and replaced it with a lightweight static visual using the existing image `public/videos/imagem-rio-perfil.jpg`.

Evidence file:
- `docs/validation/home-video-removal-001f.md`

Result:
- Removed `<video>` usage from `components/hero-section.tsx`.
- Removed direct hero references to `newhero.mp4`, `poster=`, `preload=`, and `autoPlay`.
- Added `next/image` for the static hero visual.
- Preserved Home copy, CTAs, route behavior, SEO metadata, locale behavior, and current layout structure.
- Video files were not deleted.

Validation:
- Starting HEAD and `origin/main`: `b4bc556`.
- Static image exists: `public/videos/imagem-rio-perfil.jpg`.
- Local `/pt`, `/en`, `/es`, `/sv`: PASS `200`.
- Playwright desktop 1440x900: video count `0`, hero image loaded, no horizontal overflow, H1 and primary CTA visible.
- Playwright mobile 390x844: video count `0`, hero image loaded, no horizontal overflow, H1 and primary CTA visible.
- `npm.cmd run lint`: PASS.
- `npm.cmd run typecheck`: PASS.
- `git diff --check`: PASS with known LF/CRLF warnings only.

Restrictions preserved:
- No multilingual SEO, route/locale, typography overhaul, full Home redesign, package/lockfile, dependency, deploy, `.agents/`, or `skills-lock.json` changes.

---

## Update 2026-06-16 - RT-UX-001E Basic Multilingual SEO Fix

State: REVIEW.

RT-UX-001E implemented the minimal multilingual SEO correction after RT-UX-001D Remote DONE at commit `f42c707`.

Evidence file:
- `docs/validation/multilingual-seo-fix-001e.md`

Result:
- Added shared locale helpers in `i18n/routing.ts`.
- Added `alternates.languages` and `x-default` to public metadata for home, tours, tour detail, contato, and quem-somos.
- Added absolute alternate language URLs to `sitemap.xml`.
- Preserved per-locale canonical URLs.
- Added minimal `quem-somos` metadata for canonical, alternates, and route-specific `og:url`.
- Replaced a small set of raw public `next/link` usages with the existing locale-aware `Link` wrapper.
- Kept PT slugs in non-PT locales by scope decision; no route architecture change was made.

Validation:
- Starting HEAD and `origin/main`: `f42c707`.
- `npm.cmd run lint`: PASS.
- `npm.cmd run typecheck`: PASS.
- Local `/pt`, `/en`, `/es`, `/sv`, `/sitemap.xml`, and `/robots.txt`: PASS `200`.
- Rendered metadata includes canonical, `en`, `pt`, `es`, `sv`, and `x-default` alternates.
- Local sitemap includes `xhtml:link` alternates with absolute URLs.
- `git diff --check`: PASS with known LF/CRLF warnings only.

Restrictions preserved:
- No Home video, typography, visual hierarchy, hero/card/footer design, broad copy rewrite, package, lockfile, dependency, deploy, AI Concierge, booking, payment, user, admin, `.agents/`, or `skills-lock.json` changes.

---

## Update 2026-06-16 - RT-UX-001D Multilingual Routes and SEO Audit

State: REVIEW.

RT-UX-001D was executed as a documentation-only audit before any typography, hierarchy, visual, route, or metadata change.

Evidence file:
- `docs/validation/multilingual-routes-seo-audit-001d.md`

Result:
- Local `/pt`, `/en`, `/es`, `/sv`, `/sitemap.xml`, and `/robots.txt` returned `200`.
- Production `/pt`, `/en`, `/es`, `/sv`, `/sitemap.xml`, and `/robots.txt` returned `200`.
- Production `/en` 404 was not reproduced on 2026-06-16; current `/en` returns `200` with no redirect.
- `proxy.ts` exists and runs `next-intl` routing; no `middleware.ts` exists.
- Sitemap publishes static and tour URLs for `en`, `pt`, `es`, and `sv`.
- Canonicals render per locale, but no `hreflang`, `alternates.languages`, or `x-default` are emitted.
- Some public code still uses raw `next/link` with unprefixed hrefs, creating locale consistency risk outside the rendered home-link sample.
- Non-PT locales currently use Portuguese slugs such as `/en/quem-somos` and `/en/contato`.

Restrictions preserved:
- No design, typography, hero, card, footer, copy polish, route fix, metadata fix, package, lockfile, dependency, deploy, READY task, commit, database, or code change was made.

---

## Update 2026-06-09 - RT-AI-016 Restore Approved Cadastur Trust Mark READY

State: READY.

RT-AI-016 was opened as a narrow recovery task after RT-AI-015 Remote DONE at commit `782285aee0a0bc1db384ded060cf4b04954c135c`.

Future objective:
- Restore the owner-approved Cadastur trust mark in the footer without reverting RT-AI-015 and without changing broader public UI.

Future allowed implementation scope:
- `components/footer.tsx` only.
- Existing Cadastur asset `public/cadastro/cadastur.png` or `public/images/seals/cadastur-official.png`.

Future copy/alt direction:
- Use neutral wording such as "Cadastur", "Cadastro turistico", or "Registro turistico informado pela Rick Travel".

Future forbidden scope:
- No hero redesign, home layout change, contact page change, tour card change, tour detail change, booking flow change, admin change, messages change unless separately authorized, backend/API, database, schema/migration/seed, AI Concierge, RAG, embeddings, LangChain, LangGraph, package/lockfile, deploy, fake Cadastur number, reviews, ratings, fake counters, testimonials, guarantees, "500+", unsupported social proof, Ministerio do Turismo wording unless explicitly owner-approved, or "oficial", "licenciado", "certificado", "garantido", or equivalent expanded legal/credential claim unless explicitly owner-approved.

Future validation:
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `git diff --check`
- Confirm changed files are limited to `components/footer.tsx`.
- Confirm no RT-AI-015 removed risky claims were restored.

Restrictions preserved in this READY opening:
- No app, component, message, image, product document, runtime, implementation, JSON, YAML, seed, API, backend, database, schema, package, lockfile, deploy, commit, or push changes were made beyond allowed operational documentation.

---

## Update 2026-06-09 - RT-AI-015 Remaining Public Risky Claims READY

State: READY.

RT-AI-015 was opened as a small mixed code/copy task after RT-AI-014 Remote DONE at commit `b06b680c96ba23aacae4bbb2174705f0abade043`.

Future objective:
- Audit and clean remaining public-visible risky claims from the website surfaces that were outside RT-AI-014 scope.

Future allowed implementation files:
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

Future correction scope:
- Remove or neutralize unsupported public-visible claims involving Cadastur, guide credentials, licensed/certified/official wording, ratings, reviews, booking-count social proof, guarantees, safety-style wording, fast-response claims, private-tour positioning, local-team claims, and equivalent credibility claims unless explicitly verified and approved in project docs.

Future validation:
- `npm.cmd run lint`
- `npm.cmd run typecheck`
- Repeat risky-term scan over `app components messages`.
- Confirm remaining hits are only internal/key-only or acceptable factual/service copy.
- Verify public home, contact, tour list cards, and tour detail no longer show unsupported credibility or social-proof claims.
- `git diff --check`

Restrictions preserved in this READY opening:
- No app, component, message, product document, runtime, implementation, JSON, YAML, seed, API, backend, database, schema, package, lockfile, deploy, commit, or push changes were made beyond allowed operational documentation.
- No actual CNPJ value, Cadastur number, credential number, testimonial, review, rating, fake name, price, availability guarantee, payment guarantee, or unapproved credibility claim was added.

---

## Update 2026-06-08 - RT-AI-013 Remove Unsupported Website Credibility Claims

State: REVIEW.

RT-AI-013 was executed locally as the first controlled website correction after the approved-values audit.

Files changed:
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

Content result:
- Metadata and homepage descriptions now use neutral approved positioning.
- Hard-coded testimonials, customer names, customer quotes, and star UI were removed from the former testimonial section.
- The replacement section is neutral traveler-support content only.
- Cadastur seal content and CNPJ-like public display were removed from the security/support section.
- Locale messages were updated to remove or neutralize unsupported credibility and social-proof wording used by the changed surfaces.

Restrictions preserved:
- No product document, architecture document, package file, lockfile, JSON/YAML seed file, API, backend, database, technical AI file, commit, or push was created or changed.
- No actual CNPJ value, Cadastur numeric value, guide credential identifier, testimonial, rating, review, price, availability confirmation, payment detail, guarantee, customer data, private address, personal document, or unapproved credential value was added.

---

## Update 2026-06-08 - RT-AI-013 Remove Unsupported Website Credibility Claims READY

State: READY.

RT-AI-013 was opened as a small correction-only website content safety task after RT-AI-012 Remote DONE at commit `490bc01`.

Future objective:
- Remove or neutralize unsupported public credibility claims from current website copy and align public copy with owner-approved values from RT-AI-010 and credibility rules from RT-AI-011.

Future allowed implementation files:
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
- Remove or neutralize Cadastur claims, accredited/credentialed/licensed/certified guide or team claims, CNPJ-like public display, hard-coded testimonials, customer names, customer quotes, star ratings, review/rating labels, safety, insured, official, registered, guaranteed, or "safer" claims unless already approved.
- Use only approved neutral wording for guided tours, local tourism experiences, personalized travel orientation, traveler support in Rio de Janeiro, Brazil, and support in Portuguese, Spanish, and English.

Restrictions preserved in this READY opening:
- No website, app, component, messages, product document, runtime, implementation, JSON, YAML, seed, API, backend, database, package, lockfile, release/deployment, commit, or push changes were made.
- No actual CNPJ value, Cadastur numeric value, guide credential identifier, testimonial, rating, price, availability statement, payment detail, guarantee, customer data, private address, personal document, or unapproved credential value was added.

---

## Update 2026-06-08 - RT-AI-012 Website Approved Values Audit Documentation

State: REVIEW.

RT-AI-012 was executed locally as a documentation-only website/content audit.

File created:
- `docs/product/ai-concierge-website-approved-values-audit.md`

Audit result:
- `PASS_WITH_REVIEW_ITEMS`.

Content registered:
- Source documents reviewed for approved public business values and credibility evidence rules.
- Website file groups inspected under `app/**`, `components/**`, and `messages/**`.
- Approved website-safe values recorded: Rick Travel, Rio de Janeiro, Brazil, Portuguese, Spanish, English, public WhatsApp, public email, Instagram, institutional positioning, guided tours, local tourism experiences, and traveler support.
- Current aligned content recorded for brand, Rio de Janeiro positioning, approved email, approved Instagram, general guided-tour positioning, and assisted booking/support language.
- Review items recorded for Cadastur, guide credential, certification, safety, testimonial, rating, review, price, availability, payment, guarantee, trust-badge, and CNPJ-like website content.

Restrictions preserved:
- No website code, component, app file, message file, style file, architecture document, runtime file, implementation file, JSON, YAML, seed, API, frontend, backend, database, package file, lockfile, production release action, commit, or push was created or changed.
- No actual CNPJ value, Cadastur number, guide credential identifier, personal document, private address, customer data, payment data, testimonial value, rating approval, price approval, availability approval, guarantee, or credential value was added.

---

## Update 2026-06-08 - RT-AI-012 Website Approved Values Audit READY

State: READY.

RT-AI-012 was opened as a documentation-only audit task after RT-AI-011 Remote DONE at commit `7b231bc`.

Future objective:
- Audit current website copy and content against approved public business values, public credibility evidence scope, blocked/pending credibility claims, and AI/human handoff rules.

Future scope:
- Identify website content that is safe and approved.
- Identify website content that should be removed.
- Identify website content that should be rewritten.
- Identify website content that must remain blocked or pending.
- Identify website areas that need later implementation only after separate review.

Restrictions preserved:
- No website code, components, app files, message files, product documents, architecture documents, runtime files, implementation files, JSON, YAML, seed, API, frontend, backend, database, AI technical assets, deploy files, package files, lockfiles, commit, or push were created or changed in this READY opening.
- No actual CNPJ values, Cadastur numeric values, guide credential identifiers, personal documents, private addresses, customer information, payment information, testimonials, ratings, review counts, rankings, prices, availability statements, guarantees, or credential values were added.

---

## Update 2026-06-08 - RT-AI-011 Public Credibility Evidence Approval Scope READY

State: READY.

RT-AI-011 was opened as the next documentation-only task after RT-AI-010 Remote DONE at commit `8c1f388`.

Future objective:
- Define safe public credibility evidence approval scope for Rick Travel before any website expansion, AI Concierge use, ingestion, runtime, or implementation work.

Future scope:
- CNPJ / legal entity reference.
- Cadastur company registration.
- Guide credentials, handled separately from company credentials.
- Official public business identity.
- Public trust badges.
- Testimonials, social proof, ratings, rankings, and customer quotes.
- Verified, certified, licensed, registered, insured, or similar claims.
- What the future AI Concierge may or may not say about credentials.

Required future rules:
- CNPJ and Cadastur remain `PENDING_OWNER_APPROVAL` or `BLOCKED` by default until exact official evidence and explicit owner approval are recorded.
- CNPJ and Cadastur are verification-first values by default; public display requires separate approval of exact value, source, wording, review date, and usage flags.
- Guide credentials must be handled separately from company credentials.
- Website approval does not automatically imply AI Concierge approval.
- Public, website, and AI permissions must remain separate explicit decisions.
- The AI Concierge must hand off legal/tax/credential disputes, document requests, stale evidence, missing evidence, conflicting evidence, and named guide certification questions.

Restrictions preserved:
- No product document was modified in this READY opening.
- No actual CNPJ value, Cadastur number, guide document, personal document, private address, customer data, payment data, testimonial, price, availability, guarantee, or credential value was added.
- No JSON, YAML, seed, API, frontend, backend, database, RAG, embeddings, LangChain, LangGraph, chatbot, deploy, package file, lockfile, runtime file, implementation file, commit, or push was created or changed.

---

## Update 2026-06-08 - RT-AI-011 Public Credibility Evidence Approval Scope Documentation

State: REVIEW.

RT-AI-011 was executed locally as a documentation-only product task to define public credibility evidence approval scope for Rick Travel.

File created:
- `docs/product/ai-concierge-public-credibility-evidence-approval-scope.md`

Content registered:
- Purpose and relationship to approved public business evidence values, verified business evidence records, prompt contract, and answer matrix.
- Credibility categories for CNPJ/legal identity, Cadastur, guide credentials, official public identity, trust badges, testimonials/social proof, and verified/certified/licensed/registered/insured claims.
- Default status of credibility evidence as `PENDING_OWNER_APPROVAL` or `BLOCKED`.
- Website approval requirements, including owner approval, exact value confirmation, source authority, review date, approved wording, risk level, and explicit `websiteAllowed=true`.
- Future AI Concierge approval rules requiring explicit `aiAllowed=true` and handoff for missing, stale, disputed, pending, blocked, conflicting, private, or ambiguous evidence.
- CNPJ as verification-first by default, with no public display approved in this task.
- Cadastur as pending until official evidence, owner approval, exact wording, and review date exist.
- Guide credentials separated from company credentials, with named guide certification questions requiring human handoff.
- Trust badge, claim, testimonial, social proof, and required record-field rules.

Restrictions preserved:
- No actual CNPJ value, Cadastur number, guide credential identifier, personal document, private address, customer data, payment data, testimonial, price, availability, guarantee, or actual credential value was added.
- No runtime, implementation, JSON, YAML, seed, API, frontend, backend, database, RAG, embeddings, LangChain, LangGraph, chatbot, deploy, package file, lockfile, commit, or push was created or changed.

---

Data: 2026-05-06

## Protocolo Rick

Fase atual: Fase 3 - Operacao publica controlada do MVP.

Status da fase: IN_PROGRESS.

Leitura objetiva da fase:

- deploy tecnico concluido;
- MVP publico publicado na Vercel;
- build estabilizado;
- runtime inicial validado ate o ponto atual;
- decisao Admin Discussion Gate: B) Reconstruir Admin MVP minimo e seguro;
- Mercado Pago continua fora do escopo atual.

Fase 1 permanece: REVIEW.

## Atualizacao 2026-05-14 - RT-FINAL-04C2B + RT-FINAL-04C3 Production Closure

RT-FINAL-04C2B Estado: Remote DONE — commit `0d9e0c5 fix: reconcile final catalog schedule updates` publicado em `origin/main`; smoke de producao completo PASS; P2 registrado; documentacao de closure Local DONE — push pendente.

RT-FINAL-04C3 Estado: Production DONE by Trigger — seed executado em producao; catalogo de 6 tours publicado; smoke completo PASS pelo Trigger; documentacao de closure Local DONE — push pendente.

Smoke de producao completo validado pelo Trigger (2026-05-14):
- Seed executado em producao sem erro PASS.
- /pt/tours mostra exatamente 6 tours publicados PASS.
- seed-001-cristo-dona-marta ausente do catalogo publico e de /api/trips PASS.
- Todos os 6 detalhes de tour publicado retornam HTTP 200 PASS.
- Todos os 6 precos e imagens corretos PASS.
- Assets de imagem retornam HTTP 200 PASS.
- /pt/admin anonimo redireciona para login PASS.
- /pt/login retorna HTTP 200 PASS.
- /pt/register retorna HTTP 200 PASS.
- /pt/contato retorna HTTP 200 PASS.
- /pt/quem-somos retorna HTTP 200 PASS.
- Mobile catalog layout com 6 cards sem quebra visual (validado manualmente pelo Trigger) PASS.
- Booking publico submetido com sucesso de tour publicado (validado manualmente pelo Trigger) PASS.
- Booking submetido aparece no admin (validado manualmente pelo Trigger) PASS.

Pendencia P2 registrada:
- `TourDetailsPage` usa `findUnique` sem filtro `isPublished` — URL direta de tour despublicado (`/pt/tours/seed-001-cristo-dona-marta`) retorna HTTP 200 e exibe CTA. Tour nao aparece em nenhuma superficie navegavel publica, mas URL direta funciona. Correcao registrada em RT-FINAL-HARDENING-01; nao corrigir dentro desta closure.

---

## Atualizacao 2026-05-14 - RT-FINAL-04C2 Add Final Catalog Assets and Seed Definition

Estado: Local REVIEW - aguardando aprovacao do Trigger para commit; sem seed em producao, sem deploy.

Objetivo: adicionar os 2 assets obrigatorios e preparar seed definitivo do catalogo final de 6 tours sem alterar banco.

Resultado local:
- `public/images/trips/imagem-helicoptero-cristo.jpg` adicionado (convertido de PNG RGBA para JPEG, 1792x2390, 712KB).
- `public/images/trips/imagem-floresta-tijuca.jpg` adicionado (convertido de PNG RGBA para JPEG, 2352x1792, 1.7MB).
- `prisma/seed.ts` reescrito com catalogo final de 6 tours:
  - seed-001-cristo-dona-marta: despublicado via updateMany (nao deletado).
  - seed-002-pao-de-acucar: upsert alinhado, precos e imagem corrigidos.
  - seed-003-selaron-lapa: upsert novo.
  - seed-004-centro-porto: upsert novo.
  - seed-005-favela-rocinha: upsert novo.
  - seed-006-floresta-tijuca: upsert novo.
  - seed-007-helicoptero-cristo: upsert novo.
  - Schedules idempotentes para cada tour ativo (+90/+95/+100/+105/+110 dias).
- Documentacao operacional atualizada.

Restricoes mantidas:
- Seed NAO foi executado.
- DATABASE_URL de producao NAO foi usada.
- Banco NAO foi alterado.
- Schema Prisma NAO foi alterado.
- Nenhuma migration executada.
- Nenhuma UI alterada.
- Nenhum deploy executado.
- Nenhum commit ou push executado.
- RT-FINAL-04C3 nao foi aberta automaticamente.

---

## Atualizacao 2026-05-13 - RT-FINAL-04B Public Commercial Trust Baseline

Estado: Local REVIEW - aguardando revisao do Trigger; sem commit e sem push.

Objetivo: melhorar a camada publica de confianca, clareza comercial e contato direto sem criar tours, banco, pagamento ou deploy.

Resultado local:
- Footer remove link publico confuso para `Reservas`.
- Footer destaca WhatsApp oficial, formulario seguro e pre-reserva manual.
- Pagina de contato destaca WhatsApp oficial, formulario com e-mail/telefone de retorno e ausencia de pagamento online nesta versao.
- Detalhe de tour e CTA de reserva passam a reforcar pre-reserva com confirmacao manual antes de pagamento.
- Login/register deixam de sugerir inicio ou acompanhamento de pagamento online.
- Redes sociais nao foram adicionadas porque nao ha URLs reais confirmadas.
- E-mail publico direto nao foi inventado; o canal de e-mail segue via formulario ate o owner confirmar um endereco publico.

Restricoes mantidas:
- Nenhum tour criado.
- Nenhum banco alterado.
- Nenhum seed ou migration executado.
- Nenhum pagamento online implementado.
- Nenhuma integracao Mercado Pago/Stripe alterada.
- Nenhuma auth ou admin flow alterado.
- Nenhum deploy, commit ou push executado.
- RT-FINAL-04C nao foi aberta.

---

## Atualizacao 2026-05-13 - RT-FINAL-03A Validate Admin Booking Actions in Production

Estado: Manual production validation DONE by Trigger; documentacao local pendente de commit autorizado.

Objetivo: validar em producao que o admin minimo consegue operar reservas controladas sem erro visivel.

Resultado observado pelo Trigger:
- Admin login PASS.
- Pagina de reservas admin PASS.
- Lista de reservas visivel PASS.
- Reserva CONFIRMED visivel PASS.
- Reserva PENDING visivel PASS.
- Reserva CANCELED visivel PASS.
- Confirm/cancel admin flow validated manually by Trigger.
- Nenhum erro visivel reportado no navegador.

Restricoes mantidas:
- Nenhum codigo alterado.
- Nenhum README alterado.
- Nenhuma imagem alterada ou screenshot commitado.
- Nenhum schema alterado.
- Nenhuma migration executada.
- Nenhum seed executado.
- Nenhum env alterado.
- Nenhum banco alterado pelo agente.
- Nenhum deploy manual executado.
- Nenhum commit ou push executado nesta atualizacao.
- Nenhuma nova READY promovida automaticamente.

---

## Atualizacao 2026-05-13 - RT-FINAL-00A Align Operational Docs With Remote Reality

Estado: Local DONE - commit documental autorizado pelo Trigger.

Objetivo: corrigir documentacao operacional para refletir estado real do Git e da producao apos auditoria RT-FINAL-00.

Divergencias identificadas pela auditoria (RT-FINAL-00, 2026-05-13):
- RT-022A declarada "REVIEW local, sem commit" em todos os docs operacionais; Git prova commit `b0e4d4a` publicado em `origin/main` desde 2026-05-01.
- RT-023A declarada "REVIEW local, aguardando autorizacao" em todos os docs operacionais; Git prova commit `67584b6` publicado em `origin/main` desde 2026-05-06.

Restricoes mantidas:
- Nenhum codigo da aplicacao alterado.
- Nenhum schema Prisma alterado.
- Nenhuma migration executada.
- Nenhum seed executado.
- Nenhum env alterado.
- Nenhum banco alterado.
- Nenhum deploy executado.

---

## Atualizacao 2026-05-06 - RT-023A Portfolio README Showcase

Estado: DONE remoto - commit `67584b6 docs: create Rick Travel portfolio README showcase` publicado em `origin/main` em 2026-05-06.

Nota de reconciliacao (RT-FINAL-00A): os documentos operacionais declaravam esta task como "REVIEW local, aguardando autorizacao de commit". O Git prova que o commit foi publicado. Esta entrada e corrigida para refletir o estado real.

Objetivo: criar uma vitrine profissional de portfolio para o README principal do Rick Travel, alinhada ao padrao Protocolo Rick e aos projetos de referencia do Ricardo.

Resultado local:

- `README.md` reescrito em ingles com foco em produto real, status de producao, fluxos validados, arquitetura, stack, desenvolvimento local, limitacoes e autoria.
- Imagem principal copiada para `docs/assets/rick-travel-hero.png`.
- README referencia somente caminho relativo do repositorio para a imagem.
- Task limitada a documentacao e asset de portfolio.
- Validacao documental local concluida: escopo do diff restrito aos arquivos autorizados, `git diff --check` PASS com avisos LF/CRLF conhecidos, README sem caminho local Windows e sem segredos.

Restricoes mantidas:

- Nenhum codigo da aplicacao alterado.
- Nenhum schema Prisma alterado.
- Nenhuma migration executada.
- Nenhum seed executado.
- Nenhum env alterado.
- Nenhum deploy executado.
- Nenhum `package.json` ou lockfile alterado.

## Estado reconstruido

Rick Travel e uma plataforma web de turismo para tours no Rio de Janeiro, com vitrine publica, reserva autenticada, i18n e analytics interno.

O projeto nao esta mais na etapa de bloqueio de build nem na etapa de preparo de staging. O estado real agora e de publicacao tecnica concluida, com foco operacional em estabilizacao pos-deploy e reconstrucao controlada do painel admin.

## Evidencia operacional consolidada

- `npm.cmd run check:env -- --target=local`: PASS.
- `npm.cmd run check:db`: PASS.
- `npm.cmd run lint`: PASS.
- `npm.cmd run typecheck`: PASS.
- `npm.cmd run build`: PASS fora do sandbox.
- `npm.cmd run test`: PASS, 4 arquivos, 15 testes.
- `npm.cmd run test:e2e`: PASS, 5/5.
- `npx.cmd vercel inspect rick-travel.vercel.app`: PASS; alias canonico agora aponta para `dpl_4vxzDoDd7Du1qLxtTBbyPgYFb36F`, status `Ready`, projeto `rick-travel`.
- `https://rick-travel.vercel.app`: PASS `200`.
- `https://rick-travel.vercel.app/api/health`: PASS `200`.
- `https://rick-travel.vercel.app/api/health?deep=1`: PASS `200`, database `ok`.
- Slice de estabilizacao publicado em `main`.
- `git pull --rebase origin main`: PASS.
- `git push origin main`: PASS.
- RT-011.8: runbook minimo criado.
- RT-012A DONE remoto: risco de bootstrap ADMIN removido.
- RT-012B DONE remoto: admin e2e neutralizado.
- RT-013B DONE remoto: esqueleto de protecao de rotas do novo Admin MVP.
- RT-013C DONE remoto: listagem de reservas somente leitura implementada no Admin MVP; commit pendente.
- RT-013D DONE: listagem de contatos somente leitura implementada.
- RT-013E DONE: acao de marcar contato como lido implementada.
- RT-013F DONE remoto: navegacao e dashboard do admin aprimorados.
- RT-013G DONE remoto: pagina de detalhe de reserva somente leitura; commit `09ffcb0` em `origin/main`.
- RT-014A DONE remoto: regras de cancelamento admin definidas e registradas.
- RT-014B DONE remoto: acao de cancelamento admin implementada; commit `08a3de2` no topo de `main`/`origin/main`.
- RT-015A DONE: auditoria de catalogo confirmou 0 trips em Neon production; causa do vazio identificada (ausencia de dados, nao bug de codigo).
- RT-015B DONE: seed idempotente criado (`prisma/seed.ts`); commit `cf0f96f` em `origin/main`; seed executado manualmente pelo Trigger contra Neon production; 1 Trip (Cristo Redentor + Mirante Dona Marta, R$ 245,00) e 1 TripSchedule OPEN (29/07/2026) criados.
- RT-015C-FIX DONE: bug critico corrigido - bottom sheet do mobile-menu interceptava cliques invisivelmente (`opacity: 0` sem `pointer-events: none`); commit `fa83e02 fix: prevent invisible mobile menu sheet from intercepting page clicks (RT-015C)` em `origin/main`.
- RT-015C DONE: smoke completo validado em producao pelo Trigger - tour visivel em `/pt/tours`, reserva criada (Ricardo / ricardo@gmail.com, R$ 245,00, 1 hospede, 29/07/2026), listagem e detalhe admin corretos, cancelamento admin confirmado (status = CANCELED na listagem; detalhe pos-cancelamento: "Nenhuma tentativa de pagamento registrada."; payment attempts remained absent - no payment gateway/refund/payment mutation was triggered in the MVP flow).
- RT-016A DONE remoto + production smoke validated: commit `799698c feat: polish booking confirmation flow`; fluxo user-side pos-reserva polido para pre-reserva com confirmacao manual; redirect para `/pt/reservas/{bookingId}` validado em producao; `/pt/reservas` lista a reserva e "Ver detalhes" abre o detalhe; payment status nao aparece mais como enum cru `UNPAID`; admin booking list permanece funcional; nenhum gateway, schema, migration, seed, env ou regra admin alterados.
- RT-016B DONE remoto + production smoke validated: commit `5e120a4 chore: simplify home catalog entry point`; Home deixou de renderizar os package cards comerciais antigos que apontavam para contato; `Passeios disponiveis` permanece como catalogo real principal; seed preparado para usar imagem real local `/images/trips/imagem-morro-pao-de-acucar.jpg`; seed nao executado; sem schema, migration, Neon, gateway, admin, auth/env/provider.
- RT-016C DONE remoto + production smoke validated: seed controlado executado manualmente pelo Trigger contra Neon production para aplicar imagem real ao tour existente; imagem `/images/trips/imagem-morro-pao-de-acucar.jpg` validada em producao na Home e tours; agenda renovada para 90 dias; nenhum novo tour adicionado; sem schema, migration ou code change.
- RT-017A DONE: regras e escopo do Admin Tour Manager MVP definidos e documentados em `docs/ops/admin-tour-manager-rules.md`; backlog fatiado em RT-017B/C/D/E.
- RT-017B DONE remoto + production smoke validated: listagem somente leitura de tours implementada no admin; acesso via `/[locale]/admin/tours`; link "Tours" ativo no menu; tour "Cristo Redentor + Mirante Dona Marta" exibido com imagem, preco R$ 245,00 e 1 agenda; status PUBLICADO; sem acoes mutaveis (create/edit/delete/publish/schedule); deploy automatico Vercel verificado; protecao herdada do AdminLayout (teste explicito com nao-admin pendente).
- RT-017C DONE remoto + production smoke manual validated: commit `4c3e3fe feat: add admin tour draft creation` publicado em producao Vercel; smoke manual executado pelo Trigger com credencial ADMIN privada, sem compartilhar credenciais com agente; tour real "Pao de Acucar ao Entardecer" criado como rascunho; ID `cmolfs9eu000004l2trz4q8bf`; cidade `rio de janeiro`; preco R$ 245,00; status RASCUNHO / `isPublished=false`; 0 agendas; aparece em `/pt/admin/tours`; nao aparece em `/pt/tours`, onde permanece visivel apenas o tour publicado "Cristo Redentor + Mirante Dona Marta"; nenhum deploy manual, migration, seed ou alteracao direta no banco executado pelo agente.
- RT-018A DONE: Production Product Smoke Check executado em producao no commit `6b59c92`; fluxo publico PASS ate confirmacao manual (`/pt/reservas/cmoli78ld000204js1agra4il`, status Pendente, R$ 245,00, pagamento "A combinar com a equipe"); admin anonimo PASS com redirect para `/pt/login`; admin com usuario comum autenticado FAIL com 500 nas rotas `/pt/admin`, `/pt/admin/tours`, `/pt/admin/bookings` e `/pt/admin/contacts` (`ERROR 2933230167`); login ADMIN BLOCKED por ausencia de credencial no ambiente; checkout externo NOT TESTED/nao iniciado; alinhamento de imagem WARN; React hydration `#418` WARN.
- RT-018B DONE remoto + production non-admin smoke validated: commit `bcf8119`; bug de autorizacao admin non-admin corrigido no `AdminLayout`; `FORBIDDEN` agora renderiza tela controlada "Acesso negado"; `UNAUTHENTICATED` continua redirecionando para login; ADMIN continua renderizando o painel; teste unitario cobre os tres cenarios; smoke em producao confirmou usuario comum sem 500 nas rotas admin; sem schema, seed, migration, deploy manual ou alteracao manual de banco.
- RT-018C DONE: Production Admin Access validation concluida via RT-018D; login ADMIN, rotas admin e visibilidade de booking validados em producao com sucesso.
- RT-018D DONE: Validate Existing Production Admin User executado em producao; login ADMIN PASS; rotas admin PASS; booking `cmoli78ld000204js1agra4il` visivel PASS.
- RT-018E DONE + Production Smoke PASS: Fix Logout Flow; causa raiz: rota customizada `app/api/auth/sign-out/route.ts` interceptava o handler Better Auth e limpava cookies sem invalidar sessao no banco; solucao: rota removida, `authClient.signOut()` agora atinge `[...all]` corretamente; commit `837694b`; lint/typecheck/test/build PASS; push para `origin/main` concluido; smoke em producao validou header `X-Matched-Path: /api/auth/[...all]`, clear cookies e redirect para locale.
- RT-019A Remote DONE + Production Seed/Smoke PASS: Publicar Pao de Acucar com caminho controlado de dados; seed detectou tour existente pelo titulo "Pao de Acucar ao Entardecer" e reutilizou o ID `cmolfs9eu000004l2trz4q8bf`, evitando duplicacao; `isPublished` setado para `true`; imagem correta aplicada; agenda futura criada; `/pt/tours` exibe 2 tours; fluxo de reserva validado; mantida imagem atual do Cristo (`/images/trips/imagem-morro-pao-de-acucar.jpg`) como pendencia visual para task futura.
- RT-021A Remote DONE + Production UX Smoke PASS: Revisao de UX, Navegacao e Busca Publica; commit `69379fe fix: polish public tour navigation UX`; Hero Search nao gera `/pt/pt`; `?search=Pao` mostra Pao de Acucar e nao mostra Cristo; busca sem resultado mostra empty state generico aceitavel; cards levam ao detalhe, nao ao booking direto; detalhes dos 2 tours retornam `200`; CTA de reserva no detalhe redireciona anonimo para login com redirect seguro, sem criar booking; footer sem `href="#"`; menu desktop/mobile preserva locale; sem admin, auth/logout, seed, banco, migration, pagamento, schema ou regra de booking.
- RT-022A REVIEW local, nao DONE: Admin Booking Actions promovida pelo Trigger como unica task ativa; implementacao local adiciona confirmacao admin de reservas pendentes e preserva cancelamento admin para reservas pendentes/confirmadas; lint/typecheck/test/build/git diff --check PASS; smoke manual mutavel BLOCKED porque `check:db` carregou `.env` com banco remoto/gerenciado e `.env.local` nao possui credenciais admin; sem commit/push ate existir autorizacao explicita.
- RT-FINAL-03A Manual production validation DONE by Trigger: admin login PASS; admin booking list PASS; reservas CONFIRMED/PENDING/CANCELED visiveis; confirm/cancel admin flow validated manually by Trigger; nenhum erro visivel reportado no navegador; evidencia visual nao commitada por conter dados pessoais/e-mails.
- GitHub `main` remoto esta em `8b3c2cc docs: record RT-021A production UX smoke` antes do commit da RT-022A.
- Vercel production validada com RT-018E smoke e RT-019A production seed/smoke.

- Neon production (apos RT-FINAL-04C3, 2026-05-14): 6 Trips publicadas no catalogo (Pao de Acucar, Selaron + Lapa, Centro Historico + Porto Maravilha, Favela Rocinha, Floresta da Tijuca, Helicoptero com Cristo); seed-001-cristo-dona-marta com `isPublished=false` (despublicado, nao deletado); agendas futuras ativas para todos os 6 tours; bookings historicos preservados.
- Neon production: usuario `ricardo@gmail.com` com `role = ADMIN` e `emailVerified = true` (alteracao manual anterior).

## Novo status geral do projeto

- Build: estabilizado.
- Publicacao: MVP publico acessivel em `https://rick-travel.vercel.app`.
- Runtime inicial: validado com alias publico e healthchecks `200`.
- Admin: em reconstrucao controlada (RT-013A ate RT-014B; RT-017A ate RT-017C concluidas; RT-018B corrige localmente o bug de autorizacao para usuario autenticado sem role ADMIN; RT-018D valida acesso admin em producao).
- Mercado Pago: implementacao existente no repositorio, mas fora do escopo da fase atual.
- Gerenciamento de Tours: listagem e criacao funcional (RT-017B/C); criacao de rascunho validada em producao com tour real; regras do MVP definidas (RT-017A); foco futuro em edicao segura sem hard delete ou upload binario.


## Validacao publica objetiva

### Smoke do fluxo publico

- `GET /pt`: `200`.
- `GET /pt/tours`: `200`.
- `GET /pt/quem-somos`: `200`.
- `GET /pt/contato`: `200`.
- `GET /api/trips`: `200`; apos RT-019A, catalogo publico validado com 2 tours publicados.
- RT-017C production smoke manual PASS: novo tour "Pao de Acucar ao Entardecer" criado como rascunho no admin e ausente do catalogo publico `/pt/tours`, confirmando `isPublished=false`.
- RT-018A production product smoke: Home PASS; `/pt/tours` PASS; detalhe do tour publicado PASS; login/register PASS; reserva publica PASS ate confirmacao manual; checkout externo nao iniciado; catalogo publico contem 1 tour publicado.
- RT-018E production smoke PASS: logout agora invalida sessao no banco e limpa cookies via Better Auth nativo; header `X-Matched-Path: /api/auth/[...all]` confirmado em producao; `/api/auth/sign-out` retorna `{"success":true}`; redirect para locale-aware URL PASS; `/pt/admin` redireciona para login apos logout PASS.
- `GET /robots.txt`: `200`.
- `GET /sitemap.xml`: `200`.
- RT-016A production smoke PASS: `/pt/tours` abre; detalhe do tour abre; booking cria; usuario redireciona para `/pt/reservas/{bookingId}`; pagina de confirmacao funciona; mensagem de pre-reserva/confirmacao manual esta clara; `/pt/reservas` lista a reserva; "Ver detalhes" abre o detalhe; payment status nao exibe enum cru; admin booking list segue funcional.
- RT-021A Production UX Smoke PASS: `/pt`, `/pt/tours`, `/pt/contato` e detalhes dos 2 tours retornam `200`; Hero Search navega para `/pt/tours/cmolfs9eu000004l2trz4q8bf` sem locale duplicado; `?search=Pao` filtra corretamente; busca sem resultado exibe empty state generico aceitavel; card CTAs apontam para `/pt/tours/{id}`; reserva anonima no detalhe redireciona para login com redirect seguro; footer sem links falsos; menu desktop/mobile preserva locale.
- RT-FINAL-04C3 Production Smoke PASS (2026-05-14, validado pelo Trigger): seed executado sem erro; `/pt/tours` exibe exatamente 6 tours publicados; `seed-001-cristo-dona-marta` ausente do catalogo publico e de `/api/trips`; todos os 6 detalhes de tour publicado retornam HTTP 200; todos os 6 precos e imagens corretos; assets de imagem retornam HTTP 200; `/pt/admin` anonimo redireciona para login; `/pt/login`, `/pt/register`, `/pt/contato` e `/pt/quem-somos` retornam HTTP 200; mobile catalog layout com 6 cards sem quebra visual (manual Trigger); booking publico submetido com sucesso (manual Trigger); booking visivel no admin (manual Trigger). P2 residual: URL direta de tour despublicado retorna 200 — registrado para RT-FINAL-HARDENING-01.

## Foco atual

### Curto prazo

- RT-022A DONE remoto: commit `b0e4d4a feat: add admin booking confirm and cancel flow` publicado em `origin/main` desde 2026-05-01; smoke mutavel de confirmacao admin (PENDING -> CONFIRMED) em producao ainda pendente de validacao - nenhuma evidencia de smoke mutavel em producao registrada.
- RT-023A DONE remoto: commit `67584b6 docs: create Rick Travel portfolio README showcase` publicado em `origin/main` desde 2026-05-06.
- RT-FINAL-00 concluida como auditoria pura (2026-05-13): nenhuma alteracao de arquivos; divergencia documental identificada e encaminhada para RT-FINAL-00A.
- RT-FINAL-00A Local DONE: correcao documental das divergencias identificadas; commit documental autorizado pelo Trigger.
- RT-FINAL-03A validada manualmente em producao pelo Trigger; documentacao local pendente de commit autorizado.
- RT-FINAL-04B Remote DONE: commit `c7a1d47 feat: improve public trust and manual booking copy` publicado em `origin/main`.
- RT-FINAL-04C1 CLOSED (Discussion Gate): catalogo final de 6 tours aprovado pelo Trigger; pacote de decisao sem execucao de repositorio.
- RT-FINAL-04C2 Remote DONE: commit `dfa7489 feat: define final tour catalog seed` publicado em `origin/main`.
- RT-FINAL-04C2B Remote DONE: commit `0d9e0c5 fix: reconcile final catalog schedule updates` publicado em `origin/main`; smoke de producao completo PASS; P2 isPublished registrado.
- RT-FINAL-04C3 Remote DONE: commit `fe56fd2 docs: record final catalog production smoke` publicado em `origin/main`; seed executado; 6 tours publicados; smoke completo PASS.
- RT-FINAL-04D Remote DONE: commit `ee3e33c fix: block unpublished public tour details` publicado em `origin/main`; tours despublicados retornam notFound() em producao apos deploy Vercel.
- RT-FINAL-05A Remote DONE: commit `20c1ff5 refactor: simplify public homepage sections` publicado em `origin/main`; homepage simplificada (sem FAQ, sem MyBookings na home); 3 testimonials com polish; TripCard preco limpo.
- RT-FINAL-05B Local REVIEW: claims 24/7, 100% roteiro privado e time local removidos do hero; mensagens EN/PT de suporte ajustadas; lint/typecheck/test/build PASS; aguardando commit autorizado.
- RT-FINAL-05C Local REVIEW: pagina Quem Somos lapidada; claim "10 anos" removido; repeticao em story reduzida; bloco Rick Travel com CNPJ/Instagram/WhatsApp/Email/Idiomas/Horario adicionado; numeros fake Cadastur removidos; pendencia: numeros reais Cadastur e revisao public/cadastro/cadastur.png; lint/typecheck/test/build PASS; aguardando commit autorizado.
- RT-FINAL-05D Local REVIEW: SecuritySection removida da pagina Quem Somos; pagina agora renderiza apenas hero + OurStory + MissionVisionValues; lint/typecheck PASS; aguardando commit autorizado.
- RT-FINAL-05E Local REVIEW: pagina Contatos simplificada; cards trustItems e secao "Como o atendimento funciona" removidos; pagina renderiza apenas hero + formulario ContactForm; lint/typecheck PASS; aguardando commit autorizado.
- RT-FINAL-05F Local REVIEW: foto real do guia (ricardo-guia-cracha.webp) adicionada ao OurStory; depoimentos atualizados para Danyela Viana/Carlos Moura/Beyjamin Bonfim com fotos reais; selos Cadastur e logo-turismo adicionados ao footer; lint/typecheck/test/build PASS; aguardando commit autorizado.
- Proximas candidatas (sem READY automatica): RT-FINAL-01 (define delivery scope), RT-FINAL-05 (custom domain), RT-FINAL-06 (owner handoff).


### Medio prazo

- fortalecer observabilidade minima do ambiente publicado;
- revisar janela controlada para o residual de `npm audit` em tooling Prisma.

### Continua congelado

- integracao externa real do Mercado Pago;
- qualquer reabertura de escopo comercial ou operacional alem do MVP publico atual.

## Riscos remanescentes

- P1: a credencial de bootstrap ADMIN removida deve ser considerada potencialmente exposta; rotacao nao confirmada.
- P1: `npm audit` residual em Prisma dev tooling segue pendente para janela controlada.
- P1: dominio proprio nao configurado - produto em URL temporaria da Vercel.
- P2: `TourDetailsPage` sem filtro `isPublished` — CORRIGIDO localmente em RT-FINAL-04D (findFirst + isPublished: true); aguardando commit e deploy para fechar em producao.
- P2: imagem do tour Cristo Redentor (seed-001, despublicado) usava asset do Pao de Acucar — tour despublicado e ausente do catalogo; item residual encerrado.
- P2: React hydration error #418 sem task de investigacao aberta.
- P2: sem guia de operacao para o dono (handoff operacional pendente).
- P2: reabrir Mercado Pago agora ampliaria escopo sem justificativa operacional desta fase.

## Atualizacao 2026-06-03 - RT-AI-001 AI Concierge Scope and Safety Rules

Estado: REVIEW.

RT-AI-001 foi executada localmente como task exclusivamente DISCOVERY/ARCHITECTURE para definir documentacao de escopo, arquitetura inicial e regras de seguranca do Rick Travel AI Concierge, um agente publico para turistas interessados no Rio de Janeiro.

Arquivos permitidos na futura execucao:
- `docs/product/ai-concierge-scope.md`
- `docs/architecture/ai-concierge-rag-strategy.md`
- `docs/ops/backlog.md`
- `docs/ops/status.md`
- `docs/ops/session-handoff.md`
- `docs/ops/execution-log.md`

Criterios da futura task:
- Define objetivo do agente.
- Define usuarios-alvo.
- Define intencoes principais.
- Define fontes permitidas.
- Define limites do agente.
- Define riscos de alucinacao.
- Define regras comerciais.
- Define regras de seguranca turistica.
- Define quando encaminhar para humano.
- Define arquitetura inicial RAG.
- Define relacao futura com LangChain.
- Define relacao futura com LangGraph.
- Define separacao entre AI Concierge publico e RIC Studio interno.
- Nao altera codigo, frontend, backend, schema, seed, admin, reservas, pagamentos ou producao.

Resultado local:
- `docs/product/ai-concierge-scope.md` criado.
- `docs/architecture/ai-concierge-rag-strategy.md` criado.
- RT-AI-001 movida para REVIEW.

Restricoes mantidas nesta execucao documental:
- Nenhum `STATUS.md` ou `backlog.md` criado na raiz.
- Nenhuma dependencia instalada.
- Nenhum chat, rota API, banco vetorial, schema, seed, frontend, admin, pagamento, reserva, login ou producao alterado.
- Nenhum commit ou push executado.

## Atualizacao 2026-06-04 - RT-AI-002 Knowledge Base Inventory

Estado: REVIEW.

RT-AI-002 foi executada localmente como task exclusivamente documental para inventariar e classificar as fontes existentes que poderao ou nao alimentar futuramente o Rick Travel AI Concierge.

Arquivo criado:
- `docs/product/ai-concierge-knowledge-base-inventory.md`

Classificacoes obrigatorias:
- permitidas;
- condicionais;
- bloqueadas.

O inventario futuro deve registrar origem, tipo de conteudo, prioridade, autoridade, publico versus interno, idiomas, aprovador, risco de desatualizacao, gatilho de revisao, relacao com RAG, precedencia, conflitos, lacunas e aprovacoes pendentes.

Decisoes da READY:
- Catalogo publico publicado prevalece sobre seed e arquivos legados.
- Somente tours com `isPublished=true` podem sustentar respostas publicas.
- Agenda ou `TripSchedule` nao confirma disponibilidade.
- Seed e referencia secundaria.
- `data/real-trips.json` e bloqueado ou legado divergente ate revisao aprovada.
- `docs/ops/*` nao pode ser ingerido integralmente.
- Dados privados e fontes internas sensiveis sao bloqueados.
- Claims e politicas comerciais exigem evidencia ou aprovacao explicita.

Resultado local:
- Inventario de fontes existentes criado.
- Fontes classificadas como ALLOWED, CONDITIONAL ou BLOCKED.
- Precedencia, conflitos, lacunas, aprovacoes pendentes e regras futuras de RAG documentadas.
- RT-AI-002 movida para REVIEW.

Restricoes desta execucao:
- Nenhuma base vetorial, dependencia, embedding, chat, rota API ou implementacao tecnica foi criada.
- Nenhum frontend, backend, schema, seed, admin, reserva, pagamento, login ou producao foi alterado.
- Nenhum commit ou push executado.

## Atualizacao 2026-06-04 - RT-AI-003 Approved FAQ and Answer Matrix Documentation

Estado: REVIEW.

RT-AI-003 foi executada localmente como task exclusivamente documental para criar a matriz de respostas e handoff do Rick Travel AI Concierge.

Arquivo criado:
- `docs/product/ai-concierge-answer-matrix.md`
- O arquivo `docs/product/ai-concierge-approved-faq.md` nao foi criado para evitar divergência.

Decisoes da execucao:
- Criados os 20 cenarios exigidos abrangendo planejamento, preco, pagamentos, seguranca, comunidades, acessibilidade, etc.
- Respostas que envolvam confirmacao final de preco, agendas ou reservas ativam handoff.
- Assuntos de seguranca e acessibilidade acionam handoff e proíbem IA de dar garantia.
- Conflitos comerciais mantidos como PENDING_OWNER_APPROVAL.

Resultado local:
- Matriz criada.
- RT-AI-003 movida para REVIEW.

Restricoes desta execucao:
- Nenhuma implementacao tecnica, dependencia, base vetorial, embedding, chat ou rota API.
- Nenhum frontend, backend, schema, seed, admin, reservas, pagamentos, login ou producao foi alterado.
- Nenhum commit ou push executado.

---

## Atualizacao 2026-06-04 - RT-AI-003 Approved FAQ and Answer Examples READY

Estado: READY.

RT-AI-003 foi aberta como task exclusivamente documental para definir uma matriz aprovada de perguntas, respostas esperadas, respostas bloqueadas e criterios de handoff humano antes de qualquer implementacao tecnica do Rick Travel AI Concierge.

Arquivo permitido na futura execucao:
- `docs/product/ai-concierge-answer-matrix.md`

Decisoes da READY:
- A futura task deve criar somente um documento de matriz.
- `docs/product/ai-concierge-approved-faq.md` nao deve ser criado para evitar duplicacao e divergencia.
- A matriz deve cobrir os 20 cenarios minimos de planejamento, catalogo, comercial, seguranca, acessibilidade, idiomas, limites e risco de alucinacao.
- Cada cenario deve registrar fonte autorizada, resposta esperada, respostas bloqueadas, esclarecimentos permitidos, handoff, aprovacao e validacao.
- Conflitos comerciais nao resolvidos devem permanecer como `PENDING_OWNER_APPROVAL` e exigir handoff.
- Confirmacoes de reserva, disponibilidade, preco final, politicas nao aprovadas, garantias de seguranca/acessibilidade, dados privados e claims sem evidencia sao bloqueados.

Resultado local:
- RT-AI-003 registrada como READY nos documentos operacionais.
- Nenhum documento de produto criado nesta abertura.

Restricoes desta abertura:
- Nenhum chat, rota API, RAG tecnico, base vetorial, embedding ou dependencia foi criado.
- Nenhum frontend, backend, schema, seed, admin, reserva, pagamento, login, producao, `package.json` ou lockfile foi alterado.
- Nenhum `STATUS.md` ou `backlog.md` criado na raiz.
- Nenhum commit ou push executado.

---

## Atualizacao 2026-06-05 - RT-AI-004 Prompt and Guardrail Contract READY

Estado: READY.

RT-AI-004 foi aberta como task exclusivamente documental para definir o contrato operacional do futuro Rick Travel AI Concierge antes de qualquer chat, rota API, RAG tecnico, LangChain ou LangGraph.

Arquivo permitido na futura execucao:
- `docs/product/ai-concierge-prompt-contract.md`

Decisoes da READY:
- A futura task deve definir persona publica, papel do agente, tom de voz, idioma de resposta, uso de fontes aprovadas/contexto recuperado, nao invencao, baixa confianca, conflito entre fontes, regras comerciais, seguranca turistica, handoff humano, recusas, bloqueios e formato de resposta.
- O contrato deve servir como base para futura implementacao tecnica de system/developer prompt, mas sem criar codigo agora.
- Pagamento, cancelamento e reembolso continuam `PENDING_OWNER_APPROVAL`.
- Baixa confianca deve gerar "nao tenho informacao aprovada" e encaminhamento humano.
- O agente deve responder no idioma do usuario quando possivel, de forma curta, clara e comercialmente segura.
- RIC Studio nao deve ser mencionado no fluxo publico.

Riscos bloqueados na READY:
- Confirmar reserva, disponibilidade, pagamento ou preco final.
- Inventar tours, horarios, politicas, duracao, claims ou descontos.
- Usar fontes bloqueadas ou condicionais sem curadoria.
- Responder com confianca quando houver baixa evidencia.
- Prometer seguranca absoluta.
- Dar veredito sobre favela/comunidade, acessibilidade, criancas, idosos ou necessidades especiais sem humano.
- Transformar o concierge em chatbot open-domain.
- Criar dependencia prematura de LangChain, LangGraph, embeddings ou banco vetorial.

Resultado local:
- RT-AI-004 registrada como READY nos documentos operacionais.
- `docs/product/ai-concierge-prompt-contract.md` nao foi criado nesta abertura.

Restricoes desta abertura:
- Nenhum prompt em codigo, chat, rota API, RAG tecnico, base vetorial, embedding ou dependencia foi criado.
- Nenhum frontend, backend, schema, seed, admin, reserva, pagamento, login, producao, `package.json` ou lockfile foi alterado.
- Nenhum `STATUS.md` ou `backlog.md` criado na raiz.
- Nenhum commit ou push executado.

---

## Atualizacao 2026-06-05 - RT-AI-004 Prompt and Guardrail Contract Documentation

Estado: REVIEW.

RT-AI-004 foi executada localmente como task exclusivamente documental para criar o contrato operacional de prompt, comportamento, guardrails, recusas, handoff humano e formato de resposta do futuro Rick Travel AI Concierge.

Arquivo criado:
- `docs/product/ai-concierge-prompt-contract.md`

Conteudo registrado:
- Objetivo do contrato e relacao com RT-AI-001, RT-AI-002 e RT-AI-003.
- Persona publica Rick Travel AI Concierge, papel do agente, tom de voz e idioma de resposta.
- Regras de fontes aprovadas, nao invencao, baixa confianca e conflito entre fontes.
- Regras comerciais, seguranca turistica, favela/comunidade, acessibilidade, criancas, idosos e necessidades especiais.
- Pagamento, cancelamento e reembolso mantidos como `PENDING_OWNER_APPROVAL`.
- Handoff humano, recusas, formato esperado e formato bloqueado de resposta.
- Limite explicito para nao mencionar RIC Studio no fluxo publico.
- Contrato minimo para futura implementacao tecnica de system/developer prompt, sem criar codigo.

Resultado local:
- Contrato operacional criado.
- RT-AI-004 movida para REVIEW.

Restricoes desta execucao:
- Nenhum prompt em codigo, chat, rota API, RAG tecnico, base vetorial, embedding ou dependencia foi criado.
- Nenhum frontend, backend, schema, seed, admin, reserva, pagamento, login, producao, `package.json` ou lockfile foi alterado.
- Nenhum `STATUS.md` ou `backlog.md` criado na raiz.
- Nenhum commit ou push executado.

---

## Atualizacao 2026-06-05 - RT-AI-005 Curated Knowledge Base Format READY

Estado: READY.

RT-AI-005 foi aberta como task exclusivamente documental para definir o formato canonico e versionavel da futura base de conhecimento curada do Rick Travel AI Concierge.

Arquivo permitido na futura execucao:
- `docs/product/ai-concierge-knowledge-base-format.md`

Decisoes da READY:
- A futura task deve definir objetivo da base curada e relacao com RT-AI-001, RT-AI-002, RT-AI-003 e RT-AI-004.
- O formato deve cobrir tipos de registros, campos obrigatorios, campos opcionais, metadados, idiomas, status de aprovacao, fonte de origem, data de atualizacao, validade, conteudo publico versus interno e conteudo bloqueado.
- Tipos minimos: `tour`, `destination`, `attraction`, `commercial_rule`, `safety_rule`, `handoff_rule`, `faq_answer` e `blocked_claim`.
- Campos obrigatorios minimos: `id`, `type`, `locale`, `title`, `content`, `source`, `sourceAuthority`, `approvalStatus`, `owner`, `updatedAt`, `publicAllowed` e `ragAllowed`.
- Campos opcionais minimos: `tourId`, `relatedTourIds`, `city`, `neighborhood`, `tags`, `riskLevel`, `handoffRequired`, `expiresAt` e `notes`.
- Estados de aprovacao: `APPROVED`, `CONDITIONAL`, `PENDING_OWNER_APPROVAL` e `BLOCKED`.
- Somente conteudo `APPROVED` pode ser usado em resposta factual; `CONDITIONAL` exige regra explicita; `PENDING_OWNER_APPROVAL` gera handoff; `BLOCKED` nunca deve ser usado para resposta publica.
- Tours exigem `isPublished=true`; agenda nao confirma disponibilidade; preco final, pagamento, cancelamento e reembolso nao devem ser inferidos.
- Claims como Cadastur, avaliacao, seguros e "500+ tours" exigem evidencia aprovada.
- Portugues, ingles e espanhol sao prioridade inicial; sueco somente com conteudo aprovado; idiomas divergentes nao devem ser misturados sem revisao.
- A futura task deve documentar a relacao com RAG, embeddings e LangChain, sem implementar nada.

Resultado local:
- RT-AI-005 registrada como READY nos documentos operacionais.
- `docs/product/ai-concierge-knowledge-base-format.md` nao foi criado nesta abertura.

Restricoes desta abertura:
- Nenhum arquivo JSON/YAML de base real, seed, alteracao em `data/`, base vetorial, embedding, chat, rota API, LangChain ou LangGraph foi criado.
- Nenhum frontend, backend, schema, admin, reserva, pagamento, login, producao, `package.json` ou lockfile foi alterado.
- Nenhum `STATUS.md` ou `backlog.md` criado na raiz.
- Nenhum commit ou push executado.

---

## Atualizacao 2026-06-05 - RT-AI-005 Curated Knowledge Base Format Documentation

Estado: REVIEW.

RT-AI-005 foi executada localmente como task exclusivamente documental para criar o formato canonico e versionavel da futura base de conhecimento curada do Rick Travel AI Concierge.

Arquivo criado:
- `docs/product/ai-concierge-knowledge-base-format.md`

Conteudo registrado:
- Objetivo da base curada e relacao com RT-AI-001, RT-AI-002, RT-AI-003 e RT-AI-004.
- Tipos de registros permitidos: `tour`, `destination`, `attraction`, `commercial_rule`, `safety_rule`, `handoff_rule`, `faq_answer` e `blocked_claim`.
- Campos obrigatorios e opcionais da base futura.
- Estados de aprovacao: `APPROVED`, `CONDITIONAL`, `PENDING_OWNER_APPROVAL` e `BLOCKED`.
- Regras criticas para uso factual, conteudo condicional, handoff, bloqueios, tours publicados, agenda, preco, pagamento, cancelamento, reembolso, claims e dados privados.
- Estrategia de idioma para portugues, ingles, espanhol e sueco somente com conteudo aprovado.
- Formatos para tours, destinos, atracoes, regras comerciais, seguranca turistica, handoff rules, FAQ/respostas aprovadas e blocked claims.
- Regras de precedencia, validade, expiracao e relacao futura com RAG, chunking, embeddings e LangChain, sem implementacao tecnica.

Resultado local:
- Documento de formato canonico criado.
- RT-AI-005 movida para REVIEW.

Restricoes desta execucao:
- Nenhum arquivo JSON/YAML de base real, seed, alteracao em `data/`, base vetorial, embedding, chat, rota API, LangChain ou LangGraph foi criado.
- Nenhum frontend, backend, schema, admin, reserva, pagamento, login, producao, `package.json` ou lockfile foi alterado.
- Nenhum `STATUS.md` ou `backlog.md` criado na raiz.
- Nenhum commit ou push executado.

---

## Atualizacao 2026-06-06 - RT-AI-006 First Curated Knowledge Base Seed Scope READY

Estado: READY.

RT-AI-006 foi aberta como task exclusivamente documental para definir o primeiro escopo editorial da Curated Knowledge Base Seed do Rick Travel AI Concierge antes de qualquer criacao de base real.

Arquivo permitido na futura execucao:
- `docs/product/ai-concierge-first-kb-seed-scope.md`

Fontes documentais permitidas para referencia:
- `docs/product/ai-concierge-scope.md`
- `docs/architecture/ai-concierge-rag-strategy.md`
- `docs/product/ai-concierge-knowledge-base-inventory.md`
- `docs/product/ai-concierge-answer-matrix.md`
- `docs/product/ai-concierge-prompt-contract.md`
- `docs/product/ai-concierge-knowledge-base-format.md`

Decisoes da READY:
- A futura task deve definir quais tipos de conteudo entram no primeiro pacote curado.
- A futura task deve definir quais fontes ficam condicionais e quais ficam bloqueadas.
- A futura task deve definir criterios editoriais antes de qualquer criacao de base real.
- Somente tours publicados com `isPublished=true` podem ser considerados fonte publica primaria.
- `TripSchedule` nao confirma disponibilidade.
- `prisma/seed.ts` permanece fonte secundaria/condicional, nunca superior ao catalogo publicado.
- `messages/*.json` permanecem condicionais por chave revisada, sem ingestao integral.
- `docs/ops/*` permanece evidencia operacional pontual, nunca corpus integral.
- `data/real-trips.json` permanece bloqueado enquanto legado/divergente.
- Claims como Cadastur, guias credenciados, seguro, avaliacoes, suporte rapido e seguranca dependem de evidencia e aprovacao explicita.
- Pagamento, cancelamento, reembolso, preco final, disponibilidade e confirmacao de reserva permanecem fora de resposta factual sem politica aprovada.

Resultado local:
- RT-AI-006 registrada como READY nos documentos operacionais.
- `docs/product/ai-concierge-first-kb-seed-scope.md` nao foi criado nesta abertura.

Restricoes desta abertura:
- Nenhum arquivo JSON/YAML de base real, seed, alteracao em `data/`, `prisma/seed.ts`, `messages/*.json`, base vetorial, embedding, chat, API, LangChain ou LangGraph foi criado.
- Nenhum frontend, backend, schema, banco, admin, bookings, pagamentos, usuarios, contatos privados, analytics, logs, `.env`, backups, deploy, `package.json` ou lockfile foi alterado.
- Nenhum `STATUS.md` ou `backlog.md` criado na raiz.
- Nenhum commit ou push executado.
- RT-AI-007 nao foi aberta.

---

## Update 2026-06-06 - RT-AI-006 First Knowledge Base Seed Scope Documentation

State: REVIEW.

RT-AI-006 was executed locally as a documentation-only product task to define the first approved knowledge base seed scope for the Rick Travel AI Concierge.

File created:
- `docs/product/ai-concierge-first-kb-seed-scope.md`

Content registered:
- Purpose of the first KB seed.
- Included and excluded knowledge categories.
- Approved source hierarchy.
- Required fields for future KB records.
- Initial content groups for company identity, contact channels, trust and credibility, Cadastur/CNPJ references, tour catalog basics, booking rules, payment rules, cancellation/refund boundaries, customer support escalation, and language support.
- What the AI Concierge may answer.
- What the AI Concierge must not answer.
- WhatsApp and human support redirect rules.
- Validation criteria before any implementation task.

Restrictions preserved:
- No KB records, JSON/YAML data files, seed implementation, `data/`, `prisma/seed.ts`, `messages/*.json`, frontend, backend, API, Prisma schema, database, admin, bookings, payments, users, contacts, analytics, logs, environment, package, lockfile, deployment, embeddings, LangChain, LangGraph, RAG work, or chat UI were changed.
- No commit or push was executed.
- RT-AI-007 was not opened.

---

## Update 2026-06-06 - RT-AI-007 First Curated KB Records Content READY

State: READY.

RT-AI-007 was opened as the next documentation-only task after RT-AI-006 Remote DONE. The future task must define the first curated editorial KB records for the Rick Travel AI Concierge.

File allowed in the future execution:
- `docs/product/ai-concierge-first-curated-kb-records.md`

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
- `id`, `type`, `locale`, `title`, `content`, `source`, `sourceAuthority`, `approvalStatus`, `owner`, `updatedAt`, `reviewedAt`, `publicAllowed`, `ragAllowed`, `handoffRequired`, `riskLevel`, `notes`.

Future acceptance criteria:
- The future task creates only `docs/product/ai-concierge-first-curated-kb-records.md` plus allowed ops docs.
- It defines editorial records, not machine-readable KB data.
- Every record has all required fields.
- Records use only `APPROVED`, `CONDITIONAL`, `PENDING_OWNER_APPROVAL`, or `BLOCKED`.
- Tour records are restricted to public tours with `isPublished=true`.
- Payment, cancellation, refund, Cadastur, CNPJ, trust, rating, safety, insurance, and certification claims remain blocked or pending unless evidence is explicitly approved.
- Handoff rules are present before any future implementation.
- No technical implementation artifacts are created.

Restrictions preserved:
- `docs/product/ai-concierge-first-curated-kb-records.md` was not created in this READY opening.
- No code, frontend, backend/API, Prisma/schema, `data/`, JSON/YAML seed files, embeddings, RAG, LangChain, LangGraph, chat UI, package, lockfile, environment, deployment, commit, or push was created or changed.
- No real payment information or invented Cadastur/CNPJ, phone, email, opening hours, response time, ratings, reviews, safety, insurance, or certification claims were added.

---

## Update 2026-06-08 - RT-AI-007 First Curated KB Records Content Documentation

State: REVIEW.

RT-AI-007 was executed locally as a documentation-only product task to define the first curated editorial KB records for the Rick Travel AI Concierge.

File created:
- `docs/product/ai-concierge-first-curated-kb-records.md`

Content registered:
- Editorial record format with all required fields.
- Company identity record with conservative limitation text.
- Contact channel record without invented phone, email, WhatsApp number, opening hours, or response time.
- Trust, Cadastur, CNPJ, payment, cancellation, refund, safety, insurance, certification, ratings, and reviews kept blocked or pending unless exact evidence is approved.
- Tour catalog rule restricted to public published tours with `isPublished=true`; `TripSchedule` explicitly not treated as confirmed availability.
- Booking documented as assisted/manual-confirmed flow.
- Human support escalation triggers.
- Language support records for PT, EN, and ES.
- Validation criteria before any technical implementation.

Restrictions preserved:
- No code, frontend, backend/API, Prisma/schema, `data/`, JSON/YAML seed files, embeddings, RAG, LangChain, LangGraph, chat UI, package, lockfile, environment, deployment, commit, or push.
- No real payment information or invented Cadastur/CNPJ, phone, email, opening hours, response time, ratings, reviews, safety, insurance, or certification claims were added.

---

## Update 2026-06-08 - RT-AI-008 Verified Business Evidence Records READY

State: READY.

RT-AI-008 was opened as the next documentation-only task after RT-AI-007 Remote DONE at commit `17f227f`.

Future product file allowed:
- `docs/product/ai-concierge-verified-business-evidence-records.md`

Future objective:
- Define a verified business evidence governance layer for real Rick Travel business data before any data is treated as public, website-safe, or AI Concierge-safe.

Required future scope:
- Evidence format, source/evidence requirement, owner approval, `reviewedAt`, `approvalStatus`, `publicAllowed`, `aiAllowed`, `websiteAllowed`, `riskLevel`, no-data-public-by-default rule, and sensitive-data approval rule.

Evidence categories planned:
- CNPJ / razao social / nome fantasia, Cadastur, guide credential, approved public WhatsApp, approved public email, official social networks, service hours, booking policy, payment policy, cancellation/refund policy, real published tours, official photos, reviews when verifiable, and certificates/insurance/credentials when real evidence exists.

Restrictions preserved:
- `docs/product/ai-concierge-verified-business-evidence-records.md` was not created in this READY opening.
- No JSON, YAML, seed, `data/`, `prisma/`, API, frontend, backend, schema, package, lockfile, embeddings, RAG, LangChain, LangGraph, chatbot, deploy, real business data ingestion, commit, or push was created or changed.
- No sensitive data was published or treated as public by default.

---

## Update 2026-06-08 - RT-AI-008 Verified Business Evidence Records Documentation

State: REVIEW.

RT-AI-008 was executed locally as a documentation-only product task to define how real Rick Travel business evidence must be recorded, reviewed, approved, blocked, and later used safely by the website or AI Concierge.

File created:
- `docs/product/ai-concierge-verified-business-evidence-records.md`

Content registered:
- Evidence record format with required fields: `id`, `category`, `title`, `evidenceValue`, `evidenceSource`, `sourceType`, `sourceAuthority`, `owner`, `approvalStatus`, `reviewedAt`, `updatedAt`, `publicAllowed`, `websiteAllowed`, `aiAllowed`, `handoffRequired`, `riskLevel`, and `notes`.
- Placeholder/blocking records for CNPJ/legal identity, Cadastur, guide credential, public WhatsApp, public email, official social media, service hours, booking policy, payment policy, cancellation/refund policy, published tours, official photos, reviews/testimonials, and insurance/certificates/licenses/safety claims.
- Default rule that no data is public, website-safe, or AI-safe without exact evidence and explicit owner approval.
- Future technical conversion to JSON/YAML/seed/RAG/API/chat remains blocked without a separate task.

Restrictions preserved:
- No JSON, YAML, seed, `data/`, `prisma/`, API, frontend, backend, schema, package, lockfile, embeddings, RAG, LangChain, LangGraph, chatbot, deploy, real business data runtime ingestion, commit, or push.
- No real sensitive data was made public by default.

---

## Update 2026-06-08 - RT-AI-009 Approved Public Business Evidence Values READY

State: READY.

RT-AI-009 was opened as the next documentation-only task after RT-AI-008 Remote DONE at commit `366660c`.

Future product file allowed:
- `docs/product/ai-concierge-approved-public-business-evidence-values.md`

Decision:
- RT-AI-009 must use a separate approved-values register. RT-AI-008 remains the evidence schema/governance layer.

Future objective:
- Record real Rick Travel business evidence values only when the owner explicitly approves public, website, and/or future AI Concierge use.

Required future scope:
- Every value must follow the RT-AI-008 format and include exact value, evidence source, source type, source authority, owner approval, `reviewedAt`, `updatedAt`, `approvalStatus`, `publicAllowed`, `websiteAllowed`, `aiAllowed`, `handoffRequired`, `riskLevel`, and limitation notes.
- `publicAllowed`, `websiteAllowed`, and `aiAllowed` default to `false`.
- Screenshots alone are not sufficient for high-risk categories.
- Runtime usage remains blocked until a future technical implementation task.

Restrictions preserved:
- `docs/product/ai-concierge-approved-public-business-evidence-values.md` was not created in this READY opening.
- No real business values, CPF, private address, private phone, private email, signatures, QR codes, document scans, payment keys, passwords, tokens, `.env`, admin data, booking data, payment data, contact submissions, analytics, logs, credentials, JSON, YAML, seed, `data/`, `prisma/`, API, frontend, backend, schema, package, lockfile, embeddings, RAG, LangChain, LangGraph, chatbot, deploy, database change, runtime ingestion, commit, or push was created or changed.

---

## Update 2026-06-08 - RT-AI-009 Approved Public Business Evidence Values Documentation

State: DONE remoto.

RT-AI-009 foi concluída com o commit `a4668a7` publicado em `origin/main`. O registro de valores aprovados foi criado com todas as seções e campos necessários, mas sem valores reais aprovados ainda.

---

## Update 2026-06-08 - RT-AI-010 Add First Owner-Approved Public Business Evidence Values READY

State: READY.

RT-AI-010 foi aberta para adicionar os primeiros valores de evidência de negócio aprovados pelo proprietário ao documento `docs/product/ai-concierge-approved-public-business-evidence-values.md`.

Valores propostos para a execução:
- Nome da marca e descrição institucional.
- Regiões, base de serviço e idiomas.
- Lista de serviços aprovados para uso público.
- Canais de contato oficiais (WhatsApp, E-mail, Instagram) com regras de uso para IA.
- Regras de handoff humano para o AI Concierge.

Restrições preservadas:
- `docs/product/ai-concierge-approved-public-business-evidence-values.md` não foi alterado nesta abertura de READY.
- Nenhum valor real de negócio, JSON, YAML, seed, `data/`, `prisma/`, API, frontend, backend, database, schema, arquivos de pacote, lockfiles, RAG, embeddings, LangChain, LangGraph, chatbot, deploy, ingestão em runtime, commit ou push.
