import { isRebuildLabEnabled } from "@/lib/rebuild-lab/config";
import { PRIVACY_REVIEW_STATUS } from "@/lib/legal/privacy-copy";
import { TERMS_REVIEW_STATUS } from "@/lib/legal/terms-copy";

/**
 * RT-80/RT-81 (Owner 30-31/10/2026, local): public Terms of Use and Privacy Policy routes, footer links and the
 * contractual acceptance in the booking request form.
 *
 * The documents are still DRAFTS pending the legal review, and the Owner forbids publishing them without it. So the
 * routes and links exist in code but are AVAILABLE only:
 *  - publicly, once both documents are APPROVED by the Owner and by the legal review (status recorded in the copy files);
 *  - locally, wherever the rebuild lab is enabled (never on a deployment by default), for review.
 * Anywhere else /termos and /privacidade answer 404 and the footer shows no legal links, exactly as today.
 */
export const LEGAL_PATHS = { terms: "/termos", privacy: "/privacidade" } as const;

/**
 * Version of each document as shown to the customer. The booking request stores the versions it was accepted with, so
 * any change to a document's text must come with a new version (a test pins the text fingerprint to the version).
 */
export const LEGAL_DOCUMENT_VERSIONS = { terms: "2026-10-31-draft", privacy: "2026-10-31-draft-r2" } as const;

/**
 * The Privacy Policy shown without the Daniela section (concierge disabled, Owner 31/10/2026) is the base version; the
 * variant with Daniela carries a suffix, so a stored acceptance names exactly the text that was shown.
 */
export const privacyVersionFor = (conciergeEnabled: boolean) => (conciergeEnabled ? `${LEGAL_DOCUMENT_VERSIONS.privacy}+daniela` : LEGAL_DOCUMENT_VERSIONS.privacy);

const approved = (status: { owner_approval: string; legal_review: string }) => status.owner_approval === "APPROVED" && status.legal_review === "APPROVED";

/** Both documents approved by the Owner and by the legal review: the only state in which they may go public. */
export function legalPagesPublished(terms = TERMS_REVIEW_STATUS, privacy = PRIVACY_REVIEW_STATUS) {
  return approved(terms) && approved(privacy);
}

/** Whether the legal routes render (and the footer links them) in this environment. */
export function legalPagesAvailable(env: Record<string, string | undefined> = process.env) {
  return legalPagesPublished() || isRebuildLabEnabled(env);
}

export const legalHref = (locale: string, page: keyof typeof LEGAL_PATHS) => `/${locale === "en" || locale === "es" ? locale : "pt"}${LEGAL_PATHS[page]}`;
