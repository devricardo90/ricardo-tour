// Sprint 11 (local): pure price and deposit calculation for the private tours. It holds NO price: every amount comes
// from a table passed by the caller, and no table is stored here or in the database by this module. A table becomes
// usable for sales only after the Owner approves it and it is stored through the reviewed commercial flow (RT-110 /
// price publication gate); until then the tours stay on "orçamento sob consulta".
//
// Rules implemented:
// - Closed price per group, by number of participants (TOUR-01 CR-12; TOUR-03 Ficha v1.0; TOUR-02 §11.18 model).
// - Infant formula (TOUR-01 CR-13/CR-14): children 0–2 pay 50% of the per-person price of the band and count for the
//   band; TOTAL = P(N) × (A + 0,5 × B), in cents. It applies ONLY to a table whose child policy the Owner approved
//   (price-tables.ts); it is never extended to another tour automatically.
// - Deposit (RT-121, Owner decision 26/10/2026, ALL tours, TOUR-01 included with its tickets inside the total):
//   deposit = 30% of the TOTAL, balance = 70% of the TOTAL, paid at the start of the tour. The former TOUR-01
//   "tickets + 30% of services" formula (CR-18) is discarded.

/** RT-121: deposit share of the total, in basis points (3000 = 30%). */
export const DEPOSIT_BASIS_POINTS = 3000;

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
  depositCents: number;
  balanceCents: number;
  /** Deposit share of the total, in basis points (RT-121: 3000 = 30%). */
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

/**
 * RT-121 deposit and balance of a total, in whole cents: deposit = 30% of the total rounded half up to the cent (only
 * when the total is not a multiple of 10 cents), balance = total − deposit, so the two always add up to the total.
 */
export function splitDeposit(totalCents: number): DepositSplit {
  if (!Number.isSafeInteger(totalCents) || totalCents <= 0) {
    throw new PricingError("INVALID_AMOUNT", "Valores precisam ser centavos inteiros");
  }
  // Integer arithmetic only: floor((T × bp + 5000) / 10000) is T × bp / 10000 rounded half up.
  const depositCents = Math.floor((totalCents * DEPOSIT_BASIS_POINTS + 5000) / 10000);
  return { totalCents, depositCents, balanceCents: totalCents - depositCents, depositBasisPoints: DEPOSIT_BASIS_POINTS };
}
