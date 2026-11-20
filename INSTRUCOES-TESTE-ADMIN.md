# Prévia segura do painel administrativo

1. Crie a branch `teste-admin` no repositório `pazqueilumina/site` a partir da versão atual da `main`.
2. Envie o CONTEÚDO de `site-main/` para a RAIZ dessa branch. Não envie a pasta externa como subpasta.
3. Configure o Cloudflare Pages para gerar preview deployments da branch `teste-admin`. Confira que `CF_PAGES_BRANCH` está disponível e vale `teste-admin` na prévia. Se a variável estiver ausente, a API falha de modo fechado.
4. A API de agenda e palestras da prévia lê e grava SOMENTE a branch `teste-admin`. Ela não grava na `main`.
5. **Antes de testar:** confirme que Cloudflare Access cobre a URL da prévia e `/api/admin/*`, com as mesmas restrições do domínio principal. A validação JWT no código é adicional, não substitui a política de acesso.
6. Configure na prévia `GITHUB_TOKEN`, `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD` e `CF_ADMIN_EMAILS`, com escopo mínimo necessário. Não inclua tokens no repositório.
7. Faça um teste de edição de palestra na prévia e confira no GitHub que só `teste-admin` foi alterada. Depois faça um teste da agenda, também apenas na branch de testes.
8. Observe que o site público da prévia pode consumir dados locais estáticos enquanto o painel consulta dados atualizados na branch; valide o resultado após o deploy da prévia.
9. Não faça merge para `main` até concluir os testes. **Ao levar para produção, revise o arquivo `server_lib/branch.js` e o ambiente de deploy**, especialmente se houver domínio personalizado diferente ou mudança do nome da branch principal.

Esta versão NÃO foi testada contra credenciais reais, GitHub ou Cloudflare. Os controles são verificações de código; a política de acesso e o deploy precisam de validação real.
