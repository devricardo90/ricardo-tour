/**
 * Requests for a destination or activity that is NOT in the approved catalog (Owner, 2026-10-11): never invent information, never
 * silently swap in another tour, state the limitation and offer WhatsApp. Detection is deterministic and conservative:
 *  1. a curated list of well-known destinations/activities Ricardo Tour does not publish (normalized, pt/en/es), and
 *  2. a capitalized place name after a preposition ("para Bonito", "to Florianópolis") that is not a known Rio/catalog name.
 * When in doubt the request is answered by the usual flow; this gate only fires on a clear signal. The reply never echoes the
 * visitor's words.
 */
const norm = (text: string) => text.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase().replace(/\s+/g, " ").trim();

const OUT_OF_CATALOG_TERMS = [
  // destinations
  "buzios", "paraty", "petropolis", "angra dos reis", "angra", "ilha grande", "arraial do cabo", "cabo frio", "teresopolis", "itatiaia",
  "sao paulo", "salvador", "foz do iguacu", "iguazu", "iguacu", "bonito", "florianopolis", "gramado", "fernando de noronha", "noronha",
  "lencois maranhenses", "amazonia", "amazon", "pantanal", "recife", "belo horizonte", "ouro preto", "brasilia", "fortaleza", "jericoacoara",
  "ubatuba", "ilhabela", "campos do jordao", "niteroi", "marica", "saquarema", "cabo de santo agostinho", "maceio", "natal", "porto de galinhas",
  // activities
  "parapente", "paragliding", "paraglide", "parapente", "asa delta", "asa-delta", "hang gliding", "hang glider", "helicoptero", "helicopter",
  "mergulho", "scuba", "diving", "snorkel", "rafting", "tirolesa", "zipline", "zip line", "bungee", "quadriciclo", "buggy", "kitesurf", "stand up paddle",
  "passeio de barco", "boat tour", "boat trip", "paseo en barco", "passeio de escuna", "escuna", "veleiro", "sailing", "catamara", "catamaran",
  "maracana", "escola de samba", "samba school", "carnaval", "carnival tour", "show de samba", "samba show", "feijoada", "bike tour", "passeio de bicicleta",
];

/** Names that are inside Rio or part of the published catalog: a capitalized word that is one of these is never "another destination". */
const KNOWN_PLACE_WORDS = new Set([
  "rio", "janeiro", "brasil", "brazil", "cristo", "christ", "redentor", "redeemer", "corcovado", "pao", "acucar", "sugarloaf", "pan", "azucar",
  "rocinha", "colombo", "confeitaria", "copacabana", "ipanema", "leblon", "lapa", "tijuca", "santa", "teresa", "centro", "botafogo", "flamengo",
  "urca", "leme", "barra", "tour", "city", "premium", "privado", "ricardo", "daniela", "pt", "en", "es", "ia", "ai", "whatsapp", "pix", "cadastur", "oner", "google", "instagram", "pdf", "visa", "mastercard", "iphone",
  "favela", "guanabara", "escadaria", "selaron", "maracana", "portugues", "ingles", "espanhol", "portuguese", "english", "spanish", "espanol", "ingles",
]);

const PREPOSITION_PLACE = /(?:^|[\s,.;:!?¿¡(])(?:em|para|pra|no|na|nos|nas|ao|a|à|to|in|at|en|hacia|por|visit(?:ar|ing)?|conhecer|conocer)\s+((?:[A-ZÁÉÍÓÚÂÊÔÃÕÇÑ][\p{L}'-]+)(?:\s+(?:de|do|da|dos|das|del|of)?\s*[A-ZÁÉÍÓÚÂÊÔÃÕÇÑ][\p{L}'-]+)*)/gu;

function termPresent(text: string) {
  return OUT_OF_CATALOG_TERMS.some((term) => new RegExp(`(?:^|[^a-z0-9])${term.replace(/[-\s]+/g, "[-\\s]+")}(?:[^a-z0-9]|$)`).test(text));
}

/** True when the message clearly asks about a destination/activity that Ricardo Tour does not publish. */
export function detectOutOfCatalogRequest(message: string): boolean {
  const text = norm(message);
  if (termPresent(text)) return true;
  for (const match of message.matchAll(PREPOSITION_PLACE)) {
    const words = norm(match[1]).split(" ").filter((word) => !["de", "do", "da", "dos", "das", "del", "of"].includes(word));
    if (words.length > 0 && words.every((word) => !KNOWN_PLACE_WORDS.has(word)) && words[0].length > 2) return true;
  }
  return false;
}
