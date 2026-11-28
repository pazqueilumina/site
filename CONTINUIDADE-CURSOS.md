# Plataforma de Cursos Paz que Ilumina — Continuidade v1.1
27/11/2026 — Planejamento, sem autorização de implementação.

## Objetivo e arquitetura
Ambiente privado de apoio a cursos presenciais espíritas, não EAD. Reutilizar leitura e Pomar do Estudo semanal. Subdomínio aprovado conceitualmente: cursos.pazqueilumina.com.br. Proposta: repositório pazqueilumina/cursos, Cloudflare Pages, D1, R2, autenticação, administração e deploy independentes. Desacoplar CSS, imagens, domínio e Access atuais. Permitir mudança futura de domínio preservando dados. Custos e limites a avaliar.

## Modelo reutilizável
Separar obras, programas didáticos versionados, cursos, módulos, aulas, turmas, calendários, alunos e matrículas. Abranger as cinco obras do Pentateuco (O Livro dos Espíritos, O Livro dos Médiuns, O Evangelho Segundo o Espiritismo, O Céu e o Inferno, A Gênese) e futuras expansões. Cada curso pode ter duração, metodologia e quantidade de módulos diferentes, inclusive sem perguntas numeradas. Administração permite criar cursos sem alterar código, duplicar programas e adaptar novas turmas preservando histórico das anteriores. Nome sugerido: O Livro dos Espíritos — Turma 2027–2028, configurável.

## Primeiro curso e fidelidade pedagógica
Nome: Curso do Livro dos Espíritos. Fonte normativa integral: PLANEJAMENTO DO CURSO SOBRE O LIVRO DOS ESPÍRITOS.docx (14 páginas). Conferir integralmente o original antes de cadastrar todos os títulos, capítulos, subtemas, referências, questões e eventos. Uma aula por tela, substituindo grupos de 4–5 questões, preservando apresentação de perguntas e respostas. Todas as aulas acessíveis antecipadamente; destacar a aula vigente. Datas e facilitadores da nova turma a definir separadamente. Quatro módulos originalmente previstos em 80 semanas; cronograma termina em 75, não completar artificialmente.
- Módulo I (Introdução, Prolegômenos, Primeira Parte e Segunda Parte capítulos I–VI): 01 história e Prolegômenos; 02 Introdução I–VIII; 03 Introdução IX–XVII; 04 questões 1–16; 05 17–36; 06 37–59; 07 60–75; 08 76–92; 09 93–106; 10 107–131; 11 132–148; 12 149–165; 13 166–188; 14 189–202; 15 203–221; 16 222; 17 223–256; 18 257–290; 19 291–303; 20 304–329.
- Módulo II (Segunda Parte capítulos VII–XI): 21 330–343; 22 344–360; 23 361–378; 24 379–391; 25 392–399; 26 400–424; 27 425–455; 28 456–472; 29 473–488; 30 489–508; 32 509–524; 33 525–535; 34 536–557; 36 557–584; 37 585–611.
- Módulo III (Terceira Parte): 38 614–628; 39 629–648; 40 649–673; 41 674–685; 42 702–714; 43 feriado; 44 715–727; 45 728–741; 46 742–765; 47 766–775; 48 776–802; 49 686–701; 50 803–824; 51 A Revelação da Missão de Allan Kardec; 52 825–842; 53 843–872; 54 873–885; 55 886–892; 56 893–906; 57 907–919.
- Módulo IV (Quarta Parte, Conclusão e Revisões): 58 920–936; 59 937–940; 60 941–957; 61 958–964; 62 965–982; 63 983–1002; 64 1003–1019; 65 Conclusão I–III; 66 IV–VI; 67 VII–IX; 68 A ordem didática de O Livro dos Espíritos; 69 Perispírito; 70 Conhece-se a ti mesmo (919); 71 Ação e Prática dos Ensinamentos Espíritas; 72 Desvendando o Perispírito; 73 Jesus, o Terapeuta Divino; 74 Pinga-Fogo; 75 Confraternização de Encerramento do Curso.
Preservar lacunas 31 e 35, repetição da questão 557, ausência de 612–613 e posição da aula 49. Não corrigir sem autorização. Este mapa não substitui o DOCX integral.

## Alunos e acesso
Cadastro único permanente, separado das matrículas. Um único login para todos os cursos autorizados, inclusive simultâneos. Autocadastro proposto com nome completo, e-mail, confirmação do e-mail e aprovação administrativa; permitir cadastro manual. Aprovação de cadastro não concede acesso automático a todos os cursos. Login sem senha por código temporário de e-mail é proposta técnica a validar. Conteúdo privado; tela de solicitação poderá ser pública. Dois professores fixos e convidados, associados por aula. Sem controle de frequência, fóruns, mensagens ou envio de dúvidas.

## Ambiente do aluno
Identidade visual marfim, azul-marinho, dourado; próxima aula em destaque, progresso, cronograma, todas as aulas, materiais complementares, anotações pessoais, Pomar do Conhecimento, professores e facilitadores. Minha jornada espírita é requisito arquitetural desde o início: visão global dos cursos concluídos e em andamento, turmas, progresso, anotações, histórico e conquistas entre anos e dispositivos. Exemplo: aluno conclui O Livro dos Espíritos em 2028, inicia O Evangelho em 2029 e cursa O Livro dos Médiuns simultaneamente com a mesma conta. Preservar gamificação; critérios de integração entre questões/aulas/cursos a definir. Materiais por aula: PDF confirmado, vídeos/videoaulas e textos possíveis; áudio possibilidade futura. Sem provas, avaliações, notas, ranking ou certificados, inclusive simbólicos, conforme regra geral do projeto. Progresso mede leitura, não frequência ou evolução espiritual.

## Administração
Painel independente: dashboard, obras, cursos e módulos, turmas, calendário, professores/facilitadores, alunos, solicitações de acesso, matrículas, materiais didáticos, gamificação, relatórios. Aprovar/rejeitar, cadastrar diretamente, desativar acesso, gerenciar matrículas e progresso sem controle de frequência. Alterar planejamento sem editar código e sem afetar turmas anteriores. Permissões de professores a definir.

## Segurança e pendências
Isolar dados, proteger materiais, backups, LGPD. Definir datas, calendário, professores, autenticação, serviço de e-mail, permissões, regras de gamificação, custos, migração de progresso local e identidade visual final. Atualmente Estudo semanal usa functions/estudo-semanal/index.js, CSS compartilhado, imagem do Pomar, localStorage e middleware Access vinculado ao domínio. Ainda não há banco de alunos/turmas a migrar.

## Regras obrigatórias
Não implementar, criar infraestrutura, publicar ou fazer rollback sem autorização explícita. Não retirar informações ou funcionalidades sem confirmar, nem reintroduzir rejeitadas. Preservar ponto de retorno, validar alterações e respeitar protótipos aprovados. Não interferir no site institucional, Bíblia ou serviços de e-mail. Atualizar documentação. Este registro é planejamento, não implementação. Subdomínio aprovado conceitualmente; escolhas técnicas ainda sujeitas a validação.

## Próximo chat
Ler integralmente CONTINUIDADE-PROJETO.md e este arquivo, conferir HEAD e arquivos relevantes. Consultar o DOCX original antes de implementar o programa didático; solicitar o arquivo se não estiver acessível. Preservar Estudo semanal. Aguardar autorização específica. As decisões deste documento sobre cursos prevalecem sobre propostas antigas conflitantes do documento geral, especialmente ordem das questões, acesso antecipado, login obrigatório e arquitetura independente.


## 27/11/2026 — Gestão do programa didático e comunicações (aprovado conceitualmente)

### Programa didático editável pelo painel administrativo
- O DOCX original é a fonte inicial, não uma dependência operacional. Cadastrar integralmente seu conteúdo e permitir gestão posterior pelo site, sem edição de Word, GitHub, código ou deploy.
- Área Programa didático dentro da administração de cursos: criar, editar, duplicar, dividir, juntar, reordenar e excluir aulas mediante confirmação e preservação do histórico. Gerenciar módulos e programas de diferentes obras.
- Campos: número, módulo, título, tipo (estudo da obra, temática, palestra, revisão, feriado, evento especial), assuntos/subtemas/objetivos, referências de leitura, questões avulsas e intervalos combináveis (ex.: 1–16, 22, 35–40), materiais PDF, vídeo, texto e eventual áudio. Não impor questões numeradas a outras obras. Alertar sobre lacunas e sobreposições sem corrigir automaticamente.
- Separar programa pedagógico (conteúdo, sequência, objetivos, materiais de referência) de calendário da turma (datas, horários, professores, facilitadores, reagendamentos e materiais específicos).
- Versionar programas: duplicar versão original, adaptar e associar a novas turmas sem alterar histórico anterior. Permitir alteração de turma em andamento com aviso de impacto em aulas já estudadas e progresso; preservar registros e exigir confirmação. Não apagar histórico por edição ou exclusão.
- Objetivo: criar e administrar um novo curso completo, módulos, aulas, turmas e matrículas sem programação ou deploy.

### Comunicações por e-mail
- Área Comunicações no painel administrativo. Envio semanal automático por turma, consultando o calendário vigente e o programa didático atualizado. Mensagem personalizada com nome do aluno, curso/turma, tema, questões ou referências de leitura, data, horário, professor/facilitador, link direto para aula autenticada e materiais complementares disponíveis.
- Identidade visual coerente com a plataforma (azul-marinho, marfim e dourado), modelo responsivo, identificação da turma e preferências de comunicação. Datas, horários e facilitadores dos protótipos são ilustrativos.
- Configurar por turma: ativar/desativar, dia da semana, horário, informações incluídas. Domingo às 08h foi exemplo, não horário definitivo. Considerar fuso da turma, feriados, recessos, cancelamentos e reagendamentos. Não enviar lembrete incorreto de aula cancelada.
- Outros envios aprovados conceitualmente: aprovação de cadastro e confirmação de matrícula automáticas; alteração de horário e cancelamento mediante confirmação administrativa; aviso de material opcional; comunicado geral manual à turma.
- Aluno matriculado em vários cursos recebe as comunicações das respectivas turmas, sem duplicação indevida. Restringir destinatários a matrículas autorizadas/ativas, manter histórico de envios e evitar duplicatas em reexecuções. Respeitar preferências de comunicação e privacidade; não expor endereços de outros alunos.
- Serviço de envio e agendamento independente do Worker de agendas do site institucional. Não alterar o Worker atual. Avaliar provedor, custos, limites, entregabilidade e autenticação do domínio antes de implementar.
- Estado: requisitos aprovados e documentados; nenhuma implementação, configuração de infraestrutura ou envio real autorizado nesta etapa.


## 28/11/2026 — Consolidação das 50 decisões (aprovadas)
Esta seção prevalece sobre propostas e pendências anteriores conflitantes. Preservar o histórico acima. Autorização atual limitada à documentação, não à implementação.

### A — Identidade
01. Nome provisório: Estudos Espíritas. Destacar centro, curso e turma.
02. Usar inicialmente o logotipo atual do Paz que Ilumina; revisar ao final. Rodapé em todas as páginas: “Uma iniciativa Paz que Ilumina”, link https://pazqueilumina.com.br e identificação de plataforma gratuita.
03. Plataforma gratuita, independente, sem vínculo comercial ou institucional obrigatório com centros. Cadastro de centros (nome, logo opcional, endereço, cidade/UF, telefone, e-mail, site, redes, mapa, observações); vincular centro à turma, não ao curso. Administração centralizada, sem contas administrativas por centro. Permitir turmas simultâneas em centros diferentes.

### B — Conta
04. Nome completo e e-mail.
05. Login por código temporário de e-mail e Google; associar métodos à mesma conta mediante verificação segura.
06. Sessão persistente; duração a definir tecnicamente.
07. Alteração de e-mail com confirmação do novo endereço e preservação dos dados.
08. Sem perfil pessoal, foto, biografia ou perfil público; apenas configurações da conta e preferências.

### C — Inscrição e matrícula
09. Escolher curso e turma na inscrição; link específico já preseleciona ambos.
10. Aprovar cadastro e matrícula em uma operação administrativa, mantendo registros separados.
11. Capacidade opcional configurável desde a primeira versão, inicialmente sem limite.
12. Período de inscrição configurável desde a primeira versão, inicialmente irrestrito.
13. Permitir ingresso em turma em andamento quando inscrições abertas.
14. Quem deixa de frequentar mantém acesso, sujeito às regras administrativas de acesso.

### D — Permissões
15. Apenas administrador geral, professor e aluno; sem perfil separado de coordenador/facilitador.
16. Professor com login próprio e permissões restritas às turmas/aulas atribuídas.
17. Professor e administrador podem incluir, editar e gerenciar materiais; professor não altera programa, calendário, matrículas ou configurações gerais.
18. Publicação imediata sem aprovação prévia; administrador pode revisar, corrigir e retirar. Recomenda-se auditoria de autoria e alterações.

### E — Obras e conteúdo
19. Importar obra integral, preservar PDF original, converter preferencialmente para Markdown por capítulos, validar fidelidade e estruturar unidades de leitura no banco. Formato técnico a definir conforme a obra.
20. Sem editor rico de conteúdo.
21. Pesquisa independente por questão, palavra, trecho ou assunto.
22. Biblioteca integral na estrutura original.
23. Administrador pode corrigir transcrição pelo painel, com histórico e original preservado.
24. Cada curso define edição/tradução de referência. Aulas referenciam unidades da edição sem duplicar texto; correções refletem nas aulas. Selecionar questões, capítulos, itens ou trechos; páginas como referência complementar. Estrutura genérica para outras obras. Verificar direitos de reprodução da edição antes da publicação.

### F — Calendário
25. Gerar todas as datas por início e periodicidade configurável, normalmente semanal.
26. Detectar feriados e deslocar aulas seguintes automaticamente; permitir adiamentos manuais. Recomendações: feriados nacionais/estaduais/municipais conforme local, recessos, exceção de aula em feriado e prévia de impacto. Fonte de feriados a definir.
27. Instituição, endereço, sala e horário; possibilidade de exceção por aula recomendada.
28. Exportação ICS para Google Agenda, Outlook e celulares; assinatura sincronizável recomendada, a validar.

### G — Leitura
29. Marcar questão individual ou aula inteira como lida.
30. Anotações privadas por questão e aula.
31. Favoritos de questões e trechos.
32. Ajuste de fonte Aa; sem modo escuro ou configurações avançadas.
33. Acesso após conclusão por padrão. Estados em andamento, concluída (acesso mantido), arquivada (acesso à turma encerrado, dados preservados); administrador pode reativar. Preservar anotações, favoritos e conquistas.

### H — Gamificação
34. Indicadores independentes de leitura da obra e conclusão de aulas. Curso de O Livro dos Espíritos deverá contemplar todas as 1.019 questões; omissões do planejamento serão acertadas posteriormente, sem correção automática do original. Recomenda-se relatório de cobertura, lacunas e repetições.
35. Um fruto por questão, mesmo repetida.
36. Aulas especiais concluídas por botão, sem frutos adicionais.
37. Pomar independente por obra.
38. Releitura/repetição em nova turma preserva frutos e conquistas; progresso das aulas separado por turma.

### I — Materiais
39. Vídeos exclusivamente por links externos, sem upload.
40. PDF visualizável e baixável.
41. Biblioteca centralizada organizada por curso; apresentações e demais materiais vinculados ao curso e às aulas correspondentes.

### J — Comunicações
42. Envio automático sem aprovação prévia ou envio de teste obrigatório.
43. Avisar quando não houver aula por feriado/recesso.
44. Aluno pode desativar e-mails semanais, mantendo comunicados importantes de alteração/cancelamento. Manter demais requisitos de comunicação anteriores, sem interferir no Worker institucional.

### K — Dashboard e relatórios
45. Cursos/turmas ativos, alunos, solicitações pendentes, próximas aulas, e-mails enviados por mês, alunos por curso/turma; aulas totais, realizadas, restantes, percentual e previsão de término por turma. Estatísticas por centro possíveis.
46. Administrador e professores autorizados consultam progresso individual de leitura; anotações privadas. Não equivale a presença, avaliação ou evolução espiritual.
47. Exportar inscrições, matrículas, programas e relatórios em CSV, Excel e PDF.

### L — Infraestrutura
48. Priorizar serviços gratuitos nesta etapa; validar cotas, especialmente e-mail e autenticação, antes de implementar.
49. Turma habitual 20–30 alunos, excepcional até 50. Dimensionamento sugerido (não limite obrigatório): 500 alunos iniciais na plataforma e crescimento para 1.000 ou mais. Capacidade real sujeita a validação técnica.
50. Manter Estudo semanal atual exatamente como está, sem migração, substituição ou desativação. Plataforma de cursos independente em cursos.pazqueilumina.com.br; reutilização de conceitos/código sem modificar o ambiente existente.

### Divulgação e inscrição por turma — primeira versão
- Link público exclusivo e estável por turma, com centro, curso e turma preselecionados; página mostra nome/logo do centro, curso, local, horário e disponibilidade.
- Painel gera link copiável, QR Code, código HTML para chamada no site do centro e compartilhamento por WhatsApp. Centro divulga sem acesso administrativo.
- Link permanece funcional quando inscrições fechadas ou vagas esgotadas, informando indisponibilidade. Validar limites e período também no servidor.
- Solicitação pública; conteúdo privado para matrículas aprovadas. Aprovação administrativa e confirmação automática por e-mail.

### Próxima etapa
50 questões respondidas. Antes de implementar: definir arquitetura e modelo de dados, validar serviços gratuitos, autenticação, e-mail, feriados, direitos das edições, backups/restauração, auditoria, permissões no servidor, LGPD, identificadores estáveis e plano de desenvolvimento/testes privados. Datas, professores e edição concreta da primeira turma ainda a definir. Nome/logo provisórios. Nenhuma infraestrutura, código, deploy ou migração autorizados por esta atualização documental.


## Arquitetura técnica — 28/11/2026 (projeto autorizado, implementação ainda não iniciada)

### Decisões técnicas propostas para execução
Repositório privado independente pazqueilumina/cursos, branch main, Cloudflare Pages para interface responsiva e API Functions, Worker separado para tarefas Cron, D1 SQLite e R2 Standard privado. JavaScript modular, HTML/CSS, dependências mínimas, testes locais Wrangler e banco local; migrations SQL versionadas. Sem alterações no Estudo semanal, Bíblia ou Worker institucional. Domínio cursos.pazqueilumina.com.br somente após autorização de publicação. Separar ambientes local e produção, segredos por bindings, sem credenciais no Git. Frontend acessível, sem framework pesado obrigatório. API JSON versionada /api/v1; conteúdo privado servido apenas após autorização, sem cache público.

### Modelo relacional inicial
- users(id, name, email_normalized UNIQUE, email_verified_at, status, created_at); user_roles(user_id, role); identities(user_id, provider, subject UNIQUE por provider); sessions(token_hash, user_id, expires_at, revoked_at); auth_challenges(email, code_hmac, expires_at, attempts, consumed_at); user_preferences(user_id, weekly_email, font_scale).
- centers(id, name, logo_key, address, city, state, timezone, contacts, lat, lng, status).
- works(id, title); editions(id, work_id, translator, publisher, year, rights_status, original_file_id); reading_units(id, edition_id, parent_id, kind, reference, sort_order, markdown, plain_text, original_page); reading_revisions(unit_id, previous_text, editor_id, timestamp). Índice de busca FTS5 sujeito a teste D1; alternativa busca indexada por referência e texto paginado.
- courses(id, title, edition_id, status); program_versions(id, course_id, version, status); modules(id, version_id, title, sort_order); lessons(id, module_id, display_number, title, kind, sort_order); lesson_units(lesson_id, unit_id, sort_order); versões publicadas imutáveis, clonagem para alterações com histórico.
- cohorts(id, course_id, version_id, center_id, name, status, start_date, timezone, recurrence, default_time, room, capacity_nullable, signup_open_nullable, signup_close_nullable, public_slug UNIQUE); cohort_lessons(id, cohort_id, lesson_id, scheduled_at, status, room_override, revision); calendar_exclusions(id, cohort_id, local_date, reason); teaching_assignments(user_id, cohort_id, cohort_lesson_id nullable).
- applications(id, user_id, cohort_id, status, timestamps); enrollments(id, user_id, cohort_id, status, UNIQUE(user_id,cohort_id)); aprovação atômica com checagem de capacidade e prazo, idempotência; cadastro manual auditado.
- reading_progress(user_id, unit_id, read_at, UNIQUE(user_id,unit_id)); lesson_progress(user_id, cohort_lesson_id, completed_at); notes(id,user_id,unit_id ou cohort_lesson_id,body); favorites(user_id,unit_id, optional_range); pomar derivado de identificadores de questões canônicas por obra (mapear edições, não duplicar frutos), sem pontuação espiritual. Marcar aula inteira em lotes idempotentes; progresso de turma independente.
- files(id, object_key, mime, size, hash, status); materials(id, course_id, lesson_id nullable, cohort_id nullable, cohort_lesson_id nullable, file_id ou external_url, author_id, status); autorização conforme vínculo. PDF privado, vídeo somente URL. 
- communication_settings(cohort_id, weekday, time, enabled); email_outbox(id, recipient_id, cohort_id, type, dedupe_key UNIQUE, due_at, status, attempts, provider_id); audit_events(actor_id, action, target_type, target_id, time, metadata minimizados). Índices para FKs, status, datas e escopos; IDs estáveis, constraints, transações/batches, paginação, soft delete.
Modelo lógico, não DDL executado. Validar integridade, cardinalidade, versionamento e operações concorrentes antes da primeira migration.

### Segurança e privacidade
Login Google OIDC com state, nonce, PKCE e validação assinatura/issuer/audience/exp/sub; nunca vincular automaticamente conta por e-mail não comprovado. OTP de uso único, HMAC com segredo, expiração proposta 10 min, máximo 5 tentativas, cooldown e rate limit de IP/e-mail, proteção Turnstile a validar. Sessão opaca aleatória, hash no D1, cookie Secure HttpOnly SameSite=Lax host-only, prazo proposto 30 dias para aluno, menor para gestão, revogação imediata e CSRF. Mudança de e-mail exige reautenticação e confirmação, mantendo ID. Admin inicial provisionado explicitamente; MFA para gestão recomendado. Permissões verificadas em todas APIs e downloads: admin geral; professor nas turmas atribuídas com materiais e leitura individual; aluno somente matrícula própria autorizada; notas privadas inclusive perante professores. Sanitizar Markdown/HTML, CSP, prepared statements, validação de arquivos/URLs, limites de upload, não registrar OTP/tokens. Dados de participação em estudos espíritas podem revelar convicção religiosa (dados sensíveis LGPD); minimizar, definir base legal adequada e aviso, retenção, acesso/exportação/exclusão, controle de professores, não expor listas de alunos. Revisão jurídica/privacidade antes do lançamento.

### Capacidade e custos — fontes oficiais consultadas 28/11/2026
Workers Free: 100 mil requisições/dia, CPU 10 ms; https://developers.cloudflare.com/workers/platform/limits/
D1 Free: 5 milhões linhas lidas/dia, 100 mil escritas/dia, 500 MB por banco, 5 GB conta, 10 bancos, 50 consultas por invocação, Time Travel 7 dias; https://developers.cloudflare.com/d1/platform/limits/ e https://developers.cloudflare.com/d1/platform/pricing/
R2 Standard: 10 GB-mês, 1 milhão operações A e 10 milhões B/mês gratuitos, egress grátis; excedentes podem ser cobrados; https://developers.cloudflare.com/workers/platform/pricing/
Resend candidato: 100 emails/dia e 3 mil/mês gratuitos; https://resend.com/pricing?product=transactional . Google OIDC: https://developers.google.com/identity/openid-connect/openid-connect .
Estimativa: 30 alunos x 5 semanas = 150 lembretes/mês; 50 = 250; 500 = 2500, sem OTP/avisos, portanto e-mail é gargalo (500 no mesmo dia excede 100/dia). 500 alunos x 1019 questões = 509500 registros máximos de leitura de uma obra, não simultâneos; usar índices e lotes, testar espaço real. Limites de conta compartilhados com site existente podem reduzir folga; não foi inspecionado consumo real. Monitorar cotas, reservar prioridade para OTP/avisos urgentes, distribuir lembretes quando permitido, fila com retry/backoff e deduplicação, não atrasar silenciosamente cancelamentos. Provedor alternativo/upgrade somente autorizado. R2 exigir alertas e limites de aplicação; custo zero objetivo, não garantia. Validar Pages build/quota e Cron antes de provisionar. SPF/DKIM/DMARC e subdomínio remetente separado sem alterar registros existentes indevidamente.

### Operação
Cron consulta outbox e calendário no fuso da turma, envia com idempotência e registra falhas; evitar execução concorrente. ICS com UID estável, SEQUENCE e timezone; feed privado revogável se implementado. Feriados: importar calendário oficial por local/ano com revisão humana, exceções e prévia dos efeitos; fonte automática ainda não escolhida. Backup D1 export periódico criptografado fora da conta, R2 cópia/versionamento lógico dos objetos, teste de restauração em ambiente isolado; proposta RPO 24h/RTO 4h a validar. Nunca rollback de schema destrutivo sem backup. Métricas de erro, cotas, fila e auditoria; sem dados sensíveis em logs. Exportações grandes paginadas/geradas localmente quando adequado aos limites CPU.

### Estrutura e fases
/public (assets, CSS, JS, páginas), /functions/api/v1, /src (serviços, auth, autorização, validação), /migrations, /scripts/import, /worker-email, /tests, /docs, wrangler config sem segredos. Importar PDF->Markdown revisado->manifest de metadados->unidades com IDs e referências->validação de cobertura/duplicatas->publicação após conferência e direitos; preservar original. Não usar IA em runtime nem cobrar API de conversão.
1. Fundação local: repo, migrations, auth, permissões, testes de isolamento, recuperação.
2. Admin: centros, obras, cursos, programas e turmas; importador e calendário.
3. Inscrição pública por turma, QR/HTML, aprovação, matrículas.
4. Área aluno: leitura, pesquisa, notas, favoritos, progresso/Pomar.
5. Materiais e comunicações, ICS, dashboards/exportações.
6. Testes privados ponta a ponta, acessibilidade, carga, custos e restauração; revisão visual, publicação separadamente autorizada.
Critérios mínimos: duas turmas do mesmo curso/centros distintos, ausência de acesso cruzado, concorrência na última vaga, revogação, adiamento em feriado, questões repetidas sem duplicar fruto, notas privadas, e-mails sem duplicar, exportações e restauração. Nenhuma configuração externa, banco, código ou deploy foi executado nesta etapa. Pendentes: acesso/consumo real Cloudflare, provedor e domínio remetente, OAuth Google, edição licenciada, calendário/feriados, datas e docentes, validação técnica de SDKs e quotas.


## Requisito obrigatório — Mobile-first e responsividade
Aprovado em 28/11/2026. Projetar desde a primeira versão para celulares, tablets e computadores, priorizando a experiência móvel, especialmente dos alunos. Não tratar responsividade como ajuste posterior.
- Todas as funcionalidades, inclusive administração, inscrição, autenticação, leitura, pesquisa, notas, favoritos, Pomar, calendário, materiais e relatórios, devem ser utilizáveis no celular.
- Layout adaptativo sem rolagem horizontal da página; tabelas administrativas adaptadas ou com rolagem localizada; navegação e formulários adequados ao toque, sem depender de hover.
- Texto legível sem zoom, ajuste Aa, controles com alvos de toque confortáveis, contraste e acessibilidade; leitura de aulas longas com navegação e retomada de posição.
- PDFs com visualização e download compatíveis com dispositivos móveis; links externos e calendário ICS testados.
- Otimizar carregamento, imagens, JavaScript e consultas para conexões móveis lentas; evitar carregar toda a obra de uma vez.
- Testar desde cada etapa em larguras de 320, 360, 390 e 430 px, tablets e desktop, Chrome Android e Safari iOS, orientação retrato e paisagem. Validar em dispositivos reais quando disponíveis; registrar limitações quando não disponíveis.
- Critério de aceite: fluxos completos de inscrição, login, leitura, marcação, anotações, favoritos, Pomar e administração sem bloqueios ou sobreposição em telas pequenas. Não considerar uma etapa concluída sem validação responsiva.


## Requisito obrigatório — Mobile First (28/11/2026)
- Desenvolver prioritariamente para celulares, com experiência completa também em tablets e computadores. Responsividade não é ajuste posterior: integra arquitetura, protótipos, implementação e critérios de aceite de cada etapa.
- Todas as funções do aluno devem funcionar plenamente no celular: inscrição, autenticação, leitura integral e por aula, ajuste de fonte Aa, busca, marcação de leitura, notas, favoritos, Pomar, calendário, materiais, PDFs, downloads e links de e-mail. Sem depender de mouse, hover ou orientação horizontal.
- Interface adaptativa, sem rolagem horizontal da página, texto legível, controles de toque preferencialmente de pelo menos 44 CSS px, contraste adequado, navegação clara, suporte a zoom e teclado virtual, formulários simples e feedback de erros acessível.
- Painel administrativo responsivo, incluindo professores; adaptar tabelas, filtros e formulários para telas estreitas, sem ocultar funcionalidades essenciais. Operações complexas podem ser mais confortáveis no desktop.
- Otimizar carregamento em redes móveis: imagens responsivas, carregamento sob demanda de PDFs e recursos pesados, paginação quando adequada, evitar downloads automáticos e preservar progresso diante de falhas de conexão, sem prometer funcionamento offline.
- Homologar em Android/Chrome e iOS/Safari, tablets e desktop, larguras representativas de 320, 360, 390, 768 e 1280 CSS px, orientação vertical/horizontal, fonte ampliada e conexão lenta. Testes em emuladores complementam, não substituem testes reais quando disponíveis. Validar navegação, formulários, teclado, leitura, materiais, Pomar e fluxos administrativos. Registrar limitações e corrigir bloqueios móveis antes da publicação.
- Critério de lançamento: nenhuma funcionalidade essencial do aluno pode exigir computador. Requisito aprovado; implementação e testes ainda não realizados.


## Marca-texto digital e destaques populares — 28/11/2026
Recurso aprovado para primeira versão, inspirado no Kindle.
- Selecionar trechos arbitrários de perguntas, respostas, comentários e demais textos da obra; destacar em amarelo, verde, azul ou rosa, alterar cor, remover e associar anotação privada ao trecho.
- Área Meus destaques organizada por obra/capítulo, sincronizada entre dispositivos. Destaques vinculados à unidade textual e edição, não à aula; visíveis ao próprio aluno na biblioteca e nas aulas correspondentes.
- Modelo proposto: highlights(id,user_id,unit_id,revision_id,start_offset,end_offset,exact_quote,prefix,suffix,color,created_at,updated_at); notas vinculáveis ao highlight. Reancorar por contexto após correções; preservar trecho original e sinalizar casos ambíguos, sem apagar silenciosamente.
- Destaques populares: exibir contagem agregada de leitores distintos que destacaram trecho coincidente, incluindo sobreposições parciais; não duplicar contagem por usuário. Consolidar por edição entre turmas, sem expor nomes, anotações, cores ou dados individuais. Proposta inicial de limiar mínimo de cinco leitores distintos, ajustável após avaliação de privacidade; não publicar recortes por turma/centro nem contagens abaixo do limiar. Considerar consentimento específico/opt-out da contribuição agregada, dada a sensibilidade dos dados; validar LGPD antes de ativar. Preferência para ocultar destaques populares.
- Diferenciar visualmente destaque pessoal e popular, sem ranking ou pontuação espiritual. Agregação no servidor, acesso restrito a alunos autorizados, sem API de dados individuais de terceiros. Algoritmo de sobreposição, atualização de agregados e proteção contra inferência a validar.
- Mobile First: seleção nativa de texto e menu acessível ao toque, sem interferir na seleção do Android/iOS, testar seleção em múltiplas linhas e com fonte ampliada. Nenhuma implementação autorizada por esta atualização documental.
