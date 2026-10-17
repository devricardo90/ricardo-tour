import type { LocalizedText, TourContentRecord } from "@/lib/catalog/tour-content";

/**
 * RT-115 / RT-112 — Tour Favela Rocinha: REAL commercial content written from the Owner's decisions of 17/10/2026
 * ("Fechamento comercial e editorial"). Status: CONTENT READY FOR OWNER REVIEW — not approved, not publishable.
 * - Status DRAFT and a non-MOCK source: the public gate still hides it (only OWNER_APPROVED content is public).
 * - No price inside the content (prices live on Trip; the provisional table below is lab-only, never public).
 * - No internal costs anywhere in the code (they live only in the Manual Mestre's confidential section).
 * - Nothing pending is stated as fact: cancellation terms (RT-81), exact meeting spot, places visited on the day,
 *   optional third-party activities and safety checks are worded as conditional.
 * Lab only: a test forbids importing lib/catalog/drafts/* from public routes, APIs or public components.
 */

export const ROCINHA_ID = "cmli1a6im000034zqqzc9sppb";
export const ROCINHA_DRAFT_SOURCE =
  "Owner decisions 17/10/2026 (RT-112 Rocinha commercial closing; RT-115 texts by the agent). CONTENT READY FOR OWNER REVIEW — not approved, not published.";

type Tri = { pt: string; en: string; es: string };
const list = (items: Array<[string, string, string]>) => ({ pt: items.map((i) => i[0]), en: items.map((i) => i[1]), es: items.map((i) => i[2]) });

export const ROCINHA_TITLE: Tri = {
  pt: "Tour Favela Rocinha — Experiência Cultural Privativa",
  en: "Rocinha Favela — Private Cultural Experience",
  es: "Tour Favela Rocinha — Experiencia Cultural Privada",
};

/** Commercial subtitle (hero line). */
export const ROCINHA_SUBTITLE: Tri = {
  pt: "Conheça a história, a cultura e o dia a dia da Rocinha em uma visita privativa, acompanhada do início ao fim.",
  en: "Discover Rocinha's history, culture and everyday life on a private visit, accompanied from start to finish.",
  es: "Conoce la historia, la cultura y el día a día de la Rocinha en una visita privada, acompañada de principio a fin.",
};

export const ROCINHA_BENEFITS = list([
  ["Experiência só para o seu grupo, de 1 a 4 pessoas", "Only your group, from 1 to 4 people", "Solo tu grupo, de 1 a 4 personas"],
  ["Mototáxi de subida e de descida já incluído", "Motorcycle taxi up and down already included", "Mototaxi de subida y de bajada ya incluido"],
  ["Guia Ricardo Tour com você durante toda a visita", "A Ricardo Tour guide with you throughout the visit", "Guía de Ricardo Tour contigo durante toda la visita"],
]);

export const ROCINHA_CONTENT: Omit<TourContentRecord, "tripId" | "status" | "source" | "images"> = {
  summary: {
    pt: "Uma visita cultural privativa à Rocinha, com guia Ricardo Tour, mototáxi de subida e descida e parada em um mirante para ver a comunidade do alto.",
    en: "A private cultural visit to Rocinha with a Ricardo Tour guide, motorcycle taxi up and down, and a stop at a viewpoint to see the community from above.",
    es: "Una visita cultural privada a la Rocinha con guía de Ricardo Tour, mototaxi de subida y de bajada, y una parada en un mirador para ver la comunidad desde lo alto.",
  },
  description: {
    pt: "A Rocinha é uma comunidade com história, cultura e vida própria, construída ao longo de décadas por seus moradores. Nesta experiência privativa, você caminha pela comunidade acompanhado pelo guia Ricardo Tour, com apoio local conforme a operação, e conhece um pouco dessa história e do dia a dia de quem vive ali.\n\nO encontro é na região da estação de metrô São Conrado. De lá, o grupo sobe de mototáxi, faz uma caminhada cultural com explicações sobre a formação da comunidade e a vida cotidiana, visita pontos culturais conforme a operação do dia e para em um mirante ou rooftop disponível, com tempo para fotografias autorizadas. A descida também é feita de mototáxi, e a experiência termina na região do ponto de encontro.\n\nO passeio é exclusivamente privativo, para grupos de 1 a 4 adultos, e dura aproximadamente 3 horas. O roteiro pode ser ajustado conforme as condições de segurança, o clima, o acesso aos locais e a operação local do dia.",
    en: "Rocinha is a community with its own history, culture and life, built over decades by its residents. On this private experience you walk through the community with your Ricardo Tour guide, with local support depending on the day's operation, and learn about that history and the everyday life of the people who live there.\n\nYou meet near São Conrado metro station. From there, the group rides up by motorcycle taxi, takes a cultural walk with explanations about how the community was formed and about daily life, visits cultural spots depending on the day's operation, and stops at an available viewpoint or rooftop, with time for permitted photos. The way down is also by motorcycle taxi, and the experience ends near the meeting point.\n\nThe tour is private only, for groups of 1 to 4 adults, and lasts about 3 hours. The route may be adjusted according to safety conditions, the weather, access to places and the local operation on the day.",
    es: "La Rocinha es una comunidad con historia, cultura y vida propias, construida a lo largo de décadas por sus habitantes. En esta experiencia privada recorres la comunidad acompañado por el guía de Ricardo Tour, con apoyo local según la operación, y conoces parte de esa historia y del día a día de quienes viven allí.\n\nEl encuentro es en la zona de la estación de metro São Conrado. Desde allí, el grupo sube en mototaxi, hace una caminata cultural con explicaciones sobre la formación de la comunidad y la vida cotidiana, visita puntos culturales según la operación del día y se detiene en un mirador o azotea disponible, con tiempo para fotografías autorizadas. La bajada también se hace en mototaxi y la experiencia termina en la zona del punto de encuentro.\n\nEl paseo es exclusivamente privado, para grupos de 1 a 4 adultos, y dura aproximadamente 3 horas. El itinerario puede ajustarse según las condiciones de seguridad, el clima, el acceso a los lugares y la operación local del día.",
  },
  durationLabel: { pt: "Aproximadamente 3 horas", en: "About 3 hours", es: "Aproximadamente 3 horas" },
  meetingPoint: {
    pt: "Região da estação de metrô São Conrado, no Rio de Janeiro. O local exato é enviado por WhatsApp antes do passeio.",
    en: "Near São Conrado metro station, Rio de Janeiro. The exact spot is sent by WhatsApp before the tour.",
    es: "Zona de la estación de metro São Conrado, en Río de Janeiro. El lugar exacto se envía por WhatsApp antes del paseo.",
  },
  startTimeNote: null,
  languages: ["pt", "en", "es"],
  inclusions: list([
    ["Acompanhamento do guia Ricardo Tour", "Ricardo Tour guide throughout the visit", "Acompañamiento del guía de Ricardo Tour"],
    ["Apoio local conforme a operação", "Local support depending on the operation", "Apoyo local según la operación"],
    ["Experiência cultural acompanhada", "Guided cultural experience", "Experiencia cultural acompañada"],
    ["Mototáxi de subida", "Motorcycle taxi up", "Mototaxi de subida"],
    ["Mototáxi de descida", "Motorcycle taxi down", "Mototaxi de bajada"],
    ["Tarifa do operador local", "Local operator fee", "Tarifa del operador local"],
    ["Visita aos pontos previstos no roteiro", "Visit to the stops planned in the itinerary", "Visita a los puntos previstos en el itinerario"],
    ["Parada em mirante ou rooftop disponível", "Stop at an available viewpoint or rooftop", "Parada en un mirador o azotea disponible"],
    ["Ajuda informal com fotografias", "Informal help with photos", "Ayuda informal con las fotografías"],
  ]),
  exclusions: list([
    ["Transporte entre o hotel e São Conrado", "Transport between your hotel and São Conrado", "Transporte entre el hotel y São Conrado"],
    ["Alimentação", "Food", "Comidas"],
    ["Bebidas", "Drinks", "Bebidas"],
    ["Compras pessoais", "Personal purchases", "Compras personales"],
    ["Fotografias profissionais de terceiros", "Professional photos by third parties", "Fotografías profesionales de terceros"],
    ["Filmagens ou fotografias com drone", "Drone videos or photos", "Videos o fotografías con dron"],
    ["Atividades pagas opcionais", "Optional paid activities", "Actividades pagas opcionales"],
    ["Outros serviços contratados por conta própria", "Any other service you choose to hire", "Otros servicios contratados por cuenta propia"],
  ]),
  optionalServicesNote: {
    pt: "Alguns espaços comunitários podem oferecer capoeira, música, dança, produtos locais, fotografias ou vídeos com drone. Esses serviços são prestados por terceiros, não são garantidos pela Ricardo Tour e não são obrigatórios: você contrata apenas se quiser.",
    en: "Some community spaces may offer capoeira, music, dance, local products, photos or drone videos. These services are provided by third parties, are not guaranteed by Ricardo Tour and are never mandatory: you only pay for them if you want to.",
    es: "Algunos espacios comunitarios pueden ofrecer capoeira, música, danza, productos locales, fotografías o videos con dron. Estos servicios los prestan terceros, no están garantizados por Ricardo Tour y no son obligatorios: solo los contratas si quieres.",
  },
  requirements: {
    pt: "Passeio para maiores de 18 anos. A experiência inclui trajetos de mototáxi e caminhada, com possíveis ladeiras e escadas: use calçado fechado e confortável. O atendimento em português, inglês ou espanhol depende da disponibilidade do guia e é confirmado na reserva.",
    en: "For adults aged 18 and over. The experience includes motorcycle-taxi rides and walking, possibly on steep streets and stairs: wear closed, comfortable shoes. Service in Portuguese, English or Spanish depends on guide availability and is confirmed when you book.",
    es: "Paseo para mayores de 18 años. La experiencia incluye trayectos en mototaxi y caminata, con posibles cuestas y escaleras: usa calzado cerrado y cómodo. La atención en portugués, inglés o español depende de la disponibilidad del guía y se confirma en la reserva.",
  },
  accessibility: {
    pt: "Não é uma experiência acessível para todas as pessoas: há mototáxi, caminhada, ladeiras e escadas. Se você tem mobilidade reduzida ou alguma limitação física, conte para nós antes de solicitar, para avaliarmos juntos se a visita é viável.",
    en: "This experience is not accessible to everyone: it involves motorcycle taxis, walking, steep streets and stairs. If you have reduced mobility or a physical limitation, tell us before requesting so we can assess together whether the visit is feasible.",
    es: "No es una experiencia accesible para todas las personas: incluye mototaxi, caminata, cuestas y escaleras. Si tienes movilidad reducida o alguna limitación física, cuéntanos antes de solicitar para evaluar juntos si la visita es viable.",
  },
  operationalConditions: {
    pt: "A reserva depende de confirmação humana. O roteiro pode mudar, ser encurtado ou suspenso conforme as condições de segurança, o clima, o acesso aos locais e a disponibilidade da operação local no dia. Não prometemos ruas, estabelecimentos, apresentações ou pontos específicos.",
    en: "Bookings are confirmed by a person on our team. The route may change, be shortened or be suspended depending on safety conditions, the weather, access to places and the local operation's availability on the day. We do not promise specific streets, venues, performances or stops.",
    es: "La reserva depende de una confirmación humana. El itinerario puede cambiar, acortarse o suspenderse según las condiciones de seguridad, el clima, el acceso a los lugares y la disponibilidad de la operación local del día. No prometemos calles, establecimientos, presentaciones ni puntos específicos.",
  },
  weatherPolicy: null,
  itinerary: [
    { position: 0, title: { pt: "Encontro na região da estação São Conrado", en: "Meeting near São Conrado station", es: "Encuentro en la zona de la estación São Conrado" }, description: { pt: "O local exato é enviado por WhatsApp antes do passeio.", en: "The exact spot is sent by WhatsApp before the tour.", es: "El lugar exacto se envía por WhatsApp antes del paseo." }, durationMinutes: null },
    { position: 1, title: { pt: "Orientações iniciais", en: "Briefing", es: "Orientaciones iniciales" }, description: { pt: "O guia explica como será a visita e as regras de convivência e de fotografia.", en: "The guide explains how the visit works and the etiquette for being in the community and taking photos.", es: "El guía explica cómo será la visita y las normas de convivencia y de fotografía." }, durationMinutes: null },
    { position: 2, title: { pt: "Subida de mototáxi", en: "Motorcycle taxi up", es: "Subida en mototaxi" }, description: null, durationMinutes: null },
    { position: 3, title: { pt: "Caminhada cultural acompanhada", en: "Guided cultural walk", es: "Caminata cultural acompañada" }, description: { pt: "Explicações sobre a história da comunidade e a vida cotidiana.", en: "Explanations about the community's history and everyday life.", es: "Explicaciones sobre la historia de la comunidad y la vida cotidiana." }, durationMinutes: null },
    { position: 4, title: { pt: "Pontos culturais conforme a operação", en: "Cultural spots depending on the operation", es: "Puntos culturales según la operación" }, description: { pt: "Os locais visitados dependem das condições e da operação do dia.", en: "The places visited depend on the day's conditions and operation.", es: "Los lugares visitados dependen de las condiciones y de la operación del día." }, durationMinutes: null },
    { position: 5, title: { pt: "Mirante ou rooftop disponível", en: "Available viewpoint or rooftop", es: "Mirador o azotea disponible" }, description: { pt: "Vista da comunidade do alto e tempo para fotografias autorizadas.", en: "A view of the community from above and time for permitted photos.", es: "Vista de la comunidad desde lo alto y tiempo para fotografías autorizadas." }, durationMinutes: null },
    { position: 6, title: { pt: "Descida de mototáxi", en: "Motorcycle taxi down", es: "Bajada en mototaxi" }, description: null, durationMinutes: null },
    { position: 7, title: { pt: "Encerramento no ponto de encontro", en: "End at the meeting point", es: "Cierre en el punto de encuentro" }, description: { pt: "A experiência termina na região do ponto de encontro combinado.", en: "The experience ends near the agreed meeting point.", es: "La experiencia termina en la zona del punto de encuentro acordado." }, durationMinutes: null },
  ],
  faq: [
    {
      question: { pt: "O passeio é privativo?", en: "Is the tour private?", es: "¿El paseo es privado?" },
      answer: { pt: "Sim. A experiência é exclusiva para o seu grupo, de 1 a 4 pessoas.", en: "Yes. The experience is only for your group, from 1 to 4 people.", es: "Sí. La experiencia es exclusiva para tu grupo, de 1 a 4 personas." },
    },
    {
      question: { pt: "Quem pode participar?", en: "Who can take part?", es: "¿Quién puede participar?" },
      answer: { pt: "Adultos a partir de 18 anos. Como há mototáxi, caminhada, ladeiras e escadas, avise antes se houver alguma limitação física.", en: "Adults aged 18 and over. Because there are motorcycle taxis, walking, steep streets and stairs, let us know beforehand about any physical limitation.", es: "Adultos a partir de 18 años. Como hay mototaxi, caminata, cuestas y escaleras, avísanos antes si tienes alguna limitación física." },
    },
    {
      question: { pt: "O transporte do hotel está incluído?", en: "Is transport from my hotel included?", es: "¿Está incluido el transporte desde el hotel?" },
      answer: { pt: "Não. O encontro é na região da estação de metrô São Conrado, e o passeio termina na região do ponto de encontro.", en: "No. You meet near São Conrado metro station, and the tour ends near the meeting point.", es: "No. El encuentro es en la zona de la estación de metro São Conrado y el paseo termina en la zona del punto de encuentro." },
    },
    {
      question: { pt: "Como funciona a reserva?", en: "How does booking work?", es: "¿Cómo funciona la reserva?" },
      answer: {
        pt: "Você solicita a disponibilidade, nossa equipe verifica a operação e envia a proposta com as condições. A reserva é confirmada com o pagamento de um sinal de 30%, e o restante é pago antes do início do passeio. O site não faz pagamento automático.",
        en: "You request availability, our team checks the operation and sends you a proposal with the conditions. The booking is confirmed with a 30% deposit, and the rest is paid before the tour starts. The website does not take automatic payments.",
        es: "Solicitas la disponibilidad, nuestro equipo verifica la operación y te envía la propuesta con las condiciones. La reserva se confirma con el pago de una seña del 30% y el resto se paga antes del inicio del paseo. El sitio no realiza pagos automáticos.",
      },
    },
    {
      question: { pt: "Quais formas de pagamento são aceitas?", en: "Which payment methods are accepted?", es: "¿Qué formas de pago se aceptan?" },
      answer: { pt: "Os meios previstos são PIX, cartão de crédito e dinheiro. As opções disponíveis para a sua reserva constam na proposta.", en: "The planned methods are PIX, credit card and cash. The options available for your booking are stated in the proposal.", es: "Los medios previstos son PIX, tarjeta de crédito y efectivo. Las opciones disponibles para tu reserva figuran en la propuesta." },
    },
    {
      question: { pt: "Preciso contratar atividades extras na comunidade?", en: "Do I have to pay for extra activities in the community?", es: "¿Tengo que contratar actividades extra en la comunidad?" },
      answer: { pt: "Não. Atividades como capoeira, música ou fotos com drone podem ser oferecidas por terceiros, mas são opcionais e não fazem parte do preço.", en: "No. Activities such as capoeira, music or drone photos may be offered by third parties, but they are optional and not part of the price.", es: "No. Actividades como capoeira, música o fotos con dron pueden ofrecerlas terceros, pero son opcionales y no forman parte del precio." },
    },
    {
      question: { pt: "E se o passeio precisar ser alterado?", en: "What if the tour has to change?", es: "¿Y si el paseo tiene que cambiar?" },
      answer: { pt: "O roteiro pode ser ajustado, encurtado ou suspenso por segurança, clima ou operação local. As condições de cancelamento e remarcação constam na proposta enviada antes do pagamento.", en: "The route may be adjusted, shortened or suspended for safety, weather or local operational reasons. Cancellation and rescheduling conditions are stated in the proposal sent before payment.", es: "El itinerario puede ajustarse, acortarse o suspenderse por seguridad, clima u operación local. Las condiciones de cancelación y reprogramación figuran en la propuesta enviada antes del pago." },
    },
  ],
};

/** Prefilled WhatsApp message (sent through the canonical public number, lib/public-contact.ts). */
export const ROCINHA_WHATSAPP_MESSAGE: Tri = {
  pt: "Olá! Gostaria de solicitar disponibilidade para o Tour Favela Rocinha — Experiência Cultural Privativa.\nData desejada: \nNúmero de participantes (1 a 4): \nIdioma preferido (português, inglês ou espanhol): ",
  en: "Hello! I would like to request availability for the Rocinha Favela — Private Cultural Experience.\nPreferred date: \nNumber of participants (1 to 4): \nPreferred language (Portuguese, English or Spanish): ",
  es: "¡Hola! Me gustaría solicitar disponibilidad para el Tour Favela Rocinha — Experiencia Cultural Privada.\nFecha deseada: \nNúmero de participantes (1 a 4): \nIdioma preferido (portugués, inglés o español): ",
};

/**
 * INTERNAL provisional target prices (Owner, 17/10/2026): closed price per booking by group size.
 * NOT FOR PUBLICATION — still subject to full costs, taxes and operation validation. Rendered only in the lab review
 * mode, labelled "PREÇOS PROVISÓRIOS — NÃO PUBLICAR". Never stored on Trip (production prices untouched).
 */
export const ROCINHA_PROVISIONAL_PRICING = [
  { participants: 1, perPersonCents: 45000, totalCents: 45000 },
  { participants: 2, perPersonCents: 29000, totalCents: 58000 },
  { participants: 3, perPersonCents: 25000, totalCents: 75000 },
  { participants: 4, perPersonCents: 22000, totalCents: 88000 },
] as const;

export const ROCINHA_GROUP_SIZE: Tri = { pt: "1 a 4 pessoas", en: "1 to 4 people", es: "1 a 4 personas" };
export const ROCINHA_MIN_AGE: Tri = { pt: "18 anos ou mais", en: "18 and over", es: "18 años o más" };
export const ROCINHA_MEETING_SHORT: Tri = { pt: "Encontro em São Conrado", en: "Meeting in São Conrado", es: "Encuentro en São Conrado" };

export type { LocalizedText };
