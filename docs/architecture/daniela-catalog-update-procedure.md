# Daniela — controlled catalog update procedure (V1)

No new admin panel and no change to the RAG architecture: updating what Daniela knows is a short, reviewable, test-guarded procedure.

## Sources of truth (one per concern)

| Concern | Where | Guard |
| --- | --- | --- |
| What Daniela may *say* (descriptions, itinerary, policies) | approved knowledge snapshot `knowledge/concierge/versions/public-tour-catalog/<id>/` + registry, synced to the hosted vector store (RT-69) | `npm run check:concierge-sources` |
| Which tours she may *recommend* (card title, photo, path, keywords) | `knowledge/concierge/catalog/approved-tour-cards.json` | `tests/ai-concierge-tours.test.ts` compares id, title, path and the PT summary with the snapshot |
| What the site publishes | the published trips (`LAUNCH_TRIP_IDS`) | existing catalog tests |

Commercial facts (price, inclusions, schedules, availability) are never stored or stated by Daniela; they stay on the tour page or with the team.

## Add / change / remove a tour

1. Publish (or unpublish) the trip on the site as usual and update `LAUNCH_TRIP_IDS`.
2. `npm run snapshot:concierge-catalog` regenerates the approved snapshot from the published data.
3. Register/sync the changed source (RT-69 registry + hosted publication) following `rt-69-concierge-ingestion-process.md`; then `npm run check:concierge-sources`.
4. Edit `approved-tour-cards.json`: add/remove the entry (id, title, path, image, PT/EN/ES summary and alt text, keywords, mention words) and adjust `default_recommendations`; bump `version`.
5. `npx vitest run tests/ai-concierge-tours.test.ts tests/ai-concierge-v1-review.test.ts`, then the evaluation: `npx tsx scripts/rt-75-evaluation.ts --offline` (and the live run when the model or knowledge changed).
6. Review the diff (a human approves the new card text) and merge. Nothing else to deploy: the file is bundled with the app.

A tour not present in the cards file is "not in the catalog": Daniela states the limitation, never substitutes another tour and offers the team on WhatsApp (`catalog-scope.ts`).
