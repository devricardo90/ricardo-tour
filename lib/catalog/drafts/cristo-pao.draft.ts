import type { TourContentRecord } from "@/lib/catalog/tour-content";

/**
 * RT-112 / RT-115 — TOUR-01 Cristo Redentor + Pão de Açúcar: REAL commercial content, written ONLY from Owner decisions:
 * Ficha Comercial v1.0 (CR-01..CR-18, 18/10/2026), Manual Mestre v0.7 §10 and the later transport decision T1 (Owner's
 * own vehicle, Ricardo as guide and driver, 18/10/2026). Status: DRAFT — editorial texts written by the agent for Owner
 * review (RT-115); the public gate never shows DRAFT content.
 * - No price anywhere: the price is not approved (proposal lives only in the Manual Mestre's confidential §14.6.12).
 *   The page shows "orçamento sob consulta" and the availability request.
 * - No internal cost, supplier, margin or guide fee.
 * - Transport by the guide's own vehicle is pending documentary regularization (Manual §10.6.1): shown as PENDING in review.
 * - Cancellation / weather terms are not stated (RT-81/RT-118): the FAQ says the team explains them before confirmation.
 * Lab only: a test forbids importing lib/catalog/drafts/* from public routes, APIs or public components.
 */

export const CRISTO_ID = "cmlhxkpy9000028zq27rhytew";
export const CRISTO_DRAFT_SOURCE =
  "Owner decisions: Ficha Comercial RT-112 v1.0 (CR-01..CR-18) and transport T1 (18/10/2026), Manual Mestre v0.7 §10. Editorial texts pending Owner review (RT-115). Still DRAFT: publication blocked by RT-81, RT-110, RT-118, RT-119, RT-120 and the vehicle regularization.";

type Tri = { pt: string; en: string; es: string };
const list = (items: Array<[string, string, string]>) => ({ pt: items.map((i) => i[0]), en: items.map((i) => i[1]), es: items.map((i) => i[2]) });

/** Working name approved by the Owner (Ficha v1.0 §2.1). EN/ES are translations pending RT-115 review. */
export const CRISTO_TITLE: Tri = {
  pt: "Cristo Redentor + Pão de Açúcar — Tour Privativo",
  en: "Christ the Redeemer + Sugarloaf Mountain — Private Tour",
  es: "Cristo Redentor + Pan de Azúcar — Tour Privado",
};

export const CRISTO_SUBTITLE: Tri = {
  pt: "Os principais cartões-postais do Rio em um dia privativo, com guia, transporte e ingressos incluídos.",
  en: "Rio's best-known landmarks on a private day out, with your guide, transport and tickets included.",
  es: "Las postales más famosas de Río en un día privado, con guía, transporte y entradas incluidos.",
};

export const CRISTO_BENEFITS = list([
  ["Só o seu grupo, de 1 a 4 turistas", "Just your group, one to four guests", "Solo tu grupo, de 1 a 4 personas"],
  ["Ingressos do Cristo Redentor e do Bondinho incluídos", "Christ the Redeemer and Sugarloaf cable car tickets included", "Entradas al Cristo Redentor y al teleférico incluidas"],
  ["Busca e retorno no hotel em seis bairros do Rio", "Hotel pickup and drop-off in six Rio neighbourhoods", "Recogida y regreso al hotel en seis barrios de Río"],
]);

const NEIGHBOURHOODS: Tri = {
  pt: "Copacabana, Ipanema, Leblon, Botafogo, Flamengo e Centro",
  en: "Copacabana, Ipanema, Leblon, Botafogo, Flamengo and Centro",
  es: "Copacabana, Ipanema, Leblon, Botafogo, Flamengo y Centro",
};

export const CRISTO_CONTENT: Omit<TourContentRecord, "tripId" | "status" | "source" | "images"> = {
  summary: {
    pt: "Um dia privativo pelo Cristo Redentor, pela Escadaria Selarón (ou pelo Mirante Dona Marta) e pelo Pão de Açúcar, com busca no hotel, guia acompanhando todo o roteiro e ingressos incluídos.",
    en: "A private day visiting Christ the Redeemer, the Selarón Steps (or the Dona Marta viewpoint) and Sugarloaf Mountain, with hotel pickup, a guide throughout and tickets included.",
    es: "Un día privado por el Cristo Redentor, la Escalera Selarón (o el Mirador Dona Marta) y el Pan de Azúcar, con recogida en el hotel, guía durante todo el recorrido y entradas incluidas.",
  },
  description: {
    pt: `Esta é uma experiência exclusiva para o seu grupo, de 1 a 4 turistas, com o guia acompanhando do início ao fim. A busca e o retorno acontecem no seu hotel, em ${NEIGHBOURHOODS.pt}.\n\nO dia começa pela manhã no Cristo Redentor, com subida pelo Trem do Corcovado ou pela van oficial, à sua escolha durante a organização do passeio. Em seguida, visitamos a Escadaria Selarón ou, se preferir, o Mirante Dona Marta. Há uma pausa possível para o almoço e, depois, a subida ao Pão de Açúcar pelo Bondinho, antes do retorno ao hotel.\n\nOs ingressos do Cristo Redentor e do Bondinho, o transporte durante o roteiro e a água estão incluídos no valor total combinado. O almoço é opcional e pago à parte. O passeio dura aproximadamente 8 horas.\n\nA ordem das paradas pode mudar por trânsito, horários dos ingressos, clima ou necessidade operacional.`,
    en: `This is a private experience just for your group of one to four guests, with your guide alongside you from start to finish. We pick you up and drop you off at your hotel in ${NEIGHBOURHOODS.en}.\n\nThe day starts in the morning at Christ the Redeemer. You go up by the Corcovado Train or by the official van, whichever you choose when planning the tour. Next comes the Selarón Steps or, if you prefer, the Dona Marta viewpoint. There is an optional lunch break, then the Sugarloaf cable car before the ride back to your hotel.\n\nChrist the Redeemer and Sugarloaf cable car tickets, transport during the tour and water are included in the agreed total price. Lunch is optional and paid separately. The tour takes approximately 8 hours.\n\nThe order of the stops may change because of traffic, ticket times, weather or operational needs.`,
    es: `Es una experiencia exclusiva para tu grupo, de 1 a 4 personas, con el guía acompañándote de principio a fin. Te recogemos y te llevamos de vuelta a tu hotel en ${NEIGHBOURHOODS.es}.\n\nEl día empieza por la mañana en el Cristo Redentor. La subida es en el Tren del Corcovado o en la van oficial, según prefieras al organizar el tour. Después visitamos la Escalera Selarón o, si lo prefieres, el Mirador Dona Marta. Hay una pausa opcional para almorzar y, luego, la subida al Pan de Azúcar en teleférico antes del regreso al hotel.\n\nLas entradas al Cristo Redentor y al teleférico, el transporte durante el recorrido y el agua están incluidos en el precio total acordado. El almuerzo es opcional y se paga aparte. El tour dura aproximadamente 8 horas.\n\nEl orden de las paradas puede cambiar por el tráfico, los horarios de las entradas, el clima o necesidades operativas.`,
  },
  durationLabel: { pt: "Aproximadamente 8 horas", en: "Approximately 8 hours", es: "Aproximadamente 8 horas" },
  meetingPoint: {
    pt: `Busca e retorno no hotel em ${NEIGHBOURHOODS.pt}. Outras regiões não fazem parte da modalidade padrão.`,
    en: `Hotel pickup and drop-off in ${NEIGHBOURHOODS.en}. Other areas are not part of the standard tour.`,
    es: `Recogida y regreso al hotel en ${NEIGHBOURHOODS.es}. Otras zonas no forman parte de la modalidad estándar.`,
  },
  startTimeNote: {
    pt: "Pela manhã, em horário combinado com você (por exemplo, 7h, 8h ou 9h)",
    en: "In the morning, at a time agreed with you (for example 7, 8 or 9 a.m.)",
    es: "Por la mañana, en un horario acordado contigo (por ejemplo, 7, 8 o 9 h)",
  },
  languages: ["pt", "en", "es"],
  inclusions: list([
    ["Guia privativo durante todo o roteiro", "Private guide throughout the tour", "Guía privado durante todo el recorrido"],
    ["Busca no hotel nas regiões atendidas", "Hotel pickup in the areas covered", "Recogida en el hotel en las zonas atendidas"],
    ["Retorno ao hotel", "Drop-off at your hotel", "Regreso al hotel"],
    ["Transporte durante o roteiro", "Transport during the tour", "Transporte durante el recorrido"],
    ["Ingresso do Cristo Redentor (Trem do Corcovado ou van oficial)", "Christ the Redeemer ticket (Corcovado Train or official van)", "Entrada al Cristo Redentor (Tren del Corcovado o van oficial)"],
    ["Ingresso do Bondinho do Pão de Açúcar", "Sugarloaf cable car ticket", "Entrada al teleférico del Pan de Azúcar"],
    ["Visita à Escadaria Selarón ou ao Mirante Dona Marta", "Visit to the Selarón Steps or the Dona Marta viewpoint", "Visita a la Escalera Selarón o al Mirador Dona Marta"],
    ["Água", "Water", "Agua"],
    ["Acompanhamento cultural e histórico", "Cultural and historical commentary", "Explicaciones culturales e históricas"],
    ["Ajuda do guia para tirar fotografias", "Help from your guide with photos", "Ayuda del guía para hacer fotos"],
  ]),
  exclusions: list([
    ["Almoço, refeições e lanches", "Lunch, meals and snacks", "Almuerzo, comidas y meriendas"],
    ["Bebidas extras", "Additional drinks", "Bebidas adicionales"],
    ["Compras pessoais", "Personal shopping", "Compras personales"],
    ["Gorjetas voluntárias", "Optional tips", "Propinas voluntarias"],
    ["Fotografias profissionais de terceiros", "Professional photography by third parties", "Fotografía profesional de terceros"],
    ["Serviços de drone", "Drone services", "Servicios de dron"],
    ["Atrações adicionais não previstas", "Additional attractions not in the itinerary", "Atracciones adicionales no previstas"],
    ["Transporte fora das regiões contratadas", "Transport outside the areas covered", "Transporte fuera de las zonas contratadas"],
    ["Serviços opcionais contratados por você", "Optional services you choose to book", "Servicios opcionales contratados por ti"],
  ]),
  optionalServicesNote: null,
  requirements: {
    pt: "Crianças são bem-vindas, acompanhadas dos responsáveis, e contam na capacidade de até 4 turistas. Crianças de 0 a 2 anos pagam 50% da tarifa individual; a partir de 3 anos, a tarifa é integral. Informe a idade das crianças na solicitação: o transporte segue as regras de cadeirinha e assento de elevação. Use calçado confortável. O atendimento pode ser em português, inglês ou espanhol, conforme confirmado na reserva.",
    en: "Children are welcome with their parents or guardians and count towards the maximum of four guests. Children aged 0 to 2 pay 50% of the individual rate; from age 3 the full rate applies. Please tell us the children's ages when you request availability, as transport follows the rules for child car seats and booster seats. Wear comfortable shoes. The tour can be guided in Portuguese, English or Spanish, as confirmed when you book.",
    es: "Los niños son bienvenidos con sus padres o responsables y cuentan dentro del máximo de 4 personas. Los niños de 0 a 2 años pagan el 50% de la tarifa individual; desde los 3 años, la tarifa es completa. Indica la edad de los niños al solicitar disponibilidad, ya que el transporte sigue las normas de sillitas y elevadores infantiles. Usa calzado cómodo. El tour puede realizarse en portugués, inglés o español, según se confirme en la reserva.",
  },
  accessibility: {
    pt: "O roteiro inclui caminhadas curtas, filas nas atrações e escadas na Escadaria Selarón. Se você tem mobilidade reduzida ou alguma limitação física, fale com a equipe antes de reservar para avaliarmos juntos a melhor forma de fazer o passeio.",
    en: "The tour includes short walks, queues at the attractions and stairs at the Selarón Steps. If you have reduced mobility or a physical limitation, please talk to our team before booking so we can work out together the best way to do the tour.",
    es: "El recorrido incluye caminatas cortas, filas en las atracciones y escaleras en la Escalera Selarón. Si tienes movilidad reducida o alguna limitación física, habla con nuestro equipo antes de reservar para evaluar juntos la mejor forma de hacer el tour.",
  },
  operationalConditions: {
    pt: "Cada reserva é confirmada pela nossa equipe após a verificação de disponibilidade das atrações. A ordem do roteiro pode mudar por trânsito, horários dos ingressos, clima ou necessidade operacional. Não prometemos restaurante específico na pausa para o almoço.",
    en: "Our team confirms each booking after checking availability at the attractions. The order of the itinerary may change because of traffic, ticket times, weather or operational needs. No specific restaurant is promised for the lunch break.",
    es: "Nuestro equipo confirma cada reserva tras verificar la disponibilidad de las atracciones. El orden del recorrido puede cambiar por el tráfico, los horarios de las entradas, el clima o necesidades operativas. No se garantiza un restaurante específico para la pausa del almuerzo.",
  },
  weatherPolicy: null,
  itinerary: [
    { position: 0, title: { pt: "Busca no hotel", en: "Hotel pickup", es: "Recogida en el hotel" }, description: { pt: `Em ${NEIGHBOURHOODS.pt}, no horário combinado.`, en: `In ${NEIGHBOURHOODS.en}, at the agreed time.`, es: `En ${NEIGHBOURHOODS.es}, en el horario acordado.` }, durationMinutes: null },
    { position: 1, title: { pt: "Cristo Redentor", en: "Christ the Redeemer", es: "Cristo Redentor" }, description: { pt: "Visita pela manhã, com subida pelo Trem do Corcovado ou pela van oficial, conforme a sua escolha.", en: "A morning visit, going up by the Corcovado Train or the official van, as you choose.", es: "Visita por la mañana, con subida en el Tren del Corcovado o en la van oficial, según prefieras." }, durationMinutes: null },
    { position: 2, title: { pt: "Escadaria Selarón", en: "Selarón Steps", es: "Escalera Selarón" }, description: { pt: "Parada principal do roteiro. Alternativa à sua escolha: o Mirante Dona Marta.", en: "The main stop on the itinerary. Your alternative: the Dona Marta viewpoint.", es: "Parada principal del recorrido. Alternativa a tu elección: el Mirador Dona Marta." }, durationMinutes: null },
    { position: 3, title: { pt: "Pausa para almoço (opcional)", en: "Lunch break (optional)", es: "Pausa para almorzar (opcional)" }, description: { pt: "Quando couber no roteiro; a refeição é paga à parte.", en: "When it fits the itinerary; the meal is paid separately.", es: "Cuando encaje en el recorrido; la comida se paga aparte." }, durationMinutes: null },
    { position: 4, title: { pt: "Pão de Açúcar pelo Bondinho", en: "Sugarloaf Mountain by cable car", es: "Pan de Azúcar en teleférico" }, description: { pt: "Ingresso do Bondinho incluído.", en: "Cable car ticket included.", es: "Entrada al teleférico incluida." }, durationMinutes: null },
    { position: 5, title: { pt: "Retorno ao hotel", en: "Drop-off at your hotel", es: "Regreso al hotel" }, description: null, durationMinutes: null },
  ],
  faq: [
    {
      question: { pt: "O passeio é privativo?", en: "Is the tour private?", es: "¿El tour es privado?" },
      answer: { pt: "Sim. O passeio é exclusivo para o seu grupo, de 1 a 4 turistas, com o guia acompanhando todo o roteiro.", en: "Yes. The tour is just for your group of one to four guests, with your guide alongside you throughout.", es: "Sí. El tour es exclusivo para tu grupo, de 1 a 4 personas, con el guía acompañándote durante todo el recorrido." },
    },
    {
      question: { pt: "Os ingressos estão incluídos?", en: "Are the tickets included?", es: "¿Las entradas están incluidas?" },
      answer: { pt: "Sim. O ingresso do Cristo Redentor (pelo Trem do Corcovado ou pela van oficial) e o do Bondinho do Pão de Açúcar fazem parte do valor total. Você não precisa comprá-los separadamente.", en: "Yes. The Christ the Redeemer ticket (Corcovado Train or official van) and the Sugarloaf cable car ticket are part of the total price, so you don't need to buy them separately.", es: "Sí. La entrada al Cristo Redentor (en el Tren del Corcovado o en la van oficial) y la del teleférico del Pan de Azúcar forman parte del precio total. No necesitas comprarlas por separado." },
    },
    {
      question: { pt: "Trem do Corcovado ou van oficial?", en: "Corcovado Train or official van?", es: "¿Tren del Corcovado o van oficial?" },
      answer: { pt: "Você escolhe durante a organização do passeio. O valor final considera a opção escolhida.", en: "You choose when we plan the tour. The final price reflects the option you pick.", es: "Lo eliges al organizar el tour. El precio final tiene en cuenta la opción elegida." },
    },
    {
      question: { pt: "Em quais bairros vocês buscam no hotel?", en: "Which areas do you pick up from?", es: "¿En qué barrios recogen en el hotel?" },
      answer: { pt: `${NEIGHBOURHOODS.pt}. Não há busca no Recreio nem em Resende, e Barra da Tijuca e Niterói não fazem parte da modalidade padrão.`, en: `${NEIGHBOURHOODS.en}. There is no pickup in Recreio or Resende, and Barra da Tijuca and Niterói are not part of the standard tour.`, es: `${NEIGHBOURHOODS.es}. No hay recogida en Recreio ni en Resende, y Barra da Tijuca y Niterói no forman parte de la modalidad estándar.` },
    },
    {
      question: { pt: "Crianças podem participar?", en: "Can children join?", es: "¿Pueden participar niños?" },
      answer: { pt: "Sim, acompanhadas dos responsáveis. Crianças de 0 a 2 anos pagam 50% da tarifa individual; a partir de 3 anos, a tarifa é integral. As crianças contam na capacidade de até 4 turistas.", en: "Yes, with their parents or guardians. Children aged 0 to 2 pay 50% of the individual rate; from age 3 the full rate applies. Children count towards the maximum of four guests.", es: "Sí, acompañados de sus responsables. Los niños de 0 a 2 años pagan el 50% de la tarifa individual; desde los 3 años, la tarifa es completa. Los niños cuentan dentro del máximo de 4 personas." },
    },
    {
      question: { pt: "O almoço está incluído?", en: "Is lunch included?", es: "¿El almuerzo está incluido?" },
      answer: { pt: "Não. Pode haver uma pausa para o almoço, combinada com você, e a refeição é paga diretamente por você.", en: "No. There can be a lunch break arranged with you, and you pay for the meal directly.", es: "No. Puede haber una pausa para almorzar, acordada contigo, y la comida la pagas directamente." },
    },
    {
      question: { pt: "Como funciona a reserva e o pagamento?", en: "How do booking and payment work?", es: "¿Cómo funcionan la reserva y el pago?" },
      answer: { pt: "Solicite disponibilidade pelo WhatsApp. Depois de confirmar a data, nossa equipe envia o valor total. Para confirmar a reserva, você paga o valor dos ingressos e 30% dos serviços; os 70% restantes dos serviços são pagos antes do início do passeio. Os ingressos não são cobrados duas vezes, e o site não processa pagamentos.", en: "Request availability on WhatsApp. Once the date is confirmed, our team sends you the total price. To confirm the booking you pay for the tickets plus 30% of the services; the remaining 70% of the services is paid before the tour starts. Tickets are never charged twice, and payments are not processed on this website.", es: "Solicita disponibilidad por WhatsApp. Tras confirmar la fecha, nuestro equipo te envía el precio total. Para confirmar la reserva pagas las entradas y el 30% de los servicios; el 70% restante de los servicios se paga antes del inicio del tour. Las entradas nunca se cobran dos veces y los pagos no se procesan en este sitio web." },
    },
    {
      question: { pt: "E se o roteiro precisar mudar?", en: "What if the itinerary has to change?", es: "¿Y si el recorrido tiene que cambiar?" },
      answer: { pt: "A ordem das paradas pode mudar por trânsito, horários dos ingressos, clima ou necessidade operacional. Nossa equipe explica as opções e as condições aplicáveis antes de confirmar a reserva.", en: "The order of the stops may change because of traffic, ticket times, weather or operational needs. Our team explains the options and applicable terms before confirming your booking.", es: "El orden de las paradas puede cambiar por el tráfico, los horarios de las entradas, el clima o necesidades operativas. Nuestro equipo explica las opciones y las condiciones aplicables antes de confirmar la reserva." },
    },
  ],
};

/** Prefilled WhatsApp message (sent through the canonical public number in lib/public-contact.ts). */
export const CRISTO_WHATSAPP_MESSAGE: Tri = {
  pt: "Olá! Quero consultar a disponibilidade do passeio Cristo Redentor + Pão de Açúcar — Tour Privativo.\nData desejada: \nParticipantes (1 a 4, informe a idade das crianças): \nBairro do hotel: \nSubida ao Cristo (trem ou van): \nSelarón ou Dona Marta: \nIdioma preferido: ",
  en: "Hello! I'd like to check availability for Christ the Redeemer + Sugarloaf Mountain — Private Tour.\nPreferred date: \nGuests (1–4, children's ages): \nHotel area: \nChrist the Redeemer access (train or van): \nSelarón or Dona Marta: \nPreferred language: ",
  es: "¡Hola! Quisiera consultar la disponibilidad del tour Cristo Redentor + Pan de Azúcar — Tour Privado.\nFecha deseada: \nParticipantes (1 a 4, edad de los niños): \nBarrio del hotel: \nSubida al Cristo (tren o van): \nSelarón o Dona Marta: \nIdioma preferido: ",
};

export const CRISTO_GROUP_SIZE: Tri = { pt: "1 a 4 turistas, crianças incluídas", en: "1 to 4 guests, children included", es: "1 a 4 personas, niños incluidos" };
export const CRISTO_CHILDREN: Tri = { pt: "Bem-vindas · 0 a 2 anos pagam 50%", en: "Welcome · ages 0–2 pay 50%", es: "Bienvenidos · de 0 a 2 años pagan el 50%" };
export const CRISTO_PICKUP_SHORT: Tri = { pt: "Busca e retorno no hotel", en: "Hotel pickup and drop-off", es: "Recogida y regreso al hotel" };
/** Price is not approved: the page asks for a quote instead of showing any amount. */
export const CRISTO_PRICE_LABEL: Tri = { pt: "Orçamento sob consulta", en: "Quote on request", es: "Presupuesto a consultar" };
