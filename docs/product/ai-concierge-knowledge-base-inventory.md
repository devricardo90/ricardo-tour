# Rick Travel AI Concierge - Knowledge Base Inventory

## Objetivo do inventario

Este documento inventaria e classifica as fontes existentes que podem ou nao alimentar futuramente o Rick Travel AI Concierge. O objetivo e definir uma allowlist documental, registrar riscos e impedir que conteudo legado, privado, contraditorio ou sem evidencia seja tratado como conhecimento publico confiavel.

Este inventario nao cria base vetorial, embeddings, retrieval, chat, rota API ou runtime. Ele prepara uma futura etapa RAG controlada e somente leitura.

## Relacao com RT-AI-001

RT-AI-001 definiu o escopo, as regras de seguranca e a estrategia inicial de RAG do Rick Travel AI Concierge:

- `docs/product/ai-concierge-scope.md` define respostas permitidas, bloqueios, regras comerciais, seguranca turistica e handoff humano.
- `docs/architecture/ai-concierge-rag-strategy.md` define fontes iniciais, tipos de conteudo, guardrails e a necessidade de uma allowlist.

RT-AI-002 transforma essas diretrizes em um inventario verificavel de fontes existentes. Nenhuma fonte classificada neste documento passa a ser ingerida automaticamente. Uso futuro depende da classificacao, da prioridade, da aprovacao indicada e de validacao antes da ingestao.

## Regra de classificacao das fontes

### ALLOWED

Fonte aprovada para servir de base a respostas publicas dentro do tipo de conteudo autorizado. Ainda deve respeitar filtros, idioma, atualidade, guardrails e precedencia.

### CONDITIONAL

Fonte util somente apos curadoria, aprovacao explicita, filtro por campo ou uso como evidencia secundaria. Nao pode ser ingerida integralmente nem superar uma fonte de maior autoridade.

### BLOCKED

Fonte proibida para respostas publicas ou ingestao no futuro RAG. Inclui dados privados, internos sensiveis, conteudo legado divergente, claims sem evidencia e fontes que permitiriam decisoes comerciais ou operacionais indevidas.

## Prioridades

- `P0`: governanca e limite obrigatorio; prevalece na definicao do comportamento do concierge.
- `P1`: fonte primaria de fatos publicos aprovados.
- `P2`: fonte secundaria ou condicional, sujeita a curadoria e conflito.
- `P3`: fonte bloqueada; nao deve entrar na base publica.

## Inventario de fontes existentes

| Caminho ou origem | Tipo de conteudo | Classificacao | Prioridade | Publico ou interno | Idiomas | Responsavel por aprovacao | Risco de desatualizacao | Gatilho de revisao | Uso futuro em RAG |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Catalogo publico publicado, exposto por `/[locale]/tours`, detalhes publicos e `/api/trips`, somente com `isPublished=true` | Tours publicados: titulo, descricao, cidade, local, preco base, perfil e highlights | ALLOWED | P1 | Publico | PT, EN, ES, SV quando presentes no registro | Owner / operacao Rick Travel | Medio: tours podem ser editados, publicados ou despublicados | Alteracao de tour, publicacao/despublicacao ou mudanca de preco | Colecao `tours`; fonte primaria para fatos do catalogo |
| Paginas publicas aprovadas: Home, Tours, detalhe de tour, Quem Somos e Contato | Copy institucional, descoberta, contato e fluxo publico vigente | ALLOWED por secao aprovada | P1 | Publico | Conforme pagina/copy disponivel | Owner / produto | Medio: copy pode divergir entre componentes e idiomas | Alteracao de pagina publica ou identificacao de claim sem evidencia | Colecao `site_pages`, com allowlist por secao |
| `docs/product/ai-concierge-scope.md` | Escopo, bloqueios, regras comerciais, seguranca e handoff | ALLOWED | P0 | Interno de governanca, aplicavel ao produto publico | PT | Owner / produto | Baixo a medio | Mudanca de escopo comercial, seguranca ou atendimento | Guardrails e regras de resposta; nao como copy turistica |
| `docs/architecture/ai-concierge-rag-strategy.md` | Estrategia RAG, fontes, tipos, riscos e guardrails | ALLOWED | P0 | Interno de governanca | PT | Owner / arquitetura | Medio | Mudanca de arquitetura, fontes ou politica de retrieval | Governanca de ingestao, retrieval e citacao |
| Conteudo turistico futuro curado e revisado | Atracoes, bairros, destinos, dicas praticas e seguranca aprovada | ALLOWED somente apos criacao e aprovacao | P1 | Publico aprovado | Idiomas explicitamente aprovados | Owner / especialista de turismo | Medio a alto | Mudanca operacional, urbana, de seguranca ou revisao editorial | Colecoes futuras `destinations` e `safety_rules` |
| FAQ futura aprovada pela equipe | Perguntas frequentes comerciais e turisticas revisadas | ALLOWED somente apos aprovacao | P1 | Publico aprovado | Idiomas explicitamente aprovados | Owner / operacao | Alto: regras comerciais mudam | Mudanca comercial ou revisao de resposta | Colecao futura `faq`, com versao e aprovacao |
| `prisma/seed.ts` | Definicao secundaria de tours e agendas preparadas para seed | CONDITIONAL | P2 | Interno tecnico | PT, EN, ES, SV em campos de tour | Owner / operacao antes de uso | Alto: seed pode nao refletir o banco publicado atual | Alteracao do seed ou divergencia com catalogo publicado | Referencia secundaria para reconciliacao; nunca superior ao catalogo publicado |
| `messages/pt.json`, `messages/en.json`, `messages/es.json`, `messages/sv.json` | Copy i18n, FAQs, estados de reserva, claims e labels | CONDITIONAL por campo | P2 | Misto: copy publica e conteudo legado | PT, EN, ES, SV | Owner / produto por chave | Alto: contem conflitos e claims sem evidencia | Alteracao de mensagens, pagina ou regra comercial | Somente chaves individualmente revisadas e aprovadas |
| `docs/ops/*` | Evidencias operacionais, decisoes, status, handoffs e historico | CONDITIONAL como evidencia; BLOCKED para ingestao integral | P2/P3 | Interno | Principalmente PT | Owner / operacao | Alto: documentos acumulam estados historicos e dados sensiveis | Nova decisao operacional ou contradicao identificada | Confirmar decisoes especificas durante curadoria; nunca corpus integral |
| `docs/ops/admin-tour-manager-rules.md` | Semantica interna de publicacao, preco base e preco de agenda | CONDITIONAL | P2 | Interno | PT | Owner / operacao | Medio | Mudanca nas regras de tours/admin | Curadoria e interpretacao de campos; nao resposta publica direta |
| `docs/tasks/UX.md` e docs de UX/produto historicos | Intencoes, jornadas e propostas antigas | CONDITIONAL para discovery; BLOCKED como regra comercial direta | P2/P3 | Interno | PT | Owner / produto | Alto: propostas podem nao refletir o produto vigente | Aprovacao editorial explicita ou mudanca de jornada | Inspirar lacunas e perguntas; nao fornecer fatos comerciais |
| Politicas comerciais futuras explicitamente aprovadas | Pagamento, cancelamento, reembolso, disponibilidade e excecoes | CONDITIONAL ate aprovacao; ALLOWED depois de versionadas | P0/P1 | Publico aprovado e governanca interna | Idiomas aprovados | Owner / operacao | Alto | Qualquer mudanca comercial ou incidente | Colecao `commercial_rules`, com data, aprovador e versao |
| Regras internas de admin/tours e schema, sem dados | Semantica de campos, publicacao e integridade | CONDITIONAL somente para curadoria | P2 | Interno | Tecnico | Owner / arquitetura/operacao | Medio | Mudanca de schema ou regra de dominio | Validar significado de campos; nunca ingerir como resposta publica |
| `data/real-trips.json` | Catalogo legado divergente | BLOCKED | P3 | Interno/legado | PT, com problemas de codificacao | Owner, somente em revisao futura dedicada | Alto | Revisao futura explicita do arquivo | Nenhum uso enquanto permanecer legado divergente |
| Tours com `isPublished=false`, drafts e fixtures tecnicas | Produtos nao publicos, rascunhos e dados de teste | BLOCKED | P3 | Interno | Variavel | Owner / operacao para eventual publicacao | Alto | Publicacao explicita e validada | Nenhum uso em respostas publicas |
| `TripSchedule`, agendas e capacidade | Datas, precos de agenda, capacidade e status tecnico | BLOCKED como confirmacao de disponibilidade; CONDITIONAL para contexto sujeito a humano | P3/P2 | Interno operacional | Nao aplicavel | Owner / operacao | Muito alto e dinamico | Confirmacao humana ou mudanca operacional | Nunca afirmar disponibilidade; no maximo orientar handoff |
| Dados de usuarios e autenticacao | Nome, e-mail, sessao, conta, tokens e credenciais | BLOCKED | P3 | Privado | Nao aplicavel | Nao aplicavel para base publica | Critico | Sempre bloqueado | Nenhum uso |
| Bookings e dados de reservas | Reservas, status, convidados, totais e historico | BLOCKED | P3 | Privado/operacional | Nao aplicavel | Nao aplicavel para base publica | Critico | Sempre bloqueado | Nenhum uso |
| Pagamentos e tentativas de pagamento | Status, provider, valores, IDs e metadata | BLOCKED | P3 | Privado/operacional | Nao aplicavel | Nao aplicavel para base publica | Critico | Sempre bloqueado | Nenhum uso |
| Contatos privados e submissions | Nome, e-mail, telefone e mensagem | BLOCKED | P3 | Privado | Nao aplicavel | Nao aplicavel para base publica | Critico | Sempre bloqueado | Nenhum uso |
| Admin, analytics, e-mails e logs | Operacao interna, eventos, mensagens e rastros | BLOCKED | P3 | Interno/privado | Nao aplicavel | Nao aplicavel para base publica | Critico | Sempre bloqueado | Nenhum uso |
| `.env`, segredos, tokens, credenciais e backups | Configuracao sensivel e copias internas | BLOCKED | P3 | Secreto/interno | Nao aplicavel | Nao aplicavel para base publica | Critico | Sempre bloqueado | Nenhum uso |
| `docs/IMPLEMENTACAO_LOGICA.md`, `docs/MERCADO_PAGO_SETUP.md`, READMEs e documentos historicos | Historico tecnico, propostas e integracoes fora do fluxo publico vigente | BLOCKED como fonte comercial direta | P3 | Interno | PT/EN | Owner em eventual curadoria dedicada | Alto | Revisao e aprovacao explicita | Nenhum uso comercial direto |
| Conhecimento geral livre do modelo | Conhecimento nao controlado sobre turismo, preco, disponibilidade ou seguranca | BLOCKED para decisoes comerciais e de seguranca | P3 | Externo/nao governado | Variavel | Nao aplicavel | Alto | Sempre que faltar fonte aprovada | Pode apenas apoiar linguagem geral de baixo risco, nunca preencher fatos controlados |

## Fontes ALLOWED

As fontes ALLOWED atuais e futuras sao:

- catalogo publico publicado, filtrado obrigatoriamente por `isPublished=true`;
- paginas publicas aprovadas, com allowlist por secao e exclusao de claims nao comprovados;
- `docs/product/ai-concierge-scope.md`;
- `docs/architecture/ai-concierge-rag-strategy.md`;
- conteudo turistico futuro curado, revisado e aprovado;
- FAQ futura aprovada, versionada e revisada pela equipe.

ALLOWED nao significa ingestao irrestrita. Cada fonte deve manter metadados de origem, tipo, idioma, data de revisao, aprovador e status publico.

## Fontes CONDITIONAL

As fontes CONDITIONAL exigem curadoria antes de qualquer uso:

- `prisma/seed.ts`, somente como referencia secundaria;
- `messages/pt.json`, `messages/en.json`, `messages/es.json` e `messages/sv.json`, somente apos revisao por campo;
- `docs/ops/*`, somente como evidencia de uma decisao especifica e nunca como ingestao integral;
- regras internas de admin/tours e schema, somente para interpretar campos e apoiar curadoria;
- documentos de UX/produto historicos, somente para discovery de lacunas;
- politicas comerciais, somente depois de aprovacao explicita, versao e data de revisao.

Uma fonte CONDITIONAL nao pode resolver sozinha conflito sobre preco, disponibilidade, pagamento, cancelamento, reembolso, seguranca ou claim institucional.

## Fontes BLOCKED

As fontes BLOCKED incluem:

- `data/real-trips.json`, enquanto permanecer legado divergente;
- tours com `isPublished=false`, drafts e fixtures tecnicas;
- agendas como prova de disponibilidade confirmada;
- dados de usuarios, autenticacao e sessoes;
- bookings, pagamentos e tentativas de pagamento;
- contatos privados e submissions;
- admin, analytics, e-mails e logs;
- `.env`, segredos, tokens, credenciais e backups;
- `docs/ops/*` como ingestao integral;
- documentos historicos e tecnicos como fonte comercial direta;
- claims sem evidencia aprovada;
- conhecimento geral usado para decidir preco, disponibilidade, politica comercial ou seguranca.

## Precedencia entre fontes

Quando duas fontes divergirem, aplicar esta ordem:

1. Decisao explicita e atual do humano/owner prevalece sobre qualquer fonte documental.
2. Regras de seguranca, escopo e guardrails atuais da AI Concierge prevalecem sobre copy ou documentos historicos.
3. Regras comerciais explicitamente aprovadas e versionadas prevalecem sobre copy antiga.
4. Catalogo publico publicado com `isPublished=true` prevalece sobre seed, arquivos em `data/` e documentos.
5. Conteudo publico aprovado prevalece sobre docs operacionais.
6. Seed pode confirmar intencao secundaria, mas nunca superar o estado publico publicado.
7. Em conflito nao resolvido, a resposta deve indicar incerteza e encaminhar para humano.

## Conflitos ja identificados

### Pre-reserva manual versus confirmacao apos pagamento

- Copy publica vigente informa pre-reserva, confirmacao manual e ausencia de pagamento online.
- FAQs em `messages/*.json` afirmam confirmacao depois do pagamento e prazo expresso.
- Decisao: bloquear as FAQs conflitantes ate aprovacao explicita. O concierge deve descrever o fluxo como manual/assistido.

### Metodos de pagamento divergentes

- FAQs listam cartoes, Pix, PayPal, transferencia e faturamento.
- Copy publica vigente informa que nenhum pagamento online e iniciado.
- Decisao: nao afirmar metodos aceitos. Encaminhar para humano.

### Cancelamento 48h versus 24h

- FAQs citam alteracao/cancelamento e reembolso ate 48 horas.
- `TourActions` cita cancelamento gratis ate 24 horas.
- Decisao: nenhuma politica pode entrar na base ate aprovacao explicita.

### Catalogo legado divergente

- `data/real-trips.json` possui tours e precos divergentes do catalogo final publicado.
- `prisma/seed.ts` e referencia secundaria e tambem pode divergir do estado publicado.
- Decisao: catalogo publico publicado prevalece; legado permanece bloqueado.

### Claims sem evidencia aprovada

Foram identificados claims como:

- `500+ tours`;
- avaliacao `4,9`;
- resposta no WhatsApp em poucos minutos;
- Cadastur e registro ativo;
- seguros e cobertura completa;
- garantias ou linguagem absoluta de seguranca.

Decisao: bloquear esses claims ate existir evidencia verificavel e aprovacao explicita do owner.

## Lacunas e aprovacoes pendentes

- Politica final de pagamento e metodos aceitos.
- Politica final de cancelamento e alteracao.
- Politica de reembolso e reagendamento.
- Claims de credibilidade permitidos e respectivas evidencias.
- Processo canonico para identificar os tours realmente publicados.
- Idiomas oficiais de atendimento e idiomas aprovados por conteudo.
- FAQ aprovada e sem conflitos.
- Regras de seguranca turistica aprovadas para destinos e situacoes sensiveis.
- Responsavel e periodicidade de revisao de cada colecao futura.
- Formato canonico e versionado da futura base de conhecimento.

## Regras obrigatorias para futuras etapas RAG

- Recuperar apenas tours com `isPublished=true`.
- Nao tratar agenda, capacidade, data ou `TripSchedule` como disponibilidade confirmada.
- Nao inferir preco final de grupo, desconto, cortesia, upgrade ou condicao especial.
- Nao usar dados privados, internos sensiveis ou operacionais.
- Nao ingerir `docs/ops/*` integralmente.
- Bloquear claims sem evidencia aprovada.
- Manter metadados de `source`, `type`, `locale`, `tourId` quando aplicavel, `updatedAt`, `reviewedAt`, `approvedBy` e `publicOnly`.
- Aplicar precedencia e registrar conflito antes de responder.
- Encaminhar para humano em conflito, baixa confianca, ausencia de fonte, seguranca sensivel ou decisao comercial.
- Permitir respostas como "nao sei" e "fale com a equipe".
- Nao executar acoes autonomas nem consultar dados privados.

## Criterios de validacao

Este inventario e considerado valido quando:

- todas as fontes listadas existem ou estao identificadas explicitamente como futuras;
- cada fonte possui classificacao ALLOWED, CONDITIONAL ou BLOCKED;
- prioridade, publico/interno, idiomas, aprovador, risco, gatilho e uso RAG estao registrados;
- catalogo publicado prevalece sobre seed e legado;
- tours despublicados e dados privados permanecem bloqueados;
- agendas nao sao tratadas como disponibilidade confirmada;
- conflitos comerciais e claims sem evidencia estao bloqueados ou pendentes de aprovacao;
- precedencia e handoff humano estao definidos;
- nenhuma implementacao tecnica, dependencia, base vetorial, embedding, chat ou rota API foi criada;
- nenhuma alteracao ocorreu em frontend, backend, schema, seed, admin, reservas, pagamentos, login ou producao.
