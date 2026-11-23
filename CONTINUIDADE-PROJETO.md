# Continuidade do projeto — Paz que Ilumina

> **Atualizado em:** 22/11/2026 — continuidade atualizada após testes reais dos lembretes por e-mail  
> **Último HEAD de código auditado antes desta atualização documental:** `1c66122381924bac1b1b3005586dccf5f52fa531`  
> **Repositório:** https://github.com/pazqueilumina/site  
> **Branch de trabalho autorizada:** `main`  
> **Site:** https://pazqueilumina.com.br  
> **Referência técnica auditada antes deste documento:** commit `24a2fcf2b74236e50abba027215ad3fe63755537`.  
> **Natureza deste arquivo:** registro de contexto e decisões para retomada em outro chat; não é autorização para alterar código, dados, versões ou publicar.

## 1. Regras obrigatórias combinadas com o responsável

1. **Não criar, editar, compilar, publicar, fazer commit, deploy nem rollback sem autorização explícita.** Uma pergunta, discussão ou pedido de sugestão não autoriza implementação. Uma ordem como “pode fazer o deploy” autoriza a implementação e publicação da alteração em discussão.
2. **Trabalhar diretamente na `main`**, sem criar ou utilizar a antiga branch `teste-admin`. Não reabrir a discussão sobre testes nessa branch por iniciativa própria.
3. **Antes de cada deploy**, identificar o commit atual da `main` como ponto de retorno. Fazer alteração delimitada, validar, criar commit identificado e confirmar o novo HEAD. **Rollback também exige autorização.**
4. **Não confundir GitHub com Cloudflare:** commit confirmado na `main` não prova, por si só, que o deploy automático foi concluído ou que a produção está funcionando. Informar o que foi efetivamente verificado.
5. Preservar dados existentes, IDs, cadastros e comportamentos aprovados. Não reestruturar Agenda/Palestras/Locais por conta própria.
6. Respostas objetivas, em português, com análise de causas e riscos. Investigar a origem de falhas repetidas em vez de fazer correções cosméticas.
7. **Programa Windows:** não gerar executável, versão, pacote ou instalador sem autorização específica.

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

> Estamos continuando o projeto **Paz que Ilumina** no repositório `pazqueilumina/site`. Leia primeiro `CONTINUIDADE-PROJETO.md` na branch `main`, confira o HEAD atual e os arquivos relevantes. Respeite as regras de não modificar, gerar versão, publicar ou fazer rollback sem minha autorização explícita; não use a branch `teste-admin`. A otimização estrutural do mapa está adiada. Vou informar a próxima tarefa.

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
