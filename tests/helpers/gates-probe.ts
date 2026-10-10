import { detectAbuse, detectCompetitorComparison, detectEmergency, detectInjection, detectInternalInfoRequest, runGates } from "@/lib/ai-concierge/runtime/gates";

/** Classifies a message with every deterministic pre-retrieval gate of the runtime; "pass" means it would reach retrieval. */
export function gates(message: string): string {
  if (detectEmergency(message)) return "emergency";
  if (detectInjection(message)) return "injection";
  if (detectInternalInfoRequest(message)) return "internal_information";
  if (detectAbuse(message)) return "abuse";
  if (detectCompetitorComparison(message)) return "comparison";
  const gate = runGates(message);
  return gate.kind === "pass" ? "pass" : `${gate.kind}:${gate.reason}`;
}
