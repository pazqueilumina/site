# Continuidade do projeto — Paz que Ilumina

> **Atualizado em:** 22/11/2026  
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

Próxima versão **planejada, ainda não lançada**: dois modos de PPTX→PDF, seleção múltipla, arrastar e soltar, fila, progresso, remoção de itens, tratamento de erros sem interromper lote, não sobrescrever PDFs e retirar avisos informativos. O programa é separado do site; **não há fonte do executável neste repositório auditado**. Não gerar versão/instalador sem autorização.

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
| `24a2fcf2` | Bandeiras por imagem no Dashboard administrativo, com SVG local para BR/US |
| `246e75ae` | Cache de mapa, mosaicos reaproveitados e preparação de coordenadas verificadas |
| `ad7a7892` | Ampliação do mapa em tela cheia |
| `7b32b760` | Leaflet local e correção do carregamento dos mosaicos |

**Manutenção deste registro:** atualizar a data, os dados auditados e o histórico quando houver mudança relevante e autorizada. Em caso de conflito entre este texto e os arquivos atuais, **inspecionar o código e esclarecer a divergência antes de agir**.
