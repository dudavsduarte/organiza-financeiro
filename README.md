# Organiza — aplicativo financeiro com acesso Hotmart

Aplicativo web responsivo e instalável (PWA), criado em React + TypeScript. Ele funciona imediatamente em modo demonstração e já contém a estrutura para liberar ou bloquear usuários de acordo com compras realizadas na Hotmart.

## Funcionalidades incluídas

- Cadastro e login individual
- Bloqueio para usuários sem compra aprovada
- Painel com saldo, receitas, despesas e taxa de economia
- Gráfico de fluxo financeiro
- Cadastro, edição, exclusão, busca e filtro de transações
- Exportação das transações em CSV
- Orçamentos por categoria com alertas de limite
- Metas financeiras com acompanhamento de progresso
- Receitas e despesas recorrentes
- Relatórios por mês e categoria
- Impressão/salvamento dos relatórios em PDF
- Layout responsivo para computador e celular
- PWA instalável na tela inicial
- Modo demonstração com dados locais
- Banco Supabase com Row Level Security
- Webhook da Hotmart para ativação e bloqueio automático

## 1. Rodar no VS Code

Abra a pasta do projeto no VS Code e rode no terminal:

```bash
npm install
npm run dev
```

Abra o endereço mostrado pelo Vite, normalmente:

```text
http://localhost:5173
```

No modo demonstração, use qualquer e-mail e uma senha de pelo menos 6 caracteres. Os dados serão armazenados no navegador.

## 2. Configurar as variáveis

Copie `.env.example` para `.env`:

```bash
cp .env.example .env
```

Preencha:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
VITE_HOTMART_CHECKOUT_URL=https://pay.hotmart.com/SEU_LINK
VITE_DEMO_MODE=false
```

Enquanto `VITE_DEMO_MODE=true`, o app não exige Supabase e libera uma conta Premium de demonstração.

## 3. Criar o banco no Supabase

1. Crie um projeto gratuito no Supabase.
2. Abra o SQL Editor.
3. Copie todo o conteúdo de `supabase/schema.sql`.
4. Execute o script.
5. Em Authentication, habilite login por e-mail e senha.
6. Em URL Configuration, adicione as URLs local e publicada do aplicativo.

O banco possui políticas para cada usuário acessar somente os próprios dados.

## 4. Publicar a função do webhook

Com a CLI do Supabase instalada e o projeto vinculado:

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase functions deploy hotmart-webhook --no-verify-jwt
```

Cadastre os segredos da função:

```bash
npx supabase secrets set HOTMART_HOTTOK="TOKEN_HOTTOK_FORNECIDO_PELA_HOTMART"
npx supabase secrets set HOTMART_PRODUCT_ID="ID_DO_SEU_PRODUTO"
```

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` normalmente são disponibilizados automaticamente para a Edge Function do próprio projeto. Nunca coloque a service role no arquivo `.env` do navegador.

A URL do webhook será semelhante a:

```text
https://SEU_PROJECT_REF.supabase.co/functions/v1/hotmart-webhook
```

## 5. Configurar a Hotmart

Na configuração de Webhook/Postback do produto:

1. Crie uma configuração para o produto do aplicativo.
2. Informe a URL da Edge Function.
3. Copie o Hottok da sua conta Hotmart e use esse valor no segredo `HOTMART_HOTTOK`. A função valida o cabeçalho `X-HOTMART-HOTTOK`.
4. Selecione eventos de compra aprovada, compra completa, reembolso, chargeback, cancelamento e assinatura atrasada/cancelada.

Comportamento implementado:

- compra aprovada ou renovada: `access_status = active`
- reembolso, chargeback, expiração, atraso ou cancelamento: `access_status = blocked`
- evento desconhecido: `access_status = pending`

O comprador deve criar a conta usando exatamente o mesmo e-mail da compra. Se a compra acontecer antes do cadastro, o acesso fica guardado em `access_grants` e será aplicado quando a conta for criada.

## 6. Publicar gratuitamente

### Vercel

```bash
npm run build
npx vercel
```

No painel do projeto publicado, adicione as mesmas variáveis do arquivo `.env`.

### Alternativa: Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- Adicione as variáveis de ambiente do `.env`

Como o app usa rotas do navegador, configure fallback de SPA para `index.html` na plataforma escolhida, caso necessário.

## 7. Testar a liberação antes de vender

Você pode cadastrar manualmente um e-mail no Supabase:

```sql
insert into public.access_grants (email, access_status, plan)
values ('cliente@exemplo.com', 'active', 'premium')
on conflict (email) do update set access_status = 'active';
```

Depois, crie uma conta no aplicativo usando esse mesmo e-mail.

Para bloquear:

```sql
update public.access_grants set access_status = 'blocked' where email = 'cliente@exemplo.com';
update public.profiles set access_status = 'blocked' where email = 'cliente@exemplo.com';
```

## 8. Checklist antes do lançamento

- Trocar o nome e o logotipo, caso necessário
- Inserir o link real do checkout
- Desativar o modo demonstração
- Testar cadastro com e-mail sem compra
- Testar compra aprovada usando o modo de teste da Hotmart
- Testar reembolso e cancelamento
- Publicar páginas de termos, privacidade e suporte
- Informar claramente que o usuário deve utilizar o mesmo e-mail da compra
- Configurar backups e políticas de retenção de dados

## Estrutura principal

```text
src/
  components/       Componentes reutilizáveis
  context/          Login e dados financeiros
  pages/            Telas do aplicativo
  lib/              Supabase, formatação e armazenamento local
supabase/
  schema.sql        Banco, segurança e gatilhos
  functions/
    hotmart-webhook/ Automação de acesso pela Hotmart
public/              Manifesto, ícone e service worker
```

## Observação importante

Este projeto fornece a estrutura técnica de venda e acesso. Antes de receber clientes reais, revise termos de uso, política de privacidade, tratamento de dados pessoais e regras fiscais aplicáveis ao seu negócio.

## Referências oficiais da integração

A configuração segue o Webhook 2.0 da Hotmart, incluindo validação do cabeçalho `X-HOTMART-HOTTOK`, e usa uma Supabase Edge Function em TypeScript/Deno para receber as notificações. Consulte sempre a documentação oficial antes do lançamento, pois nomes e menus das plataformas podem mudar.
