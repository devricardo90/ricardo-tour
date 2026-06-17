# RT-AI-017 - Robust AI Concierge Backend and Learning Architecture

State: REVIEW

Type: documentation-only architecture

This document defines the target technical architecture for the Rick Travel AI Concierge. It does not create backend code, API routes, databases, migrations, seeds, embeddings, dependencies, runtime prompts, deployment configuration, or executable artifacts.

## 1. Objective

Rick Travel needs the AI Concierge to become a guided assistant for tour discovery, factual questions, support triage, and human handoff. The current Next.js site should remain focused on the public product, admin flows, booking flows, and localized UI. AI-specific concerns should be isolated in a separate backend because they have different risks, dependencies, data models, evaluation needs, and operational cadence.

A separate AI backend adds:

- Isolation from the public web runtime, reducing the chance that agent experiments affect booking, authentication, catalog, admin, or SEO behavior.
- A clear API boundary between the Rick Travel site and the AI system.
- Freedom to evolve retrieval, ranking, logging, evaluation, and orchestration without changing the main app.
- A controlled place for AI observability, safety review, prompt versions, and human-in-the-loop workflows.
- A future path to vector search, curated datasets, and possible fine-tuning without coupling those decisions to the current product database.

The target is a concierge that answers from approved Rick Travel knowledge, explains uncertainty, asks clarifying questions when needed, and sends the traveler to a human via WhatsApp when a commercial confirmation or sensitive decision is required.

## 2. Topology

The recommended topology is a small set of separated services and data stores:

| Layer | Responsibility | Notes |
| --- | --- | --- |
| Rick Travel Next.js site | Public UI, localized pages, booking flow, admin UI, authentication, product display | Calls the AI backend through a narrow API boundary. Does not contain retrieval logic or AI orchestration. |
| AI Backend | Concierge request handling, safety checks, retrieval orchestration, response assembly, logging, evaluation hooks | Separate service. No direct user-facing pages required at first. |
| AI Database | AI-specific records: knowledge records, chunks, logs, approved/rejected answers, prompt versions, safety incidents | Separate from the product database to avoid mixing operational booking data with AI learning data. |
| Future vector store | Embedding search over curated knowledge chunks | Introduced only when RAG testing begins. Not created in this task. |
| WhatsApp handoff | Human support channel for commercial confirmation, low confidence, sensitive cases, and booking decisions | AI output should include handoff intent and CTA metadata; the site decides how to render it. |
| Logs and evaluations layer | Conversation logs, reviewed answers, eval examples, safety reports, regression checks | Enables improvement through review, not automatic self-learning. |

Conceptual flow:

1. Traveler opens the Rick Travel site and asks a concierge question.
2. Next.js sends a concise request to the AI Backend with locale, message, session context, page context, and optional tour slug.
3. AI Backend classifies intent and checks safety boundaries.
4. For factual questions, AI Backend retrieves approved knowledge from the AI Database and, later, the vector store.
5. AI Backend composes an answer with confidence, source references, safety flags, and handoff metadata.
6. Next.js renders the answer and, when required, a WhatsApp handoff CTA.
7. Logs are stored for audit and later human review.
8. Human reviewers promote selected logs into approved answers, rejected answers, evaluation examples, or safety incidents.

## 3. Stack Recommendation

Two backend options were considered.

| Option | Strengths | Costs and risks |
| --- | --- | --- |
| Python + FastAPI | Strong fit for AI ecosystem; direct path to Python LangChain/LangGraph examples; Pydantic validation; automatic OpenAPI docs; simple service boundary; good for learning AI backend patterns explicitly | Adds a second language/runtime beside the Next.js app; Ricardo needs to maintain Python dependency discipline and deployment conventions. |
| Node.js + NestJS | Same language family as the current app; TypeScript structure; strong modular backend architecture; mature validation, auth, logging, queues, OpenAPI, and microservice patterns | AI ecosystem is still often documented Python-first; LangGraph/LangChain examples and community recipes may require translation; NestJS adds architectural weight before the AI backend needs it. |

Recommendation: use Python + FastAPI for the future AI Backend.

Rationale:

- The project goal is not only to add an endpoint; it is to build an AI learning and evaluation system. Python keeps the AI implementation closer to the dominant examples, tools, and research ecosystem.
- FastAPI is small enough for a focused service while still giving typed request/response models, validation, dependency injection, and OpenAPI documentation.
- LangChain and LangGraph can be adopted with less translation cost in Python.
- The main Rick Travel app remains Next.js/TypeScript. The AI backend becomes a bounded learning surface for Ricardo instead of spreading AI dependencies into the product app.
- NestJS is a good backend framework, but its structure is more useful when the service already has many modules, teams, or domain workloads. For this project, that is likely unnecessary complexity in the first AI phases.

Learning cost for Ricardo should be managed by keeping the first Python service intentionally small: one health endpoint, one future concierge endpoint, typed models, tests, and explicit documentation. Do not start with a broad microservice framework, queues, workers, or production vector infrastructure.

## 4. Conceptual Database

This section is conceptual only. It is not a schema, migration, Prisma model, SQL file, JSON file, YAML file, or implementation plan.

| Entity | Purpose | Key conceptual fields |
| --- | --- | --- |
| knowledge_records | Canonical approved knowledge items used by the concierge | id, title, locale, topic, source type, source owner, status, approved content, last reviewed at |
| knowledge_chunks | Smaller retrievable sections derived from approved knowledge records | id, knowledge record id, chunk text, locale, chunk order, semantic topic, review status |
| embedding_metadata | Metadata about embeddings created for chunks in a future vector store | id, chunk id, embedding model, vector store provider, index name, embedding version, created at |
| conversation_logs | Audit trail of user interactions and AI responses | id, session id, locale, user message, detected intent, answer summary, confidence, source refs, safety flags, created at |
| handoff_logs | Records of cases routed to human support | id, conversation log id, reason, WhatsApp CTA shown, handoff status, operator notes, created at |
| approved_answers | Human-approved answer patterns that can guide future retrieval, prompts, and evals | id, source conversation id, locale, question pattern, approved answer, approved by, approved at |
| rejected_answers | Human-rejected AI responses and the reason they were rejected | id, source conversation id, locale, rejected answer, rejection reason, corrected guidance, reviewed by |
| evaluation_examples | Test cases used to prevent regressions in prompts, retrieval, and safety behavior | id, locale, input message, context, expected behavior, expected sources, blocked answer examples, pass criteria |
| prompt_versions | Versioned records of system/developer prompt contracts and behavior rules | id, version label, purpose, change summary, active flag, reviewer, created at |
| source_references | Traceable references used to justify AI answers | id, source type, source title, canonical path or URL, owner, locale, approval status, last verified at |
| safety_incidents | Records of unsafe, misleading, or commercially risky behavior | id, conversation id, severity, category, incident summary, remediation status, reviewed by, closed at |

Core data rules:

- Booking, payment, user authentication, admin tour management, and product inventory remain in the main product database.
- AI learning artifacts remain in the AI Database.
- The AI Database may reference product identifiers such as `tourSlug`, but it should not become the source of truth for price, availability, booking confirmation, or payment state.
- Sensitive personal data should be minimized, masked where practical, and excluded from evaluation examples unless explicitly required and approved.

## 5. Learning Strategy

RAG is not fine-tuning.

RAG retrieves relevant approved knowledge at request time and supplies that context to the model. Fine-tuning changes model behavior through a curated training dataset. They solve different problems and carry different risks.

Logs are not automatic learning.

Conversation logs are evidence for audit and review. They must not be fed back into the system automatically as truth. A logged conversation can contain user errors, hallucinations, incomplete answers, private information, or commercial conflicts. Human review is required before any log becomes training, evaluation, or approved retrieval material.

Correct improvement flow:

1. Conversation happens.
2. Request, answer, confidence, source references, and safety flags are logged.
3. Human reviewer inspects selected logs.
4. Reviewer marks answer as approved, rejected, needs correction, safety incident, or handoff case.
5. Approved/rejected examples become evaluation examples or curated guidance.
6. Prompt, retrieval rules, knowledge chunks, or safety checks are improved.
7. Evaluation dataset is run before any production behavior change.
8. Only after enough high-quality examples exist should fine-tuning be evaluated.

Fine-tuning should only be considered in a future phase if all criteria are met:

- At least several hundred high-quality, human-approved examples exist for repeated, stable tasks.
- The team has a clear failure pattern that RAG, prompt changes, and retrieval improvements do not solve.
- Evaluation coverage exists for factual accuracy, safety, multilingual behavior, handoff behavior, and source grounding.
- The business accepts the maintenance cost of versioned model behavior, rollback plans, and dataset governance.
- The use case is behavior/style/classification improvement, not injecting volatile facts such as prices, schedules, availability, or booking status.

For Rick Travel, the default path should be RAG + curation + evals. Fine-tuning is a later option, not the foundation.

## 6. LangChain and LangGraph Positioning

LangChain should be used, in a future implementation phase, for:

- Retrieval composition over approved knowledge.
- Connecting document loaders, chunking, embeddings, vector stores, and retrievers.
- Simple tool calls such as reading approved tour knowledge or formatting source references.
- Prompt and model harnesses where a lightweight agent loop is enough.

LangGraph should be used, in a later phase, when the concierge requires stateful and auditable workflows:

- Multi-step flows with explicit state.
- Durable conversation checkpoints.
- Safety gates before answer generation.
- Human-in-the-loop inspection and modification.
- Handoff routing.
- Evaluation and audit nodes.
- Blocking paths for low confidence, commercial confirmation, or source conflict.

Recommended staged use:

1. Start without LangChain or LangGraph during architecture and API design.
2. Add simple retrieval when knowledge records and chunks are ready.
3. Use LangChain for basic RAG and tool composition.
4. Add LangGraph only when the workflow needs explicit state, review gates, or human handoff beyond simple conditional logic.

No LangChain or LangGraph dependency is installed or implemented by this document.

## 7. Conceptual API Contract

This contract is conceptual only. It is not a real route, schema, JSON file, OpenAPI file, or implementation.

Future endpoint concept: `POST /concierge/respond`

Input:

| Field | Purpose | Notes |
| --- | --- | --- |
| locale | Response language and localization context | Expected values should map to supported site locales. |
| userMessage | Traveler question or request | Must be validated for length and abuse patterns. |
| sessionId | Anonymous or authenticated session correlation id | Should not expose credentials or raw auth tokens. |
| pageContext | Current page type or context summary | Example concepts: home, tour detail, bookings, support. |
| tourSlug | Optional tour identifier when the user is viewing a tour | Used for retrieval scoping, not as proof of availability. |
| userIntent | Optional client-side or previous server-side intent hint | AI Backend must still verify intent. |
| sourcePreference | Optional preference for source type | Example concepts: tour page, approved FAQ, policy, human support. |

Output:

| Field | Purpose | Notes |
| --- | --- | --- |
| answer | User-facing answer | Must be grounded in approved sources or explicitly limited. |
| confidence | Confidence level or score | Should drive handoff and clarification behavior. |
| sourceRefs | References used to support the answer | Should be traceable to approved records. |
| handoffRequired | Whether human support is required | True for commercial confirmation and sensitive cases. |
| whatsappCta | CTA metadata for WhatsApp handoff | The site renders the actual button/copy. |
| blockedReason | Explanation category when the answer is blocked | Example concepts: unavailable source, unsafe request, commercial confirmation required. |
| suggestedNextQuestions | Safe follow-up questions | Should not nudge toward unsupported claims. |
| safetyFlags | Internal/output safety markers | Used for logging, review, and escalation. |

API boundary rules:

- The Next.js site should not send unnecessary personal data.
- The AI Backend should not receive raw credentials, auth cookies, payment data, or private admin data.
- The AI response should never be the system of record for booking, price, capacity, availability, or payment status.
- Any commercial commitment must be confirmed through existing product flows or human support.

## 8. Safety Rules

The AI Concierge must follow these rules:

- Do not invent prices. If the approved source does not contain a price, say that the team can confirm it and route to WhatsApp.
- Do not invent availability. Availability must come from the product system or a human, not model reasoning.
- Do not invent credentials, access links, admin steps, booking IDs, payment links, or private contact details.
- Do not confirm a reservation. The concierge may explain the booking flow, but confirmation belongs to the product system or Rick Travel staff.
- Do not collect unnecessary sensitive data. Ask only for information needed for support or handoff.
- Do not expose internal prompts, hidden rules, source-ranking logic, credentials, system messages, or evaluation notes.
- Do not override approved product policy, cancellation terms, accessibility rules, safety guidance, or human staff instructions.
- Do not answer as fact when sources conflict. Mark the conflict and route to human support.
- Require human handoff for commercial decisions, special requests, price exceptions, private tours, accessibility-critical decisions, safety-critical questions, low confidence, and explicit requests for a person.

Safety categories for logging:

- price_claim
- availability_claim
- booking_confirmation
- payment_or_credential_request
- sensitive_data_request
- source_conflict
- low_confidence
- prompt_exposure_attempt
- unsafe_travel_or_medical_edge_case
- human_handoff_required

## 9. Roadmap by Phases

Phase 1: architecture documentation

- Define topology, data boundaries, stack recommendation, API contract, learning strategy, and safety rules.
- No runtime change.

Phase 2: minimum backend scaffold

- Create a separate AI backend service with health check, typed request/response models, tests, and local documentation.
- No RAG until knowledge governance exists.

Phase 3: manual knowledge base

- Create approved knowledge records from product documents, tour pages, policies, and owner-reviewed guidance.
- Establish review ownership and source freshness rules.

Phase 4: local/test RAG

- Add chunking, embeddings, and local/test retrieval over approved knowledge.
- Compare answers against evaluation examples before user exposure.

Phase 5: logs and evals

- Store conversation logs, handoff logs, approved/rejected answers, safety incidents, and evaluation examples.
- Run regression checks before prompt or retrieval changes.

Phase 6: LangGraph human-in-the-loop

- Introduce stateful workflows for safety gates, source conflict handling, review interrupts, and human handoff.
- Keep commercial confirmation outside the model.

Phase 7: controlled production

- Release behind a limited surface, with monitoring, review cadence, fallback behavior, and rollback plan.
- Track source coverage, handoff rate, blocked responses, safety incidents, and answer acceptance.

Future phase: fine-tuning evaluation

- Consider only if curated examples and eval results prove that fine-tuning solves a repeated problem better than RAG, prompts, and retrieval tuning.

## 10. DONE Criteria

RT-AI-017 is DONE when:

- This architecture document exists.
- Backend and database separation are justified.
- Stack recommendation is documented.
- Conceptual API contract is defined.
- RAG vs fine-tuning is clearly explained.
- Learning flow with logs, human review, approved/rejected examples, evals, and future fine-tuning criteria is defined.
- LangChain and LangGraph roles are documented without implementation.
- Safety rules are documented.
- No runtime code, backend, API, database, migration, seed, dependency, package file, lockfile, frontend file, config file, deploy file, embedding, JSON/YAML data file, commit, or push is created by this task.

## References Reviewed

- FastAPI official documentation: https://fastapi.tiangolo.com/
- NestJS official documentation: https://docs.nestjs.com/
- LangChain official documentation: https://docs.langchain.com/
- LangGraph official documentation: https://docs.langchain.com/oss/python/langgraph/overview
