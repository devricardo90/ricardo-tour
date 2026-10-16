# RT-115 [RT-RB-S10-05] — Editorial structure PT/EN/ES for the four tours

- Date: 2026-10-16. Status: **structure ready; content waiting for the Owner's decisions (RT-112).** This ticket stays open until the content is approved; nothing here is commercial information.

## 1. Fields per tour (stored in `TripContent`, RT-113)
| Field | Type | Length guidance | Source (RT-112 item) | Status |
|---|---|---|---|---|
| `summary` | text PT/EN/ES | 1 sentence, ≤ 160 characters (also used as meta description) | rewrite of the published summary | waiting (Colombo/Rocinha conflicts B2/B3) |
| `description` | text PT/EN/ES, paragraphs | 2–4 short paragraphs | Owner facts | waiting |
| `durationLabel` | text PT/EN/ES | e.g. "5–6 horas" | published value (confirm) | pre-filled from site |
| `meetingPoint` | text PT/EN/ES | address or pickup rule | A4 | waiting |
| `startTimeNote` | text PT/EN/ES | time or window | A3 | waiting |
| `languages` | ISO codes | `pt`, `en`, `es`… | A2 | waiting |
| `inclusions` / `exclusions` | lists PT/EN/ES, same number of items | short nouns | published lists (confirm/correct) | pre-filled; Colombo exclusion in conflict (B3) |
| itinerary stops | title + optional description PT/EN/ES + minutes | 3–8 stops | Owner route | waiting |
| `requirements` | text PT/EN/ES | age, effort, mobility | A5 + per tour | waiting |
| `accessibility` | text PT/EN/ES | only confirmed facts | per tour | waiting |
| `weatherPolicy` | text PT/EN/ES | same wording as RT-81 | A6 / RT-81 | waiting |
| `source` | free text | "RT-112 intake <date>" | — | set at entry |

Prices are **not** part of the editorial content (they stay on the tour and change only by Owner decision via RT-119).

## 2. Rules that keep pending information off the public site
1. Content is entered as `DRAFT`; only `OWNER_APPROVED` content is ever public (`toTourContentView`, RT-113).
2. `validateTourContent` must return no issue before approval: PT, EN and ES all present; same item counts; no price-like text; ISO languages; a recorded source and approval date; `MOCK` never approvable.
3. No machine fallback: a missing EN or ES text stays empty publicly (it is not replaced by Portuguese).
4. Claims rule (Volumes I/II): no superlatives or credentials without evidence (e.g. "maior favela do Brasil" needs a source or a rewrite).
5. Translation: EN/ES drafted only after the PT facts are confirmed; each translation reviewed before approval; RT-78 (Sprint 8) does the final site-wide review.

## 3. What can be prepared now vs. what waits
- Ready: storage, validation, gate, prototype rendering, PT/EN/ES labels.
- Waits for the Owner: every fact in §1 marked "waiting", and the resolution of the RT-111 conflicts. RT-115 is **not** finalized with pending commercial data.
