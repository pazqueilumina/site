# Continuidade do projeto — Paz que Ilumina

> **Atualizado em:** 22/11/2026 — revisão de encerramento para continuidade em novo chat  
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

### P4 — Automações futuras, ainda em planejamento

Foram discutidos lembretes de Agenda (24h e 1h antes) e leitura semanal de trechos de PDFs, com processamento sequencial, revisão e acompanhamento de progresso. Não confundir o planejamento com funcionalidade publicada. Existe documentação de planejamento anterior fora deste repositório; recuperar antes de detalhar ou implementar. Não incluir dados pessoais de destinatários neste arquivo público.

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

**Situação na última conversa sobre e-mails (22/11/2026):**
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
4. E-mail: planejamento de **lembretes 24h e 1h** com Resend + Cloudflare Workers; **domínio relatado como verificado**, mas chave de API, segredo, agendamento, testes e envio não confirmados. **Ainda não tratar como recurso operacional.**

**Prioridades e cuidados:**
- O usuário está cadastrando um backlog grande de eventos e PDFs; preservar IDs, dados e vínculos existentes.
- Não retomar migração de Agenda/Palestras nem refatoração de coordenadas por iniciativa própria.
- Não criar versão do programa Windows v3.1 sem pedido explícito.
- Não implementar e-mails/inscritos/leitura semanal só porque aparecem como próximos passos neste documento.
- Para qualquer nova solicitação, **ler o arquivo real na `main`**, identificar o HEAD, inspecionar código e dados relevantes, pedir autorização quando ainda não houver e relatar separadamente commit, testes e deploy Cloudflare.
- **Última ação solicitada neste chat:** atualizar este arquivo para permitir começar outro chat. **Nenhuma outra mudança de código ou funcionalidade foi solicitada nesta ação.**

**Mensagem curta sugerida para o novo chat:**

> Vamos continuar o site Paz que Ilumina. Leia o `CONTINUIDADE-PROJETO.md` na `main` do GitHub `pazqueilumina/site`, especialmente as seções 1, 3, 8.5, 8.8 e 9. Confirme o HEAD atual antes de agir. Não faça mudanças nem deploy sem minha autorização explícita. Vou passar a próxima tarefa.
