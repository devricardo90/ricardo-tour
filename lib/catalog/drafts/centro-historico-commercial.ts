import type { LocalizedText, TourContentRecord } from "@/lib/catalog/tour-content";
import { CENTRO_MEDIA_PREVIEW } from "@/lib/catalog/drafts/centro-historico-media";

// Matched by order (cover first, then position). Owner 14/11/2026: the Real Gabinete photo left the gallery, so its alt
// left this list too; every remaining photo keeps the alt it had.
const CENTRO_IMAGE_ALT = [
  { pt: "Igreja da Candelária, no Centro do Rio", en: "Candelária Church in downtown Rio", es: "Iglesia de la Candelária, en el centro de Río" },
  { pt: "Igreja histórica no Centro do Rio", en: "Historic church in downtown Rio", es: "Iglesia histórica en el centro de Río" },
  { pt: "Palácio Tiradentes, no Centro do Rio", en: "Tiradentes Palace in downtown Rio", es: "Palacio Tiradentes, en el centro de Río" },
  { pt: "Região comercial do SAARA", en: "SAARA commercial district", es: "Zona comercial de SAARA" },
  { pt: "Interior de igreja histórica no Centro do Rio", en: "Interior of a historic church in downtown Rio", es: "Interior de una iglesia histórica en el centro de Río" },
  { pt: "Museu do Amanhã, na Praça Mauá", en: "Museum of Tomorrow at Praça Mauá", es: "Museo del Mañana en Praça Mauá" },
] as const;

const CENTRO_IMAGE_ALT_BY_SOURCE = new Map(
  [...CENTRO_MEDIA_PREVIEW.images]
    .sort((a, b) => Number(b.isCover) - Number(a.isCover) || a.position - b.position)
    .map((image, index) => [image.src, CENTRO_IMAGE_ALT[index]] as const),
);

export type CentroItineraryVariant = {
  id: "essential-4h" | "porto-maravilha-6h";
  title: LocalizedText;
  durationLabel: LocalizedText;
  durationMinutes: number;
  stops: Array<{
    position: number;
    title: LocalizedText;
    durationMinutes: number;
  }>;
};

/** Owner-approved routes, still requiring day-by-day opening checks and an on-foot timing run. */
export const CENTRO_ROUTE_OPTIONS: readonly CentroItineraryVariant[] = [
  {
    id: "essential-4h",
    title: { pt: "Centro Histórico Essencial", en: "Essential Historic Center", es: "Centro Histórico Esencial" },
    durationLabel: { pt: "4 horas de circuito guiado", en: "4-hour guided tour", es: "Recorrido guiado de 4 horas" },
    durationMinutes: 240,
    stops: [
      { position: 0, title: { pt: "Catedral Metropolitana de São Sebastião", en: "Metropolitan Cathedral of Saint Sebastian", es: "Catedral Metropolitana de San Sebastián" }, durationMinutes: 25 },
      { position: 1, title: { pt: "Real Gabinete Português de Leitura", en: "Royal Portuguese Reading Room", es: "Real Gabinete Portugués de Lectura" }, durationMinutes: 35 },
      { position: 2, title: { pt: "Igreja de São Francisco de Paula e Largo de São Francisco", en: "Church of São Francisco de Paula and São Francisco Square", es: "Iglesia de São Francisco de Paula y plaza de São Francisco" }, durationMinutes: 25 },
      { position: 3, title: { pt: "SAARA e região da Uruguaiana", en: "SAARA and the Uruguaiana area", es: "SAARA y la zona de Uruguaiana" }, durationMinutes: 30 },
      { position: 4, title: { pt: "Igreja da Candelária", en: "Candelária Church", es: "Iglesia de la Candelária" }, durationMinutes: 30 },
      { position: 5, title: { pt: "Caminhadas, história, fotografias, pausas e retorno ao estacionamento", en: "Walking, history, photo stops, breaks and return to the parking area", es: "Caminatas, historia, fotografías, pausas y regreso al estacionamiento" }, durationMinutes: 95 },
    ],
  },
  {
    id: "porto-maravilha-6h",
    title: { pt: "Centro Histórico + Porto Maravilha", en: "Historic Center + Porto Maravilha", es: "Centro Histórico + Porto Maravilha" },
    durationLabel: { pt: "6 horas de circuito guiado", en: "6-hour guided tour", es: "Recorrido guiado de 6 horas" },
    durationMinutes: 360,
    stops: [
      { position: 0, title: { pt: "Real Gabinete Português de Leitura", en: "Royal Portuguese Reading Room", es: "Real Gabinete Portugués de Lectura" }, durationMinutes: 35 },
      { position: 1, title: { pt: "Igreja de São Francisco de Paula e região do SAARA", en: "Church of São Francisco de Paula and the SAARA area", es: "Iglesia de São Francisco de Paula y la zona de SAARA" }, durationMinutes: 45 },
      { position: 2, title: { pt: "Igreja da Candelária", en: "Candelária Church", es: "Iglesia de la Candelária" }, durationMinutes: 25 },
      { position: 3, title: { pt: "Praça XV e Palácio Tiradentes", en: "Praça XV and Tiradentes Palace", es: "Praça XV y Palacio Tiradentes" }, durationMinutes: 35 },
      { position: 4, title: { pt: "Cais do Valongo — história da escravização e memória afro-brasileira", en: "Valongo Wharf — the history of enslavement and Afro-Brazilian memory", es: "Muelle de Valongo — historia de la esclavización y memoria afrobrasileña" }, durationMinutes: 40 },
      { position: 5, title: { pt: "Praça Mauá e Museu do Amanhã — visita externa", en: "Praça Mauá and Museum of Tomorrow — exterior visit", es: "Praça Mauá y Museo del Mañana — visita exterior" }, durationMinutes: 30 },
      { position: 6, title: { pt: "Caminhadas, explicações, pausas, fotografias e retorno ao estacionamento", en: "Walking, commentary, breaks, photo stops and return to the parking area", es: "Caminatas, explicaciones, pausas, fotografías y regreso al estacionamiento" }, durationMinutes: 150 },
    ],
  },
];

/**
 * The Ficha v1.0 price table is commercially approved. It remains in the review-only draft because RT-119,
 * image rights, legal terms, and publication authorization are still open. Internal operating costs are excluded.
 */
export const CENTRO_APPROVED_PRICING = {
  status: "CONFIRMED" as const,
  approvedAt: "2026-10-18",
  publishable: false as const,
  currency: "BRL" as const,
  durations: [
    {
      hours: 4 as const,
      label: { pt: "Passeio de 4 horas — Centro Histórico Essencial", en: "4-hour tour — Essential Historic Center", es: "Recorrido de 4 horas — Centro Histórico Esencial" },
      prices: [
        { participants: 1, perPersonCents: 65000, totalCents: 65000 },
        { participants: 2, perPersonCents: 38000, totalCents: 76000 },
        { participants: 3, perPersonCents: 30000, totalCents: 90000 },
        { participants: 4, perPersonCents: 26000, totalCents: 104000 },
      ],
    },
    {
      hours: 6 as const,
      label: { pt: "Passeio de 6 horas — Centro Histórico + Porto Maravilha", en: "6-hour tour — Historic Center + Porto Maravilha", es: "Recorrido de 6 horas — Centro Histórico + Porto Maravilha" },
      prices: [
        { participants: 1, perPersonCents: 89000, totalCents: 89000 },
        { participants: 2, perPersonCents: 50000, totalCents: 100000 },
        { participants: 3, perPersonCents: 38000, totalCents: 114000 },
        { participants: 4, perPersonCents: 32000, totalCents: 128000 },
      ],
    },
  ],
  additionalHourPerGroupCents: 12000,
  infantHalfFareThroughAge: 2,
  depositBasisPoints: 3000,
  paymentMethods: ["pix", "card", "cash"] as const,
};

export type CentroQuoteInput = {
  durationHours: 4 | 6;
  travelerAges: number[];
  extensionHours?: number;
};

export type CentroQuote = {
  durationHours: 4 | 6;
  participants: number;
  perAdultCents: number;
  participantPricesCents: number[];
  baseGroupTotalCents: number;
  extensionHours: number;
  extensionTotalCents: number;
  totalCents: number;
  depositCents: number;
  balanceCents: number;
};

/** Pure quote calculation for review/testing only. This function does not create or confirm a reservation. */
export function calculateCentroQuote({ durationHours, travelerAges, extensionHours = 0 }: CentroQuoteInput): CentroQuote {
  if (durationHours !== 4 && durationHours !== 6) throw new RangeError("durationHours must be 4 or 6");
  if (travelerAges.length < 1 || travelerAges.length > 4) throw new RangeError("The group must contain 1 to 4 tourists");
  if (travelerAges.some((age) => !Number.isInteger(age) || age < 0)) throw new RangeError("Traveler ages must be non-negative whole years");
  if (!Number.isInteger(extensionHours) || extensionHours < 0) throw new RangeError("extensionHours must be a non-negative whole number");

  const row = CENTRO_APPROVED_PRICING.durations.find((duration) => duration.hours === durationHours)?.prices.find((price) => price.participants === travelerAges.length);
  if (!row) throw new RangeError("No approved price exists for this group size");

  const participantPricesCents = travelerAges.map((age) => (age <= CENTRO_APPROVED_PRICING.infantHalfFareThroughAge ? row.perPersonCents / 2 : row.perPersonCents));
  const baseGroupTotalCents = participantPricesCents.reduce((total, price) => total + price, 0);
  const extensionTotalCents = extensionHours * CENTRO_APPROVED_PRICING.additionalHourPerGroupCents;
  const totalCents = baseGroupTotalCents + extensionTotalCents;
  const depositCents = Math.round((totalCents * CENTRO_APPROVED_PRICING.depositBasisPoints) / 10000);

  return {
    durationHours,
    participants: travelerAges.length,
    perAdultCents: row.perPersonCents,
    participantPricesCents,
    baseGroupTotalCents,
    extensionHours,
    extensionTotalCents,
    totalCents,
    depositCents,
    balanceCents: totalCents - depositCents,
  };
}

/** Ficha v1.0 facts for the internal prototype; translations and terms remain open, so the record stays DRAFT. */
export const CENTRO_COMMERCIAL_DRAFT: TourContentRecord = {
  ...CENTRO_MEDIA_PREVIEW,
  images: CENTRO_MEDIA_PREVIEW.images.map((image) => ({ ...image, alt: CENTRO_IMAGE_ALT_BY_SOURCE.get(image.src) ?? image.alt })),
  status: "DRAFT",
  source: "Owner-approved TOUR-03 Ficha Comercial e Operacional v1.0, 18/10/2026; commercial prices and route choices approved; local review only. EN/ES copy, rights, legal/operational checks, and publication authorization remain pending.",
  summary: {
    pt: "Descubra a história, a arquitetura e o patrimônio cultural do Centro do Rio de Janeiro em um passeio privativo com guia.",
    en: "Discover the history, architecture and cultural heritage of downtown Rio de Janeiro on a private guided tour.",
    es: "Descubre la historia, la arquitectura y el patrimonio cultural del centro de Río de Janeiro en un recorrido privado con guía.",
  },
  description: {
    pt: "Explore a história, a arquitetura, as igrejas e o patrimônio cultural do Centro do Rio em uma experiência privativa guiada.\n\nO roteiro acompanha os seus interesses, a duração contratada e o funcionamento dos locais. Visitas internas dependem de abertura e confirmação; a programação pode ser ajustada às condições do dia.\n\nO passeio combina transporte privativo no trajeto contratado, acompanhamento do guia e caminhadas pelo Centro.",
    en: "Explore downtown Rio’s history, architecture, churches and cultural heritage on a private guided experience.\n\nThe itinerary reflects your interests, the tour duration you choose and each venue’s opening schedule. Interior visits depend on opening hours and confirmation; the plan may be adjusted to the conditions on the day.\n\nThe tour combines private transport along the contracted route, a guide throughout the experience and walks through the historic center.",
    es: "Explora la historia, la arquitectura, las iglesias y el patrimonio cultural del centro de Río en una experiencia privada con guía.\n\nEl recorrido se adapta a tus intereses, a la duración contratada y al horario de apertura de cada lugar. Las visitas interiores dependen de la apertura y la confirmación; el plan puede ajustarse a las condiciones del día.\n\nEl paseo combina transporte privado en la ruta contratada, acompañamiento del guía y caminatas por el centro histórico.",
  },
  durationLabel: {
    pt: "Circuito guiado de 4 ou 6 horas, conforme a opção escolhida. Cerca de 1 hora adicional estimada para busca e retorno; o tempo total aproximado é de 5 ou 7 horas, respectivamente.",
    en: "Choose a 4-hour or 6-hour guided tour. Pickup and return add an estimated 1 hour, for an approximate total of 5 or 7 hours, respectively.",
    es: "Elige un recorrido guiado de 4 o 6 horas. La recogida y el regreso añaden aproximadamente 1 hora estimada, para un total aproximado de 5 o 7 horas, respectivamente.",
  },
  meetingPoint: {
    pt: "Busca e retorno ao mesmo endereço combinado, após confirmação logística. Regiões incluídas: Copacabana, Ipanema, Botafogo, Zona Sul e Centro; outros locais admitidos incluem hotéis, Airbnb, residências, porto de cruzeiros e aeroportos. A inclusão de cada endereço depende de confirmação prévia. A retirada nos aeroportos Galeão e Santos Dumont não tem sobretaxa, desde que confirmada previamente. A devolução em endereço diferente não está incluída. A capacidade de bagagens deve ser confirmada para retiradas em aeroportos.",
    en: "Pickup and return are at the same agreed address, subject to logistics confirmation. Included areas are Copacabana, Ipanema, Botafogo, the South Zone and downtown; other eligible locations include hotels, Airbnb stays, residences, the cruise port and airports. Each address must be confirmed in advance. There is no surcharge for pickup at Galeão or Santos Dumont airport, provided it is confirmed in advance. Drop-off at a different address is not included. Luggage capacity must be confirmed for airport pickups.",
    es: "La recogida y el regreso se realizan en la misma dirección acordada, sujetos a confirmación logística. Las zonas incluidas son Copacabana, Ipanema, Botafogo, la Zona Sur y el centro; otros lugares admitidos incluyen hoteles, alojamientos de Airbnb, residencias, el puerto de cruceros y aeropuertos. Cada dirección debe confirmarse con antelación. La recogida en los aeropuertos Galeão y Santos Dumont no tiene recargo, siempre que se confirme previamente. No se incluye el regreso a otra dirección. Debe confirmarse la capacidad para equipaje en las recogidas en aeropuertos.",
  },
  startTimeNote: {
    pt: "Início a partir das 6h; o horário exato é combinado com o cliente. Visitas internas dependem do funcionamento e da confirmação de cada atração.",
    en: "Tours may start from 6:00 a.m.; the exact time is agreed with the guest. Interior visits depend on each attraction’s opening schedule and confirmation.",
    es: "El recorrido puede comenzar a partir de las 6:00; el horario exacto se acuerda con el cliente. Las visitas interiores dependen del horario de apertura y la confirmación de cada atractivo.",
  },
  languages: ["pt", "es", "en"],
  inclusions: {
    pt: [
      "Guia turístico privativo.", "Transporte de ida e volta.", "Veículo próprio, conduzido pelo guia.", "Combustível.", "Estacionamento.", "Circuito histórico acompanhado.", "Água.", "Fotografias informais feitas pelo guia.", "Personalização do roteiro.", "Planejamento das atrações conforme a duração contratada.",
    ],
    en: ["Private tour guide.", "Round-trip transport.", "Private vehicle driven by your guide.", "Fuel.", "Parking.", "Guided historic-center tour.", "Water.", "Informal photos taken by the guide.", "Itinerary personalization.", "Attraction planning according to the contracted duration."],
    es: ["Guía turístico privado.", "Transporte de ida y vuelta.", "Vehículo propio conducido por el guía.", "Combustible.", "Estacionamiento.", "Recorrido guiado por el centro histórico.", "Agua.", "Fotografías informales tomadas por el guía.", "Personalización del recorrido.", "Planificación de los atractivos según la duración contratada."],
  },
  exclusions: {
    pt: [
      "Alimentação.", "Almoço.", "Café.", "Lanches.", "Compras.", "Despesas pessoais.", "Ingresso opcional do Museu do Amanhã.", "Outros ingressos opcionais previamente informados.",
    ],
    en: ["Food.", "Lunch.", "Coffee.", "Snacks.", "Shopping.", "Personal expenses.", "Optional Museum of Tomorrow admission.", "Other optional tickets disclosed in advance."],
    es: ["Alimentación.", "Almuerzo.", "Café.", "Refrigerios.", "Compras.", "Gastos personales.", "Entrada opcional al Museo del Mañana.", "Otras entradas opcionales informadas previamente."],
  },
  requirements: {
    pt: "Passeio exclusivamente privativo para 1 a 4 turistas da mesma reserva. Crianças e bebês contam para o limite e para a faixa de preço e devem estar acompanhados por um responsável. O guia providenciará os dispositivos de retenção infantil necessários; confirme antes da reserva a logística, o endereço de retirada, as bagagens e a compatibilidade dos dispositivos com o grupo.",
    en: "Private tour for 1 to 4 guests on the same booking. Children and infants count toward the capacity and price tier and must be accompanied by a guardian. The guide will provide the required child restraints; confirm logistics, pickup address, luggage and restraint suitability for the group before booking.",
    es: "Paseo exclusivamente privado para 1 a 4 turistas de la misma reserva. Los niños y bebés cuentan para el límite de capacidad y la categoría de precio, y deben ir acompañados por un responsable. El guía proporcionará los sistemas de retención infantil necesarios; antes de reservar, confirma la logística, la dirección de recogida, el equipaje y la compatibilidad de los dispositivos con el grupo.",
  },
  accessibility: {
    pt: "O passeio é realizado predominantemente a pé; o ritmo pode ser adaptado. O veículo padrão não tem adaptação específica para cadeira de rodas. Solicitações de acessibilidade devem ser avaliadas individualmente, com comunicação das limitações e das alternativas possíveis.",
    en: "The tour is mainly on foot, and the pace can be adjusted. The standard vehicle has no specific wheelchair adaptation. Accessibility requests are assessed individually, with any limitations and possible alternatives explained.",
    es: "El paseo se realiza principalmente a pie y el ritmo puede adaptarse. El vehículo estándar no cuenta con adaptación específica para silla de ruedas. Las solicitudes de accesibilidad se evalúan individualmente y se comunican las limitaciones y posibles alternativas.",
  },
  weatherPolicy: {
    pt: "O roteiro pode ser ajustado conforme o clima e o acesso às atrações. Em caso de chuva forte ou fechamento de atrações, a equipe propõe uma alternativa, a remarcação ou o reembolso, conforme os Termos de Uso.",
    en: "The itinerary may be adjusted for weather and access conditions. In case of heavy rain or the closure of attractions, the team offers an alternative, rescheduling or a refund, as set out in the Terms of Use.",
    es: "El recorrido puede ajustarse según el clima y el acceso a los atractivos. En caso de lluvia intensa o cierre de atractivos, el equipo propone una alternativa, la reprogramación o el reembolso, según los Términos de Uso.",
  },
  operationalConditions: {
    // Owner, 27/10/2026 (definitive): own Renault Mégane 2025, Ricardo guide and driver, up to 4 tourists; documents declared
    // by the Owner. The rented-vehicle premise is superseded and must not reappear.
    pt: "Operação própria da Ricardo Tour: Ricardo é o guia e o motorista, em veículo próprio, para até 4 turistas. O horário exato de início é combinado com você.",
    en: "Operated by Ricardo Tour itself: Ricardo is your guide and driver, in a private vehicle, for up to 4 guests. The exact start time is agreed with you.",
    es: "Operación propia de Ricardo Tour: Ricardo es tu guía y conductor, en vehículo propio, para un máximo de 4 turistas. La hora exacta de inicio se acuerda contigo.",
  },
  faq: [
    {
      question: { pt: "Qual passeio posso escolher?", en: "Which itinerary can I choose?", es: "¿Qué recorrido puedo elegir?" },
      answer: {
        pt: "Há duas opções privativas: Centro Histórico Essencial, com 4 horas, e Centro Histórico + Porto Maravilha, com 6 horas. O tempo adicional de busca e retorno é estimado em cerca de 1 hora.",
        en: "There are two private options: Essential Historic Center, lasting 4 hours, and Historic Center + Porto Maravilha, lasting 6 hours. Pickup and return add an estimated 1 hour.",
        es: "Hay dos opciones privadas: Centro Histórico Esencial, de 4 horas, y Centro Histórico + Porto Maravilha, de 6 horas. La recogida y el regreso añaden aproximadamente 1 hora estimada.",
      },
    },
    {
      question: { pt: "O passeio é compartilhado?", en: "Is this a shared tour?", es: "¿Es un paseo compartido?" },
      answer: {
        pt: "Não. O passeio é exclusivamente privativo para 1 a 4 turistas da mesma reserva.",
        en: "No. This is a private tour for 1 to 4 guests on the same booking.",
        es: "No. Es un paseo exclusivamente privado para 1 a 4 turistas de la misma reserva.",
      },
    },
    {
      question: { pt: "Como funciona a tarifa para bebês e crianças?", en: "How are infant and child fares calculated?", es: "¿Cómo se calcula la tarifa para bebés y niños?" },
      answer: {
        pt: "Bebês e crianças de 0 a 2 anos, inclusive, pagam 50% da tarifa individual da faixa do grupo; a partir de 3 anos pagam 100%. Todos contam para o limite e para a faixa de preço e precisam estar acompanhados por um responsável.",
        en: "Infants and children aged 0–2, inclusive, pay 50% of the individual fare for the group size; guests aged 3 and over pay the full fare. Everyone counts toward the capacity limit and price tier, and children must travel with a guardian.",
        es: "Los bebés y niños de 0 a 2 años, inclusive, pagan el 50% de la tarifa individual de su grupo; desde los 3 años pagan la tarifa completa. Todos cuentan para el límite de capacidad y la categoría de precio, y los menores deben ir acompañados por un responsable.",
      },
    },
    {
      question: { pt: "A visita interna ao Museu do Amanhã está incluída?", en: "Is interior admission to the Museum of Tomorrow included?", es: "¿Está incluida la entrada al interior del Museo del Mañana?" },
      answer: {
        pt: "No roteiro de 6 horas, a parada no Museu do Amanhã é externa. A visita interna não está incluída; mediante solicitação antecipada e pagamento, o ingresso pode ser acrescentado ao valor da reserva conforme a categoria e eventual gratuidade do visitante. Visitas internas longas podem substituir outras paradas ou exigir extensão.",
        en: "The 6-hour itinerary includes an exterior stop at the Museum of Tomorrow. Interior admission is not included; upon advance request and payment, the ticket can be added to the booking total according to the visitor category and any applicable free-entry entitlement. A longer interior visit may replace other stops or require an extension.",
        es: "El itinerario de 6 horas incluye una parada exterior en el Museo del Mañana. La visita interior no está incluida; previa solicitud y pago, la entrada puede añadirse al total de la reserva según la categoría del visitante y cualquier derecho de gratuidad aplicable. Una visita interior más larga puede sustituir otras paradas o requerir una extensión.",
      },
    },
    {
      question: { pt: "Como consulto disponibilidade?", en: "How do I ask about availability?", es: "¿Cómo consulto la disponibilidad?" },
      answer: {
        pt: "Envie uma consulta pelo WhatsApp comercial. A equipe verifica a data e a logística e responde com uma proposta. A mensagem não confirma disponibilidade, reserva ou pagamento.",
        en: "Send an inquiry to the business WhatsApp account. The team checks the date and logistics and replies with a proposal. The message does not confirm availability, a booking or payment.",
        es: "Envía una consulta al WhatsApp comercial. El equipo verifica la fecha y la logística y responde con una propuesta. El mensaje no confirma disponibilidad, reserva ni pago.",
      },
    },
    {
      question: { pt: "Quais são as condições de cancelamento e remarcação?", en: "What are the cancellation and rescheduling terms?", es: "¿Cuáles son las condiciones de cancelación y reprogramación?" },
      answer: {
        pt: "Cancelamento com pelo menos 72 horas de antecedência: sem custo, com devolução dos valores pagos. Com menos de 72 horas, só podem ser retidos valores justificados, proporcionais e permitidos pela lei, informados por escrito antes do pagamento; o sinal não é retido automaticamente. Se a Ricardo Tour cancelar, você recebe o reembolso integral ou remarca, se preferir; com chuva forte ou fechamento de atrações, oferecemos remarcação ou reembolso. As condições completas estão nos Termos de Uso.",
        en: "Cancel at least 72 hours before the start: free of charge, with the amounts paid returned. With less than 72 hours, only amounts that are justified, proportional and allowed by law may be retained, stated in writing before payment; the deposit is not retained automatically. If Ricardo Tour cancels, you get a full refund or reschedule if you prefer; for heavy rain or closed attractions, we offer rescheduling or a refund. The full conditions are in the Terms of Use.",
        es: "Cancelación con al menos 72 horas de antelación: sin costo, con devolución de los importes pagados. Con menos de 72 horas, solo pueden retenerse importes justificados, proporcionales y permitidos por la ley, informados por escrito antes del pago; la seña no se retiene automáticamente. Si Ricardo Tour cancela, recibes el reembolso total o reprogramas, si lo prefieres; con lluvia intensa o cierre de atractivos, ofrecemos reprogramación o reembolso. Las condiciones completas están en los Términos de Uso.",
      },
    },
  ],
  itinerary: CENTRO_ROUTE_OPTIONS[0].stops.map((stop) => ({
    position: stop.position,
    title: stop.title,
    durationMinutes: stop.durationMinutes,
  })),
};
