# Sprint 11 — Commercial and technical readiness audit (24/10/2026)

Branch `sprint11/commercial-readiness`, created from `dab6a16` (the Preview branch `sprint10/release-prep`). Local work only:
no push, no deploy, no hosted-database access. Production `main` = `5b88ecd` (verified with `git fetch` on 24/10/2026).

Sources: Manual Mestre v0.12+ (Drive; the internal/confidential sections were read but no cost, margin or unapproved price is
copied here), Source of Truth Volume II, Jira project RT (62 open issues read), and the code at `dab6a16`.

Status legend: **APPROVED** (Owner decision recorded) · **PROVISIONAL** · **PENDING** · **BLOCKED** · **TEST ONLY**
(Preview database rehearsal; never an approval).

## 1. Per-tour readiness

| Item | TOUR-01 Cristo + Selarón + Pão de Açúcar | TOUR-02 Favela Rocinha | TOUR-03 Centro Histórico e Cultural |
|---|---|---|---|
| Title / pitch | PT APPROVED (23/10); EN/ES PENDING | PT/EN/ES APPROVED (RT-115 editorial) | PT APPROVED (21/10); EN/ES PENDING (drafts) |
| Body texts (description, itinerary, FAQ) | PENDING — agent drafts, Owner review needed | APPROVED | PT APPROVED; EN/ES PENDING |
| Itinerary / duration | APPROVED (CR-15), ≈ 8 h reference; field timing PENDING | APPROVED, ≈ 3 h | APPROVED: 4 h and 6 h; field timing PENDING |
| Capacity | APPROVED 1–4 | APPROVED 1–4, adults 18+ | APPROVED 1–4 (children count) |
| Meeting / pickup | APPROVED: hotel pickup (Copacabana, Ipanema, Leblon, Botafogo, Flamengo, Centro) | APPROVED: São Conrado station area; exact point by WhatsApp | APPROVED: pickup/return at the agreed address |
| Transport / operator | APPROVED T1 (own car, Ricardo guide-driver); **BLOCKED** until documentary regularization (Manual §10.6.1) | APPROVED: moto-taxi up/down; checklist §11.23 open | APPROVED rented car; **BLOCKED** (Portaria MTur 14/2022, rental contract, insurance) |
| Inclusions / exclusions | APPROVED (tickets included) | APPROVED | APPROVED |
| Price per group size | **PENDING** — proposal awaiting Owner approval (Manual §14.6.12, internal) | **PENDING** — provisional targets (Manual §11.18, internal) | APPROVED (4 h / 6 h tables, +R$120/h per group, "A partir de R$ 260 por pessoa") |
| Costs / margin | Internal only (Manual §14.6) | Internal only (Manual §14.5) | Internal only (Manual §14.7); taxes and card fees not proven |
| Tickets / children | Tickets included; infants 0–2 pay 50% (APPROVED); attraction child fares PENDING (V-05) | Children not in the initial audience | Infants 0–2 pay 50% (APPROVED); **mixed 6 h formula PENDING** |
| Deposit / payment | APPROVED (CR-18): deposit = tickets + 30% of services; balance 70% of services before the tour | APPROVED model: 30% deposit, 70% before the start | APPROVED: 30% deposit; Pix, card or cash |
| Cancellation / refund | PENDING (RT-81/RT-118) | PENDING (staggered principle approved, values pending) | PENDING ("30 dias" wording ambiguous) |
| Availability / calendar | PENDING (no schedule rule; Bondinho/escalator notices) | PENDING (days/hours not defined) | PENDING (attraction opening days researched) |
| Media rights | 4 own photos PENDING proof; third-party Cristo/Selarón **not used** (Owner 24/10); video PROVISIONAL | Visual APPROVED; rights PENDING (visitor authorizations, mural credit) | Visual APPROVED; rights UNVERIFIED |
| Legal / operational | Transport T1 checklist, Cadastur guide category, insurance (APP) | Moto-taxi legality, safety/emergency checklist §11.23 | Rental car + Portaria 14/2022, insurance |
| Preview DB state | TEST ONLY approval (23/10) | TEST ONLY approval (23/10) | TEST ONLY approval (23/10) |

**GO / NO-GO for sales: NO-GO for all three.** Absolute sale blockers common to all: approved Terms with cancellation/refund
(RT-81) and per-tour conditions (RT-118); approved Privacy Policy (RT-80); real (not TEST ONLY) content approval and media
rights in production (RT-116/RT-119); production booking flow and payment recording (Sprint 11B). Per tour: TOUR-01 price
approval + T1 regularization; TOUR-02 price approval + §11.23 checklist; TOUR-03 transport regularization + 6 h mixed-group
formula (4 h can be sold first if the Owner decides so).

### Price/payment discrepancies found (Owner decision needed)
1. **TOUR-01:** the table quoted in the Sprint 11 directive is the earlier proposal that the Manual (§14.6.12) marks as
   superseded by a recommended table under the gasoline T1 scenario. Neither is approved.
2. **TOUR-02:** the directive's 3- and 4-person values differ from the provisional targets in Manual §11.18. Neither is approved.
3. **Deposit base for TOUR-01:** the directive says "30% de sinal" and "70% na coleta"; the Manual (CR-18) says tickets + 30%
   of the services at booking and 70% of the services *before the tour*. The code supports both (see §3) but the rule
   printed to clients must be one.
4. **Payment means:** the directive says "maquininha"; the Manual says "cartão". Card acquirer and fees are not chosen (Manual
   §12/§19 pending), so card payment cannot be offered until the Owner chooses a terminal provider.

## 2. Existing booking flow (code audit at `dab6a16`)

| Area | Finding | Risk |
|---|---|---|
| Tour selection | `POST /api/bookings` requires a session; the four own tours are refused with 409 before DB access (RT-110 partial guard) | OK today; the guard is the only thing preventing obsolete prices |
| Public gate in the API | **Missing**: a non-launch, unpublished or inactive-partner trip could be booked | High → **fixed locally** (§3) |
| Date / time | Optional `TripSchedule` (capacity, per-person price, OPEN/CLOSED); no blackout dates, no daily operation limit | Medium |
| Participants | `guestCount` only; no adult/infant split, no ages | High for group pricing |
| Price | `priceCents × guests` or `schedule.pricePerPersonCents × guests` — **per person**, incompatible with the approved per-group model | High (blocked by RT-110 guard) |
| Customer data | Account (better-auth) only; no phone, pickup address, language, notes on the booking | High |
| Availability / duplicates | Read-then-insert without a transaction: proven overbooking (7 bookings / 14 guests on a 4-seat schedule) and 5 duplicates under concurrency | High → **fixed locally** (§3) |
| States | `PENDING / CONFIRMED / CANCELED`; payment `UNPAID / PAID / PARTIAL / REFUNDED`; no requested/quoted/awaiting-deposit/completed/no-show | High |
| Payments | `PaymentAttempt` built for a PSP checkout; no manual Pix/card-terminal/cash ledger; no deposit/balance amounts | High |
| E-mails | `BOOKING_CONFIRMED` / `PAYMENT_CONFIRMED` templates sent only manually by admin; nothing on create; Resend key absent outside Production | Medium |
| Cancellation | User: online up to 24 h before (hard-coded, **not an approved policy**); admin: any time, payment status untouched | High (legal) |
| Admin | `requireAdminSession` on every admin action and page; list, detail, confirm, cancel; contacts inbox | OK base; no audit log, no quote/payment entry |
| Tour request (live channel) | Guest form → `ContactSubmission` + e-mail; honeypot, rate limit, server validation | OK; this is the current sales channel |
| Abuse protection | Booking API: session only, no rate limit, no same-origin check | Medium |

## 3. Local work done in this sprint (tests below)

1. **RT-110 public gate in the booking API** (`lib/services/booking.service.ts`): the API now calls `getPublicTripById`, the same gate as the tour page and the request form
   (launch allowlist, published, Rio, active and identified partner, integrity) after the price guard. A hidden trip
   answers exactly like a missing one (404, same body).
2. **Serialized booking write**: duplicate check, capacity check and insert run in one transaction under
   `pg_advisory_xact_lock` (key per schedule, or per user+trip without a schedule).
   Proof on a disposable local PostgreSQL (container `ricktravel-db`, database created, marked local-isolated by RT-104,
   migrated, then dropped): old code 7 bookings / 5 duplicates; new code 2 bookings (4/4 seats) and 1 booking, 3 runs.
3. **Group pricing and deposit module** (`lib/commerce/group-pricing.ts`): holds no price; validates a table passed in;
   TOTAL = P(N) × (A + 0,5 × B) rounded once; deposit = I + bp × (T − I); deposit + balance = total. Cross-checked against
   the existing TOUR-03 calculator for every 4 h/6 h party.

Not done on purpose: no schema change, no price stored, no booking opened, no payment provider, no e-mail sent.

## 4. Pão de Açúcar video (IMG_1157.MOV)

| Check | Result |
|---|---|
| Original | `ORIGINAIS/IMG_1157.MOV`, 63.2 s, HEVC 3840×2160 HLG + AAC; SHA-256 `7aa643be…83e9` matches the register |
| Cut | Owner window A 41–58 s (17 s); version A is not in the Drive, only version B 43–57 s (HDR-tagged); rendition A produced from the original |
| Desktop rendition | H.264 High 720×1280, 30 fps, BT.709 SDR, 1.34 Mbps, 2.85 MB, faststart, **no audio**, no GPS/Apple tags |
| Mobile rendition | same, 0.98 Mbps, 2.08 MB, served by `<source media="(max-width: 767px)">` |
| Poster | 720×1280 JPEG, frame 51 s, 121 KB |
| Content | Botafogo Bay, city and Christ the Redeemer in the distance; no people (contact sheets in `docs/baseline/s11-pao-video-review/`) |
| Player | Same component as the approved Rocinha clip: no autoplay, `preload="none"`, poster, click to play |
| Rights | Own video, declared by the Owner; written proof of rights PENDING like the photos |
| Status | **PROVISIONAL** — hidden by the presentation gate in every locale until the Owner approves playback |

Integration is already in place and needs only the editorial decision: after the Owner approves, set `PAO_VIDEO.status` to
`CONFIRMED` (one line plus tests). Media publication still requires real rights verification in the database.

## 5. TEST ONLY rollback (not executed)
Moment: before any production content load (RT-119) or whenever the Owner wants the Preview back to DRAFT. Procedure (Preview
database only, needs authorization): set the 18 media rows whose note starts with "TEST ONLY" back to `UNVERIFIED`; the
RT-119 triggers clear `publicationApprovedAt` and demote TOUR-01/02/03 to DRAFT; verify with the read-only state script.
