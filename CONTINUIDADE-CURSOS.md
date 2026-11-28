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
