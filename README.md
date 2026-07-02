# Astro Fretes

Site de transporte rodoviário e rastreamento logístico para a **Astro Fretes**,
implementado em **React + Vite + TypeScript + Tailwind CSS** (roteamento com
React Router) a partir dos designs exportados do Claude Design (ver
`docs/DESIGN_HANDOFF.md` e `chats/`).

## Telas

| Rota         | Descrição                                                                 |
| ------------ | ------------------------------------------------------------------------- |
| `/`          | Home institucional — hero, números, serviços, a empresa, cobertura/CTA.   |
| `/rastrear`  | Busca de rastreio + "como funciona". Com `?codigo=…` exibe o resultado.   |
| `/login`     | Login do painel do cliente (credenciais demo: `berlim` / `123456`).       |
| `/painel`    | Dashboard: abas, tabela de rastreamentos e **importação de CSV**.         |

Todas as telas são **responsivas** (mobile-first → desktop), unificando os
frames mobile e desktop dos designs originais.

## Arquitetura

- **Frontend:** React + Vite (SPA), em `src/`.
- **Backend:** funções serverless em `api/` (Vercel) + camada de serviço em
  `server/` (Drizzle ORM).
- **Banco:** Postgres. Em produção usa a `POSTGRES_URL` (Vercel Postgres / Neon /
  Supabase). Em desenvolvimento, **sem configurar nada**, usa um Postgres local
  embutido (PGlite, gravado em `.data/`). O schema é criado sozinho na primeira
  execução e alguns pedidos de demonstração são semeados.

Endpoints:

| Método | Rota | Descrição |
| ------ | ---- | --------- |
| GET  | `/api/track?q=` | Rastreio público por código, nº do pedido ou CPF. |
| POST | `/api/login` | Login do admin → token. |
| GET  | `/api/admin/orders` | Lista de pedidos + histórico (token). |
| POST | `/api/admin/import` | Importa um CSV (token). |
| POST | `/api/admin/reset` | Restaura os dados de exemplo (token). |

## Dados & importação CSV

Na aba **Upload Planilha** do painel você importa o **CSV exportado da LPQV**
(plataforma Lumilar). As colunas são reconhecidas automaticamente:

- `Cód` (vira o código de rastreio quando não há `Código de rastreio`),
  `Cliente`, `Documento`/CPF, `Email`, `Tel`, `Endereço`, `Número`,
  `Complemento`, `Bairro`, `Cidade`, `UF`, `CEP`, `Status envio`,
  `Produto descrição`, `Produto foto`, `Qtde`, `Tipo de frete`,
  `Total do pedido`, `Meio de pagamento`.
- O `Status envio` é mapeado para uma das 8 etapas canônicas (Pedido recebido →
  Em separação → Coletado → Em trânsito → Chegou no estado destino → Em rota →
  Saiu para entrega → Entregue); a timeline é derivada dele.
- O parser também aceita um modelo simples (baixável na aba de upload) e
  delimitador `,` ou `;`.
- "Importar (adicionar)" faz upsert por código; "Substituir tudo" troca a base.
- Cliente rastreia por **código do pedido** ou **CPF**; a página mostra produto,
  foto, endereço de entrega e a timeline.

## Rodando

```bash
npm install
npm run dev      # sobe API (PGlite) + Vite juntos → http://localhost:5173
npm run build    # type-check + build de produção (dist/)
npm run preview  # serve o build de produção
```

`npm run dev` roda dois processos: a API (`server/dev.ts` via tsx, porta 3001) e
o Vite (5173, com proxy de `/api`). Não precisa de banco — o PGlite é criado em
`.data/` automaticamente.

## Deploy na Vercel (com banco de dados)

A Vercel detecta o preset **Vite** e roda as funções de `api/` como serverless.
Como agora há banco, o deploy precisa ser **via GitHub** (não use o drag-and-drop,
que é estático e não roda funções).

1. **Suba o código no GitHub** e, na Vercel, **Add New → Project → Import**.
2. **Crie o banco:** no projeto, aba **Storage → Create Database → Postgres**.
   A Vercel injeta a variável `POSTGRES_URL` automaticamente (não precisa colar
   nada). O schema é criado sozinho no primeiro acesso.
3. **Defina as variáveis de ambiente** (Settings → Environment Variables):
   - `ADMIN_PASSWORD` — senha do painel de importação (troque a padrão `123456`).
   - `ADMIN_USER` — opcional (padrão `berlim`).
4. **Deploy.** Faça login em `/login`, importe o CSV em **Upload Planilha**, e os
   clientes já rastreiam por código ou CPF em `/rastrear`.

Sem `POSTGRES_URL`, a API cai no PGlite local — útil em dev, mas **não persiste
na Vercel** (filesystem efêmero); por isso o passo 2 é obrigatório em produção.

Também funciona com qualquer Postgres (Neon, Supabase): basta definir
`POSTGRES_URL` com a connection string. Veja `.env.example`.

**Pela CLI:**

```bash
npm i -g vercel
vercel          # preview
vercel --prod   # produção
```

## Estrutura

```
index.html         Entrada Vite (carrega as fontes Sora + Plus Jakarta Sans)
src/main.tsx       Bootstrap: Router
src/App.tsx        Rotas: /, /rastrear, /login, /painel
src/pages/         HomePage, RastrearPage, LoginPage, PainelPage
src/components/     UI compartilhada (header, footer, timeline, busca, dashboard/)
src/lib/           api (fetch), admin-store, auth, data (timeline), tipos
api/               Funções serverless: track, login, admin/{orders,import,reset}
server/            Camada de serviço: db (Drizzle), schema, parser LPQV, auth
scripts/dev.mjs    Sobe API + Vite juntos no npm run dev
```

A paleta da marca e as fontes (Sora + Plus Jakarta Sans) ficam em
`tailwind.config.ts`, `src/index.css` e `index.html`.
