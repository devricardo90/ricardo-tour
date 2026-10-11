/**
 * V1 languages: Portuguese, English and Spanish. The visitor's language is detected from the message itself (a visitor on the
 * Portuguese site may write in English); the page locale is only the fallback. Detection is deterministic and cheap: stop-word
 * scoring over normalized (lowercase, accent-free) text plus a few diacritic marks on the raw text. It never calls a model.
 * Words that are common to several of the three languages (tour, rio, guia, reserva, hotel...) are deliberately NOT counted.
 */
export type Lang = "pt" | "en" | "es";
export const SUPPORTED_LANGS: readonly Lang[] = ["pt", "en", "es"];

const norm = (text: string) => text.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase();

const WORDS: Record<Lang, RegExp> = {
  pt: /\b(?:o|os|as|um|uma|uns|umas|de|do|da|dos|das|em|no|na|nos|nas|para|pra|com|que|quais|qual|quanto|quando|onde|voce|voces|vc|nao|sim|eu|meu|minha|tem|tenho|quero|gostaria|obrigad[oa]|ola|oi|bom dia|boa tarde|passeios?|primeira vez|ver|conhecer|fazer|estou|sao|ser|mais|muito|tambem|pela|pelo|sobre|pode|posso|aqui|preciso|ajuda|roubaram|preco|ja|paguei|celular|disponivel|dura|horas?)\b/g,
  en: /\b(?:the|and|you|your|with|this|that|for|are|is|of|to|what|which|how|much|when|where|do|does|can|could|would|want|like|have|has|i|my|me|we|please|hello|hi|thanks|thank|about|first time|see|visit|any|there|it|in|on|at|from|need|doctor|help|robbed|safe|available|english|speaking|speak|booking|book|price|cost|time|tell|show|was|were|an|am|its|not)\b/g,
  es: /\b(?:el|la|los|las|un|una|unos|unas|del|en|con|para|por|cual|cuales|cuanto|cuando|donde|usted|ustedes|tu|tus|su|mi|mis|me|si|hay|tiene|tienen|tengo|quiero|quisiera|gracias|hola|buenos dias|buenas tardes|paseos?|primera vez|conocer|hacer|estoy|son|mas|muy|tambien|sobre|puedo|puede|aqui|recomiendan|recomiendas|necesito|ayuda|robaron|disponible|ingles|precio|ya|pague|sale|cuesta|dura)\b/g,
};

// Diacritics and punctuation that identify a language even in short messages (matched on the RAW text).
const MARKS: Record<Lang, RegExp> = {
  pt: /[ãõ]|ção|ções/g,
  en: /(?!)/g,
  es: /[ñ¿¡]|ción|ciones/g,
};

export function langFromLocale(locale: string | undefined): Lang | null {
  const match = /^(pt|en|es)(?:[-_][A-Za-z]+)?$/i.exec((locale ?? "").trim());
  return match ? (match[1].toLowerCase() as Lang) : null;
}

export const isSupportedLang = (locale: string) => langFromLocale(locale) !== null;

/** Detects pt/en/es from free text; `fallback` (the page locale) wins ties and ambiguous messages. */
export function detectLanguage(message: string, fallback: Lang = "pt"): Lang {
  const raw = message.toLowerCase();
  const text = norm(message);
  const score = (lang: Lang) => (text.match(WORDS[lang])?.length ?? 0) + 2 * (raw.match(MARKS[lang])?.length ?? 0);
  const scores = new Map(SUPPORTED_LANGS.map((lang) => [lang, score(lang)] as const));
  const best = Math.max(...scores.values());
  if (best === 0) return fallback;
  const leaders = SUPPORTED_LANGS.filter((lang) => scores.get(lang) === best);
  if (leaders.includes(fallback)) return fallback;
  // Another language overrides the page locale when it clearly leads: by 1 when the page language shows no evidence at all, else by 2.
  const fallbackScore = scores.get(fallback) ?? 0;
  return best - fallbackScore >= (fallbackScore === 0 ? 1 : 2) ? leaders[0] : fallback;
}
