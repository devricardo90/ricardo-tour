# Rick Travel AI Concierge - Curated Knowledge Base Format

## 1. Objetivo da base curada

Este documento define o formato canonico e versionavel da futura base de conhecimento curada do Rick Travel AI Concierge.

A base curada deve ser uma camada editorial aprovada antes de qualquer uso por RAG, embeddings, LangChain, chat ou agente. Seu objetivo e transformar fontes publicas, regras comerciais, regras de seguranca e respostas aprovadas em registros rastreaveis, revisaveis e seguros para atendimento turistico no Rio de Janeiro.

Este documento e exclusivamente documental. Ele nao cria base real, arquivo JSON/YAML, seed, banco vetorial, embeddings, rota API, chat, dependencia, runtime ou alteracao de produto.

## 2. Relacao com RT-AI-001, RT-AI-002, RT-AI-003 e RT-AI-004

RT-AI-005 depende das decisoes anteriores:

- RT-AI-001 define escopo, riscos, limites comerciais, seguranca turistica, handoff humano e separacao entre AI Concierge publico e RIC Studio interno.
- RT-AI-002 define o inventario de fontes ALLOWED, CONDITIONAL e BLOCKED, alem de precedencia, conflitos e lacunas.
- RT-AI-003 define a matriz de respostas esperadas, respostas bloqueadas e criterios de handoff.
- RT-AI-004 define o contrato operacional de prompt, guardrails, formato de resposta, baixa confianca, recusas e limite de nao mencionar RIC Studio no fluxo publico.

O formato canonico nao pode enfraquecer essas regras. Quando houver conflito, prevalecem guardrails, seguranca, aprovacao explicita do owner e handoff humano.

## 3. Tipos de registros permitidos

A base curada futura deve aceitar somente estes tipos de registro:

| Tipo | Uso permitido |
| --- | --- |
| `tour` | Fatos publicos sobre tour publicado, sempre ligado a `isPublished=true`. |
| `destination` | Informacao aprovada sobre cidade, regiao ou destino turistico. |
| `attraction` | Informacao aprovada sobre atracao, ponto turistico ou experiencia. |
| `commercial_rule` | Regra comercial aprovada ou pendente sobre preco, pagamento, cancelamento, reembolso, grupos, reservas e condicoes. |
| `safety_rule` | Regra de seguranca turistica, prudencia, risco, favela/comunidade, clima, acessibilidade ou situacao sensivel. |
| `handoff_rule` | Regra que determina quando o agente deve encaminhar para humano. |
| `faq_answer` | Resposta aprovada derivada da matriz de respostas. |
| `blocked_claim` | Claim proibido ou pendente, usado para impedir resposta publica indevida. |

Qualquer novo tipo exige revisao documental antes de existir em base real.

## 4. Campos obrigatorios

Todo registro futuro deve ter estes campos:

| Campo | Regra |
| --- | --- |
| `id` | Identificador estavel, unico, legivel e versionavel. |
| `type` | Um dos tipos permitidos neste documento. |
| `locale` | Idioma do registro, aprovado separadamente. |
| `title` | Titulo curto para curadoria e auditoria. |
| `content` | Conteudo aprovado do registro, em linguagem controlada. |
| `source` | Origem verificavel ou documento que sustenta o registro. |
| `sourceAuthority` | Autoridade da fonte: primaria, governanca, owner, operacional, secundaria ou bloqueada. |
| `approvalStatus` | Estado de aprovacao do registro. |
| `owner` | Pessoa ou funcao responsavel pela aprovacao e revisao. |
| `updatedAt` | Data da ultima atualizacao do registro. |
| `publicAllowed` | Indica se o conteudo pode sustentar resposta publica. |
| `ragAllowed` | Indica se o conteudo pode ser recuperado em futura etapa RAG. |

Campos obrigatorios nao podem ficar implicitos em nome de arquivo, path, colecao, chunk ou metadado externo.

## 5. Campos opcionais

Campos opcionais podem ser usados quando agregam rastreabilidade:

| Campo | Uso |
| --- | --- |
| `tourId` | Vinculo com tour publicado. Obrigatorio para registros do tipo `tour` quando houver ID no catalogo. |
| `relatedTourIds` | Lista de tours relacionados, sem transformar relacao em recomendacao automatica. |
| `city` | Cidade aplicavel, como Rio de Janeiro. |
| `neighborhood` | Bairro ou regiao quando aprovado e relevante. |
| `tags` | Etiquetas editoriais para filtro e curadoria. |
| `riskLevel` | Nivel de risco editorial ou turistico. |
| `handoffRequired` | Indica se o registro exige encaminhamento humano. |
| `expiresAt` | Data de expiracao ou revisao obrigatoria. |
| `notes` | Observacoes internas de curadoria, nunca usadas como resposta publica sem aprovacao propria. |

Campos opcionais nao podem carregar informacao privada, credenciais, dados de reserva, dados de pagamento ou conteudo operacional sensivel.

## 6. Estados de aprovacao

Os estados permitidos sao:

| Estado | Significado | Uso em resposta publica |
| --- | --- | --- |
| `APPROVED` | Conteudo revisado e autorizado para o locale especifico. | Pode sustentar resposta factual se `publicAllowed=true` e `ragAllowed=true`. |
| `CONDITIONAL` | Conteudo util apenas sob regra explicita, restricao ou contexto limitado. | Nao pode sustentar fato sozinho; exige regra documentada. |
| `PENDING_OWNER_APPROVAL` | Conteudo aguardando decisao do owner ou politica final. | Deve gerar handoff, nao resposta factual. |
| `BLOCKED` | Conteudo proibido ou claim sem evidencia. | Nunca pode ser usado para resposta publica. |

O estado e por registro e por idioma. Uma aprovacao em portugues nao aprova automaticamente ingles, espanhol ou sueco.

## 7. Regras criticas

- Somente conteudo `APPROVED` pode ser usado em resposta factual.
- Conteudo `CONDITIONAL` exige regra explicita de uso.
- `PENDING_OWNER_APPROVAL` deve gerar handoff.
- `BLOCKED` nunca deve ser usado para resposta publica.
- Tours exigem `isPublished=true`.
- Agenda, capacidade ou `TripSchedule` nao significam disponibilidade confirmada.
- Preco final, pagamento, cancelamento e reembolso nao devem ser inferidos.
- Claims como Cadastur, avaliacao, seguros e "500+ tours" exigem evidencia aprovada.
- Conteudo interno nao pode virar resposta publica sem aprovacao explicita.
- Dados privados nunca entram na base publica.
- Dados de usuarios, reservas, pagamentos, contatos, admin, logs, analytics, emails, sessoes, tokens, `.env` e backups sao bloqueados.
- O agente nao deve usar conhecimento livre do modelo para preencher lacunas comerciais, operacionais ou de seguranca.

## 8. Estrategia de idioma

Os idiomas iniciais priorizados sao:

- portugues;
- ingles;
- espanhol.

Sueco somente deve existir se houver conteudo aprovado para esse idioma.

Regras:

- cada `locale` precisa ter aprovacao propria;
- nao misturar idiomas divergentes sem revisao;
- traducao livre nao aprova politica comercial, seguranca ou claim;
- se um idioma nao tiver registro aprovado, o agente deve informar limite e encaminhar;
- guardrails permanecem iguais em todos os idiomas;
- divergencia entre idiomas deve bloquear resposta factual ate revisao.

## 9. Formato para tours

Registros do tipo `tour` devem representar apenas tours publicados e publicamente ofertados.

Campos esperados:

| Campo | Regra especifica |
| --- | --- |
| `type` | Deve ser `tour`. |
| `tourId` | Deve apontar para tour existente e publicado. |
| `title` | Deve refletir o titulo publico aprovado. |
| `content` | Deve descrever somente fatos aprovados sobre o tour. |
| `source` | Deve apontar para catalogo publico publicado ou fonte aprovada. |
| `approvalStatus` | Deve ser `APPROVED` para uso factual. |
| `publicAllowed` | So pode ser `true` se o tour estiver publicado. |
| `ragAllowed` | So pode ser `true` se o conteudo for seguro para recuperacao publica. |

Bloqueios:

- tours com `isPublished=false`;
- drafts;
- fixtures;
- seed divergente;
- horarios e disponibilidade inferidos de agenda;
- preco final de grupo ou condicao especial;
- promessa de reserva, pickup, guia, acessibilidade ou seguranca sem confirmacao.

## 10. Formato para destinos e atracoes

Registros `destination` e `attraction` devem conter informacao turistica aprovada e de baixo risco.

Campos recomendados:

| Campo | Regra especifica |
| --- | --- |
| `city` | Obrigatorio quando o conteudo depender de localidade. |
| `neighborhood` | Usar somente se revisado. |
| `tags` | Pode indicar perfil, como classico, natureza, cultural ou familia. |
| `riskLevel` | Obrigatorio quando houver seguranca, comunidade, noite, trilha, clima ou acessibilidade. |
| `handoffRequired` | Deve ser `true` quando houver decisao sensivel. |

Permitido:

- explicar contexto turistico aprovado;
- comparar atracoes de forma equilibrada;
- orientar escolha geral por perfil.

Bloqueado:

- garantir seguranca;
- recomendar visita independente em area sensivel;
- inventar horarios, filas, valores, acessibilidade ou condicoes de entrada;
- transformar conhecimento turistico geral em promessa operacional da Rick Travel.

## 11. Formato para regras comerciais

Registros `commercial_rule` governam temas comerciais e financeiros.

Devem cobrir, quando aprovados:

- preco de vitrine;
- preco final;
- disponibilidade;
- reserva;
- pagamento;
- cancelamento;
- reembolso;
- reagendamento;
- grupos;
- tours privados;
- condicoes especiais.

Regras:

- preco de vitrine pode ser `APPROVED` se vier do catalogo publico publicado;
- preco final, pagamento, cancelamento e reembolso permanecem `PENDING_OWNER_APPROVAL` ate politica aprovada;
- regras comerciais devem ter owner claro, data e validade;
- se a regra estiver ausente ou conflitante, resposta deve ser limite + handoff;
- regras comerciais nao podem ser inferidas de copy antiga, seed, FAQ conflitante, agenda ou conhecimento geral.

## 12. Formato para regras de seguranca turistica

Registros `safety_rule` devem usar linguagem prudente e nunca prometer seguranca absoluta.

Campos recomendados:

| Campo | Regra especifica |
| --- | --- |
| `riskLevel` | Baixo, medio, alto ou critico, conforme curadoria. |
| `handoffRequired` | `true` para favela/comunidade, acessibilidade, criancas, idosos, necessidades especiais, clima severo, periodo noturno ou emergencia. |
| `expiresAt` | Recomendado quando a regra depende de contexto urbano, clima ou operacao. |

Permitido:

- orientar cuidados gerais de cidade grande;
- sugerir confirmacao com a equipe;
- encaminhar para autoridades oficiais em emergencia;
- reconhecer limites de informacao aprovada.

Bloqueado:

- "e totalmente seguro";
- "nada vai acontecer";
- recomendacao de visita independente em area sensivel;
- aconselhamento medico, legal, policial ou emergencial;
- decisao sobre acessibilidade ou saude sem humano.

## 13. Formato para handoff rules

Registros `handoff_rule` definem quando o agente deve encaminhar para atendimento humano.

Handoff e obrigatorio para:

- pedido explicito de humano;
- disponibilidade, reserva, confirmacao, preco final ou grupo;
- pagamento, cancelamento, reembolso ou reagendamento;
- tour privado ou roteiro personalizado;
- acessibilidade, criancas, idosos, gravidez, saude, mobilidade reduzida ou necessidade especial;
- seguranca, favela/comunidade, periodo noturno, clima severo ou situacao sensivel;
- conflito entre fontes;
- baixa confianca;
- ausencia de fonte aprovada;
- qualquer dependencia de dados privados, admin, booking ou pagamento.

Um registro de handoff deve explicar o gatilho, a resposta permitida e o que o agente nao pode prometer.

## 14. Formato para FAQ/respostas aprovadas

Registros `faq_answer` devem derivar da matriz RT-AI-003 e do contrato RT-AI-004.

Campos esperados:

| Campo | Regra especifica |
| --- | --- |
| `title` | Deve identificar a intencao, nao apenas a pergunta literal. |
| `content` | Deve conter resposta curta aprovada ou comportamento esperado. |
| `source` | Deve apontar para matriz aprovada, catalogo publicado ou regra aplicavel. |
| `handoffRequired` | Deve refletir a matriz e os guardrails. |
| `approvalStatus` | `APPROVED`, `PENDING_OWNER_APPROVAL` ou `BLOCKED`, conforme o caso. |

Regras:

- uma FAQ nao pode resolver conflito comercial pendente;
- respostas em idiomas diferentes precisam de aprovacao propria;
- exemplos nao podem virar permissao para inventar;
- resposta aprovada deve manter limites sobre reserva, disponibilidade, preco final, pagamento, cancelamento, reembolso e seguranca.

## 15. Formato para blocked claims

Registros `blocked_claim` existem para impedir que claims sem evidencia aparecam em resposta publica.

Claims bloqueados ou pendentes incluem:

- Cadastur sem evidencia aprovada;
- avaliacao, nota media ou depoimento sem fonte aprovada;
- seguros e cobertura completa sem documento aprovado;
- "500+ tours";
- resposta em poucos minutos;
- garantia de seguranca;
- melhor passeio, melhor agencia ou qualquer superlativo nao comprovado;
- pagamento, cancelamento ou reembolso sem politica aprovada.

Um `blocked_claim` deve registrar:

- claim exato ou familia de claims;
- motivo do bloqueio;
- fonte conflitante ou ausente;
- status de aprovacao;
- proximo passo para desbloqueio, quando aplicavel.

## 16. Regras de precedencia

Quando fontes divergirem, aplicar esta ordem:

1. Decisao explicita e atual do owner.
2. Regras de seguranca, escopo e guardrails de RT-AI-001 e RT-AI-004.
3. Politica comercial aprovada, versionada e vigente.
4. Catalogo publico publicado com `isPublished=true`.
5. Registro curado `APPROVED` no mesmo `locale`.
6. FAQ aprovada e alinhada ao contrato de prompt.
7. Fonte condicional apenas sob regra explicita.
8. Em conflito nao resolvido: baixa confianca e handoff.

Fontes `BLOCKED` nunca participam da escolha factual.

## 17. Regras de validade e expiracao

Todo registro deve ter `updatedAt`. Registros sensiveis tambem devem ter `expiresAt`.

Expiracao recomendada:

| Tipo | Regra de validade |
| --- | --- |
| `tour` | Revisar ao publicar, despublicar, alterar preco, descricao, imagem ou logistica. |
| `commercial_rule` | Revisar em qualquer mudanca de politica, preco, pagamento, cancelamento ou reembolso. |
| `safety_rule` | Revisar quando houver mudanca urbana, operacional, sazonal, climatica ou de roteiro. |
| `handoff_rule` | Revisar quando mudar processo de atendimento. |
| `faq_answer` | Revisar quando mudar matriz, catalogo, regra comercial ou guardrail. |
| `blocked_claim` | Revisar somente quando houver evidencia aprovada ou decisao de manter bloqueio. |

Registro expirado nao pode sustentar resposta factual publica. Deve gerar baixa confianca ou handoff.

## 18. Relacao futura com RAG, chunking, embeddings e LangChain

Este formato prepara uma futura etapa tecnica, mas nao a implementa.

Diretrizes futuras:

- RAG deve recuperar somente registros `ragAllowed=true`.
- Resposta publica deve usar somente registros `publicAllowed=true` e `approvalStatus=APPROVED`, exceto quando uma regra `CONDITIONAL` explicita determinar comportamento limitado.
- Chunking deve preservar `id`, `type`, `locale`, `source`, `approvalStatus`, `owner`, `updatedAt`, `publicAllowed`, `ragAllowed` e relacoes com tour.
- Embeddings nao devem ser gerados para dados privados, fontes bloqueadas, registros expirados ou conteudo pendente sem regra de handoff.
- LangChain, se adotado futuramente, deve respeitar allowlist, filtros por metadados, precedencia, idioma e bloqueios.
- O retrieval nao deve consultar admin, bookings, pagamentos, contatos, logs, `.env`, backups, `data/` legado bloqueado ou docs operacionais integralmente.
- RAG nao autoriza acao operacional; apenas recupera contexto aprovado.

Qualquer implementacao futura deve criar task separada, revisao tecnica e validacao propria.

## 19. Criterios de validacao

Este formato e valido quando:

- define objetivo da base curada;
- e rastreavel a RT-AI-001, RT-AI-002, RT-AI-003 e RT-AI-004;
- limita tipos a `tour`, `destination`, `attraction`, `commercial_rule`, `safety_rule`, `handoff_rule`, `faq_answer` e `blocked_claim`;
- define todos os campos obrigatorios: `id`, `type`, `locale`, `title`, `content`, `source`, `sourceAuthority`, `approvalStatus`, `owner`, `updatedAt`, `publicAllowed` e `ragAllowed`;
- define os campos opcionais previstos;
- registra estados `APPROVED`, `CONDITIONAL`, `PENDING_OWNER_APPROVAL` e `BLOCKED`;
- preserva a regra de que somente `APPROVED` sustenta fato publico;
- bloqueia uso publico de `BLOCKED` e exige handoff para `PENDING_OWNER_APPROVAL`;
- exige `isPublished=true` para tours;
- impede que agenda seja disponibilidade confirmada;
- impede inferencia de preco final, pagamento, cancelamento e reembolso;
- exige evidencia aprovada para claims;
- separa conteudo publico, interno e privado;
- define estrategia de idioma por locale;
- define formatos para tours, destinos, atracoes, regras comerciais, seguranca, handoff, FAQ e blocked claims;
- define precedencia, validade e expiracao;
- documenta relacao futura com RAG, chunking, embeddings e LangChain sem implementacao tecnica;
- nao cria base real, seed, JSON/YAML, data, embeddings, chat, API, dependencia, frontend, backend, schema, admin, reservas, pagamentos, login ou producao.
