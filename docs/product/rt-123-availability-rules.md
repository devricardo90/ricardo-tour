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

## 2. Reserva temporária (APROVADA pelo Owner em 28/10/2026 e 29/10/2026; implementada localmente)

Uma solicitação PENDENTE ocupa o dia do guia, para que dois clientes nunca recebam instruções de sinal para a mesma
data. Para que ela não bloqueie o dia para sempre:

1. **D1 — 24 horas para enviar as instruções.** A equipe tem 24 horas, contadas da criação da solicitação, para
   registrar o envio das instruções de pagamento ("Registrar envio e gerar o prazo", no detalhe da reserva; evento
   `DEPOSIT_INSTRUCTIONS_SENT`). Sem o registro nesse prazo, a solicitação expira e a data é liberada. Um registro feito
   depois das 24 horas é recusado (`INSTRUCTIONS_DEADLINE_PASSED`).
2. **48 horas para o sinal**, contadas a partir do envio das instruções. O registro é idempotente: vale o primeiro envio.
3. **D2 — sem reinício.** Um pagamento cancelado depois das 48 horas não reinicia o prazo. Sem outro pagamento que
   proteja a solicitação, ela expira no próximo pedido para a data.
4. **D3 — prazo informado ao cliente.** O texto das instruções, no idioma do cliente, traz a data e a hora exatas do
   vencimento no horário de Brasília. O texto só pode ser copiado depois do registro do envio, que gera o prazo.
5. **Expiração preguiçosa, sem rotina agendada:** depois do prazo, sem pagamento que a proteja, o próximo pedido para a
   mesma agenda ou para o mesmo dia do guia expira a solicitação: ela passa a CANCELADA com o evento `EXPIRED` (ator
   SYSTEM), na mesma transação do novo pedido.
6. **Proteção do dinheiro:** não expira enquanto houver linha de pagamento PENDENTE, REGISTRADA ou CONFIRMADA. Só linhas
   canceladas ou estornadas deixam de proteger. Uma reserva CONFIRMADA nunca expira. As linhas de pagamento e o
   histórico financeiro nunca são alterados pela expiração.
7. **Concorrência:** ordem fixa de locks em todo pedido: agenda → dia do guia → pagamentos da reserva. A expiração usa o
   mesmo lock do registro de pagamento: um pagamento registrado ao mesmo tempo ou entra antes (e protege a solicitação)
   ou é recusado depois. A confirmação pelo admin também verifica o sinal e grava sob esse lock, de modo que um estorno
   simultâneo do sinal não deixa uma reserva confirmada sem sinal (revisão de 29/10/2026). Dois pedidos simultâneos para
   um dia vencido resultam em exatamente um aceito.

Sem migration: os eventos usam o histórico existente. Nenhum e-mail automático (RT-128 é separado).
Código: `lib/booking/deposit-hold.ts`, `lib/services/deposit-hold.service.ts`. Testes:
`tests/rt-123-deposit-hold-live.test.ts`.

## 3. Exemplos (hoje = 28/10/2026, 10:00 no Rio)

| Pedido | Resultado |
|---|---|
| TOUR-03 em 29/10 (referência 09:00, faltam 23 h) | sob consulta (WhatsApp) |
| TOUR-03 em 30/10, dia livre | aceito como PENDENTE |
| TOUR-03 em 30/10, já com pedido ativo do TOUR-03 | data indisponível |
| TOUR-01 em 30/10, com TOUR-03 ativo no mesmo dia | data indisponível (guia ocupado) |
| TOUR-03 em 30/10, depois do cancelamento ou da expiração do pedido anterior | aceito |
| TOUR-02 às 23:30 de 30/10 e TOUR-01 às 00:30 de 31/10 | ambos aceitos (dias diferentes no Rio) |
| TOUR-03 num domingo | aceito (operação todos os dias) |

Testes: `tests/rt-123-guide-calendar-live.test.ts` e `tests/rt-124-public-request*.test.ts`.
