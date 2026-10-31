# RT-80/RT-81 — Pacote jurídico local: propostas para decisão do Owner (31/10/2026)

> **Status: PROPOSTAS, NÃO APROVADAS.** Nada neste documento é regra em vigor. Os Termos de Uso e a Política de
> Privacidade continuam como minutas (`owner_approval`/`legal_review` PENDING) e só ficam públicos quando ambos
> forem aprovados pelo Owner e pela revisão jurídica (`legalPagesPublished()`). As propostas abaixo **não** foram
> escritas nas minutas: os pontos continuam marcados como PENDENTE (Q7, Q8, Q10) até a decisão do Owner.

## 1. Regras operacionais propostas (Termos de Uso)

| # | Ponto da minuta | Proposta | Já decidido (base) | Depende de |
|---|---|---|---|---|
| P1 | Q7 – prazo de resposta | Resposta comercial preferencialmente em até 24 horas úteis. Redigir como meta, não como garantia contratual. | Pedido só vale após confirmação por escrito (RT-123). | Owner |
| P2 | Q8 – remarcação pedida pelo cliente | Uma remarcação gratuita se pedida com pelo menos 72 h de antecedência, sujeita à disponibilidade (um passeio por dia). A partir da segunda, ou com menos de 72 h, segue a regra de cancelamento. | Processo: pedido por WhatsApp/e-mail, nova data só após confirmação escrita (já na minuta). | Owner + advogado |
| P3 | Q8 – atraso | Tolerância de 30 minutos a partir do horário combinado; depois disso, o passeio pode ser encurtado (sem desconto) ou tratado como não comparecimento, mediante aviso. | — | Owner + advogado |
| P4 | Q8 – cancelamento < 72 h | Sem retenção fixa automática. Só retenções justificadas, proporcionais e lícitas (ex.: ingressos já emitidos e não reembolsáveis), informadas por escrito antes do pagamento. | Política aprovada em 30/10 (gratuito ≥ 72 h; sem retenção automática do sinal). | Advogado (redação final, CDC) |
| P5 | Q8 – reembolso | Devolução pelo mesmo meio de pagamento usado, nos prazos legalmente aplicáveis. Não fixar prazo próprio até a revisão jurídica. | — | Advogado |
| P6 | Q10 – acessibilidade/condição física | Avaliação individual: o cliente informa limitações no pedido; a Ricardo Tour responde, antes da confirmação, se e como o passeio pode ser adaptado. Sem lista genérica de restrições. | Crianças e chuva já decididos (na minuta). | Owner + advogado |

Recomendação técnica: aprovar P1–P6 **sujeitas à revisão jurídica**. Quando aprovadas, entram na minuta com nova
versão dos Termos (o teste de fingerprint obriga a trocar `LEGAL_DOCUMENT_VERSIONS.terms`).

## 2. Proposta de retenção de dados (Política de Privacidade, Q3 — continua PENDENTE)

Inventário real (código em 31/10/2026). Prazos são **propostas** com a justificativa legal mais provável; o advogado
confirma.

| Dado | Onde fica | Base de coleta | Prazo proposto | Justificativa |
|---|---|---|---|---|
| Mensagem de contato (nome, e-mail, telefone, mensagem) | `ContactSubmission` (Neon) | Formulário /contato | 12 meses após a última interação; se virar reserva, segue a reserva | Necessidade (LGPD art. 15/16); sem obrigação legal de guardar mais |
| Pedido/reserva: contato, participantes, datas, cotação, **aceite (versões + horário)** | `Booking`, `BookingContact`, `BookingQuote`, `BookingEvent` | Formulário de reserva | 5 anos após o passeio ou o encerramento do pedido | CDC art. 27 (5 anos para reparação); prova do aceite contratual (LGPD art. 16, II/exercício regular de direitos) |
| Pagamentos registrados (manual, sem gateway) | `BookingPayment`, `BookingPaymentEvent` | Admin | 5 anos após o exercício fiscal | Legislação fiscal/contábil (CTN art. 173/174) |
| Pedido sem confirmação (expirado/recusado) | mesmas tabelas | — | 12 meses, depois anonimizar contato | Não há contrato; minimização |
| Conta de usuário/sessão (admin e cliente) | `User`, `Session`, `Account`, `Verification` | Login | Enquanto a conta existir; sessões expiradas apagadas em até 30 dias | Execução do serviço |
| Logs de e-mail (destinatário, modelo, status) | `EmailLog` + Resend | Notificações | 12 meses | Prova de envio; minimização |
| Eventos de analytics (página, sessão pseudônima, viagem) | `AnalyticsEvent` | Navegação | 12 meses, depois agregar | Legítimo interesse, minimização |
| Cookie de atribuição (origem da visita) | navegador | proxy.ts | 30 dias (já implementado) | Já curto |
| Registros de acesso (IP, data/hora) | logs da Vercel | Infraestrutura | 6 meses | Marco Civil art. 15 (mínimo legal para aplicações) |
| Contadores de limite de requisições | Upstash (Redis) | Anti-abuso | Janela de minutos/horas, expiram sozinhos | Segurança |
| Conversas com a Daniela | — | **Desligada** | Não descrever enquanto estiver desligada | Owner 31/10 |

Nota: Q3 (prazos de retenção) continua na lista de pendências da minuta; a tabela acima não foi escrita na
Política. Q4 (publicar sem a seção da Daniela enquanto desligada) saiu da lista porque o Owner decidiu em 31/10.

Implementação técnica dos prazos (rotina de expurgo/anonimização) **não existe ainda**. Depois da aprovação, fica
como tarefa separada.

## 3. Pontos que exigem advogado

1. Q1 (Termos e Privacidade): verificação do endereço pelo Cartão CNPJ atualizado (o registro público indica o bairro Cidade Nova). O endereço não é dado como verificado antes disso. Razão social e Cadastur já conferidos.
2. Q11 (Termos): limites de responsabilidade, serviços de terceiros (ingressos, bondinho, trem), uso do site, propriedade intelectual, lei aplicável, foro e canal de reclamação.
3. Q3 (Privacidade): prazos de retenção (tabela da seção 2).
4. Q5 (Privacidade): dados e cookies do widget de voos (Oner), a confirmar com o fornecedor.
5. Q11 (Privacidade): transferência internacional (Vercel, Neon, Resend, Upstash e, quando ligada, OpenAI), aviso/consentimento de cookies (cookie de atribuição de 30 dias) e encarregado (DPO) ou dispensa como agente de pequeno porte.
6. Redação final de P2 a P6 à luz do CDC (arts. 39, 49 e 51).
7. Aprovação final dos dois documentos (`legal_review: APPROVED`). Só então as páginas ficam públicas.

## 4. O que já está no código (local, sem commit)

- Rotas /termos e /privacidade (PT/EN/ES), com `noindex` e banner de minuta; 404 fora do lab até a aprovação.
- Links no rodapé e aviso de privacidade no /contato só aparecem quando as páginas estão disponíveis.
- Aceite obrigatório no formulário de reserva (checkbox desmarcado por padrão), com a versão dos Termos e da
  Política e o horário gravados em `BookingQuote` (migration aditiva `20261031120000_rt81_terms_acceptance`,
  colunas anuláveis, registros antigos ficam NULL).
- Política sem a Daniela enquanto ela estiver desligada (`privacyCopyFor`); a versão com Daniela tem sufixo `+daniela`.
- Enquanto as reservas pagas não abrem, as FAQ públicas omitem respostas que citam meios de pagamento.
