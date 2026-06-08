# AI Concierge Website Approved Values Audit

## 1. Purpose

This audit compares the current Rick Travel website and content files against owner-approved public business values and the public credibility evidence approval rules.

The goal is to identify which website content is already safe for website use, which content requires review or rewrite, and which credibility, commercial, or trust claims must remain blocked or pending. This task is audit-only and does not change public website copy.

## 2. Source Documents Reviewed

- `docs/product/ai-concierge-approved-public-business-evidence-values.md`
- `docs/product/ai-concierge-public-credibility-evidence-approval-scope.md`
- `docs/product/ai-concierge-verified-business-evidence-records.md`
- `docs/product/ai-concierge-answer-matrix.md`
- `docs/product/ai-concierge-prompt-contract.md`

## 3. Website Files Inspected

Existing website/content groups inspected:

- `app/**`
- `components/**`
- `messages/**`

Specific files inspected or matched during the audit:

- `app/[locale]/layout.tsx`
- `app/[locale]/(public)/page.tsx`
- `app/[locale]/(public)/contato/page.tsx`
- `app/[locale]/(public)/quem-somos/page.tsx`
- `app/[locale]/(public)/tours/page.tsx`
- `app/[locale]/(public)/tours/[id]/page.tsx`
- `components/hero-section.tsx`
- `components/footer.tsx`
- `components/testimonials.tsx`
- `components/about/security-section.tsx`
- `components/about/why-choose-us.tsx`
- `components/trips/tour-detail-client.tsx`
- `components/trips/tour-actions.tsx`
- `components/trips/trip-card.tsx`
- `components/trips/tour-media-badges.tsx`
- `components/contact-form.tsx`
- `components/my-bookings.tsx`
- `messages/en.json`
- `messages/es.json`
- `messages/pt.json`
- `messages/sv.json`

## 4. Approved Values Safe For Website Use

The following values are already approved for website use by the approved public business evidence values document:

- Brand: Rick Travel.
- Service base: Rio de Janeiro, Brazil.
- Service languages: Portuguese, Spanish, English.
- Public WhatsApp: +55 21 96681-9928.
- Public email: contact@travelrick.com.
- Instagram: @ricktravelbrasil.
- Approved institutional positioning: Rick Travel is a travel agency focused on local tourism experiences in Rio de Janeiro, Brazil.
- Approved general service scope: guided tours, local tourism experiences, visits, personalized travel orientation, and initial traveler support.

These values remain safe only when used in the approved form and without adding unsupported credibility, price, availability, guarantee, payment, or safety claims.

## 5. Website Content Aligned With Approved Values

The current website content appears aligned in these areas:

- Brand references to Rick Travel are broadly aligned with the approved brand value.
- Rio de Janeiro positioning appears throughout public pages and aligns with the approved service base and service region.
- General guided tours, local tourism experiences, traveler orientation, and local support align with approved service scope when phrased without unsupported trust or guarantee claims.
- Email references to contact@travelrick.com align with the approved public email when presented as a public contact channel.
- Instagram references to @ricktravelbrasil align with the approved social channel.
- Manual support and assisted booking language is directionally aligned when it makes clear that the team confirms details and that sensitive or uncertain topics require human contact.
- Portuguese, Spanish, and English website content aligns with the approved language support set. Swedish content exists in `messages/sv.json`; it should not be treated as an approved AI Concierge language until separately approved.

## 6. Website Content Requiring Review Or Rewrite

The following website content should be reviewed before any website sync implementation. This list is audit-only and does not authorize edits in this task.

- `app/[locale]/layout.tsx` includes metadata references to Cadastur, accredited guide status, and credential-style guide claims. These remain pending or blocked unless exact evidence, owner approval, wording, review date, and usage flags are recorded.
- `app/[locale]/(public)/page.tsx` uses licensed/accredited/certified team wording, safer booking language, and renders testimonials. These claims require review against the credibility evidence approval scope.
- `app/[locale]/(public)/contato/page.tsx` includes Cadastur/accredited guide wording and should be reviewed before public sync.
- `app/[locale]/(public)/quem-somos/page.tsx` includes security-oriented language that should be checked against the blocked safety-claim rules.
- `components/hero-section.tsx` includes social proof, rating, licensed guide, secure operation, and fast-response claims. These are not approved by RT-AI-010 and should be removed or rewritten unless separately approved.
- `components/footer.tsx` includes Cadastur or government seal imagery and security-oriented wording. The footer also references schedule/availability follow-up; any final wording must preserve human confirmation and avoid confirmed availability.
- `components/testimonials.tsx` contains hard-coded testimonial, rating, and attribution content. Testimonials, reviews, ratings, rankings, and customer quotes remain blocked until verifiable source, consent, attribution, date, and approved excerpt are recorded.
- `components/about/security-section.tsx` contains Cadastur seal content, registration/status claims, guide credential references, a CNPJ-like public value, an unapproved WhatsApp value, service-hour language, and compliance-style wording. These are high-risk items and must not be treated as approved by this audit.
- `components/about/why-choose-us.tsx` includes a certified-style feature identifier that should be reviewed before sync.
- `components/trips/tour-detail-client.tsx` includes licensed or credentialed guide confidence copy that requires separate evidence approval.
- `components/trips/tour-actions.tsx` includes price, payment, and availability-related copy. These may remain only as manual confirmation or catalog display wording when already supported by the product flow; they must not imply final price, instant availability, or online payment approval.
- `components/trips/trip-card.tsx` and `components/trips/tour-media-badges.tsx` can display price, rating, and review-related fields. Ratings, reviews, rankings, and social proof remain blocked unless separately approved.
- `messages/en.json`, `messages/es.json`, `messages/pt.json`, and `messages/sv.json` include credential, Cadastur, certification, safety, insurance, testimonial, rating, guarantee, price, payment, and availability language that requires review before any website sync.

## 7. Blocked Or Pending Claims

The following remain blocked or pending unless an existing governance document explicitly approves exact source, wording, usage flags, and review date:

- CNPJ.
- Cadastur.
- Guide credentials.
- Certified, licensed, registered, insured, official, or safe claims.
- Testimonials, reviews, ratings, rankings, review counts, and customer quotes.
- Prices, except where already supported by current catalog display and still subject to manual confirmation wording.
- Real-time availability.
- Payment details.
- Guarantees.
- Customer data.
- Private address.
- Personal documents.

No blocked or pending item above is approved by this audit.

## 8. Recommended Future Website Sync Scope

A possible future website sync task may be useful after this audit is reviewed. It should be limited to copy/content synchronization and should not be opened by this document.

The future sync should:

- Replace unsupported credibility and trust wording with approved institutional positioning.
- Remove or rewrite Cadastur, CNPJ, guide credential, testimonial, rating, review, guarantee, safety, insurance, official, and certification-style claims unless exact approvals exist.
- Confirm that public contact surfaces use only the approved public WhatsApp, public email, and Instagram values.
- Preserve manual handoff language for price, payment, availability, credential, legal, tax, safety, insurance, and disputed evidence questions.
- Keep website approval separate from future AI Concierge approval.

## 9. Non-Goals

This audit does not authorize:

- Website changes.
- Component changes.
- Messages changes.
- Runtime work.
- Chatbot work.
- Schema work.
- RAG work.
- Embeddings work.
- LangChain or LangGraph work.
- JSON, YAML, or seed work.
- API, frontend, backend, or database changes.
- Production release action.
- Real credential values.
- Real CNPJ values.
- Real Cadastur numbers.
- Guide credential numbers.
- Testimonials.
- Ratings.
- Prices as final commercial commitments.
- Real-time availability claims.
- Guarantees.
- Customer data.
- Payment data.
- Private address.
- Personal documents.

## 10. Audit Result

Result: PASS_WITH_REVIEW_ITEMS.

Rationale: the website contains several approved low-risk public values, including Rick Travel, Rio de Janeiro, Brazil, Portuguese, Spanish, English, contact@travelrick.com, @ricktravelbrasil, and general guided-tour positioning. It also contains multiple blocked or pending credibility, testimonial, rating, safety, guarantee, price, availability, payment, and credential-related claims that require review or rewrite before a future website sync.
