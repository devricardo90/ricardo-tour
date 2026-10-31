import { PUBLIC_CONTACT } from "@/lib/public-contact";

/**
 * RT-80 privacy page copy: a MINIMAL, FACTUAL draft in Portuguese, English and Spanish, prepared from what the code actually does
 * (see docs/legal/privacy-facts-verified.md for the evidence behind each statement). It is a DRAFT FOR THE OWNER'S APPROVAL:
 * the in-depth legal review is explicitly PENDING and no lawyer has approved this text. It must not be published, linked from the
 * footer or described as legally approved until the Owner approves it. Items the code cannot prove are written as such.
 * 2026-10-15: contact values come from PUBLIC_CONTACT (G8); the login session cookie (G4/Q2) and the Oner flight widget (G1)
 * are disclosed as facts; `pending` lists the Owner/legal decisions still open (Q1–Q12, docs/legal/rt-s9-80-81-legal-pages-preparation.md §7).
 */
export const PRIVACY_REVIEW_STATUS = {
  owner_approval: "PENDING",
  legal_review: "PENDING",
  prepared_on: "2026-10-11",
  updated_on: "2026-10-15",
} as const;

export type PrivacySection = { id: string; title: string; paragraphs: string[] };
export type PrivacyCopy = { title: string; draftBanner: string; updated: string; sections: PrivacySection[]; pendingTitle: string; pending: string[] };

const CONTACT = PUBLIC_CONTACT.email;
const WHATSAPP = PUBLIC_CONTACT.whatsappDisplay;
/** Confirmed by the Owner on 2026-10-15 (Jira RT-80/RT-81). Legal name and Cadastur number are still unconfirmed. */
export const COMPANY_CNPJ = "49.142.341/0001-90";
const CNPJ = COMPANY_CNPJ;

export const PRIVACY_COPY: Record<"pt" | "en" | "es", PrivacyCopy> = {
  pt: {
    title: "Política de Privacidade (rascunho)",
    draftBanner: "Rascunho para aprovação do Owner. A revisão jurídica aprofundada está PENDENTE: este texto ainda não foi aprovado por advogado e não deve ser publicado até a aprovação do Owner.",
    updated: "Rascunho preparado em 11/10/2026 e atualizado em 31/10/2026.",
    sections: [
      { id: "who", title: "Quem somos", paragraphs: [`Esta política descreve como o site da Ricardo Tour trata dados pessoais. Nome comercial: Ricardo Tour. CNPJ: ${CNPJ}. Endereço declarado: Rua Projetada, nº 8, Centro, Itaocara-RJ, CEP 28570-000 (verificação cadastral pendente). Razão social do responsável pelo tratamento: a confirmar antes da publicação. Contato para assuntos de privacidade: ${CONTACT}.`] },
      { id: "data", title: "Quais dados tratamos e para quê", paragraphs: [
        "Formulários de contato e de solicitação de passeio: nome, e-mail, telefone (opcional) e a mensagem que você escrever. Usamos para responder ao seu pedido. Ficam gravados em nosso banco de dados e uma cópia da mensagem é enviada por e-mail à equipe.",
        "Conta e reservas: nome, e-mail e dados da sessão (endereço IP e navegador) quando você usa as áreas de conta ou reserva do site.",
        "Solicitação de reserva de passeio privativo: nome, e-mail, WhatsApp ou telefone, idioma, hotel ou endereço de busca, observações, data pedida e número de participantes. Usamos para conferir a disponibilidade, enviar as instruções do sinal, combinar e realizar o passeio. Ficam no nosso banco de dados e só a equipe administrativa vê; o aviso enviado por e-mail à equipe não leva esses dados de contato. Valores e meios de pagamento recebidos são registrados pela equipe, sem número de cartão. Ao enviar a solicitação, registramos também a versão dos Termos de Uso e desta Política que foi apresentada e o horário do seu aceite.",
        "Estatísticas de uso: eventos como visualização de passeio e clique em reservar, com um identificador aleatório de sessão (guardado apenas enquanto a aba está aberta), o caminho da página e a origem da visita (parâmetros de campanha). Esse identificador não contém dados pessoais.",
        "Registros técnicos: erros do site e medidas de desempenho (caminho da página, sem dados pessoais) ficam nos registros da plataforma de hospedagem.",
      ] },
      { id: "daniela", title: "Daniela, a assistente de inteligência artificial", paragraphs: [
        "Daniela é uma assistente virtual de inteligência artificial, não uma pessoa da equipe. Ela pode errar e não confirma preços, disponibilidade, reservas ou pagamentos. Não envie dados pessoais ou sensíveis (documentos, cartão, senhas) na conversa.",
        "O que você escreve é enviado à OpenAI, nossa fornecedora de IA, apenas para gerar a resposta. A Ricardo Tour não guarda as conversas: o histórico existe somente na sua tela durante a sessão e some ao recarregar a página. A OpenAI pode manter registros técnicos conforme os termos dela (na documentação que consultamos, por até 30 dias para segurança; esse prazo pode mudar e deve ser conferido antes da publicação).",
        "Para limitar abusos, guardamos por poucos minutos ou horas contadores de uso associados a um código irreversível (hash) do seu endereço IP e de um identificador temporário e aleatório da sessão, sem nome nem conteúdo de mensagens.",
        "Registramos, sem o conteúdo das conversas, eventos técnicos (por exemplo: abertura do painel, clique em WhatsApp, erros, limites atingidos e quantidade de tokens usada).",
        `Quando você clica para falar com a equipe, abrimos o WhatsApp (${WHATSAPP}) ou seu e-mail com uma mensagem sugerida que você pode editar; nada é enviado automaticamente e o histórico da conversa não é transmitido. A conversa no WhatsApp passa a seguir as regras do WhatsApp.`,
      ] },
      { id: "providers", title: "Fornecedores envolvidos", paragraphs: [
        "Hospedagem do site (Vercel), banco de dados (Neon), e-mail transacional (Resend), controle de limites de uso (Upstash) e IA (OpenAI). Alguns deles podem tratar dados fora do Brasil; as condições de transferência internacional estão em revisão jurídica.",
        "A busca de voos da página “Planeje sua viagem” (em português) é um serviço da Oner, carregado diretamente dos servidores da Oner no seu navegador. Os dados e cookies que esse serviço usa ainda estão sendo confirmados com a Oner.",
      ] },
      { id: "retention", title: "Por quanto tempo guardamos", paragraphs: [
        "Conversas com a Daniela: não são guardadas por nós.",
        "Contadores de limite de uso: segundos a horas (expiram sozinhos).",
        "Mensagens de contato, contas, reservas e estatísticas: o sistema ainda não tem prazo de exclusão automática; o prazo será definido pelo Owner antes da publicação.",
        "Registros da hospedagem: por período curto definido pela plataforma.",
      ] },
      { id: "storage", title: "Cookies e armazenamento no navegador", paragraphs: [
        "Usamos um cookie de atribuição de campanha (30 dias) com dados de origem da visita e um identificador de sessão guardado apenas na aba aberta. A Daniela não grava nada no seu navegador.",
        "Se você entrar em uma conta do site, um cookie de sessão de login mantém você conectado; ele é necessário para as áreas de conta e reserva funcionarem.",
        "Quando você usa o site em um idioma diferente do idioma do seu navegador, um cookie de idioma (válido até fechar o navegador) guarda essa escolha.",
      ] },
      { id: "rights", title: "Seus direitos e como falar conosco", paragraphs: [
        `Você pode pedir acesso, correção ou exclusão dos seus dados e tirar dúvidas pelo e-mail ${CONTACT}.`,
        `A Ricardo Tour é um agente de tratamento de pequeno porte e, como permite a Resolução CD/ANPD nº 2/2022 (art. 11), não indicou um encarregado; o e-mail ${CONTACT} é o canal de comunicação com os titulares dos dados.`,
      ] },
    ],
    pendingTitle: "Decisões pendentes antes da publicação",
    pending: [
      "Q1: verificação cadastral do endereço do responsável. Endereço declarado pelo Owner em 28/10/2026: Rua Projetada, nº 8, Centro, Itaocara-RJ, CEP 28570-000. O registro público do CNPJ indica o bairro Cidade Nova; o endereço só será dado como verificado após a conferência do Cartão CNPJ atualizado. Razão social (49.142.341 RICARDO DE SOUZA FRANCISCO) e Cadastur (número = CNPJ, válido até 02/04/2027) conferidos em 28/10/2026.",
      "Q3: prazo de guarda de mensagens, pedidos, contas e estatísticas.",
      "Q5: dados e cookies do widget de voos, a confirmar com a Oner.",
      "Q11: revisão jurídica, transferência internacional e necessidade de aviso de cookies.",
    ],
  },
  en: {
    title: "Privacy Policy (draft)",
    draftBanner: "Draft for the Owner's approval. The in-depth legal review is PENDING: this text has not been approved by a lawyer and must not be published until the Owner approves it.",
    updated: "Draft prepared on 11 Oct 2026 and updated on 31 Oct 2026.",
    sections: [
      { id: "who", title: "Who we are", paragraphs: [`This policy describes how the Ricardo Tour website handles personal data. Trade name: Ricardo Tour. CNPJ (Brazilian company number): ${CNPJ}. Declared address: Rua Projetada, nº 8, Centro, Itaocara-RJ, CEP 28570-000, Brazil (registry check pending). Registered legal name of the data controller: to be confirmed before publication. Privacy contact: ${CONTACT}.`] },
      { id: "data", title: "What data we handle and why", paragraphs: [
        "Contact and tour-request forms: name, e-mail, phone (optional) and the message you write. We use them to answer your request. They are stored in our database and a copy of the message is e-mailed to the team.",
        "Account and bookings: name, e-mail and session data (IP address and browser) when you use the account or booking areas.",
        "Private tour booking request: name, e-mail, WhatsApp or phone, language, hotel or pickup address, notes, requested date and number of participants. We use them to check availability, send the deposit instructions, arrange and run the tour. They are kept in our database and only the administrative team sees them; the notice e-mailed to the team does not include these contact details. Amounts and payment methods received are recorded by the team, never a card number. When you send the request, we also record the version of the Terms of Use and of this Policy shown to you and the time of your acceptance.",
        "Usage statistics: events such as viewing a tour or clicking reserve, with a random session identifier (kept only while the tab is open), the page path and the source of the visit (campaign parameters). This identifier contains no personal data.",
        "Technical records: site errors and performance measurements (page path, no personal data) are kept in the hosting platform's logs.",
      ] },
      { id: "daniela", title: "Daniela, the artificial intelligence assistant", paragraphs: [
        "Daniela is a virtual assistant powered by artificial intelligence, not a member of the team. She can make mistakes and does not confirm prices, availability, bookings or payments. Do not send personal or sensitive data (documents, cards, passwords) in the chat.",
        "What you write is sent to OpenAI, our AI provider, only to generate the answer. Ricardo Tour does not store the conversations: the history exists only on your screen during the session and disappears when you reload the page. OpenAI may keep technical records under its own terms (in the documentation we consulted, up to 30 days for security; this period may change and must be checked before publication).",
        "To limit abuse, we keep for minutes or hours usage counters linked to an irreversible code (hash) of your IP address and of a temporary random session identifier, with no name and no message content.",
        "We log, without the content of conversations, technical events (for example: opening the panel, clicking WhatsApp, errors, limits reached and the number of tokens used).",
        `When you choose to talk to the team, we open WhatsApp (${WHATSAPP}) or your e-mail with a suggested message you can edit; nothing is sent automatically and the conversation history is not transmitted. The WhatsApp conversation then follows WhatsApp's own rules.`,
      ] },
      { id: "providers", title: "Providers involved", paragraphs: [
        "Website hosting (Vercel), database (Neon), transactional e-mail (Resend), usage-limit control (Upstash) and AI (OpenAI). Some of them may process data outside Brazil; the international-transfer terms are under legal review.",
        "The flight search on the “Planeje sua viagem” page (in Portuguese) is a service by Oner, loaded directly from Oner's servers into your browser. The data and cookies this service uses are still being confirmed with Oner.",
      ] },
      { id: "retention", title: "How long we keep data", paragraphs: [
        "Conversations with Daniela: not stored by us.",
        "Usage-limit counters: seconds to hours (they expire by themselves).",
        "Contact messages, accounts, bookings and statistics: the system has no automatic deletion period yet; the Owner will define it before publication.",
        "Hosting logs: a short period set by the platform.",
      ] },
      { id: "storage", title: "Cookies and browser storage", paragraphs: [
        "We use a campaign-attribution cookie (30 days) with the source of the visit and a session identifier kept only in the open tab. Daniela does not write anything to your browser.",
        "If you sign in to an account on the site, a login session cookie keeps you signed in; it is needed for the account and booking areas to work.",
        "When you use the site in a language different from your browser's, a language cookie (kept until you close the browser) stores that choice.",
      ] },
      { id: "rights", title: "Your rights and how to contact us", paragraphs: [
        `You can ask for access, correction or deletion of your data, or ask questions, at ${CONTACT}.`,
        `Ricardo Tour is a small-scale processing agent and, as allowed by Brazil's ANPD Resolution CD/ANPD No. 2/2022 (art. 11), has not appointed a data protection officer; ${CONTACT} is the communication channel for data subjects.`,
      ] },
    ],
    pendingTitle: "Decisions pending before publication",
    pending: [
      "Q1: registry check of the controller's address. Address declared by the Owner on 28 Oct 2026: Rua Projetada, nº 8, Centro, Itaocara-RJ, CEP 28570-000. The public CNPJ record shows the Cidade Nova district; the address will only be treated as verified after the updated Cartão CNPJ is checked. Legal name (49.142.341 RICARDO DE SOUZA FRANCISCO) and Cadastur (number = CNPJ, valid until 2 Apr 2027) checked on 28 Oct 2026.",
      "Q3: retention period for messages, requests, accounts and statistics.",
      "Q5: data and cookies of the flight widget, to be confirmed with Oner.",
      "Q11: legal review, international transfer and whether a cookie notice is needed.",
    ],
  },
  es: {
    title: "Política de Privacidad (borrador)",
    draftBanner: "Borrador para aprobación del Owner. La revisión jurídica en profundidad está PENDIENTE: este texto no ha sido aprobado por un abogado y no debe publicarse hasta que el Owner lo apruebe.",
    updated: "Borrador preparado el 11/10/2026 y actualizado el 31/10/2026.",
    sections: [
      { id: "who", title: "Quiénes somos", paragraphs: [`Esta política describe cómo el sitio de Ricardo Tour trata los datos personales. Nombre comercial: Ricardo Tour. CNPJ (registro de empresa en Brasil): ${CNPJ}. Dirección declarada: Rua Projetada, nº 8, Centro, Itaocara-RJ, CEP 28570-000, Brasil (verificación registral pendiente). Razón social del responsable del tratamiento: se confirmará antes de la publicación. Contacto de privacidad: ${CONTACT}.`] },
      { id: "data", title: "Qué datos tratamos y para qué", paragraphs: [
        "Formularios de contacto y de solicitud de paseo: nombre, correo, teléfono (opcional) y el mensaje que escribas. Los usamos para responder a tu solicitud. Se guardan en nuestra base de datos y una copia del mensaje se envía por correo al equipo.",
        "Cuenta y reservas: nombre, correo y datos de sesión (dirección IP y navegador) cuando usas las áreas de cuenta o reserva.",
        "Solicitud de reserva de paseo privado: nombre, correo, WhatsApp o teléfono, idioma, hotel o dirección de recogida, observaciones, fecha solicitada y número de participantes. Los usamos para verificar la disponibilidad, enviar las instrucciones de la seña, acordar y realizar el paseo. Se guardan en nuestra base de datos y solo los ve el equipo administrativo; el aviso enviado por correo al equipo no incluye esos datos de contacto. Los importes y medios de pago recibidos los registra el equipo, nunca un número de tarjeta. Al enviar la solicitud, registramos también la versión de los Términos de Uso y de esta Política que se te mostró y la hora de tu aceptación.",
        "Estadísticas de uso: eventos como ver un paseo o hacer clic en reservar, con un identificador aleatorio de sesión (guardado solo mientras la pestaña está abierta), la ruta de la página y el origen de la visita (parámetros de campaña). Ese identificador no contiene datos personales.",
        "Registros técnicos: errores del sitio y mediciones de rendimiento (ruta de la página, sin datos personales) quedan en los registros de la plataforma de alojamiento.",
      ] },
      { id: "daniela", title: "Daniela, la asistente de inteligencia artificial", paragraphs: [
        "Daniela es una asistente virtual de inteligencia artificial, no una persona del equipo. Puede equivocarse y no confirma precios, disponibilidad, reservas ni pagos. No envíes datos personales ni sensibles (documentos, tarjeta, contraseñas) en el chat.",
        "Lo que escribes se envía a OpenAI, nuestra proveedora de IA, solo para generar la respuesta. Ricardo Tour no guarda las conversaciones: el historial existe solo en tu pantalla durante la sesión y desaparece al recargar la página. OpenAI puede conservar registros técnicos según sus propios términos (en la documentación que consultamos, hasta 30 días por seguridad; ese plazo puede cambiar y debe verificarse antes de la publicación).",
        "Para limitar abusos, guardamos durante minutos u horas contadores de uso asociados a un código irreversible (hash) de tu dirección IP y de un identificador temporal aleatorio de sesión, sin nombre ni contenido de mensajes.",
        "Registramos, sin el contenido de las conversaciones, eventos técnicos (por ejemplo: apertura del panel, clic en WhatsApp, errores, límites alcanzados y cantidad de tokens usados).",
        `Cuando eliges hablar con el equipo, abrimos WhatsApp (${WHATSAPP}) o tu correo con un mensaje sugerido que puedes editar; no se envía nada automáticamente y el historial de la conversación no se transmite. La conversación en WhatsApp pasa a regirse por las reglas de WhatsApp.`,
      ] },
      { id: "providers", title: "Proveedores involucrados", paragraphs: [
        "Alojamiento del sitio (Vercel), base de datos (Neon), correo transaccional (Resend), control de límites de uso (Upstash) e IA (OpenAI). Algunos pueden tratar datos fuera de Brasil; las condiciones de transferencia internacional están en revisión jurídica.",
        "La búsqueda de vuelos de la página “Planeje sua viagem” (en portugués) es un servicio de Oner, cargado directamente desde los servidores de Oner en tu navegador. Los datos y cookies que usa ese servicio aún se están confirmando con Oner.",
      ] },
      { id: "retention", title: "Cuánto tiempo guardamos los datos", paragraphs: [
        "Conversaciones con Daniela: no las guardamos.",
        "Contadores de límite de uso: de segundos a horas (caducan solos).",
        "Mensajes de contacto, cuentas, reservas y estadísticas: el sistema aún no tiene un plazo de eliminación automática; el Owner lo definirá antes de la publicación.",
        "Registros del alojamiento: un período corto fijado por la plataforma.",
      ] },
      { id: "storage", title: "Cookies y almacenamiento en el navegador", paragraphs: [
        "Usamos una cookie de atribución de campaña (30 días) con el origen de la visita y un identificador de sesión guardado solo en la pestaña abierta. Daniela no escribe nada en tu navegador.",
        "Si inicias sesión en una cuenta del sitio, una cookie de sesión mantiene tu sesión abierta; es necesaria para que funcionen las áreas de cuenta y reservas.",
        "Cuando usas el sitio en un idioma distinto al de tu navegador, una cookie de idioma (válida hasta cerrar el navegador) guarda esa elección.",
      ] },
      { id: "rights", title: "Tus derechos y cómo contactarnos", paragraphs: [
        `Puedes pedir acceso, corrección o eliminación de tus datos, o hacer consultas, en ${CONTACT}.`,
        `Ricardo Tour es un agente de tratamiento de pequeño porte y, como permite la Resolución CD/ANPD n.º 2/2022 de Brasil (art. 11), no designó un encargado de datos; ${CONTACT} es el canal de comunicación con los titulares.`,
      ] },
    ],
    pendingTitle: "Decisiones pendientes antes de la publicación",
    pending: [
      "Q1: verificación registral de la dirección del responsable. Dirección declarada por el Owner el 28/10/2026: Rua Projetada, nº 8, Centro, Itaocara-RJ, CEP 28570-000. El registro público del CNPJ indica el barrio Cidade Nova; la dirección solo se considerará verificada tras revisar el Cartão CNPJ actualizado. Razón social (49.142.341 RICARDO DE SOUZA FRANCISCO) y Cadastur (número = CNPJ, válido hasta el 02/04/2027) verificados el 28/10/2026.",
      "Q3: plazo de conservación de mensajes, solicitudes, cuentas y estadísticas.",
      "Q5: datos y cookies del widget de vuelos, a confirmar con Oner.",
      "Q11: revisión jurídica, transferencia internacional y necesidad de aviso de cookies.",
    ],
  },
};

/**
 * Owner 31/10/2026 (Q4 decided): while Daniela is disabled the policy does not describe her processing as active. The
 * published text is this variant: no Daniela section, no AI provider, no Daniela retention or browser-storage line.
 * Each removal must match the source text exactly once (tested), so a later copy change cannot silently skip one.
 */
const DANIELA_ONLY: Record<"pt" | "en" | "es", { provider: string; retention: string; storage: string }> = {
  pt: { provider: " e IA (OpenAI)", retention: "Conversas com a Daniela: não são guardadas por nós.", storage: " A Daniela não grava nada no seu navegador." },
  en: { provider: " and AI (OpenAI)", retention: "Conversations with Daniela: not stored by us.", storage: " Daniela does not write anything to your browser." },
  es: { provider: " e IA (OpenAI)", retention: "Conversaciones con Daniela: no las guardamos.", storage: " Daniela no escribe nada en tu navegador." },
};

export function privacyCopyFor(locale: string, options: { conciergeEnabled: boolean }): PrivacyCopy {
  const lang = locale === "en" || locale === "es" ? locale : "pt";
  const copy = PRIVACY_COPY[lang];
  if (options.conciergeEnabled) return copy;
  const cut = DANIELA_ONLY[lang];
  const sections = copy.sections
    .filter((section) => section.id !== "daniela")
    .map((section) => ({
      ...section,
      paragraphs: section.paragraphs.filter((p) => p !== cut.retention).map((p) => p.replace(cut.provider, "").replace(cut.storage, "")),
    }));
  return { ...copy, sections };
}
