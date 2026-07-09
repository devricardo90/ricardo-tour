import type { SupportedLocale } from "@/i18n/routing";

export const AI_CONCIERGE_MAX_MESSAGE_LENGTH = 800;

export type AIConciergePageContext = {
  path?: string;
  surface?: "public_site" | "tour_detail" | "contact" | "unknown";
};

export type AIConciergeRequest = {
  locale: SupportedLocale;
  message: string;
  pageContext?: AIConciergePageContext;
};

export type AIConciergeSourceRef = {
  id: string;
  label: string;
  kind: "mock_contract";
};

export type AIConciergeResponse = {
  id: string;
  locale: SupportedLocale;
  answer: string;
  responseKind: "mock";
  handoffRequired: boolean;
  suggestedNextQuestions: string[];
  sourceRefs: AIConciergeSourceRef[];
  safetyFlags: Array<
    | "mock_backend"
    | "human_handoff_required"
    | "no_price_confirmation"
    | "no_availability_confirmation"
  >;
};

export type AIConciergeErrorCode =
  | "FEATURE_DISABLED"
  | "INVALID_REQUEST"
  | "MOCK_BACKEND_ERROR";

export type AIConciergeError = {
  code: AIConciergeErrorCode;
  message: string;
};

export type AIConciergeSuccessEnvelope = {
  status: "success";
  data: AIConciergeResponse;
};

export type AIConciergeErrorEnvelope = {
  status: "error";
  error: AIConciergeError;
};

export type AIConciergeEnvelope =
  | AIConciergeSuccessEnvelope
  | AIConciergeErrorEnvelope;

const SUPPORTED_LOCALES = new Set<SupportedLocale>(["en", "pt", "es", "sv"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeMessage(message: string) {
  return message.replace(/\s+/g, " ").trim();
}

export function parseAIConciergeRequest(body: unknown):
  | { ok: true; value: AIConciergeRequest }
  | { ok: false; error: AIConciergeError } {
  if (!isRecord(body)) {
    return {
      ok: false,
      error: {
        code: "INVALID_REQUEST",
        message: "Request body must be an object.",
      },
    };
  }

  const locale = body.locale;
  const message = body.message;

  if (typeof locale !== "string" || !SUPPORTED_LOCALES.has(locale as SupportedLocale)) {
    return {
      ok: false,
      error: {
        code: "INVALID_REQUEST",
        message: "A supported locale is required.",
      },
    };
  }

  if (typeof message !== "string") {
    return {
      ok: false,
      error: {
        code: "INVALID_REQUEST",
        message: "Message is required.",
      },
    };
  }

  const normalizedMessage = normalizeMessage(message);

  if (!normalizedMessage) {
    return {
      ok: false,
      error: {
        code: "INVALID_REQUEST",
        message: "Message cannot be empty.",
      },
    };
  }

  if (normalizedMessage.length > AI_CONCIERGE_MAX_MESSAGE_LENGTH) {
    return {
      ok: false,
      error: {
        code: "INVALID_REQUEST",
        message: `Message must be ${AI_CONCIERGE_MAX_MESSAGE_LENGTH} characters or fewer.`,
      },
    };
  }

  let pageContext: AIConciergePageContext | undefined;

  if (isRecord(body.pageContext)) {
    const surface = body.pageContext.surface;

    pageContext = {
      path:
        typeof body.pageContext.path === "string"
          ? body.pageContext.path.slice(0, 200)
          : undefined,
      surface:
        surface === "public_site" ||
        surface === "tour_detail" ||
        surface === "contact" ||
        surface === "unknown"
          ? surface
          : undefined,
    };
  }

  return {
    ok: true,
    value: {
      locale: locale as SupportedLocale,
      message: normalizedMessage,
      pageContext,
    },
  };
}

export function createAIConciergeError(
  code: AIConciergeErrorCode,
  message: string
): AIConciergeErrorEnvelope {
  return {
    status: "error",
    error: {
      code,
      message,
    },
  };
}
