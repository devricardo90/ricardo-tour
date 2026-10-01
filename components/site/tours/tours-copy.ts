// Interface copy for the public tours listing (PT / EN / ES). Trip content (titles, descriptions) comes from the database
// and is NOT translated here; its language gaps are a data matter, reported separately.
export const toursCopy = {
  pt: {
    eyebrow: "EXPERIÊNCIAS NO RIO",
    heading: "Nossos passeios no Rio",
    intro: "Passeios guiados e experiências de turismo local no Rio de Janeiro.",
    searchLabel: "Buscar passeios",
    searchPlaceholder: "Buscar por passeio ou lugar",
    searchButton: "Buscar",
    pricePerPerson: "Preço por pessoa",
    viewDetails: "Ver detalhes",
    countOne: "passeio",
    countMany: "passeios",
    empty: "Nenhum passeio encontrado para essa busca.",
    clear: "Limpar busca",
  },
  en: {
    eyebrow: "EXPERIENCES IN RIO",
    heading: "Our tours in Rio",
    intro: "Guided tours and local tourism experiences in Rio de Janeiro.",
    searchLabel: "Search tours",
    searchPlaceholder: "Search by tour or place",
    searchButton: "Search",
    pricePerPerson: "Price per person",
    viewDetails: "View details",
    countOne: "tour",
    countMany: "tours",
    empty: "No tours match your search.",
    clear: "Clear search",
  },
  es: {
    eyebrow: "EXPERIENCIAS EN RÍO",
    heading: "Nuestros tours en Río",
    intro: "Tours guiados y experiencias de turismo local en Río de Janeiro.",
    searchLabel: "Buscar tours",
    searchPlaceholder: "Buscar por tour o lugar",
    searchButton: "Buscar",
    pricePerPerson: "Precio por persona",
    viewDetails: "Ver detalles",
    countOne: "tour",
    countMany: "tours",
    empty: "Ningún tour coincide con tu búsqueda.",
    clear: "Borrar búsqueda",
  },
} as const;

export type ToursCopy = (typeof toursCopy)[keyof typeof toursCopy];

export function resolveToursCopy(locale: string): ToursCopy {
  return toursCopy[locale as keyof typeof toursCopy] ?? toursCopy.pt;
}
