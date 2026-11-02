# RT-S11 — Pacote de release dos três passeios (preparação local, 01/11/2026)

Autorização do Owner (01/11/2026): preparação LOCAL do release; revisão final do Owner no mesmo dia (consistência
comercial, isolamento Preview/Production, migrations, identificação legal) e decisão do Owner sobre o release (opção R
implementada localmente). Correção das decisões do Owner no mesmo dia (seção 14): preços aprovados públicos, vídeo do Pão
de Açúcar publicado no TOUR-01, endereço informado pelo Owner e local traduzido nos cartões. Nada aqui foi executado fora da máquina
local: nenhum push, merge, deploy, migration hospedada, Preview, alteração de variável ou escrita no Neon. Cada passo
hospedado exige autorização escrita do Owner no momento da execução. As travas dos scripts contra bancos hospedados
continuam como estão. Procedimento do catálogo: `docs/ops/rt-s11-catalog-release-procedure.md`. Plano de backup de
referência: `docs/ops/rt-100-deployment-backup-recovery-plan.md`.

## 1. Candidato a release

| Item | Valor |
|---|---|
| Branch | `sprint11/commercial-readiness` (local, sem upstream) |
| Base | `origin/main` = `26ece27` (sem commits novos em main desde a base, conferido em 01/11) |
| Cabeça | `0c7babf` (113 commits sobre a base; lista: `git log --oneline 26ece27..0c7babf`) + alterações locais da opção R e da identificação legal, **sem commit** (seção 13) |
| Conteúdo dos passeios | `launchLoadRecord()` (TOUR-01/02/03), aprovado pelo Owner em 30/10 (PT) e 01/11 (EN/ES de TOUR-01/03) |
| Termos / Política | `2026-11-01-draft` / `2026-10-31-draft-r2` (minutas, não publicadas) |
| Validação local em 01/11 (com a opção R e as decisões da seção 14) | suíte completa 1166 aprovados / 0 falhas (3 workers, 02/11); tsc e lint limpos; build de produção OK; gate `code` GO; ensaio da opção R com gate `http` **GO 9/9** e `Trip` intacto (seção 4.5) |

Commits de 31/10 e 01/11 (proteções do lançamento): `b4c59a7` minutas e aceite; `f080fb9` formulário /contato pausado;
`91af959` formulário legado pausado; `f8f3293` filtro de FAQ; `ef245c2` estado neutro, gate e plano A; `f5b4309` carga
dos três passeios e ato de aprovação; `6137a95` P1–P6 nos Termos; `0c7babf` perguntas para o advogado.

## 2. O que o release publica e o que fica desligado

**Publicação informativa (este release):** somente TOUR-01 (Cristo Redentor + Escadaria Selarón + Pão de Açúcar), TOUR-02
(Rocinha) e TOUR-03 (Centro Histórico e Cultural), em PT/EN/ES, com o design aprovado da página de passeio. Home,
cabeçalho e listagem mantêm o design atual. TOUR-04 e qualquer outro passeio respondem 404 e saem de Home, listagem e
sitemap. **Preços aprovados exibidos** (Owner, 01/11/2026; seção 14.1): tabela de totais por grupo na página de cada
passeio e a linha compacta aprovada nos cartões, sempre lidas das tabelas do código, nunca de `Trip.priceCents`. Vídeo do
Pão de Açúcar na página do TOUR-01. Contato por WhatsApp e e-mail.

**Desligado no release (sem mudança de código):** formulário de reserva (exige preço autorizado, hoje os três passeios,
**e** documentos jurídicos publicados, ainda não; a ação do servidor repete a checagem; **a autorização de exibir preços
não ativa reservas nem pagamentos**); formas de pagamento (não aparecem enquanto as reservas estiverem fechadas); API
antiga de reservas (bloqueada para os três passeios); formulário /contato e formulário legado
(pausados, página e ação); /termos e /privacidade (404); laboratório (404 em todo deploy da Vercel salvo
`REBUILD_LAB_ENABLED`); pagamentos online/PIX/gateway (inexistentes; sprint separada); Daniela (desligada).

**Ativação de reservas e pagamentos (release futuro, separado):** exige Termos e Política aprovados pela revisão jurídica
e publicados, identificação legal completa (seção 8), homologação das tabelas no registro de reservas e, para pagamento
online, a sprint de PIX.

## 3. Verificação P6 (conteúdo aprovado renderizado nas 9 páginas, 01/11)

| Passeio | Duração | Caminhada / escadas / ladeiras | Condição física e acessibilidade | Resultado |
|---|---|---|---|---|
| TOUR-01 | "Aproximadamente 8 horas" | caminhadas curtas, filas, escadas na Selarón | mobilidade reduzida: falar com a equipe antes de reservar | OK nas 3 línguas |
| TOUR-02 | "Aproximadamente 3 horas" | dois trajetos de mototáxi, caminhada, ladeiras e escadas | 18+; "não é adequada para todas as pessoas"; avaliação prévia | OK nas 3 línguas |
| TOUR-03 | "Roteiros de 4 ou 6 horas" + paradas com minutos | predominantemente a pé, ritmo adaptável | veículo sem adaptação para cadeira de rodas; avaliação individual | OK nas 3 línguas |

Nenhuma correção necessária. Observações não bloqueantes (mudam conteúdo aprovado; só com decisão do Owner): TOUR-01 não
diz, como o TOUR-03, que o veículo próprio não é adaptado para cadeira de rodas; a hora adicional de busca do TOUR-03
aparece na FAQ, não na ficha.

## 4. Consistência comercial durante o deploy (revisão do Owner, item 1)

### 4.1 Risco confirmado
- O site em produção (`26ece27`) lê `Trip.title`, `Trip.description`, `Trip.imageUrl` e **`Trip.priceCents`** e mostra o
  preço antigo por pessoa nos cartões e na página do passeio. Conferido por HTTP em 01/11: a página do TOUR-03 em
  produção mostra "Confeitaria Colombo + City Tour Rio" e **R$ 245,00**; TOUR-04 responde 200.
- O procedimento anterior escrevia os novos títulos e descrições em `Trip` (plano A) **antes** do merge. Nessa janela, o
  site antigo exibiria o título novo com o preço, a foto e os destaques antigos: oferta inconsistente. O rollback de
  código (voltar o deploy na Vercel) também deixaria o site antigo com os títulos novos e os preços antigos.
- O que é seguro: as migrations e a carga RT-119 só criam e escrevem tabelas novas (`TripContent`, `TripItineraryStop`,
  `TripFaqItem`, `TripImage` e as de reserva), que o código em produção não lê. A aprovação também só escreve nessas
  tabelas. **A única escrita visível para o site antigo é o plano A em `Trip`.**

### 4.2 Opção R — IMPLEMENTADA LOCALMENTE (autorização do Owner, 01/11/2026; sem commit)
O catálogo novo mostra, para os três passeios, o nome e o resumo aprovados que estão no código
(`lib/catalog/launch-trip-copy.ts`: nome = `PROTOTYPE_OFFER.titleByLocale`; resumo = o mesmo resumo que a carga RT-119
grava) e a capa própria (`OWN_TOUR_COVERS`). A troca acontece na leitura pública (`lib/catalog/public-trips.ts`,
`getPublicTrips` e `getPublicTripById`); as linhas de `Trip` não são alteradas. Se o texto aprovado faltar, o passeio sai
do catálogo em vez de aparecer com o texto antigo.
- Até o merge, o site antigo continua exatamente como está hoje (nenhum dado que ele lê é alterado).
- Depois do merge, o site novo mostra apenas o conteúdo aprovado, com os preços aprovados lidos do código (nunca o preço
  antigo de `Trip`).
- Rollback de código devolve exatamente o site de hoje, sem mistura.

### 4.3 Dependências verificadas

| Superfície | Origem do texto depois da opção R | Verificação |
|---|---|---|
| Home (seção de experiências) | `getPublicTrips` → nome e resumo aprovados, capa própria | teste `rt-s11-option-r-public-copy` (PT/EN/ES) e HTTP no ensaio |
| Listagem `/tours` e busca | idem; a busca procura no texto aprovado (busca pelo nome antigo não encontra nada) | mesmo teste e HTTP |
| Página do passeio | conteúdo aprovado no banco (`getPublicTourPresentation`); sem aprovação válida, estado neutro | gate `http` 9/9 |
| Metadados e JSON-LD da página do passeio | título e resumo da apresentação aprovada; estado neutro sem JSON-LD e com `noindex` | já não liam `Trip.title` (conferido no código) |
| Sitemap e `/api/trips` | `getPublicTrips` (só ids e dados públicos já trocados) | sitemap no ensaio HTTP: só os três passeios |
| Aprovação e invalidação | `approveTourContent` nunca escreve `Trip`; o script de aprovação deixou de exigir o plano A e agora **falha** se os campos de `Trip` mudarem durante a aprovação | ensaio (seção 4.5) |
| Scripts de carga | `rt-119-load-content.ts` escreve só as tabelas RT-113 | teste estático: nenhum `.trip.update/upsert/create/delete` nos scripts, na carga e na aprovação |
| Plano A | `scripts/s11-launch-trip-copy.ts` **removido**; função `tripCopyDiff` removida | teste: o arquivo não existe |
| Gate de publicação | sem mudança (já conferia Home, listagem, sitemap, TOUR-04, R$ e mídias antigas) | gate `code` GO; gate `http` GO 9/9 |

Usos restantes de `Trip.title`: e-mails e telas de reservas/admin (não são o catálogo público e não mostram preço ao
visitante); o formulário legado de pedido está pausado. Ficam como estão.

### 4.4 Rollback considerando os dados comerciais (opção R)

| Situação | Ação | Estado comercial depois |
|---|---|---|
| Problema no código depois do merge | Instant Rollback da Vercel para o deploy anterior | Igual ao de hoje (títulos e preços antigos, que já estão no ar); nada a restaurar no banco |
| Conteúdo errado em um passeio | A página cai sozinha no estado neutro se a aprovação for invalidada; corrigir na origem, recarregar e reaprovar | Sem oferta antiga; contato por WhatsApp |
| Migrations precisam ser revertidas | Não é o caminho padrão (seção 6.1). Último recurso: restauração do backup (teste de restauração na seção 6.2) | Igual ao de hoje |

### 4.5 Ensaio da opção R (01/11/2026, banco local descartável `rt_s11_optr`)
1. Banco novo com as 9 migrations e as linhas de `Trip` iguais às de produção (títulos, descrições, imagens e preços
   antigos), mais TOUR-04 e um produto aposentado.
2. Hash dos campos de `Trip` lidos pelo site atual (id, título, descrição, imagem, preço, destaques, `updatedAt`):
   `bc709e45…` **antes**.
3. Carga oficial dos três passeios (`--apply`) e aprovação oficial (`--apply --confirm-owner-approval`), **sem nenhum
   passo em `Trip`**: os três conteúdos ficaram `OWNER_APPROVED`; o próprio script registrou `2491af83… -> 2491af83…`.
4. Hash de `Trip` **depois** da carga e da aprovação: `bc709e45…` (idêntico); e de novo depois de servir as páginas:
   idêntico.
5. Build de produção e servidor local sobre esse banco: **gate `http` GO 9/9**. Home (PT/ES) e listagem (PT/EN) com os
   três nomes aprovados, sem texto, capa ou preço antigo; sitemap sem passeio antigo; TOUR-04 e o produto aposentado
   com 404.

## 5. Isolamento Preview / Production (revisão do Owner, item 2)

### 5.1 Verificado em 01/11 (somente leitura)

| Item | Evidência | Situação |
|---|---|---|
| Projeto Vercel | `rick-travel` (`prj_Euy5…`), conta `devricardo90s-projects`; é o projeto ligado ao repositório local (`.vercel/project.json`) | Confirmado |
| Produção servida pela Vercel | `www.ricardotour.com` responde com `Server: Vercel` | Confirmado |
| Laboratório em Production | a rota `/rebuild-lab` existe no código publicado e responde **404** em produção, assim como `/termos` e `/privacidade` | Indica que `REBUILD_LAB_ENABLED` não está ativo em Production (evidência indireta) |
| Branch de produção, commit publicado, variáveis por ambiente, plano da Vercel | Leitura recusada: o conector da Vercel não tem acesso à conta (403). Dois links de autorização foram enviados ao Owner em 01/11 e não foram aprovados durante o trabalho | **Não verificado** |
| Bancos do Preview e da Production (Neon) | Não há acesso de leitura ao Neon nesta sessão | **Não verificado** |

Registro anterior (22/10, Sprint 10; precisa ser reconfirmado, não é evidência de hoje): Preview passou a ter projeto Neon
próprio (`ricardotour-preview-pg17`); `DATABASE_URL`, `BETTER_AUTH_SECRET` e `RESEND_API_KEY` foram restritas a
Production; o Owner precisava cadastrar manualmente `DATABASE_URL` e `BETTER_AUTH_SECRET` de Preview; 14 deploys de
Preview antigos ainda carregavam variáveis de produção (protegidos pela Vercel Authentication).

### 5.2 O que o Owner deve verificar no painel (sem copiar valores para ninguém)
Vercel → projeto `rick-travel`:
0. **Settings → Billing** (da conta): plano atual (Hobby ou Pro). Hobby é para uso não comercial; decisão do Owner.
1. **Settings → Git**: branch de produção = `main`.
2. **Deployments**, filtro Production: o deploy atual é do commit `26ece27`.
3. **Settings → Environment Variables**: para `DATABASE_URL`, `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, conferir que a
   variável de **Production** está marcada só em Production e que existe uma variável separada para **Preview** (de
   outro banco). Nenhuma variável com valor de produção marcada em Preview/Development.
4. Na mesma tela: `REBUILD_LAB_ENABLED` **não existe** em Production (ou está como `false`).
5. **Deployments**, filtro Preview: os deploys antigos que ainda usam variáveis de produção continuam protegidos ou
   são removidos.

Neon:
6. O host do banco de Production e o do banco de Preview são **projetos diferentes** (ou branches diferentes): basta
   comparar o nome do projeto e do endpoint mostrados no painel, sem copiar senhas.
7. O plano do Neon de Production oferece restauração para um ponto no tempo (anotar o período disponível).
8. A versão do PostgreSQL de Production (para usar `pg_dump`/`pg_restore` da mesma versão ou mais nova no backup).

Alternativa: aprovar o link de acesso do conector da Vercel; os itens 1 a 5 então podem ser lidos sem expor valores.

## 6. Revisão das 9 migrations (revisão do Owner, item 3)

Resultado geral, conferido instrução por instrução: **nenhuma** migration remove ou renomeia tabela, coluna, restrição,
índice ou chave; nenhuma altera tipo de coluna; nenhuma reescreve registros existentes. As únicas instruções `UPDATE`
estão dentro de funções de gatilho e só atuam em `TripContent` (tabela nova).

| # | Migration | Tabelas existentes afetadas | Impacto nos registros existentes | Compatível com o código em produção? | Recuperação |
|---|---|---|---|---|---|
| 1 | `20261013120000_rt100_operation_type_partner_commercial` | `Trip`: coluna `operationType` (NOT NULL com DEFAULT `UNCLASSIFIED`), coluna `partnerId` (nula), índice, FK `partnerId → Partner` (RESTRICT), CHECK `Trip_partner_consistency_check`. Cria 5 tipos e as tabelas vazias `Partner`, `TripCommercial` (FK para `Trip`, RESTRICT), `TripCommercialRate` | Todos ficam `UNCLASSIFIED` e `partnerId` nulo, o que satisfaz o CHECK. O DEFAULT constante não reescreve a tabela | Sim: o código atual não envia essas colunas; inserts recebem o DEFAULT. Excluir um `Trip` só seria bloqueado se ele tivesse linha em `TripCommercial` (o release não cria nenhuma) | SQL de rollback documentado no cabeçalho |
| 2 | `20261016120000_rt113_tour_content_gallery` | Nenhuma alterada. Cria `TripContent`, `TripItineraryStop`, `TripImage` (FKs para `Trip` com CASCADE), 2 tipos, CHECKs | Nenhum | Sim (o código atual não lê essas tabelas). Excluir um `Trip` passa a excluir também o conteúdo dele | Rollback documentado no cabeçalho |
| 3 | `20261017180000_rt113_faq_conditions_media` | Nenhuma existente (colunas novas em `TripContent`/`TripImage`, criadas na #2). Cria `TripFaqItem` (CASCADE) e tipo `TripMediaType` | Nenhum | Sim | Reversão específica não necessária (6.1); último recurso: backup |
| 4 | `20261017200000_rt113_approval_fingerprint` | Nenhuma existente (coluna e CHECK em `TripContent`) | Nenhum | Sim | Reversão específica não necessária (6.1); último recurso: backup |
| 5 | `20261017220000_rt113_durable_approval_media_publication` | `Trip`: **gatilho** `rt_trip_public_guard` (AFTER UPDATE; não escreve em `Trip`). Colunas e CHECK em tabelas novas; funções e gatilhos em `TripContent`, `TripItineraryStop`, `TripFaqItem`, `TripImage` | Nenhum. Efeito futuro: alterar título, descrição, destaques, imagem, cidade, local, duração, nível físico, crianças ou lotação de um passeio **aprovado** rebaixa a aprovação (a página nova volta ao estado neutro) | Sim: o código atual pode editar `Trip` normalmente; o gatilho só mexe em `TripContent`. O admin antigo editando um dos 3 passeios depois do release invalida a aprovação | Reversão específica não necessária (6.1); último recurso: backup |
| 6 | `20261025120000_rt124_private_group_booking` | `Booking`: colunas nulas `fullFareCount`, `infantCount`, `pricingModel`; CHECK `Booking_private_group_check`. Cria `BookingQuote`, `BookingContact`, `BookingEvent` (FKs para `Booking`, CASCADE), gatilhos de imutabilidade | Reservas antigas ficam com as 3 colunas nulas, o que satisfaz o CHECK (a validação percorre a tabela uma vez) | Sim: o código atual não envia as colunas novas, que ficam nulas | Reversão específica não necessária (6.1); último recurso: backup |
| 7 | `20261025180000_rt125_manual_booking_payments` | Nenhuma alterada. Cria `BookingPayment` e `BookingPaymentEvent` (FKs para `Booking`, **RESTRICT**), gatilhos de proteção | Nenhum | Sim. Efeito futuro: uma reserva com pagamento registrado não pode ser excluída | Reversão específica não necessária (6.1); último recurso: backup |
| 8 | `20261027120000_rt124_guest_booking_contact_email` | Nenhuma existente (coluna em `BookingContact`, criada na #6) | Nenhum | Sim | Reversão específica não necessária (6.1); último recurso: backup |
| 9 | `20261031120000_rt81_terms_acceptance` | Nenhuma existente (3 colunas nulas em `BookingQuote`, criada na #6) | Nenhum | Sim | Reversão específica não necessária (6.1); último recurso: backup |

Bloqueios durante a aplicação: `ADD CONSTRAINT` (FK e CHECK) em `Trip` e `Booking` bloqueia brevemente essas tabelas
enquanto confere as linhas existentes; com o volume atual, a duração esperada é de milissegundos. Aplicar fora de horário
de movimento.

### 6.1 Necessidade de SQL reverso, migration por migration (decisão do Owner: não criar sem demonstrar)

Critério: uma reversão específica só é necessária se, depois de voltar o código (Instant Rollback), o schema novo
impedir o site anterior de funcionar ou afetar registros existentes. Resultado:

| # | O schema novo atrapalha o código anterior? | Reversão específica necessária? |
|---|---|---|
| 1 rt100 | Não. Inserts sem as colunas novas recebem o DEFAULT; o CHECK é satisfeito pelos registros atuais (demonstrado na 6.2) | Não (rollback já documentado, se um dia for preciso) |
| 2 rt113 | Não. Tabelas novas, ignoradas pelo código anterior; excluir um `Trip` apaga o conteúdo novo junto (CASCADE), o que não afeta o site anterior | Não |
| 3 rt113 | Não (só tabelas novas) | Não |
| 4 rt113 | Não (só tabela nova) | Não |
| 5 rt113 | Não. O gatilho em `Trip` só escreve em `TripContent`; editar e excluir `Trip` funciona (demonstrado na 6.2) | Não |
| 6 rt124 | Não. Reservas antigas e novas inserções do código anterior ficam com as colunas novas nulas e passam no CHECK (demonstrado na 6.2) | Não |
| 7 rt125 | Não. Só bloqueia excluir uma reserva com pagamento registrado, que só existe se o fluxo novo for usado | Não |
| 8 rt124 | Não (só tabela nova) | Não |
| 9 rt81 | Não (só tabela nova) | Não |

Conclusão: **nenhuma migration exige SQL reverso específico.** A recuperação prioriza, nesta ordem: backup com teste de
restauração; compatibilidade com o código anterior (demonstrada); rollback de deployment; preservação dos registros
existentes (nenhuma migration os reescreve). Se algum dia for necessário remover o schema novo, o caminho é a
restauração do backup feito no passo 7 (seção 7), aceitando perder o que foi gravado depois.

### 6.2 Evidências (banco local descartável com as 9 migrations e o conteúdo aprovado)

Compatibilidade com o código publicado (escritas no formato do código de `26ece27`, numa transação desfeita no fim):
- inserir `Trip` sem as colunas novas: OK (`operationType = UNCLASSIFIED`, `partnerId` nulo);
- inserir e atualizar `Booking` sem as colunas novas: OK (`pricingModel` nulo, CHECK satisfeito);
- alterar o preço de um passeio aprovado: OK, a aprovação continua;
- alterar o título de um passeio aprovado: OK, e a aprovação é rebaixada (`Trip public field changed after approval`),
  como documentado;
- excluir `Booking` e `Trip` (inclusive um produto antigo): OK;
- `ROLLBACK` ao final: o conteúdo do TOUR-03 voltou a `OWNER_APPROVED`.

Teste de backup e restauração (`pg_dump -Fc` → `pg_restore` num banco novo): restauração sem erro; origem e cópia
idênticas em contagens (5 `Trip`, 3 aprovações, 17 mídias), gatilhos (12), CHECKs (29), impressão digital das
aprovações e hash dos campos de `Trip`. Em produção: usar `pg_dump`/`pg_restore` da mesma versão do PostgreSQL do Neon ou
mais nova (seção 5.2, item 8), além do ponto de restauração do Neon.

## 7. Sequência de publicação corrigida (opção R; cada etapa hospedada = autorização escrita do Owner)

**Fase 0 — Correções locais**
1. Opção R: **feita** localmente e ensaiada (seção 4.5); falta o commit, com autorização.
2. SQL reverso: **não necessário** (seção 6.1).
3. Identificação legal: preparada e desligada (seção 8); publicar só depois do Cartão CNPJ e do parecer.

**Fase A — Validação isolada (Preview)**
3. Owner confirma os itens da seção 5.2. Sem isolamento confirmado: NO-GO.
4. Banco de **Preview**: migrations, carga RT-119, aprovação (sem passo em `Trip`). A liberação da trava dos scripts para o host de Preview é
   uma alteração separada, explícita e autorizada (as travas não são removidas automaticamente).
5. Push **apenas** do branch do release, para gerar o Preview.
6. Gate `http` no Preview: GO 9/9. Revisão independente do diff. Conferência visual do Owner.

**Fase B — Produção**
7. Backup: ponto de restauração do Neon (anotar horário) **e** `pg_dump -Fc` com SHA-256, restaurado num banco local
   com contagens conferidas (`Trip`, `TripSchedule`, `Booking`, `User`), como no teste da seção 6.2.
8. Pré-checagens de leitura: quais das 9 migrations faltam em `_prisma_migrations`; contagens; hash dos campos de `Trip`
   (mesma consulta do ensaio).
9. Migrations, na ordem da seção 6. O site atual continua igual (seção 6, compatibilidade).
10. Carga RT-119 dos três passeios e aprovação. O site atual continua igual (só tabelas novas).
11. Conferência de leitura: hash dos campos de `Trip` idêntico ao do passo 8.
12. Merge em main do commit validado no Preview (deploy automático), sem commit novo no meio.
13. Gate `http` em `https://www.ricardotour.com`: GO 9/9. Conferência visual do Owner. Em caso de NO-GO: Instant
    Rollback (seção 4.4).

## 8. Identificação legal e cadastral (revisão do Owner, item 4)

O site apresenta ofertas turísticas mesmo sem pagamento online: não se presume que o lançamento informativo dispense a
identificação do fornecedor. A revisão jurídica continua pendente.

| Item (Decreto 7.962/2013, art. 2º, e CDC) | Situação hoje | Classificação |
|---|---|---|
| Razão social oficial | Conferida em 28/10 (registro público), mas **não aparece no site**; a Política ainda diz "a confirmar" | BLOQUEANTE até decisão do advogado sobre exibição |
| CNPJ | 49.142.341/0001-90, confirmado pelo Owner; **não aparece no rodapé** (só o selo Cadastur) | BLOQUEANTE até decisão do advogado |
| Endereço | Rua Projetada, nº 8, Centro, Itaocara – RJ (CEP 28570-000, declarado em 29/10). **Dados fornecidos pelo Owner. Validação documental pendente.** O registro público indica o bairro Cidade Nova; não há Cartão CNPJ entre os documentos existentes (Q1 ao advogado) | Autorização do Owner: registrada. Validação documental: BLOQUEANTE para exibir a identificação |
| Canal eletrônico de atendimento | E-mail e WhatsApp publicados no site | Atendido (confirmar com o advogado) |
| Conformidade com o art. 2º | Depende do advogado: se a identificação é exigida no lançamento informativo e em que forma (rodapé, página "Sobre") | BLOQUEANTE até parecer |

**Preparado (decisões do Owner, 01/11/2026; sem commit):** `lib/legal/company-identification.ts` reúne razão social do
registro, CNPJ, o endereço fornecido pelo Owner e o e-mail público, com `ADDRESS_STATUS` = "Dados fornecidos pelo Owner.
Validação documental pendente." A autorização do Owner fica separada da validação jurídica: o rodapé tem uma linha de
identificação que **só aparece quando a validação documental for registrada** (`addressValidatedOn`). Hoje nada é
exibido, nem uma identificação parcial (teste `rt-s11-company-identification`, PT/EN/ES). O endereço não é mais perguntado
ao Owner; falta só a conferência documental e o parecer sobre forma e obrigatoriedade no lançamento informativo.

## 9. Validação independente

- Revisão de código do diff `26ece27..0c7babf` mais as alterações da opção R, por quem não escreveu o código (outra sessão ou
  pessoa), com foco em: o que muda para visitantes, rotas públicas novas, ações do servidor e gates. **Primeira rodada
  feita em 01/11 por um revisor em sessão nova, sem o contexto do trabalho (somente leitura; tsc limpo; 1160 testes
  aprovados): nenhum achado BLOQUEANTE.** Achados NÃO BLOQUEANTES e tratamento:
  1. O cartão mostrava `Trip.location` da linha antiga, só em português. **Resolvido** (Owner, 01/11/2026: manter,
     traduzido): local aprovado no código em PT/EN/ES (seção 14.4), sem alterar `Trip`.
  2. Os cartões mostram o texto aprovado mesmo se a aprovação no banco cair (a página de detalhe fica neutra e continua no
     sitemap). Nenhum texto antigo aparece; incoerência aceita como menor risco que mostrar texto antigo.
  3. O hash do script de aprovação não incluía `updatedAt`, ao contrário do que o procedimento dizia: **corrigido**
     (inclui `location` e `updatedAt`; reensaio: hash igual antes e depois, `Trip` intacto). A checagem detecta depois
     da escrita, não impede; nenhum código do fluxo escreve `Trip` (conferido).
  4. `public-trips.ts` passa a importar o mock de forma indireta (só no servidor; nada vai ao navegador). Comentários do
     mock e do teste sobre "rotas públicas" ficaram desatualizados; sem efeito para o visitante.
  5. A linha de identificação dependia só da data de confirmação: **corrigido** (exige os quatro campos preenchidos;
     teste cobre campo vazio). O endereço atual é o declarado; o procedimento de publicação manda trocá-lo antes da data.
  6. Ação antiga `submitContactForm` sem gate, mas sem nenhum uso (não alcançável; já existe em produção hoje). Os
     bloqueios de formulário dependem de `REBUILD_LAB_ENABLED` estar desligado em Production (já no checklist).
- Gate `http` executado contra o Preview e, depois, contra produção.
- Conferência visual do Owner, com a lista da seção 10.

## 10. Checklist GO/NO-GO

GO somente se **todos** os itens forem verdadeiros:
- [x] Opção R aplicada e ensaiada localmente (gate `http` GO 9/9, `Trip` intacto) — falta o commit autorizado.
- [x] Necessidade de reversão das migrations avaliada: nenhuma exige SQL reverso (seção 6.1); compatibilidade e
  restauração demonstradas localmente (seção 6.2).
- [x] Endereço informado pelo Owner (registro: "Dados fornecidos pelo Owner. Validação documental pendente.").
- [ ] Validação documental do endereço e identificação legal resolvida conforme o parecer do advogado (seção 8).
- [ ] Gate `http` verifica preços (totais da tabela do Owner por tamanho de grupo e duração), vídeo do TOUR-01, ausência
  de preço antigo, de JSON-LD Offer, de formas de pagamento e de formulário de reserva — critério já implementado; GO
  local 9/9 em 01/11 (seção 14); falta no Preview e em produção.
- [ ] Isolamento Preview/Production e plano da Vercel confirmados pelo Owner (seção 5.2, itens 0 a 8).
- [ ] `REBUILD_LAB_ENABLED` ausente ou `false` em Production.
- [x] Revisão independente local sem achado bloqueante (seção 9); revisão das alterações de 01/11: seção 14.6.
- [ ] Gate `http` GO 9/9 no Preview; conferência visual do Owner aprovada.
- [ ] Backup feito e restaurado com contagens conferidas.
- [ ] Os 3 registros de `Trip` idênticos antes e depois das migrations e da carga.
- [ ] Commit do merge = commit validado no Preview; `origin/main` ainda em `26ece27`.
- [ ] Gate `http` GO 9/9 em produção depois do merge.

NO-GO imediato: qualquer FAIL do gate; página de passeio em "Passeio em atualização" depois da aprovação; preço diferente
da tabela aprovada, preço antigo de `Trip`, título, foto ou oferta antiga visível no site novo; forma de pagamento citada; formulário que colete dados visível; erro 5xx; diferença inesperada
nos registros de `Trip`.

## 11. Riscos de regressão

- Edição dos três passeios no admin depois do release invalida a aprovação e a página volta ao estado neutro (gatilho da
  migration #5). Regra operacional: não editar esses campos sem reaprovar.
- Preview sem banco próprio poderia escrever em produção (seção 5).
- Commits novos em main entre a validação e o merge invalidam a validação.
- O admin passa a ter as telas de reservas privativas (RT-124) e pagamentos manuais (RT-125), sem uso público enquanto
  as reservas não abrem; não amplia o admin além do aprovado.
- Preços passam a aparecer: um preço errado seria visível ao público. Mitigação: o gate compara com a tabela do Owner
  digitada no próprio gate (não lida do código que ele confere) e falha em qualquer valor fora dos aprovados.
- O vídeo do Pão de Açúcar entra na página do TOUR-01 (17 s, sem áudio, `preload="none"`); só aparece se o registro de
  mídia passar pelo gate de conteúdo.

## 12. Pendências

| Pendência | Responsável | Classificação |
|---|---|---|
| Commit local da opção R e da identificação legal preparada | Owner (autorização) | BLOQUEANTE |
| Verificação do painel Vercel/Neon (seção 5.2) ou aprovação do acesso de leitura do conector | Owner | BLOQUEANTE |
| Validação documental do endereço (Q1); o endereço em si já foi informado pelo Owner | Validação documental / advogado | BLOQUEANTE para exibir a identificação |
| Forma e obrigatoriedade da identificação no lançamento informativo (art. 2º do Decreto 7.962) | Advogado | BLOQUEANTE |
| Liberação explícita da trava dos scripts para o host de Preview e, no release, para produção | Owner | BLOQUEANTE |
| Escritas no banco de Preview, push do branch, backup, migrations, carga, aprovação e merge em produção | Owner | BLOQUEANTE |
| Revisão independente do diff | Validação | Feita (local), sem bloqueante; alterações de 01/11 revisadas à parte (seção 14.6) |
| Catálogo informativo sem a Política de Privacidade publicada (produção já está assim; formulários pausados) | Advogado | A DEFINIR PELO ADVOGADO |
| Termos e Política: Q8, Q11, Q3, Q5, bases legais | Advogado | NÃO BLOQUEANTE para o catálogo informativo; BLOQUEANTE para reservas |
| TOUR-01 sem a frase do veículo não adaptado; hora adicional do TOUR-03 na ficha | Owner (conteúdo) | NÃO BLOQUEANTE |
| Plano Hobby da Vercel com uso comercial (registrado em 14/10) | Owner | NÃO BLOQUEANTE para o código |

## 13. Alterações locais desta etapa (sem commit)

| Arquivo | Mudança |
|---|---|
| `lib/catalog/launch-trip-copy.ts` | texto aprovado dos cartões lido só de dados do código (sem banco nem arquivos); `withApprovedCopy`; `tripCopyDiff` removida |
| `lib/catalog/public-trips.ts` | leitura pública dos três passeios com capa própria + nome e resumo aprovados (`toPublicRow`) |
| `scripts/s11-approve-launch-content.ts` | sem exigência do plano A; falha se os campos de `Trip` mudarem durante a aprovação |
| `scripts/rt-119-load-content.ts` | só o comentário (escreve apenas as tabelas RT-113) |
| `scripts/s11-launch-trip-copy.ts` | removido (plano A) |
| `lib/legal/company-identification.ts`, `components/site/site-footer.tsx` | identificação legal preparada; endereço "Dados fornecidos pelo Owner. Validação documental pendente."; linha desligada até a validação |
| `tests/rt-s11-option-r-public-copy.test.tsx` (novo), `tests/rt-s11-launch-load.test.ts` | opção R sobre as linhas antigas de produção; plano A fora |
| `tests/rt-s11-company-identification.test.tsx` (novo) | endereço e CNPJ do Owner; nada exibido sem a validação documental |
| `lib/catalog/price-on-request.ts`, `lib/catalog/public-tour-presentation.ts`, `lib/catalog/payment-text.ts` (novo) | lista de publicação de preços com os três passeios; linha de preço aprovada nos cartões; formas de pagamento omitidas até `PAID_BOOKINGS_OPEN` |
| `components/site/tour/content/tour-detail-prototype.tsx` | tabela pública sem avisos nem selos de laboratório; nota sem formas de pagamento |
| `lib/catalog/mock/tour-content.mock.ts` | vídeo do Pão de Açúcar CONFIRMED; status de preço do TOUR-01/02 CONFIRMED (textos aprovados em 30/10) |
| `lib/catalog/launch-trip-copy.ts`, `components/site/tours/public-tour-card.tsx`, `components/experiences-in-rio-section.tsx` | local traduzido nos cartões |
| `scripts/s11-release-gate.ts` | gate B verifica os preços corretos, o vídeo e a ausência de reservas/pagamentos |
| `tests/rt-s11-owner-decisions-2026-11-01.test.tsx` (novo), `tests/rt-112-price-on-request.test.tsx`, `tests/rt-s10-public-tour-presentation.test.tsx`, `tests/rt-s11-option-r-public-copy.test.tsx` | preços por grupo e modalidade, vídeo e local nas três línguas; testes antigos de "nenhum preço" substituídos |
| `tests/rt-s11-contact-form-paused.test.tsx`, `tests/rt-s11-tour-request-paused.test.tsx` | tempo limite de 60 s (renderização de página sob carga paralela) |
| `docs/ops/rt-s11-catalog-release-procedure.md`, este documento | procedimento sem o passo em `Trip`; critérios do gate e decisões de 01/11 |

Estabilidade da suíte: com paralelismo máximo, cada execução teve 1 ou 2 falhas por tempo limite, sempre em arquivos
diferentes e não alterados (`ai-concierge-launch`, `rate-limit-upstash`), que passam isoladamente; com 3 workers a suíte
completa passou sem falhas (1160 testes).

## 14. Correção das decisões do Owner (01/11/2026)

Registro no Jira: RT-121 #13571 (preços), RT-116 #13572 (vídeo), RT-81 #13573 (endereço), RT-119 #13574 (pacote),
RT-120 #13575 (gate). Nenhum ticket novo; nenhuma outra decisão comercial alterada; opção R preservada (nenhuma escrita
em `Trip`, nenhum plano A, nenhuma migration hospedada, nenhuma alteração no Neon).

### 14.1 Preços — exibição pública AUTORIZADA
Totais por grupo privativo, aprovados em 28/10/2026 (não são preço por pessoa × N):

| Passeio | 1 | 2 | 3 | 4 |
|---|---|---|---|---|
| TOUR-01 | R$ 1.200 | R$ 1.700 | R$ 2.200 | R$ 2.600 |
| TOUR-02 | R$ 450 | R$ 580 | R$ 690 | R$ 780 |
| TOUR-03 4 h | R$ 650 | R$ 760 | R$ 900 | R$ 1.040 |
| TOUR-03 6 h | R$ 890 | R$ 1.000 | R$ 1.140 | R$ 1.280 |

- Conferidos com o Jira (RT-121 #13554 e #13545) e com as tabelas aprovadas no código: iguais; nada recalculado.
- Divergência resolvida pela decisão mais recente: a tabela de 6 h do TOUR-03 constava como aprovada na Ficha v1.0, mas
  fora da diretiva RT-121 (#13545); a decisão de 01/11 a inclui expressamente.
- Restrição "Nenhum preço em R$" removida do pacote e do gate.
- Não ativa reservas nem pagamentos: formulário público desligado (documentos jurídicos não publicados), API antiga
  bloqueada, formas de pagamento omitidas, tabelas de TOUR-01/02 e TOUR-03 6 h ainda fora do registro de reservas.

### 14.2 Vídeo do Pão de Açúcar — publicação AUTORIZADA no TOUR-01
Status CONFIRMED. Verificação técnica: três arquivos versionados (mp4, mp4 mobile, poster), H.264 720×1280, 17 s, sem
áudio, sem metadados de localização. Direitos: vídeo próprio, declaração do Owner de 28/10/2026 (RT-116), carregado como
OWNER_ATTESTED. Publicado só pelo gate de conteúdo. O hash do conteúdo aprovado não muda.

### 14.3 Endereço
Rua Projetada, nº 8, Centro, Itaocara – RJ; CNPJ 49.142.341/0001-90. **Dados fornecidos pelo Owner. Validação documental
pendente.** Os documentos existentes não trazem o Cartão CNPJ; o registro público indica Cidade Nova. A validação
documental/jurídica não está marcada como concluída.

**Conferência oficial (Owner 02/11/2026, autorizou usar o endereço do cadastro do CNPJ):**
- Serviço oficial de emissão do Comprovante de Inscrição e de Situação Cadastral (solucoes.receita.fazenda.gov.br,
  `cnpjreva`): o acesso automatizado não devolve os dados (só o cabeçalho da página; a consulta exige verificação
  interativa). **Limitação registrada.**
- Tentativa nos dados abertos oficiais da Receita (lote 2026-10) interrompida por ordem do Owner (volume de vários GB). Um
  registro parcial foi lido antes da interrupção (Rua Projetada, 8, bairro Cidade Nova, CEP 28570-000, RJ), mas com o início
  da linha (o CNPJ) corrompido: **não é usado como evidência** e não substitui nada.
- Documento oficial necessário: **Cartão CNPJ** (Comprovante de Inscrição e de Situação Cadastral) emitido pelo Owner.
  Com ele: aplicar exatamente logradouro, número, complemento, bairro, município, UF e CEP em
  `lib/legal/company-identification.ts` (PT/EN/ES usam a mesma linha), registrar fonte e data em `addressValidatedOn`,
  atualizar RT-81. Até lá o endereço fica como está, com o status "Dados fornecidos pelo Owner. Validação documental
  pendente.", e a linha de identificação continua desligada.
- O parecer jurídico sobre a apresentação obrigatória dos dados (Decreto 7.962/2013, art. 2º) é questão separada.

### 14.4 Local nos cartões (manter, traduzido)
| Passeio | PT | EN | ES |
|---|---|---|---|
| TOUR-01 | Rio de Janeiro | Rio de Janeiro | Río de Janeiro |
| TOUR-02 | Rocinha, Rio de Janeiro | Rocinha, Rio de Janeiro | Rocinha, Río de Janeiro |
| TOUR-03 | Centro Histórico do Rio de Janeiro | Historic Center of Rio de Janeiro | Centro Histórico de Río de Janeiro |

Lido do código (`approvedTripLocation`), sem alterar `Trip.location`.

### 14.5 Gate B atualizado e validação local
Gate B passa a exigir, por passeio e língua:
- os totais de cada tamanho de grupo e duração iguais à tabela 14.1, digitada no gate;
- nenhum valor fora dos aprovados daquele passeio;
- nenhum preço antigo de `Trip`;
- JSON-LD sem Offer;
- nenhum aviso nem selo de laboratório;
- nenhuma forma de pagamento em toda a página (também em Home e listagem);
- nenhum formulário de reserva;
- o vídeo no TOUR-01.

Nos cartões de Home e listagem, exige a linha de preço aprovada de cada passeio (valor por pessoa × 4 = total de 4 pessoas da tabela do Owner) e nenhum outro valor.

Resultados de 01/11:
- gate `code`: GO;
- ensaio no banco `rt_s11_optr` (build de produção): gate `http` **GO 9/9**;
- hash dos campos de `Trip`: `bc709e45…` antes e depois.

Validação: tsc limpo; contagens da suíte e do ESLint na seção 14.6.

### 14.6 Testes e revisão independente das alterações de 01/11
- tsc limpo; ESLint 0 erros (2 avisos antigos em `scripts/rt-35-chrome-validation.mjs`, não alterado); suíte completa
  (3 workers) **1165 aprovados / 0 falhas** em 01/11; **1166 / 0** em 02/11 após o ajuste do cartão TOUR-03 (58 pulados: testes ao vivo sem banco); gate `code` GO; gate `http` no ensaio
  `rt_s11_optr` **GO 9/9** depois das correções abaixo; hash de `Trip` `bc709e45…` inalterado.
- Revisão independente (sessão nova, somente leitura) só das alterações posteriores à revisão anterior:
  1. **BLOQUEANTE, corrigido:** selo de revisão "CONFIRMADO" ao lado do título "Valores" na página pública. Agora só no
     laboratório; teste e gate passam a falhar com qualquer selo de revisão (`data-status` CONFIRMED/PROVISIONAL/PENDING/MOCK).
  2. Corrigido: o gate procurava forma de pagamento só na tabela; agora em toda a página do passeio, Home e listagem.
  3. Corrigido: o filtro de forma de pagamento passa a cobrir cartão/card/tarjeta, transferência e boleto (com teste).
  4. Corrigido: formas de pagamento ficariam visíveis ao publicar os documentos jurídicos; agora dependem de
     `PAID_BOOKINGS_OPEN = false` (sprint PIX), independente da publicação jurídica.
  5. NÃO BLOQUEANTE, para o Owner: o cartão do TOUR-03 mostra "A partir de / R$ 260/pessoa" (texto aprovado em 21/10)
     sem dizer "grupo de 4 adultos, 4 h", ao contrário de TOUR-01/02 ("Grupo de 4 adultos"). **Resolvido por decisão do
     Owner (02/11/2026):** mantém o valor por pessoa com a condição explícita: cartão e barra móvel mostram
     "Grupo de 4 adultos · 4 h" / "R$ 260/pessoa" (EN "Group of 4 adults · 4 h" / "R$ 260/person"; ES "Grupo de 4 adultos ·
     4 h" / "R$ 260/persona"). A página do passeio mantém o resumo, a condição e a tabela completa (4 h e 6 h). Teste em
     `tests/rt-s11-owner-decisions-2026-11-01.test.tsx`.
  6. Corrigido: o gate confere que o valor por pessoa do cartão × 4 é igual ao total de 4 pessoas da tabela do Owner.
- Nenhum caminho leva `Trip.priceCents` ou forma de pagamento a página pública; nada abre reservas ou pagamentos.

## 15. Escopo real do release: o que os 113 commits levam à produção (conferido em 02/11/2026)

`git log origin/main..HEAD`: **113 commits** (7 merges) sobre a produção `26ece27`; `git log HEAD..origin/main`: **nenhum**
(a `main` não tem nada que a branch não tenha; o merge seria fast-forward). `git diff --stat origin/main HEAD`: 532 arquivos,
+29.602/−528, mais as 25 alterações locais desta etapa. Nada foi publicado, nenhum checkout/rebase/merge feito.

| Grupo | O que muda em produção | Efeito público com as travas atuais |
|---|---|---|
| A. Três passeios (escopo aprovado) | páginas TOUR-01/02/03, conteúdo aprovado do código (opção R), galerias e vídeo próprios (`public/media/tours`), preços aprovados, cards, `sitemap`, catálogo restrito aos três | **visível** (objetivo do release) |
| B. Segurança | RT-129 API de reservas (mesma origem, rate limit), RT-110 trava de reserva sem preço aprovado, RT-124 isolamento do e-mail reservado (`lib/auth.ts`), proxy recusa rotas de laboratório, cliente Resend preguiçoso, guarda RT-104 contra banco hospedado (scripts), Prisma 7.8.0 → 7.10.1 | invisível; endurece o que já existe |
| C. Motor de reservas/pagamentos/admin (RT-123/124/125, aprovado 28/10) | pedido de reserva privada, reserva temporária, calendário do guia, painel de pagamentos manuais no admin | formulário público **desligado** (`legalPagesPublished() = false`), formas de pagamento ocultas (`PAID_BOOKINGS_OPEN = false`); painel visível só para ADMIN |
| D. Jurídico | rotas `/termos` e `/privacidade`, aceite de termos, formulários de contato e de pedido pausados | rotas respondem **404** enquanto não publicadas; formulários ocultos |
| E. Laboratório | `rebuild-lab/*` (prévias de conteúdo, termos, galeria) | **404** em toda implantação Vercel, salvo se `REBUILD_LAB_ENABLED` estiver ligado (conferir na Preview: depende do acesso Vercel) |
| F. Limpeza de mídia | 22 arquivos legados sem referência removidos de `public/` | some do site; nenhum uso encontrado |
| G. Docs, testes, scripts, `docs/baseline` | sem efeito em tempo de execução (`docs/` não é servido) | nenhum |

**Fora do escopo comercial estrito (vão juntos):** grupos B a F. Nenhum deles é visível ao público com as travas atuais, mas
o grupo C amplia o admin (aprovado em 28/10) e exige as migrations. Separar seria refazer a branch (cherry-pick), o que é
uma nova frente; fica como decisão do Owner, não como ação automática.

**Migrations (9, todas aditivas — sem DROP/RENAME/re-tipo de colunas existentes):** `rt100_operation_type_partner_commercial`,
`rt113_tour_content_gallery`, `rt113_faq_conditions_media`, `rt113_approval_fingerprint`,
`rt113_durable_approval_media_publication` (gatilhos de invalidação da aprovação), `rt124_private_group_booking`,
`rt125_manual_booking_payments`, `rt124_guest_booking_contact_email`, `rt81_terms_acceptance`. Dependências: o código novo
lê essas tabelas/colunas, então precisam estar aplicadas **antes** do deploy; antes delas, backup do Neon e liberação
controlada da trava de scripts; depois delas, a carga e aprovação RT-119 (que depende das tabelas `rt113_*`). 8 têm
`rollback.sql`; `rt100` tem o rollback documentado no próprio arquivo.

## 16. Hospedagem no lançamento (Owner 02/11/2026)

- Arquitetura mantida (Vercel + Neon); nenhuma migração de hospedagem nesta sprint. Avaliação definitiva na **RT-131**
  (backlog, fora da Sprint 11, não autoriza migração nem contratação).
- Plano efetivamente usado: **não verificável por aqui** — a integração Vercel deste ambiente não enxerga a conta (nenhum
  time listado; usuário não encontrado). O plano Hobby da Vercel é restrito a uso pessoal não comercial; o site vende
  passeios, portanto é uso comercial.
- Menor ação, a cargo do Owner: no painel da Vercel, **Settings → Billing** do time dono do projeto do site. Se for Hobby,
  **Upgrade to Pro** nesse mesmo time (Pro é cobrado por membro). Sem mudar projeto, domínio, banco ou DNS. Confirmar antes
  da Preview/produção. É gate do release, não tarefa de desenvolvimento.
