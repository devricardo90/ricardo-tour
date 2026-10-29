# Sprint 10 — validações externas pendentes (28/10/2026)

Pedidos prontos para o Owner enviar. Nenhum foi enviado pelo agente. Cada resposta encerra um bloqueio de lançamento
(Jira RT-121, RT-80, RT-81 e RT-118). Custos e margens ficam fora deste documento (Manual Mestre §14, interno).

## 1. Trem do Corcovado — gratuidade do guia (RT-121, TOUR-01)

**Evidência coletada (28/10/2026):** as páginas oficiais "Política de Compra" e "Informações Úteis"
(tremdocorcovado.rio) não mencionam guia, Cadastur nem gratuidade para guias. Citam apenas crianças até 6 anos e
"cortesias" impressas com código de barras. O FAQ de 2020 da van Paineiras (outro operador) prevê gratuidade para guia
Cadastur, mas **não vale para o trem**. Sem confirmação, a análise considera que o guia **paga** a passagem.

**Canais oficiais:** WhatsApp +55 11 93247-3268 (07h–23h) · atendimento@tremdocorcovado.rio · grupos e agências
(21) 3512-4072 (08h–22h).

**Mensagem sugerida:**
> Olá! Sou Ricardo, da agência Ricardo Tour (Cadastur da agência 49.142.341/0001-90). Acompanho grupos privativos de
> 1 a 4 turistas como guia de turismo cadastrado no Cadastur. O guia credenciado que acompanha o grupo tem gratuidade no
> trem? Se tiver, quais documentos devo apresentar (crachá, certificado Cadastur, lista do grupo) e se a gratuidade
> exige compra antecipada ou retirada na bilheteria. Obrigado!

**Critério de encerramento:** resposta escrita do operador, por e-mail ou captura do WhatsApp, anexada ao RT-121 e
registrada no Manual §14.6.13.

## 2. Contador — enquadramento e projeção (RT-121)

**Fatos verificados:**
- Registro público do CNPJ 49.142.341/0001-90: Empresário Individual, MEI, CNAE 7911-2/00 (Agências de viagens),
  ativo desde 11/01/2023.
- Certificado Cadastur: Agência de Turismo, válido de 02/04/2025 a 02/04/2027.
- LC 238/2026: limite do MEI de R$ 81 mil em 2026, R$ 110 mil em 2027 e R$ 140 mil a partir de 2028, nas datas de
  efeito da lei.

**Projeção de receita bruta** (tabelas escolhidas pelo Owner; preço fechado por grupo; nos grupos de 2, os ingressos
do TOUR-01 estão incluídos no total):

| Cenário mensal | Receita bruta/mês | Receita bruta/ano | Passeios por ano para atingir o limite |
|---|---|---|---|
| 4 passeios/mês (mistura igual; média ≈ R$ 1.013, grupo de 2) | ≈ R$ 4.050 | ≈ R$ 48.600 | 2027: ≈ 108 · 2028: ≈ 138 |
| 8 passeios/mês | ≈ R$ 8.100 | ≈ R$ 97.200 | acima de R$ 81 mil; abaixo de R$ 110 mil |
| 12 passeios/mês | ≈ R$ 12.150 | ≈ R$ 145.800 | acima de R$ 140 mil |

**Perguntas:**
1. A receita bruta do MEI inclui o valor integral dos ingressos do TOUR-01 cobrados no preço do pacote? Há tratamento
   como reembolso ou intermediação?
2. A atividade de agência (CNAE 7911-2/00) com guiamento próprio e transporte em veículo próprio do titular está
   coberta pelas ocupações permitidas ao MEI? Exige CNAE secundário?
3. Qual foi a receita de 2026 até agora e quanto resta do limite de R$ 81 mil?
4. A partir de que volume e em que data convém migrar para ME (Simples Nacional), e em qual anexo/alíquota?
5. Quais são as obrigações de emissão de nota fiscal por passeio, e como tratar as taxas da maquininha?

**Critério de encerramento:** parecer escrito do contador, anexado ao RT-121, com a resposta às 5 perguntas e a
provisão tributária a usar no Manual §14.

## 3. Jurídico — revisão antes da publicação (RT-80, RT-81, RT-118, RT-116)

**Textos a revisar:** `lib/legal/terms-copy.ts` e `lib/legal/privacy-copy.ts` (PT; EN/ES depois da aprovação do PT),
que trazem a política-base aprovada pelo Owner em 28/10/2026; também as minutas v0.3 do Owner em
`docs/legal/owner-drafts/`.

**Perguntas:**
1. **Cancelamento abaixo de 72 h:** quais retenções são permitidas (percentual, prazo, despesas comprovadas com
   ingressos)? Quais regras aplicar a remarcação, atraso e não comparecimento?
2. **Direito de arrependimento** (CDC, art. 49) em contratação online de passeio com data próxima: como redigir?
3. **Encarregado (LGPD):** confirmar que a Ricardo Tour (MEI) se enquadra como agente de tratamento de pequeno porte,
   sem tratamento de alto risco, e pode dispensar o encarregado com base na Resolução CD/ANPD nº 2/2022, art. 11. O
   canal com os titulares é contato@ricardotour.com.
4. **Prazos de guarda** de pedidos, contatos, contas e estatísticas; transferência internacional (Vercel, Neon em
   Londres, Resend); necessidade de aviso de cookies.
5. **Mural da Rocinha** (foto IMG_1252, assinatura visível "@WARK ROCINHA"). A obra está pintada na parede externa de
   um imóvel, voltada para uma escadaria de passagem pública da comunidade, e aparece como fundo de uma cena com
   visitantes. A Lei 9.610/1998, art. 48, permite representar livremente, por fotografia, obras situadas
   permanentemente em logradouros públicos. Dúvidas: se a escadaria conta como logradouro público, e se o uso em
   página comercial está coberto. Recomenda-se citar a autoria (art. 24, II). Alternativa: autorização escrita do
   artista.
6. **Foro e legislação aplicável**, limites de responsabilidade e identificação da empresa. Endereço declarado pelo
   Owner em 28/10/2026 e já usado nas minutas: Rua Projetada, nº 8, Centro, Itaocara-RJ, CEP 28570-000. O registro
   público do CNPJ indica o bairro Cidade Nova; a verificação cadastral fica pendente até a conferência do Cartão CNPJ
   atualizado (responsável: Owner; evidência: comprovante emitido pela Receita Federal).

**Critério de encerramento:** parecer ou texto revisado pelo profissional, com data e nome, anexado ao RT-81. Os
`PENDENTE (Q…)` só podem ser substituídos pelo texto revisado.
