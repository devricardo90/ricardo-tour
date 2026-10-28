# RT-130 — Ensaio local do fluxo de venda (28/10/2026)

**Escopo:** ensaio LOCAL, sem cobrança real, sem e-mail enviado (`CONTACT_EMAIL_MODE=log`), sem Neon Production ou
Preview. Build de produção local (`next build` + `next start`, Node 22.21.1) da branch `sprint11/commercial-readiness`
(head `191b2b0`), banco descartável `rt_s11_e2e` no Docker local (todas as migrations + marcador RT-104), apagado ao
final. Pessoas, telefones, referências PIX/NSU e passeios são fictícios. O formulário roda na rota de laboratório
(`/rebuild-lab/tour-content-preview/TOUR-03`), porque a publicação de preços não está autorizada.

**Resultado: 28/28 verificações aprovadas.** O roteiro e as capturas ficam fora do repositório, no scratchpad da
sessão (`rt130-e2e.mjs`).

| # | Verificação | Resultado |
|---|---|---|
| A1 | Formulário mostra a tabela aprovada para 3 pessoas: total R$ 900, sinal 30% R$ 270, saldo 70% R$ 630 | OK |
| A2–A3 | Pedido sem conta → reserva PENDENTE / A pagar, cotação 90000/27000/63000, dono = conta de solicitações do site | OK |
| B1 | Mesmo dia de novo → "data não disponível", nada gravado | OK |
| B2 | Dia em que o guia já tem TOUR-01 → "data não disponível" (calendário do guia) | OK |
| B4 | Hoje (sem antecedência) → recusado | OK |
| C1 | Página pública do TOUR-03 sem formulário (publicação de preço não autorizada) | OK |
| C2 | TOUR-04 fora do lançamento → 404 | OK |
| C3 | EN e ES no celular (390 px): formulário traduzido, sem rolagem lateral | OK |
| D1 | Cadastro com o e-mail da conta de solicitações → recusado, nenhuma credencial criada | OK |
| D2–D3 | USER comum: sem acesso ao detalhe admin, não vê o pedido em /reservas | OK |
| E1–E3 | Admin: lista com o nome do contato; instruções do sinal (total, 30%, 70%); "Confirmar" desabilitado | OK |
| E4 | Sinal só registrado (não verificado): "Confirmar" continua desabilitado | OK |
| E5 | Sinal verificado: PENDENTE / Parcial, "Confirmar" habilitado | OK |
| E6 | Admin confirma: CONFIRMADA / Parcial | OK |
| E7–E8 | Saldo na maquininha no início do passeio, verificado: CONFIRMADA / Pago; lançamentos 27000 PIX + 63000 maquininha | OK |
| E9 | Histórico: CREATED (cliente) → CONFIRMED (admin) | OK |
| F1 | Admin cancela outro pedido | OK |
| F2a | 6º pedido do mesmo cliente em 10 min → limite de tentativas, nada gravado | OK |
| F2 | Dia cancelado aceita novo pedido (4 pessoas, R$ 1.040) | OK |
| G1 | Sem erros de console inesperados (só o 404 do TOUR-04 e o 422 do cadastro recusado, ambos esperados) | OK |
| G2 | Conta de solicitações continua sem credencial e sem sessão | OK |

## Fora deste ensaio (continuam no checklist GO/NO-GO do RT-130)

- **Preview isolado** (nameless-block-90349181): não usado, por diretiva do Owner (não alterar Neon Preview).
- **Estados não implementados:** COMPLETED e NO_SHOW (dependem de decisão do Owner).
- **E-mails ao cliente (RT-128):** não implementados; a equipe envia as instruções do sinal pelo texto pronto do admin.
- **Lighthouse, dispositivo físico (RT-83), cutover/rollback (RT-50) e gate final (RT-51).**
- **Bloqueadores do Owner/jurídico:** preços TOUR-01/02 (RT-121), documentação do transporte (RT-122), termos e
  cancelamento (RT-81/RT-118), privacidade (RT-80), direitos de mídia (RT-116), carga real do conteúdo (RT-119),
  regras de disponibilidade (RT-123), autorização de publicação de preços (`PRICE_PUBLICATION_AUTHORIZED_TRIP_IDS` vazio).
- **Migrations da Sprint 11 em produção:** nenhuma aplicada; exige autorização específica.
