import { PUBLIC_CONTACT } from "@/lib/public-contact";
import { COMPANY_CNPJ } from "@/lib/legal/privacy-copy";

/**
 * RT-81 terms page copy in Portuguese, English and Spanish. It states what the site does and the commercial rules the
 * Owner approved (RT-121 26/10/2026: 30% deposit, 70% balance at the start; RT-81/RT-118 and RT-123 28/10/2026:
 * cancellation base policy, one private tour per day, less than 24 hours on request) and marks everything still undecided
 * as "PENDENTE (Qx)" / "PENDING (Qx)" / "PENDIENTE (Qx)". Owner 01/11/2026: commercial rules P1-P6 approved (response target,
 * one free new date, delay tolerance, cancellation and the right of withdrawal, refunds, physical condition and
 * accessibility), also subject to the legal review. The Owner approved the cancellation policy as a BASE, subject to
 * legal review before publication: no retention, fee, liability or jurisdiction rule is invented here. It must not be
 * published, linked from the footer or described as legally approved until the legal review and the Owner approve it.
 */
export const TERMS_REVIEW_STATUS = {
  owner_approval: "PENDING",
  legal_review: "PENDING",
  prepared_on: "2026-10-15",
  /** Commercial rules approved by the Owner and written into this draft (still subject to the legal review). */
  commercial_rules_approved_on: "2026-10-28",
  /** Owner decision P1-P6 (response target, new date, delay tolerance, cancellation, refunds, accessibility). */
  commercial_rules_p1_p6_approved_on: "2026-11-01",
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
    updated: "Rascunho atualizado em 01/11/2026.",
    sections: [
      { id: "who", title: "Quem somos", paragraphs: [
        `Este site (www.ricardotour.com) é da Ricardo Tour, CNPJ ${COMPANY_CNPJ}, com endereço declarado na Rua Projetada, nº 8, Centro, Itaocara-RJ, CEP 28570-000. Contato: ${CONTACT} ou WhatsApp ${WHATSAPP}.`,
        "PENDENTE (Q1): verificação cadastral do endereço. O endereço acima foi declarado pelo Owner em 28/10/2026; o registro público do CNPJ indica o bairro Cidade Nova, e o endereço só será dado como verificado após a conferência do comprovante de inscrição atualizado (Cartão CNPJ). Razão social e Cadastur (número igual ao CNPJ) já conferidos.",
      ] },
      { id: "service", title: "O que o site oferece", paragraphs: [
        "O site apresenta passeios no Rio de Janeiro, recebe solicitações de passeio e mensagens de contato e oferece atendimento pelo WhatsApp.",
        "Na versão em português, a página “Planeje sua viagem” traz uma busca de voos fornecida pela Oner, uma empresa terceira.",
      ] },
      { id: "request", title: "Como funciona uma solicitação de passeio", paragraphs: [
        "Enviar uma solicitação pelo site ou falar pelo WhatsApp não é uma reserva: o envio não confirma data nem disponibilidade. A equipe da Ricardo Tour analisa a solicitação e entra em contato pelo e-mail ou telefone informado para combinar os detalhes, inclusive o horário exato de início.",
        "A reserva só fica confirmada quando a Ricardo Tour confirma o recebimento do sinal e envia a confirmação por escrito (WhatsApp ou e-mail).",
        "Os passeios são privativos e a Ricardo Tour realiza um passeio por dia. Para datas com menos de 24 horas de antecedência, a reserva é sob consulta.",
        "Para enviar uma solicitação pelo formulário do site, você precisa aceitar estes Termos de Uso. Registramos, junto com a solicitação, a versão dos Termos e da Política de Privacidade apresentada e o horário do aceite.",
        "Prazo de resposta: a meta da Ricardo Tour é responder às consultas comerciais em até 1 dia útil. É uma meta de atendimento, não um prazo absoluto, e não reduz os prazos previstos na lei, inclusive os do Decreto nº 7.962/2013 (confirmação imediata do recebimento e manifestação em até 5 dias sobre as demandas feitas por meio eletrônico).",
      ] },
      { id: "operator", title: "Quem opera os passeios", paragraphs: [
        "Os passeios oferecidos no site são operados pela própria Ricardo Tour, com o guia Ricardo. Nos passeios com transporte, o deslocamento é feito em veículo próprio, conduzido pelo guia, com até 4 participantes.",
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
        "O direito de arrependimento previsto no art. 49 do Código de Defesa do Consumidor é preservado, quando aplicável, independentemente das regras de cancelamento acima, assim como os demais direitos legais do consumidor.",
        "Nova data a pedido do cliente: o pedido é feito pelo WhatsApp ou por e-mail; a nova data depende de disponibilidade (a Ricardo Tour realiza um passeio por dia) e só vale depois de confirmada por escrito.",
        "Uma remarcação pedida com pelo menos 72 horas de antecedência do início do passeio é feita sem taxa administrativa, sujeita à disponibilidade. Diferenças de preço da nova data ou custos de fornecedores só são cobrados quando justificados, permitidos pela lei e informados antes da confirmação da nova data. O direito de arrependimento é preservado.",
        "Atraso do cliente: o guia aguarda até 30 minutos após o horário combinado, quando isso for operacionalmente possível e não comprometer ingressos com horário marcado, serviços de terceiros ou a realização do passeio.",
        "Devolução de valores: preferencialmente pelo mesmo meio de pagamento usado, nos prazos e condições previstos na lei. No exercício válido do direito de arrependimento, a restituição dos valores pagos é integral e imediata.",
        "PENDENTE (Q8): percentuais e prazos de eventual retenção abaixo de 72 horas; condições de remarcações adicionais ou pedidas com menos de 72 horas; alteração de participantes; consequências de atraso acima da tolerância e do não comparecimento, a definir com a revisão jurídica.",
      ] },
      { id: "rules", title: "Regras dos passeios", paragraphs: [
        "Crianças: no passeio Cristo Redentor, Escadaria Selarón e Pão de Açúcar e no Centro Histórico e Cultural, crianças de 0 a 2 anos pagam 50% da tarifa individual da faixa e contam no limite de 4 participantes. O Tour Favela Rocinha é somente para adultos (18 anos ou mais).",
        "Chuva ou mau tempo: quando o passeio ficar inviável, vale a regra de remarcação ou reembolso da seção de cancelamento.",
        "O que cada passeio inclui e não inclui está descrito na página do passeio.",
        "Condição física e acessibilidade: antes de confirmar a reserva, a Ricardo Tour informa as condições reais do roteiro escolhido (por exemplo, trechos a pé e escadas), avalia as necessidades individuais dos participantes e busca adaptações razoáveis, sem discriminação.",
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
    updated: "Draft updated on 1 Nov 2026.",
    sections: [
      { id: "who", title: "Who we are", paragraphs: [
        `This website (www.ricardotour.com) belongs to Ricardo Tour, CNPJ (Brazilian company number) ${COMPANY_CNPJ}, with its declared address at Rua Projetada, nº 8, Centro, Itaocara-RJ, CEP 28570-000, Brazil. Contact: ${CONTACT} or WhatsApp ${WHATSAPP}.`,
        "PENDING (Q1): registry check of the address. The address above was declared by the Owner on 28 Oct 2026; the public CNPJ record shows the Cidade Nova district, and the address will only be treated as verified after the updated registration certificate (Cartão CNPJ) is checked. Legal name and Cadastur (number equal to the CNPJ) already checked.",
      ] },
      { id: "service", title: "What the website offers", paragraphs: [
        "The website presents tours in Rio de Janeiro, receives tour requests and contact messages, and offers support over WhatsApp.",
        "In the Portuguese version, the “Planeje sua viagem” page includes a flight search provided by Oner, a third-party company.",
      ] },
      { id: "request", title: "How a tour request works", paragraphs: [
        "Sending a request on the website or writing on WhatsApp is not a booking: it does not confirm a date or availability. The Ricardo Tour team reviews the request and contacts you at the e-mail or phone you provided to arrange the details, including the exact start time.",
        "A booking is confirmed only when Ricardo Tour confirms receipt of the deposit and sends the confirmation in writing (WhatsApp or e-mail).",
        "Tours are private and Ricardo Tour runs one tour per day. For dates less than 24 hours ahead, booking is on request.",
        "To send a request through the website form, you must accept these Terms of Use. Together with the request, we record the version of the Terms and of the Privacy Policy shown to you and the time of acceptance.",
        "Response time: Ricardo Tour aims to answer commercial enquiries within 1 business day. This is a service target, not an absolute deadline, and it does not shorten the deadlines set by law, including those of Brazilian Decree 7,962/2013 (immediate confirmation of receipt and a reply within 5 days to requests made electronically).",
      ] },
      { id: "operator", title: "Who operates the tours", paragraphs: [
        "The tours offered on the website are operated by Ricardo Tour itself, with the guide Ricardo. On tours that include transport, travel is in a private vehicle driven by the guide, with up to 4 participants.",
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
        "The right of withdrawal under article 49 of the Brazilian Consumer Protection Code is preserved, where applicable, regardless of the cancellation rules above, as are the customer's other legal rights.",
        "A new date at the customer's request: ask on WhatsApp or by e-mail; the new date depends on availability (Ricardo Tour runs one tour per day) and applies only once confirmed in writing.",
        "One change of date requested at least 72 hours before the start of the tour is made without an administrative charge, subject to availability. Price differences for the new date or supplier costs are charged only when justified, allowed by law and stated before the new date is confirmed. The right of withdrawal is preserved.",
        "Customer delay: the guide waits up to 30 minutes after the agreed time, when this is operationally possible and does not compromise timed tickets, third-party services or the running of the tour.",
        "Refunds: preferably to the same payment method used, within the deadlines and under the conditions set by law. When the right of withdrawal is validly exercised, the amounts paid are refunded in full and immediately.",
        "PENDING (Q8): percentages and deadlines of any retention under 72 hours; conditions for further changes of date or changes requested less than 72 hours ahead; changes of participants; consequences of delays beyond the tolerance and of no-show, to be defined with the legal review.",
      ] },
      { id: "rules", title: "Tour rules", paragraphs: [
        "Children: on the Christ the Redeemer, Selarón Steps and Sugarloaf Mountain tour and on the Historic and Cultural Center tour, children aged 0 to 2 pay 50% of the individual fare of the group band and count toward the limit of 4 participants. The Rocinha Favela tour is for adults only (18 and over).",
        "Rain or bad weather: when the tour becomes unfeasible, the rescheduling-or-refund rule of the cancellation section applies.",
        "What each tour includes and does not include is described on the tour page.",
        "Physical condition and accessibility: before confirming the booking, Ricardo Tour states the real conditions of the chosen itinerary (for example, walking stretches and steps), assesses the participants' individual needs and seeks reasonable adaptations, without discrimination.",
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
    updated: "Borrador actualizado el 01/11/2026.",
    sections: [
      { id: "who", title: "Quiénes somos", paragraphs: [
        `Este sitio (www.ricardotour.com) pertenece a Ricardo Tour, CNPJ (registro de empresa en Brasil) ${COMPANY_CNPJ}, con dirección declarada en Rua Projetada, nº 8, Centro, Itaocara-RJ, CEP 28570-000, Brasil. Contacto: ${CONTACT} o WhatsApp ${WHATSAPP}.`,
        "PENDIENTE (Q1): verificación registral de la dirección. La dirección anterior fue declarada por el Owner el 28/10/2026; el registro público del CNPJ indica el barrio Cidade Nova, y la dirección solo se considerará verificada tras revisar el comprobante de inscripción actualizado (Cartão CNPJ). Razón social y Cadastur (número igual al CNPJ) ya verificados.",
      ] },
      { id: "service", title: "Qué ofrece el sitio", paragraphs: [
        "El sitio presenta paseos en Río de Janeiro, recibe solicitudes de paseo y mensajes de contacto, y ofrece atención por WhatsApp.",
        "En la versión en portugués, la página “Planeje sua viagem” incluye una búsqueda de vuelos proporcionada por Oner, una empresa tercera.",
      ] },
      { id: "request", title: "Cómo funciona una solicitud de paseo", paragraphs: [
        "Enviar una solicitud en el sitio o escribir por WhatsApp no es una reserva: no confirma fecha ni disponibilidad. El equipo de Ricardo Tour revisa la solicitud y te contacta por el correo o teléfono indicado para acordar los detalles, incluida la hora exacta de inicio.",
        "La reserva solo queda confirmada cuando Ricardo Tour confirma la recepción de la seña y envía la confirmación por escrito (WhatsApp o correo).",
        "Los paseos son privados y Ricardo Tour realiza un paseo por día. Para fechas con menos de 24 horas de antelación, la reserva es bajo consulta.",
        "Para enviar una solicitud mediante el formulario del sitio, debes aceptar estos Términos de Uso. Junto con la solicitud, registramos la versión de los Términos y de la Política de Privacidad que se te mostró y la hora de la aceptación.",
        "Plazo de respuesta: la meta de Ricardo Tour es responder a las consultas comerciales en hasta 1 día hábil. Es una meta de atención, no un plazo absoluto, y no reduce los plazos previstos en la ley, incluidos los del Decreto brasileño nº 7.962/2013 (confirmación inmediata de la recepción y respuesta en hasta 5 días a las solicitudes hechas por medios electrónicos).",
      ] },
      { id: "operator", title: "Quién opera los paseos", paragraphs: [
        "Los paseos que ofrece el sitio los opera la propia Ricardo Tour, con el guía Ricardo. En los paseos con transporte, el traslado se hace en vehículo propio, conducido por el guía, con hasta 4 participantes.",
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
        "El derecho de desistimiento previsto en el art. 49 del Código de Defensa del Consumidor de Brasil se preserva, cuando corresponda, independientemente de las reglas de cancelación anteriores, así como los demás derechos legales del consumidor.",
        "Nueva fecha a pedido del cliente: se solicita por WhatsApp o por correo; la nueva fecha depende de la disponibilidad (Ricardo Tour realiza un paseo por día) y solo vale después de confirmada por escrito.",
        "Un cambio de fecha solicitado con al menos 72 horas de antelación al inicio del paseo se hace sin cargo administrativo, sujeto a disponibilidad. Las diferencias de precio de la nueva fecha o los costos de proveedores solo se cobran cuando están justificados, son permitidos por la ley y se informan antes de confirmar la nueva fecha. Se preserva el derecho de desistimiento.",
        "Retraso del cliente: el guía espera hasta 30 minutos después de la hora acordada, cuando sea operativamente posible y no comprometa entradas con horario fijo, servicios de terceros o la realización del paseo.",
        "Devolución de importes: preferentemente por el mismo medio de pago utilizado, en los plazos y condiciones previstos en la ley. En el ejercicio válido del derecho de desistimiento, la restitución de los importes pagados es íntegra e inmediata.",
        "PENDIENTE (Q8): porcentajes y plazos de una eventual retención con menos de 72 horas; condiciones de cambios de fecha adicionales o solicitados con menos de 72 horas; cambio de participantes; consecuencias del retraso superior a la tolerancia y de la no presentación, a definir con la revisión jurídica.",
      ] },
      { id: "rules", title: "Reglas de los paseos", paragraphs: [
        "Niños: en el paseo Cristo Redentor, Escalera Selarón y Pan de Azúcar y en el Centro Histórico y Cultural, los niños de 0 a 2 años pagan el 50% de la tarifa individual de la franja y cuentan dentro del límite de 4 participantes. El Tour Favela Rocinha es solo para adultos (18 años o más).",
        "Lluvia o mal tiempo: cuando el paseo resulte inviable, se aplica la regla de cambio de fecha o reembolso de la sección de cancelación.",
        "Lo que cada paseo incluye y no incluye está descrito en la página del paseo.",
        "Condición física y accesibilidad: antes de confirmar la reserva, Ricardo Tour informa las condiciones reales del recorrido elegido (por ejemplo, tramos a pie y escaleras), evalúa las necesidades individuales de los participantes y busca adaptaciones razonables, sin discriminación.",
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
