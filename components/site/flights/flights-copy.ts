import type { FlightErrorClass, FlightSort } from "@/lib/flights/types";
import type { FlightValidationCode } from "@/lib/flights/validation";

// Copy for the Flight Planner prototype (RT-38; PT / EN / ES, PT is the source). Plain strings only. SV and any other locale
// resolve to PT, like the other public pages. Final copy review is RT-78 and legal/disclosure copy is RT-80/RT-81.
//
// Terminology (RT-37 §0): Search, Offer, Selected Offer, Validated Offer, Order, Ticket, Payment, Issuance.
// Deliberately absent: "booking"/"reserva" wording, "confirmed"/"issued" claims, any statement that flights are live,
// any passenger age band, any real airline name, and any invented legal text.

export type FlightsCopy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  heading: string;
  intro: string;
  demo: {
    bannerTitle: string;
    bannerBody: string;
    sampleBadge: string;
    panelTitle: string;
    panelHelp: string;
    scenarioLabel: string;
    scenarios: Record<string, string>;
  };
  tabs: { label: string; flights: string; hotels: string; flightHotel: string; soon: string };
  comingSoon: { hotelsHeading: string; flightHotelHeading: string; body: string };
  tripExtras: { heading: string; body: string; link: string };
  form: {
    heading: string;
    origin: string;
    destination: string;
    swap: string;
    tripType: string;
    oneWay: string;
    roundTrip: string;
    departDate: string;
    returnDate: string;
    passengers: string;
    cabin: string;
    cabinAny: string;
    cabinOptions: Record<string, string>;
    cabinNote: string;
    search: string;
    searching: string;
    summaryTitle: string;
  };
  location: {
    placeholder: string;
    noResults: string;
    clear: string;
    count: string; // {n}
    listLabel: string;
  };
  passengers: {
    sheetTitle: string;
    done: string;
    increase: string; // {type}
    decrease: string; // {type}
    placeholderNote: string;
    types: Record<string, { one: string; other: string }>;
  };
  errors: Record<FlightValidationCode, string>;
  loading: { searching: string; stillSearching: string; cancel: string; cancelled: string };
  empty: { title: string; body: string; modify: string };
  failure: {
    byClass: Record<Exclude<FlightErrorClass, "VALIDATION_ERROR">, { title: string; body: string }>;
    retry: string;
    change: string;
    reference: string;
    partial: string;
    talk: string;
  };
  results: {
    summary: string;
    modify: string;
    count: string; // {n}
    sortLabel: string;
    sorts: Record<FlightSort, string>;
    priceNote: string;
    totalFor: string; // {n}
    totalForOne: string;
    direct: string;
    oneStop: string;
    stopsMany: string; // {n}
    layover: string; // {airport} {duration}
    outbound: string;
    inbound: string;
    select: string;
    selected: string;
    noLongerAvailable: string;
    selectAria: string; // {carrier} {price}
    units: { h: string; min: string };
    nextDay: string; // {n}
    baggageKnown: string; // {value}
    baggageUnknown: string;
    fareConditions: string;
    fareConditionsPlaceholder: string;
    baggagePlaceholder: string;
  };
  dialog: {
    validatingTitle: string;
    validatingBody: string;
    cancel: string;
    validTitle: string;
    validBody: string;
    continue: string;
    back: string;
    priceChangedTitle: string;
    priceChangedBody: string;
    previous: string;
    updated: string;
    difference: string;
    accept: string;
    unavailableTitle: string;
    unavailableBody: string;
    staleTitle: string;
    staleBody: string;
    searchAgain: string;
    failedTitle: string;
    failedBody: string;
    retry: string;
    handoffTitle: string;
    handoffBody: string;
    talk: string;
  };
};

const pt: FlightsCopy = {
  metaTitle: "Voos (demonstração) | Ricardo Tour",
  metaDescription: "Protótipo do planejador de voos da Ricardo Tour. Dados de exemplo; não há busca real nem preços reais.",
  eyebrow: "PLANEJADOR DE VOOS",
  heading: "Planeje seu voo para o Rio",
  intro: "Prévia do planejador de voos. Explore o fluxo de busca, ofertas e validação com dados de exemplo.",
  demo: {
    bannerTitle: "Prévia de demonstração",
    bannerBody: "Dados de exemplo — não são voos nem preços reais. Nenhuma compra pode ser feita aqui.",
    sampleBadge: "Exemplo",
    panelTitle: "Cenários do protótipo",
    panelHelp: "Somente nesta prévia: escolha um cenário para ver cada estado da tela. Será removido quando a busca real existir.",
    scenarioLabel: "Cenário simulado",
    scenarios: {
      normal: "Normal: ofertas e validação concluída",
      no_results: "Sem resultados",
      slow: "Busca lenta (com cancelamento)",
      timeout: "Tempo esgotado na busca",
      unavailable: "Serviço de busca indisponível",
      rate_limited: "Muitas buscas ao mesmo tempo",
      network: "Falha de conexão",
      internal: "Erro interno",
      partial: "Resultados parciais",
      price_changed: "Preço muda na validação",
      offer_unavailable: "Oferta esgotada na validação",
      offer_stale: "Oferta expirada na validação",
      validation_failed: "Falha na validação",
    },
  },
  tabs: { label: "Produtos de viagem", flights: "Voos", hotels: "Hotéis", flightHotel: "Voo + Hotel", soon: "Em breve" },
  comingSoon: {
    hotelsHeading: "Hotéis",
    flightHotelHeading: "Voo + Hotel",
    body: "Esta categoria ainda não está disponível. Nenhuma busca é feita e nenhum preço ou disponibilidade é exibido. Integração com provedor pendente.",
  },
  tripExtras: {
    heading: "Complete sua viagem no Rio",
    body: "As experiências do Rio têm catálogo, preços e contato próprios, separados dos voos.",
    link: "Ver experiências no Rio",
  },
  form: {
    heading: "Buscar voos",
    origin: "Origem",
    destination: "Destino",
    swap: "Inverter origem e destino",
    tripType: "Tipo de viagem",
    oneWay: "Somente ida",
    roundTrip: "Ida e volta",
    departDate: "Data de ida",
    returnDate: "Data de volta",
    passengers: "Passageiros",
    cabin: "Classe",
    cabinAny: "Qualquer classe",
    cabinOptions: { economy: "Econômica", premium: "Econômica premium", business: "Executiva", first: "Primeira classe" },
    cabinNote: "Campo provisório da prévia: só aparecerá se o fornecedor oferecer escolha de classe.",
    search: "Buscar voos",
    searching: "Buscando…",
    summaryTitle: "Corrija os campos abaixo para buscar:",
  },
  location: {
    placeholder: "Cidade ou aeroporto",
    noResults: "Nenhum aeroporto encontrado. Tente o nome da cidade ou o código do aeroporto.",
    clear: "Limpar",
    count: "{n} locais encontrados",
    listLabel: "Sugestões de locais",
  },
  passengers: {
    sheetTitle: "Passageiros",
    done: "Concluir",
    increase: "Adicionar {type}",
    decrease: "Remover {type}",
    placeholderNote: "As categorias e os limites de passageiros são confirmados com o fornecedor. Valores desta prévia são apenas de exemplo.",
    types: { adult: { one: "adulto", other: "adultos" }, child: { one: "criança", other: "crianças" }, infant: { one: "bebê", other: "bebês" } },
  },
  errors: {
    ORIGIN_REQUIRED: "Informe a origem.",
    ORIGIN_NOT_SELECTED: "Escolha a origem na lista de sugestões.",
    DESTINATION_REQUIRED: "Informe o destino.",
    DESTINATION_NOT_SELECTED: "Escolha o destino na lista de sugestões.",
    SAME_PLACE: "Origem e destino precisam ser diferentes.",
    DEPART_REQUIRED: "Informe a data de ida.",
    DEPART_PAST: "A data de ida não pode ser anterior a hoje.",
    RETURN_REQUIRED: "Informe a data de volta.",
    RETURN_BEFORE_DEPART: "A volta não pode ser antes da ida.",
    PASSENGERS_REQUIRED: "Inclua pelo menos um passageiro.",
    PASSENGER_LIMIT: "Essa quantidade de passageiros não é aceita nesta busca.",
    PASSENGER_RULE: "Essa combinação de passageiros não é aceita nesta busca.",
  },
  loading: {
    searching: "Buscando voos…",
    stillSearching: "Ainda buscando — isso pode levar um pouco mais.",
    cancel: "Cancelar busca",
    cancelled: "Busca cancelada. Seus dados foram mantidos.",
  },
  empty: {
    title: "Nenhum voo encontrado para estas datas.",
    body: "Tente outras datas, somente ida ou outro aeroporto. Se preferir, fale com a nossa equipe.",
    modify: "Alterar busca",
  },
  failure: {
    byClass: {
      NETWORK_ERROR: { title: "Sem conexão", body: "Você parece estar offline ou a conexão caiu. Seus dados foram mantidos." },
      PROVIDER_TIMEOUT: { title: "A busca está demorando demais", body: "Tente de novo ou altere a busca." },
      PROVIDER_UNAVAILABLE: { title: "A busca de voos está indisponível no momento", body: "Tente novamente em instantes ou fale com a nossa equipe." },
      PROVIDER_RATE_LIMITED: { title: "Muita gente buscando agora", body: "Aguarde um instante e tente novamente." },
      INTERNAL_ERROR: { title: "Algo não saiu como esperado", body: "Tente novamente. Se continuar, fale com a nossa equipe informando o código abaixo." },
    },
    retry: "Tentar novamente",
    change: "Alterar busca",
    reference: "Código de referência",
    partial: "Alguns resultados podem estar faltando. Você pode tentar novamente para atualizar.",
    talk: "Falar com a equipe",
  },
  results: {
    summary: "Resumo da busca",
    modify: "Alterar busca",
    count: "{n} ofertas de exemplo",
    sortLabel: "Ordenar por",
    sorts: { RECOMMENDED: "Recomendadas", LOWEST_PRICE: "Menor preço", SHORTEST: "Menor duração", EARLIEST: "Saída mais cedo" },
    priceNote: "Os preços são verificados novamente na próxima etapa e podem mudar.",
    totalFor: "Total para {n} passageiros",
    totalForOne: "Total para 1 passageiro",
    direct: "Direto",
    oneStop: "1 parada",
    stopsMany: "{n} paradas",
    layover: "Conexão em {airport} ({duration})",
    outbound: "Ida",
    inbound: "Volta",
    select: "Selecionar oferta",
    selected: "Oferta selecionada",
    noLongerAvailable: "Oferta indisponível",
    selectAria: "Selecionar oferta {carrier}, {price}",
    units: { h: "h", min: "min" },
    nextDay: "+{n}",
    baggageKnown: "Bagagem despachada: {value}",
    baggageUnknown: "Detalhes da bagagem são confirmados na próxima etapa",
    fareConditions: "Condições da tarifa",
    fareConditionsPlaceholder: "Texto provisório da prévia. As condições reais (alteração, cancelamento e reembolso) virão do fornecedor da tarifa, sem reescrita.",
    baggagePlaceholder: "Texto provisório: os dados de bagagem dependem do fornecedor.",
  },
  dialog: {
    validatingTitle: "Confirmando preço e disponibilidade…",
    validatingBody: "Aguarde um instante.",
    cancel: "Cancelar",
    validTitle: "Oferta validada",
    validBody: "Preço e disponibilidade verificados nesta prévia.",
    continue: "Continuar",
    back: "Voltar aos resultados",
    priceChangedTitle: "O preço mudou",
    priceChangedBody: "Para continuar, aceite o novo preço ou volte aos resultados. Nada é cobrado sem a sua aceitação.",
    previous: "Preço anterior",
    updated: "Novo preço",
    difference: "Diferença",
    accept: "Aceitar novo preço",
    unavailableTitle: "Esta oferta não está mais disponível.",
    unavailableBody: "Volte aos resultados para escolher outra oferta.",
    staleTitle: "Esta tarifa expirou.",
    staleBody: "Os preços mudam com frequência. Faça a busca novamente.",
    searchAgain: "Buscar novamente",
    failedTitle: "Não foi possível validar a oferta agora.",
    failedBody: "Tente de novo ou volte aos resultados.",
    retry: "Tentar novamente",
    handoffTitle: "Próximas etapas ainda não disponíveis",
    handoffBody: "As próximas etapas (dados dos passageiros e pagamento) ainda não estão disponíveis. Isto é uma prévia.",
    talk: "Falar com a equipe",
  },
};

const en: FlightsCopy = {
  metaTitle: "Flights (demo) | Ricardo Tour",
  metaDescription: "Prototype of the Ricardo Tour flight planner. Sample data only; there is no live search and no real prices.",
  eyebrow: "FLIGHT PLANNER",
  heading: "Plan your flight to Rio",
  intro: "A preview of the flight planner. Explore the search, offer and validation flow with sample data.",
  demo: {
    bannerTitle: "Demo preview",
    bannerBody: "Sample data — not real flights or prices. Nothing can be purchased here.",
    sampleBadge: "Sample",
    panelTitle: "Prototype scenarios",
    panelHelp: "This preview only: pick a scenario to see each state of the screen. It will be removed once live search exists.",
    scenarioLabel: "Simulated scenario",
    scenarios: {
      normal: "Normal: offers and validation succeed",
      no_results: "No results",
      slow: "Slow search (can be cancelled)",
      timeout: "Search timeout",
      unavailable: "Search service unavailable",
      rate_limited: "Too many searches at once",
      network: "Connection failure",
      internal: "Internal error",
      partial: "Partial results",
      price_changed: "Price changes on validation",
      offer_unavailable: "Offer sold out on validation",
      offer_stale: "Offer expired on validation",
      validation_failed: "Validation fails",
    },
  },
  tabs: { label: "Travel products", flights: "Flights", hotels: "Hotels", flightHotel: "Flight + Hotel", soon: "Coming soon" },
  comingSoon: {
    hotelsHeading: "Hotels",
    flightHotelHeading: "Flight + Hotel",
    body: "This category is not available yet. No search is performed and no prices or availability are shown. Provider integration pending.",
  },
  tripExtras: {
    heading: "Complete your trip in Rio",
    body: "Rio experiences have their own catalog, prices and contact, separate from flights.",
    link: "See experiences in Rio",
  },
  form: {
    heading: "Search flights",
    origin: "From",
    destination: "To",
    swap: "Swap origin and destination",
    tripType: "Trip type",
    oneWay: "One way",
    roundTrip: "Round trip",
    departDate: "Departure date",
    returnDate: "Return date",
    passengers: "Passengers",
    cabin: "Cabin",
    cabinAny: "Any cabin",
    cabinOptions: { economy: "Economy", premium: "Premium economy", business: "Business", first: "First" },
    cabinNote: "Preview placeholder: it will only appear if the provider supports choosing a cabin.",
    search: "Search flights",
    searching: "Searching…",
    summaryTitle: "Fix the fields below to search:",
  },
  location: {
    placeholder: "City or airport",
    noResults: "No airports found. Try the city name or the airport code.",
    clear: "Clear",
    count: "{n} places found",
    listLabel: "Place suggestions",
  },
  passengers: {
    sheetTitle: "Passengers",
    done: "Done",
    increase: "Add {type}",
    decrease: "Remove {type}",
    placeholderNote: "Passenger categories and limits are confirmed with the provider. Values in this preview are examples only.",
    types: { adult: { one: "adult", other: "adults" }, child: { one: "child", other: "children" }, infant: { one: "infant", other: "infants" } },
  },
  errors: {
    ORIGIN_REQUIRED: "Enter where you are flying from.",
    ORIGIN_NOT_SELECTED: "Choose the origin from the suggestions list.",
    DESTINATION_REQUIRED: "Enter where you are flying to.",
    DESTINATION_NOT_SELECTED: "Choose the destination from the suggestions list.",
    SAME_PLACE: "Origin and destination must be different.",
    DEPART_REQUIRED: "Enter a departure date.",
    DEPART_PAST: "The departure date cannot be before today.",
    RETURN_REQUIRED: "Enter a return date.",
    RETURN_BEFORE_DEPART: "The return cannot be before the departure.",
    PASSENGERS_REQUIRED: "Include at least one passenger.",
    PASSENGER_LIMIT: "That number of passengers is not accepted for this search.",
    PASSENGER_RULE: "That combination of passengers is not accepted for this search.",
  },
  loading: {
    searching: "Searching flights…",
    stillSearching: "Still searching — this can take a little longer.",
    cancel: "Cancel search",
    cancelled: "Search cancelled. Your details were kept.",
  },
  empty: {
    title: "No flights found for these dates.",
    body: "Try other dates, one way, or another airport. You can also talk to our team.",
    modify: "Modify search",
  },
  failure: {
    byClass: {
      NETWORK_ERROR: { title: "No connection", body: "You seem to be offline or the connection dropped. Your details were kept." },
      PROVIDER_TIMEOUT: { title: "The search is taking too long", body: "Try again or change your search." },
      PROVIDER_UNAVAILABLE: { title: "Flight search is temporarily unavailable", body: "Please try again shortly or talk to our team." },
      PROVIDER_RATE_LIMITED: { title: "Many people are searching right now", body: "Please wait a moment and try again." },
      INTERNAL_ERROR: { title: "Something did not go as expected", body: "Please try again. If it continues, talk to our team and quote the reference below." },
    },
    retry: "Try again",
    change: "Modify search",
    reference: "Reference code",
    partial: "Some results may be missing. You can try again to refresh.",
    talk: "Talk to our team",
  },
  results: {
    summary: "Search summary",
    modify: "Modify search",
    count: "{n} sample offers",
    sortLabel: "Sort by",
    sorts: { RECOMMENDED: "Recommended", LOWEST_PRICE: "Lowest price", SHORTEST: "Shortest duration", EARLIEST: "Earliest departure" },
    priceNote: "Prices are checked again in the next step and may change.",
    totalFor: "Total for {n} passengers",
    totalForOne: "Total for 1 passenger",
    direct: "Direct",
    oneStop: "1 stop",
    stopsMany: "{n} stops",
    layover: "Connection in {airport} ({duration})",
    outbound: "Outbound",
    inbound: "Return",
    select: "Select offer",
    selected: "Selected offer",
    noLongerAvailable: "Offer unavailable",
    selectAria: "Select {carrier} offer, {price}",
    units: { h: "h", min: "min" },
    nextDay: "+{n}",
    baggageKnown: "Checked baggage: {value}",
    baggageUnknown: "Baggage details are confirmed in the next step",
    fareConditions: "Fare conditions",
    fareConditionsPlaceholder: "Preview placeholder. Real conditions (changes, cancellation and refunds) will come from the fare supplier, unaltered.",
    baggagePlaceholder: "Placeholder: baggage data depends on the provider.",
  },
  dialog: {
    validatingTitle: "Checking price and availability…",
    validatingBody: "Please wait a moment.",
    cancel: "Cancel",
    validTitle: "Validated offer",
    validBody: "Price and availability checked in this preview.",
    continue: "Continue",
    back: "Back to results",
    priceChangedTitle: "The price has changed",
    priceChangedBody: "To continue, accept the new price or go back to the results. Nothing is charged without your acceptance.",
    previous: "Previous price",
    updated: "New price",
    difference: "Difference",
    accept: "Accept new price",
    unavailableTitle: "This offer is no longer available.",
    unavailableBody: "Go back to the results to choose another offer.",
    staleTitle: "This fare has expired.",
    staleBody: "Prices change often. Please search again.",
    searchAgain: "Search again",
    failedTitle: "We could not validate the offer right now.",
    failedBody: "Try again or go back to the results.",
    retry: "Try again",
    handoffTitle: "Next steps not available yet",
    handoffBody: "The next steps (passenger details and payment) are not available yet. This is a preview.",
    talk: "Talk to our team",
  },
};

const es: FlightsCopy = {
  metaTitle: "Vuelos (demostración) | Ricardo Tour",
  metaDescription: "Prototipo del planificador de vuelos de Ricardo Tour. Solo datos de ejemplo; no hay búsqueda real ni precios reales.",
  eyebrow: "PLANIFICADOR DE VUELOS",
  heading: "Planifica tu vuelo a Río",
  intro: "Vista previa del planificador de vuelos. Explora la búsqueda, las ofertas y la validación con datos de ejemplo.",
  demo: {
    bannerTitle: "Vista previa de demostración",
    bannerBody: "Datos de ejemplo — no son vuelos ni precios reales. Aquí no se puede comprar nada.",
    sampleBadge: "Ejemplo",
    panelTitle: "Escenarios del prototipo",
    panelHelp: "Solo en esta vista previa: elige un escenario para ver cada estado de la pantalla. Se quitará cuando exista la búsqueda real.",
    scenarioLabel: "Escenario simulado",
    scenarios: {
      normal: "Normal: ofertas y validación correctas",
      no_results: "Sin resultados",
      slow: "Búsqueda lenta (se puede cancelar)",
      timeout: "Tiempo agotado en la búsqueda",
      unavailable: "Servicio de búsqueda no disponible",
      rate_limited: "Demasiadas búsquedas a la vez",
      network: "Fallo de conexión",
      internal: "Error interno",
      partial: "Resultados parciales",
      price_changed: "El precio cambia al validar",
      offer_unavailable: "Oferta agotada al validar",
      offer_stale: "Oferta vencida al validar",
      validation_failed: "Falla la validación",
    },
  },
  tabs: { label: "Productos de viaje", flights: "Vuelos", hotels: "Hoteles", flightHotel: "Vuelo + Hotel", soon: "Próximamente" },
  comingSoon: {
    hotelsHeading: "Hoteles",
    flightHotelHeading: "Vuelo + Hotel",
    body: "Esta categoría aún no está disponible. No se realiza ninguna búsqueda ni se muestran precios o disponibilidad. Integración con proveedor pendiente.",
  },
  tripExtras: {
    heading: "Completa tu viaje en Río",
    body: "Las experiencias en Río tienen su propio catálogo, precios y contacto, separados de los vuelos.",
    link: "Ver experiencias en Río",
  },
  form: {
    heading: "Buscar vuelos",
    origin: "Origen",
    destination: "Destino",
    swap: "Invertir origen y destino",
    tripType: "Tipo de viaje",
    oneWay: "Solo ida",
    roundTrip: "Ida y vuelta",
    departDate: "Fecha de ida",
    returnDate: "Fecha de vuelta",
    passengers: "Pasajeros",
    cabin: "Clase",
    cabinAny: "Cualquier clase",
    cabinOptions: { economy: "Económica", premium: "Económica premium", business: "Business", first: "Primera clase" },
    cabinNote: "Marcador de la vista previa: solo aparecerá si el proveedor permite elegir la clase.",
    search: "Buscar vuelos",
    searching: "Buscando…",
    summaryTitle: "Corrige los campos siguientes para buscar:",
  },
  location: {
    placeholder: "Ciudad o aeropuerto",
    noResults: "No se encontraron aeropuertos. Prueba con el nombre de la ciudad o el código del aeropuerto.",
    clear: "Borrar",
    count: "{n} lugares encontrados",
    listLabel: "Sugerencias de lugares",
  },
  passengers: {
    sheetTitle: "Pasajeros",
    done: "Listo",
    increase: "Añadir {type}",
    decrease: "Quitar {type}",
    placeholderNote: "Las categorías y los límites de pasajeros se confirman con el proveedor. Los valores de esta vista previa son solo ejemplos.",
    types: { adult: { one: "adulto", other: "adultos" }, child: { one: "niño", other: "niños" }, infant: { one: "bebé", other: "bebés" } },
  },
  errors: {
    ORIGIN_REQUIRED: "Indica el origen.",
    ORIGIN_NOT_SELECTED: "Elige el origen de la lista de sugerencias.",
    DESTINATION_REQUIRED: "Indica el destino.",
    DESTINATION_NOT_SELECTED: "Elige el destino de la lista de sugerencias.",
    SAME_PLACE: "El origen y el destino deben ser distintos.",
    DEPART_REQUIRED: "Indica la fecha de ida.",
    DEPART_PAST: "La fecha de ida no puede ser anterior a hoy.",
    RETURN_REQUIRED: "Indica la fecha de vuelta.",
    RETURN_BEFORE_DEPART: "La vuelta no puede ser antes de la ida.",
    PASSENGERS_REQUIRED: "Incluye al menos un pasajero.",
    PASSENGER_LIMIT: "Esa cantidad de pasajeros no se acepta en esta búsqueda.",
    PASSENGER_RULE: "Esa combinación de pasajeros no se acepta en esta búsqueda.",
  },
  loading: {
    searching: "Buscando vuelos…",
    stillSearching: "Seguimos buscando — puede tardar un poco más.",
    cancel: "Cancelar búsqueda",
    cancelled: "Búsqueda cancelada. Se conservaron tus datos.",
  },
  empty: {
    title: "No se encontraron vuelos para estas fechas.",
    body: "Prueba otras fechas, solo ida u otro aeropuerto. También puedes hablar con nuestro equipo.",
    modify: "Modificar búsqueda",
  },
  failure: {
    byClass: {
      NETWORK_ERROR: { title: "Sin conexión", body: "Parece que no tienes conexión o se cortó. Se conservaron tus datos." },
      PROVIDER_TIMEOUT: { title: "La búsqueda está tardando demasiado", body: "Inténtalo de nuevo o cambia la búsqueda." },
      PROVIDER_UNAVAILABLE: { title: "La búsqueda de vuelos no está disponible por ahora", body: "Inténtalo de nuevo en unos instantes o habla con nuestro equipo." },
      PROVIDER_RATE_LIMITED: { title: "Hay mucha gente buscando ahora", body: "Espera un momento e inténtalo de nuevo." },
      INTERNAL_ERROR: { title: "Algo no salió como esperábamos", body: "Inténtalo de nuevo. Si continúa, habla con nuestro equipo e indica el código de abajo." },
    },
    retry: "Intentar de nuevo",
    change: "Modificar búsqueda",
    reference: "Código de referencia",
    partial: "Puede que falten algunos resultados. Puedes intentarlo de nuevo para actualizar.",
    talk: "Hablar con el equipo",
  },
  results: {
    summary: "Resumen de la búsqueda",
    modify: "Modificar búsqueda",
    count: "{n} ofertas de ejemplo",
    sortLabel: "Ordenar por",
    sorts: { RECOMMENDED: "Recomendadas", LOWEST_PRICE: "Menor precio", SHORTEST: "Menor duración", EARLIEST: "Salida más temprana" },
    priceNote: "Los precios se verifican de nuevo en el siguiente paso y pueden cambiar.",
    totalFor: "Total para {n} pasajeros",
    totalForOne: "Total para 1 pasajero",
    direct: "Directo",
    oneStop: "1 escala",
    stopsMany: "{n} escalas",
    layover: "Conexión en {airport} ({duration})",
    outbound: "Ida",
    inbound: "Vuelta",
    select: "Seleccionar oferta",
    selected: "Oferta seleccionada",
    noLongerAvailable: "Oferta no disponible",
    selectAria: "Seleccionar oferta {carrier}, {price}",
    units: { h: "h", min: "min" },
    nextDay: "+{n}",
    baggageKnown: "Equipaje facturado: {value}",
    baggageUnknown: "Los detalles del equipaje se confirman en el siguiente paso",
    fareConditions: "Condiciones de la tarifa",
    fareConditionsPlaceholder: "Marcador de la vista previa. Las condiciones reales (cambios, cancelación y reembolsos) vendrán del proveedor de la tarifa, sin reescribir.",
    baggagePlaceholder: "Marcador: los datos de equipaje dependen del proveedor.",
  },
  dialog: {
    validatingTitle: "Comprobando precio y disponibilidad…",
    validatingBody: "Espera un momento.",
    cancel: "Cancelar",
    validTitle: "Oferta validada",
    validBody: "Precio y disponibilidad comprobados en esta vista previa.",
    continue: "Continuar",
    back: "Volver a los resultados",
    priceChangedTitle: "El precio ha cambiado",
    priceChangedBody: "Para continuar, acepta el nuevo precio o vuelve a los resultados. No se cobra nada sin tu aceptación.",
    previous: "Precio anterior",
    updated: "Nuevo precio",
    difference: "Diferencia",
    accept: "Aceptar nuevo precio",
    unavailableTitle: "Esta oferta ya no está disponible.",
    unavailableBody: "Vuelve a los resultados para elegir otra oferta.",
    staleTitle: "Esta tarifa ha vencido.",
    staleBody: "Los precios cambian con frecuencia. Vuelve a buscar.",
    searchAgain: "Buscar de nuevo",
    failedTitle: "No pudimos validar la oferta ahora.",
    failedBody: "Inténtalo de nuevo o vuelve a los resultados.",
    retry: "Intentar de nuevo",
    handoffTitle: "Próximos pasos aún no disponibles",
    handoffBody: "Los próximos pasos (datos de los pasajeros y pago) aún no están disponibles. Esto es una vista previa.",
    talk: "Hablar con el equipo",
  },
};

export const flightsCopy = { pt, en, es } as const;

export function resolveFlightsCopy(locale: string): FlightsCopy {
  return flightsCopy[locale as keyof typeof flightsCopy] ?? flightsCopy.pt;
}

/** "Total for N passengers" with the singular form for one passenger. */
export function totalForLabel(t: FlightsCopy, n: number): string {
  return n === 1 ? t.results.totalForOne : fill(t.results.totalFor, { n });
}

/** Replace `{token}` placeholders. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_m, key: string) => String(values[key] ?? ""));
}
