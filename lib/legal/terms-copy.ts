import { PUBLIC_CONTACT } from "@/lib/public-contact";
import { COMPANY_CNPJ } from "@/lib/legal/privacy-copy";

/**
 * RT-81 terms page copy: a FACTUAL SKELETON in Portuguese, English and Spanish. It states only what the site does today
 * (evidence: docs/legal/rt-s9-80-81-legal-pages-preparation.md §3 and §7) and marks every commercial or legal rule that the
 * Owner/legal has not decided as "PENDENTE (Qx)" / "PENDING (Qx)" / "PENDIENTE (Qx)". No cancellation, refund, payment,
 * liability or jurisdiction rule is written here: those come only from the Owner/legal (RT-81: "no invented legal text").
 * It must not be published, linked from the footer or described as approved until the Owner approves it.
 */
export const TERMS_REVIEW_STATUS = {
  owner_approval: "PENDING",
  legal_review: "PENDING",
  prepared_on: "2026-10-15",
} as const;

export type TermsSection = { id: string; title: string; paragraphs: string[] };
export type TermsCopy = { title: string; draftBanner: string; updated: string; sections: TermsSection[] };

/** Every placeholder starts with one of these markers followed by the questionnaire code, e.g. "PENDENTE (Q8):". */
export const TERMS_PENDING_MARKER = /^(?:PENDENTE|PENDING|PENDIENTE) \(Q\d{1,2}(?:, Q\d{1,2})*\):/;

const CONTACT = PUBLIC_CONTACT.email;
const WHATSAPP = PUBLIC_CONTACT.whatsappDisplay;

export const TERMS_COPY: Record<"pt" | "en" | "es", TermsCopy> = {
  pt: {
    title: "Termos de Uso (rascunho)",
    draftBanner: "Esqueleto factual para aprovação do Owner. As regras comerciais e jurídicas ainda não foram decididas e aparecem como PENDENTE. A revisão jurídica está PENDENTE: este texto não foi aprovado por advogado e não deve ser publicado.",
    updated: "Rascunho preparado em 15/10/2026.",
    sections: [
      { id: "who", title: "Quem somos", paragraphs: [
        `Este site (www.ricardotour.com) é da Ricardo Tour, CNPJ ${COMPANY_CNPJ}. Contato: ${CONTACT} ou WhatsApp ${WHATSAPP}.`,
        "PENDENTE (Q1): razão social, endereço cadastral e número do Cadastur.",
      ] },
      { id: "service", title: "O que o site oferece", paragraphs: [
        "O site apresenta passeios no Rio de Janeiro, recebe solicitações de passeio e mensagens de contato e oferece atendimento pelo WhatsApp.",
        "Na versão em português, a página “Planeje sua viagem” traz uma busca de voos fornecida pela Oner, uma empresa terceira.",
      ] },
      { id: "request", title: "Como funciona uma solicitação de passeio", paragraphs: [
        "Enviar uma solicitação pelo site ou falar pelo WhatsApp não é uma reserva: o envio não confirma data nem disponibilidade. A equipe da Ricardo Tour analisa a solicitação e entra em contato pelo e-mail ou telefone informado para combinar os detalhes.",
        "PENDENTE (Q7): o que conta como reserva confirmada, por qual canal ela é confirmada e se haverá prazo de resposta.",
      ] },
      { id: "operator", title: "Quem opera os passeios", paragraphs: [
        "PENDENTE (Q6): para cada passeio, se é operado pela Ricardo Tour ou por um parceiro identificado.",
      ] },
      { id: "prices", title: "Preços e pagamento", paragraphs: [
        "Os preços exibidos nas páginas dos passeios são valores por pessoa, em reais (R$).",
        "O site não recebe pagamentos online.",
        "PENDENTE (Q9): quando, como e a quem o cliente paga.",
      ] },
      { id: "cancellation", title: "Cancelamento, alteração, não comparecimento e reembolso", paragraphs: [
        "PENDENTE (Q8): regras da Ricardo Tour para cancelamento pelo cliente, alteração de data ou participantes, não comparecimento, cancelamento pela empresa e reembolso.",
      ] },
      { id: "rules", title: "Regras dos passeios", paragraphs: [
        "PENDENTE (Q10): o que acontece em caso de chuva ou mau tempo, idade mínima e participação de crianças, e condição física exigida.",
      ] },
      { id: "third-party", title: "Serviços de terceiros", paragraphs: [
        "A busca de voos (Oner) e o WhatsApp são serviços de outras empresas.",
        "PENDENTE (Q11): redação sobre os termos desses serviços e a responsabilidade de cada parte.",
      ] },
      { id: "legal", title: "Responsabilidade, uso do site e lei aplicável", paragraphs: [
        "PENDENTE (Q11): limites de responsabilidade, regras de uso do site e de propriedade intelectual, lei aplicável, foro e canal de reclamação, a definir com a revisão jurídica.",
      ] },
      { id: "privacy", title: "Privacidade", paragraphs: [
        "O tratamento de dados pessoais é descrito na Política de Privacidade da Ricardo Tour, também em rascunho.",
      ] },
    ],
  },
  en: {
    title: "Terms of Use (draft)",
    draftBanner: "Factual skeleton for the Owner's approval. Commercial and legal rules have not been decided yet and appear as PENDING. The legal review is PENDING: this text has not been approved by a lawyer and must not be published.",
    updated: "Draft prepared on 15 Oct 2026.",
    sections: [
      { id: "who", title: "Who we are", paragraphs: [
        `This website (www.ricardotour.com) belongs to Ricardo Tour, CNPJ (Brazilian company number) ${COMPANY_CNPJ}. Contact: ${CONTACT} or WhatsApp ${WHATSAPP}.`,
        "PENDING (Q1): registered legal name, registered address and Cadastur number.",
      ] },
      { id: "service", title: "What the website offers", paragraphs: [
        "The website presents tours in Rio de Janeiro, receives tour requests and contact messages, and offers support over WhatsApp.",
        "In the Portuguese version, the “Planeje sua viagem” page includes a flight search provided by Oner, a third-party company.",
      ] },
      { id: "request", title: "How a tour request works", paragraphs: [
        "Sending a request on the website or writing on WhatsApp is not a booking: it does not confirm a date or availability. The Ricardo Tour team reviews the request and contacts you at the e-mail or phone you provided to arrange the details.",
        "PENDING (Q7): what counts as a confirmed booking, through which channel it is confirmed, and whether a response time will be promised.",
      ] },
      { id: "operator", title: "Who operates the tours", paragraphs: [
        "PENDING (Q6): for each tour, whether it is operated by Ricardo Tour or by an identified partner.",
      ] },
      { id: "prices", title: "Prices and payment", paragraphs: [
        "Prices shown on the tour pages are per person, in Brazilian reais (R$).",
        "The website does not take online payments.",
        "PENDING (Q9): when, how and to whom the customer pays.",
      ] },
      { id: "cancellation", title: "Cancellation, changes, no-show and refunds", paragraphs: [
        "PENDING (Q8): Ricardo Tour's rules for cancellation by the customer, changes of date or participants, no-show, cancellation by the company, and refunds.",
      ] },
      { id: "rules", title: "Tour rules", paragraphs: [
        "PENDING (Q10): what happens in rain or bad weather, minimum age and children's participation, and the physical condition required.",
      ] },
      { id: "third-party", title: "Third-party services", paragraphs: [
        "The flight search (Oner) and WhatsApp are services of other companies.",
        "PENDING (Q11): wording on those services' terms and each party's responsibility.",
      ] },
      { id: "legal", title: "Liability, use of the website and governing law", paragraphs: [
        "PENDING (Q11): limits of liability, rules for using the website and intellectual property, governing law, venue and complaint channel, to be defined with the legal review.",
      ] },
      { id: "privacy", title: "Privacy", paragraphs: [
        "How personal data is handled is described in Ricardo Tour's Privacy Policy, also in draft.",
      ] },
    ],
  },
  es: {
    title: "Términos de Uso (borrador)",
    draftBanner: "Esqueleto factual para aprobación del Owner. Las reglas comerciales y jurídicas aún no se han decidido y aparecen como PENDIENTE. La revisión jurídica está PENDIENTE: este texto no ha sido aprobado por un abogado y no debe publicarse.",
    updated: "Borrador preparado el 15/10/2026.",
    sections: [
      { id: "who", title: "Quiénes somos", paragraphs: [
        `Este sitio (www.ricardotour.com) pertenece a Ricardo Tour, CNPJ (registro de empresa en Brasil) ${COMPANY_CNPJ}. Contacto: ${CONTACT} o WhatsApp ${WHATSAPP}.`,
        "PENDIENTE (Q1): razón social, dirección registrada y número de Cadastur.",
      ] },
      { id: "service", title: "Qué ofrece el sitio", paragraphs: [
        "El sitio presenta paseos en Río de Janeiro, recibe solicitudes de paseo y mensajes de contacto, y ofrece atención por WhatsApp.",
        "En la versión en portugués, la página “Planeje sua viagem” incluye una búsqueda de vuelos proporcionada por Oner, una empresa tercera.",
      ] },
      { id: "request", title: "Cómo funciona una solicitud de paseo", paragraphs: [
        "Enviar una solicitud en el sitio o escribir por WhatsApp no es una reserva: no confirma fecha ni disponibilidad. El equipo de Ricardo Tour revisa la solicitud y te contacta por el correo o teléfono indicado para acordar los detalles.",
        "PENDIENTE (Q7): qué cuenta como reserva confirmada, por qué canal se confirma y si se prometerá un plazo de respuesta.",
      ] },
      { id: "operator", title: "Quién opera los paseos", paragraphs: [
        "PENDIENTE (Q6): para cada paseo, si lo opera Ricardo Tour o un socio identificado.",
      ] },
      { id: "prices", title: "Precios y pago", paragraphs: [
        "Los precios que aparecen en las páginas de los paseos son por persona, en reales brasileños (R$).",
        "El sitio no recibe pagos en línea.",
        "PENDIENTE (Q9): cuándo, cómo y a quién paga el cliente.",
      ] },
      { id: "cancellation", title: "Cancelación, cambios, no presentación y reembolsos", paragraphs: [
        "PENDIENTE (Q8): reglas de Ricardo Tour para la cancelación por el cliente, cambios de fecha o participantes, no presentación, cancelación por la empresa y reembolsos.",
      ] },
      { id: "rules", title: "Reglas de los paseos", paragraphs: [
        "PENDIENTE (Q10): qué ocurre con lluvia o mal tiempo, edad mínima y participación de niños, y condición física requerida.",
      ] },
      { id: "third-party", title: "Servicios de terceros", paragraphs: [
        "La búsqueda de vuelos (Oner) y WhatsApp son servicios de otras empresas.",
        "PENDIENTE (Q11): redacción sobre los términos de esos servicios y la responsabilidad de cada parte.",
      ] },
      { id: "legal", title: "Responsabilidad, uso del sitio y ley aplicable", paragraphs: [
        "PENDIENTE (Q11): límites de responsabilidad, reglas de uso del sitio y de propiedad intelectual, ley aplicable, jurisdicción y canal de reclamaciones, a definir con la revisión jurídica.",
      ] },
      { id: "privacy", title: "Privacidad", paragraphs: [
        "El tratamiento de los datos personales se describe en la Política de Privacidad de Ricardo Tour, también en borrador.",
      ] },
    ],
  },
};
