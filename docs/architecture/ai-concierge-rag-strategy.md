# Rick Travel AI Concierge - Initial RAG Strategy

## Arquitetura inicial recomendada

A arquitetura inicial recomendada para o Rick Travel AI Concierge deve ser simples, controlada e somente leitura:

1. Base de conhecimento curada com documentos aprovados.
2. Recuperacao de trechos relevantes a partir da pergunta do usuario.
3. Geracao de resposta com citacao interna das fontes recuperadas.
4. Guardrails para bloquear promessas comerciais, decisoes operacionais e orientacao turistica insegura.
5. Encaminhamento humano quando a resposta exigir confirmacao, dados internos ou julgamento operacional.

Nesta etapa, a arquitetura e apenas documental. Nenhum runtime, endpoint, chat, banco vetorial ou dependencia deve ser criado.

## Por que comecar com RAG controlado

RAG controlado e o ponto de partida adequado porque o produto depende de informacao especifica e mutavel:

- catalogo de tours;
- regras comerciais;
- fluxo de pre-reserva;
- conteudo publico por idioma;
- orientacoes de seguranca e atendimento;
- limites de pagamento e confirmacao humana.

Um modelo sem recuperacao controlada teria risco maior de inventar disponibilidade, precos, politicas, promessas de seguranca ou experiencias que nao existem no catalogo Rick Travel.

## Fontes permitidas de conhecimento

As fontes iniciais permitidas devem ser:

- catalogo publico de tours publicado;
- dados curados de tours em seed ou documentos aprovados;
- paginas publicas do site Rick Travel;
- documentacao de UX/produto aprovada;
- regras comerciais registradas em docs operacionais;
- politicas futuras explicitamente aprovadas pelo owner;
- respostas frequentes revisadas pela equipe.

Fontes nao permitidas:

- dados privados de usuarios;
- dados de booking, pagamento ou admin;
- logs sensiveis;
- segredos ou variaveis de ambiente;
- conhecimento livre usado para decidir preco, disponibilidade, seguranca ou regra comercial;
- RIC Studio como fonte publica de resposta ao turista.

## Tipos de conteudo da base

A base de conhecimento pode ser separada em colecoes logicas:

- `tours`: nome, descricao, duracao, cidade, preco base, highlights, inclusoes e exclusoes aprovadas.
- `destinations`: atracoes, bairros e regioes do Rio com texto curado.
- `commercial_rules`: pre-reserva, atendimento humano, pagamento, disponibilidade e limites comerciais.
- `safety_rules`: recomendacoes prudentes sobre seguranca turistica.
- `handoff_rules`: criterios para encaminhar ao atendimento humano.
- `site_pages`: resumo aprovado de Home, Tours, Quem Somos e Contato.
- `faq`: perguntas frequentes revisadas.

## Estrategia de chunking em alto nivel

O chunking deve priorizar significado e rastreabilidade:

- um chunk por passeio quando o conteudo for curto;
- chunks separados para descricao, inclusoes, exclusoes, seguranca e regras comerciais quando o conteudo crescer;
- chunks pequenos para perguntas frequentes;
- metadados obrigatorios: `source`, `type`, `locale`, `tourId` quando aplicavel, `updatedAt` e `publicOnly`;
- evitar misturar regras comerciais com conteudo turistico descritivo no mesmo chunk;
- manter texto em linguagem canonica por idioma, sem depender de traducao improvisada no momento da resposta.

## Estrategia de recuperacao em alto nivel

A recuperacao deve usar uma estrategia conservadora:

1. Classificar a intencao da pergunta.
2. Recuperar primeiro conteudo Rick Travel relevante.
3. Aplicar filtros por idioma e tipo de conteudo.
4. Priorizar regras comerciais e seguranca quando a pergunta envolver disponibilidade, pagamento, reserva, favela, horario, deslocamento ou risco.
5. Se a confianca for baixa, responder com limite claro e encaminhar para humano.

Consultas sobre reserva existente, pagamento, admin ou dados privados nao devem acionar busca em dados internos no MVP publico.

## Embeddings e vector search futuros

Embeddings e busca vetorial podem ser uteis quando houver:

- volume maior de tours e conteudo;
- perguntas abertas sobre bairros e interesses;
- necessidade de busca semantica multi-idioma;
- base de FAQ maior;
- medicao de perguntas sem resposta.

No MVP documental, nao criar banco vetorial. A decisao futura deve comparar busca textual simples, embeddings locais/servico externo e custo operacional. Qualquer indice vetorial deve conter apenas conteudo publico ou aprovado.

## Relacao futura com LangChain

LangChain pode ser avaliado futuramente para:

- compor retrieval, prompt e guardrails;
- padronizar chains de resposta;
- trocar providers com menos acoplamento;
- instrumentar fontes e traces.

Nao deve ser instalado nesta task. A escolha deve depender de necessidade real, custo de manutencao e simplicidade frente a uma implementacao direta.

## Relacao futura com LangGraph

LangGraph pode ser considerado apenas se o concierge precisar de fluxo multi-etapas com estados claros, por exemplo:

- classificar intencao;
- recuperar contexto;
- aplicar guardrails;
- decidir handoff humano;
- revisar resposta antes de exibir;
- registrar feedback.

Nao ha necessidade de LangGraph para a primeira definicao documental nem para um RAG simples somente leitura.

## Relacao futura com RIC Studio

RIC Studio / Protocolo RIC deve ser tratado como auditor interno futuro, nao como produto publico. Possiveis responsabilidades futuras:

- revisar qualidade das respostas;
- auditar fontes usadas;
- validar se houve promessa comercial indevida;
- medir risco de alucinacao;
- registrar incidentes e melhorias da base;
- governar alteracoes de prompt, fontes e regras.

O turista deve interagir com o Rick Travel AI Concierge. RIC Studio deve permanecer invisivel ou explicitamente interno.

## Guardrails tecnicos

- Responder somente com fontes recuperadas e aprovadas.
- Bloquear resposta quando a pergunta exigir dados privados.
- Bloquear promessas de disponibilidade, pagamento, desconto, reembolso ou confirmacao.
- Encaminhar para humano em baixa confianca.
- Registrar categoria de pergunta e motivo de handoff quando houver produto futuro.
- Separar prompt publico de regras internas.
- Usar allowlist de fontes.
- Tratar conteudo por idioma de forma explicita.
- Nao permitir execucao de acoes autonomas.

## Riscos tecnicos

- Alucinacao sobre preco, disponibilidade ou politica comercial.
- Mistura entre conteudo turistico geral e produto Rick Travel.
- Resposta excessivamente confiante sobre seguranca urbana.
- Base de conhecimento desatualizada.
- Conteudo multi-idioma divergente.
- Exposicao acidental de dados privados se fontes internas forem adicionadas sem filtro.
- Complexidade prematura com frameworks antes de validar necessidade.
- Falta de telemetria para saber quando o concierge falha.

## Etapas futuras recomendadas

1. Aprovar estes documentos de escopo e arquitetura.
2. Montar inventario de fontes publicas e comerciais permitidas.
3. Definir formato canonico da base de conhecimento.
4. Criar exemplos de perguntas e respostas esperadas.
5. Criar matriz de bloqueios e handoff humano.
6. Avaliar prototipo offline de retrieval sem interface publica.
7. Definir metricas de qualidade e seguranca.
8. So depois decidir se LangChain, LangGraph ou vector search agregam valor.
