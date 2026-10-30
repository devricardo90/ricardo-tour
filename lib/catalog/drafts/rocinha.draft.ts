import type { LocalizedText, TourContentRecord } from "@/lib/catalog/tour-content";

/**
 * RT-115 / RT-112 — Tour Favela Rocinha: REAL commercial content. Owner decisions of 17/10/2026 ("Fechamento comercial
 * e editorial") and the editorial corrections APPROVED by the Owner on 17/10/2026 (names, subtitles, descriptions,
 * 8-step route, inclusions/exclusions, 7 FAQs, WhatsApp messages). Status: EDITORIAL IMPLEMENTED — still DRAFT.
 * - Status DRAFT and a non-MOCK source: the public gate still hides it (only OWNER_APPROVED content is public).
 *   Publication stays blocked by RT-81, RT-110, RT-118, RT-119 and RT-120.
 * - No price inside the content (prices live on Trip; the provisional table below is lab-only, never public).
 * - No internal costs or internal suppliers anywhere in the code (they live only in the Manual Mestre's confidential
 *   section). The local operator fee is an internal cost and is NOT listed publicly.
 * - Cancellation terms are not stated (RT-81): the FAQ only says the team explains the applicable terms before booking.
 * Lab only: a test forbids importing lib/catalog/drafts/* from public routes, APIs or public components.
 */

export const ROCINHA_ID = "cmli1a6im000034zqqzc9sppb";
export const ROCINHA_DRAFT_SOURCE =
  "Owner decisions 17/10/2026 (RT-112 Rocinha commercial closing) + Owner-approved editorial corrections 17/10/2026 (RT-115). Still DRAFT: publication blocked by RT-81, RT-110, RT-118, RT-119, RT-120.";

type Tri = { pt: string; en: string; es: string };
const list = (items: Array<[string, string, string]>) => ({ pt: items.map((i) => i[0]), en: items.map((i) => i[1]), es: items.map((i) => i[2]) });

/** Commercial names approved by the Owner (17/10/2026). */
export const ROCINHA_TITLE: Tri = {
  pt: "Tour Favela Rocinha — Experiência Cultural Privativa",
  en: "Rocinha Favela — Private Cultural Tour",
  es: "Tour Privado por la Favela de Rocinha",
};

/** Commercial subtitle (hero line) — approved text. */
export const ROCINHA_SUBTITLE: Tri = {
  pt: "Conheça a história, a cultura e o cotidiano da Rocinha em uma experiência privativa, acompanhada por um guia durante a visita.",
  en: "Discover Rocinha's history, culture and everyday life on a private, guided visit.",
  es: "Descubre la historia, la cultura y la vida cotidiana de Rocinha en una visita privada con guía.",
};

export const ROCINHA_BENEFITS = list([
  ["Experiência exclusiva para o seu grupo, de 1 a 4 adultos", "A private tour for your group of one to four adults", "Tour exclusivo para tu grupo de uno a cuatro adultos"],
  ["Mototáxi de subida e descida incluído", "Both motorcycle-taxi rides included", "Ambos trayectos en mototaxi incluidos"],
  ["Guia Ricardo Tour durante toda a visita", "A Ricardo Tour guide throughout the visit", "Guía de Ricardo Tour durante toda la visita"],
]);

export const ROCINHA_CONTENT: Omit<TourContentRecord, "tripId" | "status" | "source" | "images"> = {
  // Approved short descriptions.
  summary: {
    pt: "Explore a Rocinha em uma visita cultural privativa com guia Ricardo Tour, mototáxi de subida e descida incluído e parada panorâmica prevista no roteiro.",
    en: "Explore Rocinha on a private cultural tour with a Ricardo Tour guide, motorcycle-taxi rides in both directions included, and a planned panoramic stop.",
    es: "Recorre Rocinha en un tour cultural privado con guía de Ricardo Tour, subida y bajada en mototaxi incluidas y una parada panorámica prevista.",
  },
  // Approved full descriptions (paragraph grouping adapted to the page structure; wording unchanged).
  description: {
    pt: "A Rocinha tem uma história construída por seus moradores e uma vida cultural própria. Nesta experiência privativa, você conhece aspectos da formação da comunidade e de seu cotidiano em uma visita acompanhada por um guia Ricardo Tour, com respeito às pessoas e aos espaços visitados.\n\nO encontro acontece nas proximidades da estação de metrô São Conrado, em um ponto combinado por WhatsApp. Após as orientações iniciais, o grupo sobe de mototáxi e segue por uma caminhada cultural, com paradas que variam conforme o acesso e as condições do dia. Há uma parada panorâmica planejada em um mirante ou rooftop disponível. A descida também é feita de mototáxi, e o passeio termina próximo ao ponto de encontro.\n\nO tour é exclusivo para seu grupo de 1 a 4 adultos e tem duração estimada de 3 horas. Os trajetos de mototáxi, o acompanhamento do guia e os serviços necessários ao roteiro contratado estão incluídos no preço. Alimentação, compras e serviços opcionais de terceiros ficam a seu critério.\n\nO percurso pode ser alterado por motivos de segurança, clima ou acesso.",
    en: "Rocinha has a history shaped by the people who live there and a cultural life of its own. This private guided visit introduces you to the community's history and everyday life, with respect for the people and places along the route.\n\nMeet near São Conrado metro station at a spot arranged via WhatsApp. After a short briefing, ride uphill by motorcycle taxi and explore part of the community on foot, with cultural stops that depend on access and conditions that day. A panoramic stop at an available viewpoint or rooftop is planned. The ride back down is also by motorcycle taxi, and the tour finishes near the meeting point.\n\nThis private tour is for your group of one to four adults and takes approximately three hours. Both motorcycle-taxi rides, your guide and the services required for the booked itinerary are included in the price. Food, shopping and optional third-party services are your choice.\n\nThe route may change because of safety, weather or access conditions.",
    es: "Rocinha tiene una historia construida por sus habitantes y una vida cultural propia. Esta visita privada te acerca a la historia y a la vida cotidiana de la comunidad, con respeto por las personas y los espacios que se recorren.\n\nNos encontramos cerca de la estación de metro São Conrado, en un punto acordado por WhatsApp. Tras una breve orientación, subimos en mototaxi y recorremos parte de la comunidad a pie, con paradas culturales que pueden variar según el acceso y las condiciones del día. Está prevista una parada panorámica en un mirador o terraza disponible. La bajada también se hace en mototaxi y el recorrido termina cerca del punto de encuentro.\n\nEl tour es exclusivo para tu grupo de uno a cuatro adultos y dura aproximadamente tres horas. Ambos trayectos en mototaxi, el acompañamiento del guía y los servicios necesarios para el itinerario contratado están incluidos en el precio. La comida, las compras y los servicios opcionales de terceros quedan a tu elección.\n\nEl recorrido puede cambiar por motivos de seguridad, clima o acceso.",
  },
  durationLabel: { pt: "Aproximadamente 3 horas", en: "Approximately 3 hours", es: "Aproximadamente 3 horas" },
  meetingPoint: {
    pt: "Proximidades da estação de metrô São Conrado, Rio de Janeiro. O ponto exato é combinado por WhatsApp antes do passeio.",
    en: "Near São Conrado metro station, Rio de Janeiro. The exact spot is arranged via WhatsApp before the tour.",
    es: "Cerca de la estación de metro São Conrado, Río de Janeiro. El punto exacto se acuerda por WhatsApp antes del tour.",
  },
  startTimeNote: null,
  languages: ["pt", "en", "es"],
  // Approved public list: what the guest receives (the local operator fee is an internal cost, not listed).
  inclusions: list([
    ["Guia Ricardo Tour durante a visita", "Ricardo Tour guide throughout the visit", "Guía de Ricardo Tour durante la visita"],
    ["Caminhada cultural acompanhada", "Guided cultural walk", "Caminata cultural guiada"],
    ["Mototáxi de subida e descida", "Motorcycle-taxi rides up and down", "Mototaxi de subida y bajada"],
    ["Serviços locais necessários ao roteiro", "Local services required for the itinerary", "Servicios locales necesarios para el itinerario"],
    ["Parada panorâmica planejada", "Planned panoramic stop", "Parada panorámica prevista"],
    ["Ajuda do guia com fotos de celular", "Help from your guide with phone photos", "Ayuda del guía con fotos con tu teléfono"],
  ]),
  exclusions: list([
    ["Transporte entre o hotel e São Conrado", "Transport between your hotel and São Conrado", "Transporte entre el hotel y São Conrado"],
    ["Alimentação e bebidas", "Food and drinks", "Comida y bebidas"],
    ["Compras pessoais", "Personal shopping", "Compras personales"],
    ["Fotografia profissional de terceiros", "Professional photography by third parties", "Fotografía profesional de terceros"],
    ["Serviços de drone", "Drone services", "Servicios de dron"],
    ["Atividades pagas opcionais", "Optional paid activities", "Actividades de pago opcionales"],
    ["Outros serviços contratados voluntariamente", "Any other services you choose to book", "Otros servicios contratados por cuenta propia"],
  ]),
  optionalServicesNote: {
    pt: "Alguns espaços comunitários podem oferecer apresentações de capoeira, música, dança, produtos locais, fotografias profissionais ou filmagens com drone. Essas atividades dependem de terceiros, não têm data garantida e algumas podem ser pagas. Nenhuma compra ou atividade opcional é obrigatória.",
    en: "Some community spaces may offer capoeira performances, music, dance, local products, professional photography or drone filming. These depend on third parties, cannot be guaranteed on any given date, and some may be paid. No purchase or optional activity is required.",
    es: "Algunos espacios comunitarios pueden ofrecer presentaciones de capoeira, música, danza, productos locales, fotografía profesional o filmaciones con dron. Dependen de terceros, no tienen fechas garantizadas y algunas pueden ser de pago. Ninguna compra ni actividad opcional es obligatoria.",
  },
  requirements: {
    pt: "Para adultos a partir de 18 anos. O roteiro inclui dois trajetos de mototáxi e caminhada, com possíveis ladeiras e escadas: use calçado fechado e confortável. O atendimento pode ser em português, inglês ou espanhol, conforme a disponibilidade do guia, confirmada na reserva.",
    en: "For adults aged 18 and over. The itinerary includes two motorcycle-taxi rides and walking, possibly on steep streets or stairs, so wear closed, comfortable shoes. The tour can be guided in Portuguese, English or Spanish, subject to guide availability confirmed when you book.",
    es: "Para personas a partir de 18 años. El recorrido incluye dos trayectos en mototaxi y caminatas, con posibles cuestas y escaleras: usa calzado cerrado y cómodo. El tour puede realizarse en portugués, inglés o español, según la disponibilidad del guía, que se confirma al reservar.",
  },
  accessibility: {
    pt: "A experiência não é adequada para todas as pessoas: inclui mototáxi, caminhada, ladeiras e escadas. Se você tem mobilidade reduzida ou alguma limitação física, fale com a equipe antes de reservar para avaliarmos juntos a viabilidade da visita.",
    en: "This experience is not suitable for everyone: it involves motorcycle taxis, walking, steep streets and stairs. If you have reduced mobility or a physical limitation, please talk to our team before booking so we can assess together whether the visit is right for you.",
    es: "Esta experiencia no es adecuada para todas las personas: incluye mototaxi, caminatas, cuestas y escaleras. Si tienes movilidad reducida o alguna limitación física, habla con nuestro equipo antes de reservar para evaluar juntos si la visita es viable.",
  },
  operationalConditions: {
    pt: "Cada reserva é confirmada pela nossa equipe após a verificação de disponibilidade. O percurso pode mudar por segurança, clima ou acesso, e não há ruas, estabelecimentos ou apresentações garantidos.",
    en: "Our team confirms each booking after checking availability. The route may change because of safety, weather or access, and no specific streets, venues or performances are guaranteed.",
    es: "Nuestro equipo confirma cada reserva tras verificar la disponibilidad. El recorrido puede cambiar por seguridad, clima o acceso, y no se garantizan calles, establecimientos ni presentaciones específicos.",
  },
  weatherPolicy: null,
  // Approved 8-step route (history explained during the walk; photos at the panoramic stop).
  itinerary: [
    { position: 0, title: { pt: "Encontro próximo à estação São Conrado", en: "Meeting near São Conrado station", es: "Encuentro cerca de la estación São Conrado" }, description: { pt: "O ponto exato é combinado por WhatsApp antes do passeio.", en: "The exact spot is arranged via WhatsApp before the tour.", es: "El punto exacto se acuerda por WhatsApp antes del tour." }, durationMinutes: null },
    { position: 1, title: { pt: "Orientações iniciais", en: "Short briefing", es: "Breve orientación" }, description: { pt: "O guia apresenta o roteiro e as recomendações para a visita.", en: "Your guide introduces the route and a few tips for the visit.", es: "El guía presenta el recorrido y algunas recomendaciones para la visita." }, durationMinutes: null },
    { position: 2, title: { pt: "Subida de mototáxi", en: "Motorcycle-taxi ride up", es: "Subida en mototaxi" }, description: { pt: "Trajeto incluído no passeio.", en: "Included in the tour.", es: "Incluida en el tour." }, durationMinutes: null },
    { position: 3, title: { pt: "Caminhada cultural acompanhada", en: "Guided cultural walk", es: "Caminata cultural guiada" }, description: { pt: "O guia apresenta a história da comunidade e o cotidiano dos moradores.", en: "Your guide shares the community's history and everyday life.", es: "El guía comparte la historia de la comunidad y su vida cotidiana." }, durationMinutes: null },
    { position: 4, title: { pt: "Paradas culturais conforme acesso", en: "Cultural stops, depending on access", es: "Paradas culturales según el acceso" }, description: { pt: "As paradas variam conforme o acesso e as condições do dia.", en: "Stops vary with access and conditions that day.", es: "Las paradas varían según el acceso y las condiciones del día." }, durationMinutes: null },
    { position: 5, title: { pt: "Mirante ou rooftop e fotografias", en: "Viewpoint or rooftop and photos", es: "Mirador o terraza panorámica y fotos" }, description: { pt: "Parada panorâmica planejada, com tempo para fotos.", en: "A planned panoramic stop with time for photos.", es: "Una parada panorámica prevista, con tiempo para fotos." }, durationMinutes: null },
    { position: 6, title: { pt: "Descida de mototáxi", en: "Motorcycle-taxi ride down", es: "Bajada en mototaxi" }, description: { pt: "Trajeto incluído no passeio.", en: "Included in the tour.", es: "Incluida en el tour." }, durationMinutes: null },
    { position: 7, title: { pt: "Encerramento próximo ao ponto de encontro", en: "Finish near the meeting point", es: "Cierre cerca del punto de encuentro" }, description: null, durationMinutes: null },
  ],
  // Approved FAQ answers (FAQ 7 is provisional editorial wording, to be reconciled with the RT-81 terms).
  faq: [
    {
      question: { pt: "O passeio é privativo?", en: "Is the tour private?", es: "¿El tour es privado?" },
      answer: { pt: "Sim. O passeio é reservado exclusivamente para seu grupo, de 1 a 4 adultos.", en: "Yes. The tour is private for your group of one to four adults.", es: "Sí. El tour es privado y exclusivo para tu grupo de uno a cuatro adultos." },
    },
    {
      question: { pt: "Quem pode participar?", en: "Who can join?", es: "¿Quién puede participar?" },
      answer: {
        pt: "Pessoas a partir de 18 anos. O roteiro inclui dois trajetos de mototáxi e caminhada, com possíveis ladeiras e escadas. Informe à equipe qualquer necessidade de mobilidade antes de reservar.",
        en: "Adults aged 18 and over. The itinerary includes two motorcycle-taxi rides and walking, possibly on steep streets or stairs. Please tell our team about any mobility needs before booking.",
        es: "Personas a partir de 18 años. El recorrido incluye dos trayectos en mototaxi y caminatas, con posibles cuestas y escaleras. Informa a nuestro equipo de cualquier necesidad de movilidad antes de reservar.",
      },
    },
    {
      question: { pt: "O transporte do hotel está incluído?", en: "Is hotel transport included?", es: "¿Incluye el traslado desde el hotel?" },
      answer: {
        pt: "Não nesta modalidade. O encontro e o encerramento acontecem nas proximidades da estação São Conrado. Enviaremos o ponto exato por WhatsApp.",
        en: "Not with this option. The tour starts and ends near São Conrado metro station. We'll send the exact meeting spot via WhatsApp.",
        es: "No en esta modalidad. El tour comienza y termina cerca de la estación São Conrado. Enviaremos el punto exacto por WhatsApp.",
      },
    },
    {
      question: { pt: "Como funciona a reserva?", en: "How does booking work?", es: "¿Cómo funciona la reserva?" },
      answer: {
        // RT-121 (Owner 26/10/2026, confirmed 28/10/2026): 30% of the total as deposit, 70% at the start of the tour.
        pt: "Solicite disponibilidade. Após confirmar a operação, nossa equipe enviará a proposta e as condições. A reserva é confirmada com sinal de 30% do valor total, e os 70% restantes são pagos no início do passeio. O site não processa pagamentos.",
        en: "Request availability first. Once our team confirms the tour can go ahead, we'll send you a quote and the terms. A deposit of 30% of the total confirms the booking, and the remaining 70% is paid at the start of the tour. Payments are not processed on this website.",
        es: "Primero solicita disponibilidad. Cuando nuestro equipo confirme la operación, te enviaremos la propuesta y las condiciones. La reserva se confirma con un anticipo del 30% del valor total, y el 70% restante se paga al inicio del paseo. Los pagos no se procesan en este sitio web.",
      },
    },
    {
      question: { pt: "Quais formas de pagamento são aceitas?", en: "Which payment methods are available?", es: "¿Qué medios de pago están disponibles?" },
      answer: {
        // RT-121 approved methods: PIX, card terminal (maquininha) or cash; nothing is charged on the website.
        pt: "O sinal e o saldo podem ser pagos por PIX, cartão na maquininha ou dinheiro. A equipe informa na proposta como pagar o sinal.",
        en: "The deposit and the balance can be paid by PIX, card (on a card terminal) or cash. Our team explains in the quote how to pay the deposit.",
        es: "El anticipo y el saldo se pueden pagar por PIX, tarjeta (en terminal de pago) o efectivo. Nuestro equipo indica en la propuesta cómo pagar el anticipo.",
      },
    },
    {
      question: { pt: "Vou ter outras despesas durante o passeio?", en: "Will I have to pay for anything else during the tour?", es: "¿Tendré otros gastos durante el tour?" },
      answer: {
        pt: "Não por serviços obrigatórios do passeio. Guia, mototáxi de subida e descida e serviços locais previstos estão incluídos. Compras, comida, drone ou outras atividades de terceiros são opcionais.",
        en: "Not for the services included in your tour. Your guide, both motorcycle-taxi rides and required local services are covered. Shopping, food, drone photos and other third-party activities are optional.",
        es: "No por los servicios incluidos en el tour. El guía, ambos trayectos en mototaxi y los servicios locales necesarios están cubiertos. Las compras, la comida, las fotos con dron y otras actividades de terceros son opcionales.",
      },
    },
    {
      question: { pt: "E se o roteiro precisar ser alterado?", en: "What if the route has to change?", es: "¿Qué pasa si el recorrido tiene que cambiar?" },
      answer: {
        pt: "O percurso pode mudar por segurança, clima ou restrições de acesso. Nossa equipe explicará as opções disponíveis e as condições aplicáveis antes da confirmação da reserva.",
        en: "The route may change because of safety, weather or access restrictions. Our team will explain the available options and applicable terms before the booking is confirmed.",
        es: "El recorrido puede cambiar por seguridad, clima o restricciones de acceso. Nuestro equipo explicará las opciones disponibles y las condiciones aplicables antes de confirmar la reserva.",
      },
    },
  ],
};

/** Prefilled WhatsApp message — approved text, sent through the canonical public number (lib/public-contact.ts). */
export const ROCINHA_WHATSAPP_MESSAGE: Tri = {
  pt: "Olá! Quero consultar a disponibilidade do Tour Favela Rocinha — Experiência Cultural Privativa.\nData desejada: \nParticipantes (1 a 4 adultos): \nIdioma preferido: ",
  en: "Hello! I'd like to check availability for Rocinha Favela — Private Cultural Tour.\nPreferred date: \nGuests (1–4 adults): \nPreferred language: ",
  es: "¡Hola! Quisiera consultar la disponibilidad del Tour Privado por la Favela de Rocinha.\nFecha deseada: \nParticipantes (1 a 4 adultos): \nIdioma preferido: ",
};

/**
 * Owner-approved group table (RT-121 final decision, 28/10/2026; registry id TOUR-02 in lib/commerce/price-tables.ts):
 * closed price per private group of adults. Shown only in the local review lab until the Owner authorizes publication
 * (PRICE_PUBLICATION_AUTHORIZED_TRIP_IDS); never stored on Trip. Replaces the 17/10 provisional targets.
 */
export const ROCINHA_APPROVED_PRICING = {
  publishable: false as const,
  durations: [
    {
      hours: 3,
      label: { pt: "Passeio privativo de aproximadamente 3 horas", en: "Private tour of about 3 hours", es: "Paseo privado de aproximadamente 3 horas" },
      prices: [
        { participants: 1, perPersonCents: 45000, totalCents: 45000 },
        { participants: 2, perPersonCents: 29000, totalCents: 58000 },
        { participants: 3, perPersonCents: 23000, totalCents: 69000 },
        { participants: 4, perPersonCents: 19500, totalCents: 78000 },
      ],
    },
  ],
} as const;

export const ROCINHA_PRICING_NOTE: Tri = {
  pt: "Somente adultos (18 anos ou mais). Valor fechado por grupo privativo; mototáxi de subida e descida incluído. Sinal de 30% do valor total e 70% no início do passeio; pagamento por PIX, cartão na maquininha ou dinheiro.",
  en: "Adults only (18 and over). Closed price per private group; motorcycle-taxi rides up and down included. A deposit of 30% of the total and 70% at the start of the tour; payment by PIX, card terminal or cash.",
  es: "Solo adultos (18 años o más). Precio cerrado por grupo privado; mototaxi de subida y bajada incluido. Anticipo del 30% del valor total y 70% al inicio del paseo; pago por PIX, tarjeta en terminal o efectivo.",
};
export const ROCINHA_PRICE_SUMMARY: Tri = { pt: "A partir de R$ 195 por pessoa", en: "From R$ 195 per person", es: "Desde R$ 195 por persona" };
// The "from" price is only true for a group of 4 adults: the condition always states it with the group total.
export const ROCINHA_PRICE_CONDITION: Tri = {
  pt: "Valor por pessoa para um grupo de 4 adultos (total do grupo: R$ 780). Para 1 a 3 pessoas, veja o total na tabela.",
  en: "Price per person for a group of 4 adults (group total: R$ 780). For 1 to 3 guests, see the total in the table.",
  es: "Valor por persona para un grupo de 4 adultos (total del grupo: R$ 780). Para 1 a 3 personas, consulta el total en la tabla.",
};

export const ROCINHA_GROUP_SIZE: Tri = { pt: "1 a 4 adultos", en: "1 to 4 adults", es: "1 a 4 adultos" };
export const ROCINHA_MIN_AGE: Tri = { pt: "18 anos ou mais", en: "18 and over", es: "18 años o más" };
export const ROCINHA_MEETING_SHORT: Tri = { pt: "Encontro em São Conrado", en: "Meeting in São Conrado", es: "Encuentro en São Conrado" };

export type { LocalizedText };
