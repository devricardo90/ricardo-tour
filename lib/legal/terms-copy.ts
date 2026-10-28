import { PUBLIC_CONTACT } from "@/lib/public-contact";
import { COMPANY_CNPJ } from "@/lib/legal/privacy-copy";

/**
 * RT-81 terms page copy in Portuguese, English and Spanish. It states what the site does and the commercial rules the
 * Owner approved (RT-121 26/10/2026: 30% deposit, 70% balance at the start; RT-81/RT-118 and RT-123 28/10/2026:
 * cancellation base policy, one private tour per day, less than 24 hours on request) and marks everything still undecided
 * as "PENDENTE (Qx)" / "PENDING (Qx)" / "PENDIENTE (Qx)". The Owner approved the cancellation policy as a BASE, subject to
 * legal review before publication: no retention, fee, liability or jurisdiction rule is invented here. It must not be
 * published, linked from the footer or described as legally approved until the legal review and the Owner approve it.
 */
export const TERMS_REVIEW_STATUS = {
  owner_approval: "PENDING",
  legal_review: "PENDING",
  prepared_on: "2026-10-15",
  /** Commercial rules approved by the Owner and written into this draft (still subject to the legal review). */
  commercial_rules_approved_on: "2026-10-28",
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
    draftBanner: "Rascunho com as regras comerciais aprovadas pelo Owner; o que ainda não foi decidido aparece como PENDENTE. A revisão jurídica está PENDENTE: este texto não foi aprovado por advogado e não deve ser publicado.",
    updated: "Rascunho atualizado em 28/10/2026.",
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
        "Enviar uma solicitação pelo site ou falar pelo WhatsApp não é uma reserva: o envio não confirma data nem disponibilidade. A equipe da Ricardo Tour analisa a solicitação e entra em contato pelo e-mail ou telefone informado para combinar os detalhes, inclusive o horário exato de início.",
        "A reserva só fica confirmada quando a Ricardo Tour confirma o recebimento do sinal e envia a confirmação por escrito (WhatsApp ou e-mail).",
        "Os passeios são privativos e a Ricardo Tour realiza um passeio por dia. Para datas com menos de 24 horas de antecedência, a reserva é sob consulta.",
        "PENDENTE (Q7): prazo de resposta às solicitações.",
      ] },
      { id: "operator", title: "Quem opera os passeios", paragraphs: [
        "Os passeios oferecidos no site são operados pela própria Ricardo Tour, com o guia Ricardo. Nos passeios com transporte, o deslocamento é feito no veículo próprio da Ricardo Tour, com até 4 participantes.",
      ] },
      { id: "prices", title: "Preços e pagamento", paragraphs: [
        "Os passeios têm preço fechado por grupo privativo, conforme o número de participantes, em reais (R$).",
        "Para confirmar a reserva, o cliente paga um sinal de 30% do valor total. O saldo de 70% é pago no início do passeio, no encontro com o guia.",
        "O pagamento é feito diretamente à Ricardo Tour, por PIX, cartão na maquininha ou dinheiro. O site não recebe pagamentos online.",
      ] },
      { id: "cancellation", title: "Cancelamento, alteração, não comparecimento e reembolso", paragraphs: [
        "Cancelamento pelo cliente com pelo menos 72 horas de antecedência do início do passeio: sem custo, com devolução dos valores pagos.",
        "Cancelamento com menos de 72 horas: poderá haver retenção somente de valores justificados, proporcionais e permitidos pela lei, informados por escrito antes do pagamento. O sinal e os ingressos não são retidos automaticamente.",
        "Cancelamento pela Ricardo Tour: o cliente escolhe entre o reembolso integral dos valores pagos e uma nova data que aceite.",
        "Chuva que inviabilize o passeio ou fechamento de uma atração essencial: remarcação ou reembolso, conforme os direitos aplicáveis.",
        "Os direitos legais do consumidor, incluindo o direito de arrependimento, são preservados.",
        "PENDENTE (Q8): percentuais e prazos de eventual retenção abaixo de 72 horas, alteração de data ou de participantes, atraso e não comparecimento, a definir com a revisão jurídica.",
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
    draftBanner: "Draft with the commercial rules approved by the Owner; anything not yet decided appears as PENDING. The legal review is PENDING: this text has not been approved by a lawyer and must not be published.",
    updated: "Draft updated on 28 Oct 2026.",
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
        "Sending a request on the website or writing on WhatsApp is not a booking: it does not confirm a date or availability. The Ricardo Tour team reviews the request and contacts you at the e-mail or phone you provided to arrange the details, including the exact start time.",
        "A booking is confirmed only when Ricardo Tour confirms receipt of the deposit and sends the confirmation in writing (WhatsApp or e-mail).",
        "Tours are private and Ricardo Tour runs one tour per day. For dates less than 24 hours ahead, booking is on request.",
        "PENDING (Q7): response time to requests.",
      ] },
      { id: "operator", title: "Who operates the tours", paragraphs: [
        "The tours offered on the website are operated by Ricardo Tour itself, with the guide Ricardo. On tours that include transport, travel is in Ricardo Tour's own vehicle, with up to 4 participants.",
      ] },
      { id: "prices", title: "Prices and payment", paragraphs: [
        "Tours have a closed price per private group, according to the number of participants, in Brazilian reais (R$).",
        "To confirm the booking, the customer pays a deposit of 30% of the total. The 70% balance is paid at the start of the tour, when meeting the guide.",
        "Payment is made directly to Ricardo Tour, by PIX, card on the card machine or cash. The website does not take online payments.",
      ] },
      { id: "cancellation", title: "Cancellation, changes, no-show and refunds", paragraphs: [
        "Cancellation by the customer at least 72 hours before the start of the tour: free of charge, with the amounts paid returned.",
        "Cancellation less than 72 hours before: only amounts that are justified, proportional and allowed by law may be retained, stated in writing before payment. The deposit and tickets are not retained automatically.",
        "Cancellation by Ricardo Tour: the customer chooses between a full refund of the amounts paid and a new date they accept.",
        "Rain that makes the tour unfeasible, or closure of an essential attraction: rescheduling or refund, according to the applicable rights.",
        "The customer's legal rights, including the right of withdrawal, are preserved.",
        "PENDING (Q8): percentages and deadlines of any retention under 72 hours, changes of date or participants, delays and no-show, to be defined with the legal review.",
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
    draftBanner: "Borrador con las reglas comerciales aprobadas por el Owner; lo que aún no se ha decidido aparece como PENDIENTE. La revisión jurídica está PENDIENTE: este texto no ha sido aprobado por un abogado y no debe publicarse.",
    updated: "Borrador actualizado el 28/10/2026.",
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
        "Enviar una solicitud en el sitio o escribir por WhatsApp no es una reserva: no confirma fecha ni disponibilidad. El equipo de Ricardo Tour revisa la solicitud y te contacta por el correo o teléfono indicado para acordar los detalles, incluida la hora exacta de inicio.",
        "La reserva solo queda confirmada cuando Ricardo Tour confirma la recepción de la seña y envía la confirmación por escrito (WhatsApp o correo).",
        "Los paseos son privados y Ricardo Tour realiza un paseo por día. Para fechas con menos de 24 horas de antelación, la reserva es bajo consulta.",
        "PENDIENTE (Q7): plazo de respuesta a las solicitudes.",
      ] },
      { id: "operator", title: "Quién opera los paseos", paragraphs: [
        "Los paseos que ofrece el sitio los opera la propia Ricardo Tour, con el guía Ricardo. En los paseos con transporte, el traslado se hace en el vehículo propio de Ricardo Tour, con hasta 4 participantes.",
      ] },
      { id: "prices", title: "Precios y pago", paragraphs: [
        "Los paseos tienen un precio cerrado por grupo privado, según el número de participantes, en reales brasileños (R$).",
        "Para confirmar la reserva, el cliente paga una seña del 30% del total. El saldo del 70% se paga al inicio del paseo, en el encuentro con el guía.",
        "El pago se hace directamente a Ricardo Tour, por PIX, tarjeta en el datáfono o efectivo. El sitio no recibe pagos en línea.",
      ] },
      { id: "cancellation", title: "Cancelación, cambios, no presentación y reembolsos", paragraphs: [
        "Cancelación por el cliente con al menos 72 horas de antelación al inicio del paseo: sin costo, con devolución de los importes pagados.",
        "Cancelación con menos de 72 horas: solo podrán retenerse importes justificados, proporcionales y permitidos por la ley, informados por escrito antes del pago. La seña y las entradas no se retienen automáticamente.",
        "Cancelación por Ricardo Tour: el cliente elige entre el reembolso íntegro de los importes pagados y una nueva fecha que acepte.",
        "Lluvia que haga inviable el paseo o cierre de una atracción esencial: cambio de fecha o reembolso, según los derechos aplicables.",
        "Se preservan los derechos legales del consumidor, incluido el derecho de desistimiento.",
        "PENDIENTE (Q8): porcentajes y plazos de una eventual retención con menos de 72 horas, cambios de fecha o de participantes, retrasos y no presentación, a definir con la revisión jurídica.",
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
