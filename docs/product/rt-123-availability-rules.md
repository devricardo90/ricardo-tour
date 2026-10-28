# RT-123 — Regras de disponibilidade (decisões do Owner de 28/10/2026)

Fontes: decisão do Owner de 28/10/2026 e Manual Mestre (§10.5, §11.3, §11.6, §12.2, §12.4).

## 1. Regras aprovadas

| Regra | Decisão | Onde o sistema aplica |
|---|---|---|
| Dias de operação | Todos os dias, nos três passeios | sem bloqueio por dia da semana |
| Passeios por dia | Um passeio privativo confirmado por dia, somando TOUR-01, TOUR-02 e TOUR-03 (Ricardo é o guia dos três) | `lib/booking/guide-calendar.ts` + motor RT-124 |
| Bloqueio entre passeios | Uma reserva confirmada bloqueia a data nos demais passeios | idem |
| Antecedência | Com menos de 24 horas de antecedência: sob consulta (WhatsApp), sem pedido online | `isRequestLeadTimeAllowed` (`lib/booking/public-request.ts`) |
| Horário | Combinado com o cliente (flexível). Referências do Manual: TOUR-01 7h/8h/9h; TOUR-03 a partir das 6h; TOUR-02 caso a caso | o pedido online usa 09:00 do Rio só como referência e para a regra das 24 h |
| Capacidade | Privativo, 1 a 4 pessoas, Renault Mégane 2025 próprio (TOUR-01 e TOUR-03) | motor RT-124 |
| Confirmação | Pelo admin, depois do sinal de 30% verificado | `confirmBookingByAdmin` |

Decisões encerradas e que não devem voltar a ser perguntadas:
- O dia da semana não bloqueia nenhum passeio.
- No TOUR-03, as visitas internas não são prometidas (Real Gabinete só em dias úteis), e o roteiro se adapta.

## 2. Proposta técnica: expiração das solicitações pendentes (para aprovação)

Hoje uma solicitação PENDENTE já ocupa o dia do guia. Isso evita que dois clientes recebam instruções de sinal para a
mesma data, mas sem prazo ela poderia bloquear o dia para sempre. Proposta, sem criar bloqueio permanente:

1. **Prazo de 48 horas** a partir da solicitação para o sinal de 30% ser **verificado**. Nunca depois de 24 horas antes
   do início: a partir daí a data entra no regime "sob consulta".
2. **Expiração preguiçosa, sem rotina agendada:** passado o prazo e sem sinal verificado, a solicitação deixa de ocupar
   o dia. O próximo pedido para a data é aceito, e a solicitação vencida passa a CANCELADA com o evento "EXPIRED" (ator
   SYSTEM), na mesma transação, sob o lock do dia do guia.
3. **Prorrogação manual:** o admin prorroga uma vez, por exemplo quando o cliente avisou que vai pagar.
4. **Sinal registrado mas ainda não verificado:** a solicitação não expira até o admin decidir. Dinheiro recebido nunca
   perde a data sozinho.
5. **Admin:** mostra "expira em …" na lista e no detalhe. Nenhum e-mail automático (RT-128 é separado).

Implementação estimada: pequena. Usa um campo calculado a partir de `createdAt` e dos pagamentos; não exige migration
nova, exceto se o Owner quiser o prazo configurável por passeio. Fica **aguardando o "de acordo" do Owner com o prazo
de 48 horas**.

## 3. Exemplos (hoje = 28/10/2026, 10:00 no Rio)

| Pedido | Resultado |
|---|---|
| TOUR-03 em 29/10 (referência 09:00, faltam 23 h) | sob consulta (WhatsApp) |
| TOUR-03 em 30/10, dia livre | aceito como PENDENTE |
| TOUR-03 em 30/10, já com pedido ativo do TOUR-03 | data indisponível |
| TOUR-01 em 30/10, com TOUR-03 ativo no mesmo dia | data indisponível (guia ocupado) |
| TOUR-03 em 30/10, depois do cancelamento (ou da expiração, se aprovada) do pedido anterior | aceito |
| TOUR-02 às 23:30 de 30/10 e TOUR-01 às 00:30 de 31/10 | ambos aceitos (dias diferentes no Rio) |
| TOUR-03 num domingo | aceito (operação todos os dias) |

Testes: `tests/rt-123-guide-calendar-live.test.ts` e `tests/rt-124-public-request*.test.ts`.
