# TOUR-03 — auditoria de fechamento comercial e técnico

**Data:** 18/10/2026
**Passeio:** Centro Histórico e Cultural do Rio
**Worktree/branch:** `rick-travel-centro` / `sprint10/centro-historico-media`
**Status:** implementação local preparada para revisão; publicação não autorizada.

## Decisões preservadas

O nome, a modalidade exclusivamente privativa, o limite de 1–4 turistas, os circuitos aprovados de 4h e 6h, as tarifas, os R$120/h por grupo, a política infantil, as inclusões/exclusões, a seleção de fotos e o layout aprovado permanecem inalterados. A Ficha Comercial e Operacional v1.0 é fonte das decisões do Owner. O registro canônico é o Manual Mestre §12 e §14.7, complementado pela Source of Truth — Volume II; não foi criada uma nova fonte canônica.

## Traduções e renderização

EN e ES estão preparados como rascunhos para revisão final do Owner em [tour-03-commercial-copy-review-pt-en-es.md](tour-03-commercial-copy-review-pt-en-es.md). PT/EN/ES mantêm as mesmas tarifas, faixas de participantes, política infantil, inclusões, exclusões e escopo. EN/ES continuam com status PENDING até aprovação editorial.

O conteúdo local do passeio tem campos PT/EN/ES completos; as páginas EN/ES do protótipo não preenchem traduções ausentes com texto em português. O aviso continua identificando a prévia como não publicada. A seleção, a ordem, o Hero, a proporção 3:4 e o design aprovado não foram alterados. As sete mídias continuam com direitos `UNVERIFIED`.

## Solicitações, WhatsApp e reservas

- Número canônico lido de `lib/public-contact.ts`: **+55 22 99846-1906** (`https://wa.me/5522998461906`). O Manual ainda não tem horário de atendimento ou SLA de resposta preenchidos.
- A prévia local prepara uma mensagem de consulta de disponibilidade via WhatsApp. Ela não cria registro, envia mensagem, confirma disponibilidade, reserva ou pagamento.
- O formulário existente (`submitTourRequest`) grava em `ContactSubmission` e notifica a equipe por e-mail. Ele não é um checkout nem confirma reserva. O passeio permanece em DRAFT e o gate do catálogo público o exclui; não foi acionado.
- Não foi implementada cobrança, checkout ou reserva produtiva. A rota legada de reservas não deve ser usada para este passeio enquanto o preço público, os gates e a autorização de publicação não estiverem válidos.
- Bloqueio de segurança existente: RT-110 documenta evidência anterior, em banco descartável, de `POST /api/bookings` criando reserva PENDING para um passeio não publicado. A revisão read-only desta worktree (HEAD `248119b4f5d54abe077cd6c5506da5d578d13b3f`) confirma que a rota ainda chama `createBookingForUser` sem `getPublicTripById`, `isPublished` ou allowlist. Não reexecutado com banco nesta tarefa; status Jira BACKLOG / READY. A integração desta prévia não chama essa API, mas a segurança de reservas produtivas não pode ser declarada até RT-110 integrar e verificar o gate no servidor.
- Dependências candidatas já commitadas na branch paralela `sprint10/tours-content`: `23378c58c11028a68df0cf03373189a1afdf7369` (guarda server-side e teste RT-110) seguido de `7604a2d252fcf5fbc31e7a7c7c1500f4c5261ac6` (expansão aos quatro passeios próprios e teste). Não foram cherry-picked/copied/merged nem testados nesta worktree; revisar e validar na integração apropriada. A outra worktree permaneceu intocada.

## Cancelamento, remarcação e campos contratuais

Manual §6.1–§6.4 deixa os campos `[PREENCHER]`; RT-81 segue em andamento e RT-118 mantém dependências. A Ficha v1.0 remete à política geral, mas não fornece os parâmetros que o Manual ainda marca como pendentes. Não foi alterado nenhum termo contratual.

| Campo ausente | Redação provisória para revisão (não é cláusula vigente) | Decisão necessária do Owner |
|---|---|---|
| Cancelamento pelo cliente: prazo, faixa de reembolso, momento e canal do pedido | “As condições de cancelamento e reembolso aplicáveis serão apresentadas por escrito antes do pagamento.” | Aprovar prazos, percentuais, custos retidos, procedimento e prazo de reembolso, com validação jurídica. |
| Cancelamento pela Ricardo Tour: aviso, alternativa, reembolso | “Se a operação não puder ocorrer, a equipe apresentará as alternativas e condições aplicáveis antes de qualquer pagamento.” | Definir aviso, remarcação, reembolso e tratamento de valores já pagos. |
| Remarcação pelo cliente: antecedência, quantidade de mudanças e disponibilidade | “Pedidos de remarcação dependem de disponibilidade e das condições informadas antes do pagamento.” | Definir prazo, limite de remarcações, diferença de preço e custos de terceiros, se houver. |
| Atraso e ausência (no-show): tolerância e contato | Não incluir regra numérica enquanto estiver sem aprovação. | Definir tolerância, tentativas de contato, momento em que a saída é considerada perdida e tratamento do sinal. |
| Chuva forte/fechamento: cancelamento, alternativa, remarcação ou reembolso | “Em caso de chuva forte ou fechamento, a equipe avaliará alternativas; as condições contratuais aplicáveis serão informadas antes do pagamento.” | Aprovar critérios de segurança, substituições, decisão do cliente e resultado financeiro. |
| Sinal de 30%: devolução ou retenção em cada hipótese | Não associar automaticamente o sinal a multa. | Definir a relação entre sinal, cancelamento, remarcação e reembolso; validar juridicamente. |
| “Reserva com 30 dias de antecedência” | Não exibir até resolver a ambiguidade. | Confirmar se é antecedência mínima, janela de reserva ou outra regra. |
| Saldo e taxas do cartão | “O saldo e eventuais custos do meio de pagamento serão informados na proposta.” (rascunho) | Confirmar o prazo do saldo e se há custo repassado ao cliente; não inventar cobrança. |

O texto de status na prévia não cria prazo, multa, retenção nem direito de reembolso. O Owner precisa aprovar os campos acima e a validação jurídica antes de inserir cláusulas no Manual/Termos ou liberar cópia pública.

## Auditoria financeira

A auditoria de custos internos, remuneração do guia e saldos/margens do TOUR-03 é confidencial e fica registrada somente no Manual Mestre privado (§14.7 e §19). Este repositório não reproduz esses valores. Itens ainda não apurados e decisões pendentes, sem valores internos:

- Regime tributário/alíquota efetiva, taxa de cartão por adquirente, combustível real, custo incremental do circuito de 6h, custo marginal de retirada no Galeão/Santos Dumont e custo marginal da hora de extensão: não documentados; dependem do contador e de cotações.
- A retirada em aeroporto está aprovada sem sobretaxa ao turista; a extensão mantém a tarifa pública aprovada de R$120/h por grupo. Não alterar preços sem decisão do Owner.

**Decisão pendente — cálculo do bebê no roteiro de 6h:** a implementação local aplica 50% à tarifa individual publicada para a faixa e duração de 6h (totais de R$750 para 1 adulto + 1 bebê, R$950 para 2+1, R$1.120 para 3+1, R$960 para 2+2 e R$800 para 1+3). A leitura literal de “adicionar R$240 ao total do grupo” depois de calcular a composição de 4h produziria R$810, R$990, R$1.150, R$1.020 e R$890. As tarifas adultas e a política infantil aprovada não foram alteradas; o Owner precisa confirmar qual fórmula se aplica a grupos mistos de 6h. Esses totais não devem ser usados em proposta/reserva até a confirmação.

## Modelo de carro alugado — comprovações pendentes

O modelo comercial aprovado é carro alugado dirigido por Ricardo, com até quatro turistas além do guia/motorista. A aprovação comercial é preservada. A Ficha não traz o contrato da locadora, apólice, CRLV ou registros específicos. O material consultado também não identificou o resultado, escopo e data das verificações que o Owner possa já ter realizado; não se presume irregularidade e nenhuma checagem é tratada como concluída sem o comprovante.

Comprovar para o veículo/operador escolhido:

1. Locadora, contrato vigente e autorização escrita para o uso concreto em transporte turístico remunerado; não extrapolar cláusulas de contrato de outra locadora/produto.
2. Apólice e cobertura para uso comercial/remunerado, condutor, passageiros/APP, responsabilidade civil, franquia e exclusões pertinentes.
3. Documento, classe e lotação do veículo, cintos e compatibilidade dos dispositivos infantis para quatro turistas mais guia/motorista; bagagem para cada ponto de retirada.
4. Cadastro e documentação de prestador/veículo exigidos para a modalidade e decisão profissional específica sobre como o veículo alugado se enquadra na regra de frota própria/Cadastur.
5. Restrição operacional e custo de retirada em portos/aeroportos, sem alterar a política aprovada de não cobrar sobretaxa ao turista.

A Portaria MTur nº14/2022, arts. 11–12, contém regra de prestação por transportadora turística ou agência com frota própria cadastrada e registro de veículos. A Lei nº13.785/2018 trata de veículo próprio, do cônjuge ou dependente do guia-motorista. A incidência sobre o arranjo concreto de carro alugado precisa de parecer/documentos do caso; este registro não conclui regularidade ou irregularidade. [Portaria oficial](https://www.gov.br/turismo/pt-br/publicacoes/atos-normativos-2/2022/portaria-mtur-no-14-de-7-de-marco-de-2022) · [Lei oficial](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13785.htm).

## Performance, mobile e provas técnicas

- Hero, galeria, ordem de fotos, ratio 3:4, composição desktop/mobile e layout aprovado permanecem intocados.
- Prévia local Playwright concluída em 18/10/2026: desktop 1440×900 e mobile emulado 390×844; PT e páginas EN/ES com preços ocultos retornaram HTTP 200. As seis combinações passaram: imagem principal carregada, duas rotas presentes, sem overflow horizontal, sem erros de console/JS; EN/ES mantiveram preços ocultos e exibiram aviso de rascunho para revisão do Owner. CTA desktop/mobile apontou para o número comercial canônico do WhatsApp com texto localizado; formulário/submissão de reserva não apareceu. Resultados em `docs/baseline/rt-116-centro-commercial-preview/results.json`; capturas em `desktop.png` e `mobile.png`.
- A execução em modo dev identificou a imagem do Real Gabinete como LCP e emitiu aviso de carregamento eager; a resposta HTML também continha o preload da imagem principal. O teste confirmou carregamento, mas não mede LCP/INP/CLS nem desempenho de produção.
- Lighthouse não foi executado: `lighthouse` e `@lhci/cli` não estão instalados no ambiente. Não foi feita instalação de dependências. Resultado Lighthouse permanece pendente.
- Playwright mobile emulado não equivale a teste em dispositivo físico. Teste em dispositivo real permanece pendente se nenhum aparelho for disponibilizado.

## Verificações executadas em 18/10/2026

- `vitest`: 56 testes passaram em `tests/rt-116-centro-commercial.test.tsx` e `tests/rt-113-tour-content.test.tsx`.
- `tsc --noEmit`: passou.
- ESLint nos componentes, mocks, rascunho, testes e arquivos alterados anteriormente: passou. O script `scripts/rt-116-centro-validate.mjs` foi executado com sucesso após sua última alteração, mas uma execução isolada final do ESLint ficou sem retorno e foi interrompida; lint específico desse script permanece pendente.
- Verificador Playwright da prévia: seis combinações PT/EN/ES × desktop/mobile passaram; sem erros de browser/JS, com CTA de consulta somente e preços ocultos em EN/ES.
- Validador de galeria `scripts/rt-116-centro-validate.mjs`: passou em desktop e mobile; sete imagens carregadas na ordem aprovada, frame 3:4 (727×969 e 350×467), `object-fit: contain`, gap lateral medido 0, sem overflow, navegação por teclado e CTA canônico. Transferência inicial de `/_next/image`: 134.734 bytes desktop e 50.450 mobile, apenas os recursos registrados no modo dev, não o peso total da página. Capturas/resultados em `docs/baseline/rt-116-centro-commercial-gallery-validation/`.
- `git diff --check`: passou na revisão final (avisos apenas sobre conversão de LF/CRLF). A revisão dos diffs rastreados foi concluída; `git status -sb` confirmou a branch correta e o conjunto de alterações locais descrito no handoff. Nenhum commit foi criado.

## Evidências e gates

- Source of Truth — Volume II: [documento canônico](https://docs.google.com/document/d/1SyIWipooyl60lAqqg7DWZx5h6Bw3jcn8kPV17HzuuJw/edit).
- Manual Mestre: [documento canônico](https://docs.google.com/document/d/1mtSYIISghr0jGQ3HSkZVxar0CgFkO2-IjW7iMTpJIe0/edit), §6, §11.19, §12 e §14.7.
- Ficha Comercial e Operacional TOUR-03 v1.0: documento de transferência consultado; decisões aprovadas mantidas.
- Jira: RT-81/RT-118 (termos), RT-110/RT-119 (gates de reserva/publicação), RT-115 (editorial) e RT-116 (mídia/preview). Atualizar comentários com resultados verificados, sem transições de status.
- Direitos de mídia: `UNVERIFIED`. Conteúdo comercial/operacional, termos, traduções, fiscal/financeiro, comprovação da operação de carro alugado e autorização de publicação permanecem gates separados.

## Integração local Sprint 10 (20/10/2026)

**Escopo:** integração do commit aprovado `5ae65bd` (TOUR-03) sobre `sprint10/tours-content` @ `1342598` (TOUR-01, TOUR-02, RT-110, RT-119), em worktree e branch exclusivas (`rick-travel-s10-integration` / `sprint10/integration-tour-01-02-03`). Somente local: sem push, deploy, merge na `main`, migration ou publicação. As alterações divergentes que permanecem em stage na worktree `rick-travel-s9-gate` (bloqueio geral da cotação de 6h com bebê e remoção da frase sobre dispositivos de retenção infantil) **não** foram incorporadas, por decisão do Owner.

**Conflitos resolvidos combinando os dois lados**, sem descartar nenhum:

- `tour-detail-prototype.tsx`: campos do TOUR-01 (`priceLabel`, `hotelPickup`, `children`, `transport`, `requestViaWhatsapp`) e do TOUR-03 (`approvedPricing`, `routeOptions`, avisos, `noPortugueseFallback`, `requestFlowMode`); a tabela aprovada aparece somente no modo de revisão do TOUR-03, e os demais casos usam "Orçamento sob consulta"; status de conteúdo com `approvalValid` (RT-119) e status por idioma (TOUR-03).
- `tour-content.mock.ts`: o Centro usa `CENTRO_COMMERCIAL_DRAFT` e o rascunho do Cristo foi mantido.
- `rt-113-tour-content.test.tsx`: duração de 8h liberada no TOUR-01; tarifas aprovadas de R$ 900/R$ 120 aceitas somente no TOUR-03; os demais exigem "Orçamento sob consulta".

**Mídias**, conferidas contra a configuração aprovada (não apenas contagem de teste). A curadoria, `public/` e `centro-historico-media.ts` estão idênticos aos das duas branches de origem; nenhum arquivo referenciado falta; direitos `UNVERIFIED` nos três passeios.

| Passeio | Fotos configuradas = renderizadas (PT/EN/ES) | Vídeo |
|---|---:|---|
| TOUR-01 Cristo + Pão de Açúcar | 4 | `pao-bondinho-41-58` (desktop, mobile e poster), PROVISIONAL |
| TOUR-02 Favela Rocinha | 5 | `rocinha-praca-movimento` (desktop, mobile e poster), PROVISIONAL |
| TOUR-03 Centro Histórico | 7 (Museu do Amanhã horizontal, razão 1,51) | nenhum vídeo na seleção aprovada |

**Testes:**

- TypeScript (`tsc --noEmit`) e ESLint (arquivos da integração, `components`, `lib/catalog`, testes RT-110/RT-113): passaram.
- Vitest completo (`--maxWorkers=2`, timeout de 5 s): 916 aprovados, 4 falhas e 6 ignorados. Três falhas foram por tempo: `ai-concierge-launch`, `rt-104-db-guard` (busca de scripts) e o teste de metadados das mídias da Rocinha. Repetidos com `--testTimeout=60000`: 100/100 aprovados.
- Vitest completo consolidado (`--testTimeout=60000`): **919 aprovados, 1 falha e 6 ignorados. A suíte NÃO está integralmente aprovada.** Exceção restante: `rt-113b-data-model` > checksum da migration `20261016120000_rt113_tour_content_gallery/migration.sql`. Causa: este checkout novo usa `core.autocrlf=true` e o arquivo foi gravado com CRLF. O blob versionado (LF) tem sha256 `b3179d3fba249328f2fac7c0f479f89380120758b6c5008c0c7d74b6a4031198`, idêntico ao valor esperado pelo teste e ao arquivo da worktree normalizado para LF; não há diferença de conteúdo em relação ao commit. A migration não foi alterada.
- Playwright (dev local isolado na porta 3271, sem banco, `REBUILD_LAB_ENABLED`): **36/36 OK**, cobrindo 3 passeios × PT/EN/ES × desktop/mobile × revisão e `?precos=ocultos`. Todas as combinações retornaram HTTP 200, sem erros de console, sem overflow, sem os preços antigos R$ 385/R$ 245, sem formulário de reserva; a tabela do TOUR-03 aparece somente no modo de revisão. Resultados em `docs/baseline/s10-integration-three-tours/results.json`.
- Validadores existentes: `rt-112` (TOUR-01) 6/6, `rt-114` (fundo da galeria do TOUR-01), `rt-116-centro-validate`, `rt-116-centro-commercial-preview-check` 6/6 e `rt-116-centro-visual-final-check`: todos passaram. A captura do TOUR-03 é igual à baseline aprovada (o selo "FICTÍCIO" sob o texto de apresentação já existia na baseline).

**Segurança:** nenhum custo interno no diff ou no histórico integrado; `BOOKING_PRICE_NOT_APPROVED_TRIP_IDS` (RT-110, chamado por `booking.service.ts`) e `PRICE_ON_REQUEST_TRIP_IDS` cobrem os quatro passeios próprios; TOUR-03 permanece `DRAFT`.
