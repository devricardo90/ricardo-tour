import { z } from "zod";

// RT-64: the only shape the browser may send. Strict: unknown keys are rejected, so nothing accidental (form values,
// cookies, user text) can ride along. Free text is limited to an error name/message that the server sanitizes again.
const path = z.string().max(300);

export const clientErrorSchema = z
  .object({
    kind: z.literal("error"),
    source: z.enum(["client_boundary", "client_runtime"]),
    name: z.string().max(60),
    message: z.string().max(500),
    path,
    digest: z.string().max(40).optional(),
  })
  .strict();

export const clientVitalSchema = z
  .object({
    kind: z.literal("vital"),
    name: z.enum(["CLS", "FCP", "INP", "LCP", "TTFB"]),
    value: z.number().finite().min(0).max(600_000),
    rating: z.enum(["good", "needs-improvement", "poor"]),
    path,
  })
  .strict();

export const clientReportSchema = z.discriminatedUnion("kind", [clientErrorSchema, clientVitalSchema]);
export type ClientReport = z.infer<typeof clientReportSchema>;

export const MAX_CLIENT_REPORT_BYTES = 2_048;
