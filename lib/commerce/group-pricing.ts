// Sprint 11 (local): pure price and deposit calculation for the private tours. It holds NO price: every amount comes
// from a table passed by the caller, and no table is stored here or in the database by this module. A table becomes
// usable for sales only after the Owner approves it and it is stored through the reviewed commercial flow (RT-110 /
// price publication gate); until then the tours stay on "orçamento sob consulta".
//
// Rules implemented, as recorded in the Manual Mestre (Owner decisions, 18/10/2026):
// - Closed price per group, by number of participants (TOUR-01 CR-12; TOUR-03 Ficha v1.0; TOUR-02 §11.18 model).
// - Children 0–2 years inclusive pay 50% of the per-person price of the group band; from 3 years, 100%; every child
//   counts for capacity and for the band (TOUR-01 CR-13/CR-14, TOUR-03 §12). TOTAL = P(N) × (A + 0,5 × B), in cents.
// - Deposit (TOUR-01 CR-18, §10.19): S = T − I; at booking I + 30% of S; balance 70% of S. With no tickets bought in
//   advance (I = 0) this is simply 30% / 70% of the total, which is the general decision for the other tours.
// The percentage is a parameter so that a different Owner decision does not need a code change.

export type GroupPriceTable = {
  currency: "BRL";
  /** Total price of the whole group, in cents, indexed by number of participants (1..maxParticipants). */
  groupTotalCents: Readonly<Record<number, number>>;
};

export type PartyComposition = {
  /** Participants aged 3 or more (adults and children who pay the full per-person price). */
  fullFare: number;
  /** Children aged 0 to 2 inclusive (50% of the per-person price of the band). */
  infants: number;
};

export type GroupQuote = {
  participants: number;
  /** P(N): per-person price of the band, in cents (may carry a fraction of a cent before rounding the total). */
  perPersonCents: number;
  totalCents: number;
  currency: "BRL";
};

export type DepositSplit = {
  totalCents: number;
  /** Tickets bought by the agency at booking time (I); 0 when the tour has no prepaid tickets. */
  prepaidTicketsCents: number;
  depositCents: number;
  balanceCents: number;
  /** Deposit share of the services part (S = T − I), in basis points (3000 = 30%). */
  depositBasisPoints: number;
};

export type PricingErrorCode =
  | "INVALID_TABLE"
  | "INVALID_PARTY"
  | "NO_ADULT_RESPONSIBLE"
  | "PARTY_TOO_LARGE"
  | "INVALID_AMOUNT";

export class PricingError extends Error {
  constructor(public readonly code: PricingErrorCode, message: string) {
    super(message);
    this.name = "PricingError";
  }
}

export const DEFAULT_DEPOSIT_BASIS_POINTS = 3000;

const isNonNegativeInt = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0;

/** Validates a table: bands 1..N contiguous, positive integer cents, BRL. Returns the largest band (max participants). */
export function validateGroupPriceTable(table: GroupPriceTable): number {
  if (!table || table.currency !== "BRL" || !table.groupTotalCents) {
    throw new PricingError("INVALID_TABLE", "Tabela de precos invalida");
  }
  const bands = Object.keys(table.groupTotalCents).map(Number).sort((a, b) => a - b);
  if (bands.length === 0 || bands.some((band, index) => band !== index + 1)) {
    throw new PricingError("INVALID_TABLE", "A tabela precisa ter faixas contiguas a partir de 1 participante");
  }
  for (const band of bands) {
    const value = table.groupTotalCents[band];
    if (!Number.isInteger(value) || value <= 0) {
      throw new PricingError("INVALID_TABLE", `Valor invalido para a faixa de ${band} participante(s)`);
    }
  }
  return bands[bands.length - 1];
}

/** Price of a party under a group table, applying the infant rule. Rounds once, on the total, to whole cents. */
export function quoteGroupPrice(table: GroupPriceTable, party: PartyComposition): GroupQuote {
  const maxParticipants = validateGroupPriceTable(table);
  if (!isNonNegativeInt(party?.fullFare) || !isNonNegativeInt(party?.infants)) {
    throw new PricingError("INVALID_PARTY", "Quantidade de participantes invalida");
  }
  // Children always travel with a responsible person; a party needs at least one full-fare participant.
  if (party.fullFare < 1) {
    throw new PricingError("NO_ADULT_RESPONSIBLE", "A reserva precisa de pelo menos um participante pagante integral");
  }
  const participants = party.fullFare + party.infants;
  if (participants > maxParticipants) {
    throw new PricingError("PARTY_TOO_LARGE", `Maximo de ${maxParticipants} participantes`);
  }
  const groupTotal = table.groupTotalCents[participants];
  const perPersonCents = groupTotal / participants;
  // TOTAL = P(N) × (A + 0,5 × B) = groupTotal × (2A + B) / (2N), computed in integers before the single rounding.
  const totalCents = Math.round((groupTotal * (2 * party.fullFare + party.infants)) / (2 * participants));
  return { participants, perPersonCents, totalCents, currency: "BRL" };
}

/** Deposit at booking and balance before the tour: deposit = I + bp × (T − I); balance = T − deposit. */
export function splitDeposit(
  totalCents: number,
  prepaidTicketsCents = 0,
  depositBasisPoints = DEFAULT_DEPOSIT_BASIS_POINTS,
): DepositSplit {
  if (!isNonNegativeInt(totalCents) || totalCents === 0 || !isNonNegativeInt(prepaidTicketsCents)) {
    throw new PricingError("INVALID_AMOUNT", "Valores precisam ser centavos inteiros");
  }
  if (prepaidTicketsCents > totalCents) {
    throw new PricingError("INVALID_AMOUNT", "Os ingressos nao podem exceder o total");
  }
  if (!Number.isInteger(depositBasisPoints) || depositBasisPoints < 0 || depositBasisPoints > 10000) {
    throw new PricingError("INVALID_AMOUNT", "Percentual de sinal invalido");
  }
  const services = totalCents - prepaidTicketsCents;
  const depositCents = prepaidTicketsCents + Math.round((services * depositBasisPoints) / 10000);
  return {
    totalCents,
    prepaidTicketsCents,
    depositCents,
    balanceCents: totalCents - depositCents,
    depositBasisPoints,
  };
}
