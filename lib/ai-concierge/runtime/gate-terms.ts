/**
 * English and Spanish vocabulary for the deterministic gates (V1 is Portuguese, English and Spanish). Every pattern runs on
 * NORMALIZED text (lowercase, accents removed), exactly like the Portuguese ones in gates.ts, and is OR-ed with them: a gate
 * fires the same way whatever language the visitor writes in. The bias is deliberate: when in doubt a message goes to the
 * team (WhatsApp) instead of being answered by the model.
 */
export const EXTRA = {
  INJECTION: [
    /\b(?:ignore|disregard|forget|override)\b.{0,40}\b(?:rules?|instructions?|guidelines|polic(?:y|ies)|sources?)\b/,
    /\b(?:ignora|ignore|olvida|omite|desestima)\b.{0,40}\b(?:reglas?|instrucciones|politicas?|fuentes?|base)\b/,
    /\b(?:show|reveal|print|repeat|display|tell me)\b.{0,30}\b(?:your|system|hidden|internal) ?(?:system )?(?:prompt|instructions|rules|configuration|polic(?:y|ies))\b/,
    /\b(?:muestra|revela|repite|dime|imprime)\b.{0,30}\b(?:tu|tus|sistema|oculto|oculta|interno|interna) ?(?:prompt|instrucciones|reglas|configuracion|politica)\b/,
    /\bpretend (?:to be|you(?:'re| are))\b|\byou (?:must |should |will |are to )?act as\b|\bdeveloper mode\b|\bfinge que\b|\bactua como\b|\bmodo desarrollador\b|\bbypass\b/,
    /\boutside (?:the )?(?:knowledge|sources?)\b|\bwithout (?:checking )?(?:the )?sources?\b|\bfuera de la base\b|\bsin (?:consultar )?(?:las? )?fuentes?\b/,
    /\bignore (?:everything|all) (?:above|before|previous)\b|\bolvida todo (?:lo anterior|lo dicho)\b|\bfrom now on,? you (?:will|are|must)\b|\bwithout (?:any )?restrictions\b|\bsin restricciones\b/,
  ],

  FLIGHT: /\b(?:flights?|airfare|airlines?|plane tickets?|air tickets?|vuelos?|pasajes?|aerolineas?|boletos? aereos?|billetes? de avion)\b/,
  HOTEL: /\b(?:hotels?|hostels?|accommodation|lodging|rooms?|inns?|alojamiento|hospedaje|habitacion|habitaciones|hostal|hostales|posada)\b/,
  DYNAMIC_CUE: /\b(?:today|tomorrow|tonight|week|weekend|month|date|dates|cheap|available|availability|book|buy|want|have|find|search|looking|hoy|manana|semana|fin de semana|mes|fecha|fechas|barato|disponible|reservar|comprar|quiero|tiene|tienen|buscar|busco)\b/,
  PRICE: /\b(?:price|prices|pricing|how much (?:is|are|does|do|will|for)|cost|costs|costing|fee|fees|rates?|fares?|discounts?|cheap|cheaper|cheapest|quote|quotation|budget|promotion|promo|precio|precios|cuanto (?:cuesta|cuestan|cobran|cobras|sale|salen|vale|valen|es)|costo|costos|tarifas?|descuentos?|barato|baratos|cotizacion|presupuesto|promocion|usd|eur|dolares|dollars|euros)\b|[$€]/,
  AVAILABILITY: /\b(?:(?:are there|is there|do you have|got|any) .{0,20}\b(?:spots?|seats?|slots?|availability|openings?|places? (?:left|available))|(?:spots?|seats?|slots?) (?:left|available|open)|available (?:for|on|at|this|next|today|tomorrow|tonight|now|from)|availability|room for you|still room|sold out|fully booked|booked out|hay .{0,20}\b(?:cupos?|plazas?|entradas?|disponibilidad)|(?:cupos?|plazas?) (?:disponibles?|libres?)|disponibles? (?:para|el|hoy|manana|esta|este|en fecha)|disponibilidad|agotad[oa]s?|lleno)\b/,
  BOOKING_STATUS:
    /\b(?:(?:is|was|has) (?:my|the|our) (?:booking|reservation|order|purchase|tickets?) (?:been )?(?:confirmed|approved|completed|made|done)|(?:status|confirmation) (?:of|for) (?:my|the|our) (?:booking|reservation|order|purchase)|confirm (?:my|the|our) (?:booking|reservation)|(?:mi|la|nuestra) (?:reserva|compra|orden|entrada) (?:esta|fue|ya esta|ya fue|sigue) (?:confirmad[ao]|aprobad[ao]|hech[ao])|estado de (?:mi|la|nuestra) (?:reserva|compra|orden)|confirm(?:a|en|ar) (?:mi|la) reserva)\b/,
  PAYMENT_STATUS:
    /\b(?:(?:did|has|was|is) (?:my|the|our) payment (?:go through|been (?:received|approved|confirmed|processed)|(?:received|approved|confirmed|processed|successful))|my payment|i (?:already )?paid|paguei|payment (?:status|confirmation|received|approved|confirmed)|charged|(?:mi|el) pago|ya pague|pague|se (?:aprobo|confirmo|recibio|proceso) (?:mi |el )?pago|cobro|cargo en mi tarjeta)\b/,
  REFUND: /\b(?:refunds?|money back|chargeback|cancel (?:my|the|our) (?:booking|reservation|purchase|order)|reembolso|devolucion del (?:dinero|importe|pago)|cancelar (?:mi|la) (?:reserva|compra))\b/,
  OPERATIONAL:
    /\b(?:(?:will|is) (?:the|my|this) (?:tour|trip) (?:happen|run|operate|take place|be cancell?ed)|(?:will it|is it going to) rain|confirm (?:the )?(?:time|schedule|meeting point|pickup|departure)|tour (?:today|tomorrow)|(?:va a|vamos a|hay) (?:llover|lluvia)|confirm(?:a|ar) (?:el )?(?:horario|punto de encuentro|salida|recogida)|paseo (?:de |para )?(?:hoy|manana))\b/,
  EMERGENCY: [
    /\bhelp!|\b(?:emergency|i(?:'m| am) (?:being (?:robbed|mugged|attacked|followed|threatened)|in danger|having a (?:heart attack|seizure)|bleeding)|i(?:'ve| have) been (?:robbed|mugged|attacked|assaulted)|i (?:was|got) (?:robbed|mugged|attacked|assaulted)|i(?:'m| am) (?:hurt|injured|bleeding|seriously ill)|i feel (?:sick|unwell|faint|dizzy)|someone (?:robbed|attacked|mugged) me|i need (?:a |an )?(?:doctor|ambulance|police|medical help)|call (?:the )?(?:police|ambulance|a doctor)|heart attack|overdose|drowning|life[- ]threatening)\b/,
    /\b(?:auxilio|emergencia|me (?:estan) (?:asaltando|robando|atacando|siguiendo|amenazando)|estoy en peligro|me (?:asaltaron|robaron|atacaron)|me siento mal|estoy (?:herid[oa]|enferm[oa]|sangrando|mareado)|necesito (?:un |una )?(?:medico|ambulancia|policia|ayuda medica)|llamen? a (?:la )?(?:policia|ambulancia)|infarto|ahogando|ahogandose|sobredosis)\b/,
  ],
  ACTION_REQUEST:
    /\b(?:book (?:it|this|that|the tour|me|for me)|reserve (?:it|this|that|for me|a spot)|(?:i|we) (?:want|wanna|need|have) to (?:book|buy|pay|reserve|cancel)|(?:i'?d|we'?d|i would|we would) like to (?:book|reserve|buy|pay|cancel)|how (?:can|do|could) (?:i|we) (?:book|reserve|buy|pay)|how to (?:book|reserve|buy|pay)|me gustaria (?:reservar|comprar|pagar|cancelar)|como (?:puedo|podemos|se) (?:reservar|comprar|pagar)|gostaria de (?:reservar|comprar|pagar|cancelar|fechar)|como (?:posso|faco para|se) (?:reservar|comprar|pagar)|como reservo|(?:i'?ll|i will|let'?s) (?:book|buy|pay)|can you (?:book|reserve|buy|pay)|send me (?:the )?(?:payment link|pix|invoice)|pay now|checkout|(?:make|do) (?:a |the )?(?:booking|reservation)|quiero (?:reservar|comprar|pagar|cancelar)|quisiera (?:reservar|comprar|pagar)|(?:quiero |quisiera |puedo |podemos )?hacer (?:una |la |mi )?reserva|reserva(?:me|rme)? (?:para mi|esto|el paseo)|haz(?:me)? (?:la |mi )?reserva|puedes (?:reservar|comprar|pagar)|enviame (?:el )?(?:link de pago|pix|factura)|pagar ahora)\b/,
  OUT_OF_SCOPE_ADVICE:
    /\b(?:visas?|passports?|immigration|customs|vaccin\w*|medicat\w*|medicine|symptoms?|disease\w*|lawyers?|attorney|lawsuit|consumer rights|health insurance|travel insurance|allerg\w*|pasaportes?|inmigracion|vacunas?|medicamentos?|sintomas?|enfermedad\w*|abogad[oa]s?|seguro medico|alergia\w*)\b/,
  SAFETY_SENSITIVE: /\b(?:safe|safety|safely|dangerous|danger|crime|robbery|theft|mugging|shooting|stray bullets?|risky|risk|violence|violent|seguro|segura|seguros|seguras|seguridad|peligro|peligroso|peligrosa|crimen|robo|riesgo|balacera|violencia)\b/,
  INTERNAL_INFO:
    /\b(?:api ?key|access token|system password|environment variables?|vector ?store|database|source code|(?:which|what) (?:model|llm|ai) (?:are you|do you) (?:use|using|running)|(?:what|which) sources (?:do you )?(?:use|have)|list of sources|que modelo (?:usas|utilizas|eres)|base de datos|codigo fuente|variables? de entorno|conversaciones? de otros)\b/,
  ABUSIVE: /\b(?:idiot|stupid|moron|useless|asshole|bastard|fuck|fucking|shit|bullshit|dumbass|jerk|estupid[oa]|imbecil|mierda|carajo|puta|pendejo|cabron|inutil|gilipollas|basura)\b/,
  COMPETITOR: /\b(?:competitors?|better than (?:the |a )?\w+|compare (?:with|to|yourself with)|competencia|mejor que (?:la |el )?\w+|comparar con)\b/,
  EXPLICIT_REQUEST:
    /\b(?:(?:talk|speak|chat|connect|get in touch) (?:to|with) (?:a |an |the )?(?:person|human|someone|agent|team|representative|staff|consultant|real person)|(?:human|live) (?:agent|support|assistance)|(?:i )?(?:want|need|would like) (?:a |an |to talk to a )?(?:human|agent|person|representative)|(?:your|the) (?:whatsapp|phone number|contact)|contact (?:you|the team|someone)|whatsapp|hablar con (?:una |un |la )?(?:persona|humano|humana|alguien|agente|equipo|asesor\w*)|atencion humana|(?:tu|su|el) (?:whatsapp|telefono|contacto)|contactar (?:al equipo|a alguien)|quiero (?:un |una )?(?:agente|humano|persona|asesor\w*))\b/,
  UNSUPPORTED_REQUEST:
    /\b(?:custom (?:itinerary|tour|trip|package)|tailor[- ]made|private group|group of \d+|large group|big group|excursion group|quote|quotation|corporate (?:event|trip)|wedding|special (?:request|needs?)|negotiat\w*|group discount|itinerario personalizado|paquete personalizado|a medida|grupo de \d+|grupo grande|cotizacion|evento corporativo|boda|pedido especial|necesidades especiales|negociar|descuento (?:por|para) grupo)\b/,
  COMPLAINT:
    /\b(?:complain\w*|complaint|terrible|awful|horrible|unacceptable|ridiculous|scam|cheated|ripped off|disappointed|disappointing|dissatisfied|sue|lawsuit|queja|reclamo|reclamacion|inaceptable|estafa|enganad[oa]|decepcionad[oa]|insatisfech[oa]|demandar|demanda)\b/,
  URGENT_OPERATION:
    /\b(?:(?:the )?(?:guide|driver|van|transport) (?:has not|hasn't|did not|didn't|still hasn't) (?:arrived|shown up|come)|(?:i'm|i am|we are|we're) (?:waiting|lost|late|at the (?:spot|meeting point))|(?:i|we) (?:missed|lost) (?:the |my |our )?(?:tour|flight|guide|van|bus)|(?:running|going to be) late|(?:el )?(?:guia|chofer|conductor|van|transporte) no (?:llego|ha llegado|aparecio)|estoy (?:esperando|perdid[oa]|atrasad[oa]|tarde|en el punto)|(?:perdi|perdimos) (?:el |mi |nuestro )?(?:paseo|vuelo|guia|bus))\b/,
  IDENTITY:
    /\b(?:are you (?:a |an )?(?:real |actual )?(?:person|human|robot|bot|ai|machine|chatbot)|am i (?:talking|speaking|chatting) (?:to|with) (?:a |an )?(?:real )?(?:person|human|robot|bot|ai|machine|agent|chatbot)|are you (?:part of|from|on) the team|do you work (?:for|at) ricardo tour|what(?:'s| is) your name|who are you|what should i call you|is (?:there )?(?:anyone|somebody) (?:there|real)|eres (?:una |un )?(?:persona|humana|humano|robot|bot|ia|maquina|real)|(?:estoy|estamos) (?:hablando|chateando) con (?:una |un )?(?:persona|humano|humana|robot|bot|ia|maquina|agente)|eres (?:del|parte del) equipo|trabajas (?:en|para) ricardo tour|como te llamas|cual es tu nombre|quien eres|hay alguien (?:ahi|real))\b/,
  /** A request for recommendations or "what can I do": answered by the deterministic catalog recommendation, never by the model. */
  RECOMMEND: [
    /\b(?:recomend\w*|sugest\w*|sugir\w*|indic\w* (?:um|uns|alguns|algum)|o que (?:fazer|visitar|conhecer|ver)|primeira vez|(?:quais|que|qual|quero|queria|gostaria de) (?:passeios?|tours?|experiencias?|atracoes|programas?)|passeios? (?:classicos?|principais|imperdiveis|bons?)|melhores? (?:passeios?|tours?)|quero (?:conhecer|visitar|ver|fazer)|dicas?)\b/,
    /\b(?:recommend\w*|suggest\w*|what (?:should|can|could|to) (?:i |we )?(?:do|see|visit|explore)|what to (?:do|see|visit)|first[- ]time|first time|(?:which|what|any) (?:tours?|experiences?|activities|attractions)|best (?:tours?|things|experiences?|places)|(?:i |we )?(?:want|would like|'d like) to (?:see|visit|explore|know)|tips?|tell me about (?:the )?(?:tours?|experiences?))\b/,
    /\b(?:recomiend\w*|suger\w*|sugier\w*|que (?:hacer|visitar|conocer|ver)|primera vez|(?:que|cuales|cual|algun|algunos) (?:paseos?|tours?|experiencias?|atracciones|actividades)|mejores? (?:paseos?|tours?|experiencias?)|quiero (?:conocer|visitar|ver|hacer)|quisiera (?:conocer|visitar|ver|hacer)|consejos?)\b/,
  ],
  /** A concrete question about how a tour works (time, duration, place, how it works): answered from the sources, not by recommendation cards. */
  DETAIL_QUESTION:
    /\b(?:como funciona|quanto tempo|a que horas?|que horas|onde (?:fica|sai|e)|qual (?:e )?(?:o )?(?:horario|duracao|ponto)|what time|how long|where (?:is|does|do)|how does|how do|which time|how (?:it )?works|a que hora|cuanto dura|donde (?:sale|queda|es)|como funciona|que horario)\b/,
  /** What is included, payment methods, fees and cancellation: commercial conditions only the team can confirm (Owner: never invent them). */
  COMMERCIAL_TERMS: [
    /\b(?:o que (?:esta|vem|ta) inclu\w*|inclui\w*|incluso\w*|inclusao|ingressos? inclus\w*|entradas? inclu\w*|tudo incluido|formas? de pagamento|pagamento parcelado|parcel\w*|politica de cancelamento|cancelamento gratuito|taxas? (?:extras?|adicionais?)|sem taxas|aceitam (?:cartao|pix|dinheiro)|cartao de credito|pix)\b/,
    /\b(?:what(?:'s| is) included|included|includes?|all[- ]inclusive|payment (?:methods?|options|plans?)|pay in installments|installments|cancell?ation (?:policy|fees?)|free cancell?ation|extra (?:fees?|charges?)|hidden (?:fees?|charges?)|(?:do you|can i) (?:accept|pay (?:by|with)) (?:card|credit card|pix|cash|paypal)|credit card)\b/,
    /\b(?:que (?:esta|viene) incluid[oa]|incluid[oa]s?|incluye\w*|incluyen|todo incluido|formas? de pago|metodos? de pago|pago en cuotas|cuotas|politica de cancelacion|cancelacion gratuita|tarifas? (?:extra|adicionales?)|sin cargos|aceptan (?:tarjeta|pix|efectivo)|tarjeta de credito)\b/,
  ],
} as const;

/** OR of several patterns into one (all patterns here are flag-less and stateless). */
export const union = (...patterns: RegExp[]) => new RegExp(patterns.map((pattern) => pattern.source).join("|"));
