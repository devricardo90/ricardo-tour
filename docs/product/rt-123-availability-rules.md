# RT-123 — Regras de disponibilidade (consolidação, 28/10/2026)

Fonte das regras aprovadas: Manual Mestre (§10.5, §11.3, §11.6, §12.2, §12.4, §12.12). Nada aqui é regra nova do
agente: o que não está aprovado está marcado **PROVISÓRIO** (conservador) e listado para decisão do Owner.

## 1. Regras aprovadas (Manual Mestre)

| Tema | TOUR-01 Cristo + Pão de Açúcar | TOUR-02 Rocinha | TOUR-03 Centro Histórico |
|---|---|---|---|
| Guia | Ricardo, guia e motorista (§10) | Guia Ricardo Tour durante toda a visita (§11.3) | Ricardo, guia e motorista (§12.2) |
| Veículo | Renault Mégane 2025 próprio | — (mototáxi incluído; ponto de encontro em São Conrado) | Renault Mégane 2025 próprio (correção do Owner, 27/10) |
| Capacidade | 1–4 turistas | 1–4 participantes | até 4 turistas |
| Duração | ~8 h, hotel a hotel (referência) | ~3 h | 4 h no roteiro + ~1 h de busca/retorno (estimativa) |
| Início | combinado; referências 7h, 8h ou 9h (§10.5) | PENDENTE, caso a caso (§11.6) | saídas diárias, a partir das 6h, horário exato combinado (§12.4) |
| Reserva | privativa, confirmação humana | privativa, confirmação humana | privativa, confirmação humana |

Regras comerciais preservadas: reserva privativa; sinal de 30% e saldo de 70% no início do passeio; confirmação pelo
admin somente após o sinal verificado; preços aprovados apenas do TOUR-03 4 h (R$ 650 / 760 / 900 / 1.040).

## 2. O que o sistema aplica (local, Sprint 11)

| Regra | Onde | Estado |
|---|---|---|
| Um grupo privativo por horário | `lib/services/private-booking.service.ts` | aprovado |
| **Uma saída ativa por guia por dia (fuso do Rio), somando os três passeios** | `lib/booking/guide-calendar.ts` + motor RT-124 | **PROVISÓRIO** (perguntas 1 e 5) |
| Pedido público só do TOUR-03 4 h, um horário por dia às 09:00 do Rio; o horário exato é combinado antes do sinal | `lib/booking/public-request.ts` | **PROVISÓRIO** (pergunta 2) |
| Antecedência: a partir de amanhã (fuso do Rio), até 365 dias | `lib/booking/public-request.ts` | **PROVISÓRIO** (pergunta 3) |
| Reserva PENDENTE já ocupa o dia do guia; cancelar libera | motor RT-124 | aprovado (confirmação humana) |
| Dias bloqueados (folgas, feriados, eventos) | não existe; o admin cancela o pedido | **PENDENTE** (pergunta 4) |

Por que uma saída por dia: Ricardo guia os três passeios e dirige no TOUR-01 e no TOUR-03; o TOUR-01 ocupa o dia
(~8 h). A regra pode recusar uma combinação que o Owner venha a permitir (ex.: TOUR-02 de manhã e TOUR-03 à tarde), mas
nunca aceita dois passeios que o guia não consiga fazer. As recusas respondem "data indisponível", sem revelar
detalhes de outra reserva.

Testes: `tests/rt-123-guide-calendar-live.test.ts` (dia do Rio × UTC, três passeios, cancelamento, concorrência,
passeio fora do calendário do guia), `tests/rt-124-public-request*.test.ts`.

## 3. Decisões pendentes do Owner (RT-123)

1. Saídas por dia do mesmo guia: manter **1**?
2. Horário de início por passeio para o pedido online (hoje 09:00 provisório no TOUR-03).
3. Antecedência mínima para solicitar e para confirmar. "Com 30 dias de antecedência" (ficha do TOUR-03) é ambíguo:
   é mínimo ou janela?
4. Dias bloqueados: folgas, feriados e eventos (Réveillon, Carnaval). Hoje não há bloqueio no sistema.
5. Confirmar que uma reserva de qualquer passeio bloqueia os outros dois no mesmo dia (regra provisória atual).
6. TOUR-03 4 h aos fins de semana: o Real Gabinete abre só em dias úteis (§12.4). Aceitar pedidos de sábado e domingo
   com visita externa, ou recusar?

Exemplos com as regras provisórias (hoje = 28/10/2026, Rio):

| Pedido | Resultado |
|---|---|
| TOUR-03 em 28/10 (hoje) | recusado (antecedência) |
| TOUR-03 em 29/10, dia livre | aceito como PENDENTE |
| TOUR-03 em 29/10 já com pedido ativo do TOUR-03 | recusado (data indisponível) |
| TOUR-01 em 29/10 com TOUR-03 ativo no mesmo dia | recusado (guia ocupado) |
| TOUR-03 em 29/10 após cancelamento do pedido anterior | aceito |
| TOUR-02 às 23:30 de 29/10 e TOUR-01 às 00:30 de 30/10 | ambos aceitos (dias diferentes no Rio) |
