# Rick Travel AI Concierge - First Curated KB Records Content

## 1. Purpose

This document defines the first curated editorial knowledge base records for the Rick Travel AI Concierge.

These records are approval-controlled editorial examples. They are not machine-readable KB data, not JSON, not YAML, not seed data, not embeddings, and not a RAG implementation. They define the initial content, guardrails, blocked claims, handoff rules, and language records that future technical work must preserve.

The AI Concierge must never invent data. If a fact is missing, conflicting, outdated, private, operational, or not approved for the requested locale, the AI must state the limitation and route the user to human support or WhatsApp handoff when relevant.

## 2. Relationship To RT-AI-006

RT-AI-006 defined the first curated knowledge base seed scope. This document is the next editorial step: it proposes the first records that could later be converted into a real curated KB only after owner review and a separate technical task.

Source hierarchy and blocking rules remain inherited from:

- `docs/product/ai-concierge-first-kb-seed-scope.md`
- `docs/product/ai-concierge-knowledge-base-format.md`
- `docs/product/ai-concierge-knowledge-base-inventory.md`
- `docs/product/ai-concierge-answer-matrix.md`
- `docs/product/ai-concierge-prompt-contract.md`
- `docs/product/ai-concierge-scope.md`
- `docs/architecture/ai-concierge-rag-strategy.md`

If this document conflicts with prior AI Concierge guardrails, the stricter safety, source, approval, and handoff rule wins.

## 3. Record Format

Every record in this document includes:

| Field | Meaning |
| --- | --- |
| `id` | Stable editorial identifier. |
| `type` | Canonical record type from RT-AI-005. |
| `locale` | Locale approved or proposed for this record. |
| `title` | Short editorial title. |
| `content` | Customer-safe content, limitation text, or blocked-claim rule. |
| `source` | Source path, public source class, or owner approval requirement. |
| `sourceAuthority` | `owner`, `governance`, `primary_public`, `approved_public`, `conditional`, or `blocked`. |
| `approvalStatus` | `APPROVED`, `CONDITIONAL`, `PENDING_OWNER_APPROVAL`, or `BLOCKED`. |
| `owner` | Role responsible for approval and review. |
| `updatedAt` | Last update date for this editorial record. |
| `reviewedAt` | Last review date for this editorial record. |
| `publicAllowed` | Whether this record may support a public-facing response. |
| `ragAllowed` | Whether a future RAG implementation may retrieve this record. |
| `handoffRequired` | Whether human support or WhatsApp handoff is required. |
| `riskLevel` | Editorial risk level: `low`, `medium`, `high`, or `critical`. |
| `notes` | Curator notes and limitations. |

Approval rules:

- `APPROVED` records may support future factual answers only when the source is safe and the locale matches.
- `CONDITIONAL` records require explicit limitation text and must not be treated as unrestricted factual answers.
- `PENDING_OWNER_APPROVAL` records must trigger human support or WhatsApp handoff.
- `BLOCKED` records document what the AI must not say.

## 4. Editorial Records

### Record 1 - Company Identity

- `id`: `kb-editorial-company-identity-pt-v1`
- `type`: `faq_answer`
- `locale`: `pt`
- `title`: `Identidade publica conservadora da Rick Travel`
- `content`: `A Rick Travel e apresentada de forma conservadora como uma operacao publica de turismo focada em experiencias guiadas no Rio de Janeiro. A IA pode usar essa descricao somente como apresentacao geral, sem afirmar dados legais, registros oficiais, anos de experiencia, certificacoes, premios, avaliacoes ou numeros de clientes.`
- `source`: `docs/product/ai-concierge-first-kb-seed-scope.md`; `docs/product/ai-concierge-scope.md`
- `sourceAuthority`: `governance`
- `approvalStatus`: `CONDITIONAL`
- `owner`: `Owner / Produto Rick Travel`
- `updatedAt`: `2026-06-08`
- `reviewedAt`: `2026-06-08`
- `publicAllowed`: `true`
- `ragAllowed`: `true`
- `handoffRequired`: `false`
- `riskLevel`: `medium`
- `notes`: `Conditional because exact legal entity wording is not approved here. Do not mention Cadastur, CNPJ, official certifications, ratings, insurance, safety guarantees, or response-time claims.`

### Record 2 - Contact Channels

- `id`: `kb-editorial-contact-channels-pt-v1`
- `type`: `handoff_rule`
- `locale`: `pt`
- `title`: `Canais de contato sem dados inventados`
- `content`: `A IA pode orientar o usuario a usar os canais publicos aprovados do site, como a pagina de contato e o handoff humano/WhatsApp quando houver canal aprovado na interface publica. A IA nao pode informar telefone, e-mail, numero de WhatsApp, horario de atendimento, prazo de resposta ou garantia de retorno se esses dados nao estiverem aprovados na fonte publica vigente.`
- `source`: `docs/product/ai-concierge-first-kb-seed-scope.md`; `docs/product/ai-concierge-knowledge-base-inventory.md`
- `sourceAuthority`: `governance`
- `approvalStatus`: `CONDITIONAL`
- `owner`: `Owner / Operacao Rick Travel`
- `updatedAt`: `2026-06-08`
- `reviewedAt`: `2026-06-08`
- `publicAllowed`: `true`
- `ragAllowed`: `true`
- `handoffRequired`: `true`
- `riskLevel`: `medium`
- `notes`: `This record approves the contact behavior, not any specific phone, email, opening hour, response time, or WhatsApp number.`

### Record 3 - Trust And Credibility Boundary

- `id`: `kb-editorial-trust-boundary-pt-v1`
- `type`: `blocked_claim`
- `locale`: `pt`
- `title`: `Claims de confianca sem evidencia aprovada`
- `content`: `A IA nao deve afirmar notas de avaliacao, quantidade de reviews, quantidade de tours realizados, tempo de resposta, certificacoes, seguro, cobertura completa, seguranca garantida, melhor agencia, melhor passeio ou qualquer superlativo sem evidencia aprovada e revisada pelo owner.`
- `source`: `docs/product/ai-concierge-knowledge-base-inventory.md`; `docs/product/ai-concierge-first-kb-seed-scope.md`
- `sourceAuthority`: `blocked`
- `approvalStatus`: `BLOCKED`
- `owner`: `Owner / Produto Rick Travel`
- `updatedAt`: `2026-06-08`
- `reviewedAt`: `2026-06-08`
- `publicAllowed`: `false`
- `ragAllowed`: `true`
- `handoffRequired`: `true`
- `riskLevel`: `high`
- `notes`: `Blocked record for future retrieval as a guardrail only. It must not support positive trust claims.`

### Record 4 - Cadastur Boundary

- `id`: `kb-editorial-cadastur-boundary-pt-v1`
- `type`: `blocked_claim`
- `locale`: `pt`
- `title`: `Cadastur pendente de evidencia`
- `content`: `A IA nao deve informar numero de Cadastur, status ativo, registro oficial, guia credenciado ou certificacao governamental. Se o usuario perguntar sobre Cadastur, a IA deve dizer que nao tem essa informacao aprovada para responder e encaminhar para atendimento humano.`
- `source`: `docs/product/ai-concierge-first-kb-seed-scope.md`; `docs/product/ai-concierge-knowledge-base-format.md`
- `sourceAuthority`: `blocked`
- `approvalStatus`: `BLOCKED`
- `owner`: `Owner / Operacao Rick Travel`
- `updatedAt`: `2026-06-08`
- `reviewedAt`: `2026-06-08`
- `publicAllowed`: `false`
- `ragAllowed`: `true`
- `handoffRequired`: `true`
- `riskLevel`: `critical`
- `notes`: `No Cadastur number or registration status is approved in this document.`

### Record 5 - CNPJ Boundary

- `id`: `kb-editorial-cnpj-boundary-pt-v1`
- `type`: `blocked_claim`
- `locale`: `pt`
- `title`: `CNPJ pendente de evidencia`
- `content`: `A IA nao deve informar CNPJ, razao social, natureza juridica, endereco legal ou status cadastral. Se o usuario pedir dados legais da empresa, a IA deve indicar que nao possui informacao aprovada para resposta publica e encaminhar para atendimento humano.`
- `source`: `docs/product/ai-concierge-first-kb-seed-scope.md`; `docs/product/ai-concierge-knowledge-base-inventory.md`
- `sourceAuthority`: `blocked`
- `approvalStatus`: `BLOCKED`
- `owner`: `Owner / Operacao Rick Travel`
- `updatedAt`: `2026-06-08`
- `reviewedAt`: `2026-06-08`
- `publicAllowed`: `false`
- `ragAllowed`: `true`
- `handoffRequired`: `true`
- `riskLevel`: `critical`
- `notes`: `No CNPJ or legal-entity claim is approved in this document.`

### Record 6 - Tour Catalog Basics Source Rule

- `id`: `kb-editorial-tour-catalog-public-only-v1`
- `type`: `tour`
- `locale`: `pt`
- `title`: `Fatos de tours somente do catalogo publico publicado`
- `content`: `A IA so pode responder fatos basicos de tours quando o tour estiver no catalogo publico publicado com isPublished=true. Fatos permitidos incluem titulo publico, descricao publica, cidade, local, preco base de vitrine, duracao publica, nivel fisico, permissao para criancas e highlights publicos, desde que esses campos estejam publicados. TripSchedule, agenda, capacidade e status tecnico nao confirmam disponibilidade.`
- `source`: `Public catalog pages and /api/trips filtered by isPublished=true`; `docs/product/ai-concierge-knowledge-base-inventory.md`; `docs/product/ai-concierge-first-kb-seed-scope.md`
- `sourceAuthority`: `primary_public`
- `approvalStatus`: `APPROVED`
- `owner`: `Owner / Produto Rick Travel`
- `updatedAt`: `2026-06-08`
- `reviewedAt`: `2026-06-08`
- `publicAllowed`: `true`
- `ragAllowed`: `true`
- `handoffRequired`: `false`
- `riskLevel`: `medium`
- `notes`: `This is a source rule, not a concrete machine-readable tour list. Future implementation must revalidate isPublished=true at retrieval time.`

### Record 7 - Published Tour Snapshot Limitation

- `id`: `kb-editorial-tour-snapshot-limitation-v1`
- `type`: `commercial_rule`
- `locale`: `pt`
- `title`: `Snapshot editorial de tours nao substitui catalogo atual`
- `content`: `Qualquer lista editorial de tours deve ser tratada como snapshot sujeito a revisao. Antes de usar nomes, precos, descricoes, imagens, duracao, nivel fisico, criancas permitidas ou highlights em uma resposta futura, a implementacao deve confirmar que o tour continua publicado no catalogo publico com isPublished=true.`
- `source`: `docs/product/ai-concierge-first-kb-seed-scope.md`; `docs/product/ai-concierge-knowledge-base-format.md`
- `sourceAuthority`: `governance`
- `approvalStatus`: `APPROVED`
- `owner`: `Owner / Produto Rick Travel`
- `updatedAt`: `2026-06-08`
- `reviewedAt`: `2026-06-08`
- `publicAllowed`: `true`
- `ragAllowed`: `true`
- `handoffRequired`: `false`
- `riskLevel`: `medium`
- `notes`: `Prevents stale editorial records from overriding the live public catalog.`

### Record 8 - Booking Flow

- `id`: `kb-editorial-booking-manual-confirmation-pt-v1`
- `type`: `commercial_rule`
- `locale`: `pt`
- `title`: `Reserva como fluxo assistido com confirmacao manual`
- `content`: `A IA pode explicar que a reserva/pre-reserva deve ser confirmada pela equipe Rick Travel. A IA pode coletar contexto de baixo risco, como data de interesse, numero de pessoas, idioma desejado e tipo de passeio, mas nao pode confirmar reserva, disponibilidade, vaga, horario, assento, retirada, guia ou status operacional.`
- `source`: `docs/product/ai-concierge-first-kb-seed-scope.md`; `docs/product/ai-concierge-answer-matrix.md`; `docs/product/ai-concierge-prompt-contract.md`
- `sourceAuthority`: `governance`
- `approvalStatus`: `APPROVED`
- `owner`: `Owner / Operacao Rick Travel`
- `updatedAt`: `2026-06-08`
- `reviewedAt`: `2026-06-08`
- `publicAllowed`: `true`
- `ragAllowed`: `true`
- `handoffRequired`: `true`
- `riskLevel`: `medium`
- `notes`: `Approved only as a boundary. It does not authorize automated booking confirmation.`

### Record 9 - Payment Boundary

- `id`: `kb-editorial-payment-boundary-pt-v1`
- `type`: `commercial_rule`
- `locale`: `pt`
- `title`: `Pagamento bloqueado para IA`
- `content`: `A IA nao processa pagamentos, nao envia links de pagamento, nao informa Pix, nao lista metodos aceitos e nao confirma status financeiro. Perguntas sobre pagamento devem ser encaminhadas para atendimento humano ou WhatsApp handoff ate existir politica aprovada e versionada.`
- `source`: `docs/product/ai-concierge-first-kb-seed-scope.md`; `docs/product/ai-concierge-answer-matrix.md`
- `sourceAuthority`: `governance`
- `approvalStatus`: `PENDING_OWNER_APPROVAL`
- `owner`: `Owner / Operacao Rick Travel`
- `updatedAt`: `2026-06-08`
- `reviewedAt`: `2026-06-08`
- `publicAllowed`: `false`
- `ragAllowed`: `true`
- `handoffRequired`: `true`
- `riskLevel`: `critical`
- `notes`: `No real payment information, provider detail, payment method, Pix key, payment link, discount, or special condition is approved here.`

### Record 10 - Cancellation And Refund Boundary

- `id`: `kb-editorial-cancellation-refund-boundary-pt-v1`
- `type`: `commercial_rule`
- `locale`: `pt`
- `title`: `Cancelamento e reembolso exigem handoff`
- `content`: `A IA nao deve afirmar politica de cancelamento, janela de horas, reembolso garantido, reagendamento gratuito, cancelamento automatico por clima ou elegibilidade de devolucao. Perguntas de cancelamento, reembolso ou reagendamento devem ser encaminhadas para atendimento humano.`
- `source`: `docs/product/ai-concierge-first-kb-seed-scope.md`; `docs/product/ai-concierge-answer-matrix.md`; `docs/product/ai-concierge-knowledge-base-inventory.md`
- `sourceAuthority`: `governance`
- `approvalStatus`: `PENDING_OWNER_APPROVAL`
- `owner`: `Owner / Operacao Rick Travel`
- `updatedAt`: `2026-06-08`
- `reviewedAt`: `2026-06-08`
- `publicAllowed`: `false`
- `ragAllowed`: `true`
- `handoffRequired`: `true`
- `riskLevel`: `critical`
- `notes`: `No cancellation, refund, weather, or rescheduling policy is approved here.`

### Record 11 - Human Support Escalation

- `id`: `kb-editorial-human-support-escalation-v1`
- `type`: `handoff_rule`
- `locale`: `pt`
- `title`: `Gatilhos obrigatorios de atendimento humano`
- `content`: `Encaminhar para atendimento humano quando o usuario pedir uma pessoa, disponibilidade, confirmacao, reserva, preco final, desconto, grupo privado, condicao especial, pagamento, cancelamento, reembolso, reagendamento, acessibilidade, criancas, idosos, gravidez, mobilidade, saude, seguranca, favela/comunidade, periodo noturno, clima severo, emergencia, conflito entre fontes, baixa confianca, ausencia de fonte aprovada ou qualquer dado privado/operacional.`
- `source`: `docs/product/ai-concierge-first-kb-seed-scope.md`; `docs/product/ai-concierge-answer-matrix.md`; `docs/product/ai-concierge-prompt-contract.md`
- `sourceAuthority`: `governance`
- `approvalStatus`: `APPROVED`
- `owner`: `Owner / Produto Rick Travel`
- `updatedAt`: `2026-06-08`
- `reviewedAt`: `2026-06-08`
- `publicAllowed`: `true`
- `ragAllowed`: `true`
- `handoffRequired`: `true`
- `riskLevel`: `high`
- `notes`: `This is a behavior rule. It must not promise approval, confirmation, refund, discount, or resolution by the team.`

### Record 12 - Portuguese Language Support

- `id`: `kb-editorial-language-pt-v1`
- `type`: `faq_answer`
- `locale`: `pt`
- `title`: `Suporte inicial em portugues`
- `content`: `A IA pode responder em portugues quando houver conteudo aprovado ou regra de handoff aplicavel. Se a informacao aprovada nao existir, deve declarar o limite e encaminhar para atendimento humano quando o tema for comercial, operacional, sensivel ou pendente.`
- `source`: `docs/product/ai-concierge-first-kb-seed-scope.md`; `docs/product/ai-concierge-knowledge-base-format.md`
- `sourceAuthority`: `governance`
- `approvalStatus`: `APPROVED`
- `owner`: `Owner / Produto Rick Travel`
- `updatedAt`: `2026-06-08`
- `reviewedAt`: `2026-06-08`
- `publicAllowed`: `true`
- `ragAllowed`: `true`
- `handoffRequired`: `false`
- `riskLevel`: `low`
- `notes`: `Portuguese approval does not approve claims in other locales.`

### Record 13 - English Language Support

- `id`: `kb-editorial-language-en-v1`
- `type`: `faq_answer`
- `locale`: `en`
- `title`: `Initial English support`
- `content`: `The AI may answer in English when approved English content exists or when an approved handoff rule applies. If approved English content is missing, it must state the limitation and route the user to human support when the topic is commercial, operational, sensitive, or pending approval.`
- `source`: `docs/product/ai-concierge-first-kb-seed-scope.md`; `docs/product/ai-concierge-knowledge-base-format.md`; `docs/product/ai-concierge-answer-matrix.md`
- `sourceAuthority`: `governance`
- `approvalStatus`: `APPROVED`
- `owner`: `Owner / Produto Rick Travel`
- `updatedAt`: `2026-06-08`
- `reviewedAt`: `2026-06-08`
- `publicAllowed`: `true`
- `ragAllowed`: `true`
- `handoffRequired`: `false`
- `riskLevel`: `low`
- `notes`: `English does not loosen payment, booking, safety, availability, trust, Cadastur, CNPJ, insurance, certification, or rating restrictions.`

### Record 14 - Spanish Language Support

- `id`: `kb-editorial-language-es-v1`
- `type`: `faq_answer`
- `locale`: `es`
- `title`: `Soporte inicial en espanol`
- `content`: `La IA puede responder en espanol cuando exista contenido aprobado en espanol o cuando aplique una regla aprobada de derivacion humana. Si falta contenido aprobado, debe explicar el limite y derivar a soporte humano cuando el tema sea comercial, operativo, sensible o pendiente de aprobacion.`
- `source`: `docs/product/ai-concierge-first-kb-seed-scope.md`; `docs/product/ai-concierge-knowledge-base-format.md`; `docs/product/ai-concierge-answer-matrix.md`
- `sourceAuthority`: `governance`
- `approvalStatus`: `APPROVED`
- `owner`: `Owner / Produto Rick Travel`
- `updatedAt`: `2026-06-08`
- `reviewedAt`: `2026-06-08`
- `publicAllowed`: `true`
- `ragAllowed`: `true`
- `handoffRequired`: `false`
- `riskLevel`: `low`
- `notes`: `Spanish does not approve new claims or override stricter Portuguese/English guardrails.`

### Record 15 - Safety And Accessibility Boundary

- `id`: `kb-editorial-safety-accessibility-boundary-v1`
- `type`: `safety_rule`
- `locale`: `pt`
- `title`: `Seguranca e acessibilidade com linguagem prudente`
- `content`: `A IA pode reconhecer que algumas decisoes exigem avaliacao humana, mas nao pode garantir seguranca, acessibilidade, conforto medico, adequacao para criancas, idosos, gravidez, mobilidade reduzida, necessidades especiais, comunidades, trilhas, clima severo ou periodo noturno. Esses temas exigem handoff quando houver decisao pratica ou risco.`
- `source`: `docs/product/ai-concierge-first-kb-seed-scope.md`; `docs/product/ai-concierge-answer-matrix.md`; `docs/product/ai-concierge-prompt-contract.md`
- `sourceAuthority`: `governance`
- `approvalStatus`: `APPROVED`
- `owner`: `Owner / Produto Rick Travel`
- `updatedAt`: `2026-06-08`
- `reviewedAt`: `2026-06-08`
- `publicAllowed`: `true`
- `ragAllowed`: `true`
- `handoffRequired`: `true`
- `riskLevel`: `high`
- `notes`: `This approves prudent limitation language only. It does not approve any safety, insurance, certification, accessibility, or suitability claim.`

## 5. Blocked Claims

The AI must not say:

- Rick Travel has a specific Cadastur number, CNPJ number, registration status, legal entity status, license, certification, guide credential, insurance policy, safety certification, rating, review count, response time, number of tours completed, or official award unless a future approved record cites exact evidence.
- A tour is available on a date because a `TripSchedule` exists.
- A booking is confirmed, a seat is held, pickup is confirmed, or a guide is assigned.
- A payment was approved, pending, failed, refundable, captured, reversed, or processed.
- Pix, card, PayPal, bank transfer, Mercado Pago, payment link, or any payment method is accepted unless a future approved payment policy exists.
- A cancellation, refund, reschedule, weather cancellation, or free-change policy applies unless a future approved policy exists.
- Any tour is safe, risk-free, fully accessible, suitable for every child or older adult, or medically appropriate.
- Any unpublished, draft, legacy, private, admin, booking, payment, contact, log, analytics, `.env`, secret, backup, or `data/real-trips.json` content is public knowledge.

## 6. Human Support Escalation Records

The primary handoff record is `kb-editorial-human-support-escalation-v1`.

Future implementation must treat these as hard handoff triggers:

- explicit request for a person;
- availability, booking, confirmation, schedule, seat, pickup, guide, final price, discount, group, private tour, or special condition;
- payment, cancellation, refund, receipt, rescheduling, or commercial dispute;
- accessibility, children, older adults, pregnancy, mobility, health restrictions, special needs, favela/community, safety-sensitive route, severe weather, night travel, or emergency;
- missing approved source, conflicting sources, expired record, low confidence, private data, admin data, booking data, payment data, contact submission, analytics, logs, credentials, secrets, or operational judgment.

The handoff message must not promise that the team will confirm, approve, refund, discount, solve, or respond within a specific time.

## 7. Language Support Records

Initial supported locales for editorial behavior:

- Portuguese: `kb-editorial-language-pt-v1`
- English: `kb-editorial-language-en-v1`
- Spanish: `kb-editorial-language-es-v1`

Locale rules:

- approval is per locale;
- translation does not approve new claims;
- missing locale coverage must produce limitation language;
- guardrails remain identical across PT, EN, and ES;
- Swedish and any other locale remain out of scope unless a future approved record is created.

## 8. Validation Before Technical Implementation

Before any future implementation converts these editorial records into machine-readable records, all checks below must pass:

- owner reviews and accepts this document;
- every record keeps all required fields;
- every `APPROVED` factual record has a safe source;
- every `CONDITIONAL` record has explicit limitation text;
- every `PENDING_OWNER_APPROVAL` record triggers human support or WhatsApp handoff;
- every `BLOCKED` record documents what the AI must not say;
- public tour records are revalidated against the current public catalog with `isPublished=true`;
- `TripSchedule` is not treated as confirmed availability;
- payment, cancellation, refund, Cadastur, CNPJ, trust, ratings, safety, insurance, and certification claims remain blocked or pending unless exact evidence is approved;
- no phone, email, WhatsApp number, opening hour, response time, rating, review, insurance, safety, certification, Cadastur, CNPJ, payment, or policy detail is invented;
- no private, admin, booking, payment, contact, analytics, log, environment, secret, backup, or legacy blocked source is included;
- future RAG retrieves blocker and handoff records only as guardrails, never as positive factual claims;
- a separate implementation task explicitly authorizes any JSON/YAML, seed, embeddings, RAG, API, chat UI, LangChain, or LangGraph work.

## 9. Non-Goals

This document does not:

- create machine-readable KB data;
- create JSON or YAML files;
- create seed files;
- change `data/`;
- change `prisma/seed.ts`;
- change `messages/*.json`;
- create embeddings;
- implement RAG;
- install or configure LangChain;
- install or configure LangGraph;
- create chat UI;
- create API routes;
- change frontend, backend, Prisma/schema, database, admin, bookings, payments, users, contacts, analytics, logs, environment, packages, lockfiles, deployment, commit, or push behavior;
- add real payment information;
- add Cadastur, CNPJ, phone, email, opening hours, response time, ratings, reviews, safety, insurance, or certification claims.
