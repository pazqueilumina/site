# Continuidade do projeto — Paz que Ilumina

> **Atualizado em:** 23/11/2026 — passagem de contexto após o deploy da segunda revisão de impressão do Relatório Administrativo  
> **Último commit de código verificado antes desta atualização documental:** `973e0bab6dcc855b4c93a51eb9bf59e2c34b8e5c` (**Cloudflare Pages: sucesso**). O commit de atualização deste próprio documento será posterior.  
> **Repositório:** https://github.com/pazqueilumina/site  
> **Branch de trabalho autorizada:** `main`  
> **Site:** https://pazqueilumina.com.br  
> **Referência técnica recente:** `973e0bab` (impressão administrativa). Os números e registros das seções históricas são fotografias de commits anteriores; revalidar antes de usar.  
> **Natureza deste arquivo:** registro de contexto e decisões para retomada em outro chat; não é autorização para alterar código, dados, versões ou publicar.

## 1. Regras obrigatórias combinadas com o responsável

1. **Não criar, editar, compilar, publicar, fazer commit, deploy nem rollback sem autorização explícita.** Uma pergunta, discussão ou pedido de sugestão não autoriza implementação. Uma ordem como “pode fazer o deploy” autoriza a implementação e publicação da alteração em discussão.
2. **Trabalhar diretamente na `main`**, sem criar ou utilizar a antiga branch `teste-admin`. Não reabrir a discussão sobre testes nessa branch por iniciativa própria.
3. **Antes de cada deploy**, identificar o commit atual da `main` como ponto de retorno. Fazer alteração delimitada, validar, criar commit identificado e confirmar o novo HEAD. **Rollback também exige autorização.**
4. **Não confundir GitHub com Cloudflare:** commit confirmado na `main` não prova, por si só, que o deploy automático foi concluído ou que a produção está funcionando. Informar o que foi efetivamente verificado.
5. Preservar dados existentes, IDs, cadastros e comportamentos aprovados. Não reestruturar Agenda/Palestras/Locais por conta própria.
6. Respostas objetivas, em português, com análise de causas e riscos. Investigar a origem de falhas repetidas em vez de fazer correções cosméticas.
7. **Programa Windows:** não gerar executável, versão, pacote ou instalador sem autorização específica.
8. **Regra expressa de preservação:** **NUNCA retirar, ocultar, substituir, apagar ou reduzir informações, indicadores, menus, dados ou funcionalidades sem confirmar previamente com o responsável.** Mesmo uma correção visual deve preservar o conteúdo integral. Não reintroduzir componentes retirados a pedido do usuário (ex.: seletor “Outros períodos…”).

## 2. Arquitetura atual verificada no repositório

O site público é predominantemente estático (HTML, CSS e JavaScript). O painel administrativo usa **Cloudflare Pages Functions** para ler e publicar cadastros no **GitHub**. Acesso administrativo é protegido por **Cloudflare Access**, com validação adicional de JWT no código. O Dashboard administrativo consulta **Cloudflare Web Analytics**. Áudios novos podem ser enviados ao **Cloudflare R2**; PDFs de palestras são enviados ao **GitHub**.

| Área | Arquivos relevantes |
| --- | --- |
| Site público | `index.html`, `agenda.html`, `apresentacoes.html`, `videos.html`, `audios.html`, `slides.html`, `sobre.html`, `contato.html`, `livro.html`, `js/app.js`, `js/dados.js` |
| Agenda administrativa | `admin/agenda.html`, `admin/admin.js`, `functions/api/admin/agenda.js`, `server_lib/agenda.js` |
| Cadastro de palestras | `admin/palestras.html`, `admin/palestras.js`, `functions/api/admin/palestras.js`, `server_lib/palestras.js` |
| Cadastro de centros/locais | `admin/locais.html`, `admin/locais.js`, `functions/api/admin/locais.js`, `server_lib/locais.js` |
| Dashboard administrativo | `admin/dashboard.html`, `admin/dashboard.js`, `admin/dashboard.css`, `functions/api/admin/audiencia.js`, `functions/api/admin/evolucao-visitas.js`, `functions/api/admin/atividade.js` |
| Dashboard do palestrante | `admin/palestrante.html`, `admin/palestrante.js`, `admin/palestrante.css`, `functions/api/admin/rotas.js`, `functions/api/admin/mapa-centros.js` |
| Relatórios e impressão | `admin/relatorios.html`, `admin/report-view.js`, `admin/report-print.css`, `admin/dashboard.html`, `admin/palestrante.html` |
| Inscrições e monitor de e-mails | `admin/inscritos.html`, `functions/api/admin/inscritos.js`, `admin/dashboard.js`, `admin/dashboard.html`; Worker de e-mails **separado** do deploy do site |
| Mapa | Leaflet 1.9.4 em `vendor/leaflet/`; mosaicos Esri World Street Map; geocodificação/rotas em `server_lib/geocode.js` |
| Arquivos de mídia | `pdf/` no GitHub; `audio/` legado no site; novos áudios via `functions/api/admin/audio-r2.js` |
| Segurança/ambiente | `functions/admin/_middleware.js`, `functions/api/admin/_middleware.js`, `server_lib/access.js`, `server_lib/branch.js` |

**Configurações por ambiente (nomes, não valores):** `GITHUB_TOKEN`, `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD`, `CF_ADMIN_EMAILS`, `CF_ANALYTICS_TOKEN`, `CF_ACCOUNT_ID` (opcional), `ORIGEM_DESLOCAMENTOS` e binding R2 `PALESTRAS_AUDIOS`. **Nunca gravar segredos nem o endereço residencial usado como origem de deslocamentos neste repositório.**

### Cadastros: fotografia do commit auditado

- **Agenda:** `js/dados.js`, 25 eventos com IDs `evt-0001` a `evt-0025`. O painel suporta importação CSV, identificação de duplicados/rejeitados e relatório.
- **Palestras:** `data/palestras.json`, 79 registros com IDs `PAL-....`. O cadastro contém campos como `centroId`, `youtubeId`, `duracao`, `audio`, `pdf` e status de mídia. A duração é normalizada para **`HH:MM:SS`**.
- **Centros/Locais:** `data/locais.json`, 9 locais. **Nenhum dos 9 tem latitude/longitude gravadas no arquivo auditado.** Campos suportados incluem `id`, `nome`, `endereco`, `bairro`, `cidade`, `uf`, `maps`, `latitude`, `longitude`, `kmIdaVolta`.
- **Relacionamento Agenda × Palestras:** o código contempla referências como `localId` (Agenda) e `centroId` (Palestras), mas **nenhum dos 79 registros auditados tinha `eventoId`**. Não presumir que o relacionamento um-para-muitos esteja resolvido só porque foi discutido em conversas anteriores.

Esses números são um **retrato histórico**, não totais permanentes: consultar os arquivos atuais antes de cada nova tarefa.

## 3. Funcionalidades e decisões recentes

### Dashboard do palestrante — mapa de centros

- Exibe **somente centros visitados no período selecionado**, com marcadores numerados e lista lateral. Não exibir residência como marcador.
- Mapa Leaflet com mosaicos Esri. Correção de carregamento nativo do Leaflet e arquivos locais: commit `7b32b760`.
- Ampliação em sobreposição de tela cheia pelo botão no canto superior direito; fecha pelo botão ou tecla **Esc**; mantém a instância do mapa e a lista original: commit `ad7a7892`.
- Cache de coordenadas elegíveis no navegador/servidor, preservação de mosaicos e botão **“Preparar coordenadas verificadas”** no Cadastro de Locais: commit `246e75ae`.
- **Resultado observado pelo usuário:** a otimização de carregamento **não produziu melhora significativa**. Não apresentar esse problema como resolvido.

### Dashboard do palestrante — ranking presencial e online (última entrega)

- **Commit `45ed4378`:** corrigiu a inconsistência entre o quadro “Por onde Alexandre passou” e o mapa, passando a consultar eventos **já realizados** da Agenda em vez de depender de `centroId` preenchido em Palestras.
- **Commit `1c661223` (último código na `main` conferido em 22/11/2026):** separou o quadro em **Visitas presenciais** e **Participações online**, agrupando cada modalidade por instituição, e não mais todas as transmissões sob o rótulo genérico “You Tube”. A plataforma (YouTube, Instagram etc.) aparece como informação complementar. Não há mais destaque arbitrário de um centro empatado em visitas.
- **Teste com os dados reais de outubro de 2026:** presenciais: **Grupo Espírita Fabiano — 1 visita**, **Lar de Frei Luiz — 1 visita**; online: **Cristo Consolador — 2 participações no YouTube**, **Consolador – Comunidade Espírita Cristã — 1 participação no Instagram**. O KPI de Centros Espíritas/Instituições passa a mostrar **4 instituições distintas** nesse período.
- A contagem de visitas presenciais segue a mesma deduplicação do mapa (evento por data e centro). Participações online são contadas por evento e agrupadas por instituição. A duração só é atribuída quando existe **`eventoId` explícito, único e com duração válida**; não inferir tempo a partir de título, centro ou proximidade de datas.
- **Validação realizada:** sintaxe JS e testes funcionais de agrupamento, períodos vazios, vínculo de duração inequívoco e casos ambíguos; arquivos CSS/HTML atualizados com cache-busting. **O GitHub confirmou o commit na `main`; a conclusão do deploy automático no Cloudflare e a visualização final no navegador do usuário não foram confirmadas.**
- Arquivos modificados: `admin/palestrante.js`, `admin/palestrante.css`, `admin/palestrante.html` e este documento. **Mapa, cálculo de quilometragem e dados da Agenda/Palestras/Locais não foram modificados.**

### Dashboard administrativo — origem das visitas

- Cloudflare Web Analytics informa visitas por país.
- **Bug das bandeiras:** Windows pode renderizar emoji de bandeira como texto “US”. Solução: **Brasil e EUA usam SVG local** (`admin/flag-br.svg` e `admin/flag-us.svg`); outros códigos de país usam imagem com fallback. Commit `24a2fcf2`.
- A alteração foi enviada à `main`; o estado do deploy de produção não foi confirmado no momento do registro.

### Agenda, palestras e centros

- Centro/Local é cadastro separado e fonte preferencial de nome/endereço; o filtro por Centro/Local foi solicitado **na Agenda**, não na página inicial.
- Eventos da Agenda têm IDs estáveis. Não criar botão **Duplicar** sem nova solicitação: o usuário considerou desnecessário porque data/local de eventos variam.
- O usuário está alimentando um **backlog grande de eventos e PDFs**. Evitar uma refatoração estrutural durante esse trabalho sem nova autorização.
- Upload de PDF ao GitHub e de MP3 ao R2 já aparece no código do painel; conferir status real antes de afirmar que qualquer envio foi concluído.
- “You Tube” pode ser um local cadastrado; não inventar regras especiais sem solicitação.

## 4. Pendências e ideias **não autorizadas para implementação**

### P1 — Otimização estrutural do mapa **ADIADA**

O usuário pediu expressamente para **guardar a ideia e não implementar agora**. O diagnóstico discutido foi que as consultas de geolocalização e rotas continuam pesadas, pois as coordenadas não estão persistidas nos 9 locais cadastrados.

**Plano futuro, somente com nova autorização:**
1. Conferir coordenadas exatas de cada centro e gravá-las no Cadastro de Locais.
2. Carregar marcadores diretamente dessas coordenadas, sem repetir geocodificação.
3. Reutilizar distâncias de rotas quando apropriado, invalidando ao mudar endereço/origem.
4. Exibir o mapa independentemente da conclusão dos cálculos de rotas.
5. Preservar visual, lista, filtros, tela cheia e tratamento de erros.

**Não fazer agora.** A solução anterior de cache já está no código; evitar repeti-la como se fosse uma nova solução.

### P2 — Modelo de dados Agenda/Palestras

Após terminar o backlog, avaliar IDs e a modelagem de palestras reutilizáveis versus múltiplas apresentações/eventos, com datas, centros e mídias próprias. **Somente discussão por enquanto.** Não migrar os 25 eventos/79 palestras sem plano de compatibilidade, validação e autorização.

### P3 — Programa Windows v3.1 (separado deste repositório)

Versão **planejada como sucessora da v3.0**: dois modos de PPTX→PDF, seleção múltipla, arrastar e soltar, fila, progresso, remoção de itens, tratamento de erros sem interromper lote, não sobrescrever PDFs e retirar avisos informativos. Conversas antigas mencionam um artefato/código de v3.1 preparado, mas **não foi possível verificar seu arquivo, testes reais, instalação nem lançamento**. Portanto, **status de entrega da v3.1: a confirmar**, e não afirmar que está pronta/publicada. O programa é separado do site; **não há fonte do executável neste repositório auditado**. Não gerar versão/instalador sem autorização.

### P4 — Lembretes por e-mail e Leitura Semanal — estados diferentes

**Lembretes de Agenda (24h e 1h):** implementados em Worker independente do site e testados com entrega real de dois modelos HTML; **envio automático regular ainda não confirmado como ativado**. Ver a seção 10, que prevalece sobre o planejamento histórico da seção 8.8. **Leitura Semanal de PDFs:** continua apenas em planejamento, sem autorização para implementação. Não incluir dados pessoais de destinatários neste arquivo público.

## 5. Inconsistências e riscos que merecem atenção

1. **Arquivo antigo `INSTRUCOES-TESTE-ADMIN.md` está desatualizado:** ele manda usar `teste-admin`, o que **contraria a decisão atual de trabalhar só na `main`**. Não seguir essas instruções como procedimento vigente.
2. **Código `server_lib/branch.js` ainda contém regras para a antiga prévia `teste-admin` em hosts `.pages.dev`**. Isso não autoriza voltar a usar a branch. Se algum dia for necessário revisar essa lógica, discutir impacto e pedir autorização antes.
3. **Ausência de coordenadas persistidas** é o principal gargalo conhecido do mapa. Consultas externas são limitadas e podem demorar.
4. **Não presumir relação `eventoId` ativa**: conferir o esquema e os dados atuais antes de alterar palestras ou agenda.
5. A confirmação de commit no GitHub **não equivale a verificação do deploy Cloudflare**. Não afirmar “publicado em produção” sem evidência.

## 6. Protocolo de trabalho para qualquer novo chat

1. Ler **este documento** e a solicitação atual do usuário.
2. Consultar o HEAD real de `main` e os arquivos específicos da funcionalidade envolvida; este documento pode estar desatualizado.
3. Confirmar se a solicitação é **análise** ou **autorização explícita de implementação/deploy**.
4. Se autorizado: anotar commit anterior; alterar apenas o necessário; validar sintaxe e comportamento; preservar dados; criar commit em `main`; verificar novo HEAD; verificar produção quando possível.
5. Informar exatamente o que mudou, commit, resultados de testes e estado **confirmado ou não** do Cloudflare.
6. **Atualizar este documento junto das mudanças significativas autorizadas**, especialmente novas decisões, pendências, arquitetura e bugs resolvidos. A atualização **não é automática** e nunca autoriza trabalho não solicitado.

### Texto para iniciar outro chat

> Estamos continuando o projeto **Paz que Ilumina**. Repositório GitHub: `pazqueilumina/site`, branch **`main`**, site **https://pazqueilumina.com.br**. **Antes de qualquer proposta ou alteração, leia integralmente o arquivo `CONTINUIDADE-PROJETO.md` no GitHub e confira o HEAD atual da `main` e os arquivos relacionados à minha próxima solicitação.**
>
> **Regras obrigatórias:** nunca retirar, ocultar, substituir ou eliminar informações, indicadores, dados, menus ou funções sem minha confirmação prévia; não reintroduzir recursos que pedi para retirar; não modificar código, gerar versões, fazer commit, deploy ou rollback sem minha autorização explícita. Quando eu autorizar, trabalhar diretamente na `main` (não usar `teste-admin`), validar a alteração, verificar o deploy Cloudflare Pages e registrar a decisão no documento de continuidade. Não alterar o Worker de e-mails sem ordem específica.
>
> **Último trabalho concluído:** segunda revisão da impressão do Relatório Administrativo, commit `973e0ba`, deploy Cloudflare Pages confirmado como **sucesso**. O relatório imprime em A4 retrato com cópia exclusiva para impressão, KPIs compactos, gráficos e quadros em duas colunas. **A prévia com dados reais dessa última revisão ainda precisa ser conferida**; não afirmar que ficou definitivamente em 2 páginas sem essa confirmação. O Relatório do Palestrante manteve a revisão anterior.
>
> **Estado importante:** Dashboard Administrativo e do Palestrante, menus Gestão/Acervo, Relatórios, filtros Mensal/Ano inteiro, Inscrições da agenda, Monitor de e-mails e Atividades recentes já foram implementados; o seletor “Outros períodos…” foi retirado por solicitação expressa e não deve voltar. A área **Estatísticas** como análise detalhada está somente planejada. O envio semanal de agendas continua **desativado** (`weeklyEnabled=false`) até minha autorização. A otimização estrutural do mapa foi adiada. O programa Windows v3.1 é projeto separado e não deve ser gerado sem ordem específica.
>
> **Não implemente nada apenas por ler este prompt.** Primeiro confirme o estado do repositório e aguarde minha próxima tarefa.

## 7. Histórico de referência

| Commit | Mudança |
| --- | --- |
| `1c661223` | Separação entre centros presenciais e participações online por instituição no Dashboard do Palestrante |
| `45ed4378` | Quadro “Por onde Alexandre passou” passou a usar a Agenda como fonte |
| `8b03876e` | Segunda revisão histórica do documento de continuidade |
| `24a2fcf2` | Bandeiras por imagem no Dashboard administrativo, com SVG local para BR/US |
| `246e75ae` | Cache de mapa, mosaicos reaproveitados e preparação de coordenadas verificadas |
| `ad7a7892` | Ampliação do mapa em tela cheia |
| `7b32b760` | Leaflet local e correção do carregamento dos mosaicos |

**Manutenção deste registro:** atualizar a data, os dados auditados e o histórico quando houver mudança relevante e autorizada. Em caso de conflito entre este texto e os arquivos atuais, **inspecionar o código e esclarecer a divergência antes de agir**.


## 8. Segunda revisão: decisões históricas recuperadas (22/11/2026)

Esta seção complementa o inventário anterior com decisões recuperadas de conversas de novembro de 2026, do histórico de commits do GitHub e do código atual. **Não equivale a novas tarefas autorizadas.** Sempre distinguir:

- **[CÓDIGO]** comportamento localizado no código da `main` na revisão, sem garantir que esteja funcionando em produção.
- **[HISTÓRICO]** decisão ou relato de implementação em conversa/commit; verificar antes de alterar.
- **[PLANEJADO]** ideia aprovada para análise futura ou especificação ainda sem entrega comprovada.
- **[PENDENTE]** problema, incompatibilidade ou decisão em aberto.

### 8.1 Site público, navegação e busca

- **[CÓDIGO]** O site tem páginas para Início, Agenda, Apresentações, Vídeos, Áudios, Slides/PDF, Livro, Sobre e Contato. O conteúdo público é montado principalmente por `js/dados.js` e `js/app.js`.
- **[CÓDIGO]** A **busca global** normaliza maiúsculas/minúsculas e acentos; pesquisa título, série, autor, descrição e outros campos. Retorna resultados de **Vídeo, Áudio, PDF, Short, Agenda, Livro e Sobre**, nessa ordem de categorias, com links próprios. Resultados de vídeos/Shorts podem exibir miniaturas. Não reimplementar busca local isolada sem conferir esse fluxo.
- **[HISTÓRICO]** A Agenda pública recebeu filtros de **período, pesquisa e Centro/Local**. O filtro por Centro/Local foi pedido **somente na página Agenda**, não na página inicial.
- **[HISTÓRICO]** Áudios novos usam o Cloudflare R2 e podem ser servidos por `audio.pazqueilumina.com.br`; PDFs novos ficam em `/pdf/` do GitHub/Pages. Parte do acervo legado pode apontar para **Internet Archive** ou URLs externas. **Não migrar nem apagar links antigos automaticamente.**
- **[PLANEJADO]** O responsável aprovou a ideia de tornar o projeto **clonável/reutilizável** para criar outro site independente, separando código, identidade visual, dados, credenciais e configurações. Isso **não significa** que já exista pacote genérico pronto. Nunca clonar com credenciais ou dados privados do projeto original.

### 8.2 Agenda administrativa e CSV: regras de preservação

- **[CÓDIGO]** Formulário de novo evento: **Data, Horário, Título e Centro/Local cadastrado são obrigatórios**; link do evento é opcional. O endereço vem do Cadastro de Centros/Locais, **não deve ser editado separadamente na Agenda**.
- **[CÓDIGO]** CSV de Agenda: **acrescentar**, nunca substituir a Agenda inteira por engano. Importação gera **prévia**, identifica **novos, duplicados e inválidos/rejeitados**, permite consultar/baixar relatório de problemas e requer confirmação para adicionar à lista. **Publicar alterações** é etapa separada; a importação não publica sozinha.
- **[CÓDIGO]** CSV usa local cadastrado; instituição não reconhecida é inválida. Colunas legadas como endereço/bairro não devem sobrepor os dados do Cadastro de Locais. A convenção histórica previa Bairro após Endereço, mas a **fonte atual de endereço é o cadastro centralizado**.
- **[HISTÓRICO]** Duplicidade deve considerar eventos já existentes e repetições dentro do próprio CSV; registros rejeitados devem ter motivo legível. Manter dados e IDs dos eventos anteriores.
- **[HISTÓRICO]** A interface foi ajustada para posicionar Centro/Local no final do formulário de novo evento. O usuário rejeitou a criação de botão **Duplicar** para eventos; não incluí-lo sem pedido novo.
- **[CÓDIGO]** IDs estáveis da Agenda `evt-0001` a `evt-0025` foram atribuídos aos 25 eventos do retrato de 22/11/2026. Novos eventos devem receber novos IDs; nunca recalcular IDs existentes por ordem/posição.
- **[PENDENTE]** Antes de alterar vínculos, auditar registros antigos: alguns campos redundantes e relacionamentos foram migrados ao longo de vários commits. Não assumir que todos os eventos históricos estão normalizados.

### 8.3 Palestras, mídia e importação em lote

- **[CÓDIGO]** Cadastro de Palestras usa IDs permanentes `PAL-0001`, `PAL-0002` etc. Esses IDs são para controle administrativo; preservar ao atualizar, importar ou associar mídias. O acervo de referência tinha **79 palestras**.
- **[CÓDIGO]** Formulário permite **vínculo opcional a um evento específico da Agenda** via `eventoId`; se vinculado, data/local vêm do evento. Para registros antigos sem vínculo, existe **data de referência** e marcador de **data aproximada**. O horário foi retirado do cadastro de Palestras, permanecendo na Agenda.
- **[CÓDIGO]** Duração é tratada no padrão **`HH:MM:SS`**. O cadastro inclui URL do YouTube, link ou upload de MP3, link ou upload de PDF, nome de PPT/PPTX/PDF para processamento posterior e status ativo/inativo. No HTML auditado, os limites indicados são **300 MB para MP3** e **20 MiB para PDF**.
- **[CÓDIGO]** Há importação de **URLs do YouTube** e **CSV** com correspondência por ID ou YouTube, rejeição de URLs inválidas, conflito de IDs, vídeos duplicados e nome de arquivo com caminho. Nome de arquivo para processamento deve ser **somente o nome**, sem diretórios.
- **[HISTÓRICO]** A intenção era ter **um CSV único** para associação de YouTube, MP3 e PDF, com atualização parcial sem apagar campos antigos quando vierem vazios; oferecer inclusão por URLs, CSV e associação a palestras existentes. **[PENDENTE]** O parser CSV atual localizado em `admin/palestras.js` reconhece principalmente ID, Título, Data, YouTube e Apresentação; **não afirmar que todo o fluxo de MP3/PDF via CSV único já esteja implementado** sem ampliar/testar o parser.
- **[CÓDIGO]** Publicação de cadastro é feita ao GitHub com confirmação e controle de SHA. Uploads de mídia têm fluxos próprios, com verificações de status. A ação de ativar/desativar uma palestra pode exigir publicação; não confundir mudança local de formulário com mudança no site.
- **[HISTÓRICO]** Não excluir registros ou mídias automaticamente por ausência de campos no CSV. Conflitos de identidade devem ser mostrados e resolvidos explicitamente.
- **[PENDENTE]** A modelagem de **uma palestra reutilizada em múltiplos eventos**, cada um com data/local/mídia próprios, permanece para avaliação após o backlog. O vínculo opcional `eventoId` **não é, por si só, solução completa para muitos-para-muitos**.

### 8.4 Dashboard administrativo: indicadores e visual aprovados

- **[CÓDIGO]** O Dashboard mostra **Visitas**, **Visualizações**, **Vídeos (Shorts)**, **Apresentações**, **Áudios** e **Slides (PDF)**, além de evolução do acervo, distribuição por tipo, origem das visitas, evolução das visitas, conteúdos recentes, atividades, pendências, próximos eventos, resumo e ações rápidas.
- **[CÓDIGO]** Períodos: navegação **mês anterior/próximo**, alternância **Mensal / Ano inteiro**, e opções **Últimos 7, 30, 90 e 365 dias** e **Personalizado**. Comparações e gráficos devem respeitar o mesmo período selecionado.
- **[HISTÓRICO]** Integração com **Cloudflare Web Analytics** via função autenticada; `CF_ANALYTICS_TOKEN` é segredo do ambiente. **Visitas não são necessariamente visitantes únicos**; manter nomenclatura fiel à métrica retornada.
- **[HISTÓRICO/CÓDIGO]** Evolução das visitas foi refinada para **barras verticais roxas com valores**; períodos longos podem ser agrupados por semana/mês. O gráfico de distribuição do acervo usa **rosca**, com números/legendas legíveis. Evitar alterar a paleta ou voltar a layouts já rejeitados sem pedido.
- **[CÓDIGO]** A origem por país usa **imagens de bandeira**, não emoji: BR e US em SVG local, outros países com imagens/fallback. Isso evita a exibição de “US” no Windows.
- **[HISTÓRICO]** O usuário prefere indicadores sóbrios, alinhados, números e cores consistentes com a Agenda; evitar banners e avisos de “carregou com sucesso” desnecessários. Avisos de erro relevantes devem continuar visíveis e fecháveis.
- **[PENDENTE]** Não usar números de capturas de tela de protótipos como estatísticas reais de audiência. Dados de audiência dependem do serviço e do período.

### 8.5 Dashboard do Palestrante: conteúdo, calendário e deslocamentos

- **[CÓDIGO]** Dashboard separado, no mesmo padrão visual do Administrativo, com acesso por menu **Dashboard → Administrativo / Palestrante**. O palestrante exibido é **Alexandre Alves**.
- **[CÓDIGO]** Indicadores: **Palestras, Tempo total, Duração média, Centros Espíritas, Temas e Mês mais ativo**. Inclui evolução das palestras, tempo de palestras, comparações de períodos, centros visitados, assuntos, consolidado anual, destaques, calendário e histórico.
- **[HISTÓRICO]** Comparativos e filtros devem acompanhar mês, ano ou período selecionado; calendário e datas distinguem eventos futuros, passados e aproximados; preservar rótulos e legendas já refinados.
- **[CÓDIGO]** Seção de deslocamentos mostra **quatro indicadores na mesma linha**: **Total percorrido, Viagens, Média e Maior viagem**. O cálculo é de **ida e volta**; a origem deve aparecer na interface apenas como **“Residência – Copacabana”**, sem endereço completo.
- **[HISTÓRICO/CÓDIGO]** Eventos online não entram no cálculo de viagens presenciais. O local “You Tube” foi cadastrado como Centro/Local; não criar tratamento especial no cadastro sem solicitação. Distâncias podem usar coordenadas manuais, geocodificação e rotas externas, com sinalização de aproximações.
- **[CÓDIGO]** Mapa “Centros visitados no período” mostra apenas centros do filtro atual, marcadores e lista; pode ampliar em tela cheia. **[PENDENTE/ADIADO]** Desempenho ainda insatisfatório segundo o usuário; não alterar a arquitetura até nova autorização.
- **[CORRIGIDO EM 22/11/2026]** O quadro “Por onde Alexandre passou” usa os **eventos concluídos da Agenda** e agora separa **Visitas presenciais** de **Participações online**. Os centros presenciais seguem a deduplicação do mapa; os online são agrupados pela **instituição cadastrada na Agenda**, com identificação da plataforma (YouTube, Instagram etc.), sem substituir o nome da instituição por “You Tube”. Por exemplo, em outubro de 2026, Cristo Consolador aparece com 2 participações no YouTube e Consolador com 1 no Instagram, separados dos 2 centros presenciais. O indicador de Centros Espíritas conta instituições distintas, evitando duplicação se uma instituição atuar nas duas modalidades. **Duração só aparece com vínculo explícito `eventoId` inequívoco e duração conhecida**. Isso não altera os cadastros nem a otimização do mapa, que permanece adiada.
- **[HISTÓRICO]** O usuário pediu integração entre o histórico de palestras e a Agenda, com atenção a eventos futuros e dados antigos sem data exata. Não descartar palestras históricas ao filtrar.

### 8.6 Cadastro de Centros/Locais e verificação de endereços

- **[CÓDIGO]** O cadastro centraliza nome, endereço, bairro, cidade, UF, link de mapa, coordenadas opcionais e quilometragem de ida e volta. Agenda e Palestras devem referenciar o local por ID quando possível.
- **[HISTÓRICO/CÓDIGO]** Verificação de endereço passou a ser **sob demanda**: **não verificar automaticamente toda vez que abrir a página**. Resultados recentes são reaproveitados quando o cadastro não mudou.
- **[CÓDIGO]** A verificação distingue localizações exatas/aproximadas, falhas e coordenadas manuais; pode pesquisar por nome da instituição, endereço e links fornecidos do Google Maps. Os serviços de geocodificação/rotas incluem OpenStreetMap e ArcGIS, sujeitos a limitações e políticas de uso. Contagens de status são exibidas de forma discreta, com cores e indicação de atualização.
- **[CÓDIGO]** Botão **“Preparar coordenadas verificadas”** prepara coordenadas elegíveis para revisão e publicação explícita; não é publicação automática nem garantia de que todos os centros já tenham coordenadas.
- **[PENDENTE]** Mesmo após o cache implementado, os 9 centros do retrato auditado ainda não tinham latitude/longitude persistidas. O usuário **adiou** a migração estrutural; não iniciar geocodificação em massa por conta própria.
- **[HISTÓRICO]** A correção de endereço no cadastro deve ser a fonte de verdade para usos futuros; conferir se eventos legados ainda contêm valores redundantes antes de prometer atualização automática retroativa.

### 8.7 Programa Windows: requisitos históricos e limites de verificação

- **[HISTÓRICO]** A versão **v3.0** foi relatada como programa Windows com interface gráfica, fluxo de **YouTube → MP3** (yt-dlp/FFmpeg), **PPT/PPTX → PDF** (com PowerPoint instalado), configurações, indicação **“Configurado”** e exportação/importação **criptografada e protegida por senha**.
- **[HISTÓRICO]** Padrão de saída em **Downloads**, preservando arquivos existentes; ferramentas em subpasta própria de Downloads. Não exigir escolha repetida de diretórios nem sobrescrever saídas existentes.
- **[PLANEJADO/STATUS A CONFIRMAR]** v3.1: dois modos de PPTX→PDF (**simples** e **vinculado a ID PAL**); seleção múltipla por diálogo do Windows; **arrastar e soltar vários arquivos**, fila, remover item, converter todos, progresso/status por arquivo, continuar após falhas, proteção contra sobrescrita. Houve menção histórica a lote de até 100 itens e artefato de teste, **mas não há validação do executável nesta revisão**.
- **[HISTÓRICO]** O usuário rejeitou controles redundantes (caminho manual e “Adicionar à fila” quando a seleção/arraste já bastam), pediu alinhamento/limpeza visual e retirada de avisos informativos. Não reintroduzir seleção de ambiente `teste-admin`: programa deve operar apenas com produção quando autorizado/configurado.
- **[PLANEJADO]** Fluxo de integração desejado: painel cadastra e valida dados; programa Windows processa arquivos; publicação autorizada em GitHub/R2; painel informa progresso/resultado/erro. **Não presumir integração automática de ponta a ponta pronta** apenas por existir especificação.
- **[PENDENTE]** Antes de continuar a v3.1, localizar **o arquivo-fonte e a última compilação realmente aprovada**. O GitHub `pazqueilumina/site` não contém o projeto do executável; não inventar número de build nem gerar ZIP/EXE sem autorização.

### 8.8 Automação de e-mails, inscritos e Leitura Semanal

Existe um planejamento separado, com nome **`paz_que_ilumina_planejamento_emails_leitura_semanal.md`** (arquivo pessoal fora deste repositório). **Não copiar endereços de e-mail pessoais ou lista de destinatários para este repositório público.**

**Registro histórico de uma revisão anterior sobre e-mails (22/11/2026):** as pendências listadas a seguir descrevem um estágio já ultrapassado. **Para o estado atual, prevalece a seção 10**, que registra testes reais posteriores.
- **[RELATADO PELO USUÁRIO / HISTÓRICO DE CONVERSA]** O domínio `pazqueilumina.com.br` **já foi verificado no Resend**. Esse progresso foi mencionado na conversa, mas **não foi revalidado diretamente no painel Resend** nesta revisão. Não voltar à etapa de verificar domínio sem primeiro perguntar/consultar o estado atual.
- **[AINDA NÃO CONFIRMADO]** Criação da chave de API do Resend; cadastro do segredo `RESEND_API_KEY` no Cloudflare; configuração do Worker e dos gatilhos agendados. **Não registrar nem solicitar que chaves secretas sejam publicadas no GitHub.**
- **[CÓDIGO NÃO LOCALIZADO]** A árvore completa da `main` foi consultada em 22/11/2026 e não foram identificados arquivos de implementação com nomes relacionados a `email`, `resend`, `lembrete`, `cron`, `newsletter` ou `inscritos`. **Isso não substitui uma auditoria de todas as funções**, mas não há comprovação de envio automático funcionando.
- **[PRÓXIMA ETAPA, SOMENTE QUANDO AUTORIZADO]** Confirmar domínio/chave/segredo, implementar agendamento 24h e 1h antes (fuso `America/Sao_Paulo`), destinatários autorizados, proteção contra envio duplicado, tratamento de alterações/cancelamentos, logs e testes controlados antes de qualquer disparo real. O envio de mensagens para pessoas reais requer autorização específica.


- **[PLANEJADO — PRIORIDADE 1]** Lembretes de Agenda por e-mail **24 horas e 1 hora antes** de cada apresentação, usando tema, data, horário e local; registrar envios, falhas e duplicações; considerar alteração ou cancelamento de eventos.
- **[PLANEJADO]** Infraestrutura preferida: **Cloudflare Workers + Resend**, com domínio autenticado. GitHub Actions/Gmail e Brevo foram alternativas consideradas; não tratar qualquer serviço como já contratado/ativado.
- **[PLANEJADO — POSTERIOR]** Cadastro de inscritos com consentimento, cancelamento de inscrição e envio de comunicados/campanhas, dimensionado para algumas centenas de pessoas.
- **[PLANEJADO — POSTERIOR]** **Biblioteca → Leitura Semanal**: administrador cadastra PDF de livro; extração de texto uma vez; divisão por capítulos/parágrafos sem cortes arbitrários; revisão; envio **semanal e sequencial** do começo ao fim, sem repetição; histórico e percentual de progresso; encerrar ao terminar o livro, **sem iniciar outro automaticamente**.
- **[PENDENTE]** Definir duração de leitura de cada trecho, dia/horário, regras de OCR e revisão, modelo de e-mail e início de novo livro. Respeitar direitos autorais/licenças e LGPD. **Nada disso está autorizado para implementação apenas por constar deste documento.**

### 8.9 Decisões transversais de interface, dados e segurança

- **[HISTÓRICO]** Preferir aparência limpa e sóbria, cores consistentes entre Agenda e Dashboards, elementos alinhados, e mensagens com botão de fechar quando pertinente. Evitar duplicação de botões, banners decorativos e alertas de sucesso rotineiros.
- **[HISTÓRICO]** Não perder registros em importações/edições; distinguir **salvar no formulário**, **adicionar à lista** e **publicar no site**. A publicação de dados pode ter fluxo próprio dentro do painel; não confundir isso com autorização do assistente para fazer commits.
- **[HISTÓRICO]** Usar a `main`, registrar SHA anterior, criar commits descritivos e verificar status. Nunca relatar deploy de Cloudflare como concluído apenas porque o GitHub aceitou o commit.
- **[PENDENTE]** O repositório contém strings legadas de marca “Estudos e Reflexões Espíritas” em arquivos antigos; não alterar identidade visual/textos em massa sem revisão e autorização.
- **[REGRA DE PRIVACIDADE]** Não registrar em documentação pública endereço residencial completo, e-mails pessoais, tokens, segredos, credenciais ou dados familiares. Guardar apenas nomes de variáveis de ambiente e descrições técnicas necessárias.

### 8.10 Commits adicionais úteis para reconstruir decisões

| Commit | Contexto recuperado |
| --- | --- |
| `094557d3` | Associação opcional do acervo à Agenda; remoção de avisos de carregamento |
| `ebf84ff5` | Centralização de endereços da Agenda no Cadastro de Locais |
| `7dca559d` | Verificação de locais sob demanda; localização por nome da instituição |
| `61ef2159` | Indicadores de Agenda sóbrios e ajustes na geocodificação |
| `8b6d45aa` | Cálculo de deslocamentos rodoviários com origem privada e cache |
| `0c22235f` | Quatro indicadores de deslocamentos no Dashboard do Palestrante |
| `b99581f0` | Navegação mensal/anual e menus de Dashboard |
| `c00779a8` | Evolução das visitas em barras roxas e bandeira BR em SVG |
| `0e08c3f4` | Integração Cloudflare Web Analytics |
| `dc753be9` | Comparativos, rosca, calendário e opção YouTube no Dashboard do Palestrante |
| `cee4a9af` | Criação inicial do Dashboard do Palestrante |

**Princípio de continuidade:** as seções acima descrevem o que foi encontrado ou combinado, **não** substituem uma leitura do código atual. Quando memória, documento e código divergirem, registrar a divergência, preservar o estado atual e pedir decisão antes de qualquer migração.


## 9. Ponto de retomada para o próximo chat (22/11/2026)

**Último código confirmado na `main` antes desta atualização do documento:** `1c66122381924bac1b1b3005586dccf5f52fa531`. A atualização deste próprio Markdown produzirá um **novo commit apenas documental**; portanto, no novo chat, conferir o HEAD novamente. Não confundir SHA do documento com nova versão de código.

**O que foi entregue recentemente:**
1. Dashboard do Palestrante: quadro “Por onde Alexandre passou” corrigido e separado entre **Visitas presenciais** e **Participações online**; instituição identificada e plataforma indicada separadamente. Conferir em produção se outubro de 2026 mostra as 4 instituições e contagens acima. **Não há relato posterior do usuário confirmando a aparência final desse último layout.**
2. Dashboard Administrativo: bandeiras BR/US renderizadas por SVG, evitando texto “US” no Windows. Conferir a aparência se houver novo relato de erro.
3. Mapa do Palestrante: carregamento corrigido, ampliação em tela cheia e cache incremental já implementados. **Melhoria estrutural de desempenho adiada expressamente pelo usuário**; não refazer nem iniciar persistência de coordenadas sem nova autorização.
4. E-mail: **atualização posterior na seção 10** — Worker independente, Resend, D1 e cron configurados; dois testes HTML recebidos pelo usuário. **Envios regulares 24h/1h ainda não foram ativados/confirmados.**

**Prioridades e cuidados:**
- O usuário está cadastrando um backlog grande de eventos e PDFs; preservar IDs, dados e vínculos existentes.
- Não retomar migração de Agenda/Palestras nem refatoração de coordenadas por iniciativa própria.
- Não criar versão do programa Windows v3.1 sem pedido explícito.
- Não implementar e-mails/inscritos/leitura semanal só porque aparecem como próximos passos neste documento.
- Para qualquer nova solicitação, **ler o arquivo real na `main`**, identificar o HEAD, inspecionar código e dados relevantes, pedir autorização quando ainda não houver e relatar separadamente commit, testes e deploy Cloudflare.
- **Este item registrava a última ação de um chat anterior.** A atualização de e-mails posterior está documentada na seção 10. A solicitação atual autoriza **apenas atualizar este Markdown na `main`**, sem alterar o Worker, o site ou ativar envios.

**Mensagem curta sugerida para o novo chat:**

> Vamos continuar o projeto Paz que Ilumina. Leia o `CONTINUIDADE-PROJETO.md` na `main` do GitHub `pazqueilumina/site`, especialmente as seções 1, 8.8 e **10 (estado mais recente dos e-mails)**. Confirme o HEAD atual antes de agir. Os templates de lembrete já foram testados e recebidos; falta encerrar o modo de teste e, mediante minha autorização, ativar os lembretes regulares. Não altere código, configurações nem faça deploy sem minha autorização.

## 10. Continuidade mais recente — e-mails de lembrete (22/11/2026)

> **Esta seção prevalece sobre os estados antigos de planejamento nas seções 4, 8.8 e 9.** Registro baseado nas configurações realizadas e nos resultados observados pelo usuário na conversa de 22/11/2026. **HEAD da `main` antes desta atualização documental:** `80dc40dd26c8924c7005e18403c8f6236b2d82fd`. A atualização deste Markdown gera um novo commit, mas **não** publica código do site nem altera o Worker.

### 10.1 O que já foi configurado e confirmado

- **Resend:** domínio remetente `pazqueilumina.com.br` verificado; remetente `lembretes@pazqueilumina.com.br`. Um primeiro e-mail simples de teste, enviado manualmente pelo editor de templates do Resend, **foi recebido**.
- **Cloudflare Worker separado do site:** `pazqueilumina-lembretes`, no endereço `https://pazqueilumina-lembretes.pazqueilumina.workers.dev/`. O código foi colado e publicado **manualmente no editor Cloudflare**, não pelo repositório GitHub. Uma visita HTTP comum ao endereço responde `404 Not found` **por projeto**, pois a execução útil ocorre no gatilho agendado.
- **Agendamento:** cron `*/5 * * * *` (a cada cinco minutos). O painel **Observability** exibiu execuções reais do cron, portanto o gatilho foi confirmado.
- **Banco:** Cloudflare D1 `pazqueilumina-lembretes`, binding `DB`, tabela `reminder_deliveries` criada. O Worker usa registros de estado, tentativas, IDs do Resend e chaves de idempotência para evitar repetição.
- **Variáveis/segredos usados:** `RESEND_API_KEY` (Secret), `REMINDER_RECIPIENTS` (Secret), `FROM_EMAIL`, `REPLY_TO_EMAIL`, `AGENDA_URL`, `LOCAIS_URL`, `EMAIL_ENABLED` e `TEST_TEMPLATES_NOW`. **Não publicar valores secretos ou destinatários pessoais neste repositório.**
- **Fonte dos eventos:** `https://pazqueilumina.com.br/js/dados.js`; **fonte dos centros:** `https://pazqueilumina.com.br/data/locais.json`. O Worker consulta os dados publicados, não os cadastros ainda não publicados. Horários de evento em `America/Sao_Paulo`; lembretes previstos para **24h** e **1h** antes, com janela de tolerância de dez minutos.
- **Destinatários:** na última configuração informada pelo usuário, `REMINDER_RECIPIENTS` foi reduzido a **um único endereço para testes**. Não incluir esse endereço na documentação pública; consultar o Secret no Cloudflare se necessário.

### 10.2 Templates HTML e regra de localização

- Dois modelos visuais de e-mail **aprovados e recebidos**: um para **24 horas antes** e outro para **1 hora antes**. Identidade visual sóbria do Paz que Ilumina (verde-escuro, creme e dourado), adaptada para celular, com título, data, horário, instituição, local e chamada para a Agenda.
- **Presencial:** nome do Centro Espírita clicável, abrindo uma pesquisa no **Google Maps** a partir do nome e endereço cadastrados; endereço escrito também aparece no e-mail. Quando um evento antigo não tem `localId`, o Worker tenta identificar o centro pelo nome. **O link é de pesquisa por endereço, não uma coordenada geográfica previamente verificada**; os nove locais examinados não tinham latitude/longitude persistidas.
- **On-line:** não gerar link de Maps para a instituição; apresentar botão/link da transmissão **quando o evento possuir URL válida**. Não inventar URL para eventos sem link cadastrado.
- **Importante:** os HTMLs estão **incorporados ao código do Worker**. Um template publicado separadamente no painel do Resend foi usado apenas para o primeiro teste manual e **não é carregado automaticamente pelo Worker**.

### 10.3 Falha identificada e corrigida

- Os primeiros testes automáticos não chegaram após mais de vinte minutos. Os logs em **Observability** mostraram: `Invalid redirect value, must be one of "follow" or "manual"`.
- **Causa:** duas chamadas `fetch` usavam `redirect:'error'`, opção não aceita no Cloudflare Workers.
- **Correção aplicada pelo usuário no editor do Worker e publicada via Deploy:** substituir as duas ocorrências por `redirect:'manual'`.
- **Resultado confirmado:** após o novo Deploy, o usuário **recebeu os dois e-mails HTML de teste** (presencial/24h com Google Maps e on-line/1h) e aprovou a aparência: “recebi, ficaram muito bons”. Isso comprova a integração Worker → Resend → caixa de entrada no modo de teste; **não comprova ainda o disparo regular por antecedência de evento**.
- O mecanismo de teste `TEST_TEMPLATES_NOW=true` utiliza D1 para enviar uma única vez cada modelo ao único destinatário configurado, sem exigir `EMAIL_ENABLED=true`.

### 10.4 Estado exato ao encerrar esta conversa e próximos passos

1. **Último estado informado, não revalidado no painel após os testes:** `TEST_TEMPLATES_NOW=true`; `EMAIL_ENABLED=false`. O assistente orientou o usuário a alterar `TEST_TEMPLATES_NOW` para `false`, mas **o usuário ainda não confirmou essa alteração**. Não presumir que o teste foi desligado.
2. **Primeira ação no próximo chat:** confirmar em **Worker → Settings → Variables and Secrets** que `TEST_TEMPLATES_NOW=false`, mantendo `EMAIL_ENABLED=false` até autorização de ativação. O código de teste usa D1 para não repetir os dois e-mails já enviados, mas o modo de teste deve ser encerrado.
3. **Somente com autorização explícita:** alterar `EMAIL_ENABLED=true` para iniciar os lembretes reais de 24h e 1h. Antes disso, confirmar a lista de destinatários autorizados, o cron e a implantação da versão corrigida.
4. **Após ativação:** acompanhar **Observability → Logs**, **Resend → Emails** e **D1 → reminder_deliveries**, verificando um evento futuro real, sucesso/falha e ausência de duplicação. Não declarar a automação de lembretes reais validada antes dessa verificação.
5. **Limites:** a atualização documental não altera código nem variáveis; a otimização do mapa do site continua adiada; a Leitura Semanal e o cadastro de inscritos continuam planejados, não implementados.

**Artefato de referência da conversa:** arquivo local disponibilizado ao usuário como `worker-pazqueilumina-templates-maps-corrigido.txt`. Ele **não foi adicionado ao GitHub**. Para futuras alterações, consultar primeiro o código **efetivamente publicado no editor Cloudflare**; não reconstruir o Worker a partir do código antigo de 259 linhas nem reintroduzir `redirect:'error'`.

**Retomada curta sugerida:** “Continue o projeto Paz que Ilumina lendo a seção 10 de `CONTINUIDADE-PROJETO.md` na `main`. Os dois modelos HTML foram recebidos. Verifique se `TEST_TEMPLATES_NOW` já está `false`; depois vamos decidir a ativação de `EMAIL_ENABLED`, sem alterar o site nem o Worker sem minha autorização.”

## 2026-11-22 — Cadastro administrativo de Shorts (autorizado)

- O responsável aprovou a implementação e publicação na branch `main` da nova tela **Admin → Shorts**, com IDs internos permanentes.
- Migração preserva os **19 Shorts existentes**, na ordem original, de `js/dados.js` para `data/shorts.json`.
- Novo esquema: `versao`, `proximoId` monotônico e `shorts` com `sid` (`SHO-0001` etc.), `youtubeId`, `titulo`, `ativo` e `ordem`.
- `sid` é gerado automaticamente, nunca exibido no site público; o YouTube ID continua usado para link e miniatura. Exclusões não reutilizam IDs.
- Tela `/admin/shorts.html`: adicionar, editar, excluir, ativar/desativar, prévia da miniatura, pesquisa, filtro, ordenação com setas e publicação manual no GitHub.
- API protegida por Cloudflare Access: `GET/PUT /api/admin/shorts`, usando `GITHUB_TOKEN` existente e controle de concorrência por SHA. Sem banco D1 adicional.
- A página pública `/videos.html` e a busca da página inicial carregam os Shorts ativos de `/data/shorts.json`; o Dashboard consulta o mesmo cadastro para seus indicadores.
- Links de navegação do Admin e ação rápida de adicionar Short incluídos.
- Preservar o fluxo de publicação pelo GitHub/Cloudflare e confirmar deploy de produção após o commit.

## 2026-11-22 — Ajustes de cadastro de Shorts (autorizados)

- Corrigido box vazio de mensagens com CSS `[hidden]`.
- ID interno agora aparece como texto fixo, sem campo de digitação.
- Botão **Ativar/Desativar** incluído em cada linha; exige **Publicar alterações** para efetivar no site.
- Corrigida a numeração inicial: acervo exibido em ordem de mais novo para mais antigo, com **SHO-0001** no Short mais antigo (ordem 19) e **SHO-0019** no mais recente (ordem 1). **SHO-0020** será o próximo ID gerado. Esta foi uma renumeração única do acervo inicial; IDs não devem mudar ao reordenar a lista.
- Novo Short é incluído no topo da lista (mais recente primeiro).

## 2026-11-22 — Formatação de títulos e miniaturas circulares no Admin Shorts

- Alteração aprovada pelo responsável e publicada em `main`.
- Na ação **Salvar na lista**, títulos digitados inteiramente em caixa alta são convertidos para capitalização normal, com início de frase em maiúscula e preservação de nomes especiais (Jesus, Deus, Chico Xavier, Allan Kardec, Brasil, YouTube e siglas conhecidas). Títulos já em caixa mista são preservados.
- Miniaturas da lista administrativa de Shorts passam a ser circulares, seguindo a página pública de vídeos, com enquadramento central e ampliação da imagem.
- Não há renumeração de IDs existentes nem alteração de títulos do acervo anterior: a conversão ocorre ao salvar o formulário de cada Short.

## 2026-11-22 — Prévia circular no formulário de Shorts

- Alteração autorizada e publicada na branch `main`.
- A miniatura exibida na seção **Prévia da miniatura** do formulário de cadastro/edição também passa a ser circular, com o mesmo enquadramento central da lista de Shorts cadastrados.
- Mantidos o link **Assistir no YouTube**, os botões e os demais comportamentos do cadastro.
- Atualização restrita aos arquivos `admin/shorts.html` e `admin/shorts.css`; os dados dos Shorts já publicados não foram modificados.

## 2026-11-22 — Monitor de e-mails anual e alertas em Pendências

- Alteração aprovada para publicação na branch `main`.
- O **Monitor de e-mails** do Dashboard passa a mostrar envios e falhas de envio por **ano-calendário de São Paulo**, desde 2026, com seletor de ano independente do filtro geral do Dashboard.
- A API protegida `/api/admin/email-status?year=AAAA` consulta as tabelas D1 `reminder_deliveries` e `monthly_deliveries` no intervalo anual, mantendo `monitor.lastRunAt` como a última execução global, sem filtro de ano.
- **Erros de execução ativos** permanecem um indicador do estado atual do Worker, não um total histórico anual, pois a tabela `email_worker_runs` registra o último estado por tarefa, não cada erro histórico.
- O cartão **Pendências** exibe falhas de envio **recentes (30 dias)**, erros de execução ativos, execução atrasada (>15 minutos), primeira execução pendente e falha de consulta/conexão. Quando tudo estiver normal, não cria aviso de e-mail.
- Os totais anuais e alertas recentes são separados na resposta da API (`deliveries` e `alerts`), evitando confundir problemas antigos com pendências atuais.
- Não foi alterado o Worker, seus agendamentos, o envio da Agenda Mensal nem o conteúdo das mensagens.


## 2026-11-22 — Conteúdos recentes unificados no Dashboard

- Implementação autorizada pelo responsável diretamente na branch main.
- O quadro **Conteúdos recentes** combina até **5 itens**: Shorts, vídeos completos, áudios/MP3, slides/PDF e referência a arquivo original PPT/PPTX quando houver.
- Cada formato aparece com etiqueta, título, ID, data e link. Shorts e vídeos abrem no YouTube; áudios e PDFs usam seus links cadastrados; o nome de PPT/PPTX é **apenas referência de arquivo original**, portanto abre o cadastro administrativo, sem inventar link de download.
- As datas de publicação são registradas no servidor nos campos publicadoEm (Shorts) e publicacoes por tipo (palestras), quando o cadastro é publicado no GitHub. Alterar somente título, ordem ou status inativo não gera nova publicação; adicionar ou trocar uma mídia ativa registra nova data.
- Para acervo anterior sem carimbo de publicação, a data da palestra é exibida como **data da palestra**, não como publicação. Shorts antigos sem data ficam abaixo dos itens datados.
- Backfill pontual do Short SHO-0020 com a data real do commit de publicação de data/shorts.json em 22/11/2026 às 21:47:48 UTC. Os demais Shorts históricos não recebem datas inventadas.
- Atualização do Dashboard e dos endpoints protegidos de Shorts e palestras, sem alterar e-mails, Workers ou IDs.

 
## 2026-11-22 — Ajustes visuais e contagem de novos em Conteúdos recentes

- Solicitado e autorizado pelo responsável: miniatura **circular** para Shorts (como no cadastro), ícone de fones em círculo roxo para MP3, ícone de documento em círculo laranja para PDF, miniatura padronizada para vídeos e ícone verde para PPT/PPTX.
- Etiqueta discreta **NOVO** para conteúdo cuja data real de publicação esteja nos **últimos 7 dias**; não atribuir NOVO com base na data da palestra ou a itens históricos sem data de publicação.
- O Short SHO-0020, publicado em 22/11/2026, aparece com NOVO.
- No quadro **Resumo do acervo**, coluna **Novos***, Shorts, MP3 e PDF agora são contados por data de publicação registrada dentro do **período selecionado**; apresentações continuam com a contagem histórica pela data cadastrada. Itens legados sem data de publicação não são considerados novos; a nota do quadro explica a diferença.
- Mantido limite de 5 conteúdos recentes, IDs, links e histórico; nenhum Worker ou e-mail alterado. Cache-busting dos arquivos JS/CSS do dashboard atualizado.

 
## 2026-11-22 — Miniaturas de Shorts sem barras pretas (site e dashboard)

- Ajuste aprovado para os **dois ambientes**: site público (Vídeos) e Dashboard administrativo (Conteúdos recentes).
- O Dashboard passou a usar thumbnail HD `hq720.jpg` dos Shorts com fallback para `hqdefault.jpg`, e recorte circular com zoom 1,72× **dentro de um contêiner com overflow hidden**. O zoom evita as faixas laterais escuras do thumbnail horizontal de Shorts.
- A página pública de Vídeos mantém seu recorte circular e zoom 1,72×; a escala agora usa variável CSS `--short-thumb-zoom` para manter a configuração alinhada com o Dashboard.
- Alteração limitada à apresentação das miniaturas, sem modificar títulos, IDs, ordenação, conteúdo ou cadastros. Cache-busting de CSS/JS atualizado.


## 22/11/2026 — melhorias públicas (lote 1)

- Analytics: removida a segunda injeção do GoatCounter em `js/app.js`; o script permanece no HTML. Dashboard usa Cloudflare Web Analytics, independente do GoatCounter; dados reais ainda exigem validação autenticada.
- Busca global: Shorts carregados em todas as páginas.
- Agenda: link Google Calendar por evento, fuso America/Sao_Paulo, duração estimada de 1 hora.
- Inscrição pública mensal: ainda não ativada; requer fluxo seguro de confirmação, cancelamento e integração ao Worker de e-mails e D1. Não criar inscrições sem essa integração.
- Não criadas páginas individuais de palestras.


## 22/11/2026 — inscrição pública da agenda mensal (preparação de integração)

- Página pública `agenda.html`: formulário de inscrição com consentimento, campo anti-spam e confirmação por e-mail. O formulário **só aparece** se o endpoint `/api/subscriptions/status` do Worker `pazqueilumina-lembretes` responder `available: true`; não mostrar um cadastro que não funcione.
- Worker é **independente do GitHub Pages** e continua publicado manualmente no painel Cloudflare. A versão atual ainda precisa ser substituída manualmente pelo código com endpoints `/api/subscriptions`, `/api/subscriptions/confirm` e `/api/subscriptions/unsubscribe`.
- O código de integração foi entregue como arquivo `pazqueilumina-lembretes-com-inscricoes.js` na conversa. Não há publicação automática do Worker pelo commit da `main`.
- Fluxo proposto e testado localmente: double opt-in (link por 48h), limite de requisições, inscrição ativa no D1, envio mensal somente a confirmados, cancelamento por link e preservação de destinatários fixos. O código normalizado passou na verificação de sintaxe e em testes locais simulando D1/Resend. **Não houve teste real de envio nem atualização do Worker na Cloudflare.**
- Nenhuma página individual de palestra foi criada. Não adicionar e-mails públicos aos lembretes 24h/1h.


## 22/11/2026 — consentimento para agendas mensal e semanal

- Atualizado formulário público em `js/app.js` para informar expressamente agenda mensal e agenda semanal aos domingos. A caixa de consentimento é obrigatória e desmarcada por padrão; o pedido envia `cadence: 'monthly_weekly'` ao Worker atualizado, necessário para registrar `weekly_opt_in=1` no D1 apenas após confirmação por e-mail.
- O formulário só é exibido se `/api/subscriptions/status` retornar `available: true`. Enquanto `weeklyEnabled` for falso, o texto esclarece que o envio semanal começará após ativação; isso não impede que a pessoa consinta antecipadamente.
- Alterado o cache-busting de `js/app.js` em `agenda.html`.
- **Worker não publicado pelo GitHub**: é necessário fazer deploy manual da versão semanal corrigida na Cloudflare, depois testar inscrição e confirmação e, somente após validação, definir `WEEKLY_EMAIL_ENABLED=true`. Não alterar o envio mensal nem os lembretes 24h/1h.
- Analytics: validação dos números reais permanece pendente de acesso aos dados da Cloudflare.


## 22/11/2026 — correção de visibilidade do formulário de inscrição

- **Causa real identificada:** `ativarInscricaoAgenda()` declarava `const dados` dentro de `try` e tentava ler `dados.weeklyEnabled` fora desse bloco, provocando `ReferenceError` antes de remover `hidden` do formulário. Corrigido para `let dados` no escopo da função, com atribuição no `try`.
- O formulário foi movido do fim da página (após eventos passados) para **logo abaixo do subtítulo e antes dos filtros** da agenda pública.
- Ajustada a margem do formulário e alterados os parâmetros de versão dos arquivos JS e CSS em `agenda.html` para invalidar cache.
- O formulário continua protegido por verificação de disponibilidade real do Worker `/api/subscriptions/status`. O Worker já retornou `{"available":true,"weeklyEnabled":false}` ao usuário; a exibição depende da chamada no navegador.
- Nenhuma configuração do Worker nem de envio automático foi modificada neste deploy.


## 22/11/2026 — gestão de inscritos, horário e cancelamento
- Criada a página administrativa protegida `/admin/inscritos.html` com resumo acumulado, pesquisa, filtros por situação, paginação, exportação CSV e cancelamento administrativo confirmado. Dados vêm da API `/api/admin/inscritos`, usando o binding Pages `EMAIL_DB` já utilizado pelo Monitor de e-mails. Não expõe tokens de inscrição, hashes ou segredos. Acesso restrito pelo middleware Cloudflare Access.
- No Dashboard Administrativo, novo quadro **Inscrições da agenda** abaixo do Monitor de e-mails, com ativos, pendentes, semanais e cancelados, independente do filtro temporal; link para gerenciar inscritos. Navegação atualizada nas páginas administrativas.
- Horário do Monitor de e-mails agora segue o padrão `22/11 às 20h40`, sem vírgula.
- A agenda pública passa a oferecer solicitação de cancelamento por e-mail, **exibida apenas quando o Worker informar `unsubscribeRequestEnabled:true`**. A confirmação final continua sendo feita pelo destinatário, após abrir o link enviado por e-mail e confirmar na página do Worker.
- **Worker independente do GitHub:** preparado o arquivo `worker-pazqueilumina-inscritos-cancelamento-20261122.js`, baseado na versão semanal corrigida. Adiciona POST `/api/subscriptions/unsubscribe/request`, `unsubscribeRequestEnabled` no status e resposta HTTP 409 para e-mails já inscritos ou pendentes (sem bloquear atualização legítima mensal→semanal). O arquivo deve ser publicado manualmente no editor do Worker; o deploy Pages não o atualiza. Mantém agendamentos, destinatários e parâmetros de envio existentes.
- **Atenção à privacidade:** o aviso explícito de e-mail duplicado revela que o endereço está cadastrado. Foi solicitado pelo responsável; a rota mantém limitação de solicitações por IP e e-mail. Cancelamento por e-mail não revela existência do cadastro.
- Validar em produção: leitura do D1 pela API protegida, confirmação por e-mail, duplicidade 409 e solicitação de cancelamento após deploy manual do Worker.

- Revisão pós-commit: formulário de cancelamento foi colocado **fora** do formulário de inscrição (HTML não permite formulários aninhados).

- O Monitor de e-mails também passa a contabilizar entregas da agenda semanal quando existir a tabela D1 `weekly_deliveries`, mantendo compatibilidade com a tabela ainda não criada; falhas e histórico de execução semanal são incluídos. Corrigida a persistência da mensagem de sucesso após cancelamento administrativo.

- Cancelamento administrativo suporta também uma tabela antiga sem as colunas semanais, detectando as colunas presentes antes do UPDATE.


## 23/11/2026 — notificações flutuantes e menu de inscritos

- Agenda pública: mensagens de cadastro e solicitação de cancelamento migradas do rodapé do formulário para **notificações flutuantes (toast)** no canto superior direito. Uma notificação por vez; sucesso verde, duplicidade HTTP 409 em âmbar com título "E-mail já cadastrado", erros em vermelho; desaparecem após 6 segundos ou pelo botão X. Sem pop-up modal; `role=status/alert`, animação desativada com `prefers-reduced-motion`. Durante a requisição, o botão exibe "Enviando…" e fica desabilitado.
- Menu lateral dos Dashboards Administrativo e Palestrante: "Inscritos por e-mail" reduzido para **"Inscritos"**, em uma linha. Título da tela administrativa atualizado para **"Inscrições da agenda"**.
- Atualizados os parâmetros de versão de CSS e JS em `agenda.html` para evitar cache. Não há mudança no Worker, D1 ou rotinas de envio.


## 23/11/2026 — inscrições por mês e e-mails no Resumo do acervo
- Dashboard Administrativo: quadro **Inscrições da agenda** com seletores independentes de **Mês** e **Ano** (mês corrente em `America/Sao_Paulo`). Indicadores mensais: **Novos inscritos** (cadastros, inclusive pendentes), **Confirmados** (confirmações no mês), **Agenda semanal** (consentimento semanal atualmente registrado entre confirmados no mês), **Cancelamentos** (cancelamentos no mês). Rodapé com **acumulado de inscritos ativos até o mês selecionado**: no mês atual, contagem real; em meses encerrados, reconstrução estimada pelos timestamps.
- **Resumo do acervo** ganhou a linha **E-mails**: **Total** de inscritos ativos hoje e **Novos*** cadastros no período geral do Dashboard, incluindo pendentes. A linha acompanha as mudanças de período geral, independentemente do mês selecionado na seção de inscrições.
- API administrativa `/api/admin/inscritos?stats=1&month=YYYY-MM&from=YYYY-MM-DD&to=YYYY-MM-DD` consulta o D1 `EMAIL_DB` e usa limites de período em `America/Sao_Paulo`. Compatível com lista, CSV, cancelamento e `summary=1`.
- **Limitação histórica:** a tabela `monthly_subscribers` não armazena data de ativação semanal nem histórico de reinscrições. Portanto o indicador semanal reflete o consentimento **atual** de quem confirmou naquele mês, sem reconstruir upgrades/cancelamentos anteriores; saldos de meses encerrados são **estimados** porque reinscrições podem sobrescrever datas. O quadro sinaliza as limitações. Nenhuma migração D1 nem alteração no Worker.
- Parâmetros de versão dos arquivos JS/CSS do Dashboard atualizados para evitar cache. Publicado diretamente na branch `main`.


## 23/11/2026 — ajuste aprovado: agenda pública e quadro de inscrições no Dashboard
- **Regra obrigatória do projeto (orientação expressa do responsável): NUNCA retirar, ocultar, substituir ou eliminar informação, funcionalidade, indicador ou dado existente sem confirmação explícita.** Conferir os indicadores e funções existentes antes de cada mudança. Não gerar nova versão nem publicar sem autorização expressa.
- **Agenda pública:** texto do formulário deixa claro que são **agenda mensal e agenda semanal**, com a programação aos domingos, sem a expressão condicional “quando o envio semanal for ativado”. Isso **não altera** a variável de ativação do envio semanal no Worker. O link de cancelamento permanece com a ação e formulário existentes, mas passa a se chamar somente **“Cancelar inscrição”** (retirado “Já recebe as agendas?”).
- **Dashboard administrativo:** o quadro “Inscrições da agenda” conserva os quatro indicadores **mensais** (Novos inscritos, Confirmados, Agenda semanal e Cancelamentos), sem os seletores Mês/Ano duplicados no próprio quadro. Exibe o mês de referência como texto. Quando o período geral do Dashboard estiver em modo **mês**, usa o mês escolhido ali; em outros modos, mostra o mês corrente. Não foi eliminada a consulta a meses anteriores, que continua possível pelo seletor geral do Dashboard.
- **Informações restauradas e preservadas:** indicadores **Inscritos ativos** e **Aguardando confirmação** voltam em dois cartões próprios, na seção visualmente separada **Acumulado geral**, mostrando a situação atual de todo o banco, não a contagem histórica estimada. O link **Gerenciar inscritos** e os avisos sobre limites do histórico semanal permanecem.
- Os indicadores e a linha **E-mails** no Resumo do acervo, com a coluna Novos do período geral, permanecem sem alterações. Não há mudanças no Worker, nos envios ou no D1. Atualizados os parâmetros de versão dos scripts para evitar cache.


## Planejamento futuro — separação entre Dashboard e Estatísticas
**Status: proposta registrada, NÃO IMPLEMENTADA.** Esta seção documenta a orientação para uma futura evolução do painel administrativo. Não autoriza implementação, remoção de informações nem deploy funcional.

- **Dashboard:** manter como **resumo executivo** do site, com visão geral, principais indicadores, gráficos sintéticos, monitoramento e ações rápidas já existentes.
- **Estatísticas:** transformar em **área de análise detalhada**, destinada a investigar tendências, comparar períodos e identificar oportunidades de melhoria. Não deve ser apenas um atalho para os gráficos do Dashboard nem duplicar sem necessidade a mesma informação.
- **Possíveis análises para uma primeira etapa (a validar antes de implementar):**
  - **Audiência:** visitas, visualizações, evolução por dia/mês, países e páginas mais acessadas (somente onde houver dados confiáveis).
  - **Conteúdos:** evolução do acervo, publicações por período e distribuição entre apresentações, Shorts, áudios e PDFs.
  - **Inscrições:** evolução mensal de novos inscritos, confirmações, cancelamentos e crescimento acumulado, com ressalvas sobre limitações históricas dos dados.
- **Possíveis ampliações posteriores:** estatísticas da agenda (eventos por mês, centros mais ativos) e engajamento (pesquisas/conteúdos procurados), **somente após validar disponibilidade e qualidade dos dados**.
- **Princípios de implementação:** filtros de período e comparações úteis; métricas verificáveis; sinalizar dados ausentes, estimativas e limitações; aproveitar fontes existentes antes de criar nova coleta. Preservar integralmente o Dashboard e suas funcionalidades atuais, salvo aprovação explícita para mudanças.
- **Próxima ação:** apresentar proposta visual/funcional e confirmar escopo com o responsável **antes** de programar ou publicar. A mudança de navegação para a área Estatísticas também exige confirmação específica.


## 23/11/2026 — Menus, relatórios, inscrições anuais, atividades e avisos (implementação autorizada)
- **Menus dos Dashboards Administrativo e Palestrante:** Dashboard e Gestão abertos por padrão e recolhíveis. **Gestão acima de Acervo**, com Agenda, Inscritos, Locais, Palestras e Shorts. Acervo e demais opções preservados.
- **Relatórios:** `/admin/relatorios.html` permite escolher Dashboard Administrativo ou Palestrante, período **mensal (mês/ano)** ou **anual (somente ano)**, prévia e impressão/salvamento em PDF. Abre o dashboard com o período pré-aplicado, data de emissão, nota sobre métricas de situação atual e CSS de impressão **A4 paisagem**. Não altera a visualização normal dos dashboards.
- **Estatísticas:** segue como implementação futura de análises detalhadas, conforme seção de planejamento. Não substituir nem remover os gráficos atuais do Dashboard.
- **Inscrições da agenda:** seleção anual passa a consultar os números do ano inteiro via `/api/admin/inscritos?stats=1&year=YYYY`; seleção mensal continua disponível. Mantidos os quatro indicadores do período e os dois cartões de **Acumulado geral** com a situação atual. A limitação histórica do consentimento semanal permanece explicitada.
- **Atividades recentes:** API GitHub busca até 20 commits reais; o quadro calcula a quantidade que cabe no espaço disponível, em ordem cronológica, sem inventar registros.
- **Avisos de inscrição:** toast mais abaixo; alerta de e-mail duplicado em âmbar mais visível. **Worker, D1, envios e `weeklyEnabled=false` não alterados.**
- **Regra obrigatória:** nunca retirar, ocultar, substituir ou eliminar informação/indicador/função existente sem confirmação explícita. Não publicar mudanças futuras sem autorização expressa.


## 23/11/2026 — Correção da impressão e retirada do seletor antigo (autorizada)
- **Relatórios Administrativo e Palestrante:** revisão da folha `admin/report-print.css` para impressão **A4 retrato**, em vez do A4 paisagem da implementação inicial. Layout de impressão independente do dashboard de tela, com cabeçalho limpo, KPIs compactos, quadros em colunas adequadas, gráficos ajustados à largura, barras de rolagem removidas, tabela com cabeçalho repetido e quebras de página apropriadas. O calendário e o mapa do palestrante receberam ajustes específicos. Conteúdo informativo preservado; controles de ação interativos não são impressos.
- **Validação pré-deploy:** simulação local de impressão em Chromium com quadros e conteúdo representativos, obtendo **2 páginas no Administrativo e 4 no Palestrante** no cenário simulado; quantidade real depende do número de atividades, eventos e linhas de histórico. Não confundir com teste de produção autenticada.
- **Dashboard Administrativo:** retirada do seletor visível **“Outros períodos…”** a pedido do responsável. Permanecem as setas, seletor de mês/ano, modos **Mensal** e **Ano inteiro**. Removidas as referências JavaScript ao seletor eliminado para evitar erro em tempo de execução. Dashboard do Palestrante já não possuía esse seletor.
- Atualizados parâmetros de versão dos arquivos CSS/JS afetados para invalidar cache. Mantidas as demais métricas, menus, filtros mensais/anuais, integrações e a configuração **`weeklyEnabled=false`**.
- **Regra permanente:** não retirar informações ou funções sem autorização explícita; publicar somente após autorização do responsável.


## 23/11/2026 — Segunda revisão da impressão Administrativa (deploy autorizado)
- **Problema reportado:** prévia real do relatório Administrativo ainda ocupava **6 páginas**, com blocos estreitos e espaços em branco grandes, apesar da primeira correção CSS.
- **Solução:** `admin/report-view.js` passa a montar uma **cópia exclusiva para impressão** do relatório Administrativo no evento `beforeprint`. Os dados e gráficos são clonados do dashboard carregado, **sem remover ou modificar os originais na tela**. O cabeçalho, período, data de emissão, ressalvas e texto de proveniência do rodapé são preservados.
- **Composição de impressão:** A4 retrato com largura útil explícita de 190 mm, 6 KPIs em 3 colunas, gráficos principais priorizados (Evolução do acervo e Evolução das visitas em largura total; rosca e países lado a lado), demais indicadores em duas colunas verticais com paginação contínua, sem grandes espaços gerados por linhas inteiras de CSS Grid. Mantidos os dados de Conteúdos recentes, Atividades recentes, Pendências, Monitor de e-mails, Inscrições, Próximos eventos e Resumo do acervo. Apenas botões de navegação/ações rápidas, que não são dados de relatório, deixam de aparecer no papel.
- A cópia é removida no `afterprint`. Se a preparação falhar, o layout anterior continua disponível (não imprimir página em branco). O relatório do Palestrante mantém a implementação anterior, sem alterações funcionais.
- **Teste local de paginação:** uma simulação representativa em Chromium produziu **2 páginas**, com largura útil aproveitada; o total na produção dependerá da quantidade real de registros e do navegador. Não afirmar validação visual do dashboard autenticado sem conferir sua prévia real.
- Cache-busting atualizado nos dois dashboards. Nenhuma alteração em Worker, D1, métricas, filtros ou envio semanal.


## 11. Passagem de contexto para novo chat — 23/11/2026 (documento atualizado)

### 11.1 Estado de publicação verificado
- **Repositório:** `pazqueilumina/site`; branch `main`; publicação automática do site via **Cloudflare Pages**.
- **Último commit de código:** `973e0bab6dcc855b4c93a51eb9bf59e2c34b8e5c` — *Compact administrative PDF report into print-only two-column layout*; check **Cloudflare Pages concluído com sucesso** em 23/11/2026 às 01:11:21 UTC. Uma atualização **somente deste documento** pode criar um HEAD posterior; conferir o HEAD real na retomada.
- **Arquivos alterados nesse commit de código:** `admin/report-view.js`, `admin/report-print.css`, `admin/dashboard.html`, `admin/palestrante.html` (cache-busting), `CONTINUIDADE-PROJETO.md`. Não houve modificação de Worker, D1 ou dados de palestras/eventos.
- **Implementação de impressão:** ao imprimir o relatório Administrativo, `beforeprint` monta um clone de elementos e dados em `#reportPrintRoot`; o dashboard original permanece intacto; `afterprint` remove o clone. A4 retrato, 190 mm de largura útil, KPIs em três colunas, gráficos de acervo/visitas em largura total, rosca/países lado a lado e quadros restantes em duas colunas verticais. **Meta:** reduzir a impressão real, que antes tinha 10 páginas e, após primeira correção, 6 páginas. O registro anterior menciona simulação local de 2 páginas, mas **não houve confirmação pelo usuário de que a versão publicada imprime em 2 páginas com seus dados reais**.
- **Relatório do Palestrante:** não alterado funcionalmente pela segunda revisão; a primeira revisão o colocou em A4 retrato. Não presumir que está perfeito; verificar somente se o usuário solicitar.

### 11.2 Funcionalidades aprovadas que devem permanecer
- Menu lateral dos dois Dashboards: **Dashboard** e **Gestão** abertos por padrão e recolhíveis; Gestão fica **acima de Acervo** e contém Agenda, Inscritos, Locais, Palestras e Shorts. **Acervo**, Estatísticas, Relatórios e Voltar ao site permanecem disponíveis.
- Dashboard Administrativo: seletor de período com setas, escolha de mês/ano, botões **Mensal** e **Ano inteiro**; **não** reintroduzir **“Outros períodos…”**. Indicadores, gráficos, acervo, origem e evolução de visitas, conteúdos e atividades recentes, pendências, monitor de e-mails, inscrições, próximos eventos e resumo do acervo devem ser preservados.
- **Atividades recentes:** até 20 commits reais consultados pela API GitHub, com quantidade exibida adaptada à altura disponível; não inventar atividades.
- **Inscrições da agenda:** quatro indicadores do período (**Novos inscritos**, **Confirmados**, **Agenda semanal**, **Cancelamentos**) e dois indicadores independentes do **Acumulado geral** (**Inscritos ativos**, **Aguardando confirmação**). Filtros mensais e anuais; limites históricos do consentimento semanal documentados. O **Resumo do acervo** conserva a linha **E-mails**.
- **Relatórios:** página `/admin/relatorios.html` com seleção Administrativo/Palestrante, mês/ano ou ano inteiro, prévia e impressão/PDF. **Estatísticas** ainda é proposta de área analítica, não funcionalidade completa; não implementar sem nova autorização.
- Agenda pública: formulário de inscrição para agendas mensal e semanal, confirmação por e-mail, cancelamento e avisos flutuantes; toast de e-mail duplicado mais abaixo e com âmbar reforçado. **Envio semanal desativado** no Worker; não ativar automaticamente. O Worker de e-mails é independente do GitHub e requer publicação específica.

### 11.3 Pendências e riscos abertos
1. **Prioridade imediata, se o usuário trouxer uma nova captura:** conferir a **prévia real de impressão** da segunda revisão. Avaliar número de páginas, tamanho da fonte, cortes, ordem de quadros e espaços em branco; não assumir que a meta de 2–3 páginas foi atingida só pela simulação. Pedir autorização antes de qualquer nova correção/deploy.
2. **Relatório do Palestrante:** aguardar feedback, sem alterar por iniciativa própria.
3. **Área Estatísticas:** planejamento registrado na seção anterior; não implementada.
4. **Mapa do palestrante:** melhoria estrutural adiada pelo usuário; não iniciar sem autorização.
5. **E-mails:** não ativar envio semanal; não confundir deploy do site com deploy do Worker; preservar destinatários e rotinas já existentes.
6. **Programa Windows v3.1:** separado do site e ainda não autorizado para nova geração/instalação.
7. **Histórico deste arquivo:** as seções antigas registram estados e números válidos em datas anteriores, inclusive ideias que depois foram implementadas. Em caso de conflito, prevalece o estado **verificado no HEAD atual**, seguido das decisões mais recentes, sem apagar o histórico.

### 11.4 Prompt recomendado
O texto atualizado para copiar no início do próximo chat está na seção **6 — “Texto para iniciar outro chat”**. Ele instrui a ler este arquivo e **não autoriza alterações** por si só.

## 23/11/2026 — Terceira revisão da impressão Administrativa (autorizada)

- **Motivo:** a prévia real apresentada pelo usuário tinha 2 páginas, porém com **cortes à direita, indicadores truncados, texto pequeno e grandes áreas em branco**. A segunda revisão reduziu páginas, mas não resolveu a legibilidade.
- **Correção:** `admin/report-view.js` monta duas seções próprias para impressão: (1) visão geral com cabeçalho, seis KPIs, evolução do acervo, rosca, origem e evolução das visitas; (2) acompanhamento administrativo com conteúdos recentes, atividades, pendências, monitor de e-mails, inscrições, próximos eventos e resumo do acervo. Os quadros são clonados do Dashboard carregado, sem alterar o original.
- **Paginação e largura:** `admin/report-print.css` usa **largura fluida de 100% da área imprimível**, em vez dos 190 mm rígidos; elimina o fluxo `columns:2` da nova seção de detalhes e cria duas colunas explícitas com quebra de página entre as seções. Gráficos e fontes foram ajustados para leitura em A4 retrato. O CSS específico do Relatório do Palestrante não foi modificado.
- **Preservação:** nenhum indicador, dado, gráfico ou cadastro foi removido. Ações rápidas continuam no Dashboard, mas não são dados de impressão. Menus, filtros Mensal/Ano inteiro, Estatísticas planejada, Worker, D1, envios e programa Windows não foram alterados. Atualizado apenas o cache-busting dos recursos de impressão nos dois dashboards.
- **Validação antes de publicar:** simulação local em Chromium com conteúdo **representativo, não autenticado**: **2 páginas** com sete atividades e **3 páginas** com vinte atividades, sem cortes horizontais na composição simulada. **Ainda falta conferir a prévia de impressão com os dados reais e as configurações do navegador do usuário**.
- **Controle:** HEAD de partida `90d3882b43a3b3cc0b36747e0ac8a26b87d85fc1`; alteração na `main` autorizada. Confirmar separadamente o deploy Cloudflare Pages.

- **Publicação verificada:** commit de código `5a272494e5282067ef74050744fe2c0433bbef64` — check **Cloudflare Pages: completed / success** em **23/11/2026 às 01:28:32 UTC**. URL de preview fornecida pelo check: `https://275e1d75.pazqueilumina.pages.dev`. Isto confirma o deploy do código, **não** substitui a conferência da prévia autenticada com os dados reais.

## 23/11/2026 — Quarta revisão: impressão Administrativa colorida (aprovada para deploy)

- **Aprovação:** o responsável conferiu e aprovou a prévia colorida de duas páginas A4 (`PREVIA-Relatorio-Administrativo-v4.pdf`) e autorizou explicitamente a publicação na `main`.
- **Implementação:** a função `buildAdminPrint` em `admin/report-view.js` foi substituída pela versão v4 aprovada. Ela cria um relatório independente da grade visual do Dashboard: seis indicadores, evolução do acervo, evolução das visitas, gráfico de rosca, origem das visitas, conteúdos recentes, atividades recentes, pendências, monitor de e-mails, inscrições da agenda, próximos eventos e resumo do acervo. Valores são lidos dos widgets atuais no momento da impressão; o Dashboard original permanece intacto.
- **Layout:** o CSS da v4 foi acrescentado ao final de `admin/report-print.css` com regras `#reportPrintRoot` restritas a `body.report-view.report-admin`. A4 retrato, textos e gráficos coloridos, cartões compactos, duas seções, sem colunas automáticas herdadas. `admin/dashboard.html` teve apenas o identificador de cache dos dois recursos atualizado.
- **Preservação:** não foram removidos dados, indicadores, filtros Mensal/Ano inteiro, menus ou funcionalidades do Dashboard. Nenhuma alteração no Worker de e-mails, D1, envio semanal, mapa, programa Windows ou código específico do Relatório do Palestrante.
- **Testes pré-publicação:** `node --check` da função v4 passou. Prévia local em Chromium com dados representativos foi validada: **2 páginas A4 coloridas**, 12 seções presentes, sem transbordamento horizontal; cenário com 20 atividades passou sem cortes horizontais, usando 4 páginas. Os testes não representam autenticação nem garantem sempre 2 páginas com volumes maiores.
- **Acompanhamento:** confirmar a conclusão do deploy Cloudflare Pages deste commit e a impressão com os dados reais no navegador do usuário.

- **Deploy confirmado:** commit de código `1495f41ac4e4f60f271b5f0cf66ae9b092322d7c` — check `Cloudflare Pages` **completed/success** em `2026-11-23T01:40:56Z`. Preview Cloudflare: `https://87abbbca.pazqueilumina.pages.dev`. Publicação automática confirmada; prévia autenticada com dados reais continua sujeita à conferência do usuário.

## 23/11/2026 — Impressão administrativa v5 isolada (deploy autorizado)

- **Autorização:** após conferir a prévia `VALIDACAO-Relatorio-Administrativo-v5.pdf`, o responsável autorizou explicitamente o deploy da v5 na `main`.
- **Causa identificada:** o arquivo legado `admin/report-print.css` acumulava cinco blocos `@media print` e quatro regras `@page`, gerando conflitos com a impressão v4 embutida no DOM do Dashboard (PDF real chegou a sete páginas).
- **Solução:** adicionados `admin/report-admin-standalone.js` e `admin/report-admin-isolated.css`. O botão Imprimir do Relatório Administrativo gera documento HTML separado, sem carregar o CSS antigo, com visualização A4 colorida, gráficos, indicadores, listas e tabelas. Para a opção de impressão automática, a nova rotina também é utilizada. A extração dos dados continua sendo feita por `buildAdminPrint()` existente, sem mudanças nos widgets do Dashboard.
- **Integração mínima:** `admin/dashboard.html` carrega o novo script entre `report-view.js` e `dashboard.js`; `admin/report-view.js` redireciona apenas a impressão administrativa para `PazAdminStandalonePrint.open()`. O relatório do palestrante continua utilizando a rotina anterior. Nenhuma mudança no CSS legado, Worker, envio semanal, D1, filtros Mensal/Ano inteiro, menus, mapa ou aplicativo Windows.
- **Validação local:** Chromium confirmou 2 páginas A4, 6 KPIs, 11 quadros, textos e gráficos coloridos, sem sobreposição, cortes ou páginas vazias. Com 20 atividades, 3 páginas sem perda de linhas. A abertura em nova aba preservou o Dashboard original. `node --check` do novo JS passou. Os dados dos testes foram reconstruídos do PDF do usuário e **não** são dados autenticados ao vivo.
- **Operação:** no diálogo de impressão, usar A4, Cor e Gráficos de segundo plano; a opção Preto e branco da impressora pode suprimir cores. **A confirmar após o deploy:** check Cloudflare Pages e impressão autenticada com dados reais.

- **Deploy Cloudflare Pages confirmado:** commit de código `bb0479dc079ef0ff2338d8434662f7508cf2657d` — check `Cloudflare Pages` **completed/success** em `2026-11-23T01:59:46Z`; preview: `https://084792d5.pazqueilumina.pages.dev`. A publicação automática está confirmada; impressão autenticada com dados reais ainda depende de conferência no navegador do usuário.

## 23/11/2026 — Melhorias aprovadas em Locais, Palestras e Shorts

- **Autorização:** usuário autorizou explicitamente executar todas as alterações pendentes e publicar na branch `main`.
- **Commit de código:** `129b1c345fab6f48ed7d397ea39cc936a59a2d41`. **Cloudflare Pages:** check `completed/success` em `2026-11-23T02:53:24Z`; preview: https://ceebc564.pazqueilumina.pages.dev.
- **Cadastro de Locais (`admin/locais.html`, `admin/locais.js`, `admin/admin.css`):** campo **Estado (UF)** antes de **Cidade**, lista das 27 unidades federativas, consulta sob demanda à API de municípios do IBGE ao selecionar o estado, ordenação alfabética e cache em memória por UF. Nenhuma UF/cidade fica pré-selecionada em novos locais. Na edição, UF e cidade já existentes são recuperadas; nomes antigos que não coincidam com a lista e falhas da API são atendidos por campo manual, sem descartar dados. O Google Maps utiliza a cidade manual quando aplicável. Estilo restrito à página Locais. Exemplo do campo Nome do Centro / Local: **“Ex.: Consolador – Comunidade Espírita Cristã”**, apenas placeholder, sem preencher dados automaticamente.
- **Acervo de Palestras (`admin/palestras.html`, `admin/palestras.js`):** campo **Centro Espírita ou You Tube (opcional)** inicia com opção vazia **“Selecione um centro ou You Tube (opcional)”**; carregamento mantém essa opção no topo, não escolhe automaticamente o primeiro centro da ordenação, e a edição preserva o centro já cadastrado. Limpeza do formulário repõe seleção vazia. Sem mudança nos vínculos com a Agenda ou na publicação de palestras.
- **Shorts (`admin/shorts.html`, `admin/shorts.js`, `admin/shorts.css`):** botão retangular Ativar/Desativar substituído visualmente por indicador clicável **“● Ativo”** verde ou **“● Inativo”** vermelho, seguindo o padrão de Palestras. Mantidos os controles de ordenação, filtros, edição e o fluxo atual **Salvar na lista → Publicar alterações**; o clique no status dos Shorts continua preparando a alteração, sem publicação imediata.
- **Validação pré-publicação:** sintaxe dos três scripts JavaScript passou; HTML contém 27 UFs distintas; testes simulados de municípios cobriram edição de cidade existente, cache da API, cidade legada, falha de rede e reinicialização do formulário. Conferidas integração dos selects, estados dos Shorts e preservação dos arquivos/dados do repositório. **Teste de uso autenticado com dados reais:** a conferir pelo usuário; a API do IBGE não foi exercitada em sessão autenticada.
- **Escopo preservado:** sem alterações em dados de locais/palestras/Shorts, Worker de e-mails, envio semanal (continua desativado), D1, Dashboard, relatórios de impressão aprovados, mapa estrutural ou programa Windows v3.1.

## 23/11/2026 — Correção autorizada: origem e conferência de coordenadas em Locais

- **Solicitação e autorização:** após publicar coordenadas, o responsável observou que a mensagem “Coordenadas manuais (endereço não verificado)” continuava visível. Confirmou pessoalmente no mapa que as coordenadas do **Centro Espírita Cristófilos** estão corretas e autorizou implementar a correção e fazer deploy na `main`.
- **Causa:** `server_lib/geocode.js` prioriza latitude/longitude cadastradas para rotas; a API `functions/api/admin/verificar-enderecos.js` reutilizava essa rotina sem separar o processo de validação, classificando todo local com coordenadas salvas como `manual`, mesmo após o botão “Preparar coordenadas verificadas”. A verificação anterior era mantida apenas no `localStorage` e perdida após a mudança da assinatura do local.
- **Correção:** novo campo opcional `verificacaoCoordenadas` no cadastro, com valores `osm` (obtidas de correspondência exata no OpenStreetMap e preparadas para publicação) e `conferido` (ponto conferido no mapa pelo responsável). A API e o painel reconhecem a origem publicada e não voltam a exibir “não verificado” para esses casos. Uma conferência humana **não** é apresentada como validação automática do OpenStreetMap.
- **Dados preservados:** o único cadastro atual marcado como `conferido` é **Centro Espírita Cristófilos**, com confirmação explícita do responsável. Mantidos **exatamente** endereço `Rua Martins Ferreira, 57`, bairro `Botafogo`, cidade `Rio de Janeiro`, UF `RJ`, latitude `-22.9535572` e longitude `-43.1949614`. Outros locais, inclusive os que já possuem coordenadas, não são marcados como conferidos sem evidência.
- **Verificação de locais com coordenadas ainda sem origem registrada:** a API tenta consultar o endereço ignorando as coordenadas armazenadas; correspondência exata até 75 m é considerada verificada, diferença maior sinaliza `divergente` sem alterar o ponto, e resultado aproximado ou inconclusivo não é tratado como confirmação. O botão existente “Preparar coordenadas verificadas” pode preparar também a origem de coordenadas previamente cadastradas, se a correspondência exata tiver sido confirmada pelo serviço; publicação continua exigindo ação explícita.
- **Edição:** a origem é preservada apenas se nome/endereço/bairro/cidade/UF/link/coordenadas não mudaram; alteração de qualquer um desses dados invalida a conferência. O botão de sugestão individual continua funcionando e registra origem conforme o tipo de conferência. Mantidos filtros, contador de erros (inclui divergências), indicadores, mapa, cálculos de rotas e ações de cadastro/publicação.
- **Arquivos previstos no commit:** `admin/locais.js`, `admin/locais.html`, `admin/admin.css`, `server_lib/locais.js`, `functions/api/admin/verificar-enderecos.js`, `data/locais.json` e este documento. Não houve alteração em `server_lib/geocode.js`, Worker de e-mails, envio semanal, D1, Dashboard, relatórios, Agenda, Palestras, Shorts ou programa Windows.
- **Testes pré-deploy:** sintaxe do JS administrativo aprovada; 9 cadastros preservados; validação de campo novo e valores inválidos; 9 cenários simulados de API (origem humana/OSM, correspondência exata, divergência, resultado aproximado, sem coordenadas, endereço não encontrado e falha de rede); 5 cenários de painel (histórico antigo, preparação de coordenadas novas/existentes, edição sem mudanças e invalidação após alteração de endereço). Testes simulados, **não** geocodificação real nem sessão autenticada.
- **Publicação:** verificar commit `main`, check Cloudflare Pages e, depois, exibição no painel autenticado. O registro de publicação deve ser atualizado somente após confirmação.
- **Deploy confirmado:** commit de código `cf7c7ec655f24976a2d1fab8a273c6950a74f1b7`; check **Cloudflare Pages completed/success** em `2026-11-23T03:08:27Z`; preview `https://26478ca6.pazqueilumina.pages.dev`. Publicação do código confirmada; conferência visual no painel autenticado continua pendente.

## 23/11/2026 — Separação visual de endereço e coordenadas (publicada)

- **Pedido:** separar o quadro de verificação de endereços do quadro de coordenadas, e retirar o texto positivo permanente “Coordenadas conferidas pelo responsável” da lista de centros, mantendo a informação acessível.
- **Layout preparado:** quatro indicadores (Locais cadastrados, Endereços com erro, Coordenadas cadastradas e Situação). O botão “Verificar endereços” permanece no box de endereços; “Preparar coordenadas verificadas” passa ao box de coordenadas. Contagens de coordenadas confirmadas/sem confirmação ficam no novo box. Layout responsivo (4 colunas em telas largas, 2 em médias, 1 em pequenas).
- **Critério:** conferência humana de coordenadas não é tratada como verificação do endereço. O quadro de endereços mostra quantos endereços foram efetivamente avaliados; o quadro de coordenadas mostra o registro permanente de conferência. O status detalhado do local selecionado aparece dentro de “Coordenadas geográficas” no editor. Mensagens positivas de confirmação saem apenas da lista (sem apagar dados, verificação, histórico, indicadores ou alertas); erros, divergências e pendências continuam visíveis na lista.
- **Lar de Frei Luiz:** continua com coordenadas cadastradas sem campo `verificacaoCoordenadas`; não é marcado como conferido automaticamente só porque houve salvamento. **Cristófilos:** mantém `verificacaoCoordenadas: "conferido"`, latitude/longitude e endereço existentes.
- **Arquivos previstos:** `admin/locais.html`, `admin/locais.js`, `admin/admin.css` e este documento. Sem alteração em `data/locais.json`, API de verificação, mapas, rotas, demais módulos ou programa Windows.
- **Publicação autorizada e confirmada:** commit de código `10f5c07841f3605bda1ebf8827842c837c5619a2` na `main`; check **Cloudflare Pages completed/success** em `2026-11-23T03:16:38Z`; preview: https://a68438ef.pazqueilumina.pages.dev. Verificação visual no painel autenticado ainda depende de conferência pelo usuário.
- **Testes pré-publicação:** sintaxe JS aprovada; 4 indicadores e IDs únicos no HTML; cenários simulados de Cristófilos com confirmação permanente, Lar de Frei Luiz sem confirmação permanente, contagem de endereço separada da conferência humana, botão de preparação com resultado exato OSM, CSS responsivo e manutenção dos alertas de erro. Não foram alterados dados dos locais.

## 23/11/2026 — Confirmação do endereço do Cristófilos e respiro no gráfico de rosca (autorizado)

- **Pedido:** registrar que o responsável conferiu a correspondência entre o endereço e as coordenadas do **Centro Espírita Cristófilos**, remover a pendência de endereço sem fingir verificação automática, identificar nominalmente futuras pendências e corrigir a proximidade excessiva entre o gráfico de rosca e o texto-resumo no Dashboard do Palestrante.
- **HEAD de partida:** `3071c0ec81e0f1b3ef51a980d0c2fb476c2c16d9`, posterior à publicação de coordenadas OSM do Lar de Frei Luiz. Preservar os 9 locais e os campos `verificacaoCoordenadas` existentes: Cristófilos `conferido` e Lar de Frei Luiz `osm`.
- **Confirmação independente:** novo campo opcional `verificacaoEndereco: "responsavel"` somente no cadastro do Cristófilos, já conferido pessoalmente pelo responsável. A validação do servidor aceita exclusivamente esse valor e exige latitude e longitude. O painel e a API exibem o estado `endereco-conferido` como **conferência humana da correspondência**, distinto da verificação automática e da origem das coordenadas. O painel passa a contar o endereço como avaliado e explicita quantos foram conferidos pelo responsável; nenhum outro local é marcado por inferência.
- **Preservação na edição:** salvar sem alterar nome/endereço/bairro/cidade/UF/link/coordenadas mantém a confirmação. Alterar algum desses campos invalida tanto a conferência de endereço quanto a de coordenadas e sinaliza nova verificação. O histórico local antigo não sobrepõe a confirmação publicada.
- **Pendências identificadas:** se houver endereços pendentes, o box “Endereços com erro” mostra o nome de cada centro e o motivo (ainda não verificado, falha na consulta ou coordenadas conferidas sem confirmação do endereço). O contador de erros e seu filtro permanecem independentes das pendências. Se não houver pendências, a lista auxiliar fica oculta, preservando o espaço.
- **Dashboard do Palestrante:** `admin/palestrante.css` aplica altura mínima específica ao widget da rosca e separação de 18 px entre o gráfico/legenda e o resumo inferior, sem mexer em cores, dados, séries, porcentagens ou demais widgets. Atualizado somente o identificador de cache do CSS em `admin/palestrante.html`.
- **Arquivos:** `data/locais.json`, `server_lib/locais.js`, `functions/api/admin/verificar-enderecos.js`, `admin/locais.js`, `admin/locais.html`, `admin/admin.css`, `admin/palestrante.css`, `admin/palestrante.html` e este documento. Não tocar em Worker de e-mails, envio semanal, mapas/rotas, Agenda, Palestras, Shorts, Relatórios ou programa Windows.
- **Testes prévios:** 9 locais preservados, com apenas o novo campo no Cristófilos; validação do campo e compatibilidade com cadastro antigo; 9/9 endereços avaliados no cenário com histórico disponível, sendo 1 confirmado pelo responsável; nomes e motivos quando há pendência; 2 coordenadas confirmadas; estado do editor; simulações da API (manual, legado, OSM, divergência); edição sem alteração preserva as confirmações e alteração de endereço as invalida. Renderização sintética em Chromium (larguras 1400, 1200, 900, 600 e 420 px) mostrou separação mínima de 37 px no gráfico/legenda até o resumo, sem sobreposição ou corte no cartão. Não substitui inspeção visual no painel autenticado.
- **Deploy confirmado:** commit de código `9bdb40be989a3c5b86ff6a2717ee05cc2f15e88c` na `main`; check **Cloudflare Pages completed/success** em `2026-11-23T03:25:03Z`; preview: https://9d68bed9.pazqueilumina.pages.dev. A publicação está confirmada; a conferência visual no painel autenticado com os dados reais depende do responsável.

## 23/11/2026 — Confirmação manual do endereço do Lar de Frei Luiz

- **Autorização:** o responsável confirmou pessoalmente a correspondência entre endereço e coordenadas dos **dois locais** (Centro Espírita Cristófilos e Lar de Frei Luiz) e autorizou corrigir o cadastro do Lar e publicar na `main`.
- **Mudança delimitada:** adicionado exclusivamente `"verificacaoEndereco": "responsavel"` ao registro `lar-de-frei-luiz` em `data/locais.json`. O Cristófilos já tinha essa confirmação e permanece inalterado. Todos os nove locais, seus IDs, endereços, latitudes, longitudes, origens das coordenadas, demais campos e funcionalidades foram preservados. O campo `verificacaoCoordenadas` do Lar permanece `osm`, distinguindo verificação OSM das coordenadas e conferência humana do endereço.
- **Comportamento esperado:** o painel indicará **2 endereços conferidos pelo responsável**, sem pendência para esses dois locais. A contagem de 9/9 endereços avaliados depende dos resultados dos demais endereços disponíveis no histórico local do navegador, como antes. O total de 2 coordenadas confirmadas permanece. A confirmação humana não é apresentada como validação automática.
- **Escopo:** somente `data/locais.json` e este documento. Não modificar código, CSS, dashboards, mapa, Worker, envio semanal, aplicativo Windows ou outros cadastros.
- **Testes prévios:** validação do esquema do servidor; nove locais preservados; comparação integral dos registros antes/depois confirma adição de um único campo no Lar; os dois registros têm `verificacaoEndereco="responsavel"`; conferência de que a API e o painel atuais reconhecem esse campo. Conferência autenticada no navegador ainda depende do responsável.
- **Deploy confirmado:** commit de código `a314f825efcf0fb9ba3fc946a2fbf89cbc8df416` na `main`; check **Cloudflare Pages completed/success** em `2026-11-23T03:29:06Z`; preview: https://4426461d.pazqueilumina.pages.dev. Publicação confirmada; conferir o painel autenticado com os dados reais no navegador.

## 23/11/2026 — Esclarecimento dos indicadores de endereços e coordenadas (autorizado)

- **Motivo:** o responsável conferiu os 9 endereços, mas o painel mostrava “2 conferidos pelo responsável” junto a “9 de 9 endereços avaliados”, sugerindo equivocadamente que os outros 7 não foram verificados. O quadro de coordenadas mostrava “0 sem confirmação registrada” sem contabilizar os 7 locais que ainda não têm latitude/longitude.
- **Distinção correta:** o quadro **Endereços com erro** continua informando erros, endereços avaliados, eventuais pendências, data da última verificação e botão “Verificar endereços”. A contagem de **2 conferidos pelo responsável** permanece disponível, porém passa para o quadro **Coordenadas cadastradas**, explicitada como **2 locais com endereço e coordenadas conferidos pelo responsável** (correspondência manual entre endereço e ponto; não é o total de endereços avaliados).
- **Coordenadas:** mostrar separadamente (1) total com latitude/longitude; (2) quantas coordenadas cadastradas estão confirmadas e quantas têm confirmação pendente; (3) **quantos locais não possuem coordenadas cadastradas**; (4) quantos têm correspondência entre endereço e coordenadas conferida pelo responsável. No estado atual: **9 locais, 2 com coordenadas, 2 coordenadas confirmadas, 0 coordenadas cadastradas sem confirmação, 7 sem coordenadas, 2 correspondências conferidas manualmente**.
- **Persistência e precisão:** os 9/9 endereços avaliados exibidos na captura dependem de histórico de verificação do navegador para os 7 locais sem coordenadas; não criar confirmação permanente fictícia para eles. A conferência humana de 2 locais está registrada no cadastro. Nenhuma geocodificação, origem, endereço, latitude/longitude, registro de confirmação, dados, menus, filtros, funcionalidades ou validações foi alterado.
- **Escopo autorizado:** somente `admin/locais.js`, `admin/locais.html` (novas linhas e cache-busting) e este documento. Worker de e-mails, envio semanal, mapas/rotas, demais dashboards e aplicativo Windows não foram alterados.
- **Validação:** sintaxe JS, contagem com dados reais (9, 2, 7, 2, 0, 2), casos simulados sem coordenadas e com coordenadas não confirmadas, preservação dos indicadores e status de verificação de endereços. Inspeção visual no painel autenticado continua a cargo do responsável.
- **Deploy confirmado:** commit de código `c07a7c8b96342d7707aca55799d222afdef3885d` na `main`; check **Cloudflare Pages completed/success** em `2026-11-23T03:33:27Z`; preview: https://ae19392c.pazqueilumina.pages.dev. Conferência visual final no painel autenticado depende do responsável.

## 23/11/2026 — Resumo de coordenadas simplificado e seletor CSV padronizado

- **Pedido autorizado:** no cartão “Coordenadas cadastradas”, substituir a mensagem longa com “0 coordenadas pendentes” pela síntese **“2 confirmadas · 7 locais sem coordenadas cadastradas”** e retirar as duas linhas auxiliares de resumo. A informação de conferência manual continua acessível dentro do editor do local selecionado; os campos `verificacaoEndereco` e `verificacaoCoordenadas` não são alterados.
- **Regra de alerta preservada:** se existirem coordenadas cadastradas aguardando confirmação, o resumo único acrescenta o número de pendências (e, quando aplicável, coordenadas prontas para preparar). O zero não aparece quando não há pendências. O número grande continua representando quantos locais têm latitude e longitude cadastradas; o número de locais sem coordenadas é calculado por diferença.
- **Importação CSV de Palestras:** o campo nativo `#csvP` em “Importar em lote” recebe borda, raio, largura, altura mínima, padding e tamanho de fonte equivalentes aos do seletor de MP3 do formulário. Mantidos o controle nativo do navegador, a associação do rótulo, o formato CSV, o código de importação, as ações de lote, o upload MP3/PDF e a publicação manual.
- **Arquivos modificados:** `admin/locais.js`, `admin/locais.html`, `admin/palestras.css`, `admin/palestras.html` e este documento. **Nenhum dado ou funcionalidade de cadastro foi modificado**, nem Worker de e-mails, envio semanal, mapa, Dashboard, relatórios ou programa Windows.
- **Validação:** sintaxe do JS, IDs de elementos no HTML, contagens com 9 locais/2 com coordenadas/7 sem coordenadas, comportamento com zero e com coordenadas pendentes, seletor CSV nativo mantido, CSS isolado à aba Importar. Conferência visual final no painel autenticado ainda depende do responsável.
- **Deploy confirmado:** commit de código `41578d76a8c72736f1e4af95b4f1771e3b2ca2ae` na `main`; check **Cloudflare Pages completed/success** em `2026-11-23T03:39:54Z`; preview: https://fbb2b427.pazqueilumina.pages.dev. Conferência visual final no painel autenticado ainda depende do responsável.

## 23/11/2026 — Indicador de centros e novas pendências no Dashboard Administrativo (autorizado)

- **Pedido:** exibir a quantidade total de centros/locais cadastrados junto ao gráfico **Evolução das visitas**, e acrescentar à área **Pendências** os locais sem coordenadas e, quando existirem, os endereços com erro. Implementação e deploy na `main` expressamente autorizados.
- **Indicador:** cartão clicável “Centros cadastrados” no **cabeçalho à direita do gráfico**, com o total do cadastro `/api/admin/locais`, link para `/admin/locais.html`. A contagem **não depende** dos filtros mensal/anual, que continuam controlando o gráfico e demais dados de período. O gráfico preserva sua largura interna, séries, eixo, altura de 234px e rolagem horizontal quando necessária; o cabeçalho ocupa espaço próprio, sem sobrepor barras.
- **Pendências:** o Dashboard já busca `/api/admin/locais`; sem chamadas extras, calcula **locais sem latitude ou longitude** e exibe um alerta clicável quando o total for maior que zero (estado atual: **7 de 9**). **Endereços com erro** são derivados apenas do histórico de verificação `localStorage` do mesmo navegador (`pazqueilumina-locais-verificacao-v1`), com **assinatura atual do cadastro** igual à utilizada por `admin/locais.js`; considera apenas os estados `erro` e `divergente`, não classifica endereços não verificados como erro, e ignora históricos obsoletos quando endereço/coordenadas mudaram. A confirmação publicada no cadastro tem prioridade sobre histórico local. A mensagem explicita “verificação neste navegador”, pois **não existe registro compartilhado desses erros no servidor**. Ausência de histórico não é interpretada como endereço comprovadamente correto.
- **Preservação:** todas as pendências anteriores (PDF, MP3, vídeo, Agenda, e-mails) permanecem; retirada apenas a antiga limitação artificial de exibição aos cinco primeiros avisos, para que os novos não escondam os existentes. Links levam ao Cadastro de Locais, sem publicação automática. Nenhum dado, endereço, coordenada, verificação, mídia, indicador anterior, menu ou funcionalidade foi removido.
- **Arquivos:** `admin/dashboard.html`, `admin/dashboard.css`, `admin/dashboard.js` e este documento. Sem alterar Worker de e-mails, envio semanal, funções do servidor, mapa, impressão, programa Windows ou cadastros.
- **Validação:** sintaxe JavaScript, IDs HTML, CSS de cabeçalho e gráfico preservado, totais com dados reais (9 cadastrados, 7 sem coordenadas), histórico local válido/obsoleto, erro/divergência, confirmação permanente, indisponibilidade de dados e lista com mais de 5 pendências. Conferência visual autenticada ainda depende do responsável.
- **Deploy confirmado:** commit de código `979ec461c4d0201b989c6e5fe56a9ea5641b6e75` na `main`; check **Cloudflare Pages completed/success** em `2026-11-23T03:49:02Z`; preview: https://d1c5715b.pazqueilumina.pages.dev. O Dashboard autenticado ainda precisa de conferência visual do responsável. **Atenção à impressão:** o relatório administrativo independente reaproveita a lista de Pendências exibida no Dashboard; com mais avisos, conferir a prévia de impressão e a paginação com dados reais. Não alterar o relatório sem nova autorização.

## 23/11/2026 — Separação visual dos boxes de visitas e centros (autorizado)

- **Motivo:** o indicador “Centros cadastrados” aparecia dentro do mesmo box de “Evolução das visitas”, o que prejudicava a leitura visual. O responsável solicitou dois boxes separados, aprovou o exemplo com aproximadamente 80% para o gráfico e 20% para os centros, e autorizou implementar e fazer deploy na `main`.
- **Alteração:** em `admin/dashboard.html`, a seção `.visits-evolution-grid` contém agora dois irmãos independentes: `article.widget-visits-evolution` (gráfico) e `a.widget-centers-registered` (box clicável de centros). Cada um tem sua própria borda, fundo e espaçamento. O novo box exibe “Centros cadastrados”, número real, legenda “Total de locais cadastrados” e “Ver locais”, com link para `/admin/locais.html`.
- **CSS:** `admin/dashboard.css` organiza os dois boxes em grade aproximada de **80/20**, com `gap` visível e empilhamento em larguras até 980px. Preservadas a altura de 234px do gráfico, sua rolagem horizontal, séries, rótulos, filtros e escala. Removidos somente os estilos do antigo cartão interno, substituídos pelos do box independente.
- **Sem mudanças funcionais:** `admin/dashboard.js`, `admin/report-view.js`, `admin/report-print.css`, dados e API permanecem intocados. O ID `kCentrosCadastrados` continua único e usa a mesma contagem real; não foram alterados menus, pendências, cadastro, Worker de e-mails, envio semanal, mapa ou programa Windows.
- **Validação:** conferir estrutura dos dois widgets irmãos, unicidade dos IDs, manutenção do SVG do gráfico, regras responsivas e preservação do código de contagem. Conferência visual autenticada com dados reais pelo responsável após deploy.
- **Deploy confirmado:** commit de código `0883d0dc72f8cbad2b6d9df31b28ab18d6d156cc` na `main`; check **Cloudflare Pages completed/success** em `2026-11-23T03:55:52Z`; preview: https://b0a721c2.pazqueilumina.pages.dev. Conferência visual final no painel autenticado ainda depende do responsável.

## 23/11/2026 — Favicon unificado e alinhamento do indicador de centros (autorizado)

- **Autorização:** após escolher o conceito de pomba dourada sobre fundo azul-marinho, com o desenho da pomba já usado no Dashboard, o responsável autorizou a implementação e o deploy na `main`. Também estava pendente o pedido explícito de alinhar o box “Centros cadastrados” ao box “Origem das visitas” da linha acima.
- **Favicon oficial:** criado `/favicon.svg` com os **mesmos dois caminhos vetoriais** da pomba já presente no cabeçalho do Dashboard Administrativo, adaptados em cor dourada (`#F4C563`), traço legível em tamanho pequeno e fundo azul-marinho (`#142D53`). Criado `/favicon.ico` com tamanhos 16x16 e 32x32 para compatibilidade. Não foi usada a pomba conceitual gerada anteriormente por IA; a origem é o desenho vetorial já existente no projeto.
- **Páginas:** todas as **18 páginas HTML** (9 públicas e 9 administrativas) passam a referenciar os mesmos arquivos absolutos `/favicon.ico?v=20261123a` e `/favicon.svg?v=20261123a`. Nos 9 HTML públicos, somente o favicon anterior baseado em emoji foi substituído; nos 9 administrativos, foram acrescentadas as referências. Títulos, textos, menus, scripts, estilos e funcionalidades existentes foram mantidos. A alteração é exclusiva do ícone exibido na aba, não substitui o logotipo visível no site.
- **Alinhamento:** `admin/dashboard.css` passa a usar no bloco de Evolução das visitas/Centros cadastrados a **mesma grade de três colunas e o mesmo espaçamento** da `.top-grid` acima (2.18fr / 1.43fr / .97fr, 7px), com o gráfico ocupando as duas primeiras colunas e o box de centros a terceira. Isso alinha **as duas bordas laterais** do box com “Origem das visitas” em telas desktop acima de 1200px. Entre 981 e 1200px mantém dois boxes lado a lado; até 980px empilha os boxes. Não foram alterados dados, contagens, gráficos, filtros ou links.
- **Arquivos:** `favicon.svg`, `favicon.ico`, os 18 HTML, `admin/dashboard.css` e este documento. **Não** alterar `admin/dashboard.js`, dados, APIs, Worker de e-mails, envio semanal, mapas, relatórios, programa Windows ou outros arquivos.
- **Validação:** conferidos os 18 cabeçalhos HTML, duas referências de ícone por página e ausência do emoji antigo, preservação integral do restante de cada HTML, SVG vetorial, ICO binário, regras de alinhamento responsivo e preservação das regras do gráfico. A verificação visual em navegador autenticado e o cache do favicon dependem da conferência do responsável.
- **Deploy confirmado:** commit de código `095ab120c8e420213ac2a24444a0d16f4f6a6904` na `main`; check **Cloudflare Pages completed/success** em `2026-11-23T04:09:37Z`; preview: https://bb747d40.pazqueilumina.pages.dev. Código, favicons e alinhamento validados no GitHub. Conferência visual em sessão autenticada e atualização do favicon no cache do navegador ainda dependem do responsável.

## 23/11/2026 — Novas melhorias futuras registradas (NÃO implementar agora)

**Decisão do responsável:** o favicon recém-publicado **não ficou bom**. A avaliação visual e qualquer correção ficam adiadas. Registrar também SEO e o e-mail de resposta ao cadastro no site para trabalho futuro. **Este pedido autoriza somente atualizar este documento de continuidade no GitHub**, sem alterar código, arquivos visuais, dados, configuração de e-mail, Worker ou versões.

1. **Melhorar o favicon:** rever o resultado atual (pomba dourada sobre fundo azul-marinho) porque o responsável não aprovou sua aparência. Na retomada, apresentar alternativas visuais concretas e prévias nos tamanhos reais das abas (16×16, 32×32), conferir legibilidade, fidelidade ao símbolo da pomba do projeto, contraste e comportamento nos navegadores. Não substituir o favicon existente nem alterar o logotipo antes de nova escolha e autorização explícita.
2. **SEO do site público:** realizar auditoria e propor plano de melhoria de indexação e apresentação em buscadores, incluindo títulos e descrições por página, canonical, sitemap.xml, robots.txt, metadados de compartilhamento, dados estruturados quando pertinentes, links internos, semântica e desempenho. Primeiro verificar o que já existe; evitar duplicar configurações ou alterar conteúdo, menus, URLs e funcionalidades sem aprovação. **Somente planejamento, nenhuma alteração agora.**
3. **E-mail de resposta ao cadastro de inscritos no site:** revisar a mensagem que a pessoa recebe após solicitar inscrição na Agenda pelo site (atualmente há fluxo de confirmação por e-mail / double opt-in, segundo o histórico). Avaliar clareza, texto, identidade visual, instruções de confirmação, prazo/validade do link, eventual mensagem após confirmação, acessibilidade e experiência de quem se cadastra. Antes de implementar, identificar no Worker qual mensagem é realmente enviada e definir com o responsável se o objetivo é melhorar o e-mail de confirmação existente, acrescentar uma mensagem de boas-vindas ou ambos. **Não confundir com os lembretes 24h/1h nem com o envio mensal/semanal de agendas.** Preservar consentimento, segurança, cancelamento e comportamento atual até nova autorização.

**Restrições preservadas:** o Worker de e-mails é independente do site; **não modificá-lo nem publicá-lo sem autorização específica**. O envio semanal continua desativado (`weeklyEnabled=false`), e este registro **não autoriza ativação**. Nenhuma das três melhorias foi implementada nesta atualização documental.


## 23/11/2026 — Eventos de mídia no GoatCounter (coleta implementada)

- **Autorização:** responsável pediu implementar, não apenas discutir. Publicação na `main` autorizada.
- **Objetivo:** acompanhar cliques em vídeos de palestras, Shorts, áudios/MP3 e PDFs a partir do site público, sem criar um segundo sistema de contagem.
- **Coleta:** `js/app.js` registra um único evento por clique de link de mídia no GoatCounter (`pazqueilumina.goatcounter.com`), com caminhos estáveis `midia/video/PAL-xxxx`, `midia/audio/PAL-xxxx`, `midia/pdf/PAL-xxxx` e `midia/short/SHO-xxxx`. O nome da palestra é enviado como título legível.
- **Cobertura:** cartões de apresentações (imagem, título e botão), destaque da página inicial, página de vídeos/Shorts, página de áudios, página de PDFs e resultados da busca global. Links de agenda/transmissões e do canal não entram no ranking de palestras.
- **IDs:** `prepararApresentacoes()` mantém `pid` e os Shorts mantêm `sid`; registros sem ID válido não geram evento. Atualizado `js/dados.js` para o endereço correto do GoatCounter e parâmetros de versão dos scripts em todas as páginas públicas.
- **Métrica:** cliques de saída, não tempo de visualização, execução de áudio ou download efetivamente concluído. Não inferir consumo real a partir desses eventos.
- **Histórico:** eventos antigos `assistir: título` permanecem no GoatCounter, mas o novo padrão `midia/...` começa após a publicação; não misturar os dois sem conciliação. Filtrar por `midia/` no GoatCounter para consultar os rankings por período.
- **Próxima etapa, não implementada:** integrar rankings diretamente ao menu Estatísticas do painel administrativo, após definir acesso seguro à API do GoatCounter. Não criar indicadores fictícios.
- **Escopo preservado:** nenhuma mudança no Worker de e-mails, D1, R2, cadastros ou funcionalidades dos Dashboards.

## 23/11/2026 — Estatísticas do acervo integradas ao painel

- Autorização: usuário pediu implementar e publicar diretamente na main.
- Página: /admin/estatisticas.html, protegida pelo middleware Cloudflare Access. Inclui KPIs, Top 10, comparação por formato, evolução por dia/mês, ranking completo e busca; filtros mensal, anual, vídeo, áudio, PDF e Shorts.
- Menu Estatísticas dos Dashboards Administrativo e Palestrante aponta para a nova página, preservando todos os indicadores existentes.
- API: functions/api/admin/estatisticas.js consulta o endpoint oficial GoatCounter /api/v0/stats/hits, pagina com exclude_paths, valida período, agrega caminhos midia/{tipo}/{PAL|SHO-ID}, respeita limite de taxa e retorna erros sem expor a chave.
- Dependência externa obrigatória: gerar chave de API com permissão de leitura de estatísticas no GoatCounter (menu de usuário > API) e cadastrar como secret GOATCOUNTER_API_TOKEN nas variáveis de produção do projeto Cloudflare Pages. Não gravar o segredo no GitHub. Sem o segredo, a página mostra configuração pendente, nunca zeros fictícios.
- Eventos medidos: contagens de interação no GoatCounter, não reprodução concluída nem download efetivo. Histórico do novo padrão começou em 23/11/2026; eventos antigos 'assistir: título' não são somados automaticamente.
- O catálogo data/palestras.json e data/shorts.json é consultado no navegador para títulos e links. Não altera cadastros, Worker de e-mails, D1, R2, ou dashboards já existentes.
- Estado no commit: código publicado; ativação de dados reais depende da configuração do segredo e teste com o GoatCounter.


## 23/11/2026 — Relatórios de Estatísticas e ajuste visual dos indicadores

- **Solicitação:** retirar os textos redundantes "Cliques para assistir/ouvir/baixar" dos cartões Vídeos, Áudios, PDFs e Shorts; no cartão Total manter apenas "No período selecionado" abaixo do valor.
- **Menu Relatórios:** adicionar terceira opção **Estatísticas do acervo**, preservando Administrativo e Palestrante. Permitir escolher mês/ano ou ano inteiro, pré-visualizar e imprimir/salvar em PDF.
- **Conteúdo do relatório:** dados reais da mesma API GoatCounter que abastece Estatísticas; cartões de totais, Top 10, comparação por formato, evolução e ranking completo com identificação das palestras. A métrica continua sendo cliques de saída, não reproduções nem downloads concluídos.
- **Impressão:** modo de relatório sem sidebar e controles, com cabeçalho de período e emissão; folha A4 paisagem, tipografia e gráficos compactos, tabela completa com cabeçalho repetido em páginas adicionais quando necessário. Impressão automática só após carregamento bem-sucedido dos dados; erro de API não gera impressão com valores falsos.
- **Arquivos:** admin/estatisticas.html, admin/estatisticas.js, admin/estatisticas.css, admin/estatisticas-print.css (novo), admin/relatorios.html, admin/relatorios.js. Demais dashboards, Worker e cadastros não alterados.

## 23/11/2026 — Estatísticas e Relatórios dentro do menu Dashboard

- Menu lateral dos três painéis com sidebar (Administrativo, Palestrante e Estatísticas) unificado: **Dashboard** agora contém, nesta ordem, **Administrativo, Palestrante, Estatísticas e Relatórios**. Removidos os dois atalhos soltos no nível principal.
- O item da página ativa continua destacado, e o Dashboard abre expandido por padrão. O botão de recolher/expandir mantém o comportamento, aproveitando a regra CSS de `[hidden]` já existente para ocultar os quatro itens quando fechado.
- **Gestão** (Agenda, Inscritos, Locais, Palestras, Shorts) e **Acervo** mantidos; itens do Acervo harmonizados entre os três painéis. A página de seleção de Relatórios conserva sua navegação de retorno e não teve layout alterado.
- Arquivos: admin/dashboard.html, admin/palestrante.html, admin/estatisticas.html, admin/dashboard.css. Sem alteração de API, Worker ou dados.


## 23/11/2026 — Formulário de inscrição transferido para Contato e convite discreto na Agenda

- **Autorização:** o responsável aprovou mover o formulário completo de inscrição por e-mail para o menu público **Contato**, deixando na Agenda somente uma faixa compacta de convite após os três primeiros eventos futuros, com link **Inscrever-se** para `/contato.html#inscricaoMensal`. Publicação diretamente na `main`.
- **Agenda:** título, filtros e eventos agora aparecem antes da chamada de inscrição. O convite é inserido depois do terceiro evento futuro visível (ou depois dos disponíveis, se forem menos de três), respeita os filtros de Centro, período e busca e não aparece se não houver próximos eventos. Só é exibido após confirmação de disponibilidade do Worker de inscrições, evitando direcionar a formulário desativado.
- **Contato:** preservados e-mail, YouTube e Instagram. Abaixo, inserido o formulário completo existente com e-mail, consentimento expresso, inscrição nas agendas mensal e semanal e solicitação de cancelamento. Os mesmos endpoints e payloads do Worker foram preservados; não houve alteração em envio, opt-in, cadência, banco de inscritos ou Worker. O link com âncora rola para a seção após a renderização dinâmica e a checagem de disponibilidade.
- **Estilo:** faixa discreta e responsiva na Agenda; formulário completo com estilo atual em Contato. Cache atualizado apenas em `agenda.html` e `contato.html`.
- **Arquivos:** `js/app.js`, `css/estilo.css`, `agenda.html`, `contato.html`, `CONTINUIDADE-PROJETO.md`. Não alterar outras páginas, dados, Cloudflare Worker, dashboards ou programa Windows.
- **Validação:** sintaxe JS, presença dos IDs e endpoints originais, exibição condicionada à disponibilidade do Worker, posicionamento do convite após três eventos, filtro e âncora dinâmica. Testes de envio/cancelamento reais exigem conferência do responsável no navegador; não disparar e-mails de teste sem autorização.

## 23/11/2026 — Convite da Agenda reposicionado, foco no e-mail e nova paleta (deploy autorizado)

- **Autorização:** responsável aprovou conjuntamente as três mudanças e o deploy direto na branch `main`, incluindo aplicar a mesma paleta ao formulário completo de inscrição na página Contato.
- **Agenda pública:** o convite compacto **“Receba a agenda por e-mail”** foi deslocado para **logo após os filtros e a contagem de eventos, antes do primeiro evento futuro**. Deixou de interromper a sequência após o terceiro evento. Respeita os filtros e continua condicionado à disponibilidade do Worker; quando não existem eventos futuros correspondentes, não aparece. O botão **Inscrever-se** mantém o destino `/contato.html#inscricaoMensal`.
- **Foco de teclado:** ao acessar a âncora vinda da Agenda, depois de carregar e revelar o formulário no Contato, o JavaScript rola até a seção e coloca o foco diretamente no input `#emailInscricaoMensal` (com `preventScroll`). O foco deixa de ir para o título; não foi retirado o título nem modificado o formulário.
- **Paleta aprovada aplicada aos dois boxes:** fundo creme claro `#F8F5EF`, borda bege `#E5DDD0`, títulos e botões azul-marinho `#243B5A`, detalhes dourados no ícone do convite da Agenda. Na página Contato, também foram harmonizados os textos, borda do input, checkbox de consentimento e link de cancelamento, **sem alterar suas ações**. As regras específicas do formulário foram escopadas a `body[data-page="contato"]`.
- **Arquivos de código:** `js/app.js`, `css/estilo.css`, `agenda.html` e `contato.html`; cache-busting atualizado nos dois HTML. Sem mudanças em dados, eventos, filtros, inscrições, consentimento, cancelamento, APIs, Worker de e-mails, D1, envios mensais/semanais, dashboards, relatórios ou programa Windows.
- **Validação antes do commit:** análise de sintaxe do `js/app.js` aprovada; conferidos foco no input, ordem do convite, manutenção do controle de disponibilidade e filtros, escopo dos estilos e referências de CSS/JS atualizadas. **Não foram enviados e-mails de teste** nem realizada inspeção autenticada no navegador do responsável.
- **Publicação de código:** commit `71c1bf3ae6083da9731eacac032fe1fc67930b02` na `main`. Check **Cloudflare Pages completed/success** em **2026-11-23T18:46:16Z**. Confirma a implantação do código; a aparência final, o foco no navegador e o fluxo real de inscrição ainda devem ser conferidos pelo responsável.
- **Observação histórica:** a seção imediatamente anterior documenta a posição antiga após três eventos. **A posição atual é antes do primeiro evento**, conforme esta atualização.

## 23/11/2026 — Diferenciação visual entre filtros e inscrição; envelope e fundo revistos

- **Motivação:** após a publicação anterior, o responsável observou que o fundo do quadro dos filtros da Agenda e o do convite de inscrição estavam praticamente iguais. A sugestão inicial de convite azul-claro com envelope dourado não agradou; o responsável autorizou publicar uma alternativa mais neutra.
- **Filtros da Agenda:** preservados com o fundo bege existente; sem alterações nos filtros ou no funcionamento.
- **Convite da Agenda:** fundo **branco** `#FFFFFF`, borda cinza-azulada `#CBD6E4` com acento lateral azul-marinho `#243B5A`; envelope **azul-marinho** `#243B5A` sobre base cinza muito claro `#EDF1F5`. Retirados o fundo creme e o dourado do ícone introduzidos na revisão anterior. Título e botão continuam azul-marinho.
- **Contato:** o quadro completo de inscrição segue a mesma identidade: fundo branco, borda cinza-azulada com acento lateral azul-marinho, mantendo todas as opções e funcionalidades. O restante da página e as informações de contato não foram modificados.
- **Preservado:** posição do convite antes dos eventos, link `/contato.html#inscricaoMensal`, foco direto em `#emailInscricaoMensal`, inscrição e cancelamento, filtros, verificação de disponibilidade do Worker, e envio semanal desativado. Nenhum ajuste no Worker de e-mails ou em dados de agenda.
- **Arquivos:** somente `css/estilo.css`, `agenda.html` e `contato.html` (atualização das referências de cache). `js/app.js` não foi alterado nesta revisão.
- **Validação:** conferidos seletores de cores e acentos, manutenção dos controles e cache atualizado nas duas páginas. Publicado na `main` pelo commit `379ffd50b199f682e29095384195f41e610ff212`. Check **Cloudflare Pages completed/success** em **2026-11-23T18:50:38Z**. A aparência final no navegador do responsável ainda requer confirmação visual; nenhum e-mail de teste foi disparado.

## 23/11/2026 — Ajustes visuais aprovados: Agenda, contatos compactos e retorno à primeira revisão do formulário

- **Autorização explícita:** o responsável escolheu **“primeira revisão”** para o formulário de inscrição de Contato e autorizou **“pode fazer o deploy”** do conjunto de ajustes visuais descrito na conversa. Esta seção prevalece sobre descrições históricas de estilos anteriores.
- **Agenda — convite por e-mail:** restaurada a proposta com fundo azul muito claro `#EDF3FA`, borda azul suave `#C8D5E5`, **envelope azul-marinho** `#243B5A` e **fundo apenas do ícone** azul-acinzentado `#E0E8F2`. O botão permanece azul-marinho. Não alterar a posição da faixa: depois da contagem e antes do primeiro evento futuro. **Filtros permanecem bege**, sem alteração.
- **Contato — quadro de informações:** somente nesta página, a caixa com **E-mail, YouTube e Instagram** passa a ter largura máxima de `540px`, preenchimento `18px 24px`, fundo creme `#F7F4EE`, borda bege `#E5DDD0` e `margin-top:0` na lista para remover excesso de espaço acima dos contatos. Preservados textos, links e ícones. A regra global `.pagina-texto` e a página **Sobre** não foram modificadas.
- **Contato — formulário de inscrição:** restaurada exatamente a aparência da **primeira revisão** de 23/11 (commit `71c1bf3`) no que havia sido alterado posteriormente: fundo creme `#F8F5EF`, borda bege `#E5DDD0`, sem borda lateral azul; botão e demais acentos azul-marinho permanecem. Separador de cancelamento retorna a `#E5DDD0`. Não usar a variante branca com borda lateral azul introduzida depois.
- **Escopo estrito:** alterados somente `css/estilo.css`, `agenda.html` e `contato.html` (referências de cache). Não alterar `js/app.js`, Worker, dados, envio semanal, consentimento, cancelamento, filtros, links, cadastros, dashboards ou demais páginas.
- **Validação:** conferidas substituições de seletores específicos, manutenção das regras globais, equilíbrio das chaves CSS e cache das duas páginas. O JavaScript e o Worker não foram modificados. A inspeção visual no navegador do responsável ainda depende de sua conferência.
- **Deploy do código:** commit `f1d3b05240d5797a623e62ddf0ca439f06518045` na `main`. **Cloudflare Pages completed/success** em **2026-11-23T19:00:01Z**. Nenhum e-mail de teste foi disparado.

## 23/11/2026 — Link do livro na página Sobre e fundos bege em Sobre, Livro e inscrição de Contato

- **Autorização explícita:** após proposta de tornar clicável somente o título do livro no texto da página Sobre e usar no formulário de inscrição de Contato o bege dos filtros da Agenda, o responsável acrescentou aplicar o mesmo fundo aos quadros das páginas Livro e Sobre e autorizou o deploy.
- **Sobre:** na frase **“Autor do Livro A Bênção da Dor, Editora Viseu.”**, somente **“A Bênção da Dor”** tornou-se link interno para `livro.html`. A frase, os demais parágrafos, os links externos e a fotografia foram preservados. Implementado na função `renderizarSobre` de `js/app.js`, com substituição estritamente condicionada ao texto exato, sem mudar `js/dados.js`.
- **Paleta dos quadros:** o mesmo bege `#F7F0E7` já usado no quadro dos filtros da Agenda agora é usado **somente** no quadro principal `.pagina-texto` da página **Sobre**, no quadro principal `.pagina-texto` da página **Livro**, e no formulário de inscrição `.inscricao-mensal` da página **Contato**. Os seletores foram restritos a `body[data-page="sobre"]`, `body[data-page="livro"]` e `body[data-page="contato"]` para não modificar outros componentes.
- **Preservados:** a aparência e as funções dos filtros da Agenda; o convite de inscrição azul-claro da Agenda; o quadro compacto de informações (E-mail, YouTube e Instagram) em Contato, que mantém seu fundo `#F7F4EE`; a primeira revisão do formulário de Contato (bordas, botão azul-marinho, textos, campos, consentimento, cancelamento, foco no e-mail e Worker); conteúdo, fotos, capa, link de compra e demais páginas.
- **Arquivos de código alterados:** `css/estilo.css`, `js/app.js`, `sobre.html`, `livro.html` e `contato.html`. Os HTML receberam somente atualização das referências de cache pertinentes (CSS nas três páginas, JS apenas em Sobre). Nenhuma alteração em dados, Worker de e-mails, APIs, envio semanal ou programa Windows.
- **Validação:** sintaxe JavaScript aprovada; confirmadas substituições exclusivas, seletores específicos, integridade das chaves CSS, manutenção dos controles e referências de cache. Não houve teste de inscrição real nem envio de e-mail.
- **Publicação:** commit de código `351efb59a5cdc35432ad4ca0505fbd93ec8ef21c` na `main`, com check **Cloudflare Pages completed/success** em **2026-11-23T19:06:41Z**. A inspeção visual no navegador do responsável permanece pendente.

## 23/11/2026 — Canais de contato e rodapé público padronizado em todas as páginas

- **Solicitação e autorização:** responsável aprovou o rótulo **“CANAIS DE CONTATO”** e solicitou **padronização em todas as páginas**, anexando imagem do rodapé da página inicial. A aprovação também respondeu à pergunta anterior de implementação e deploy. Escopo: quadro de informações em Contato e rodapés das **nove páginas públicas**, sem modificar os rodapés funcionais do administrativo.
- **Contato — quadro E-mail, YouTube e Instagram:** fundo do quadro `.pagina-texto` restrito à página Contato passou de `#F7F4EE` para **`#F7F0E7`**, idêntico ao formulário “Receba as agendas” e aos filtros da Agenda. Inserida, antes da lista de contatos, a etiqueta **“CANAIS DE CONTATO”** reutilizando literalmente a classe CSS `.inscricao-mensal-etiqueta` do rótulo **“AGENDA POR E-MAIL”** (mesma fonte, tamanho 10px, cor `#9C7440`, peso 750, espaçamento entre letras 1.7px e margem inferior 8px). Preservados largura compacta 540px, espaçamentos, links, ícones e conteúdo dos três contatos. Formulário de inscrição não foi modificado.
- **Rodapé público:** o padrão já presente em `index.html` — **“© 2026 Paz Que Ilumina — Divulgação da Doutrina Espírita”** — foi reproduzido de forma idêntica em `agenda.html`, `apresentacoes.html`, `audios.html`, `contato.html`, `livro.html`, `slides.html`, `sobre.html` e `videos.html`. Para reproduzir o padrão visual exato da página inicial mostrado na imagem, os rodapés públicos antigos com citação “Nascer, morrer, renascer...” e a marca de 2025 foram substituídos. **Nenhuma outra informação das páginas foi removida.** A home já estava no padrão e não precisou ser alterada.
- **Área administrativa:** rodapés de dashboards e relatórios são informativos e funcionais; **não foram alterados**, pois não fazem parte do rodapé institucional público.
- **Arquivos de código:** `js/app.js` (etiqueta), `css/estilo.css` (cor), oito HTML públicos listados acima (rodapés; `contato.html` também com referências de cache atualizadas). `index.html` permaneceu intacto.
- **Validação:** sintaxe de `js/app.js` aprovada, CSS com chaves equilibradas, etiqueta usando estilo existente, nove rodapés públicos conferidos como idênticos, comparação de diffs restrita aos elementos solicitados. Sem alterações em APIs, Worker, envios de e-mails, filtros, dashboards ou conteúdo de acervo.
- **Publicação:** commit de código `45bac626d8a0cad6b1807d9d081daaa9f846f7f4` na `main`; check **Cloudflare Pages completed/success** em **2026-11-23T19:14:42Z**. A conferência visual no navegador do responsável continua recomendada.

## 23/11/2026 — Correção do menu administrativo no celular

- **Problema:** na visualização móvel (largura até 760px), o Dashboard mostrava somente o botão principal; o CSS ocultava os submenus e os botões Gestão/Acervo, impedindo acesso às outras páginas.
- **Autorização:** o responsável autorizou explicitamente o deploy da correção mobile.
- **Solução:** em `admin/dashboard.css`, o menu móvel passa a organizar os grupos verticalmente, exibe os botões Dashboard, Gestão, Acervo e Voltar ao site, e mostra os links internos somente quando o respectivo grupo está expandido. As regras `[hidden]` continuam respeitadas. Desktop e lógica JavaScript dos botões não foram alterados.
- **Arquivos:** `admin/dashboard.css` e `admin/dashboard.html` (atualização da versão de cache CSS). Nenhum outro arquivo funcional, Worker, serviço de e-mail, filtros ou dashboards alterado.
- **Validação:** conferidos IDs dos três grupos, regras de ocultação, chaves CSS equilibradas e alteração limitada ao breakpoint móvel. Conferência visual real em celular permanece pendente.
- **Código publicado na main:** `fab26fcff3ae9011e8b7ec78716ea7c6493e1edf`. O status da implantação Cloudflare Pages deve ser consultado no check deste commit (iniciado após o push).

## 23/11/2026 — Corrigida data de publicação do áudio PAL-0001

- **Problema observado:** após publicação pelo programa Windows v3.1, o site exibiu 39 áudios, mas o indicador **Novos*** do **Resumo do acervo** no Dashboard continuou em 0. O Dashboard considera o campo `publicacoes.audio` para identificar novos MP3 no período; a atualização do programa Windows incluiu o endereço R2, mas não o carimbo de publicação.
- **Correção autorizada:** somente no cadastro `data/palestras.json`, palestra `PAL-0001` — **As Curas de Jesus** — acrescentado `publicacoes.audio: "2026-11-23T20:27:00.000Z"`, correspondente à data/hora do commit de publicação original `763af516c5b670d802da89854e1c9fa0c012c534`. O áudio existente em `https://audio.pazqueilumina.com.br/PAL-0001.mp3` foi preservado.
- **Resultado esperado:** no filtro **Novembro de 2026**, o Dashboard deve exibir **Áudios: 39** e **Novos: +1**. Outros períodos continuam seguindo o filtro selecionado.
- **Validação:** JSON parseado; comparação dos objetos confirma alteração de **um único campo** em PAL-0001, sem mudar os demais cadastros. Commit `bfeb2434b07f63d6b23854bce9c78f83ebb629b4` na `main`. Check **Cloudflare Pages**: **completed/success**, em **2026-11-23T20:32:38Z**. Conferência visual do indicador com os dados reais ainda recomendada.
- **Pendência separada:** a versão Windows v3.1 não registra automaticamente `publicacoes.audio` em publicações futuras. Corrigir em versão futura somente após autorização explícita; **não gerar nova versão agora**. Não houve alteração no Worker, envios de e-mail, dashboard ou outros registros.

## 23/11/2026 — Padronização visual de títulos e inicial maiúscula após hífen separador

- **Autorização:** responsável aprovou deploy da regra: após hífen separador de trechos do título, a primeira letra deve ser maiúscula. Exemplo: **“O quinto dos últimos dias de Jesus - A agonia de Jesus no jardim do Getsêmani”**. Hífens internos de palavras compostas, como **“lava-pés”**, não são separadores e não devem ser alterados.
- **Padronização existente preservada:** formatação em estilo de frase, nomes próprios e siglas da função anteriormente usada em Apresentações; função centralizada em `js/titulos.js` (`formatarTituloSite`). O padrão passa a ser usado na exibição pública de palestras (Apresentações, home, Áudios, Slides e buscas) e nos títulos de palestras em Estatísticas, Dashboard administrativo, Dashboard do Palestrante e gestão de palestras. **Shorts e Agenda não têm seus títulos convertidos**, para não modificar grafias específicas ou eventos.
- **Separadores:** ` - `, ` – ` e ` — ` (com espaços) capitalizam o primeiro caractere da palavra seguinte; palavras compostas sem espaços não mudam. O conteúdo original do acervo `data/palestras.json`, IDs, URLs, mídias, filtros, contadores e dados do GoatCounter permanecem intactos.
- **Implementação:** novo `js/titulos.js`, adaptação de `js/app.js`, `admin/estatisticas.js`, `admin/dashboard.js`, `admin/palestrante.js` e `admin/palestras.js`, com referências de script e cache atualizadas nas nove páginas públicas e nas quatro páginas administrativas envolvidas. Sem mudanças no Worker de e-mails, no envio semanal, em dados ou no programa Windows.
- **Validação:** seis scripts compilados sem erro de sintaxe, seis casos de teste de formatação aprovados (incluindo hífen separador, meia-risca, travessão e palavras compostas), referências do script conferidas e Shorts preservados. Conferência visual no navegador após o deploy recomendada.
- **Publicação confirmada:** commit `7dd2d2652b6ff4174ad09cfd7ed95cf62679b067` na `main`, com check **Cloudflare Pages completed/success** em **2026-11-23T21:39:58Z**. A conferência visual no navegador continua recomendada.

## 23/11/2026 — Vínculo do MP3 PAL-0004 após upload R2

- **Autorização:** responsável autorizou o commit da correção específica da PAL-0004 na branch `main`. Não alterar PAL-0013 nem outros registros.
- **Diagnóstico:** o usuário confirmou `PAL-0004.mp3` no bucket Cloudflare R2, baixou e reproduziu o arquivo, e testou com sucesso o endereço público em janela anônima. O painel havia recebido erro de conflito de SHA ao publicar o vínculo no GitHub; o cadastro permanecia pendente.
- **Alteração exclusiva em `data/palestras.json`:** PAL-0004 recebeu `audio: "https://audio.pazqueilumina.com.br/PAL-0004.mp3"`, `audioPlataforma: "Cloudflare R2"`, `statusAudio: "existente"` e `publicacoes.audio: "2026-11-23T22:18:10.750Z"`.
- **Critério da data:** o carimbo de `publicacoes.audio` registra a publicação do **vínculo no catálogo do site** durante este commit; não representa nem afirma o horário exato de upload ao R2, que não foi obtido.
- **Preservação:** 79 palestras; 78 com vínculo de áudio após o commit; PAL-0013 continua pendente. Nenhum outro dado, título, link, mídia, código, Worker de e-mails, envio semanal, Dashboard ou programa Windows foi modificado.
- **Validação pré-commit:** JSON válido, contagem dos registros e comparação dos 78 outros objetos sem mudanças. O commit na `main` aciona o fluxo automático do Cloudflare Pages; verificar o check e o site após a publicação.

## 23/11/2026 — Vínculo do MP3 PAL-0013 após upload R2

- **Autorização:** responsável solicitou repetir para PAL-0013 a correção aprovada e realizada em PAL-0004, com commit na `main`.
- **Diagnóstico:** PAL-0013 — **Nas Terras de Chico - Parte 1 - Pedro Leopoldo** — permanecia com `audio` vazio e `statusAudio: "pendente"`, embora o responsável tenha confirmado que o MP3 correspondente já estava enviado e reproduzível no domínio público do R2.
- **Alteração exclusiva em `data/palestras.json`:** PAL-0013 recebeu `audio: "https://audio.pazqueilumina.com.br/PAL-0013.mp3"`, `audioPlataforma: "Cloudflare R2"`, `statusAudio: "existente"` e `publicacoes.audio: "2026-11-23T22:20:53.784Z"`.
- **Data:** `publicacoes.audio` indica o momento do registro do vínculo no catálogo, não o horário original de upload ao R2.
- **Preservação:** 79 palestras, agora 79 com vínculo de áudio; PAL-0004 e todos os outros registros mantidos integralmente. Nenhuma mudança em código, Worker de e-mails, envio semanal, R2, Dashboard ou aplicativo Windows.
- **Validação pré-commit:** JSON válido, contagens conferidas, comparação dos outros 78 objetos sem alterações. O commit na `main` aciona o deploy automático do Cloudflare Pages; verificar o check e o site após a publicação.

## 23/11/2026 — Exportação CSV filtrada e envio automático de MP3/PDF pelo Salvar na lista

- **Autorização:** responsável pediu remover o texto auxiliar do cabeçalho do Acervo, colocar um botão pequeno para baixar CSV conforme a seleção e retirar os botões separados de envio de MP3 ao R2 e PDF ao GitHub; autorizou explicitamente commit e deploy na `main`.
- **Acervo:** o cabeçalho exibe somente **Acervo**, botão **↓ CSV** e **+ Nova**. O CSV do novo botão respeita **filtro, texto de busca e ordenação atuais** e mantém colunas `ID,Titulo,Data,YouTube,Apresentacao` compatíveis com a importação. O botão de exportação da aba Importar em lote continua exportando o catálogo completo, como antes.
- **Envio unificado:** para palestras **novas e existentes**, selecionar MP3/PDF e clicar **Salvar na lista** executa o upload, preenche os links e publica automaticamente no GitHub. Sem arquivo selecionado, mantém-se o comportamento anterior: preparar e depois clicar em **Publicar alterações**. O botão superior de publicação também encaminha arquivos selecionados ao fluxo unificado, para não descartá-los inadvertidamente.
- **Segurança:** palestras novas são inicialmente reservadas como inativas até o fim do upload; palestras existentes **não são desativadas temporariamente**. A proteção contra sobrescrever MP3s no R2 ou PDFs existentes no GitHub permanece intacta. Falhas parciais são sinalizadas e os arquivos concluídos são vinculados sem repetir o upload. O progresso do MP3 e mensagens de envio permanecem disponíveis.
- **Conflitos:** quando uma publicação automática encontra conflito de SHA do cadastro, o painel relê o JSON e tenta uma única conciliação **por campo alterado**, preservando alterações remotas independentes e recusando sobreposição no mesmo campo ou IDs conflitantes. Se o vínculo não puder ser publicado, o usuário é avisado para não reenviar o arquivo já armazenado.
- **Arquivos:** `admin/palestras.js`, `admin/palestras.html`, `admin/palestras.css` e este documento. Não modificar dados de palestras, arquivos MP3/PDF, endpoints, Worker de e-mails, envio semanal, dashboards ou aplicativo Windows.
- **Validação:** sintaxe JS, seletores/IDs do HTML, integridade do CSS, testes de filtros e conciliação de alterações independentes/conflitantes. Testes reais autenticados de upload R2 e GitHub dependem de conferência no navegador após o deploy.

## 23/11/2026 — Correção imediata do Acervo após deploy CSV

- **Autorização:** usuário reportou erro `numerosOrdem is not defined`, botão CSV com aparência diferente de **+ Nova** e remoção indevida de texto; autorizou corrigir e publicar na `main`.
- **Falha e correção:** ao refatorar o filtro de palestras para a exportação CSV, a declaração de `numerosOrdem` foi excluída do `render()`. Restaurada a numeração cronológica **do catálogo completo**, mantendo o número original mesmo ao buscar, filtrar ou inverter a lista.
- **Interface:** botão **↓ CSV** passa a usar exatamente as classes `botao secundario` do **+ Nova**; estilos específicos removidos. Mantido **“Ordem cronológica.”** abaixo de Acervo; removido apenas **“Selecione uma palestra para editar.”**. A anotação anterior que indicava remoção do texto inteiro foi substituída por esta correção.
- **Escopo:** somente `admin/palestras.js`, `admin/palestras.html`, `admin/palestras.css` e `CONTINUIDADE-PROJETO.md`. Nenhuma alteração de dados, links, arquivos, upload R2/GitHub, dashboards, Worker ou aplicativo Windows.
- **Validação:** execução real da função `render()` em DOM simulado com busca, filtros, inversão e numeração cronológica; validação de sintaxe, classes dos botões e atualização de cache-busting. Verificar publicação Cloudflare Pages após commit.

## 23/11/2026 — Dashboard: taxa de confirmação; Acervo: botão Nova redundante e texto

- **Autorização:** usuário pediu aplicar todos os deploys pendentes diretamente na `main`.
- **Dashboard Administrativo:** cartão **Agenda semanal** substituído por **Taxa de confirmação**. Cálculo: `monthly.confirmedFromNew / monthly.new × 100`, com até uma casa decimal, `—` quando não há novos inscritos. A coorte considera inscritos criados no mês/ano selecionado que já possuem `confirmed_at`; inclui confirmações posteriores ao período, quando existirem. O indicador **Confirmados** permanece como confirmações ocorridas no período e não é o numerador da taxa. Nota explicativa atualizada; filtros mensais/anuais, demais indicadores e Acumulado geral preservados.
- **API de inscritos:** campo aditivo `monthly.confirmedFromNew` computado por SQL sobre `created_at` do período e `confirmed_at IS NOT NULL`, inclusive zero no caso sem tabela. Não alterar D1, Worker de e-mails, agendamentos ou automações.
- **Acervo:** removidos o botão redundante **+ Nova** ao lado de **↓ CSV** e seu listener; mantida a aba **+ Nova palestra** no painel direito. CSV permanece à direita e com estilo `botao secundario`. Texto abaixo de Acervo alterado para **“Selecione uma palestra para editar.”**; removido **“Ordem cronológica.”**. Filtros, ordenação, exportação, upload e cadastro preservados.
- **Arquivos:** `admin/dashboard.js`, `admin/dashboard.html`, `functions/api/admin/inscritos.js`, `admin/palestras.js`, `admin/palestras.html`, `CONTINUIDADE-PROJETO.md`.
- **Validação:** sintaxe JS, teste da renderização do percentual, correspondência de IDs, placeholders SQL e argumentos, checagem da aba Nova preservada e do botão CSV; upload real não testado nesta alteração.

## 23/11/2026 — Corrigir contagem de novos PDFs no Dashboard (12 PDFs seguros)

- **Autorização:** usuário aprovou corrigir a coluna **Novos** dos Slides (PDF) após publicação dos 12 PDFs seguros.
- **Diagnóstico:** os arquivos e os vínculos já estavam publicados no commit `4436adc16bfe8810d5f104114c877443a1162177`, mas os 12 cadastros não tinham `publicacoes.pdf`. O Dashboard usa esse campo para contar PDFs novos no período.
- **Correção pontual:** definir `publicacoes.pdf = "2026-11-24T02:42:38Z"` nos IDs `PAL-0033`, `PAL-0029`, `PAL-0020`, `PAL-0062`, `PAL-0019`, `PAL-0013`, `PAL-0011`, `PAL-0026`, `PAL-0010`, `PAL-0038`, `PAL-0045`, `PAL-0069`, com base no horário do commit de publicação original (23/11/2026, 23h42, horário de Brasília).
- **Resultado esperado no filtro novembro/2026:** **Slides (PDF) Total = 19; Novos = +12**. O indicador **Apresentações Novos** permanece **+5**, pois segue a data da palestra.
- **Preservação:** sem alterações de PDF binário, links, títulos, datas das palestras, outros 67 registros, PDFs históricos, Dashboard, Worker, API, aplicativo Windows ou outras funcionalidades.
- **Validação:** comparação estrutural dos 79 registros, confirmando alteração exclusivamente no campo `publicacoes.pdf` dos 12 IDs, e cálculo do total de 19 PDFs e 12 novos em novembro.

## 23/11/2026 — Correção do formato das datas dos 12 PDFs (erro de validação PAL-0069)

- **Origem do problema:** o commit `815dac7609b3250147d27f360323ae5731ad8a0c` inseriu `publicacoes.pdf = "2026-11-24T02:42:38Z"` nos 12 PDFs seguros. O validador `server_lib/palestras.js` exige ISO UTC com exatamente três dígitos de milissegundos, como `2026-11-24T02:42:38.000Z`. O erro aparece na primeira palestra inválida em ordem de leitura, PAL-0069, mesmo que o usuário esteja editando PAL-0036.
- **Correção:** somente os 12 campos `publicacoes.pdf` introduzidos anteriormente passaram a `2026-11-24T02:42:38.000Z`, preservando o instante original. Nenhum outro dado, PDF, link, frontend, backend, Worker ou aplicativo foi alterado.
- **Validação:** todos os `53` timestamps de publicação do cadastro seguem o padrão exigido, sem datas inválidas; 79 registros comparados, somente os 12 campos alterados; Dashboard esperado: PDFs Total 19, Novos novembro 12.
- **Observação operacional:** a publicação manual de uma página aberta antes do commit ainda pode resultar em conflito 409. Se houver edições locais não publicadas, copiá-las antes de recarregar e aplicar novamente depois.

## 24/11/2026 — Reversão autorizada do deploy de material de apresentação

- **Solicitação:** restaurar imediatamente o comportamento e a aparência anteriores do gerenciamento de palestras, sem manter as alterações do commit `b48841f9ba3a73e9793da32aab0961701a3c1cf5`.
- **Rollback:** os arquivos `admin/palestras.html`, `admin/palestras.js`, `server_lib/palestras.js` e `data/palestras.json` foram restaurados **exatamente** ao conteúdo do commit anterior `de4e61f6022dc6f6e363ed1463f729c125a983d3`.
- **Efeito:** removidos o novo seletor “Material de apresentação”, a compactação das ajudas e os ajustes do formulário introduzidos no último deploy. As classificações adicionadas a PAL-0036 e PAL-0047 foram revertidas. Retornam os textos e os campos anteriores, inclusive as instruções de envio de MP3 e PDF.
- **Preservado:** 79 palestras, 19 PDFs, uploads, dashboard, alterações anteriores de dados e todas as funcionalidades fora desse commit.
- **Motivo:** o usuário considerou o resultado visual inadequado e solicitou restauração imediata; não realizar mudanças adicionais sem aprovação específica.

## 24/11/2026 — Compactação pontual do Gerenciamento de Palestras (autorizada)

- **Escopo autorizado:** resumir a uma linha cada os textos explicativos sob os títulos de upload MP3/R2 e PDF/GitHub, o texto abaixo dos botões Salvar/Descartar e a descrição do topo da página. Títulos dos uploads, limites de tamanho, seletores, botões, status e funcionalidade de envio automático permanecem intocados.
- **Campo removido apenas da interface:** `Nome do arquivo PPTX/PDF para processamento posterior`. O valor `apresentacaoOriginal` é preservado no salvamento de registros existentes, e a importação/exportação CSV (coluna `Apresentacao`) continua funcionando normalmente; não remover o campo do modelo de dados ou do servidor.
- **Rodapé:** substituído o texto técnico longo pelo rodapé do site público: `© 2026 Paz Que Ilumina — Divulgação da Doutrina Espírita`, com estilo discreto, linha superior e centralização. Nenhum outro elemento do site público foi modificado.
- **Fora do escopo e preservado:** as três orientações de Agenda, Locais e Data aproximada, estrutura dos blocos de upload, seção de PDFs, demais campos, filtros, CSV, dashboard, dados das palestras e backend. Não reintroduzir `Material de apresentação` neste deploy.
- **Arquivos:** `admin/palestras.html`, `admin/palestras.js`, `admin/palestras.css`, `CONTINUIDADE-PROJETO.md`.

## 24/11/2026 — Grafia do nome próprio Zé (preparado, sem deploy)

- Pedido: em todos os títulos do site e painel administrativo, exibir `A história do Zé`, com `Z` maiúsculo e acento.
- Causa: `js/titulos.js` converte os títulos em minúsculas e restaura nomes próprios por lista; `Zé` faltava na lista. O dado original de `data/palestras.json` já contém `A história do Zé`, portanto não é necessário alterar o cadastro.
- Correção preparada: adicionar `["zé", "Zé"]` ao normalizador global e renovar o parâmetro de versão do script em todas as 13 páginas HTML que o carregam (públicas e administrativas). Nenhuma alteração de layout ou de conteúdo das palestras.
- **Não publicado**: a alteração só deve entrar na branch `main` quando o usuário autorizar explicitamente o deploy. Até lá, não mover o ref `main` nem disparar o Cloudflare Pages.

## 24/11/2026 — Passagem para novo chat: estado confirmado e trabalho pendente

**IMPORTANTE:** Esta seção foi salva em um commit GitHub **não associado à branch main**. Não houve deploy, conforme pedido expresso do usuário. A documentação na `main` só será atualizada junto da próxima publicação autorizada.

### Estado publicado e confirmado
- Repositório: `pazqueilumina/site`; site `https://pazqueilumina.com.br`; Cloudflare Pages com deploy automático quando `main` muda.
- HEAD publicado da `main`: `859e9d097af35c2513c9ef3059440af66796e158` — Cloudflare Pages check `success`.
- Alterações desse último deploy: textos de ajuda MP3/R2 e PDF/GitHub resumidos sem mexer nos cabeçalhos; descrição superior do Gerenciamento de Palestras e ajuda sob Salvar/Descartar compactadas; campo visual “Nome do arquivo PPTX/PDF para processamento posterior” removido mantendo `apresentacaoOriginal` e coluna CSV `Apresentacao`; rodapé técnico trocado por `© 2026 Paz Que Ilumina — Divulgação da Doutrina Espírita`. Preservados cadastros e funcionalidades.
- Referência de acervo: 79 palestras, 79 vídeos, 79 áudios e 19 PDFs (confirmar contagens ao retomar). Os dados de `data/palestras.json` não foram alterados no último deploy.
- **Não reintroduzir** o seletor “Material de apresentação”: foi incluído indevidamente em deploy anterior e revertido a pedido do usuário. Não mexer em outras seções sem autorização.

### Única alteração de código pendente, ainda não publicada
- O usuário apontou que o nome próprio `Zé` aparecia como `zé` na lista do Acervo e pediu corrigir em todo o site, mas **aguardar autorização de deploy**.
- Diagnóstico: `data/palestras.json` já contém `A história do Zé`. O problema é `js/titulos.js`, que transforma títulos em minúsculas e recupera nomes próprios de uma lista; faltava `["zé", "Zé"]`.
- Correção preparada e testada: acrescentar `["zé", "Zé"]` em `js/titulos.js` e alterar o parâmetro de cache do script `titulos.js` nas **13 páginas HTML** que o carregam (públicas e administrativas).
- Commit de código preparado: `cfdc43324dbe6d78627c36a09d115afe082c884a` — contém a correção e documentação; **não está na main e não acionou Cloudflare**. O commit desta seção de passagem é descendente dele. Ao receber autorização futura, conferir que `main` ainda está no commit esperado, então publicar o commit preparado por fast-forward, conferir Cloudflare Pages `success` e conferir visualmente `A história do Zé`.
- **Não alterar diretamente** `data/palestras.json` para este problema: o título já está correto na origem.

### Regras críticas reafirmadas
1. Nenhuma alteração adicional, commit na `main`, deploy, rollback, atualização do programa Windows ou Worker de e-mails sem autorização explícita.
2. A branch de produção é `main`; não usar `teste-admin`. Não criar branch de testes por iniciativa própria.
3. Trabalhar estritamente no escopo aprovado; não remover textos, campos, indicadores, menus, registros, funções ou reordenar componentes por iniciativa própria.
4. Antes de publicar: verificar HEAD, validar mudanças e compatibilidade, depois confirmar check do Cloudflare. Distinguir **commit preparado** de **deploy concluído**.
5. Manter `CONTINUIDADE-PROJETO.md` atualizado a cada publicação autorizada e evitar alegar alterações não verificadas.
6. Usuário prefere respostas curtas, objetivas e em português, sem alterações surpresas. Problemas recentes ocorreram por mudanças visuais indevidas; privilegiar escopo mínimo e preservação.

### Prompt recomendado para iniciar o próximo chat

> Estou continuando o projeto Paz que Ilumina. Repositório GitHub: `pazqueilumina/site`, branch de produção `main`, site `https://pazqueilumina.com.br`. Leia o arquivo `CONTINUIDADE-PROJETO.md` do GitHub e confira o HEAD e o status do Cloudflare antes de qualquer ação. O último commit publicado com sucesso é `859e9d097af35c2513c9ef3059440af66796e158`. Há uma correção **preparada, mas não publicada**, para mostrar o nome próprio **Zé** com Z maiúsculo em todos os títulos; ela está no commit GitHub preparado, descendente de `cfdc43324dbe6d78627c36a09d115afe082c884a`, sem alteração na `main`. **Não faça deploy nem commit na main sem minha autorização expressa.** Preserve todos os dados, menus, funcionalidades e layouts existentes. Faça somente o que eu pedir, sem mudanças extras. Primeiro confirme o que está publicado e o que está pendente; depois aguarde minhas instruções.


---

# PROMPT CONSOLIDADO PARA INICIAR UM NOVO CHAT — 24/11/2026

**Este é o texto completo solicitado pelo usuário para reutilizar em chats futuros.** Ao retomar, ler a versão integral deste arquivo no commit indicado pelo usuário, além da versão publicada na `main`. Não tratar este registro como autorização de deploy.

## Continuidade do projeto Paz que Ilumina

Estamos continuando o desenvolvimento do projeto **Paz que Ilumina**, que envolve um site público, um painel administrativo e, separadamente, um programa Windows.

### 1. Informações do projeto

- **Repositório GitHub:** `pazqueilumina/site`
- **Branch de produção:** `main`
- **Site:** https://pazqueilumina.com.br
- **Painel de palestras:** https://pazqueilumina.com.br/admin/palestras.html
- **Hospedagem e deploy:** Cloudflare Pages
- **Documento principal:** `CONTINUIDADE-PROJETO.md`

### 2. Primeira tarefa obrigatória

Antes de propor ou executar qualquer alteração:

1. Acesse o GitHub e leia **integralmente** o arquivo `CONTINUIDADE-PROJETO.md` na branch `main`.
2. Leia também a atualização mais recente desse documento, disponível no commit `79619f255de1ee5e503a6814852650db47d1ae76`, que ainda não foi incorporado à `main`.
3. Confira o HEAD atual da branch `main`.
4. Consulte os arquivos relevantes para compreender o funcionamento do site e das funcionalidades envolvidas.
5. Identifique quais alterações estão publicadas e quais permanecem pendentes.
6. Confirme o estado do projeto antes de iniciar qualquer trabalho.

**Não execute alterações neste primeiro momento. Aguarde minhas instruções.**

### 3. Regras obrigatórias

- **Nunca retire, oculte, substitua ou elimine informações, indicadores, dados, menus, campos ou funcionalidades sem minha confirmação prévia.**
- Não reintroduza recursos que solicitei retirar.
- Não faça alterações adicionais por iniciativa própria, mesmo que pareçam melhorias.
- Não modifique código, faça commits, deploys, rollbacks ou gere versões sem minha autorização explícita.
- Trabalhe diretamente na branch `main`, nunca na antiga branch `teste-admin`.
- Antes de cada alteração autorizada, confira o estado atual do código e preserve um ponto de retorno.
- Após uma alteração autorizada, valide o código, confira o resultado do deploy no Cloudflare Pages e atualize o documento de continuidade.
- Não confunda commit no GitHub com deploy concluído: confirme efetivamente o resultado da publicação.
- Não altere o Worker de e-mails nem ative o envio semanal sem autorização específica.
- Preserve integralmente os cadastros, identificadores permanentes, arquivos e vínculos existentes.
- Não altere o programa Windows sem autorização específica. Ele é um projeto separado.
- Evite modificações extensas quando uma correção pontual resolver o problema.
- Responda em português, de maneira objetiva, identificando riscos e problemas reais.

**Regra fundamental: faça somente o que eu solicitar. Não aproveite uma alteração para modificar outras partes do sistema.**

### 4. Estado mais recente do projeto

#### Último deploy publicado

Na última verificação, o HEAD publicado na `main` era:

`859e9d097af35c2513c9ef3059440af66796e158`

O deploy correspondente no Cloudflare Pages foi confirmado como bem-sucedido.

Esse commit é posterior ao `973e0ba`, que implementou a segunda revisão da impressão do Relatório Administrativo.

**É obrigatório verificar novamente o HEAD antes de qualquer trabalho.**

#### Últimas alterações publicadas no Gerenciamento de Palestras

- Os textos explicativos de envio de MP3 ao Cloudflare R2 e PDF ao GitHub foram resumidos para ocupar uma linha.
- Os cabeçalhos das seções de envio permaneceram inalterados.
- O texto abaixo dos botões **Salvar na lista** e **Descartar alterações** foi resumido.
- A descrição abaixo de **Gerenciar palestras** foi reduzida.
- O campo **Nome do arquivo PPTX/PDF para processamento posterior** foi retirado da interface.
- A informação interna `apresentacaoOriginal` foi preservada, inclusive sua compatibilidade com a importação e exportação CSV.
- O rodapé técnico foi substituído pelo rodapé do site público.
- As demais funcionalidades, campos, dados e orientações foram preservados.

#### Correção preparada, mas ainda não publicada

Existe uma correção pendente para que o nome próprio **Zé** apareça sempre com Z maiúsculo, inclusive no título **A história do Zé**.

A causa foi identificada no arquivo `js/titulos.js`, responsável pela formatação dos títulos.

O cadastro original já possui a grafia correta. Portanto, não é necessário modificar `data/palestras.json`.

A correção foi preparada e testada:

- Inclusão de `["zé", "Zé"]` na lista de nomes próprios.
- Atualização da referência do script em 13 páginas HTML públicas e administrativas.
- Nenhuma alteração de layout ou dos dados das palestras.

**Commit preparado:** `79619f255de1ee5e503a6814852650db47d1ae76`

Esse commit contém também a documentação de continuidade atualizada. Ele **não foi incorporado à branch `main`** e não acionou o deploy.

**Aguarde minha autorização expressa antes de publicar essa correção.**

### 5. Acervo de palestras

Na última conferência, o sistema apresentava:

- 79 palestras cadastradas.
- 79 vídeos vinculados.
- 79 áudios MP3 vinculados.
- 19 PDFs vinculados.

Esses números são referências históricas e devem ser revalidados antes de qualquer intervenção.

O sistema permite:

- Gerenciar palestras e seus identificadores permanentes.
- Associar vídeos do YouTube.
- Enviar arquivos MP3 ao Cloudflare R2.
- Enviar PDFs ao GitHub.
- Vincular palestras aos eventos da Agenda e aos locais.
- Importar e exportar cadastros por CSV.
- Filtrar, pesquisar e ordenar o acervo.

O envio de MP3 e PDF é integrado ao botão **Salvar na lista**, com publicação automática quando há arquivos selecionados.

Não reintroduza botões separados de upload sem minha autorização.

O seletor **Material de apresentação**, introduzido anteriormente, foi revertido a meu pedido. Não deve retornar automaticamente.

### 6. Dashboard administrativo e relatórios

- Os menus **Dashboard** e **Gestão** são recolhíveis.
- **Gestão** fica acima de **Acervo**.
- Os filtros **Mensal** e **Ano inteiro** devem permanecer.
- O seletor **Outros períodos…** foi retirado a meu pedido e não deve voltar.
- O Dashboard possui indicadores de inscrições, palestras, vídeos, áudios, PDFs e monitoramento de e-mails.
- A área **Estatísticas** possui funcionalidades analíticas planejadas para evolução, incluindo análise de tendências e comparações.
- A integração com GoatCounter faz parte do acompanhamento de acessos e interações.
- O relatório administrativo teve sua impressão reformulada para **A4 retrato**, com layout mais compacto e reorganização de gráficos e indicadores.
- Ainda é necessário conferir a prévia de impressão com dados reais para verificar a quantidade de páginas e a qualidade final.
- Não altere indicadores, filtros ou cálculos sem investigar e confirmar sua finalidade.

### 7. Agenda, inscrições e e-mails

- Preserve o funcionamento da Agenda e das inscrições.
- O envio semanal de agendas permanece desativado.
- Não altere o Worker de e-mails, suas configurações, agendamentos ou automações sem autorização específica.
- Preserve o monitor de e-mails e seus indicadores.
- Não altere o banco de dados ou os critérios de confirmação sem solicitação.

### 8. Mapa e locais

A otimização estrutural do mapa foi adiada.

Não implemente mudanças no mapa por iniciativa própria. Preserve os locais cadastrados, os endereços, as bandeiras dos países e as funcionalidades existentes.

### 9. Programa Windows

O programa Windows **Paz que Ilumina v3.1** é um projeto separado do site.

Possui funcionalidades relacionadas a processamento de vídeos, conversão de áudio, MP3, PDFs e integração com os serviços utilizados pelo site.

Não gere executáveis, instaladores, pacotes ou novas versões sem minha autorização específica.

### 10. Documento de continuidade

O documento `CONTINUIDADE-PROJETO.md` é a referência principal para retomada do trabalho.

Consulte a versão publicada na `main` e a atualização complementar do commit:

`79619f255de1ee5e503a6814852650db47d1ae76`

**Link da atualização complementar:**

https://github.com/pazqueilumina/site/blob/79619f255de1ee5e503a6814852650db47d1ae76/CONTINUIDADE-PROJETO.md

Quando houver uma nova publicação autorizada, mantenha esse documento atualizado com as decisões, alterações, testes, commits e pendências.

### 11. Como devemos trabalhar

Quero um assistente que atue como colaborador técnico e conselheiro estratégico, não apenas como executor automático.

Antes de implementar, identifique riscos, inconsistências e consequências das mudanças. Não altere outras funcionalidades para resolver um problema localizado.

Quando eu pedir uma sugestão, apresente-a sem modificar o sistema.

Quando eu autorizar uma implementação, execute somente o escopo aprovado, valide cuidadosamente e informe o resultado real.

**Agora, leia os documentos e confira o estado do GitHub. Não execute nenhuma alteração. Confirme o que está publicado, o que está pendente e aguarde minha próxima solicitação.**


## 24/11/2026 — Classificação de material, compactação e rodapés (deploy autorizado)

- Autorização explícita para publicar as pendências, inclusive Zé, e as alterações abaixo. Ponto de retorno: `859e9d097af35c2513c9ef3059440af66796e158`.
- Material de apresentação e Série dividem a mesma linha; classificação independente de modalidade, valores `possui`, `nao-utiliza`, `nao-informado` (padrão para registros sem campo). O campo é opcional no backend. Nenhuma migração do catálogo.
- URL manual de PDF retirada da interface; valor interno preservado, CSV inalterado. Não utiliza apresentação oculta controles PDF sem apagar vínculos; upload bem-sucedido define possui. MP3 e fluxo automático Salvar na lista preservados.
- Retirado texto sob Nova palestra; três orientações resumidas mantendo links Agenda e Locais. Rodapés administrativos Agenda, Locais e Shorts substituídos pelo padrão público.
- A autorização atual substitui a proibição histórica de reintroduzir o seletor, somente no formato acima. Não alterar Worker, programa Windows ou outros dados. Conferência visual e teste autenticado de upload ainda necessários.


## 24/11/2026 — Compactação adicional e CSV atualizado (autorizado)
- Reduzidos espaços do título Nova palestra, orientação Agenda e blocos MP3/PDF; removidas somente as duas explicações de upload solicitadas. Espaço entre orientação de Locais e Data de referência ampliado.
- CSV integral e filtrado compartilham colunas ID,Titulo,Data,YouTube,Apresentacao,MaterialApresentacao,Serie,LinkPDF. Importação aceita colunas antigas e novas, valida classificação, série e URL; vazios preservam valores existentes. Mantidos os dois botões e aba de importação, sem autorização de remoção.
- Catálogo e uploads não modificados. Ponto de retorno: `009654f4eb58a4e1c9b17e18d352ae56057ba6eb`. Conferência visual e teste de importação autenticado pendentes.


## 24/11/2026 — Indicadores PDF, rodapés e acompanhamento de deploy
- Rodapé padrão acrescentado aos dashboards administrativo e palestrante e Inscritos, preservando controles Atualizar e informações existentes.
- Acervo: PDF ✓ disponível, ! pendente, — não utiliza, ? não informado; link existente tem precedência; descrição ao passar o mouse.
- API de palestras retorna SHA do commit e consulta autenticada do check Cloudflare Pages; painel acompanha a cada 5 segundos por até 5 minutos, atualiza dados sem recarregar a página nem perder seleção/filtros ou alterações não salvas. Falha e timeout informados sem reenviar arquivos. Fluxo de upload preservado.
- Ponto de retorno: `a938ac0847e3f7fc316733b66c6188b380aeed4b`. Catálogo preservado (79 palestras, 20 PDFs). Teste autenticado do monitor pendente.

- Correção autorizada: indicador PDF inline, sem margem própria, na mesma linha de Vídeo e MP3; cores preservadas. Causa: regra global `.evento-corpo span` aplicava display block. Nenhum outro ajuste visual ou de dados.

- Correção autorizada: retirar exclusivamente o negrito do indicador PDF, herdando o peso de Vídeo e MP3. Manter linha, cores e símbolos.

- 24/11/2026: autorizado mostrar PDF vinculado no bloco de envio, nome derivado da URL, link Visualizar e rótulo Substituir PDF; sem PDF, mensagem correspondente. Mantida ocultação quando não utiliza apresentação, sem apagar vínculos. Indicador PDF do Acervo herda exatamente a cor e tipografia dos demais indicadores; símbolos preservados. Placeholder alterado para “Selecione um Centro ou You Tube”, título intacto. Nenhuma alteração no catálogo, CSV ou upload. Conferência visual autenticada pendente.

- 24/11/2026: autorizado quinto cartão PDFs pendentes (somente possui apresentação sem PDF) e filtros PDF pendente, Não utiliza apresentação e Material não informado. Mantido Sem PDF abrangente. Os novos filtros correspondem aos símbolos !, — e ? do Acervo, com precedência do PDF existente; exportação filtrada usa a mesma função. Catálogo atual: 79 palestras, 20 PDFs, 0 pendentes, 1 não utiliza sem PDF e 58 não informadas sem PDF. Sem alterações de dados ou demais layouts. Ponto de retorno `193b3b077bb0879f27c1acd0aaf8826fd7ad84c6`. Conferência visual pendente.

- 24/11/2026: autorizado acrescentar dois cartões superiores “Não utiliza apresentação” e “Material não informado”, mantendo os cinco existentes e sete na mesma linha no desktop. Contagens seguem os filtros e símbolos do Acervo, com precedência de PDF existente. Validação no catálogo: 20 + 0 + 1 + 58 = 79. Nenhuma alteração em dados, filtros ou outras seções. Ponto de retorno `d4f09b2320fb4981982ab583826da7a66764a2bc`. Conferência visual pendente.

- 24/11/2026: autorizado quadro independente Situação do acervo de palestras abaixo de Inscrições da agenda, largura integral, sete métricas do catálogo completo (inclusive inativas, como Gerenciamento de Palestras). Resumo do acervo e demais quadros preservados. Pendências substitui alerta genérico sem PDF por material não informado e PDF pendente, somente se positivos, com links para filtros específicos; demais alertas intactos. Incluído quadro no relatório administrativo. Ponto de retorno `12257ceb68360701568fcc9ea755f62393462650`. Conferência visual e impressão autenticadas pendentes.

- 24/11/2026: autorizado botão ↓ PDF ao lado de ↓ CSV no Acervo, mesma classe visual e mesma função de seleção e valores CSV, relatório A4 paisagem com cabeçalho, filtros, pesquisa, ordenação, total e paginação CSS (dependente do navegador). Estatísticas passa a usar navegação agrupada e seletor de período no padrão administrativo, mantendo modo mensal/anual, limites e relatório. Sem alteração de dados. Sintaxe JS validada; teste visual e impressão autenticados pendentes. Retorno `a028a4d9f4c4f6ca855d1e1a67c2203885fdc68a`.

- 24/11/2026: autorizado normalizar títulos na origem data/palestras.json (70 alterados; demais propriedades e IDs preservados), usar função central na gravação manual e importação, corrigir nomes Chico/Jericó e limite Unicode de numerais (viúva). PDF e CSV sem coluna legada Apresentacao, importação antiga preservada; PDF com ID estreito, título mais largo, cabeçalho azul/dourado, linhas alternadas e botão manual de impressão, sem impressão automática. Sintaxe e invariância dos demais dados validadas. Ponto de retorno `4b665cd17500d2fbc600a14a6abe4f1457dc34bc`. Conferência visual pendente.

- 24/11/2026: autorizado relatório PDF do Acervo em A4 retrato, prévia mais estreita e redistribuição das sete colunas sem retirar informações. Título da janela define nome sugerido Paz que Ilumina - Acervo de Palestras - [filtro, quando diferente de Todas] - DD-MM-AAAA; mesma data da emissão. Impressão continua exclusivamente manual. Nome efetivo depende do navegador/driver PDF; conferência visual e salvamento no Windows pendentes. Sintaxe validada. Ponto de retorno `202618caa373b37ef392eb9787c6270271547c12`.

- 24/11/2026: autorizado padronizar cartões principais, rosca e Resumo do acervo do Dashboard Administrativo: Palestras (verde), Vídeos (Shorts) (roxo), Áudios (laranja), PDFs (dourado), E-mails (mantido). Palestras antes de Shorts; demais posições e contagens preservadas. Relatório administrativo herda os elementos. Sintaxe JS validada; conferência visual pendente. Retorno `4707442b4c66d8e828475d9f1ba81b8a36011c2b`.

- 24/11/2026: autorizado PDF em coral #E05260 nos cartões, rosca e resumo do Dashboard Administrativo; demais cores, ordem e contagens preservadas. Relatório do Acervo em retrato: coluna Série de 8% para 11%, sem quebra de palavras, compensada na coluna Título (30% para 27%); demais colunas e conteúdo intactos. Sintaxe JS validada; conferência visual pendente. Retorno `4d3b957ad5b90d1fd4f75ecdc355c86c95cf6ac7`.

- 24/11/2026: autorizado aplicar paleta do acervo aos Conteúdos recentes: Shorts roxo, áudio laranja, PDF coral e referência de apresentação verde; vídeos comuns mantêm azul, distintos de Shorts. Rótulo Slides (PDF) passa a PDF. Miniaturas, NOVO, datas, títulos, links e ordenação preservados. Sintaxe validada; conferência visual pendente. Retorno `0e60de5eb7e9f763bdb9d887d88ba1c04c63cd23`.

- 24/11/2026: autorizado exclusivamente separar automaticamente latitude e longitude ao colar o par do Google Maps em qualquer um dos dois campos de Locais. Precisão ajustada a até sete casas decimais, conforme validação existente; colagem individual preservada. Sem alteração de layout, dados ou outras funções. Sintaxe e casos de parsing validados; teste visual autenticado pendente. Retorno `1a58b6fe7acc2822b50efdec901135886ff1666e`.

- 24/11/2026: autorizadas duas correções em Locais: título de pendências compacto, contagem separada dos erros e zero em verde; distância manual com vírgula exclusivamente na interface, exemplo 12,4, conversão para ponto no armazenamento e exibição de valores antigos com vírgula. Preservados motivos por local e validação de 0,1 a 2000 km. Sintaxe e normalização testadas; validação visual autenticada pendente. Ponto de retorno `11c788866872973c85000584eb2357229e06cb02`.

- 24/11/2026: autorizado considerar coordenadas manuais salvas como confirmação do endereço pelo responsável, sem checkbox. Preservada origem OSM quando aplicável; mudanças de assinatura invalidam histórico e a nova gravação manual confirma o novo ponto. Cadastro existente do Consolador recebeu exclusivamente os dois marcadores de confirmação, sem alterar coordenadas ou endereço. Pendências exibidas sem caixa amarela, com separador discreto e motivos preservados. Ponto de retorno `66fbd0a8a948c939685564f25738aa4e228521d4`. Testes de sintaxe e regra de confirmação aprovados; validação visual pendente.

- 24/11/2026: autorizado reler cadastro via GET sem cache após PUT bem-sucedido, recalcular indicadores e preservar seleção; distinguir falha de releitura de falha de publicação. Normalizar confirmações manuais no envio. Aliança do Divino Pastor recebeu marcadores de confirmação (coordenadas e endereço preservados), pois fora publicada em aba antiga. Placeholders do formulário Locais em cinza mais claro e peso normal, sem alterar texto preenchido. Ponto de retorno `da447d8a76fb7f59cc0e0bdbd3367a65b3ff01e5`. Sintaxe validada; teste autenticado pendente.

- 24/11/2026: autorizado padrão global de placeholders de inputs e textareas, cinza #8995a0, peso normal, via css/placeholders.css nas 19 páginas públicas e administrativas, inclusive campos dinâmicos. Valores preenchidos preservados. Ponto de retorno `69c96bb5db8cbb9a634866de1ba5661ed4d9277d`. Validação visual pendente.
